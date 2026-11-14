import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import BookViewingModal from './BookViewingModal';
import api from '../../../context/api';
import toast from 'react-hot-toast';

vi.mock('../../../context/api', () => ({ default: { post: vi.fn() } }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../../../context/UserAuthContext', () => ({ useAuth: () => ({ user: { name: 'Tester', email: 'test@example.com' } }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

const setupSubmission = () => {
  const props = { agent: { id: 'a1', name: 'Agent' }, listings: [{ id: 'p1', title: 'Property' }], onClose: vi.fn(), onSuccess: vi.fn() };
  const view = render(<BookViewingModal {...props} />);
  fireEvent.change(view.container.querySelector('input[type="tel"]'), { target: { value: '0000000000' } });
  return { ...view, props, form: view.container.querySelector('form') };
};

test('prevents repeated form submissions while the first request is pending', async () => {
  let finish;
  api.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const view = setupSubmission();
  act(() => { fireEvent.submit(view.form); fireEvent.submit(view.form); });
  expect(api.post).toHaveBeenCalledTimes(1);
  await act(async () => finish({ data: {} }));
  expect(view.props.onSuccess).toHaveBeenCalledTimes(1);
});

test('keeps entered fields and displays the duplicate message without success or closing', async () => {
  const message = 'You already have an appointment for this property and time slot.';
  api.post.mockRejectedValue({ response: { status: 409, data: { message } } });
  const view = setupSubmission();
  fireEvent.change(view.container.querySelector('textarea'), { target: { value: 'Keep my question' } });
  fireEvent.submit(view.form);
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
  expect(view.container.querySelector('textarea').value).toBe('Keep my question');
  expect(view.props.onClose).not.toHaveBeenCalled();
  expect(view.props.onSuccess).not.toHaveBeenCalled();
  expect(toast.success).not.toHaveBeenCalled();
  expect(view.getByRole('button', { name: /Confirm & Book Appointment/i })).not.toBeDisabled();
});

test('initializes tomorrow once and preserves the chosen date through a rerender', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-31T12:00:00Z'));
  const props = { agent: { id: 'a1', name: 'Agent' }, listings: [], onClose: vi.fn() };
  const view = render(<BookViewingModal {...props} />);
  const date = view.container.querySelector('input[type="date"]');
  expect(date.value).toBe('2026-11-01');
  fireEvent.change(date, { target: { value: '2026-11-10' } });
  vi.setSystemTime(new Date('2026-11-02T12:00:00Z'));
  view.rerender(<BookViewingModal {...props} listings={[{ id: 'p1', title: 'New listing' }]} />);
  expect(date.value).toBe('2026-11-10');
});
