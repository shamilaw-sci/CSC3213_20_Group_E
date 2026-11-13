const fs=require('node:fs'),path=require('node:path');
const parser=require('../../../frontend-react/node_modules/@babel/parser');
const source=fs.readFileSync(path.join(__dirname,'ProfileSettings.before.jsx'),'utf8');
const ast=parser.parse(source,{sourceType:'module',plugins:['jsx']});
function walk(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>walk(x,fn));else if(v&&typeof v==='object')walk(v,fn);}
let jsx;const declarations=[];
walk(ast,n=>{if(n.type==='JSXElement'&&n.openingElement.attributes.some(a=>a.name?.name==='key'&&a.value?.value==='calculator'))jsx=source.slice(n.start,n.end);if(n.type==='VariableDeclaration'&&n.declarations.some(d=>d.id.name==='loanSummary'||d.id.type==='ArrayPattern'&&['calcPrice','calcDownpaymentPercent','calcTenureYears','calcInterestRate'].includes(d.id.elements[0]?.name)))declarations.push(source.slice(n.start,n.end));});
const icons=source.match(/import \{[\s\S]*?\} from 'lucide-react';/)[0].split(/import \{/).pop();
const names='calcPrice,calcDownpaymentPercent,calcTenureYears,calcInterestRate,loanSummary,setCalcPrice,setCalcDownpaymentPercent,setCalcTenureYears,setCalcInterestRate';
fs.writeFileSync(path.join(__dirname,'BeforePanel.jsx'),`import React from 'react';\nimport {${icons}\nimport {m} from 'framer-motion';\nexport default function Before({${names}}){return (${jsx});}`);
let states=declarations.join('\n').replace('useState(35000000)','useState(adjusted?50000000:35000000)').replace('useState(20);','useState(adjusted?30:20);').replace('useState(20);','useState(adjusted?15:20);').replace('useState(11.5)','useState(adjusted?12:11.5)');
const entry=`import React,{useState,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {LazyMotion,domAnimation,m} from 'framer-motion';
import BeforePanel from 'virtual:phase6-before';
import MortgageCalculatorPanel from '/src/components/profile/MortgageCalculatorPanel.jsx';
import '/src/index.css';
const params=new URLSearchParams(location.search);
function Fixture(){const adjusted=params.get('state')==='adjusted';
${states}
const props={${names}};
return <LazyMotion features={domAnimation}>{params.get('version')==='after'?<m.div key="calculator" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}><MortgageCalculatorPanel {...props}/></m.div>:<BeforePanel {...props}/>}</LazyMotion>;
}createRoot(document.getElementById('fixture')).render(<Fixture/>);`;
let runner=fs.readFileSync(path.join(__dirname,'../phase6-profile-visual/server.cjs'),'utf8');
const start=runner.indexOf('const entry = `'),end=runner.indexOf('\n(async () =>');
runner=runner.slice(0,start)+'const entry = '+JSON.stringify(entry)+';\n'+runner.slice(end);
runner=runner.replaceAll('__phase6_searches','__phase6_mortgage');
fs.writeFileSync(path.join(__dirname,'server.cjs'),runner);
console.log('Prepared original calculator JSX and exact source-derived formula in synthetic local fixture.');
