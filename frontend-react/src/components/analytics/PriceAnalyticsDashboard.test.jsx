import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import api from '../../context/api';
import PriceAnalyticsDashboard from './PriceAnalyticsDashboard';
vi.mock('../../context/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('recharts', () => {
    const Box = ({ children }) => <div>{children}</div>;
    return Object.fromEntries(['LineChart', 'Line', 'BarChart', 'Bar', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'ReferenceLine'].map(key => [key, Box]));
});
beforeEach(() => {
    vi.resetAllMocks();
    api.get.mockResolvedValue({ data: { isSimulated: true, data: [{ sale_date: '2024-01-01', sale_price: 1000000 }] } });
    api.post.mockResolvedValue({ data: { prediction: { status: 'Fair Price', estimatedValue: 1050000 } } });
});
test('labels sample history and does not invent a valuation when comparables are unavailable', async () => {
    render(<PriceAnalyticsDashboard propertyId="p1" currentPrice={1000000} />);
    expect(await screen.findByText(/Sample history/)).toBeInTheDocument();
    expect(screen.getByText(/Not enough comparable listing data/)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.queryByText('Estimated Value')).not.toBeInTheDocument();
});
test('presents statistical insight as an asking-price comparison with sample size', async () => {
    render(<PriceAnalyticsDashboard propertyId="p1" currentPrice={1000000} insight={{ label: 'Fair Price', level: 'fair_price', sampleSize: 8, percentVsAverage: -3, pricePerSqft: 10000, averagePricePerSqft: 10300 }} />);
    expect(await screen.findByText('Fair Price')).toBeInTheDocument();
    expect(screen.getByText(/8 comparable listings/)).toBeInTheDocument();
    expect(screen.getByText(/asking prices/)).toBeInTheDocument();
});
