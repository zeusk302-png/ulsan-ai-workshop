"""Attach the document investigation to the existing, unchanged Office fixtures."""
from pathlib import Path
import json, html, zipfile, sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/automation'
START = '<!-- reference-course:start -->'
END = '<!-- reference-course:end -->'

def upsert(path, block, before=None):
    text = path.read_text(encoding='utf-8')
    if START in text:
        a, rest = text.split(START, 1)
        _, b = rest.split(END, 1)
        text = a + b
    wrapped = START + '\n' + block.strip() + '\n' + END + '\n'
    if before and before in text:
        text = text.replace(before, wrapped + before, 1)
    else:
        text = wrapped + text.lstrip('\n')
    path.write_bytes(text.replace('\r\n', '\n').encode('utf-8'))

def main():
    corpus = json.loads((ROOT/'content/reference-corpus.json').read_text(encoding='utf-8'))
    count = len(corpus['documents'])
    upsert(OUT/'README.md', f'''# 多문서 근거 탐색과 반복 보고 · 추가 활동

강사 제작 가상 교육사업 문서 {count}개를 reference-corpus/에 제공합니다. guide/start-here.html과 reference-corpus/index.html을 브라우저로 엽니다.
본수업에서는 Q01(적용 기준)·Q04(만족도 분모) 업무 요청만 선택합니다. 전체 문서 강독은 자습입니다.
1. 문서ID·시행일·상태·적용 회차를 확인하고 통합 TXT/PDF 또는 질문별 핵심 파일을 실제 AI 소스로 등록합니다.
2. 답변의 근거 문장을 원문에서 열고 work/evidence.txt에 확인한 기준을 남깁니다.
3. sources/operating-rules.txt v2.0과 검토한 근거표로 기존 data/round-01.xlsx의 1만 행 전체를 처리합니다.
4. XLSX·PPTX를 직접 열고 전체 건수·분모·수식·출처·편집 여부를 확인합니다.
5. 새 공문과 R02를 전달해 변경 영향·재실행 결과를 검토합니다. 과거·예정·미채택 자료를 현재 기준으로 섞지 않습니다.
6. 새 회차의 파일명·날짜·분모·차트·PPT가 갱신됐는지 실제 산출물을 확인합니다.

data/principle-8.csv와 checks/principle-8.json은 별도의 작은 원리 예제입니다. 48행 준비·1만 행 본실습·10만 행 확장과 구분합니다.
문서 묶음은 R01/R02의 기존 산술값을 바꾸지 않습니다. 보고 명칭·출처 표기 변경과 숫자 재계산을 구분합니다.
'''.replace('多문서', '다중문서'))
    upsert(OUT/'AGENTS.md', '''## 다중문서 활동의 추가 작업 규칙

- reference-corpus/의 문서들은 강사 제작 가상 자료다. 문서ID·버전·시행일·적용 회차·상태를 근거표에 남긴다.
- 본실습 R01/R02의 산술 기준은 sources/operating-rules.txt v2.0이다. 과거·예정·미채택 조건이나 과거 보고의 수치를 현재 실적에 섞지 않는다.
- 선택 질문의 핵심 문서와 실제 원문을 대조한다. 원문 확인 전에는 미확인으로 남긴다. 웹에서 자료를 고른 사실은 외부 AI에 첨부한 사실이 아니다.
- 작은8행 모형의 요약B2:B7과 실제1만행 파일의 요약B5:B15를 혼용하지 않는다.
- 후속 공문이 보고 명칭·출처 표기만 바꾸면 그 변경을 기록하고 기존 검산 숫자를 보존한다.
- AI 실행/파일 생성/직접 검토/모형 조작을 구분해 수행 여부를 기록한다.
''')
    upsert(OUT/'업무절차.md', '''## 다중문서 업무 · 핵심 질문 두 개

reference-corpus/index.html에서 질문과 핵심 문서, 원문 구절을 확인한다. 통합 TXT/PDF 또는 개별 파일을 외부 AI에 실제 등록한다.
기준ID/버전/시행일/회차/조건/근거절/원문/확인상태 표를 work/evidence.txt로 전달한다.
기존1만행 전체 처리→검산XLSX→5장PPT→R02재실행을 이어간다. 8행 원리 모형은 판정을 이해하는 별도 예제다.
기존 절차와 양식을 재사용해 새 회차의 실제 산출물을 갱신한다.
''')
    upsert(OUT/'prompts/01-rag.txt', '''실행 요청: reference-corpus의 업무 요청 두 개와 핵심 문서를 실제 첨부했다. 문서ID·버전·시행일·적용 회차·상태를 비교해 현재 적용할 근거를 찾아라.
실행에 필요한 근거는 적용조건/문서ID/절/원문문장/확인상태로 적어라. 과거·예정·미채택 조건은 현재 계산 기준과 구분해라.
본실습의 정리·산술은 운영 기준v2.0이며 기존R01/R02 검산 수치를 바꾸지 않는다. 새로운 숫자 집계는 전체 XLSX 처리 단계에서 한다.
''')
    upsert(OUT/'work/evidence.txt', '''다중문서 근거표 · 작성 양식
질문ID / 적용회차 / 기준일 / 문서ID / 버전 / 시행일 / 상태 / 절 / 원문문장 / 계산·보고조건 / 확인상태
현재 적용 / 과거 참고 / 후속 예정 / 미채택 / 충돌·미확인을 구분한다.
외부 AI 답변의 근거 문장을 원문에서 직접 확인한다.
''')
    block = f'''<section><h2>다중문서 업무 · {count}개 문서에서 근거 찾기</h2><p>기준·운영·사업별 적용·개정/예외·과거 보고의 가상 자료입니다. 수업에서는 질문 두 개를 고르고 전체 탐색은 자습합니다. 편성은 준비·폴더·지침30분+RAG20분+엑셀50분+PPT20분+검증15분+반복15분=150분, 휴식20분·마무리10분을 더해180분입니다. 실제 완수 시간은 수업에서 확인합니다.</p><ul><li><a href="../reference-corpus/index.html">문서 목록과 질문</a> · <a href="../reference-corpus/all-documents.html">통합 읽기</a> · <a href="../reference-corpus/all-documents.txt">통합 TXT</a></li><li><a href="../reference-corpus/student-questions.html">업무 요청</a> · <a href="../data/principle-8.csv">별도8행 원리 CSV</a> · <a href="../checks/principle-8.json">8행 판정 JSON</a></li></ul><ol><li>질문의 핵심 문서를 찾아 시행일·버전·상태를 확인합니다.</li><li>실제 파일을 외부 AI의 소스 추가/첨부로 전달하고 근거표를 요청합니다.</li><li>인용을 열어 원문 문장·절을 대조하고 work/evidence.txt에 확인한 기준을 저장합니다.</li><li>기존1만행 전체 처리와 아래 XLSX·PPT 활동에 연결합니다. 보고 표기 변경과 산술 변경을 구분합니다.</li><li>R02와 새 공문으로 반복하고 파일명·날짜·분모·차트·PPT의 갱신을 확인합니다.</li></ol><p>웹 교재의 원리 그림은 가상8행의 변환을 보여 줍니다. 외부 AI의 실행이나1만행 처리 완료를 대신하지 않습니다.</p></section>'''
    upsert(OUT/'guide/start-here.html', block, before='<h2>1.')
    guide = OUT/'guide/start-here.html'
    text = guide.read_text(encoding='utf-8').replace('약 15분','약 20분',1).replace('약 65분','약 50분',1).replace('약 30분','약 20분',1).replace('약 10분','약 15분',1)
    guide.write_bytes(text.replace('\r\n','\n').encode('utf-8'))
    if '--no-zip' not in sys.argv:
        with zipfile.ZipFile(OUT/'report-workspace.zip','w',zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(OUT.rglob('*')):
                if path.is_file() and path.suffix!='.zip' and path.name!='extension-100000.csv' and not path.name.endswith('.inspect.ndjson'):
                    archive.write(path,'report-workspace/'+path.relative_to(OUT).as_posix())
        with zipfile.ZipFile(OUT/'report-workspace.zip') as archive:
            assert archive.testzip() is None
            assert 'report-workspace/reference-corpus/manifest.json' in archive.namelist()
    print(f'Integrated {count} documents; original Office fixtures retained')

if __name__=='__main__': main()
