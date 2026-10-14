"""Build a standalone Korean student PDF from the verified course content."""
from pathlib import Path
import json, html, hashlib, shutil, sys
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak, NextPageTemplate, Table, TableStyle, Image, KeepTogether, HRFlowable
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage
import pymupdf

R=Path(__file__).resolve().parents[1]
DATA=json.loads((R/'artifacts/workbook-data.json').read_text(encoding='utf-8'))
OUT=R/'output/pdf'; OUT.mkdir(parents=True,exist_ok=True)
TMP=R/'artifacts/pdf-review'; TMP.mkdir(parents=True,exist_ok=True)
TARGET=OUT/'ulsan-ai-workshop-student-workbook.pdf'
SITE='https://zeusk302-png.github.io/ulsan-ai-workshop/'
pdfmetrics.registerFont(TTFont('KR','C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('KRB','C:/Windows/Fonts/malgunbd.ttf'))
pdfmetrics.registerFontFamily('KR',normal='KR',bold='KRB',italic='KR',boldItalic='KRB')
INK=colors.HexColor('#20271e'); OLIVE=colors.HexColor('#4b6335'); PAPER=colors.HexColor('#f7f8f2'); LINE=colors.HexColor('#dce2d1'); LIME=colors.HexColor('#e5edcf')
styles={
 'body':ParagraphStyle('body',fontName='KR',fontSize=10.3,leading=16.2,textColor=INK,spaceAfter=9,wordWrap='CJK'),
 'small':ParagraphStyle('small',fontName='KR',fontSize=8.5,leading=13,textColor=OLIVE,spaceAfter=7,wordWrap='CJK'),
 'h1':ParagraphStyle('h1',fontName='KRB',fontSize=23,leading=31,textColor=INK,spaceAfter=15,wordWrap='CJK'),
 'h2':ParagraphStyle('h2',fontName='KRB',fontSize=15,leading=22,textColor=OLIVE,spaceBefore=15,spaceAfter=9,wordWrap='CJK',keepWithNext=True),
 'h3':ParagraphStyle('h3',fontName='KRB',fontSize=11.8,leading=18,textColor=INK,spaceBefore=10,spaceAfter=6,wordWrap='CJK',keepWithNext=True),
 'prompt':ParagraphStyle('prompt',fontName='KR',fontSize=10.1,leading=16,textColor=INK,spaceAfter=5,wordWrap='CJK',backColor=colors.HexColor('#f0f3e7'),borderPadding=10),
 'cell':ParagraphStyle('cell',fontName='KR',fontSize=9.1,leading=14,textColor=INK,wordWrap='CJK'),
 'cover':ParagraphStyle('cover',fontName='KRB',fontSize=35,leading=48,textColor=INK,spaceAfter=25,wordWrap='CJK'),
 'screen':ParagraphStyle('screen',fontName='KRB',fontSize=15,leading=21,textColor=INK,spaceAfter=6,wordWrap='CJK'),
 'screenNote':ParagraphStyle('screenNote',fontName='KR',fontSize=8.3,leading=12,textColor=OLIVE,spaceAfter=4,wordWrap='CJK'),
}

def clean(s):
 return str(s).replace('\u2011','-').replace('–','-').replace('—','-').replace('公고','공고')
def p(s,style='body'):
 return Paragraph(html.escape(clean(s)).replace('\n','<br/>'),styles[style])
story=[]; chapters=[]
def add(s,style='body'): story.append(p(s,style))
def heading(title,key):
 q=p(title,'h1');q.section_key=key;q.section_title=title;story.append(q);chapters.append((key,title))
def page(title=None,key=None,wide=False):
 if story: story.extend([NextPageTemplate('L' if wide else 'P'),PageBreak()])
 if title: heading(title,key)
def bullets(items):
 for i,v in enumerate(items,1): add(f'{i}. {v}')
def block(text):
 # Keep related request lines together; selectable text can still split at page boundaries.
 for paragraph in clean(text).split('\n\n'):
  if paragraph.strip():add(paragraph.strip(),'prompt')
def link(label,url):
 story.append(Paragraph(f'<link href="{html.escape(url,quote=True)}" color="#4b6335"><u>{html.escape(label)}</u></link>',styles['body']))
def table(rows,widths):
 t=Table([[p(v,'cell') for v in row] for row in rows],colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),LIME),('GRID',(0,0),(-1,-1),.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]));story.append(t);story.append(Spacer(1,12))
def offline(s):
 return s.replace('자료·프롬프트 탭','이 단원의 자료 준비·시작 프롬프트').replace('자료실','이 교재의 원문 목록').replace('내 작업 탭','메모장 또는 문서 편집기').replace('내 작업에','메모장 또는 문서 편집기에').replace('작업함에서 JSON 백업을 내려받습니다.','원문·요청·결과를 각각 파일로 저장합니다.').replace('작업함에','기록 파일에').replace('작업함에서','기록 파일에서').replace('JSON 백업을 내려받습니다.','요청·결과·검토 기록을 각각 파일로 저장합니다.').replace('내 프롬프트에','프롬프트 기록 파일에').replace('자료·프롬프트로 실습하기','이 단원의 시작 프롬프트 사용하기')

class Book(BaseDocTemplate):
 def afterFlowable(self,f):
  if hasattr(f,'section_key'):
   self.canv.bookmarkPage(f.section_key)
   self.canv.addOutlineEntry(f.section_title,f.section_key,0,False)
   if not f.section_key.startswith('screen-'):self.notify('TOCEntry',(0,f.section_title,self.page,f.section_key))

def chrome(c,doc):
 w,h=c._pagesize
 c.saveState();c.setFillColor(PAPER);c.rect(0,0,w,h,fill=1,stroke=0)
 c.setFillColor(INK);c.setFont('KRB',9);c.drawString(42,h-27,'AI WORKROOM · 울산대학교 직장인 AI 실습')
 c.setFont('KR',8);c.setFillColor(OLIVE);c.drawRightString(w-42,h-27,'수강생 교재 | 2일 · 6시간')
 c.setStrokeColor(LINE);c.line(42,h-37,w-42,h-37);c.line(42,34,w-42,34)
 c.setFont('KR',8);c.drawString(42,20,'개념 60분 · 직접 실습 240분 · 휴식 40분 · 검토·정리 20분')
 c.drawRightString(w-42,20,f'{doc.page:02d}');c.restoreState()

doc=Book(str(TARGET),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=52,bottomMargin=46,title='울산대학교 직장인 AI 실습 - 수강생 교재',author='AI WORKROOM',pageCompression=1)
templates=[]
for name,size in [('P',A4),('L',landscape(A4))]:
 w,h=size;templates.append(PageTemplate(id=name,pagesize=size,frames=[Frame(42,46,w-84,h-98,id=name+'frame',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=chrome))
doc.addPageTemplates(templates)

add('STUDENT WORKBOOK / 2026','small');story.append(Spacer(1,70))
add('내일 출근해서\n바로 쓰는 AI','cover')
add('울산대학교 직장인 AI 기초 실무 특강\n수강생이 직접 따라 하는 2일 · 총6시간 과정','h2')
add('실제 공고를 읽고, 문서를 만들고, 근거를 확인합니다.\n383쪽 편람과 울산 지자체 원문으로 실습하고\n다음 업무에 사용할 요청 양식을 완성합니다.')
story.append(Spacer(1,25));table([['개념·시연','직접 실습','수업 전체'],['10분 모듈6개\n총60분','35~45분 실습6개\n총240분','휴식·정리 포함\n총360분']],[170,170,171])
add('자료·화면 확인일: 2026-10-14 · 교재 v1.0','small')
add('공식 문서 다운로드 링크, 선택 가능한 전체 프롬프트, 실제 화면31개, 검토표와 작업 기록 양식을 포함합니다. 원문 파일5개를 PDF 첨부파일에도 보관합니다. 긴PDF2개는 발행기관에서 전체 원본을 받습니다.')
link('온라인 실습실 열기 (선택)',SITE)

page('이 교재로 따라 하는 방법','howto')
bullets(['시간표 순서대로 개념과 연결된 실습 단원을 엽니다. 각 실습의 준비 파일·요청·검토 기준을 한곳에 모았습니다.','공식 원문 목록에서 전체PDF·HWP·TXT를 준비합니다. 이 교재는 수업 안내입니다. AI의 분석 소스로는 해당 기관 원문 파일을 넣습니다.','새 대화 또는 새 노트북에 파일을 등록하고 이 교재의 시작 프롬프트를 복사해 입력합니다. PDF에서 텍스트를 선택해 Ctrl+C로 복사할 수 있습니다.','실제 화면을 참고해 응답·인용을 확인합니다. 화면 속AI답변에는 실제 오류가 포함되어 있어 검토 지점을 함께 읽습니다. 작은 화면 글자는 PDF확대를 사용하세요.','최종 결과와 효과가 있었던 요청을 메모장·문서 편집기에 각각 저장합니다. 사이트 작업함은 추가로 사용할 수 있습니다.'])
add('준비물','h2');bullets(['개인 노트북·충전기·안정적인 인터넷, PDF뷰어와 메모장 또는 문서 편집기.','주력AI도구1개에 로그인하고 자료 기반 실습용Google계정도 준비합니다. 모든 도구에 가입할 필요는 없습니다.','PDF만으로 순서·요청·검토를 따라갈 수 있습니다. 실제AI실행과 공식 원문 다운로드에는 인터넷과 해당 도구 접속이 필요합니다.'])
add('내 파일 폴더 구성','h2');block('울산_AI_실습/\n  01_공식원문/\n  02_내프롬프트/\n  03_결과물/\n  04_원문대조기록/')
add('예: 실습01-확인메일.txt / 실습01-프롬프트.txt / 실습01-근거대조.txt. 중요한 수치와 원문 위치도 함께 저장합니다. 빈 신청서에는 실제 주민번호·계좌번호를 채우지 않습니다.')

page('목차와 빠른 이동','contents')
add('PDF의 목차 항목과 책갈피를 눌러 단원으로 이동할 수 있습니다. 실제 화면은 해당 실습 뒤에 배치했습니다. 이전 가상 기초 화면은 부록에 모았습니다.')
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc',fontName='KR',fontSize=10.3,leading=18,leftIndent=0,firstLineIndent=0,spaceBefore=5,textColor=INK,wordWrap='CJK')];story.append(toc)

for d in DATA['curriculum']['days']:
 page(f"DAY 0{1 if d['id']=='day1' else 2} 수업 시간표",d['id'])
 rows=[['경과 시간','진행 내용','배정']];elapsed=0
 for slot in d['schedule']:
  rows.append([f'{elapsed//60:02d}:{elapsed%60:02d} - {(elapsed+slot["minutes"])//60:02d}:{(elapsed+slot["minutes"])%60:02d}',slot['title'],f'{slot["minutes"]}분']);elapsed+=slot['minutes']
 table(rows,[95,360,56]);add('하루180분: 개념·시연30분 + 직접실습120분 + 휴식20분 + 검토·정리10분. 경과 시간은 수업 시작을00:00으로 둔 상대 시간입니다.')

page('AI도구와 원문 파일 준비','prepare')
for t in DATA['tools']: link(t['name']+' - '+t['label'],t['href'])
add('기본 조작 순서','h2');bullets(['ChatGPT·Gemini: 새 대화 열기 → 파일추가 또는첨부 버튼 → 전문TXT/PDF선택 → 처리 완료 확인 → 요청 입력 → 전송 → 응답 복사·검토.','NotebookLM: 새 노트북 → 소스추가 → 파일업로드 → PDF2개와TXT3개선택 → 처리 완료 확인 → 사용할 소스 선택 → 질문 입력 → 인용번호 열기.','캡처 계정에는Gemini Notebook이라는 화면명이 보였습니다. 도구명·메뉴는 계정과 업데이트에 따라 달라질 수 있습니다. 특정 유료 모델·추가 기능을 선택할 필요는 없습니다.'])
add('기본5개 소스 목록','h2');block('mois-2025-administration-manual.pdf - 편람383쪽\nbukgu-2026-feb-week3-4.pdf - 업무계획17쪽\nnotice.txt - 중구 공고와 붙임 전문\nregulation.txt - 규정2026.10.2. 시행본\nrules.txt - 시행규칙2023.6.28. 시행본')
add('complaints.txt는2026.12.3. 시행예정본입니다. 기본5개에 섞지 않고 시행일 비교 과제로만 사용합니다. HWP원본은 서식·표 대조용이며 업로드가 안 되면 공고 전문TXT를 사용합니다.')
link('공고·법령 전문TXT와HWP 묶음ZIP 다운로드',SITE+'documents/official-workshop-pack.zip')
add('무료 사용 한도나 파일 처리에서 막히면','h2');bullets(['처리중인 파일의 완료 여부를 확인하고, 해당 업무 소스만 선택해 다시 질문합니다.','HWP를 읽지 못하면 본문 전문TXT를 등록하고 표와 서식은 원본에서 대조합니다.','전체PDF분석에 한도가 걸리면 분석할 쪽수 범위를 명시합니다. 결과에도 전체 분석이 아니라 해당 범위임을 적고 나머지 확인을 남깁니다.','도구를 사용할 수 없으면 교재의 강사 대조 기준과 실제 응답을 읽고 오류·누락을 찾아 수정 요청을 작성합니다.'])

page('공식 원문 목록과 다운로드','official-sources')
add('각 문서의 원문과 시점을 확인한 뒤 실습하세요. PDF쪽수는 원본에서 직접 셌고, 법령은 본문 단락, HWP는 추출 본문 줄을 표시했습니다. 빈 줄·임의 줄바꿈으로 분량을 늘리지 않았습니다.')
for d in DATA['documents']['documents']:
 add(d['title'],'h2');add(f"{d['agency']} | 게시·공포 {d['publishedDate']} | 수집 {d['collectedOn']}",'small')
 add(f"{str(d['pages'])+'쪽 · ' if d['pages'] else ''}{d['naturalLines']:,}{'단락' if d['format']=='법령 전문' else '줄'} · {d['characters']:,}자"+' | '+d.get('versionLabel',''),'small')
 add(d['purpose']);add(d['useNote'],'small');link('공식 게시물과 버전 확인',d['sourceUrl'])
 if d.get('textPath'): link('전문TXT 직접 다운로드',SITE+d['textPath'])
 if d['format']=='PDF': link('발행기관 전체PDF 다운로드',d['downloadUrl'])
 if d.get('originalPath'): link('공고HWP 원본 다운로드',SITE+d['originalPath'])
add('PDF 첨부파일 활용','h2');add('이 교재에 공고HWP와TXT4개를 첨부했습니다. PDF뷰어의 첨부파일 패널을 지원하면 파일을 꺼내 사용할 수 있습니다. 브라우저에서 첨부파일 패널이 없으면 위 링크 또는ZIP을 사용하세요. 편람·업무계획의 전체PDF는 발행기관 링크로 제공합니다.')

page('전체PDF에서 근거 찾기','pdf-reader')
bullets(['발행기관 링크로 받은 전체PDF를 일반PDF뷰어에서 엽니다. 전체 쪽수를 확인하세요.','Ctrl+F로 업무 관련 단어를 검색합니다. ‘인계’, ‘붙임’, ‘AI’처럼 짧은 단어로 시작하고 표·띄어쓰기 때문에 누락되면 원본 페이지를 읽습니다.','PDF뷰어쪽수와 책에 인쇄된 쪽수는 다를 수 있습니다. 예: 편람PDF253쪽의 인쇄쪽수는245쪽입니다. 북구AI교육은PDF4쪽·인쇄-2/15-에서 확인했습니다.','선택사항: 사이트의 자료실 → 내려받은PDF선택으로 전체 원본을 열어 쪽 이동·확대·전체 검색을 사용할 수 있습니다. 원본은 현재 브라우저에서 읽으며 사이트에 전송하지 않습니다.'])
add('근거 기록 양식','h2');block('질문:\n출처명·버전:\nPDF뷰어쪽수 / 인쇄쪽수 또는 조문·항목:\n직접 확인한 원문 문장:\nAI의 주장:\n판정: 확인됨 / 일부 근거 / 상충 / 자료에 없음 / 시행 전\n내 수정:')

def screenshot(id,group,number):
 s=next(x for x in DATA['captures']['screens'] if x['id']==id)
 page(wide=True)
 title=f'실제 화면 {number:02d} - {s["title"]}'
 head=p(title,'screen');head.section_key=f'screen-{id}';head.section_title=title
 meta=p(f'{group} | {s["tool"]} | 실제 캡처2026-10-14','screenNote')
 focus=p(' / '.join(s['focus']),'screenNote')
 ref=Paragraph(f'<link href="{SITE}screens/{s["file"]}" color="#4b6335"><u>동일 캡처 원본 크게 열기</u></link> · PDF에서도200%확대로 읽을 수 있습니다.',styles['screenNote'])
 imgpath=R/'public/screens'/s['file'];im=PILImage.open(imgpath);w,h=im.size
 maxw=landscape(A4)[0]-84
 other=sum(q.wrap(maxw,1000)[1]+q.getSpaceAfter()+q.getSpaceBefore() for q in [head,meta,focus,ref])
 maxh=landscape(A4)[1]-98-other-8
 scale=min(maxw/w,maxh/h)
 image=Image(str(imgpath),width=w*scale,height=h*scale);image.hAlign='CENTER'
 story.extend([head,meta,image,focus,ref])

screens_done=[]
for id in ['official-source-manual','official-source-notice','official-platform-pdf','official-platform-search']:
 screenshot(id,'파일 준비·원문 확인',len(screens_done)+1);screens_done.append(id)

for day in [1,2]:
 for lesson in [l for l in DATA['lessons'] if l['day']==day]:
  u=next(u for u in DATA['concepts']['units'] if u['lesson']==lesson['id'])
  page(f'개념 {DATA["concepts"]["units"].index(u)+1:02d} - {u["title"]}',f'concept-{u["id"]}')
  add('설명6분 + 시연3분 + 확인1분 = 10분','small');add(u['summary'],'h3')
  for text in u['paragraphs']:add(offline(text))
  add('우리 실습에 적용하면','h2');block(u['example'])
  add('마지막1분: '+u['exercise'],'small')
  if u['source'] is not None:label,url=DATA['concepts']['references'][u['source']];link('참고: '+label,url)
  g=DATA['walkthroughs'][lesson['id']]
  page(f'실습 {lesson["number"]} - {lesson["title"]}',f'lesson-{lesson["id"]}')
  add(f'DAY0{day} | 직접 실습{lesson["minutes"]}분 | {lesson["tool"]}','small');add(lesson['description']);add('가져갈 결과물','h3');add(g['output'])
  add('자료 준비','h3');add(offline(g['preparation']))
  for did in lesson['documentIds']:
   d=next(x for x in DATA['documents']['documents'] if x['id']==did)
   labels={'manual':'편람383쪽PDF','notice':'중구 공고 전문TXT','weekly':'북구 업무계획17쪽PDF','regulation':'규정 전문TXT - 2026.10.2. 시행본','rules':'시행규칙 전문TXT - 2023.6.28. 시행본'}
   url=SITE+d['textPath'] if d.get('textPath') else d['downloadUrl']
   story.append(Paragraph(f'<link href="{html.escape(url,quote=True)}" color="#4b6335"><u>{labels[did]} - 전체 원문 준비</u></link>',styles['small']))
  add('한 단계씩 따라 하기','h2')
  for i,(title,action,expected) in enumerate(g['detailedSteps']):
   add(f'{i+1}. {title} ({g["timing"][i]}분)','h3');add(offline(action));add('여기까지 확인: '+offline(expected),'small')
  page(f'실습 {lesson["number"]} - 시작 프롬프트·수정 요청',f'prompt-{lesson["id"]}')
  add('전체 원문 파일을 먼저 등록한 뒤 아래 요청을 입력합니다. 원문 안내문을 파일 대신 넣지 마세요. PDF에서 요청 텍스트를 선택해 복사할 수 있습니다.','small');block(lesson['prompt'])
  add('첫 응답을 읽은 뒤, 필요한 수정 요청 선택','h2')
  for title,prompt in g['followUps']:add(title,'h3');block(prompt)
  page(f'실습 {lesson["number"]} - 검토·저장·문제 해결',f'check-{lesson["id"]}')
  add('완료 전, 직접 확인할3가지','h2');bullets(lesson['checks'])
  add('강사 대조 기준·기록 예시','h2');block(lesson['example'])
  add('막혔을 때','h2')
  for q,a in g['trouble']:add(q,'h3');add(offline(a))
  add('저장하기','h2');add('메모장·문서 편집기에 결과물과 프롬프트를 각각 저장합니다. 근거 위치·수정 이유·확인 필요도 남깁니다. 사이트를 사용하는 경우 작업함 기록과JSON백업을 추가로 보관하세요.')
  add('혼자 해보기 (시간이 남으면)','h3');add(g['challenge'])
  for sid in g['screens']:
   if sid not in screens_done:screenshot(sid,f'실습{lesson["number"]}',len(screens_done)+1);screens_done.append(sid)

page('컨텍스트 관리 - 상황별 판단','context-decisions')
table([['상황','권장 진행','이유'],['같은 공고로 메일의 말투만 수정','대화 이어가기','같은 사실·목적을 유지하고 표현만 바꿉니다.'],['중구 공고에서 북구 업무계획으로 변경','새 대화 또는 소스 범위 변경','다른 사업의 금액·기한이 섞이지 않도록 이번 원문과 조건을 제공합니다.'],['같은 업무를 여러 번 수정해 버린 초안이 섞임','검토한 요약으로 새 대화에 옮기기','확인한 사실·작성 조건·미결 항목과 필요한 원문을 다시 제공합니다.']],[200,125,186])
add('대화를 옮기기 전','h2');bullets(['요약에 확정되지 않은 금액이나버린 초안이 들어갔는지 원문과 비교합니다.','새 대화에 원문과 독자·형식·검토 조건을 다시 제공합니다.','새 대화가 모든메모리나설정을 초기화한다고 가정하지 않고 이번 자료만 사용할 범위를 명시합니다.'])

page('내 결과물·프롬프트 기록 양식','worksheet')
block('실습 번호 / 제목:\n사용 도구 / 실행일:\n사용한 원문 파일·버전:\n분석한 범위:\n처음 요청:\n효과가 있었던 수정 요청:\n최종 결과물:\n원문 대조한 사실3개:\n남은 확인 필요:\n다음 업무 적용 계획:')
add('새 대화로 옮길 요약 양식','h2');block(DATA['concepts']['handoff'])

page('부록 - 실제 중구 공고 본문·빈 서식 전문','notice-full')
add('아래는공식HWP에서 추출한 전체 본문과 빈서식입니다. 원본표의 배치·입력칸은HWP로 대조합니다. 접수는2026년9월 종료된 과거 공고이며현재 모집 안내가 아닙니다. 주민번호·계좌번호 칸에는실제 값을 입력하지 않습니다.','small')
text=(R/'public/documents/text/notice.txt').read_text(encoding='utf-8')
for paragraph in text.split('\n\n'):add(paragraph)

page('부록 - 이전 기초 도구 조작 화면','basic-screens')
add('다음13개는 짧은가상자료로 도구의 입력·수정·인용 조작을 보여주는 이전실제캡처입니다.현재6개핵심실습은 공식원문을 사용합니다. 부록의 가상날짜·금액을 공식자료의 결과에 적용하지 마세요.')
for s in DATA['captures']['screens']:
 if not s['id'].startswith('official-'):screenshot(s['id'],'부록 · 가상 기초 사례 (도구 조작 참고)',len(screens_done)+1);screens_done.append(s['id'])

page('출처·파일·수업 마무리','closing')
add('마지막1분, 돌아보기','h2');add(DATA['walkthroughs']['template']['debrief'])
add('오늘 만든 것, 다음 업무에 가져가기','h2');bullets(['조건표·확인메일·공문초안·보고서/FAQ·실행목록·근거카드·재사용요청을 폴더에 저장합니다.','다음주사용할업무와직접확인할항목을 한가지씩 적습니다.','공식 원문 파일과 검토기록을 함께 보관합니다. PDF교재와기관원문은 용도가 다릅니다.'])
link('온라인실습실의 PDF교재·원문 다운로드',SITE+'#documents')
add('개념 참고자료','h2')
for label,url in DATA['concepts']['references']:link(label,url)
add('자료와 화면의 범위','h2');add('공식문서6종의출처·수집일·시행일을 보존했습니다. 기본실습소스는5개이고민원법 시행예정본은추가비교용입니다. 전체PDF400쪽을 등록한실제응답을 사용했습니다. 화면은공식문서실습18개와이전가상기초13개를포함한31개입니다. 계정영역은제외했고UI나답변을 합성하지 않았습니다. AI의오류는이미지에서 고치지 않고검토지점으로 설명합니다.')
add('PDF교재에 담긴 프롬프트·활동·예시는수강생학습용입니다. 실제공문발송·지원신청·개인별자격판정은 수행하지 않습니다. 실제업무적용시문서의시점과소속기관의자료사용기준을 확인합니다.','small')

doc.multiBuild(story)
# Embed source files without flattening or changing the original attachments.
pdf=pymupdf.open(TARGET)
for source in [R/'public/documents/originals/junggu-2026-instructor-notice.hwp',*[R/f'public/documents/text/{id}.txt' for id in ['notice','regulation','rules','complaints']]]:
 pdf.embfile_add(source.name,source.read_bytes(),filename=source.name,ufilename=source.name,desc='공식원문 '+source.name+(' | 2026-12-03시행예정 비교용' if source.stem=='complaints' else ''))
tmp=OUT/'workbook-embedded.pdf';pdf.save(tmp,garbage=4,deflate=True);pdf.close();tmp.replace(TARGET)
public=R/'public/course';public.mkdir(parents=True,exist_ok=True);shutil.copyfile(TARGET,public/TARGET.name)
pdf=pymupdf.open(TARGET)
manifest={'title':'울산대학교 직장인AI 실습 - 수강생 교재','version':'1.0','updatedOn':'2026-10-14','path':'course/'+TARGET.name,'pages':len(pdf),'bytes':TARGET.stat().st_size,'sha256':hashlib.sha256(TARGET.read_bytes()).hexdigest(),'realScreens':len(screens_done),'embeddedSources':pdf.embfile_count(),'standalone':'시간표·개념6개·실습6개·전체프롬프트·실제화면31개·공식원문링크·검토와저장양식 포함. AI실행과전체기관PDF다운로드는 인터넷 필요.'}
manifest['inputs']={name:hashlib.sha256((R/name).read_bytes()).hexdigest() for name in ['src/content.js','src/walkthroughs.js','src/Concepts.jsx','content/curriculum.json','content/official-documents.json','content/screen-captures.json']}
(R/'content/student-workbook.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
report={'pages':len(pdf),'embeddedSources':pdf.embfile_names(),'links':sum(len(p.get_links()) for p in pdf),'outlineEntries':len(pdf.get_toc()),'pageTextLengths':[len(p.get_text()) for p in pdf],'screens':screens_done}
(TMP/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
for i,page in enumerate(pdf):page.get_pixmap(matrix=pymupdf.Matrix(1,1),alpha=False).save(TMP/f'page-{i+1:03d}.png')
pdf.close()
print(json.dumps(manifest,ensure_ascii=False))
