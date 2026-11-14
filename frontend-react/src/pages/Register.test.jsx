import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, expect, test, vi } from 'vitest';
import Register from './Register';

vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ login: vi.fn() }) }));
vi.mock('@lottiefiles/react-lottie-player', () => ({ Player: () => null }));
afterEach(cleanup);

test('role selection updates agent fields and hides them when switching back', async () => {
  render(<MemoryRouter><LazyMotion features={domAnimation}><Register /></LazyMotion></MemoryRouter>);
  expect(screen.queryByText('Agent Details')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: "I'm an Agent" })); });
  expect(screen.getByText('Agent Details')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Buy Property' })); });
  expect(screen.queryByText('Agent Details')).toBeNull();
});
