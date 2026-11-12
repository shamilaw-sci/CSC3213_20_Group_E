import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
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
    localStorage.clear();
    vi.resetAllMocks();
    api.get.mockResolvedValue({ data: {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const originalItems = [
    {
        key: 'extractSearch',
        title: '1. Land Registry Extract Search (පත්විරු පරීක්ෂාව)',
        desc: 'Conduct a minimum 30-year search at the relevant Land Registry (Folio check) to verify an unbroken pedigree and ensure zero hidden mortgages or caveats.'
    },
    {
        key: 'titleRegistration',
        title: '2. Bim Saviya / Title Certificate Check',
        desc: 'Verify if the land comes under Title Registration Act No. 21 of 1998 (Cadastral survey). Check whether it holds First Class or Second Class title.'
    },
    {
        key: 'surveyPlan',
        title: '3. Approved Survey Plan & Local Authority Approval',
        desc: 'Verify that the survey plan is signed by a Licensed Surveyor and approved by the Municipal Council / Pradeshiya Sabha / UDA.'
    },
    {
        key: 'streetLine',
        title: '4. Street Line & Building Limit Certificate',
        desc: 'Obtain from the local municipal council to ensure the property is not earmarked for future road widening or public acquisition.'
    },
    {
        key: 'nonVesting',
        title: '5. Non-Vesting & Rates Clearance Certificate',
        desc: 'Ensure all local council assessment taxes (වරප්‍රසාද බදු) are paid up to date and obtain a Non-Vesting certificate.'
    },
    {
        key: 'encumbranceFree',
        title: '6. Notary Due-Diligence & Stamp Duty Preparation',
        desc: 'Retain an independent Lawyer/Notary Public to draft the Deed of Transfer and compute stamp duty payment to the Provincial Department of Revenue.'
    }
];

function LocationProbe() { return <output data-testid="location">{useLocation().search}</output>; }
async function mount() {
    let result;
    await act(async () => {
        result = render(<MemoryRouter initialEntries={['/profile?tab=dueDiligence']}><ProfileSettings /><LocationProbe /></MemoryRouter>);
    });
    return result;
}
function card(index) { return screen.getByText(originalItems[index].title).parentElement.parentElement; }
function expectChecked(index, checked) {
    const element = card(index);
    expect(element.classList.contains('border-blue-300')).toBe(checked);
    expect(element.classList.contains('border-slate-200')).toBe(!checked);
    expect(Boolean(element.firstElementChild.querySelector('svg.lucide-check'))).toBe(checked);
    expect(element.firstElementChild.classList.contains('bg-blue-600')).toBe(checked);
}
function expectNoMutation() {
    for (const method of ['post', 'put', 'patch', 'delete']) expect(api[method]).not.toHaveBeenCalled();
}

test('six original items retain copy, order, native div semantics and two checked defaults', async () => {
    await mount();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Sri Lanka Property Due-Diligence Checklist');
    expect(screen.getByText('Essential legal verification steps before executing deed transfers in Sri Lanka')).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 4 }).map(element => element.textContent)).toEqual(originalItems.map(item => item.title));
    originalItems.forEach((item, index) => {
        expect(screen.getByText(item.desc)).toBeTruthy();
        expect(card(index).tagName).toBe('DIV');
        for (const name of ['role', 'tabindex', 'aria-checked']) expect(card(index).getAttribute(name)).toBeNull();
        expect(card(index).querySelector('input,button')).toBeNull();
        expectChecked(index, index === 0 || index === 2);
    });
    expectNoMutation();
});

test.each(['title', 'description', 'indicator', 'card'])('%s clicks bubble to toggle the same item on and off', async target => {
    await mount();
    const element = target === 'title' ? screen.getByText(originalItems[1].title)
        : target === 'description' ? screen.getByText(originalItems[1].desc)
            : target === 'indicator' ? card(1).firstElementChild : card(1);
    fireEvent.click(element);
    expectChecked(1, true);
    fireEvent.click(element);
    expectChecked(1, false);
    expectChecked(0, true);
    expectChecked(2, true);
    expectNoMutation();
});

test('all six item keys toggle independently without resetting other selections', async () => {
    await mount();
    const selected = [true, false, true, false, false, false];
    originalItems.forEach((_, index) => {
        fireEvent.click(card(index));
        selected[index] = !selected[index];
        selected.forEach((checked, itemIndex) => expectChecked(itemIndex, checked));
    });
    originalItems.forEach((_, index) => fireEvent.click(card(index)));
    selected.forEach((_, index) => expectChecked(index, index === 0 || index === 2));
    expectNoMutation();
});

test('parent selections and query tab survive leaving and returning without reads or mutations', async () => {
    await mount();
    fireEvent.click(card(0));
    fireEvent.click(card(3));
    const reads = api.get.mock.calls.map(([url]) => url);
    expect(reads).toEqual(['/saved-searches', '/favorites', '/agents/my-appointments', '/conversations/unread']);
    fireEvent.click(screen.getByRole('button', { name: 'Theme & Preferences' }));
    expect(screen.queryByText(originalItems[0].title)).toBeNull();
    expect(screen.getByTestId('location').textContent).toBe('?tab=preferences');
    fireEvent.click(screen.getByRole('button', { name: 'Due-Diligence Guide' }));
    expect(screen.getByTestId('location').textContent).toBe('?tab=dueDiligence');
    [false, false, true, true, false, false].forEach((value, index) => expectChecked(index, value));
    expect(api.get.mock.calls.map(([url]) => url)).toEqual(reads);
    expectNoMutation();
});

test('fresh mount restores saved checklist selections', async () => {
    const first = await mount();
    fireEvent.click(card(0));
    fireEvent.click(card(4));
    first.unmount();
    await mount();
    originalItems.forEach((_, index) => expectChecked(index, index === 2 || index === 4));
    expect(api.get).toHaveBeenCalledTimes(8);
    expectNoMutation();
});
