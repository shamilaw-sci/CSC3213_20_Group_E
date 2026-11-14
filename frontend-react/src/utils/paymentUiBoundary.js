const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const paymentUuid = value => typeof value === 'string' && uuid.test(value);
const merchant = value => typeof value === 'string' && value.length > 0 && value.length <= 64
  && !/\s/u.test(value) && !Array.from(value).some(character => character.codePointAt(0) < 32 || character.codePointAt(0) === 127);
export function canonicalPaymentAmount(value) {
  if (typeof value !== 'string' || value.length > 13) throw new Error('Invalid payment amount.');
  const match = value.match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
  if (!match) throw new Error('Invalid payment amount.');
  const cents = BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
  if (cents <= 0n || cents > 999999999999n) throw new Error('Invalid payment amount.');
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}
export function parsePaymentConfig(data) {
  if (!data || Array.isArray(data) || !merchant(data.merchant_id) || data.currency !== 'LKR' || typeof data.sandbox !== 'boolean') throw new Error('Invalid payment configuration.');
  return { status: 'ready', listingFee: canonicalPaymentAmount(data.listing_fee), merchantId: data.merchant_id, sandbox: data.sandbox, currency: 'LKR' };
}
export function parseLockedCheckout(data, propertyId, config) {
  if (!data || Array.isArray(data) || !paymentUuid(propertyId) || !paymentUuid(data.property_id)
    || data.property_id.toLowerCase() !== propertyId.toLowerCase() || !paymentUuid(data.order_id)
    || typeof data.hash !== 'string' || !/^[a-f0-9]{32}$/i.test(data.hash)
    || data.currency !== 'LKR' || !merchant(data.merchant_id) || data.merchant_id !== config.merchantId
    || typeof data.sandbox !== 'boolean' || data.sandbox !== config.sandbox
    || canonicalPaymentAmount(data.amount) !== data.amount) throw new Error('Unconfirmed checkout.');
  return { property_id: data.property_id, order_id: data.order_id, amount: data.amount,
    merchant_id: data.merchant_id, sandbox: data.sandbox, currency: data.currency, hash: data.hash };
}
export async function paymentRequest(operation, timeoutMs, parentSignal) {
  const controller = new AbortController();
  let timeout, cancel;
  const cancelled = new Promise((_, reject) => {
    cancel = () => { controller.abort(); reject(new Error('Payment request unavailable.')); };
    timeout = setTimeout(cancel, timeoutMs);
    if (parentSignal?.aborted) cancel(); else parentSignal?.addEventListener('abort', cancel, { once: true });
  });
  try {
    return await Promise.race([cancelled, Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new Error('Payment request unavailable.');
      return operation({ signal: controller.signal, timeout: timeoutMs });
    })]);
  } finally {
    clearTimeout(timeout); parentSignal?.removeEventListener('abort', cancel);
  }
}
