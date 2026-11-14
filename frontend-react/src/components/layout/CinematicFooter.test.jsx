import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import api from '../../context/api';
import CinematicFooter from './CinematicFooter';
vi.mock('../../context/api', () => ({ default: { post: vi.fn() } }));
vi.mock('framer-motion', () => ({ m: { div: ({ children, className }) => <div className={className}>{children}</div> } }));
beforeEach(() => vi.resetAllMocks());
const fill = () => {
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Visitor' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please send more details.' } });
    fireEvent.click(screen.getByRole('button', { name: /Send inquiry/ }));
};
test('submits to the inquiry endpoint and acknowledges persisted success', async () => {
    api.post.mockResolvedValue({ data: { message: 'Your inquiry has been sent to our team.' } });
    render(<CinematicFooter />);
    fill();
    expect(await screen.findByRole('status')).toHaveTextContent('sent to our team');
    expect(api.post).toHaveBeenCalledWith('/inquiries', { firstName: 'Test', lastName: 'Visitor', email: 'test@example.com', message: 'Please send more details.' });
});
test('retains the message on failure and does not claim it was sent', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Inquiries are temporarily unavailable.' } } });
    render(<CinematicFooter />);
    fill();
    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
    expect(screen.getByLabelText('Message')).toHaveValue('Please send more details.');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
