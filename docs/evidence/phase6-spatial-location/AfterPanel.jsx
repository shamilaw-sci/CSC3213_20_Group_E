import React from 'react';import {m} from 'framer-motion';import {MapContainer,TileLayer,Marker,Polygon,CircleMarker} from 'react-leaflet';import {ArrowLeft,ArrowRight,Compass} from 'lucide-react';import {MapClickEvents,customIcon,MapObserver} from 'virtual:phase6-common';import LocationStep from '/src/components/property/create/LocationStep.jsx';export default function AfterPanel({formData,setFormData,handleChange,locationMode,setLocationMode,boundaryCoordinates,setBoundaryCoordinates,gpsActive,setGpsActive,handleGetGPS,prevStep,nextStep,setObservation}){return (<m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              <LocationStep
                formData={formData}
                onChange={handleChange}
                locationMode={locationMode}
                onModeChange={setLocationMode}
                onBoundaryChange={setBoundaryCoordinates}
                boundaryCount={boundaryCoordinates.length}
                gpsActive={gpsActive}
                onGetGPS={handleGetGPS}
                onPrevious={prevStep}
                onContinue={nextStep}
              >
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
              </LocationStep>
            </m.div>);}