import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LazyMotion, domAnimation } from 'framer-motion';
import { afterEach, test, expect, vi } from 'vitest';
import SecuritySettings from './SecuritySettings';
afterEach(cleanup);
function show(user) { render(<MemoryRouter><LazyMotion features={domAnimation}><SecuritySettings user={user} formData={{ name: 'Agent', email: 'g@example.test', phone: '', password: '' }} handleChange={vi.fn()} handleSubmit={vi.fn()} /></LazyMotion></MemoryRouter>); }
test('pending applicant sees waiting explanation without Hub action', () => {
  show({ role: 'PENDING_AGENT' });
  expect(screen.getByText(/application is awaiting admin review/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Open Agent Hub/ })).not.toBeInTheDocument();
});
test('rejected applicant sees stored reason and cannot open approved Hub', () => {
  show({ role: 'REJECTED_AGENT', agent_application: { rejection_reason: 'Incomplete documents' } });
  expect(screen.getByText('Incomplete documents')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Open Agent Hub/ })).not.toBeInTheDocument();
});
test('approved agent retains Hub action', () => { show({ role: 'AGENT' }); expect(screen.getByRole('button', { name: /Open Agent Hub/ })).toBeInTheDocument(); });
