import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Studio from './AgentCustomizationStudioModal';
import api from '../../../context/api';

vi.mock('../../../context/api', () => ({ default: { put: vi.fn().mockResolvedValue({ data: {} }) } }));
vi.mock('../../../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => null }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const profile = { agency_name: 'Test Agency', cover_image_url: 'https://example.test/cover.jpg', cover_position_x: 25, cover_position_y: 75, total_sales: 0, total_rentals: 0 };
const mount = (props = {}) => render(<Studio agent={{ name: 'Agent G1' }} profile={profile} onClose={vi.fn()} {...props} />);

test('previews saved cover focal point and sends changed integer positions', async () => {
  const view = mount();
  expect(screen.getByAltText('Cover Banner Preview')).toHaveStyle({ objectPosition: '25% 75%' });
  fireEvent.change(screen.getByLabelText(/Horizontal cover position/), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText(/Vertical cover position/), { target: { value: '90' } });
  expect(screen.getByAltText('Cover Banner Preview')).toHaveStyle({ objectPosition: '10% 90%' });
  fireEvent.submit(view.container.querySelector('form'));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith('/agents/profile', expect.objectContaining({ cover_position_x: 10, cover_position_y: 90 })));
});

test('reset and replacement preset center cover without saving until submitted', () => {
  mount();
  fireEvent.click(screen.getByRole('button', { name: 'Reset cover position' }));
  expect(screen.getByAltText('Cover Banner Preview')).toHaveStyle({ objectPosition: '50% 50%' });
  fireEvent.change(screen.getByLabelText(/Horizontal cover position/), { target: { value: '5' } });
  fireEvent.click(screen.getByRole('button', { name: /Modern Villa/ }));
  expect(screen.getByAltText('Cover Banner Preview')).toHaveStyle({ objectPosition: '50% 50%' });
  expect(api.put).not.toHaveBeenCalled();
});

test('cancel discards focal changes when studio is reopened', () => {
  const onClose = vi.fn();
  const view = mount({ onClose });
  fireEvent.change(screen.getByLabelText(/Vertical cover position/), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel & Close' }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(api.put).not.toHaveBeenCalled();
  view.unmount();
  mount();
  expect(screen.getByAltText('Cover Banner Preview')).toHaveStyle({ objectPosition: '25% 75%' });
});
