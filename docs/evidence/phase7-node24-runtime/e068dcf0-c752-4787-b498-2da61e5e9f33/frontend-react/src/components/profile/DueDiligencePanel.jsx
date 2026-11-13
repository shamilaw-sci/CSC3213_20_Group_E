import { Check } from 'lucide-react';
import dueDiligenceItems from './dueDiligenceItems';

const DueDiligencePanel = ({ checkedItems, onToggleCheckItem }) => (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sri Lanka Property Due-Diligence Checklist</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Essential legal verification steps before executing deed transfers in Sri Lanka</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dueDiligenceItems.map((item) => (
                    <div
                        key={item.key}
                        onClick={() => onToggleCheckItem(item.key)}
                        className={`p-5 rounded-3xl border transition cursor-pointer flex items-start gap-4 ${
                            checkedItems[item.key]
                                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                    >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition ${
                            checkedItems[item.key]
                                ? 'bg-blue-600 text-white'
                                : 'border-2 border-slate-300 dark:border-slate-600'
                        }`}>
                            {checkedItems[item.key] && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
);

export default DueDiligencePanel;
