import React from "react";
import { Bed, Bath, Maximize2 } from "lucide-react";

export default function PropertySpecificationFields({ formData, isLandType, isHouseType, onChange }) {
  return (
    <>
              {!isLandType && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Bedrooms
                    </label>
                    <div className="relative">
                      <Bed className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={onChange}
                        placeholder="e.g. 3"
                        className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Bathrooms
                    </label>
                    <div className="relative">
                      <Bath className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={onChange}
                        placeholder="e.g. 2"
                        className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {!isLandType && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    House Size (sqft)
                  </label>
                  <div className="relative">
                    <Maximize2 className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      name="houseSize"
                      value={formData.houseSize}
                      onChange={onChange}
                      placeholder="e.g. 1800"
                      className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {(isLandType || isHouseType) && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Land Size (Perches)
                  </label>
                  <input
                    type="number"
                    name="landSize"
                    value={formData.landSize}
                    onChange={onChange}
                    placeholder="e.g. 15"
                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  placeholder="Describe the key features of your property..."
                  className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>

    </>
  );
}
