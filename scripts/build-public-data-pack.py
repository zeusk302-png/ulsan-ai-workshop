"""Publish a self-contained real-data exercise pack, separate from the old synthetic case."""
from pathlib import Path
import json,re,html,zipfile,hashlib

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/automation/public-data'

def write(path,text):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(text.rstrip()+'\n',encoding='utf-8',newline='\n')

def main():
    meta=json.loads((ROOT/'content/public-data-course.json').read_text(encoding='utf-8'))
    js=(ROOT/'src/guided-automation-data.js').read_text(encoding='utf-8')
    prompts={key:re.search(r'export const '+key+r'=`(.*?)`;',js,re.S).group(1) for key in ['ragHandoffRequest','fileExecutionLead','repeatRequest']}
    for key,name in [('ragHandoffRequest','01-rag.txt'),('fileExecutionLead','02-file-ai.txt'),('repeatRequest','03-repeat.txt')]:write(OUT/'prompts'/name,prompts[key])
    agents='''# 울산 공공데이터 보고 작업 지침

## 목표와 자료
소상공인시장진흥공단의 울산 상가업소 2026-06-30·2026-09-30 공개 스냅샷 전체와 공식 업종코드표를 처리해 새 XLSX와 편집 가능한 5장 PPTX를 만든다. 학생 개인정보나 가상 참가자·만족도 데이터가 아니다. 작업 기준은 references/all-references.txt의 공식 원문과 강사 업무 안내를 구분해서 읽는다.

## 원본 보존과 전체 처리
- data/ulsan-two-quarters.zip의 원본 CSV 두 개와 data/industry-codes-2023.csv를 실제로 읽는다. ZIP 미지원이면 같은 이름의 CSV 두 개를 직접 첨부한다.
- 두 업소 CSV는 UTF-8, 공식 업종코드표는 CP949다. 코드는 문자열로 읽고 선행 0과 원본 값을 보존한다.
- 원본 39열과 모든 행을 보존한다. 미리보기나 임의 표본을 전체 처리라고 보고하지 않는다. 원본을 덮어쓰거나 공란을 추정해 채우지 않는다.
- 업소번호의 누락·중복과 각 파일의 실제 행 수를 먼저 검사한다. 중복이 있으면 임의로 첫 행을 고르는 과거 가상 사례 규칙을 적용하지 않는다.

## 코드와 두 시점의 의미
- 상권업종소분류코드와 코드표의 소분류코드로 연결하고 코드표의 유일성을 확인한다. 원본 업종명과 코드표 업종명은 각각 별도 열로 남긴다. 명칭 차이를 잘못된 행으로 제외하지 않는다.
- 상권업종과 표준산업분류, 행정동과 법정동을 구분한다. 행정동별 표는 코드와 구·군 이름을 함께 사용해 동명이름이 합쳐지지 않게 한다.
- 상가업소번호로 두 시점의 계속 관측·새로 관측·다음 시점 미관측을 구분한다. 이를 실제 개업·폐업으로 단정하지 않는다.
- 경도·위도의 빈값·숫자 형식·범위를 검사한다. 동일 업소의 좌표 변경과 주소 변경을 따로 센다. 좌표 변경만으로 이전했다고 결론 내리지 않는다.
- 매출·영업 이익·인구당 업소 수·변화 원인은 필요한 원천 자료가 없으면 산출하거나 추정하지 않는다.

## 결과와 완료
- 구·군×업종 분포, 코드표로 확인한 카페의 행정동 분포, 두 시점 관측 비교, 품질·출처를 담은 XLSX를 새로 저장한다. 원본 CSV를 XLSX에 전부 넣지 않았다면 원본은 별도 CSV이며 전체 행을 처리한 집계임을 명시한다.
- 제공된 ulsan-report-template.pptx의 5장 구성을 사용한다. 제목·본문·표는 수정 가능한 객체로 만들고 숫자·시점·출처를 XLSX와 일치시킨다.
- 파일을 실제 저장한 뒤 다운로드로 제공한다. 설명·목차·진행 메시지만으로 생성 완료라고 말하지 않는다. 직접 열어 보지 못했거나 지원하지 못한 기능은 구체적으로 알린다.
'''
    write(OUT/'AGENTS.md',agents)
    write(OUT/'CLAUDE.md','''@AGENTS.md

# 같은 공공데이터 작업에 적용
공통 목표·원본 보존·코드 연결·시점 해석·출력 조건은 AGENTS.md를 따른다. 현재 도구가 참조 파일을 읽었는지 확인하고, 지원하지 않으면 해당 원문을 직접 전달한다. 웹 AI는 컴퓨터에 폴더가 있다는 이유만으로 이 파일들을 읽지 않는다.
''')
    readme='''# 실제 울산 공공데이터로 엑셀·PPT 만들기

guide/start-here.html을 브라우저에서 열면 자료 준비부터 결과 파일 확인까지 따라갈 수 있다. 기본 실습에 API 키 발급·프로그래밍·셀 주소·수식 입력·자기판단 작성은 필요하지 않다.

1. references/all-references.txt를 자료 기반 AI의 새 노트북에 등록한다. 공식 가이드 원문·항목 설명·업종코드표와 강사 업무 안내가 한 파일에 있으므로 소스 1개로 표시된다.
2. prompts/01-rag.txt를 보내고 실제로 생성된 업무 기준과 실행 프롬프트 두 부분을 모두 복사한다.
3. 파일 작업 AI에 실제 답변 두 부분과 data/ulsan-two-quarters.zip, data/industry-codes-2023.csv, templates/ulsan-report-template.pptx를 함께 첨부한다. ZIP을 못 읽으면 압축을 풀고 원본 CSV 두 개를 각각 첨부한다. prompts/02-file-ai.txt는 실제 답변 앞에 붙이는 시작 문장이다.
4. 새 XLSX와 PPTX를 내려받아 열고 내용·시점·출처·차트·5장 구성과 제목·표의 편집을 확인한다. 같은 파일에서 다른 업종으로 다시 작업할 때 prompts/03-repeat.txt를 사용한다.

원본은 2026년6월54,737행·9월53,777행이며 각각39항목이다. 전체108,514행은 실제 공식 배포 원본이며, 행을 복제하거나 오류를 주입하지 않았다. 2023 업종코드표는247개 항목이다. 코드표와 원본의 이름 표기가 달라도 원본을 덮어쓰지 않는다.

examples의 파일은 강사가 전체 원본을 처리해 준비한 집계 예시다. 자신의 AI에서 생성한 파일과 구분한다. 원본은 별도 CSV로 제공하며 요약 XLSX에 모든 원본 셀이 들어 있다고 주장하지 않는다.

공식 데이터: https://www.data.go.kr/data/15083033/fileData.do
공식 업종코드: https://www.data.go.kr/data/15067631/fileData.do
공식 가이드: https://www.data.go.kr/data/15012005/openapi.do
출처·추출 방법·해시·기준일은 provenance.json 및 references/manifest.json에서 확인한다.

AGENTS.md·CLAUDE.md와 폴더 구조는 선택 참고다. 이전 가상 72문서·참가자 1만 행 과제는 별도 준비/원리 예제로 보존하며 이번 실제 상가업소 기준에 혼용하지 않는다.
'''
    write(OUT/'README.md',readme)
    docs=[('ragHandoffRequest','자료 기반 AI에게 보낼 요청'),('fileExecutionLead','파일 작업 AI 시작 문장'),('repeatRequest','다른 업종으로 반복할 요청')]
    prompt_html={key:f'<h3>{label}</h3><pre>{html.escape(prompts[key])}</pre>' for key,label in docs}
    screenshot_html=''
    capture_path=ROOT/'content/automation-public-data-captures.json'
    if capture_path.exists():
        cap=json.loads(capture_path.read_text(encoding='utf-8'))
        for c in cap.get('captures',[]):
            source=ROOT/'public'/c['file'];target=OUT/'guide/screens'/source.name
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(source.read_bytes())
            screenshot_html+=f'<figure><a href="screens/{source.name}"><img src="screens/{source.name}" alt="{html.escape(c["alt"])}" loading="lazy"></a><figcaption><b>{html.escape(c["caption"])}</b><p>{html.escape(c["click"])}</p><p>{html.escape(c["expected"])}</p><small>{html.escape(c.get("note",""))}</small></figcaption></figure>'
    page=f'''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>실제 울산 공공데이터 · 네 단계 시작 안내</title><style>body{{max-width:1020px;margin:40px auto;padding:0 22px;font-family:system-ui,'Malgun Gothic',sans-serif;line-height:1.9;color:#20372b;background:#f6f8f2}}h1{{font-size:32px}}h2{{font-size:25px}}section,details{{background:white;border:1px solid #c4d1ba;padding:25px;margin:24px 0}}a{{color:#244f39}}nav{{display:flex;gap:20px;flex-wrap:wrap}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:14px;background:#f1f5eb;padding:20px}}table{{border-collapse:collapse;width:100%}}th,td{{padding:12px;text-align:left;border:1px solid #c4d1ba}}img{{width:100%;height:auto}}figure{{margin:25px 0}}small{{color:#53634a}}@media(max-width:600px){{body{{padding:0 14px;margin:20px auto}}section,details{{padding:18px}}h1{{font-size:26px}}}}</style>
<header><p>실제 공공데이터 / 울산 상가업소</p><h1>설명서에서 기준을 받고,<br>실제 데이터로 엑셀·PPT를 만듭니다</h1><p>6월54,737행과9월53,777행, 각각39항목을 그대로 사용합니다. 원본을 복제해 규모를 늘린 자료가 아닙니다. 코드·업종·행정동·주소·좌표를 연결해 한 업무를 완성합니다.</p></header><nav><a href="#step1">1. 자료 등록</a><a href="#step2">2. 요청 추출</a><a href="#step3">3. 실제 파일 작업</a><a href="#step4">4. 파일 열기</a><a href="#workspace">선택 지침·폴더</a></nav>
<section id="step1"><h2>1. 통합 참고자료를 자료 기반 AI에 등록하세요</h2><p><a href="../references/all-references.txt" download>RAG 통합 참고자료 TXT 받기</a> · <a href="../references/all-references.html">웹에서 원문·출처 읽기</a></p><ol><li><a href="https://notebook.google.com/" target="_blank" rel="noreferrer">Gemini Notebook</a> 등 자료 기반 AI에서 새 노트북을 만듭니다.</li><li>소스 추가 → 파일 업로드에서 통합 TXT 한 개를 고릅니다.</li><li>등록이 끝나 소스 목록에 파일이 보이는지 확인합니다. 여러 문서를 한 파일로 묶었으므로 소스1개가 정상입니다.</li></ol><p>RAG에는 설명서·항목 정의·코드표·업무 안내를 넣습니다. 업소 원본 전체는3단계 파일 작업 AI에 별도로 전달합니다. API 키 발급은 필요하지 않습니다.</p></section>
<section id="step2"><h2>2. 기준과 다른 AI에게 줄 실행 요청을 함께 받으세요</h2><p>아래 요청을 등록한 자료에 질문합니다. 실제 답변의 ①적용할 기준과 주의사항 ②파일 작업 AI에게 줄 실행 프롬프트 두 부분을 함께 복사합니다.</p>{prompt_html['ragHandoffRequest']}<p>이름이 다른 업종을 코드로 연결하는 방법과 두 시점 관측의 의미를 원문 근거로 안내하는지 확인합니다. 이 단계의 AI는 업소 원본을 아직 받지 않았으므로 실제 집계·파일 생성 완료 단계가 아닙니다.</p></section>
<section id="step3"><h2>3. 실제 답변과 자료 세 개를 파일 작업 AI에 주세요</h2><ul><li><a href="../data/ulsan-two-quarters.zip" download>두 분기 원본 ZIP</a> 안에 ulsan-202606.csv와 ulsan-202609.csv가 있습니다.</li><li><a href="../data/industry-codes-2023.csv" download>공식 업종코드표 CSV</a>는 CP949입니다. 인코딩 처리는 AI에게 맡깁니다.</li><li><a href="../templates/ulsan-report-template.pptx" download>5장 발표 양식 PPTX</a></li></ul><ol><li><a href="https://chatgpt.com/" target="_blank" rel="noreferrer">파일 생성이 가능한 AI</a>의 새 대화에서 + 또는 클립을 눌러 세 파일을 첨부합니다.</li><li>2단계에서 실제 받은 두 부분의 답변을 함께 붙여넣고 전송합니다.</li><li>새 XLSX와 PPTX 다운로드가 나올 때까지 기다립니다. ZIP을 못 읽으면 압축을 풀고 원본CSV2개+코드표+양식4개를 첨부합니다.</li></ol>{prompt_html['fileExecutionLead']}<p>설명·목차·“완료”라는 메시지만 있고 파일이 없으면 완료가 아닙니다. 결과 파일이 없다고 하면 원본과 기준을 다시 전달해 실제 저장과 다운로드를 요청합니다. 계정에서 지원하지 않으면 강사 예시로 결과 확인을 이어갑니다.</p></section>
<section id="step4"><h2>4. 실제 파일을 열고 내용을 수정해 보세요</h2><ol><li>응답 아래의 실제 XLSX·PPTX 파일 이름 카드를 엽니다. 미리보기 위쪽의 다운로드를 눌러 두 파일을 받습니다.</li><li>엑셀의 구군·업종·행정동 집계와 차트, 발표의5장 구성·시점·출처를 확인합니다.</li><li>PPT 제목과 표의 내용을 직접 선택해 수정합니다. 엑셀과 발표 내용이 같은지 봅니다.</li><li>원본은 남겨 두고 새 파일로 보관합니다.</li></ol><p><a href="../examples/ulsan-summary.xlsx" download>강사 집계 XLSX 예시</a> · <a href="../examples/ulsan-report.pptx" download>강사 PPTX 예시</a>. 예시 열기와 본인 AI의 생성을 구분합니다. 촬영한 실제 AI 실행의 수정본도 <a href="../actual-run/ulsan-analysis-v2.xlsx" download>XLSX</a>와 <a href="../actual-run/ulsan-presentation-v2.pptx" download>PPTX</a>로 별도 제공합니다. 예시는 원본 전체를 처리한 요약이며 원본CSV는 별도로 제공합니다.</p>{prompt_html['repeatRequest']}<p>다른 대화나 도구에서 반복한다면 기준·실행 요청·원본·코드표·양식을 모두 다시 전달합니다. 단일 스냅샷 변화로 실제 개업·폐업·매출·이전을 단정하지 않습니다.</p></section>
<details id="workspace"><summary>선택 참고 · 실제 작업 폴더와 지침 파일</summary><h2>폴더를 나누는 이유</h2><pre>ulsan-public-data/
├─ data/          원본CSV·두분기ZIP·공식코드표
├─ references/    공식가이드·충실추출TXT·항목설명·출처
├─ templates/     발표양식
├─ prompts/       RAG·파일작업·반복 요청
├─ examples/      강사 제공 집계 예시
├─ guide/         지금 읽는 웹 안내
├─ AGENTS.md      일부 로컬 도구의 공통 작업 지침
└─ CLAUDE.md      공통 지침 참조</pre><p>원본을 보존하고 결과와 구분하면 새 분석을 하거나 수정을 요청할 때 같은 입력으로 다시 시작할 수 있습니다. data/의 공란과 코드값을 손으로 고치지 않고 새 결과를 별도로 만듭니다. AGENTS.md는 반복할 목표·읽을 자료·처리 원칙·출력 조건을 한곳에 두기 위한 파일입니다. 파일의 자동 발견·적용 범위는 도구마다 달라 실제로 읽었는지 확인해야 합니다. 웹 AI에서는 필요한 내용을 직접 붙이거나 첨부합니다.</p><h3>AGENTS.md 원문</h3><pre>{html.escape(agents)}</pre><h3>CLAUDE.md 원문</h3><pre>{html.escape((OUT/'CLAUDE.md').read_text(encoding='utf-8'))}</pre></details>
<section><h2>실제 화면으로 따라가기</h2><p>아래 화면은 실제 서비스와 편집기에서 촬영했습니다. 강사 예시를 연 화면과 실제 AI 실행 상태는 각 캡션에서 구분합니다. 사진을 누르면 원본 크기로 볼 수 있습니다.</p>{screenshot_html or '<p>현재 웹 교재의 실제 화면 안내를 함께 참고하세요.</p>'}</section><footer><p>데이터: 소상공인시장진흥공단 / 공공데이터포털. 수업 구성과 집계 예시는 강사 제작입니다. 실제 기관의 정책 판단·영업 성과 보고서가 아닙니다. <a href="../provenance.json">원본 출처·해시·처리 범위</a></p></footer><script>function revealWorkspace(){{if(location.hash==="#workspace")document.getElementById("workspace").open=true;}}revealWorkspace();addEventListener("hashchange",revealWorkspace);</script></html>'''
    write(OUT/'guide/start-here.html',page)
    required=['data/ulsan-two-quarters.zip','data/industry-codes-2023.csv','references/all-references.txt','references/all-references.html','references/manifest.json','templates/ulsan-report-template.pptx','examples/ulsan-summary.xlsx','examples/ulsan-report.pptx']
    for name in required:assert (OUT/name).is_file(),name
    bundle=OUT/'ulsan-public-data-workspace.zip'
    with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(OUT.rglob('*')):
            if p.is_file() and p!=bundle and not p.name.startswith('~$'):
                z.write(p,'ulsan-public-data/'+p.relative_to(OUT).as_posix())
    with zipfile.ZipFile(bundle) as z:
        assert z.testzip() is None
        for p in meta['provenance']:
            rel=p['localPath'].removeprefix('automation/public-data/')
            assert hashlib.sha256(z.read('ulsan-public-data/'+rel)).hexdigest()==p['sha256']
    print(json.dumps({'bundleBytes':bundle.stat().st_size,'fullRows':sum(s['rows'] for s in meta['snapshots'].values()),'sourceCSV':'byte-identical','guide':'complete 4-stage flow'},ensure_ascii=False))

if __name__=='__main__':main()
