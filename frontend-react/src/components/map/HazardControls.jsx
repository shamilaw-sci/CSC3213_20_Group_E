import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { HAZARD_LAYERS, HAZARD_SERVICE } from './hazardService';

export default function HazardControls({ showFloodZones, setShowFloodZones, showLandslideZones, setShowLandslideZones, status, onRetry }) {
    const enabled = { flood: showFloodZones, landslide: showLandslideZones };
    const setters = { flood: setShowFloodZones, landslide: setShowLandslideZones };
    const panel = useRef(null);
    useEffect(() => {
        L.DomEvent.disableClickPropagation(panel.current);
        L.DomEvent.disableScrollPropagation(panel.current);
    }, []);
    return (
        <section ref={panel} aria-label="Disaster risk map" className="bg-white/95 dark:bg-slate-900/95 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 w-[248px] max-w-[calc(100vw-64px)] max-h-[55vh] overflow-y-auto">
            <h4 className="font-bold text-sm mb-3">Disaster Risk Map</h4>
            <div className="space-y-3">
                {Object.entries(HAZARD_LAYERS).map(([kind, config]) => (
                    <div key={kind}>
                        <label className="flex items-start gap-2 cursor-pointer text-sm">
                            <input type="checkbox" className="mt-1" checked={enabled[kind]} onChange={event => setters[kind](event.target.checked)} />
                            <span>{config.label}</span>
                        </label>
                        {enabled[kind] && status[kind] === 'loading' && <p role="status" className="text-xs mt-1">Loading published map…</p>}
                        {enabled[kind] && status[kind] === 'error' && (
                            <div role="alert" className="text-xs text-red-700 dark:text-red-300 mt-1">
                                {config.label} unavailable or incomplete.
                                <button type="button" className="underline ml-1" onClick={() => onRetry(kind)}>Retry</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {(showFloodZones || showLandslideZones) && (
                <div className="text-xs mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
                    {showFloodZones && <p><span className="inline-block w-2 h-2 bg-sky-500 mr-1" />Historical flood exposure; not current flooding.</p>}
                    {showLandslideZones && <p className="flex flex-wrap gap-x-2" aria-label="Landslide classes">
                        <span><i className="inline-block w-2 h-2 bg-yellow-400 mr-1" />Low</span>
                        <span><i className="inline-block w-2 h-2 bg-amber-500 mr-1" />Moderate</span>
                        <span><i className="inline-block w-2 h-2 bg-red-600 mr-1" />High</span>
                    </p>}
                    <p>Partial coverage. Unshaded areas are not confirmed safe. Not a property-level assessment.</p>
                    <details>
                        <summary className="cursor-pointer underline">Sources &amp; limitations</summary>
                        <p className="mt-2">Published by Sri Lanka NSDI. Survey dates are not provided by the service; latest NBRO status is unverified. Service checked 14 Nov 2026.</p>
                        <div className="flex flex-wrap gap-x-3 mt-1">
                            {Object.entries(HAZARD_LAYERS).filter(([kind]) => enabled[kind]).map(([kind, config]) => (
                                <a key={kind} className="underline" href={`${HAZARD_SERVICE}/${config.id}`} target="_blank" rel="noreferrer">{config.label} source</a>
                            ))}
                        </div>
                    </details>
                </div>
            )}
        </section>
    );
}
