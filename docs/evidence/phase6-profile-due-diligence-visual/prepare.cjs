const fs=require('node:fs'),path=require('node:path');
const parser=require('../../../frontend-react/node_modules/@babel/parser');
const source=fs.readFileSync(path.join(__dirname,'ProfileSettings.before.jsx'),'utf8');
const ast=parser.parse(source,{sourceType:'module',plugins:['jsx']});
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}
let jsx,defaults,toggle;
walk(ast,n=>{if(n.type==='JSXElement'&&n.openingElement.attributes.some(a=>a.name?.name==='key'&&a.value?.value==='dueDiligence'))jsx=source.slice(n.start,n.end);if(n.type==='VariableDeclaration')for(const d of n.declarations){if(d.id.type==='ArrayPattern'&&d.id.elements[0]?.name==='checkedItems')defaults=source.slice(d.init.arguments[0].start,d.init.arguments[0].end);if(d.id.name==='toggleCheckItem')toggle=source.slice(n.start,n.end);}});
const icons=source.match(/import \{[\s\S]*?\} from 'lucide-react';/)[0].split(/import \{/).pop();
fs.writeFileSync(path.join(__dirname,'BeforePanel.jsx'),`import React from 'react';\nimport {${icons}\nimport {m} from 'framer-motion';\nexport default function Before({checkedItems,toggleCheckItem}){return (${jsx});}`);
const entry=`import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LazyMotion,domAnimation,m} from 'framer-motion';
import BeforePanel from 'virtual:phase6-before';
import DueDiligencePanel from '/src/components/profile/DueDiligencePanel.jsx';
import '/src/index.css';
const params=new URLSearchParams(location.search);
function Fixture(){const defaults=${defaults};const state=params.get('state');
const [checkedItems,setCheckedItems]=useState(()=>state==='all'?Object.fromEntries(Object.keys(defaults).map(k=>[k,true])):state==='none'?Object.fromEntries(Object.keys(defaults).map(k=>[k,false])):defaults);
${toggle}
return <LazyMotion features={domAnimation}>{params.get('version')==='after'?<m.div key="dueDiligence" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><DueDiligencePanel checkedItems={checkedItems} onToggleCheckItem={toggleCheckItem}/></m.div>:<BeforePanel checkedItems={checkedItems} toggleCheckItem={toggleCheckItem}/>}</LazyMotion>;
}createRoot(document.getElementById('fixture')).render(<Fixture/>);`;
let runner=fs.readFileSync(path.join(__dirname,'../phase6-profile-visual/server.cjs'),'utf8');
const start=runner.indexOf('const entry = `'),end=runner.indexOf('\n(async () =>');
runner=runner.slice(0,start)+'const entry = '+JSON.stringify(entry)+';\n'+runner.slice(end);
runner=runner.replaceAll('__phase6_searches','__phase6_due_diligence');
fs.writeFileSync(path.join(__dirname,'server.cjs'),runner);
console.log('Prepared exact original checklist JSX/default values/toggle in synthetic local fixture.');
