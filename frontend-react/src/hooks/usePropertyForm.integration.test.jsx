import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import usePropertyForm from './usePropertyForm';

const api = vi.hoisted(() => ({ post: vi.fn() }));
const payment = vi.hoisted(() => ({ triggerPayment: vi.fn(), paymentConfig: { status: 'ready', listingFee: '500.00', sandbox: true }, checkoutBusy: false, checkoutQuote: null, retryPaymentConfig: vi.fn() }));
vi.mock('../context/api', () => ({ default: api }));
vi.mock('./usePayhere', () => ({ usePayhere: () => payment }));

const image = () => new File(['synthetic image'], 'fixture.jpg', { type: 'image/jpeg' });
const submitEvent = () => ({ preventDefault: vi.fn() });

beforeEach(() => {
  vi.resetAllMocks();
  api.post.mockResolvedValue({ data: { property: { id: 'saved-fixture-id' } } });
  payment.triggerPayment.mockResolvedValue(undefined);
  payment.paymentConfig.status = 'ready'; payment.checkoutBusy = false; payment.checkoutQuote = null;
});
afterEach(() => vi.restoreAllMocks());

async function submit(result) {
  await act(async () => result.current.handleSubmit(submitEvent()));
}

describe('Actual listing form submission with HTTP and payment boundaries', () => {
  test('unavailable configuration prevents draft creation', async () => {
    payment.paymentConfig.status = 'error'; const { result } = renderHook(() => usePropertyForm());
    act(() => { result.current.setImages([image()]); result.current.setFormData(p => ({...p, contactNumber: '0771234567'})); }); await submit(result);
    expect(api.post).not.toHaveBeenCalled(); expect(payment.triggerPayment).not.toHaveBeenCalled();
  });
  test('captured submit cannot create a listing after unmount', async () => {
    const view = renderHook(() => usePropertyForm()); act(() => view.result.current.setImages([image()]));
    const captured = view.result.current.handleSubmit; view.unmount(); await act(async () => captured(submitEvent())); expect(api.post).not.toHaveBeenCalled();
  });
  test('synchronous duplicate submission creates one draft and releases saving state', async () => {
    let finish; api.post.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const { result } = renderHook(() => usePropertyForm()); act(() => { result.current.setImages([image()]); result.current.setFormData(p => ({...p, contactNumber: '0771234567'})); });
    let first, second; act(() => { first = result.current.handleSubmit(submitEvent()); second = result.current.handleSubmit(submitEvent()); });
    expect(api.post).toHaveBeenCalledTimes(1); await act(async () => { finish({ data: { property: { id: 'saved-fixture-id' } } }); await Promise.all([first, second]); });
    expect(result.current.loading).toBe(false); expect(payment.triggerPayment).toHaveBeenCalledExactlyOnceWith('saved-fixture-id', '500.00');
  });
  test('missing image produces feedback without saving or attempting payment', async () => {
    const { result } = renderHook(() => usePropertyForm());
    await submit(result);
    expect(result.current.message).toEqual({ type: 'error', text: 'Please upload at least 1 image.' });
    expect(result.current.loading).toBe(false);
    expect(api.post).not.toHaveBeenCalled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test.each([
    [[[6, 79], [6, 80]], 'Please select at least 3 points to draw a boundary.'],
    [[[6, 79], [6, 80], [6, 79]], 'A valid boundary must have at least 3 distinct points (a triangle).'],
  ])('an incomplete boundary is rejected before any save', async (points, message) => {
    const { result } = renderHook(() => usePropertyForm());
    act(() => {
      result.current.setImages([image()]);
      result.current.setFormData(p => ({...p, contactNumber: '0771234567'}));
      result.current.setLocationMode('boundary');
      result.current.setBoundaryCoordinates(points);
    });
    await submit(result);
    expect(result.current.message).toEqual({ type: 'error', text: message });
    expect(result.current.loading).toBe(false);
    expect(api.post).not.toHaveBeenCalled();
    expect(payment.triggerPayment).not.toHaveBeenCalled();
  });

  test('multipart payload preserves numeric zeros, exact field names, files and point WKT', async () => {
    const { result } = renderHook(() => usePropertyForm());
    const photo = image();
    const tour = new File(['synthetic tour'], 'tour.jpg', { type: 'image/jpeg' });
    const tourMetadata = [{ title: 'Entrance', fileIndex: 0 }];
    act(() => {
      result.current.setFormData(previous => ({
        ...previous, listingType: 'Rent', address: 'Fixture address', type: 'Land',
        title: 'Synthetic listing', description: 'Test-only property description',
        price: 0, pricePeriod: 'Month', district: 'Colombo', city: 'Colombo',
        contactNumber: '0000000000', bedrooms: 0, bathrooms: 0, landSize: 0, houseSize: '',
        latitude: 0, longitude: 0,
      }));
      result.current.setImages([photo]);
      result.current.setVirtualTourFiles([tour]);
      result.current.setVirtualTourMetadata(tourMetadata);
    });
    await submit(result);
    expect(api.post).toHaveBeenCalledTimes(1);
    const [path, body, options] = api.post.mock.calls[0];
    expect(path).toBe('/properties');
    expect(body).toBeInstanceOf(FormData);
    expect(options).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
    expect(Object.fromEntries([...body.entries()].filter(([, value]) => typeof value === 'string'))).toEqual({
      listingType: 'Rent', address: 'Fixture address', type: 'Land', title: 'Synthetic listing',
      description: 'Test-only property description', price: '0', pricePeriod: 'Month',
      district: 'Colombo', city: 'Colombo', contactNumber: '0000000000', bedrooms: '0',
      bathrooms: '0', landSize: '0', houseSize: '', latitude: '0', longitude: '0',
      boundary: 'POLYGON((-0.0001 -0.0001, 0.0001 -0.0001, 0.0001 0.0001, -0.0001 0.0001, -0.0001 -0.0001))',
      virtualTourMetadata: JSON.stringify(tourMetadata),
    });
    expect(body.getAll('images')).toEqual([photo]);
    expect(body.getAll('virtualTours')).toEqual([tour]);
    expect(payment.triggerPayment).toHaveBeenCalledExactlyOnceWith('saved-fixture-id', '500.00');
    expect(result.current.message.text).toBe('Property saved! Initiating payment gateway...');
  });

  test.each([
    [[6, 79], [6, 80], [7, 80]],
    [[6, 79], [6, 80], [7, 80], [6, 79]],
  ])('boundary mode closes the polygon once and maps lat/lng to PostGIS lng/lat', async (...points) => {
    const { result } = renderHook(() => usePropertyForm());
    act(() => {
      result.current.setImages([image()]);
      result.current.setFormData(p => ({...p, contactNumber: '0771234567'}));
      result.current.setLocationMode('boundary');
      result.current.setBoundaryCoordinates(points);
    });
    await submit(result);
    const body = api.post.mock.calls[0][1];
    expect(body.get('boundary')).toBe('POLYGON((79 6, 80 6, 80 7, 79 6))');
    expect(body.get('latitude')).toBe('6');
    expect(body.get('longitude')).toBe('79');
    expect(body.has('virtualTourMetadata')).toBe(false);
    expect(payment.triggerPayment).toHaveBeenCalledExactlyOnceWith('saved-fixture-id', '500.00');
  });

  test('create failure surfaces server feedback and never reaches payment', async () => {
    const error = { response: { data: { message: 'Fixture validation rejected', private_marker: 'private-form-marker' } }, config: { headers: { Authorization: 'Bearer private-form-marker' } } };
    api.post.mockRejectedValueOnce(error);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => usePropertyForm());
    act(() => { result.current.setImages([image()]); result.current.setFormData(p => ({...p, contactNumber: '0771234567'})); });
    await submit(result);
    expect(result.current.message).toEqual({ type: 'error', text: 'Failed: Fixture validation rejected' });
    expect(result.current.loading).toBe(false);
    expect(payment.triggerPayment).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('property_create_failed');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-form-marker');
  });

  test('retry after a payment-boundary failure reuses the saved draft without duplicate creation', async () => {
    payment.triggerPayment.mockRejectedValueOnce(new Error('Controlled payment failure'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => usePropertyForm());
    act(() => { result.current.setImages([image()]); result.current.setFormData(p => ({...p, contactNumber: '0771234567'})); });
    await submit(result);
    expect(result.current.message.type).toBe('error');
    expect(result.current.loading).toBe(false);
    await submit(result);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(payment.triggerPayment.mock.calls).toEqual([['saved-fixture-id', '500.00'], ['saved-fixture-id', '500.00']]);
    expect(result.current.message.text).toBe('Resuming payment for existing draft...');
  });
});

 test.each(['', '123', '+940771234567'])('rejects invalid contact at submit: %s', async contactNumber => {
 const { result } = renderHook(() => usePropertyForm());
 act(() => { result.current.setImages([image()]); result.current.setFormData(p => ({...p, contactNumber})); });
 await submit(result); expect(api.post).not.toHaveBeenCalled(); expect(result.current.message.text).toMatch(/contact number/i);
 });
 test.each([{bedrooms: '-1'}, {bathrooms: '1.5'}, {landSize: 'Infinity'}, {houseSize: '0'}])('rejects invalid specification at submit: %o', async values => {
 const { result } = renderHook(() => usePropertyForm());
 act(() => { result.current.setImages([image()]); result.current.setFormData(p => ({...p, contactNumber: '0771234567', ...values})); });
 await submit(result); expect(api.post).not.toHaveBeenCalled(); expect(result.current.message.type).toBe('error');
 });
