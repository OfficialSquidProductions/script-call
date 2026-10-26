"""Check actual Windows dense PDF exports with pypdf (development-only QA)."""
from pathlib import Path
from pypdf import PdfReader
import json

root = Path(__file__).resolve().parents[1]
results = []
for paper in ('A4', 'Letter'):
    for preset in ('gcasper', 'narrative', 'commercial', 'compact'):
        file = root / 'verification' / f'Print-Fixture-{paper}-{preset}.pdf'
        reader = PdfReader(file)
        texts = [page.extract_text() or '' for page in reader.pages]
        text = '\n'.join(texts)
        missing = [n for n in range(2, 201) if f'Crew {n:03d}' not in text]
        assert not missing, (file.name, 'Missing crew rows', missing)
        orphan_stamps = [i+1 for i,t in enumerate(texts) if len(t.strip()) < 140 and 'Personal contacts excluded.' in t]
        assert not orphan_stamps, (file.name, 'Footer-only pages', orphan_stamps)
        expected = (595, 842) if paper == 'A4' else (612, 792)
        assert all(abs(float(p.mediabox.width)-expected[0]) < 1 and abs(float(p.mediabox.height)-expected[1]) < 1 for p in reader.pages)
        results.append(dict(file=file.name,pages=len(reader.pages),paper=paper,preset=preset,all199NumberedCrewRowsPresent=True,noFooterOnlyPages=True))
output = root / 'verification/windows/pdf-content-results.json'
output.write_text(json.dumps(dict(status='passed',results=results),indent=2),encoding='utf-8')
print(output)
print(json.dumps(results,indent=2))
