const fs=require('node:fs'),path=require('node:path');
const {parse}=require('../../../frontend-react/node_modules/@babel/parser');
const dir=__dirname;
const before=fs.readFileSync(path.join(dir,'AddProperty.before.jsx'),'utf8');
const after=fs.readFileSync('frontend-react/src/pages/AddProperty.jsx','utf8');
const hook=fs.readFileSync(path.join(dir,'usePropertyForm.before.js'),'utf8');
const ast=s=>parse(s,{sourceType:'module',plugins:['jsx']});
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}
const declarations={};let initial,handleChange,feedback;
walk(ast(before),n=>{if(n.type==='VariableDeclaration')for(const d of n.declarations)if(d.id.name)declarations[d.id.name]=before.slice(n.start,n.end);if(n.type==='LogicalExpression'&&n.left.type==='MemberExpression'&&n.left.object.name==='message'&&n.left.property.name==='text')feedback=before.slice(n.start,n.end);});
walk(ast(hook),n=>{if(n.type==='VariableDeclarator'&&n.id.type==='ArrayPattern'&&n.id.elements[0]?.name==='formData')initial=hook.slice(n.init.arguments[0].start,n.init.arguments[0].end);if(n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='handleChange'))handleChange=hook.slice(n.start,n.end);});
const imports=`import React from 'react';import {m} from 'framer-motion';import {MapContainer,TileLayer,Marker,Polygon,CircleMarker} from 'react-leaflet';import {ArrowLeft,ArrowRight,Compass} from 'lucide-react';import {MapClickEvents,customIcon,MapObserver} from 'virtual:phase6-common';`;
const props='formData,setFormData,handleChange,locationMode,setLocationMode,boundaryCoordinates,setBoundaryCoordinates,gpsActive,setGpsActive,handleGetGPS,prevStep,nextStep,setObservation';
function panel(source,name){let jsx;walk(ast(source),n=>{if(n.type==='LogicalExpression'&&n.left.type==='BinaryExpression'&&n.left.left.name==='currentStep'&&n.left.right.value===2)jsx=source.slice(n.right.start,n.right.end);});jsx=jsx.replace('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png','/__phase6_assets/tile.svg').replace('</MapContainer>','<MapObserver onObservation={setObservation}/></MapContainer>');fs.writeFileSync(path.join(dir,name+'.jsx'),imports+(name==='AfterPanel'?`import LocationStep from '/src/components/property/create/LocationStep.jsx';`:'')+`export default function ${name}({${props}}){return (${jsx});}`);}
panel(before,'BeforePanel');panel(after,'AfterPanel');
const common=`import React,{useEffect} from 'react';import {useMap,useMapEvents} from 'react-leaflet';import L from 'leaflet';
${declarations.MapClickEvents}
${declarations.customIcon.replace('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png','/__phase6_assets/marker-icon.png').replace('https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png','/__phase6_assets/marker-shadow.png')}
const identity=new WeakMap();let created=0,removed=0;
function MapObserver({onObservation}){const map=useMap();useEffect(()=>{if(!identity.has(map))identity.set(map,++created);const id=identity.get(map);const refresh=()=>onObservation({id,created,removed,alive:true,center:[map.getCenter().lat,map.getCenter().lng].map(n=>Number(n.toFixed(8))),zoom:map.getZoom()});const unload=()=>{removed++;onObservation({id,created,removed,alive:false});};map.on('moveend zoomend click',refresh);map.once('unload',unload);refresh();return()=>map.off('moveend zoomend click',refresh);},[map,onObservation]);return null;}
export {MapClickEvents,customIcon,MapObserver};`;
fs.writeFileSync(path.join(dir,'Common.jsx'),common);
const entry=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {LazyMotion,domAnimation,m} from 'framer-motion';import {AlertCircle} from 'lucide-react';import BeforePanel from 'virtual:phase6-before';import AfterPanel from 'virtual:phase6-after';import '/src/index.css';import '/src/components/layout/Navbar.css';import 'leaflet/dist/leaflet.css';
const params=new URLSearchParams(location.search),state=params.get('state')||'point';
const vertices=[[7.29,80.63],[7.292,80.634],[7.288,80.635]];
function Feedback({message}){return <>{${feedback}}</>;}
function Fixture(){const [formData,setFormData]=useState(()=>({...${initial},city:state==='blank'?'':' Synthetic town ',address:state==='blank'?'':' Synthetic address ',latitude:7.2906,longitude:80.6337}));const [locationMode,setLocationMode]=useState(state.startsWith('boundary')?'boundary':'point');const [boundaryCoordinates,setBoundaryCoordinates]=useState(()=>state==='boundary-partial'?vertices.slice(0,2):state==='boundary-closed'?[vertices[0],vertices[1],vertices[0]]:state==='boundary-valid'?vertices:state==='boundary-closedvalid'?[...vertices,vertices[0]]:[]);const [gpsActive,setGpsActive]=useState(state==='gps');const [currentStep,setCurrentStep]=useState(2);const [message,setMessage]=useState({type:'',text:''});const [observation,setObservation]=useState({});const [lastAlert,setLastAlert]=useState('');const images=[];
Object.defineProperty(navigator,'geolocation',{configurable:true,value:params.get('gps')==='unsupported'?undefined:{getCurrentPosition(success,failure){if(params.get('gps')==='failure')failure({code:1});else success({coords:{latitude:6.9,longitude:79.8}});}}});window.alert=text=>setLastAlert(text);
${handleChange}
${['handleGetGPS','validateStep','nextStep','prevStep'].map(k=>declarations[k]).join('\n')}
const Panel=params.get('version')==='after'?AfterPanel:BeforePanel;const props={formData,setFormData,handleChange,locationMode,setLocationMode,boundaryCoordinates,setBoundaryCoordinates,gpsActive,setGpsActive,handleGetGPS,prevStep,nextStep,setObservation};
return <LazyMotion features={domAnimation}><div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 selection:bg-blue-600 selection:text-white"><Feedback message={message}/><div id="step-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">{currentStep===2?<Panel {...props}/>:<p>Synthetic step {currentStep}; map unmounted</p>}</div><aside aria-label="Private verification observer" className="mt-4 text-xs"><pre id="map-probe">{JSON.stringify(observation)}</pre><p id="form-probe">{JSON.stringify({city:formData.city,address:formData.address,latitude:formData.latitude,longitude:formData.longitude,locationMode,gpsActive,boundaryCoordinates,currentStep,lastAlert})}</p><button type="button" onClick={()=>setCurrentStep(2)}>Return to Spatial Location</button></aside></div></LazyMotion>;}
createRoot(document.getElementById('fixture')).render(<Fixture/>);`;
fs.writeFileSync(path.join(dir,'Entry.jsx'),entry);
console.log('Prepared original/current Step2 with real Leaflet, source-derived handlers, local imagery and synthetic GPS.');
