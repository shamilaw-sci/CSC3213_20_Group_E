import React from "react";
import { DollarSign, Phone, ArrowRight } from "lucide-react";
import { propertyCategoryOptions } from "./propertyCategoryOptions";

const CategoryPriceStep = ({ formData, isRentType, titlePlaceholder, pricePreview, districts, onChange, onTypeSelect, onDistrictChange, onContinue }) => (
  <>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Select Property Asset Class <span className="text-blue-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {propertyCategoryOptions.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.type === cat.id;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => onTypeSelect(cat.id)}
                        className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? "border-blue-500 bg-blue-600/15 text-blue-900 dark:text-white shadow-lg shadow-blue-500/15"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{cat.title}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{cat.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Property Headline Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  placeholder={titlePlaceholder}
                  className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Tip: Include district, bedrooms, and signature amenities for highest buyer visibility.
                </span>
              </div>

              {/* Price & Period */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Price (Rs.) <span className="text-blue-400">*</span>
                  </label>
                  <div className="flex gap-2.5">
                    <div className="relative flex-1">
                      <DollarSign className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={onChange}
                        placeholder="Enter Price"
                        className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>

                    {isRentType && (
                      <select
                        name="pricePeriod"
                        value={formData.pricePeriod || "Month"}
                        onChange={onChange}
                        className="bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer font-bold shrink-0"
                      >
                        <option value="Month">/ Month</option>
                        <option value="Year">/ Year</option>
                      </select>
                    )}
                  </div>

                  {formData.price && (
                    <span className="text-xs font-bold text-emerald-400 mt-1.5 block">
                      Preview: {pricePreview}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    District <span className="text-blue-400">*</span>
                  </label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={onDistrictChange}
                    className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Phone & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Contact Number (WhatsApp / Call) <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={onChange}
                      placeholder="e.g. 0771234567"
                      className="w-full bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Listing Type
                  </label>
                  <div className="px-4 py-3.5 rounded-2xl bg-slate-50/40 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isRentType ? "For Lease / Rental" : "For Sale / Outright Purchase"}
                  </div>
                </div>
              </div>


                {/* Navigation Controls */}
              <div className="flex items-center justify-end border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
                <button
                  type="button"
                  onClick={onContinue}
                  className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  <span>Continue to Spatial Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

  </>
);

export default CategoryPriceStep;
