const { activityWindow, summarizeActivity } = require('../utils/sellerActivity');
test('Sri Lankan calendar boundary defines exactly fourteen days', () => {
 const before = activityWindow(new Date('2026-11-13T18:29:59Z'));
 const after = activityWindow(new Date('2026-11-13T18:30:00Z'));
 expect(before.today).toBe('2026-11-13');
 expect(after.today).toBe('2026-11-14');
 expect(after.startDate).toBe('2026-11-01');
 expect(after.startInstant).toBe('2026-10-31T18:30:00.000Z');
 expect(after.endInstant).toBe('2026-11-14T18:30:00.000Z');
});
test('aggregates real daily views and inquiries, filling missing dates with zero', () => {
 const window = activityWindow(new Date('2026-11-14T10:00:00Z'));
 const result = summarizeActivity(window, [ { view_date:'2026-11-14',views:4 }, { view_date:'2026-11-14',views:3 }, { view_date:'2026-11-01',views:2 } ], [{created_at:'2026-11-13T18:35:00Z'},{created_at:'2026-11-13T18:25:00Z'}], '2026-10-01T00:00:00Z');
 expect(result.days).toHaveLength(7);
 expect(result.days[6]).toEqual({date:'2026-11-14',views:7,inquiries:1});
 expect(result.days[5]).toEqual({date:'2026-11-13',views:0,inquiries:1});
 expect(result.current).toEqual({views:7,inquiries:2});
 expect(result.previous.views).toBe(2);
 expect(result.viewChangePercent).toBe(250);
});
test('does not invent percentage for empty prior period or incomplete view history', () => {
 const w=activityWindow(new Date('2026-11-14T10:00:00Z'));
 expect(summarizeActivity(w, [], [], '2026-10-01T00:00:00Z').viewChangePercent).toBeNull();
 const result=summarizeActivity(w,[{view_date:'2026-11-14',views:3}],[], '2026-11-14T08:00:00Z');
 expect(result.comparisonComplete).toBe(false);
 expect(result.viewChangePercent).toBeNull();
});
test('drops out-of-window data and rejects malformed counts', () => {
 const w=activityWindow(new Date('2026-11-14T10:00:00Z'));
 expect(summarizeActivity(w,[{view_date:'2026-10-01',views:100}],[], '2026-10-01T00:00:00Z').current.views).toBe(0);
 expect(()=>summarizeActivity(w,[{view_date:'2026-11-14',views:-1}],[], '2026-10-01T00:00:00Z')).toThrow();
});
