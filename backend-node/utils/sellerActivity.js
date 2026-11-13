const timeZone = 'Asia/Colombo';
const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric', month:'2-digit', day:'2-digit' });
function localDate(value) {
 const parts = Object.fromEntries(dateFormat.formatToParts(value).map(part => [part.type, part.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
const shiftDate = (date, offset) => new Date(Date.parse(`${date}T00:00:00Z`) + offset * 86400000).toISOString().slice(0,10);
function activityWindow(now = new Date()) {
 const today = localDate(now), startDate = shiftDate(today,-13);
 return { today, startDate, dates:Array.from({length:14},(_,index)=>shiftDate(startDate,index)),
  startInstant:new Date(`${startDate}T00:00:00+05:30`).toISOString(),
  endInstant:new Date(`${shiftDate(today,1)}T00:00:00+05:30`).toISOString() };
}
function summarizeActivity(window, views, inquiries, trackingStartedAt) {
 const trackingTime = Date.parse(trackingStartedAt);
 if (!Number.isFinite(trackingTime)) throw new Error('Activity tracking configuration unavailable');
 const counts = new Map(window.dates.map(date=>[date,{date,views:0,inquiries:0}]));
 for (const row of views) {
  const day = counts.get(row.view_date);
  if (!day) continue;
  const count = Number(row.views);
  if (!Number.isSafeInteger(count) || count < 0 || !Number.isSafeInteger(day.views + count)) throw new Error('Invalid activity count');
  day.views += count;
 }
 for (const row of inquiries) {
  if (!row.created_at) continue;
  const instant = new Date(row.created_at);
  if (!Number.isFinite(instant.getTime())) throw new Error('Invalid activity timestamp');
  const day=counts.get(localDate(instant));
  if(day) day.inquiries++;
 }
 const allDays=[...counts.values()], days=allDays.slice(7);
 const total=rows=>rows.reduce((sum,row)=>({views:sum.views+row.views,inquiries:sum.inquiries+row.inquiries}),{views:0,inquiries:0});
 const current=total(days), previous=total(allDays.slice(0,7));
 const comparisonComplete=trackingTime<=Date.parse(window.startInstant);
 const viewChangePercent=comparisonComplete && previous.views>0 ? Math.round(((current.views-previous.views)/previous.views)*1000)/10 : null;
 return {timeZone,periodStart:days[0].date,periodEnd:window.today,viewTrackingStartedAt:trackingStartedAt,days,current,previous,comparisonComplete,viewChangePercent};
}
module.exports={activityWindow,summarizeActivity};
