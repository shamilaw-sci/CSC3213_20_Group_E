from pathlib import Path
import re
root = Path(__file__).resolve().parents[3]
page = root / 'frontend-react/src/pages/admin/pages/ListingsPage.jsx'
dest = root / 'frontend-react/src/pages/admin/components/listings'
s = page.read_text(encoding='utf-8')
assert 'const ListingDetailsModal =' in s, 'Extraction already applied; do not replace original evidence.'
Path(__file__).with_name('ListingsPage.before.snapshot').write_text(s, encoding='utf-8')
a = s.index('const ListingDetailsModal =')
b = s.index('const normalizeListing =')
modal = s[a:b].rstrip()
icons = re.search(r'import \{ \n  Building2,[\s\S]*?from "lucide-react";', s).group()
def used_import(body):
    names = re.search(r'import \{([\s\S]*?)\} from "lucide-react";', icons).group(1).split(',')
    return 'import { ' + ', '.join(n.strip() for n in names if re.search(r'\b'+n.strip()+r'\b',body)) + ' } from "lucide-react";\n'
dest.joinpath('ListingDetailsModal.jsx').write_text('import React, { useState } from "react";\nimport { MapContainer, TileLayer, Marker, Polygon, Popup } from "react-leaflet";\n'+used_import(modal)+'\n'+modal+'\n\nexport default ListingDetailsModal;\n',encoding='utf-8')
s=s[:a]+s[b:]
a=s.index('      {/* Page Header */}')
b=s.index('\n\n    </div>',a)
markup=s[a:b]
body='const ListingsOverview = ({ search, setSearch, listings, filter, setFilter, filteredListings, handleViewDetails, handleDelete }) => (\n    <>\n'+markup+'\n    </>\n);'
dest.joinpath('ListingsOverview.jsx').write_text('import React from "react";\n'+used_import(body)+'\n'+body+'\n\nexport default ListingsOverview;\n',encoding='utf-8')
s=s[:a]+'''      <ListingsOverview
        search={search}
        setSearch={setSearch}
        listings={listings}
        filter={filter}
        setFilter={setFilter}
        filteredListings={filteredListings}
        handleViewDetails={handleViewDetails}
        handleDelete={handleDelete}
      />'''+s[b:]
# Retain all external import statements and their order, removing moved bindings only.
s=s.replace("import { MapContainer, TileLayer, Marker, Polygon, Popup } from 'react-leaflet';", "import 'react-leaflet';")
s=s.replace(icons+'\n', 'import "lucide-react";\n')
s='import ListingDetailsModal from "../components/listings/ListingDetailsModal";\nimport ListingsOverview from "../components/listings/ListingsOverview";\n'+s
page.write_text(s,encoding='utf-8')
