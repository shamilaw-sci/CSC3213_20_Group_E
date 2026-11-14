import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import PropertyDetails from './PropertyDetails';
import api from '../context/api';

const session = vi.hoisted(() => ({ user: { id: 'buyer-1', role: 'BUYER' } }));
vi.mock('../context/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../context/UserAuthContext', () => ({ useAuth: () => session }));
vi.mock('../context/CompareContext', () => ({ useCompare: () => ({ compareList: [], addToCompare: vi.fn(), removeFromCompare: vi.fn() }) }));
vi.mock('../components/layout/Navbar', () => ({ default: () => null }));
vi.mock('../components/layout/Footer', () => ({ default: () => null }));
vi.mock('../components/property/MortgageCalculator', () => ({ default: () => null }));
vi.mock('../components/property/PropertyCard', () => ({ default: () => null }));
vi.mock('../components/analytics/PriceAnalyticsDashboard', () => ({ default: () => null }));
vi.mock('react-photo-sphere-viewer', () => ({ ReactPhotoSphereViewer: () => null }));
vi.mock('react-leaflet', () => ({ MapContainer: () => null, TileLayer: () => null, Marker: () => null, Polygon: () => null, Popup: () => null }));
vi.mock('framer-motion', () => ({ AnimatePresence: ({ children }) => children, m: { div: ({ children }) => <div>{children}</div> } }));

const property = id => ({ id, title: `Property ${id}`, price: 1000000, type: 'House', listing_type: 'Sale', seller_id: 'seller-1', images: ['photo.jpg'] });
const mount = () => render(<MemoryRouter initialEntries={['/property/a']}>
    <Link to="/property/b">Next property</Link>
    <Routes><Route path="/property/:id" element={<PropertyDetails />} /></Routes>
</MemoryRouter>);

describe('Property detail loading and favorite state', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        api.post.mockResolvedValue({ data: {} });
        api.get.mockImplementation(async url => {
            if (url === '/favorites') return { data: { favorites: [{ id: 'a' }] } };
            if (url.endsWith('/similar')) return { data: { properties: [] } };
            if (url.endsWith('/price-insight')) return { data: { insight: null } };
            return { data: { property: property(url.split('/').pop()) } };
        });
    });
    afterEach(() => { cleanup(); vi.restoreAllMocks(); });

    test('recognizes an existing favorite returned as a property object', async () => {
        mount();
        expect(await screen.findByRole('button', { name: 'Save Favorite' })).toHaveTextContent('Saved');
    });

    test('still displays a valid property when favorite lookup fails', async () => {
        const get = api.get.getMockImplementation();
        api.get.mockImplementation(url => url === '/favorites' ? Promise.reject(new Error('Favorites unavailable')) : get(url));
        mount();
        expect(await screen.findByRole('heading', { name: 'Property a' })).toBeInTheDocument();
        expect(screen.queryByText('Property Not Found')).not.toBeInTheDocument();
    });

    test('clears favorite state when navigating to an unfavorited property', async () => {
        api.get.mockImplementation(async url => {
            if (url === '/favorites') return { data: { favorites: [{ id: 'a', property_id: 'a' }] } };
            if (url.endsWith('/similar')) return { data: { properties: [] } };
            if (url.endsWith('/price-insight')) return { data: { insight: null } };
            return { data: { property: property(url.split('/').pop()) } };
        });
        mount();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Save Favorite' })).toHaveTextContent('Saved'));
        fireEvent.click(screen.getByRole('link', { name: 'Next property' }));
        await screen.findByRole('heading', { name: 'Property b' });
        expect(screen.getByRole('button', { name: 'Save Favorite' })).toHaveTextContent(/^Save$/);
    });

    test('clears an earlier request error when the next property loads successfully', async () => {
        const get = api.get.getMockImplementation();
        api.get.mockImplementation(url => url === '/properties/a' ? Promise.reject(new Error('Not found')) : get(url));
        mount();
        await screen.findByText('Property Not Found');
        fireEvent.click(screen.getByRole('link', { name: 'Next property' }));
        expect(await screen.findByRole('heading', { name: 'Property b' })).toBeInTheDocument();
    });
    test('detail card forwards buyer contact and preserves rent price label', async () => {
        const get = api.get.getMockImplementation();
        api.get.mockImplementation(url => url === '/properties/a' ? Promise.resolve({ data: { property: { ...property('a'), listing_type: 'Rent', bedrooms: 2, bathrooms: 1, land_size: 5 } } }) : get(url));
        api.post.mockResolvedValue({ data: { conversation: { id: 'c' } } });
        mount(); await screen.findByRole('heading', { name: 'Property a' });
        expect(screen.getByText('/mo')).toBeInTheDocument(); expect(screen.getByText('Beds')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Contact Seller' }));
        await waitFor(() => expect(api.post).toHaveBeenCalledWith('/conversations/property/a', {}));
    });
    test('owner detail card shows management instead of contact or favorite controls', async () => {
        const get = api.get.getMockImplementation();
        api.get.mockImplementation(url => url === '/properties/a' ? Promise.resolve({ data: { property: { ...property('a'), seller_id: 'buyer-1' } } }) : get(url));
        mount(); await screen.findByRole('button', { name: 'Manage Property' });
        expect(screen.queryByRole('button', { name: 'Contact Seller' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Save Favorite' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Compare Property' })).toBeInTheDocument();
    });

});
