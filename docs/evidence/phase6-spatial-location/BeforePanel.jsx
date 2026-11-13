import React from 'react';import {m} from 'framer-motion';import {MapContainer,TileLayer,Marker,Polygon,CircleMarker} from 'react-leaflet';import {ArrowLeft,ArrowRight,Compass} from 'lucide-react';import {MapClickEvents,customIcon,MapObserver} from 'virtual:phase6-common';export default function BeforePanel({formData,setFormData,handleChange,locationMode,setLocationMode,boundaryCoordinates,setBoundaryCoordinates,gpsActive,setGpsActive,handleGetGPS,prevStep,nextStep,setObservation}){return (<m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Nearby Town / City <span className="text-blue-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Kadawatha, Colombo 07, Kandy Town"
                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Full Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 123, Main Road, Kadawatha"
                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Geospatial Mapping Mode
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode("point");
                        setBoundaryCoordinates([]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        locationMode === "point"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Single Pin Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationMode("boundary")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        locationMode === "boundary"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Draw Boundary Polygon
                    </button>
                    <button
                      type="button"
                      onClick={handleGetGPS}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        gpsActive ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>My GPS</span>
                    </button>
                  </div>
                </div>

                <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 relative shadow-inner">
                  <MapContainer
                    center={[formData.latitude || 6.9271, formData.longitude || 79.8612]}
                    zoom={14}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="/__phase6_assets/tile.svg" />
                    <MapClickEvents locationMode={locationMode} setFormData={setFormData} setGpsActive={setGpsActive} setBoundaryCoordinates={setBoundaryCoordinates} />

                    {locationMode === "point" && formData.latitude && formData.longitude && (
                      <Marker position={[formData.latitude, formData.longitude]} icon={customIcon} />
                    )}

                    {locationMode === "boundary" && (
                      <>
                        {boundaryCoordinates.map((c, i) => (
                          <CircleMarker key={i} center={c} radius={6} color="#3b82f6" fillColor="#60a5fa" fillOpacity={0.8} />
                        ))}
                        {boundaryCoordinates.length >= 3 && (
                          <Polygon positions={boundaryCoordinates} color="#2563eb" fillColor="#3b82f6" fillOpacity={0.4} />
                        )}
                      </>
                    )}
                  <MapObserver onObservation={setObservation}/></MapContainer>

                  <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-semibold z-[1000]">
                    {locationMode === "point"
                      ? "📍 Click anywhere on map to position property pin"
                      : `📐 Click to add boundary points (${boundaryCoordinates.length} selected)`}
                  </div>

                  {locationMode === "boundary" && boundaryCoordinates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBoundaryCoordinates([])}
                      className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-xl text-xs font-bold z-[1000] shadow-md cursor-pointer"
                    >
                      Clear Boundary
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Continue to Specs & Photos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </m.div>);}