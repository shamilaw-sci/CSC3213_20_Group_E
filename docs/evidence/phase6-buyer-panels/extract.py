from pathlib import Path

root = Path(__file__).resolve().parents[3]
page = root / 'frontend-react/src/pages/BuyerDashboard.jsx'
source = page.read_text(encoding='utf-8')
panels = [
    ('appointments', 'BuyerAppointmentsPanel', 'appointments, navigate, handleCancelAppointment', 'Calendar, ChevronRight, Clock, ShieldCheck, Trash2, MessageSquare, Phone'),
    ('favorites', 'BuyerFavoritesPanel', 'favorites, navigate, handleRemoveFavorite', 'Heart, ChevronRight, Trash2, MapPin, Bed, Bath, Maximize'),
    ('searches', 'BuyerSavedSearchesPanel', 'savedSearches, navigate, handleDeleteSearch', 'Search, Trash2, ChevronRight'),
]
for tab, name, props, icons in panels:
    start = source.index("                {activeTab === '" + tab + "' && (\n") + len("                {activeTab === '" + tab + "' && (\n")
    end = source.index('\n                )}', start)
    jsx = source[start:end]
    jsx = '\n'.join(line[16:] if line.startswith('                ') else line for line in jsx.splitlines())
    child = "import React from 'react';\nimport { " + icons + " } from 'lucide-react';\n\nconst " + name + ' = ({ ' + props + ' }) => {\n    return (\n' + jsx + '\n    );\n};\n\nexport default ' + name + ';\n'
    (root / 'frontend-react/src/components/dashboard' / (name + '.jsx')).write_text(child, encoding='utf-8')
    call = '<' + name + ' ' + ' '.join(p + '={' + p + '}' for p in props.split(', ')) + ' />'
    source = source[:start] + '                    ' + call + source[end:]
source = ''.join("import " + name + " from '../components/dashboard/" + name + "';\n" for _, name, _, _ in panels) + source
page.write_text(source, encoding='utf-8')
