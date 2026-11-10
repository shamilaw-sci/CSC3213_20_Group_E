import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ReviewPublishStep from './ReviewPublishStep';
afterEach(cleanup);
const props = () => ({ formData: {}, images: [], virtualTourFiles: [], virtualTourMetadata: [], previewUrls: [],
  paymentConfig: { status: 'ready', listingFee: '750.00', sandbox: true }, paymentAmount: '750.00', loading: false,
  goToStep: vi.fn(), handleSubmit: vi.fn(), retryPaymentConfig: vi.fn(), formatLKRPreview: () => '', locationMode: 'point', boundaryCoordinates: [] });
test('loading and error states show no invented fee and cannot submit', () => {
  const values = props(); values.paymentConfig = { status: 'loading', listingFee: null }; values.paymentAmount = null;
  const view = render(<ReviewPublishStep {...values} />); expect(screen.getByRole('button', { name: 'Loading payment configuration...' }).disabled).toBe(true);
  expect(screen.queryByText(/Rs\. 500/)).toBeNull(); values.paymentConfig.status = 'error'; view.rerender(<ReviewPublishStep {...values} />);
  expect(screen.getByRole('button', { name: 'Payment unavailable' }).disabled).toBe(true); fireEvent.click(screen.getByRole('button', { name: 'Retry payment configuration' })); expect(values.retryPaymentConfig).toHaveBeenCalledTimes(1);
});
test('review displays the property-specific quoted amount and actual mode', () => {
  const values = props(); values.paymentAmount = '900.00'; render(<ReviewPublishStep {...values} />);
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to Payment (Rs. 900) →' })); expect(values.handleSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Test checkout')).toBeTruthy(); expect(screen.queryByText(/Central Bank/)).toBeNull();
});
