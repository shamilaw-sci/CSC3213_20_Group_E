import React from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import CookieConsent from './CookieConsent';
import { readConsent } from './consentStore';
beforeEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
test('reject optional dismisses banner and allows reopening preferences', () => {
  render(<CookieConsent />);
  fireEvent.click(screen.getByRole('button', { name: 'Reject optional' }));
  expect(readConsent()).toMatchObject({ social: false, media: false });
  expect(screen.queryByRole('region', { name: 'Cookie preferences' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getAllByRole('checkbox').every(input => !input.checked)).toBe(true);
});
test('accept optional enables both categories', () => {
  render(<CookieConsent />);
  fireEvent.click(screen.getByRole('button', { name: 'Accept optional' }));
  expect(readConsent()).toMatchObject({ social: true, media: true });
});
test('settings save only the chosen category', () => {
  render(<CookieConsent />);
  fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Social sign-in/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
  expect(readConsent()).toMatchObject({ social: true, media: false });
});
