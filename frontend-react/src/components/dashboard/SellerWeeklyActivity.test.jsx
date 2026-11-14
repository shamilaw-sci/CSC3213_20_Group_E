import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SellerWeeklyActivity from './SellerWeeklyActivity';
const api=vi.hoisted(()=>({get:vi.fn()}));
vi.mock('../../context/api',()=>({default:api}));
const activity=()=>({timeZone:'Asia/Colombo',periodStart:'2026-11-08',periodEnd:'2026-11-14',viewTrackingStartedAt:'2026-11-14T00:00:00Z',
 days:Array.from({length:7},(_,i)=>({date:`2026-11-${String(8+i).padStart(2,'0')}`,views:i===6?7:0,inquiries:i===6?2:0})),current:{views:7,inquiries:2},previous:{views:0,inquiries:0},comparisonComplete:false,viewChangePercent:null});
beforeEach(()=>vi.resetAllMocks());afterEach(cleanup);
test('renders recorded daily counts and incomplete-history state without sample demand',async()=>{
 api.get.mockResolvedValue({data:activity()});render(<SellerWeeklyActivity sellerId="seller"/>);
 expect(await screen.findByText('Building comparison history')).toBeInTheDocument();
 expect(screen.getByRole('table',{name:'Daily listing activity'})).toHaveTextContent('7');
 expect(screen.getByRole('table',{name:'Daily listing activity'})).toHaveTextContent('2');
 expect(screen.queryByText(/18.4%|High Demand/)).not.toBeInTheDocument();
});
test('zero activity is an explicit empty state',async()=>{
 const data=activity();data.days=data.days.map(day=>({...day,views:0,inquiries:0}));data.current={views:0,inquiries:0};
 api.get.mockResolvedValue({data});render(<SellerWeeklyActivity sellerId="seller"/>);
 expect(await screen.findByText(/No recorded activity/)).toBeInTheDocument();
});
test('failed request offers retry instead of a fabricated zero graph',async()=>{
 api.get.mockRejectedValueOnce(Error('offline')).mockResolvedValueOnce({data:activity()});render(<SellerWeeklyActivity sellerId="seller"/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Activity is unavailable');
 fireEvent.click(screen.getByRole('button',{name:'Retry activity'}));
 expect(await screen.findByText('Building comparison history')).toBeInTheDocument();
});
test('old account response cannot replace another Seller activity',async()=>{
 let finish;api.get.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValueOnce({data:activity()});
 const view=render(<SellerWeeklyActivity sellerId="first"/>);view.rerender(<SellerWeeklyActivity sellerId="second"/>);
 await screen.findByText('Building comparison history');
 finish({data:{...activity(),current:{views:999,inquiries:999}}});
 await waitFor(()=>expect(screen.queryByText('999')).not.toBeInTheDocument());
});
