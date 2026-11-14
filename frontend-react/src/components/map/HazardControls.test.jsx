import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import HazardControls from './HazardControls';

test('shows provenance, limitations, published classes and layer-specific retry', () => {
    const retry = vi.fn();
    const toggle = vi.fn();
    render(<HazardControls showFloodZones setShowFloodZones={toggle} showLandslideZones setShowLandslideZones={vi.fn()} status={{ flood: 'error', landslide: 'loading' }} onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Historical flood extents unavailable or incomplete');
    expect(screen.getByRole('status')).toHaveTextContent('Loading published map');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledWith('flood');
    fireEvent.click(screen.getByLabelText('Historical flood extents'));
    expect(toggle).toHaveBeenCalledWith(false);
    expect(screen.getByText(/Unshaded areas are not confirmed safe/)).toBeInTheDocument();
    expect(screen.getByText(/Survey dates are not provided/)).toBeInTheDocument();
    expect(screen.getByLabelText('Landslide classes')).toHaveTextContent('LowModerateHigh');
    expect(screen.getByRole('link', { name: 'Landslide susceptibility source' })).toHaveAttribute('href', expect.stringContaining('/MapServer/8'));
});
