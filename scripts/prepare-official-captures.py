"""Privacy-only crops of actual browser captures; never changes UI/answers."""
from pathlib import Path
from PIL import Image
import hashlib,json
R=Path(__file__).resolve().parents[1]
raw=R/'artifacts/official-captures'
entries={
'official-platform-pdf':('AI WORKROOM','사이트 안에서383쪽 편람 원본 읽기','내려받은 전체PDF를 선택해383쪽을 실제로 열었습니다.','쪽수 이동·확대·전체 검색으로 원본을 대조합니다. 파일은 브라우저에서만 읽습니다.'),
'official-platform-search':('AI WORKROOM','383쪽 전체 검색에서 원문253쪽으로 이동','“인계”를 전체383쪽에서 검색해26개 쪽을 찾았습니다.','검색 결과의 쪽 번호를 눌러 원본 페이지로 이동한 실제 화면입니다.'),
'official-source-manual':('행정안전부','383쪽 편람의 공식 게시물·원본 첨부','편람의 게시일과PDF 첨부파일을 확인합니다.','전체PDF는 발행기관의 원문 다운로드로 준비합니다.'),
'official-source-notice':('울산 중구','실제 주민강사 공고와 HWP 붙임','지자체 공식 게시물의 공고 제목을 확인합니다.','본문뿐 아니라 첨부HWP의 신청서·운영계획서도 함께 읽습니다.'),
'official-corpus-ready':('Gemini Notebook','전체 편람·업무계획·공고·법령5개 등록','왼쪽 소스 목록에PDF2개와TXT3개가 등록되어 있습니다.','전체383쪽 편람의 처리가 끝난 실제 노트북입니다.'),
'official-notice-analysis':('Gemini Notebook','실제 공고의 조건표와 상충 수치','접수기간·방문접수·제출서류를 원문과 대조합니다.','12,000천원/12,000원 등 상충 금액을 임의로 하나로 정리하지 않습니다.'),
'official-notice-mail':('Gemini Notebook','상충 금액을 묻는 확인 메일 초안','본문과 붙임의 수치를 병기하고 확인 질문으로 바꿉니다.','이메일은 실제 전송하지 않은 초안입니다. 화면 속 답변도 사람이 검토합니다.'),
'official-notice-faq':('Gemini Notebook','실제 공고로 주민용 FAQ 작성','종료된 공고 표시와 운영 조건을 확인합니다.','초기 답변의 “우편·온라인 불가”는 원문보다 강한 표현입니다. 수정 화면과 비교하세요.'),
'official-notice-report':('Gemini Notebook','같은 공고로 내부 검토 보고서 작성','독자에 따라 구조가 바뀌지만 원문 사실은 유지해야 합니다.','“즉시 제외”나 “오기 추정”은 원문 근거가 부족합니다. 그대로 쓰지 않습니다.'),
'official-notice-revision':('Gemini Notebook','원문에 없는 단정을 찾아 수정','수정 전·원문 근거·수정 후를 나란히 확인합니다.','원문에 방문접수만 명시되어 있다는 사실과 다른 방식의 금지를 구분합니다.'),
'official-weekly-actions':('Gemini Notebook','17쪽 부서별 업무계획에서 실행 항목 추출','이번 질문에는 북구 업무계획 하나만 선택되어 있습니다.','일정·장소·예산·담당부서를 확인하고AI가 제시한 쪽수는 별도로 검증합니다.'),
'official-weekly-check':('Gemini Notebook','실제PDF와 시간·쪽수 오류 대조','원문 시간15:00~10:00을 임의로 고치지 않고 확인 필요로 둡니다.','확인한 PDF뷰어4쪽과 인쇄쪽수2쪽,AI의 첫 쪽수 주장을 구분합니다.'),
'official-manual-guidance':('Gemini Notebook','383쪽 편람과 법령으로 공문 작성 기준 찾기','2025편람과2026시행 규정의 버전을 구분합니다.','작성 기준의 조문·인용을 열어 실제 근거와 비교합니다.'),
'official-manual-draft':('Gemini Notebook','교육용 공문 초안과 남아 있는 검토 지점','공고 금액 확인 요청을 교육용 본문 초안으로 작성한 실제 응답입니다.','초안 위의 규정2024.5.21.판 주장도AI의 오류입니다. 등록한2026.10.2.판과 대조하고 문서번호·공개구분·붙임을 검토하세요.'),
'official-multi-source':('Gemini Notebook','5개 문서의 범위와 사업별 수치 비교','중구 주민강사 사업과 북구 청년사업을 구분합니다.','지역·목적·시점이 다른 자료의 지원금과 대상을 섞지 않습니다.'),
'official-citation':('Gemini Notebook','답변의 인용을 열어 실제 출처 대조','인용 번호를 누르면 근거 원문이 열립니다.','인용이 있다는 이유만으로 결론 전체가 맞는다고 판단하지 않습니다.'),
'official-template':('Gemini Notebook','공식 문서 검토용 재사용 템플릿 작성','입력 파일·버전과 고정 규칙을 나누어 작성합니다.','상충 보존·위치 표시·사실과 제안 구분을 다음 문서에도 유지합니다.'),
'official-template-test':('Gemini Notebook','업무계획만 선택해 템플릿 재시험','새 입력에 중구 공고의 사실이 섞이지 않는지 확인합니다.','같은 출력 구조로 다른 실제 문서를 분석한 결과를 비교합니다.')
}
p=R/'content/screen-captures.json';m=json.loads(p.read_text(encoding='utf-8'))
m['screens']=[s for s in m['screens'] if not s['id'].startswith('official-')]
for key,(tool,title,a,b) in entries.items():
 source=raw/(key+'.jpg')
 if not source.exists(): raise FileNotFoundError(source)
 im=Image.open(source)
 if not key.startswith(('official-source-','official-platform-')): im=im.crop((0,70,min(1640,im.width),min(1130,im.height)))
 target=R/'public/screens'/(key+'.jpg');im.save(target,quality=94,subsampling=0)
 data=target.read_bytes()
 m['screens'].append(dict(id=key,file=target.name,tool=tool,title=title,alt=title+'。'+a+' '+b,focus=[a,b],kind='official-workflow',gallery='library',source='http://127.0.0.1:8289/#documents' if tool=='AI WORKROOM' else ('https://notebook.google.com/' if 'Notebook' in tool else ('https://www.mois.go.kr/' if tool=='행정안전부' else 'https://www.junggu.ulsan.kr/edu/')),width=im.width,height=im.height,bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
m['method']='Actual browser screenshots: connected Chrome for official pages, AI workflows and PDF cover; Playwright Edge software verification for the fully rendered local PDF253 search page. Official workflows use the full383-page manual,17-page plan and original notice/statutes. Earlier fictional beginner captures are separately labelled. Privacy-only cropping excludes account areas; no UI or answer text is generated or altered.'
m['notice']='실제 브라우저 캡처입니다. 공식 문서 실습과 이전 가상 기초 사례를 구분해 표시합니다. 계정·개인 대화 목록은 제외했습니다. 화면의AI 응답에는 오류가 있을 수 있으며 수정 과정도 포함합니다. 화면·메뉴·기능은 계정과 업데이트에 따라 다릅니다.'
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print('official',len(entries),'total',len(m['screens']))
