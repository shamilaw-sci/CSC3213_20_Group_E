import { loadProviderScript } from '../components/privacy/providerScripts';
import { logClientError, logClientWarning } from '../utils/clientLog';
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../context/api";
import { useAuth } from "../context/UserAuthContext";
import { canonicalPaymentAmount, parsePaymentConfig, parseLockedCheckout, paymentRequest, paymentUuid } from '../utils/paymentUiBoundary';

// The SDK owns global callback slots, so popup initiation is shared across hooks.
let activeSdkAttempt = null;
let latestAttemptToken = null;
let sdkLoading = null;
const unavailableConfig = status => ({ status, listingFee: null, merchantId: null, sandbox: null, currency: null });
function neutralizeCallbacks(attempt) {
  for (const [name, callback] of Object.entries(attempt.callbacks)) {
    if (attempt.sdk[name] === callback) attempt.sdk[name] = () => {};
  }
}
function disposeAttempt(attempt) {
  if (!attempt) return;
  attempt.disposed = true; attempt.controller.abort(); clearTimeout(attempt.timer);
  neutralizeCallbacks(attempt);
  if (activeSdkAttempt === attempt) activeSdkAttempt = null;
}

export const usePayhere = (setMessage) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentConfig, setPaymentConfig] = useState(() => unavailableConfig('loading'));
  const [checkoutQuote, setCheckoutQuote] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const mounted = useRef(false), attemptRef = useRef(null), busyRef = useRef(false), configGeneration = useRef(0);
  const identity = useRef(null);
  const configRef = useRef(unavailableConfig('loading'));

  useEffect(() => {
    identity.current = {};
    mounted.current = true; busyRef.current = false; setCheckoutBusy(false); setCheckoutQuote(null);
    return () => { mounted.current = false; disposeAttempt(attemptRef.current); attemptRef.current = null; busyRef.current = false; };
  }, [user?.id, user?.role]);

  useEffect(() => {
    const controller = new AbortController(), generation = ++configGeneration.current;
    let cancelled = false;
    paymentRequest(options => api.get('/payment/config', options), 10000, controller.signal)
      .then(response => {
        if (cancelled || generation !== configGeneration.current) return;
        configRef.current = parsePaymentConfig(response.data); setPaymentConfig(configRef.current);
      }).catch(() => {
        if (cancelled || generation !== configGeneration.current) return;
        logClientError('payment_config_load_failed'); configRef.current = unavailableConfig('error'); setPaymentConfig(configRef.current);
      });
    return () => { cancelled = true; controller.abort(); };
  }, [reload]);

  const retryPaymentConfig = () => {
    if (!mounted.current || busyRef.current) return;
    configGeneration.current += 1; configRef.current = unavailableConfig('loading'); setPaymentConfig(configRef.current); setReload(value => value + 1);
  };
  const current = attempt => mounted.current && attemptRef.current === attempt && !attempt.disposed && latestAttemptToken === attempt.token;
  const release = attempt => {
    neutralizeCallbacks(attempt);
    if (activeSdkAttempt === attempt) activeSdkAttempt = null;
    if (current(attempt)) { busyRef.current = false; setCheckoutBusy(false); }
  };
  const finish = (attempt, message, delay = 3000) => {
    if (!current(attempt)) return;
    attempt.phase = 'terminal'; release(attempt); setMessage(message);
    clearTimeout(attempt.timer);
    attempt.timer = setTimeout(() => { if (current(attempt)) navigate(attempt.destination); }, delay);
  };

  const triggerPayment = async (propertyId, expectedAmount) => {
    if (!mounted.current) return { status: 'unavailable' };
    if (activeSdkAttempt || sdkLoading || busyRef.current) {
      setMessage({ type: 'info', text: 'A checkout is already active. Complete or close it before retrying.' }); return { status: 'busy' };
    }
    const config = configRef.current;
    if (config.status !== 'ready') {
      setMessage({ type: 'error', text: 'Payment configuration is unavailable. Retry loading it before paying.' }); return { status: 'unavailable' };
    }
    let attempt;
    const initiatingIdentity = identity.current;
    const loadingToken = {};
    sdkLoading = loadingToken;
    busyRef.current = true;
    setCheckoutBusy(true);
    try {
      await loadProviderScript('payhere', 'https://www.payhere.lk/lib/payhere.js', () => typeof window.payhere?.startPayment === 'function');
      if (!mounted.current || identity.current !== initiatingIdentity) return { status: 'cancelled' };
      if (sdkLoading === loadingToken) sdkLoading = null;

      if (!paymentUuid(propertyId) || canonicalPaymentAmount(expectedAmount) !== expectedAmount || typeof window.payhere?.startPayment !== 'function') throw new Error('Checkout unavailable.');
      let notifyUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/notify`;
      const explicitNotifyUrl = import.meta.env.VITE_PAYHERE_NOTIFY_URL;
      if (explicitNotifyUrl !== undefined) {
        const parsed = new URL(explicitNotifyUrl);
        if (!/^https:\/\/[^/\\\s]/i.test(explicitNotifyUrl) || parsed.protocol !== 'https:' || parsed.username || parsed.password || explicitNotifyUrl.includes('#')) throw new Error('Invalid callback URL.');
        notifyUrl = explicitNotifyUrl;
      }
      disposeAttempt(attemptRef.current);
      attempt = { token: {}, controller: new AbortController(), sdk: window.payhere, callbacks: {}, phase: 'requesting', terminal: false,
        disposed: false, timer: null, destination: user?.role === 'SELLER' ? '/seller-dashboard' : '/agent-dashboard' };
      latestAttemptToken = attempt.token; activeSdkAttempt = attempt; attemptRef.current = attempt;
      busyRef.current = true; setCheckoutBusy(true);
      const response = await paymentRequest(options => api.post('/payment/generate-hash', { property_id: propertyId }, options), 15000, attempt.controller.signal);
      if (!current(attempt)) return { status: 'cancelled' };
      if (configRef.current.status !== 'ready' || configRef.current.merchantId !== config.merchantId || configRef.current.sandbox !== config.sandbox) throw new Error('Configuration changed.');
      const checkout = parseLockedCheckout(response.data, propertyId, config);
      if (checkout.amount !== expectedAmount) {
        setCheckoutQuote({ propertyId, amount: checkout.amount, sandbox: checkout.sandbox });
        setMessage({ type: 'info', text: `The listing fee is LKR ${checkout.amount}. Review the updated amount and select Pay again to continue.` });
        release(attempt); disposeAttempt(attempt); attemptRef.current = null; return { status: 'price_changed' };
      }
      const terminal = () => {
        if (!current(attempt) || attempt.terminal || activeSdkAttempt !== attempt) return false;
        attempt.terminal = true; return true;
      };
      attempt.callbacks.onCompleted = async orderId => {
        if (!current(attempt) || attempt.terminal) return;
        if (!paymentUuid(orderId) || orderId.toLowerCase() !== checkout.order_id.toLowerCase()) { logClientWarning('payment_callback_mismatch'); return; }
        if (!terminal()) return;
        try {
          await paymentRequest(options => api.post('/payment/confirm-client-success', { property_id: propertyId, order_id: checkout.order_id }, options), 5000, attempt.controller.signal);
        } catch { if (current(attempt)) logClientWarning('payment_client_note_failed'); }
        if (!current(attempt)) return;
        let confirmed = false, listingStatus = 'pending';
        try {
          const { data } = await paymentRequest(options => api.get(`/properties/${propertyId}`, options), 10000, attempt.controller.signal);
          if (!current(attempt)) return;
          confirmed = paymentUuid(data?.property?.id) && data.property.id.toLowerCase() === propertyId.toLowerCase() && data.property.payment_status === 'Paid';
          if (['approved', 'pending', 'rejected', 'draft'].includes(data?.property?.status)) listingStatus = data.property.status;
        } catch { if (current(attempt)) logClientWarning('payment_status_check_failed'); }
        finish(attempt, { type: confirmed ? 'success' : 'info', text: confirmed
          ? `Payment confirmed! Listing status: ${listingStatus}.`
          : 'Checkout completed; awaiting server confirmation. Check the listing payment status in your dashboard before retrying.' }, 2500);
      };
      attempt.callbacks.onDismissed = () => {
        if (terminal()) finish(attempt, { type: 'info', text: 'Checkout closed. Check your listing status in the dashboard before completing payment later.' });
      };
      attempt.callbacks.onError = () => {
        if (terminal()) finish(attempt, { type: 'error', text: 'Payment could not be completed. Check the listing payment status before retrying.' });
      };
      for (const [name, callback] of Object.entries(attempt.callbacks)) attempt.sdk[name] = callback;
      attempt.phase = 'active';
      attempt.sdk.startPayment({ sandbox: checkout.sandbox, merchant_id: checkout.merchant_id,
        return_url: `${window.location.origin}${attempt.destination}`, cancel_url: `${window.location.origin}${attempt.destination}`,
        notify_url: notifyUrl, order_id: checkout.order_id, items: 'Thirasara Property Listing Fee', amount: checkout.amount,
        currency: checkout.currency, hash: checkout.hash, first_name: user?.name?.split(' ')[0] || 'Seller',
        last_name: user?.name?.split(' ')[1] || 'Name', email: user?.email || 'seller@gmail.com', phone: '0700000000', address: 'N/A', city: 'N/A', country: 'Sri Lanka' });
      return { status: 'started' };
    } catch {
      if (attempt && !current(attempt)) return { status: 'cancelled' };
      logClientError('payment_initialization_failed');
      if (attempt) { release(attempt); disposeAttempt(attempt); attemptRef.current = null; }
      if (mounted.current && identity.current === initiatingIdentity) setMessage({ type: 'error', text: 'Checkout could not be started. Check your listing status and refresh payment configuration before retrying.' });
      return { status: 'unavailable' };
    } finally {
      if (sdkLoading === loadingToken) sdkLoading = null;
      if (!attempt && mounted.current && identity.current === initiatingIdentity) { busyRef.current = false; setCheckoutBusy(false); }
    }
  };
  return { paymentConfig, triggerPayment, retryPaymentConfig, checkoutQuote, checkoutBusy };
};
