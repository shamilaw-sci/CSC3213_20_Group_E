import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Navbar from './Navbar';
const state=vi.hoisted(()=>({user:{id:'agent',role:'AGENT',name:'Agent'},leads:[{id:'booking-1',is_direct_booking:true,lead_status:'New',buyer:{name:'Guest Buyer'},properties:{title:'Lake House'}}]}));
vi.mock('../../context/UserAuthContext',()=>({useAuth:()=>({user:state.user})}));
vi.mock('../../context/ThemeProvider',()=>({useTheme:()=>({isDark:false,changeTheme:vi.fn()})}));
vi.mock('../../hooks/usePoll',()=>({default:(url,_interval,options)=>({data:options.enabled?(url==='/agents/leads'?{leads:state.leads}:{unreadCount:0,recentMessages:[]}):null})}));
function Location(){const location=useLocation();return <output>{location.pathname+location.search}</output>;}
afterEach(cleanup);
beforeEach(()=>{state.user={id:'agent',role:'AGENT',name:'Agent'};});
test('Smart Search opens the search results route for guests', () => {
  state.user = null;
  render(<MemoryRouter><Navbar /><Location /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Smart Search' }));
  expect(screen.getByText('/search')).toBeInTheDocument();
});
test('Agent bell lists actual pending appointment and opens that booking',()=>{
 render(<MemoryRouter><Navbar/><Location/></MemoryRouter>);
 const bell=screen.getByRole('button',{name:'Notifications'});
 expect(bell).toHaveAttribute('aria-expanded','false');
 fireEvent.click(bell);
 expect(bell).toHaveAttribute('aria-expanded','true');
 fireEvent.click(screen.getByRole('button',{name:/Guest Buyer.*Lake House/}));
 expect(screen.getByText('/agent-dashboard?appointment=booking-1')).toBeInTheDocument();
 expect(screen.getByText('1 awaiting response')).toBeInTheDocument();
});
test('booking entries are absent for Buyer accounts',()=>{
 state.user={id:'buyer',role:'BUYER',name:'Buyer'};
 render(<MemoryRouter><Navbar/></MemoryRouter>);expect(screen.queryByRole('button',{name:/Guest Buyer/})).not.toBeInTheDocument();
});

test('notification toggle supports focus and Escape closes the popup',()=>{
 render(<MemoryRouter><Navbar/></MemoryRouter>);
 const bell=screen.getByRole('button',{name:'Notifications'});
 bell.focus();fireEvent.click(bell);
 const booking=screen.getByRole('button',{name:/Guest Buyer.*Lake House/});
 booking.focus();fireEvent.keyDown(booking,{key:'Escape'});
 expect(bell).toHaveAttribute('aria-expanded','false');
 expect(bell).toHaveFocus();
 expect(screen.queryByRole('button',{name:/Guest Buyer.*Lake House/})).not.toBeInTheDocument();
});
