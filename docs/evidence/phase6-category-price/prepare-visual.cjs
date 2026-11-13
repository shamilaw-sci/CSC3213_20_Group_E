const fs=require('node:fs'),path=require('node:path'),parser=require('../../../frontend-react/node_modules/@babel/parser');
const source=fs.readFileSync(path.join(__dirname,'AddProperty.before.jsx'),'utf8');
const hook=fs.readFileSync(path.join(__dirname,'usePropertyForm.before.js'),'utf8');
const ast=parser.parse(source,{sourceType:'module',plugins:['jsx']}),ha=parser.parse(hook,{sourceType:'module',plugins:['jsx']});
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}
let jsx,feedback,initial;const declarations={};
walk(ast,n=>{if(n.type==='LogicalExpression'&&n.operator==='&&'&&n.left.type==='BinaryExpression'&&n.left.left.name==='currentStep'&&n.left.right.value===1)jsx=source.slice(n.right.start,n.right.end);if(n.type==='LogicalExpression'&&n.left.type==='MemberExpression'&&n.left.object.name==='message'&&n.left.property.name==='text')feedback=source.slice(n.start,n.end);if(n.type==='VariableDeclaration')for(const d of n.declarations)if(d.id.type==='Identifier')declarations[d.id.name]=source.slice(n.start,n.end);});
let handleChange;walk(ha,n=>{if(n.type==='VariableDeclarator'&&n.id.type==='ArrayPattern'&&n.id.elements[0]?.name==='formData')initial=hook.slice(n.init.arguments[0].start,n.init.arguments[0].end);if(n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='handleChange'))handleChange=hook.slice(n.start,n.end);});
const iconNode=ast.program.body.find(n=>n.type==='ImportDeclaration'&&n.source.value==='lucide-react');
const iconImport=source.slice(iconNode.start,iconNode.end);
const names='formData,isRentType,getTitlePlaceholder,formatLKRPreview,sriLankaDistricts,handleChange,handleTypeSelect,handleDistrictChange,nextStep';
fs.writeFileSync(path.join(__dirname,'BeforePanel.jsx'),`import React from 'react';\n${iconImport}\nimport {m} from 'framer-motion';\nexport default function Before({${names}}){return (${jsx});}`);
const top=['sriLankaDistricts','districtLocations','formatLKRPreview'].map(k=>declarations[k]).join('\n');
const body=['handleTypeSelect','handleDistrictChange','isRentType','isLandType','isHouseType','getTitlePlaceholder','validateStep','nextStep'].map(k=>declarations[k]).join('\n');
const entry=`import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LazyMotion,domAnimation,m} from 'framer-motion';
import {AlertCircle} from 'lucide-react';
import BeforePanel from 'virtual:phase6-before';
import CategoryPriceStep from '/src/components/property/create/CategoryPriceStep.jsx';
import '/src/index.css';
import '/src/components/layout/Navbar.css';
import 'leaflet/dist/leaflet.css';
${top}
const params=new URLSearchParams(location.search),scenario=params.get('state')||'House';
function Feedback({message}){return <>{${feedback}}</>;}
function Fixture(){
const [formData,setFormData]=useState(()=>{const data=${initial};if(['empty','zero','numberzero'].includes(scenario))return {...data,title:scenario==='empty'?'':'Synthetic zero',price:scenario==='zero'?'0':scenario==='numberzero'?0:'',district:scenario==='empty'?'':'Kandy'};return {...data,type:scenario,listingType:scenario.startsWith('Rent')?'Rent':'Sale',title:'Synthetic '+scenario,price:scenario==='Land'?'1500000':scenario.startsWith('Rent')?'125000':'35000000',district:'Kandy',contactNumber:'0000000000',pricePeriod:scenario==='Rent Villa'?'Year':scenario==='Rent House'?'Month':'',latitude:7.2906,longitude:80.6337};});
const [message,setMessage]=useState({type:'',text:''}),[currentStep,setCurrentStep]=useState(1);
const locationMode='point',boundaryCoordinates=[],images=[];
${handleChange}
${body}
const onContinue=params.get('validation')==='1'?nextStep:e=>e.preventDefault();
const props={formData,isRentType,titlePlaceholder:getTitlePlaceholder(),pricePreview:formData.price&&formatLKRPreview(formData.price,isRentType?formData.pricePeriod:null),districts:sriLankaDistricts,onChange:handleChange,onTypeSelect:handleTypeSelect,onDistrictChange:handleDistrictChange,onContinue};
const after=params.get('version')==='after';
return <LazyMotion features={domAnimation}><div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 selection:bg-blue-600 selection:text-white"><Feedback message={message}/><div id="step-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">{currentStep===1?(after?<m.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="space-y-6"><CategoryPriceStep {...props}/></m.div>:<BeforePanel formData={formData} isRentType={isRentType} getTitlePlaceholder={getTitlePlaceholder} formatLKRPreview={formatLKRPreview} sriLankaDistricts={sriLankaDistricts} handleChange={handleChange} handleTypeSelect={handleTypeSelect} handleDistrictChange={handleDistrictChange} nextStep={onContinue}/>):<p>Synthetic next-step callback reached</p>}</div></div></LazyMotion>;
}createRoot(document.getElementById('fixture')).render(<Fixture/>);`;
let runner=fs.readFileSync(path.join(__dirname,'../phase6-profile-visual/server.cjs'),'utf8');
const start=runner.indexOf('const entry = `'),end=runner.indexOf('\n(async () =>');
runner=runner.slice(0,start)+'const entry = '+JSON.stringify(entry)+';\n'+runner.slice(end);
runner=runner.replaceAll('__phase6_searches','__phase6_category_price');
fs.writeFileSync(path.join(__dirname,'server.cjs'),runner);
console.log('Prepared original Step1 markup/parent helper copies and actual extracted module; no hook/API/map runtime.');
