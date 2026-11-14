import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SettingsPage from './SettingsPage';
import { fetchSettings, updateSettings } from '../api/adminApi';
const theme = vi.hoisted(() => ({ theme: 'light', changeTheme: vi.fn() }));
vi.mock('../api/adminApi', () => ({ fetchSettings: vi.fn(), updateSettings: vi.fn() }));
vi.mock('../../../context/ThemeProvider', () => ({ useTheme: () => theme }));
beforeEach(() => { vi.resetAllMocks(); fetchSettings.mockResolvedValue({ settings: { listing_fee: '750.50' } }); updateSettings.mockResolvedValue({ settings: { listing_fee: '800.25' }, message: 'Listing fee saved.' }); });
afterEach(cleanup);
const saveButton = () => screen.getByRole('button', { name: 'Save listing fee' });
async function loaded() { const view = render(<SettingsPage />); const input = await screen.findByLabelText('Listing fee (LKR)'); await waitFor(() => expect(input.value).toBe('750.50')); return { ...view, input }; }
test('loads actual fee and exposes no fake controls or audit promise', async () => {
    await loaded(); expect(saveButton().disabled).toBe(true);
    expect(screen.queryByText('PayHere Production (Live)')).toBeNull(); expect(screen.queryByText('Admin JWT Session Timeout (Minutes)')).toBeNull();
    expect(screen.queryByPlaceholderText(/Add new category/)).toBeNull(); expect(screen.queryByText(/committed to audit trail/)).toBeNull();
});
test('pending load cannot save a default fee', async () => {
    fetchSettings.mockReturnValue(new Promise(() => {})); render(<SettingsPage />); expect(saveButton().disabled).toBe(true); expect(screen.getByLabelText('Listing fee (LKR)').value).toBe('');
});
test('load failure allows retry and keeps save disabled', async () => {
    fetchSettings.mockRejectedValueOnce(new Error('private-api')); render(<SettingsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry loading settings' })); await waitFor(() => expect(screen.getByLabelText('Listing fee (LKR)').value).toBe('750.50'));
    expect(updateSettings).not.toHaveBeenCalled(); expect(screen.queryByText(/private-api/)).toBeNull();
});
test.each(['', '0', '-1', '1.234', '1e2', '10000000000'])('invalid draft %s never saves', async value => {
    const { input } = await loaded(); fireEvent.change(input, { target: { value } }); fireEvent.click(saveButton()); expect(updateSettings).not.toHaveBeenCalled();
});
test('saves only canonical fee and waits for confirmation', async () => {
    let finish; updateSettings.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })); const { input } = await loaded();
    fireEvent.change(input, { target: { value: '800.25' } }); fireEvent.click(saveButton());
    expect(updateSettings).toHaveBeenCalledWith({ listing_fee: '800.25' }); expect(input.disabled).toBe(true); expect(saveButton().disabled).toBe(true);
    expect(screen.queryByText('Listing fee saved.')).toBeNull(); await act(async () => finish({ settings: { listing_fee: '800.25' } }));
    expect(await screen.findByText('Listing fee saved.')).toBeTruthy(); expect(input.value).toBe('800.25'); expect(saveButton().disabled).toBe(true);
});
test.each([new Error('private-api'), { settings: { listing_fee: '999.00' } }, {}])('failed/unconfirmed save preserves draft and shows no success', async result => {
    if (result instanceof Error) updateSettings.mockRejectedValueOnce(result); else updateSettings.mockResolvedValueOnce(result);
    const { input } = await loaded(); fireEvent.change(input, { target: { value: '800.25' } }); fireEvent.click(saveButton());
    expect(await screen.findByText('Listing fee could not be confirmed. Refresh before retrying.')).toBeTruthy(); expect(input.value).toBe('800.25');
    expect(screen.queryByText('Listing fee saved.')).toBeNull(); expect(screen.queryByText(/private-api/)).toBeNull();
});
test('theme remains independent of fee save', async () => {
    await loaded(); fireEvent.click(screen.getByRole('button', { name: /Dark Mode/ })); expect(theme.changeTheme).toHaveBeenCalledWith('dark'); expect(updateSettings).not.toHaveBeenCalled(); expect(saveButton().disabled).toBe(true);
});
test('late save completion after unmount has no follow-up requests', async () => {
    let finish; updateSettings.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })); const { input, unmount } = await loaded();
    fireEvent.change(input, { target: { value: '800.25' } }); fireEvent.click(saveButton()); unmount(); await act(async () => finish({ settings: { listing_fee: '800.25' } }));
    expect(updateSettings).toHaveBeenCalledTimes(1); expect(fetchSettings).toHaveBeenCalledTimes(1);
});
test.each([{}, { settings: { listing_fee: 'bad' } }, { settings: { listing_fee: 500 } }])('malformed load %p offers retry without a guessed fee', async result => {
    fetchSettings.mockResolvedValueOnce(result); render(<SettingsPage />);
    expect(await screen.findByRole('button', { name: 'Retry loading settings' })).toBeTruthy();
    expect(saveButton().disabled).toBe(true); expect(screen.getByLabelText('Listing fee (LKR)').value).toBe('');
});
