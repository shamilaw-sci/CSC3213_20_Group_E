import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import BuyerDashboard from './BuyerDashboard';
const mocks = vi.hoisted(() => ({ get: vi.fn(), user: { id: 'buyer', name: 'Buyer', role: 'BUYER' } }));
vi.mock('../context/api', () => ({ default: { get: mocks.get } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
const Location = () => { const location = useLocation(); return <output aria-label="Route">{location.search}</output>; };
const show = (tab) => render(<MemoryRouter initialEntries={[`/buyer?tab=${tab}`]}><BuyerDashboard /><Location /></MemoryRouter>);
const tab = (name) => fireEvent.click(screen.getByRole('button', { name }));
const valueFor = (label) => screen.getByText(label).parentElement.lastElementChild.textContent;
const money = (value) => `Rs. ${value.toLocaleString()}`;
beforeEach(() => { mocks.get.mockReset(); mocks.get.mockResolvedValue({ data: {} }); });
afterEach(cleanup);

test('calculator defaults and payment breakdown retain current rounded mortgage outputs', async () => {
    show('calculator');
    await screen.findByText('Sri Lanka Home Loan & Affordability Planner');
    expect(screen.getByRole('spinbutton')).toHaveValue(35000000);
    expect(screen.getAllByRole('slider').map(input => input.value)).toEqual(['35000000', '20', '11.5']);
    expect(valueFor('Principal Loan Amount')).toBe(money(28000000));
    expect(valueFor('Initial Downpayment (20%)')).toBe(money(7000000));
    expect(valueFor('Govt. Stamp Duty Estimate (3-4%)')).toBe(money(1399000));
    const rate = 0.115 / 12;
    const monthly = 28000000 * rate * (1 + rate) ** 240 / ((1 + rate) ** 240 - 1);
    expect(screen.getByText(money(Math.round(monthly)))).toBeInTheDocument();
    expect(valueFor('Total Interest Payable')).toBe(money(Math.round(monthly * 240 - 28000000)));
    expect(valueFor('Total Overall Outflow')).toBe(money(Math.round(monthly * 240) + 7000000 + 1399000));
});

test('native price/range/tenure updates and tab remount retain parent calculator state', async () => {
    show('calculator'); await screen.findByText('Mortgage Parameters');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50000000' } });
    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '40000000' } });
    fireEvent.change(sliders[1], { target: { value: '30' } });
    fireEvent.change(sliders[2], { target: { value: '12' } });
    tab('10 Yrs');
    expect(valueFor('Principal Loan Amount')).toBe(money(28000000));
    expect(screen.getByText('120 Months')).toBeInTheDocument();
    tab('Due-Diligence Checklist'); tab('Home Loan & EMI Planner');
    expect(screen.getByRole('spinbutton')).toHaveValue(40000000);
    expect(screen.getAllByRole('slider').map(input => input.value)).toEqual(['40000000', '30', '12']);
    expect(screen.getByText('Estimated for 10 years @ 12% p.a.')).toBeInTheDocument();
    expect(screen.getByLabelText('Route')).toHaveTextContent('?tab=calculator');
    expect(mocks.get).toHaveBeenCalledTimes(4); // Tab switches do not repeat initial reads.
});

test('blank native number input keeps Number empty coercion and zero payment/stamp outputs', async () => {
    show('calculator'); await screen.findByText('Mortgage Parameters');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
    for (const label of ['Principal Loan Amount', 'Total Interest Payable', 'Govt. Stamp Duty Estimate (3-4%)', 'Total Overall Outflow']) expect(valueFor(label)).toBe(money(0));
});

test('checklist preserves six ordered legal descriptions, initial checked cards and independent toggles across tabs', async () => {
    show('dueDiligence'); await screen.findByText('Sri Lanka Property Due-Diligence Checklist');
    const headings = screen.getAllByRole('heading', { level: 4 });
    expect(headings.map(h => h.textContent.trim())).toEqual([
        '1. Land Registry Extract Search (පත්විරු පරීක්ෂාව)', '2. Bim Saviya / Title Certificate Check',
        '3. Approved Survey Plan & Local Authority Approval', '4. Street Line & Building Limit Certificate',
        '5. Non-Vesting & Rates Clearance Certificate', '6. Notary Due-Diligence & Stamp Duty Preparation'
    ]);
    const checked = () => screen.getAllByRole('heading', { level: 4 }).map(h => h.parentElement.parentElement.querySelector('svg') !== null);
    expect(checked()).toEqual([true, false, true, false, false, false]);
    expect(screen.getByText(/Conduct a minimum 30-year search/)).toBeInTheDocument();
    expect(screen.getByText(/Title Registration Act No. 21 of 1998/)).toBeInTheDocument();
    expect(screen.getByText(/Licensed Surveyor/)).toBeInTheDocument();
    expect(screen.getByText(/future road widening/)).toBeInTheDocument();
    expect(screen.getByText(/වරප්‍රසාද බදු/)).toBeInTheDocument();
    expect(screen.getByText(/Provincial Department of Revenue/)).toBeInTheDocument();
    fireEvent.click(headings[0]); fireEvent.click(headings[1]);
    expect(checked()).toEqual([false, true, true, false, false, false]);
    tab('Home Loan & EMI Planner'); tab('Due-Diligence Checklist');
    expect(checked()).toEqual([false, true, true, false, false, false]);
    expect(screen.getByLabelText('Route')).toHaveTextContent('?tab=dueDiligence');
});

