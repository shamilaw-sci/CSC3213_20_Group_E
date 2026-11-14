import { act, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import L from 'leaflet';
import HazardTileLayer from './HazardTileLayer';

const { map } = vi.hoisted(() => ({ map: { removeLayer: vi.fn() } }));
vi.mock('react-leaflet', () => ({ useMap: () => map }));
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

test('reports failures, cleans up listeners and recreates tiles for retry', () => {
    vi.useFakeTimers();
    const layers = [];
    vi.spyOn(L.TileLayer.prototype, 'addTo').mockImplementation(function () { layers.push(this); return this; });
    const onStatus = vi.fn();
    const { rerender, unmount } = render(<HazardTileLayer kind="flood" onStatus={onStatus} />);
    const tile = document.createElement('img');
    act(() => { layers[0].fire('loading'); layers[0].fire('tileerror', { tile }); layers[0].fire('load'); });
    expect(onStatus).toHaveBeenLastCalledWith('flood', 'error');
    // A later successful batch must not conceal a failed tile still in view.
    act(() => { layers[0].fire('loading'); layers[0].fire('load'); });
    expect(onStatus).toHaveBeenLastCalledWith('flood', 'error');
    act(() => { layers[0].fire('tileunload', { tile }); layers[0].fire('load'); });
    expect(onStatus).toHaveBeenLastCalledWith('flood', 'ready');
    // Zoom cancellation must not leave a synthetic pending-tile count behind.
    act(() => { layers[0].fire('loading'); layers[0].fire('tileloadstart'); layers[0].fire('tileabort'); layers[0].fire('load'); });
    expect(onStatus).toHaveBeenLastCalledWith('flood', 'ready');
    rerender(<HazardTileLayer kind="flood" onStatus={onStatus} retryKey={1} />);
    expect(map.removeLayer).toHaveBeenCalledWith(layers[0]);
    expect(layers[0].listens('tileerror')).toBe(false);
    act(() => { layers[1].fire('loading'); vi.advanceTimersByTime(20000); });
    expect(onStatus).toHaveBeenLastCalledWith('flood', 'error');
    act(() => { layers[1].fire('loading'); layers[1].fire('load'); });
    expect(onStatus).toHaveBeenLastCalledWith('flood', 'ready');
    unmount();
    expect(map.removeLayer).toHaveBeenCalledWith(layers[1]);
    expect(vi.getTimerCount()).toBe(0);
});
