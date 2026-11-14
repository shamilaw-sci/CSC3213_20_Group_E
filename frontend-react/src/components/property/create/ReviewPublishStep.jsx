import React from "react";
import { ArrowLeft, Compass, CreditCard, Edit3, Lock, MapPin } from "lucide-react";

const ReviewPublishStep = ({ formData, isRentType, isLandType, images, virtualTourFiles, virtualTourMetadata, previewUrls, paymentConfig, paymentAmount, retryPaymentConfig, loading, goToStep, handleSubmit, formatLKRPreview, locationMode, boundaryCoordinates }) => (
  <>
              
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black uppercase">
                    Final Step 4 of 4
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Review & Confirm Your Listing</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Please verify all details carefully. You can edit any section before proceeding to payment.
                </p>
              </div>

              {/* Summary Cards Grid with Direct Edit Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* 1. Category & Price Summary */}
                <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">1. Category & Price</span>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Type:</span>
                        <strong className="text-slate-900 dark:text-white text-sm">{formData.type} ({formData.listingType})</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Price:</span>
                        <strong className="text-emerald-400 text-sm">{formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Contact Phone:</span>
                        <span className="text-slate-800 dark:text-slate-200">{formData.contactNumber || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Spatial Location Summary */}
                <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">2. Spatial Location</span>
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">District:</span>
                        <strong className="text-slate-900 dark:text-white">{formData.district}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Town / Address:</span>
                        <span className="text-slate-800 dark:text-slate-200">{formData.city || formData.address || "-"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Mapping Coordinates:</span>
                        <span className="text-blue-400 font-mono text-[11px]">
                          {locationMode === "boundary" ? `Polygon (${boundaryCoordinates.length} vertices)` : `${Number(formData.latitude).toFixed(4)}, ${Number(formData.longitude).toFixed(4)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Specs & Media Summary */}
                <div className="p-5 rounded-3xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">3. Specs & Photos</span>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      {!isLandType && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block">Bedrooms / Baths:</span>
                          <span className="text-slate-800 dark:text-slate-200">{formData.bedrooms || 0} Beds · {formData.bathrooms || 0} Baths</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Size:</span>
                        <span className="text-slate-800 dark:text-slate-200">{formData.landSize ? `${formData.landSize} Perches` : ""}{formData.houseSize ? ` · ${formData.houseSize} sqft` : ""}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block">Photographs:</span>
                        <span className="text-emerald-400 font-bold">{images.length} Photos Attached</span>
                        </div>
                        {virtualTourFiles.length > 0 && (
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block">360° Tours:</span>
                            <span className="text-emerald-400 font-bold">{virtualTourFiles.length} Panorama{virtualTourFiles.length > 1 ? 's' : ''} Attached</span>
                          </div>
                        )}
                        {virtualTourFiles.length > 0 && (
                          <div className="col-span-2 mt-2">
                            <div className="flex flex-wrap gap-2">
                              {virtualTourMetadata.map((meta, i) => (
                                <span key={i} className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                                  <Compass className="w-3 h-3" /> {meta.room}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Live Buyer Card Preview */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Live Showcase Card (As Viewed by Buyers on Live Map)
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-md mx-auto shadow-2xl">
                  <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 relative">
                    {previewUrls[0] ? (
                      <img src={previewUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                        No Photo Uploaded
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase">
                      {formData.type}
                    </div>
                    <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-3 py-1.5">
                      <span className="text-xl font-black text-white">
                        {formatLKRPreview(formData.price, isRentType ? formData.pricePeriod : null) || `Rs. ${formData.price}`}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{formData.title || "Property Title"}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{formData.city ? `${formData.city}, ${formData.district}` : formData.district}</span>
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      {formData.bedrooms && <span>🛏️ {formData.bedrooms} Beds</span>}
                      {formData.bathrooms && <span>🚿 {formData.bathrooms} Baths</span>}
                      {formData.houseSize && <span>🏠 {formData.houseSize} sqft</span>}
                      {formData.landSize && <span>📐 {formData.landSize} Perch</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary Box */}
              <div className="p-6 rounded-3xl bg-emerald-950/30 border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">One-Time Activation Fee</span>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white">
                      {paymentConfig.status === 'ready' ? `Rs. ${Number(paymentAmount).toLocaleString()}` : 'Payment configuration unavailable'} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">LKR</span>
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                      Pay securely with PayHere
                    </p>
                    {paymentConfig.status === 'ready' && <p className="text-xs">{paymentConfig.sandbox ? 'Test checkout' : 'Live checkout'}</p>}
                    {paymentConfig.status === 'error' && <button type="button" onClick={retryPaymentConfig}>Retry payment configuration</button>}
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                  <span className="block font-bold text-slate-900 dark:text-white">✓ Deed Verification</span>
                  <span className="block">✓ PostGIS Map Broadcast</span>
                  <span className="block">✓ Unlimited Buyer Leads</span>
                </div>
              </div>

              {/* Final Step Controls */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Specs & Photos</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || paymentConfig.status !== 'ready'}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-sm transition flex items-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {loading
                      ? "Processing Payment..."
                      : paymentConfig.status === 'ready' ? `Proceed to Payment (Rs. ${Number(paymentAmount).toLocaleString()}) →`
                      : paymentConfig.status === 'error' ? 'Payment unavailable' : 'Loading payment configuration...'}
                  </span>
                </button>
              </div>

  </>
);

export default ReviewPublishStep;
