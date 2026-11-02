import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';

const auth = vi.hoisted(() => ({ user: { id: 'u1', name: 'Tester', role: 'SELLER' }, login: vi.fn() }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => auth }));
vi.mock('../context/ThemeProvider', () => ({ useTheme: () => ({ theme: 'light', changeTheme: vi.fn() }) }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/profile/PreferencesSettings', () => ({ default: () => null }));
vi.mock('../components/profile/AgentProfileSettings', () => ({ default: () => null }));
vi.mock('../components/profile/SecuritySettings', () => ({ default: () => null }));
vi.mock('framer-motion', () => ({
    AnimatePresence: ({ children }) => children,
    m: { div: ({ children, initial: _initial, animate: _animate, exit: _exit, layoutId: _layoutId, ...props }) => <div {...props}>{children}</div> },
}));

beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockResolvedValue({ data: {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function mount() {
    await act(async () => {
        render(<MemoryRouter initialEntries={['/profile?tab=calculator']}><ProfileSettings /></MemoryRouter>);
    });
}
function controls() {
    const [price, downpayment, interest] = screen.getAllByRole('slider');
    return { price, downpayment, interest, numericPrice: screen.getByRole('spinbutton') };
}
function change(element, value) { fireEvent.change(element, { target: { value: String(value) } }); }
function money(value) { return `Rs. ${value.toLocaleString()}`; }
function metric(label) { return screen.getByText(label).nextElementSibling.textContent; }
function monthly() { return screen.getByText('Monthly Loan Payment (EMI)').nextElementSibling.textContent; }
function expectNoMutation() {
    for (const method of ['post', 'put', 'patch', 'delete']) expect(api[method]).not.toHaveBeenCalled();
}

test('default calculator retains independently checked rounded outputs and original explanatory text', async () => {
    await mount();
    expect(controls().numericPrice.value).toBe('35000000');
    expect(controls().downpayment.value).toBe('20');
    expect(controls().interest.value).toBe('11.5');
    expect(screen.getByText('Loan Duration (20 Years)')).toBeTruthy();
    expect(screen.getByText('240 Months')).toBeTruthy();
    expect(monthly()).toBe(money(298600));
    expect(metric('Principal Loan Amount')).toBe(money(28000000));
    expect(metric('Initial Downpayment (20%)')).toBe(money(7000000));
    expect(metric('Total Interest Payable')).toBe(money(43664071));
    expect(metric('Govt. Stamp Duty Estimate (3-4%)')).toBe(money(1399000));
    expect(metric('Total Overall Outflow')).toBe(money(80063071));
    expect(screen.getByText('Estimated for 20 years @ 11.5% p.a.')).toBeTruthy();
    expect(screen.getByText('Commercial bank rates in Sri Lanka (HNB, Commercial Bank, Sampath) vary between 10.5% and 13.5%. Consult with an approved Thirasara Agent to connect with banking partners.')).toBeTruthy();
    expectNoMutation();
});

test('original native ranges/steps and unconstrained numeric price attributes stay unchanged', async () => {
    await mount();
    const { price, downpayment, interest, numericPrice } = controls();
    expect([price.min, price.max, price.step]).toEqual(['5000000', '200000000', '1000000']);
    expect([downpayment.min, downpayment.max, downpayment.step]).toEqual(['10', '50', '5']);
    expect([interest.min, interest.max, interest.step]).toEqual(['8.0', '18.0', '0.25']);
    expect(['min', 'max', 'step'].map(name => numericPrice.getAttribute(name))).toEqual([null, null, null]);
});

test('all slider controls update parent numeric state and representative fixed results', async () => {
    await mount();
    const { price, downpayment, interest, numericPrice } = controls();
    change(price, 40000000);
    expect(numericPrice.value).toBe('40000000');
    change(downpayment, 30);
    change(interest, 8.25);
    fireEvent.click(screen.getByRole('button', { name: '15 Yrs' }));
    expect(screen.getByText('180 Months')).toBeTruthy();
    expect(screen.getByText('8.25% p.a.')).toBeTruthy();
    expect(monthly()).toBe(money(271639));
    expect(metric('Principal Loan Amount')).toBe(money(28000000));
    expect(metric('Initial Downpayment (30%)')).toBe(money(12000000));
    expect(metric('Total Interest Payable')).toBe(money(20895074));
    expect(metric('Govt. Stamp Duty Estimate (3-4%)')).toBe(money(1599000));
    expect(metric('Total Overall Outflow')).toBe(money(62494074));
    expectNoMutation();
});

test.each([10, 15, 20, 25])('tenure %s keeps native button type and exact selected classes', async years => {
    await mount();
    fireEvent.click(screen.getByRole('button', { name: `${years} Yrs` }));
    expect(screen.getByText(`Loan Duration (${years} Years)`)).toBeTruthy();
    expect(screen.getByText(`${years * 12} Months`)).toBeTruthy();
    for (const value of [10, 15, 20, 25]) {
        const button = screen.getByRole('button', { name: `${value} Yrs` });
        expect(button.getAttribute('type')).toBe('button');
        expect(button.className).toBe(`py-2 rounded-xl text-xs font-bold transition ${value === years ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`);
    }
    expectNoMutation();
});

test.each([
    ['', 0, 0, 0], [-100, 0, -3, -23], [50000, 40000, 1500, 113877],
    [100000, 80000, 3000, 227754], [100100, 80080, 3004, null],
])('numeric price %s retains native empty/negative/low-price behavior', async (value, principal, stamp, outflow) => {
    await mount();
    change(controls().numericPrice, value);
    expect(Number(controls().numericPrice.value)).toBe(value === '' ? 0 : value);
    expect(metric('Principal Loan Amount')).toBe(money(principal));
    expect(metric('Govt. Stamp Duty Estimate (3-4%)')).toBe(money(stamp));
    if (outflow !== null) expect(metric('Total Overall Outflow')).toBe(money(outflow));
    expectNoMutation();
});

test('calculator values and results survive tab changes without repeating reads or mutations', async () => {
    await mount();
    const { numericPrice, downpayment, interest } = controls();
    change(numericPrice, 40000000);
    change(downpayment, 30);
    change(interest, 8.25);
    fireEvent.click(screen.getByRole('button', { name: '15 Yrs' }));
    const reads = api.get.mock.calls.map(([url]) => url);
    fireEvent.click(screen.getByRole('button', { name: 'Theme & Preferences' }));
    expect(screen.queryByText('Mortgage Parameters')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Home Loan & EMI Planner' }));
    expect(controls().numericPrice.value).toBe('40000000');
    expect(controls().downpayment.value).toBe('30');
    expect(controls().interest.value).toBe('8.25');
    expect(screen.getByText('Loan Duration (15 Years)')).toBeTruthy();
    expect(monthly()).toBe(money(271639));
    expect(api.get.mock.calls.map(([url]) => url)).toEqual(reads);
    expectNoMutation();
});
