import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../context/api";
import { useAuth } from "../context/UserAuthContext";

export const usePayhere = (setMessage) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [paymentConfig, setPaymentConfig] = useState({
    listingFee: "500.00",
    merchantId: "1236024", // Fallback sandbox ID
    sandbox: true,
  });

  // Fetch dynamic payment configuration
  useEffect(() => {
    api
      .get('/payment/config')
      .then((res) => {
        if (res.data) {
          setPaymentConfig({
            listingFee: res.data.listing_fee || "500.00",
            merchantId: res.data.merchant_id || "1236024",
            sandbox: res.data.sandbox !== false,
          });
        }
      })
      .catch((err) => console.error("Failed to fetch payment config:", err));
  }, []);

  // Trigger PayHere after property is successfully saved as Draft
  const triggerPayment = async (propertyId) => {

    try {
      const explicitNotifyUrl = import.meta.env.VITE_PAYHERE_NOTIFY_URL;
      let notifyUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/payment/notify`;
      if (explicitNotifyUrl !== undefined) {
        const parsedNotifyUrl = new URL(explicitNotifyUrl);
        if (!/^https:\/\/[^/\\\s]/i.test(explicitNotifyUrl) || parsedNotifyUrl.protocol !== 'https:' || parsedNotifyUrl.username ||
            parsedNotifyUrl.password || explicitNotifyUrl.includes('#')) {
          throw new Error('Invalid public PayHere callback URL');
        }
        notifyUrl = explicitNotifyUrl;
      }

      const response = await api.post('/payment/generate-hash', {
        property_id: propertyId,
      });

      const checkout = response.data;
      if (!checkout.order_id || !checkout.amount || !checkout.hash || !checkout.merchant_id ||
          checkout.currency !== 'LKR' || typeof checkout.sandbox !== 'boolean') {
        throw new Error('Incomplete locked checkout response');
      }

      const payment = {
        sandbox: checkout.sandbox,
        merchant_id: checkout.merchant_id,
        return_url: `${window.location.origin}/seller-dashboard`,
        cancel_url: `${window.location.origin}/seller-dashboard`,
        notify_url: notifyUrl,
        order_id: checkout.order_id,
        items: "Thirasara Property Listing Fee",
        amount: checkout.amount,
        currency: checkout.currency,
        hash: checkout.hash,
        first_name: user?.name?.split(" ")[0] || "Seller",
        last_name: user?.name?.split(" ")[1] || "Name",
        email: user?.email || "seller@gmail.com",
        phone: "0700000000",
        address: "N/A",
        city: "N/A",
        country: "Sri Lanka",
      };

      window.payhere.onCompleted = async function onCompleted() {
        try {
          await api.post('/payment/confirm-client-success', {
            property_id: propertyId,
            order_id: checkout.order_id,
          });
        } catch (confirmErr) {
          console.warn("Client confirmation note:", confirmErr);
        }
        let confirmed = false;
        let listingStatus;
        try {
          const { data } = await api.get(`/properties/${propertyId}`);
          confirmed = data.property?.payment_status === 'Paid';
          listingStatus = data.property?.status;
        } catch (statusError) {
          console.warn('Payment status check unavailable:', statusError);
        }
        setMessage({
          type: confirmed ? "success" : "info",
          text: confirmed
            ? `Payment confirmed! Listing status: ${listingStatus || 'pending'}.`
            : 'Checkout completed; awaiting server confirmation. Check the listing payment status in your dashboard before retrying.',
        });
        setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 2500);
      };

      window.payhere.onDismissed = function onDismissed() {
        setMessage({
          type: "success",
          text: "Listing saved as a private Draft in your dashboard. You can complete payment anytime to submit for Admin review.",
        });
        setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 3000);
      };

      window.payhere.onError = function onError(error) {
        setMessage({ type: "error", text: `Payment Error: ${error}. Listing is safely saved in your Drafts.` });
        setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 3000);
      };

      window.payhere.startPayment(payment);

    } catch (error) {
      console.error("Payment Initialization Error:", error);
      setMessage({
        type: "error",
        text: "Listing saved to Drafts! Please try completing payment from your dashboard.",
      });
      setTimeout(() => navigate(user?.role === "SELLER" ? "/seller-dashboard" : "/agent-dashboard"), 3000);
    }
  };

  return { paymentConfig, triggerPayment };
};
