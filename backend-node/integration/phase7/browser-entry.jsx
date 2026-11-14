import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { FixtureAuth } from 'virtual:fixture-auth';
import settings from 'virtual:fixture-settings';
import usePropertyForm from '/src/hooks/usePropertyForm.js';
import { usePayhere } from '/src/hooks/usePayhere.js';
import ReviewPublishStep from '/src/components/property/create/ReviewPublishStep.jsx';
import MyProperties from '/src/pages/MyProperties.jsx';

const mock = settings.mode === 'mock';
const selected = settings.manifest.cases?.find(item => item.label === (new URLSearchParams(location.search).get('case') || 'Visa'));
const user = mock ? settings.manifest.user : selected?.user;

function Review() {
    const form = usePropertyForm();
    const { setImages } = form;
    useEffect(() => { setImages([new File(['synthetic'], 'fixture.jpg', { type: 'image/jpeg' })]); }, [setImages]);
    return <>
        {form.message.text && <p role={form.message.type === 'error' ? 'alert' : 'status'}>{form.message.text}</p>}
        <ReviewPublishStep {...form} isRentType={false} isLandType={false} goToStep={() => {}} formatLKRPreview={() => 'Synthetic listing'} />
    </>;
}

function SandboxCase() {
    const [message, setMessage] = useState(null);
    const checkout = usePayhere(setMessage);
    const { paymentConfig, checkoutBusy, checkoutQuote, triggerPayment, retryPaymentConfig } = checkout;
    const amount = checkoutQuote?.propertyId === selected.id ? checkoutQuote.amount : paymentConfig.listingFee;
    return <section>
        <h2>{selected.label} · {user.role}</h2>
        <p>{paymentConfig.status === 'ready' && paymentConfig.sandbox ? `Sandbox fee LKR ${amount}` : 'Sandbox configuration unavailable'}</p>
        {paymentConfig.status === 'error' && <button onClick={retryPaymentConfig}>Retry configuration</button>}
        <button disabled={paymentConfig.status !== 'ready' || !paymentConfig.sandbox || checkoutBusy} onClick={() => triggerPayment(selected.id, amount)}>Open Sandbox checkout</button>
        {message && <p role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}
    </section>;
}

function App() {
    const [page, setPage] = useState('review');
    const [generation, setGeneration] = useState(0);
    const [popup, setPopup] = useState(null);
    const [stats, setStats] = useState(null);
    const route = useLocation();
    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        const refresh = async () => {
            try {
                const response = await fetch(`${settings.prefix}/status`, { signal: controller.signal });
                if (response.ok && active) setStats(await response.json());
            } catch { /* Fixture status polling ends with the page. */ }
        };
        refresh();
        const timer = setInterval(refresh, 800);
        return () => { active = false; controller.abort(); clearInterval(timer); };
    }, []);
    useEffect(() => {
        if (!mock) return;
        const fixtureSdk = { startPayment: terms => setPopup({ amount: terms.amount, orderId: terms.order_id }) };
        window.payhere = fixtureSdk;
        return () => { if (window.payhere === fixtureSdk) delete window.payhere; };
    }, []);
    async function control(action, remount = false) {
        const response = await fetch(`${settings.prefix}/control`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
        if (response.ok && remount) setGeneration(value => value + 1);
    }
    function callback(name, value) {
        window.payhere?.[name]?.(value);
        setPopup(null);
    }
    return <main>
        <h1>{mock ? 'Phase 7 browser simulation' : 'Phase 7 PayHere Sandbox'}</h1>
        <p role="status">Route {route.pathname}</p>
        {stats && <pre aria-label="Fixture evidence">{JSON.stringify(stats, null, 2)}</pre>}
        {mock ? <>
            <nav aria-label="Fixture controls">
                <button onClick={() => setPage('review')}>Review fixture</button>
                <button onClick={() => setPage('listings')}>My Properties fixture</button>
                <button onClick={() => setPage('away')}>Unmount checkout</button>
                <button onClick={() => control('fail-config', true)}>Fail configuration</button>
                <button onClick={() => control('restore-config')}>Restore configuration</button>
                <button onClick={() => control('change-fee')}>Change server fee to 800</button>
                <button onClick={() => control('mark-paid')}>Mark simulated server Paid</button>
                <button onClick={() => { setPopup(null); control('reset', true); }}>Reset fixture</button>
            </nav>
            {popup && <section aria-label="Simulated PayHere popup">
                <h2>Simulated PayHere popup</h2><p>LKR {popup.amount}</p>
                <button onClick={() => callback('onCompleted', popup.orderId)}>Simulate completion</button>
                <button onClick={() => callback('onDismissed')}>Simulate cancellation</button>
                <button onClick={() => callback('onError', 'private-provider-fixture')}>Simulate SDK error</button>
            </section>}
            {page === 'review' ? <Review key={generation} /> : page === 'listings' ? <MyProperties key={generation} /> : <p>Checkout unmounted</p>}
        </> : <>
            <nav aria-label="Sandbox cases">{settings.manifest.cases.map(item => <a key={item.label} href={`/?case=${item.label}`}>{item.label}</a>)}</nav>
            {selected ? <SandboxCase /> : <p>Unknown fixture case</p>}
        </>}
    </main>;
}

createRoot(document.getElementById('root')).render(
    <FixtureAuth.Provider value={{ user }}><MemoryRouter><App /></MemoryRouter></FixtureAuth.Provider>
);
