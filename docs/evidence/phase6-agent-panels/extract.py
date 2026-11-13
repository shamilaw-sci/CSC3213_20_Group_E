from pathlib import Path
p=Path('frontend-react/src/pages/agent/Dashboard.jsx')
s=p.read_text(encoding='utf-8')
items=[('overview','pipeline','AgentOverviewPanel','PIPELINE_STAGES, pipeline, totalLeads, setActiveTab, properties, navigate, reviewCount, avgRating, recentActivity','Building2, ChevronRight, MapPin, Eye, Award, Clock'),('properties','messages','AgentPropertiesPanel','properties, activeListingsCount, pendingListingsCount, setPropertyFilter, propertyFilter, filteredProperties, navigate','Home, MapPin, Eye')]
for tab,nexttab,name,props,icons in items:
    inner=s.index("                {activeTab === '"+tab+"' && (\n")+len("                {activeTab === '"+tab+"' && (\n")
    end=s.rfind('                )}',inner,s.index("                {activeTab === '"+nexttab+"' && (",inner))
    markup=s[inner:end]
    Path(f'frontend-react/src/components/dashboard/{name}.jsx').write_text(f"import React from 'react';\nimport {{ {icons} }} from 'lucide-react';\n\nconst {name} = ({{ {props} }}) => (\n"+markup+f");\n\nexport default {name};\n",encoding='utf-8')
    attrs=' '.join(f'{x.strip()}={{{x.strip()}}}' for x in props.split(','))
    s=s[:inner]+f'                    <{name} {attrs} />\n'+s[end:]
s=s.replace("import AgentKpiCards from '../../components/dashboard/AgentKpiCards';", "import AgentKpiCards from '../../components/dashboard/AgentKpiCards';\nimport AgentOverviewPanel from '../../components/dashboard/AgentOverviewPanel';\nimport AgentPropertiesPanel from '../../components/dashboard/AgentPropertiesPanel';")
p.write_text(s,encoding='utf-8')
