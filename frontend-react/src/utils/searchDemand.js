// Only an explicit form submission creates an analytics event. Page loads,
// restored URLs and automatic viewport refreshes do not create new events.
export const newSearchEventId = () => globalThis.crypto?.randomUUID?.() || null;
