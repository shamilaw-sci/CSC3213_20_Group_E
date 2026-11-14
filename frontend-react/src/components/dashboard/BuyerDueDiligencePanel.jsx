import React from 'react';
import { Check } from 'lucide-react';

const BuyerDueDiligencePanel = ({ checkedItems, toggleCheckItem }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-150">
            <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Sri Lanka Property Due-Diligence Checklist
                </h3>
                <p className="text-xs text-slate-500">
                    Essential legal verification steps before executing title deed transfers in Sri Lanka
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    {
                        key: 'extractSearch',
                        title: '1. Land Registry Extract Search (පත්විරු පරීක්ෂාව)',
                        desc: 'Conduct a minimum 30-year search at the relevant Land Registry (Folio check) to verify an unbroken pedigree and ensure zero hidden mortgages or caveats.'
                    },
                    {
                        key: 'titleRegistration',
                        title: '2. Bim Saviya / Title Certificate Check',
                        desc: 'Verify if the land comes under Title Registration Act No. 21 of 1998 (Cadastral survey). Check whether it holds First Class or Second Class title.'
                    },
                    {
                        key: 'surveyPlan',
                        title: '3. Approved Survey Plan & Local Authority Approval',
                        desc: 'Verify that the survey plan is signed by a Licensed Surveyor and approved by the Municipal Council / Pradeshiya Sabha / UDA.'
                    },
                    {
                        key: 'streetLine',
                        title: '4. Street Line & Building Limit Certificate',
                        desc: 'Obtain from the local municipal council to ensure the property is not earmarked for future road widening or public acquisition.'
                    },
                    {
                        key: 'nonVesting',
                        title: '5. Non-Vesting & Rates Clearance Certificate',
                        desc: 'Ensure all local council assessment taxes (වරප්‍රසාද බදු) are paid up to date and obtain a Non-Vesting certificate.'
                    },
                    {
                        key: 'encumbranceFree',
                        title: '6. Notary Due-Diligence & Stamp Duty Preparation',
                        desc: 'Retain an independent Lawyer/Notary Public to draft the Deed of Transfer and compute stamp duty payment to the Provincial Department of Revenue.'
                    }
                ].map((item) => (
                    <div
                        key={item.key}
                        onClick={() => toggleCheckItem(item.key)}
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
};

export default BuyerDueDiligencePanel;
