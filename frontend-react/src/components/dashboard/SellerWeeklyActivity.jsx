import React, { useEffect, useState } from 'react';
import api from '../../context/api';

const validCount = value => Number.isSafeInteger(value) && value >= 0;
function validateActivity(data) {
  if (!Array.isArray(data?.days) || data.days.length !== 7 || !data.days.every(day => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && validCount(day.views) && validCount(day.inquiries))
    || !validCount(data.current?.views) || !validCount(data.current?.inquiries) || !validCount(data.previous?.views)
    || !Number.isFinite(Date.parse(data.viewTrackingStartedAt)) || typeof data.comparisonComplete !== 'boolean'
    || !(data.viewChangePercent === null || Number.isFinite(data.viewChangePercent))) throw new Error('Activity response unavailable');
  return data;
}
const dateLabel = (date, options) => new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Colombo', ...options }).format(new Date(`${date}T12:00:00+05:30`));
function comparisonLabel(data) {
  if (!data.comparisonComplete) return 'Building comparison history';
  if (data.viewChangePercent !== null) return `${data.viewChangePercent > 0 ? '+' : ''}${data.viewChangePercent}% views vs previous 7 days`;
  return data.current.views > 0 ? 'No views in the previous 7 days' : 'No recorded views in either period';
}
export default function SellerWeeklyActivity({ sellerId, listingCount = 0, totalViews = 0, totalSaves = 0 }) {
  const [request, setRequest] = useState({ sellerId:null, status:'loading', data:null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setRequest({sellerId,status:'loading',data:null});
    api.get('/properties/my-listings/activity', {signal:controller.signal})
      .then(({data}) => { const parsed=validateActivity(data); if(active) setRequest({sellerId,status:'ready',data:parsed}); })
      .catch(() => { if(active) setRequest({sellerId,status:'error',data:null}); });
    return () => { active=false; controller.abort(); };
  }, [sellerId,retry]);
  const state=request.sellerId===sellerId ? request : {status:'loading',data:null};
  const data=state.data;
  const max=data ? Math.max(1,...data.days.flatMap(day=>[day.views,day.inquiries])) : 1;
  return (
    <section aria-label="Weekly listing activity" className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl border border-gray-200/70 dark:border-gray-800 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Weekly Listing Activity</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Daily views and new property inquiry threads. Sri Lanka time.</p>
        </div>
        {data && <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{comparisonLabel(data)}</span>}
      </div>
      {state.status==='loading' && <p role="status" className="text-sm text-gray-500">Loading activity...</p>}
      {state.status==='error' && <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-gray-600 dark:text-gray-300">Activity is unavailable. Please try again.</p>
        <button type="button" onClick={()=>setRetry(value=>value+1)} className="text-sm font-semibold text-blue-600 dark:text-blue-400">Retry activity</button>
      </div>}
      {data && <>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{dateLabel(data.periodStart,{day:'numeric',month:'short'})} – {dateLabel(data.periodEnd,{day:'numeric',month:'short',year:'numeric'})}</p>
        {data.current.views===0 && data.current.inquiries===0
          ? <p className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">No recorded activity for active listings in the last 7 days.</p>
          : <div aria-hidden="true" className="flex items-end justify-between gap-2 h-40 border-b border-gray-100 dark:border-gray-800 pb-6 mb-3">
            {data.days.map(day=><div key={day.date} className="relative flex-1 flex items-end justify-center gap-1 h-full" title={`${day.date}: ${day.views} views, ${day.inquiries} new inquiry threads`}>
              <div className="w-3 sm:w-5 bg-blue-500 rounded-t" style={{height:`${day.views/max*100}%`}} />
              <div className="w-3 sm:w-5 bg-emerald-500 rounded-t" style={{height:`${day.inquiries/max*100}%`}} />
              <span className="absolute -bottom-5 text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{dateLabel(day.date,{day:'numeric',month:'short'})}</span>
            </div>)}
          </div>}
        <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-300 mb-4"><span className="flex items-center gap-1"><i className="size-2 bg-blue-500 rounded"/>Views</span><span className="flex items-center gap-1"><i className="size-2 bg-emerald-500 rounded"/>New inquiry threads</span></div>
        <table className="sr-only"><caption>Daily listing activity</caption><thead><tr><th>Date</th><th>Views</th><th>New inquiry threads</th></tr></thead><tbody>{data.days.map(day=><tr key={day.date}><td>{day.date}</td><td>{day.views}</td><td>{day.inquiries}</td></tr>)}</tbody></table>
        <dl className="grid grid-cols-2 gap-3 text-center border-t border-gray-100 dark:border-gray-800 pt-4">
          <div><dt className="text-xs text-gray-500 dark:text-gray-400">Views in last 7 days</dt><dd className="text-lg font-bold text-gray-900 dark:text-white">{data.current.views.toLocaleString()}</dd></div>
          <div><dt className="text-xs text-gray-500 dark:text-gray-400">New inquiry threads</dt><dd className="text-lg font-bold text-gray-900 dark:text-white">{data.current.inquiries.toLocaleString()}</dd></div>
        </dl>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4">Daily view tracking started {new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',day:'numeric',month:'short',year:'numeric'}).format(new Date(data.viewTrackingStartedAt))}.</p>
      </>}
      <dl className="grid grid-cols-2 gap-3 text-center border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
        <div><dt className="text-xs text-gray-500 dark:text-gray-400">Average views / listing</dt><dd className="text-sm font-semibold text-gray-900 dark:text-white">{listingCount > 0 ? Math.round(totalViews / listingCount) : 0}</dd></div>
        <div><dt className="text-xs text-gray-500 dark:text-gray-400">Save rate</dt><dd className="text-sm font-semibold text-gray-900 dark:text-white">{totalViews > 0 ? (totalSaves / totalViews * 100).toFixed(1) : 0}%</dd></div>
      </dl>
      <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 mt-2">All-time totals across current listings.</p>
    </section>
  );
}
