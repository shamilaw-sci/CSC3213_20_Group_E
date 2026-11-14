import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import AgentProfile from './AgentProfile';
import api from '../context/api';

vi.mock('../context/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

test('public profile renders saved cover focal point and all saved languages', async () => {
  api.get.mockResolvedValue({ data: { agent: { id: 'g1', name: 'Agent G1', agent_profiles: [{ cover_image_url: 'https://example.test/cover.jpg', cover_position_x: 0, cover_position_y: 100, languages: 'Sinhala,English,Tamil', total_sales: 0, total_rentals: 0 }] } } });
  render(<MemoryRouter initialEntries={['/agent/g1']}><Routes><Route path="/agent/:id" element={<AgentProfile />} /></Routes></MemoryRouter>);
  expect(await screen.findByAltText('Agent Cover Banner')).toHaveStyle({ objectPosition: '0% 100%' });
  expect(screen.getByText('Sinhala')).toBeInTheDocument();
  expect(screen.getByText('English')).toBeInTheDocument();
  expect(screen.getByText('Tamil')).toBeInTheDocument();
});
