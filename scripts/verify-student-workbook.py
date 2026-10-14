from pathlib import Path
import pymupdf,json,hashlib
from PIL import Image,ImageOps,ImageDraw
R=Path(__file__).resolve().parents[1]; root=R/'artifacts/pdf-review'
m=json.loads((R/'content/student-workbook.json').read_text(encoding='utf-8'))
p=R/'public'/m['path']; d=pymupdf.open(p)
assert len(d)==m['pages'];assert hashlib.sha256(p.read_bytes()).hexdigest()==m['sha256']
assert sum(page.rect.width>800 for page in d)==31, 'Every screenshot occupies one landscape page'
assert d.embfile_count()==5
for name in d.embfile_names():
 original=R/'public/documents'/('originals/'+name if name.endswith('.hwp') else 'text/'+name)
 assert d.embfile_get(name)==original.read_bytes(),name
text='\n'.join(page.get_text() for page in d)
for term in ['컨텍스트','확인한 사실','아직 확인할 것','12,000천원','130,000원','150,000원','시행예정','프롬프트','문서번호']:
 assert term in text,term
for name,sha in m['inputs'].items(): assert hashlib.sha256((R/name).read_bytes()).hexdigest()==sha,name
course=json.loads((R/'artifacts/workbook-data.json').read_text(encoding='utf-8'))
for lesson in course['lessons']:
 title=f'실습 {lesson["number"]} - {lesson["title"]}'
 assert any(row[1]==title for row in d.get_toc()),title
issues=[]
for i,page in enumerate(d):
 w,h=page.rect.width,page.rect.height
 for block in page.get_text('dict')['blocks']:
  if block['type']!=0:continue
  for line in block['lines']:
   for s in line['spans']:
    x0,y0,x1,y1=s['bbox']
    if x0<39 or x1>w-39 or y0<8 or y1>h-9:issues.append({'page':i+1,'text':s['text'],'bounds':s['bbox']})
assert not issues,issues
# All final pages are represented, including the last page. Contact sheets are visual QA only.
for start in range(0,len(d),12):
 sheet=Image.new('RGB',(1500,1800),'#e4e8dd');draw=ImageDraw.Draw(sheet)
 for k,i in enumerate(range(start,min(start+12,len(d)))):
  im=Image.open(root/f'page-{i+1:03d}.png');thumb=ImageOps.contain(im,(475,400))
  x=(k%3)*500+(500-thumb.width)//2;y=(k//3)*450+30
  sheet.paste(thumb,(x,y));draw.text(((k%3)*500+15,(k//3)*450+10),f'PAGE {i+1}',fill='black')
 sheet.save(root/f'contact-{start//12+1:02d}.jpg',quality=92)
report={'passed':True,'pages':len(d),'screenPages':31,'embeddedSources':5,'outlineEntries':len(d.get_toc()),'links':sum(len(page.get_links()) for page in d),'textCharacters':len(text),'textBoundsIssues':issues,'contactSheets':(len(d)+11)//12}
(root/'content-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
