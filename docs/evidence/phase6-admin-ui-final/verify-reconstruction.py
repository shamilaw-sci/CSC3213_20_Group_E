from pathlib import Path
import re
root = Path(__file__).resolve().parents[3]
before = Path(__file__).with_name('ListingsPage.before.snapshot').read_text(encoding='utf-8')
page = (root / 'frontend-react/src/pages/admin/pages/ListingsPage.jsx').read_text(encoding='utf-8')
dest = root / 'frontend-react/src/pages/admin/components/listings'
modal = (dest / 'ListingDetailsModal.jsx').read_text(encoding='utf-8')
overview = (dest / 'ListingsOverview.jsx').read_text(encoding='utf-8')
a = before.index('const ListingDetailsModal =')
b = before.index('const normalizeListing =')
original_modal = before[a:b].rstrip()
assert modal[modal.index('const ListingDetailsModal ='):modal.index('\n\nexport default')] == original_modal
start = before.index('      {/* Page Header */}')
end = before.index('\n\n    </div>', start)
original_markup = before[start:end]
assert overview[overview.index('      {/* Page Header */}'):overview.index('\n    </>')] == original_markup
reconstructed = re.sub(r'      <ListingsOverview\n[\s\S]*?      />', lambda _: original_markup, page)
reconstructed = reconstructed.replace('const normalizeListing =', before[a:b]+'const normalizeListing =', 1)
# Import changes are the only allowed non-render edits. Compare the complete rest,
# including Leaflet initialization, modal bodies, normalization, queries and actions.
assert reconstructed[reconstructed.index('delete L.Icon.Default'): ] == before[before.index('delete L.Icon.Default'): ]
assert page[page.index('const normalizeListing ='):page.index('      <ListingsOverview')] == before[b:start]
def external_imports(source):
    imports = [re.findall(r'[\'\"]([^\'\"]+)[\'\"]', statement)[-1] for statement in re.findall(r'^import\s+[^;]+;', source, re.MULTILINE)]
    return [name for name in imports if not name.startswith('.')]
assert external_imports(page) == external_imports(before)
for statement in ["import 'leaflet/dist/leaflet.css';", "import L from 'leaflet';", 'import "../styles/admin-global.css";', "import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';", "import iconUrl from 'leaflet/dist/images/marker-icon.png';", "import shadowUrl from 'leaflet/dist/images/marker-shadow.png';"]:
    assert statement in page
print('PASS: exact modal body; exact overview markup; complete parent reconstruction excluding imports; parent normalization/query/mutation/action/filter region exact; Leaflet initialization/CSS/assets retained.')
