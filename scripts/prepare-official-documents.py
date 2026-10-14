"""Collect official originals, preserve hashes, and derive page/paragraph text.

Requires pymupdf, olefile, beautifulsoup4. No line padding or generated source text.
External-only documents retain their official download URLs in the public catalog.
"""
from pathlib import Path
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
import argparse, hashlib, json, re, struct, sys, zlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools/python'))
import pymupdf
import olefile
from bs4 import BeautifulSoup

SOURCES = [
    dict(id='manual', title='2025 행정업무운영 편람', agency='행정안전부', publishedDate='2026-01-02',
         sourceUrl='https://www.mois.go.kr/frt/bbs/type001/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000012&nttId=122878',
         downloadUrl='https://www.mois.go.kr/cmm/fms/FileDown.do?atchFileId=FILE_00141723RKL5RWf&fileSn=0',
         filename='mois-2025-administration-manual.pdf', format='PDF', distribution='external',
         purpose='383쪽 전체에서 문서 작성·결재·인계인수 기준을 찾고 관련 규정과 비교',
         useNote='원문은 발행기관에서 내려받습니다. 2025년 편람의 설명과 이후 법령 개정 내용을 구분하세요.'),
    dict(id='notice', title='2026년 큰꿈 작은학교(주민강사) 지원사업 공고', agency='울산광역시 중구', publishedDate='2026-09-02',
         sourceUrl='https://www.junggu.ulsan.kr/edu/community/community01.do?bid=BD000015&bmidx=3490&exec=view',
         downloadUrl='https://www.junggu.ulsan.kr/edu/file/boardFileDown.do?bid=BD000015&bmidx=3490&fNo=0',
         filename='junggu-2026-instructor-notice.hwp', format='HWP', distribution='local',
         purpose='실제 공고와 신청서·운영계획서에서 조건·제출서류·상충 수치를 확인',
         useNote='접수 종료된 공고를 교육용으로 분석합니다. 빈 서식에 실제 주민번호·계좌번호를 입력하지 마세요.'),
    dict(id='weekly', title='2026년 2월 3~4주 주간업무계획', agency='울산광역시 북구 기획예산실', publishedDate='2026-02-13',
         sourceUrl='https://www.bukgu.ulsan.kr/lay1/bbs/S1T62C110/A/28/view.do?article_seq=311506',
         downloadUrl='https://www.bukgu.ulsan.kr/download.do?uuid=b20aaec9-a7b2-4b68-8375-544fdf24dda8.pdf',
         filename='bukgu-2026-feb-week3-4.pdf', format='PDF', distribution='external',
         purpose='부서별 장문 계획에서 일정·담당부서·기한·예산과 확인 필요 항목 추출',
         useNote='2026년 2월의 당시 계획 자료입니다. 계획과 실제 완료를 구분하고, 수치·시간 이상 여부는 PDF와 대조하세요.'),
    dict(id='regulation', title='행정업무의 운영 및 혁신에 관한 규정', agency='법제처 국가법령정보센터', publishedDate='2026-09-29',
         sourceUrl='https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=290525',
         downloadUrl='https://www.law.go.kr/LSW/lsInfoR.do?lsiSeq=290525&efYd=20261002&chrClsCd=010202',
         filename='administration-regulation.html', format='법령 전문', distribution='local',
         purpose='공문서 작성·결재·업무 인계인수의 조문 근거 찾기',
         useNote='2026-10-14 수집한 법령 전문입니다. 부칙·미시행 조문 표시를 함께 읽고 실제 업무 적용 시 원문을 다시 확인하세요.'),
    dict(id='rules', title='행정업무의 운영 및 혁신에 관한 규정 시행규칙', agency='법제처 국가법령정보센터', publishedDate='2023-06-28',
         sourceUrl='https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=252189',
         downloadUrl='https://www.law.go.kr/LSW/lsInfoR.do?lsiSeq=252189&efYd=20230628&chrClsCd=010202',
         filename='administration-rules.html', format='법령 전문', distribution='local',
         purpose='본문 항목·붙임·끝 표시 등 구체적인 문서 작성 규칙 확인',
         useNote='별표·서식은 본문 텍스트와 구분해 공식 원문에서 확인하세요. 수집일 기준 버전을 표시합니다.'),
    dict(id='complaints', title='민원 처리에 관한 법률 · 시행예정본 비교', agency='법제처 국가법령정보센터', publishedDate='2026-06-02',
         sourceUrl='https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=286421',
         downloadUrl='https://www.law.go.kr/LSW/lsInfoR.do?lsiSeq=286421&efYd=20261203&chrClsCd=010202',
         filename='civil-petitions-act.html', format='법령 전문', distribution='local',
         purpose='공포일과 시행일을 구분하는 추가 실습 · 기본 5개 자료와 별도 사용',
         useNote='2026-12-03 시행예정본입니다. 수집일 2026-10-14에는 아직 시행 전이므로 현행 근거로 사용하지 않습니다.'),
]

def hwp_paragraphs(path):
    doc = olefile.OleFileIO(path)
    compressed = bool(doc.openstream('FileHeader').read()[36] & 1)
    paragraphs = []
    for stream in sorted(doc.listdir()):
        if stream[0] != 'BodyText': continue
        data = doc.openstream(stream).read()
        if compressed: data = zlib.decompress(data, -15)
        pos = 0
        while pos + 4 <= len(data):
            header = struct.unpack_from('<I', data, pos)[0]; pos += 4
            tag, size = header & 1023, header >> 20
            if size == 4095: size = struct.unpack_from('<I', data, pos)[0]; pos += 4
            payload = data[pos:pos + size]; pos += size
            if tag != 67: continue
            chars, i = [], 0
            while i + 2 <= len(payload):
                code = struct.unpack_from('<H', payload, i)[0]
                if code in {1,2,3,4,9,11,12,14,15,16,17,18,21,22,23}:
                    if code == 9: chars.append('\t')
                    i += 16
                else:
                    if code in {10,13}: chars.append('\n')
                    elif code >= 32: chars.append(chr(code))
                    i += 2
            value = ''.join(chars).strip()
            if value: paragraphs.append(value)
    return paragraphs

def process(source):
    item = dict(source)
    original = ROOT / 'materials/originals' / source['filename']
    original.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        with urlopen(source['downloadUrl'], timeout=60) as response: original.write_bytes(response.read())
    data = original.read_bytes()
    item.update(bytes=len(data), originalSha256=hashlib.sha256(data).hexdigest(), collectedOn='2026-10-14')
    if original.suffix == '.pdf':
        doc = pymupdf.open(original)
        pages = [page.get_text().strip() for page in doc]
        item['pages'] = len(doc)
        doc.close()
        # Keep extracted natural lines. Do not wrap to inflate the line count.
        text = '\n\n'.join(f'【PDF {i+1}쪽】\n{p}' for i,p in enumerate(pages))
        item['naturalLines'] = sum(bool(line.strip()) for p in pages for line in p.splitlines())
        item['characters'] = sum(len(p) for p in pages)
        item['textKind'] = 'PDF 본문 추출 · 원문 표·이미지와 별도 대조'
    elif original.suffix == '.hwp':
        pages = hwp_paragraphs(original)
        text = '\n\n'.join(pages)
        item.update(pages=None, naturalLines=sum(bool(l.strip()) for l in text.splitlines()), characters=len(text), textKind='HWP 본문·빈 서식 텍스트 추출 · 제어코드 제거, 표는 원문 대조')
    else:
        soup = BeautifulSoup(data, 'html.parser')
        groups = soup.select('.pgroup')
        if not groups: raise ValueError('No law body found: ' + source['id'])
        paragraphs = []
        for group in groups:
            body = group.select_one('.lawcon')
            values = body.select('p') if body else group.select('p')
            if values:
                paragraphs.extend(v.get_text(' ', strip=True) for v in values if v.get_text(strip=True))
            elif group.get_text(strip=True): paragraphs.append(group.get_text(' ', strip=True))
        law_header = soup.select_one('#conTop')
        header_text = law_header.get_text(' ', strip=True) if law_header else ''
        text = (header_text + '\n\n' if header_text else '') + '\n\n'.join(paragraphs)
        item.update(pages=None, naturalLines=len(paragraphs), characters=len(text), textKind='국가법령정보센터 조문·부칙 전문 추출')
        header = soup.select_one('.law_title') or soup.select_one('.subtit1')
        if header: item['versionLabel'] = header.get_text(' ', strip=True)[:500]
        match = re.search(r'\[시행\s*[^\]]+\]', soup.get_text(' ', strip=True))
        if match: item['versionLabel'] = match.group(0)
    extraction = ROOT / 'materials/extracted' / (source['id'] + '.txt')
    extraction.parent.mkdir(parents=True, exist_ok=True)
    extraction.write_text(text, encoding='utf-8', newline='\n')
    item['textSha256'] = hashlib.sha256(text.encode()).hexdigest()
    item['sourceStatus'] = '실제 기관 공개 원문'
    if source['distribution'] == 'local':
        target = ROOT / 'public/documents/text' / (source['id'] + '.txt')
        target.parent.mkdir(parents=True, exist_ok=True); target.write_text(text, encoding='utf-8', newline='\n')
        item['textPath'] = 'documents/text/' + source['id'] + '.txt'
        if original.suffix == '.hwp':
            target = ROOT / 'public/documents/originals' / original.name
            target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
            item['originalPath'] = 'documents/originals/' + original.name
    # Metadata and original links are public; retain full external-only originals privately.
    item['preview'] = text[:700]
    print(source['id'], item.get('pages'), item['naturalLines'], item['characters'])
    return item

if __name__ == '__main__':
    items = list(ThreadPoolExecutor(max_workers=4).map(process, SOURCES))
    manifest = dict(collectedOn='2026-10-14', documents=items,
        measurement='PDF는 추출된 비어 있지 않은 자연 줄, HWP·법령은 본문 단락 기준. 빈 줄·임의 줄바꿈으로 분량을 늘리지 않았습니다.',
        totalNaturalLines=sum(d['naturalLines'] for d in items), totalCharacters=sum(d['characters'] for d in items))
    (ROOT/'content/official-documents.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
