const fs = require('node:fs');
const path = require('node:path');
const parser = require('../../../frontend-react/node_modules/@babel/parser');
const source = fs.readFileSync(path.join(__dirname,'ProfileSettings.before.jsx'),'utf8');
const ast = parser.parse(source,{sourceType:'module',plugins:['jsx']});
const icons = source.match(/import \{[\s\S]*?\} from 'lucide-react';/)[0].split(/import \{/).pop();
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const v of Object.values(node))if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}
for(const key of ['appointments','favorites']){
 let jsx;walk(ast,n=>{if(n.type==='JSXElement'&&n.openingElement.attributes.some(a=>a.name?.name==='key'&&a.value?.value===key))jsx=source.slice(n.start,n.end);});
 fs.writeFileSync(path.join(__dirname,`Before-${key}.jsx`),`import React from 'react';\nimport { ${icons}\nimport {m} from 'framer-motion';\nexport default function Before({appointments,favorites,navigate,handleCancelAppointment,handleRemoveFavorite}){return (${jsx});}\n`);
}
const entry = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {LazyMotion,domAnimation,m} from 'framer-motion';
import BeforeAppointments from 'virtual:phase6-before-appointments';
import BeforeFavorites from 'virtual:phase6-before-favorites';
import AppointmentsPanel from '/src/components/profile/AppointmentsPanel.jsx';
import FavoritesPanel from '/src/components/profile/FavoritesPanel.jsx';
import '/src/index.css';
const p=new URLSearchParams(location.search), noop=()=>{};
const picture='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#cbd5e1"/></svg>');
const appointments=p.get('state')==='empty'?[]:['Active','Attempted Contact','Closed','New'].map((status,i)=>({lead_id:'fixture-'+i,lifecycle_status:status,created_at:'2026-11-01T06:00:00Z',lead_source:i===0?'Property Tour':null,assigned_agent:i===3?null:{id:'agent-'+i,name:'Synthetic Agent '+i,phone:i===0?'0000000000':null,avatar_url:picture,agent_profiles:i===0?{agency_name:'Synthetic Agency',license_number:'TEST-ONLY'}:{}},properties:i===0?{title:'Synthetic Kandy Home',price:25000000}:null}));
const favorites=p.get('state')==='empty'?[]:[{id:'property-1',title:'Synthetic Kandy Home',price:25000000,city:'Kandy',district:'Kandy',bedrooms:3,bathrooms:2,land_size:'12 perches',images:[picture]},{id:'property-2',title:'Synthetic Zero Defaults',city:'Colombo',district:'Colombo',images:[picture]}];
const ap={appointments,onFindAgent:noop,onViewAgent:noop,onCancel:noop,onMessage:noop},fp={favorites,onExplore:noop,onRemove:noop,onViewDetails:noop};
const beforeProps={appointments,favorites,navigate:noop,handleCancelAppointment:noop,handleRemoveFavorite:noop};
const isA=p.get('panel')==='appointments';
const before=isA?<BeforeAppointments {...beforeProps}/>:<BeforeFavorites {...beforeProps}/>;
const after=<m.div key={isA?'appointments':'favorites'} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>{isA?<AppointmentsPanel {...ap}/>:<FavoritesPanel {...fp}/>}</m.div>;
createRoot(document.getElementById('fixture')).render(<LazyMotion features={domAnimation}>{p.get('version')==='after'?after:before}</LazyMotion>);
`;
let runner = fs.readFileSync(path.join(__dirname,'../phase6-profile-visual/server.cjs'),'utf8');
const start=runner.indexOf('const entry = `'), end=runner.indexOf('\n(async () =>');
runner=runner.slice(0,start)+'const entry = '+JSON.stringify(entry)+';\n'+runner.slice(end);
runner=runner.replace("if(id==='\\0virtual:phase6-before') return fs.readFileSync(path.join(__dirname,'BeforePanel.jsx'),'utf8');", "if(id.startsWith('\\0virtual:phase6-before-')) return fs.readFileSync(path.join(__dirname,'Before-'+id.split('before-')[1]+'.jsx'),'utf8');");
runner=runner.replace("id==='\\0virtual:phase6-before'", "id.startsWith('\\0virtual:phase6-before-')");
runner=runner.replaceAll('__phase6_searches','__phase6_panels');
runner=runner.replace('<title>Private Phase 6 panel comparison</title>','<style>.animate-pulse{animation-play-state:paused!important}</style><title>Private Phase 6 panel comparison</title>');
fs.writeFileSync(path.join(__dirname,'server.cjs'),runner);
console.log('Prepared exact original panel branches; synthetic callbacks/data only.');

