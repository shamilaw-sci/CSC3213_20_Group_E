import { Maximize } from "lucide-react";

const VirtualToursSection = ({ onUpload, currentSizeMB, maxSizeMB, progress, children }) => (
  <>
                {/* 360 Virtual Tours Section */}
                <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">
                    <span>360 Virtual Tours (Optional)</span>
                    <span className="ml-2 bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">PREMIUM</span>
                  </label>
                  <p className="text-slate-500 text-sm mb-4">Upload equirectangular panoramic images (.jpg or .png) to create an immersive 3D viewing experience.</p>
                  
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-3xl p-8 text-center bg-slate-50/40 dark:bg-slate-950/40 transition mb-6">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg, image/png"
                      onChange={onUpload}
                      id="property-virtual-tours-input"
                      className="hidden"
                    />
                    <label htmlFor="property-virtual-tours-input" className="flex flex-col items-center cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
                        <Maximize className="w-6 h-6 text-emerald-400" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload 360 photos</span>
                      <span className="text-xs text-slate-500 mt-2">Max 5 panoramas (2:1 aspect ratio recommended)</span>
                    </label>
                  </div>

                  {children}
                  {/* Memory Storage UI - 360 Tours */}
                  <div className="mt-6 bg-white/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">360 Storage Used</span>
                      <span className="text-sm font-bold text-emerald-400">{currentSizeMB.toFixed(2)} MB <span className="text-slate-500 text-xs">/ {maxSizeMB} MB</span></span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-50 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${currentSizeMB >= maxSizeMB ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
  </>
);

export default VirtualToursSection;
