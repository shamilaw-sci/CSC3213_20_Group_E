import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ProfileSettings from './ProfileSettings';
import api from '../context/api';
const auth = vi.hoisted(() => ({ user: { id:'u1',role:'BUYER',name:'Tester',email:'test@example.test' }, login:vi.fn() }));
vi.mock('../context/UserAuthContext',()=>({useAuth:()=>auth}));
vi.mock('../context/ThemeProvider',()=>({useTheme:()=>({theme:'light',changeTheme:vi.fn()})}));
vi.mock('../context/api',()=>({default:{get:vi.fn(),put:vi.fn()}}));
vi.mock('../components/layout/Navbar',()=>({default:()=>null}));
vi.mock('../components/layout/Footer',()=>({default:()=>null}));
vi.mock('framer-motion',()=>({AnimatePresence:({children})=>children,m:{div:({children,initial:_i,animate:_a,exit:_e,layoutId:_l,...props})=><div {...props}>{children}</div>}}));
beforeEach(()=>{vi.clearAllMocks();api.get.mockResolvedValue({data:{}});api.put.mockResolvedValue({data:{user:auth.user}});});
afterEach(cleanup);
async function mount(){let result;await act(async()=>{result=render(<MemoryRouter><ProfileSettings /></MemoryRouter>);});return result.container;}
test('invalid phone blocks profile save with actionable feedback',async()=>{
 const container=await mount();fireEvent.change(container.querySelector('[name="phone"]'),{target:{value:'123'}});
 fireEvent.submit(container.querySelector('form'));
 expect(await screen.findByText(/Enter a valid phone number/)).toBeTruthy();expect(api.put).not.toHaveBeenCalled();
});
test.each(['','077 123 4567','+94 77 123 4567','+1 (202) 555-0123','0044 20 7946 0958'])('valid optional phone preserves format %s',async phone=>{
 const container=await mount();fireEvent.change(container.querySelector('[name="phone"]'),{target:{value:phone}});
 await act(async()=>fireEvent.submit(container.querySelector('form')));
 expect(api.put).toHaveBeenCalledWith('/auth/profile',expect.objectContaining({phone}));
});
test('current password label explains the limited requirement',async()=>{
 await mount();expect(screen.getByText('Current Password (Required for email or password changes)')).toBeTruthy();
});
