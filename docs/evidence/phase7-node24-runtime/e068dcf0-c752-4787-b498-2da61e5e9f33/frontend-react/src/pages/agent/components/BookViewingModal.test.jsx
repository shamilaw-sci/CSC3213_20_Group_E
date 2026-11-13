import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import BookViewingModal from './BookViewingModal';

vi.mock('../../../context/UserAuthContext', () => ({ useAuth: () => ({ user: { name: 'Tester', email: 'test@example.com' } }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); });

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
