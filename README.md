# 울산대학교 AI 실습실

2026-11-06 최신 중급반은 **실제 울산 상가 공공데이터**를 사용하는 [네 단계 웹 교재](https://zeusk302-png.github.io/ulsan-ai-workshop/#automation?course=intermediate)로 개편했습니다. 2026-06-30 **54,737행**과 2026-09-30 **53,777행**, 합계 **108,514행·각39열**의 공식 원본을 변경 없이 제공합니다. 공식 활용가이드 전문 추출100,418자·항목 설명·247개 업종코드표와 별도 강사 안내로 구성한 참고문서6개를 통합TXT 하나로 등록합니다. RAG가 실제 생성한 **기준과 실행 프롬프트 두 부분 모두**를 복사하고, 파일 작업 AI에 **두 시점 데이터ZIP·공식 코드표CSV·PPTX 양식** 세 개와 함께 전달해 실제XLSX·5장PPTX를 받습니다. 셀 주소·수식·코딩·퀴즈·기록폼은 기본 수업의 선행 과제가 아닙니다. 이전72문서 가상사례·원리·도구 설정과 이전 화면은 접힌 선택 참고로 보존합니다. 강사 예시는 별도 제작 도구(artifact-tool)로 생성한 검토용 파일이며 ChatGPT 생성 결과가 아닙니다. 공식 출처·자료 등록·실제 기준 추출·파일 첨부·Excel·PowerPoint를 촬영한 새 화면14장과 새 원리 도식3종을 제공합니다. 실제 외부AI에서도13시트XLSX와5장PPTX를 생성·다운로드했고,800개 주요수치 대조·설명 수정·수식과차트 보존·실제 Office 열기와 PPT 제목 편집을 확인했습니다. 공개 배포, 실제 페이지 동작과 주요 다운로드7개의 바이트 일치를 확인했습니다. 상세 범위는 [실제 공공데이터 수업 기록](docs/public-data-course-2026-11-06.md), 검증은 [검증 기록](docs/verification.md)을 보세요.

아래의72문서·1만행 가상 실습 설명은 이전 개편 이력이며 현재 기본 수업의 입력과 구분합니다.

2026-11-06 중급반 개편: [다중문서 업무·원리 그림](https://zeusk302-png.github.io/ulsan-ai-workshop/#automation?course=intermediate&unit=rag&focus=documents&detail=true)에 가상 기준·개정·예외·과거 보고 72문서(본문 약8.9만자, 통합PDF77쪽), 12개 업무 요청과 실제 다운로드를 제공합니다. 같은8행을 원문→판정→수식→차트→PPT→오류수정으로 연결하는10종 원리 모형을 추가했습니다. 자기판단·답안 비교·예측퀴즈·측정폼은 없으며, 문서 선택→실제 AI 실행→XLSX·PPT 산출물 확인으로 진행합니다. 본실습은 회차별1만행, 확장은10만행이며 기존 교재PDF·Office 예시·작업 기록은 보존합니다.

2026-11-06 PPT 참고 안내: [스킬·디자인·GitHub 자료실](https://zeusk302-png.github.io/ulsan-ai-workshop/#automation?course=intermediate&unit=ppt&focus=resources&detail=true)에 공식 자료11개를4분류로 소개합니다. 사용 시점·AI 전달 방법·출력·한계·개별 이용 조건·복사 요청, 디자인7원칙의 전후 모형과 실제 브리프를 제공합니다. 본 PPT20분 활동은 참고1개·원칙2개 적용이며 나머지는 자습 참고입니다. 데이터 근거와 디자인 참고를 분리하고 기존1만 행 검산 수치·출처를 유지합니다. 외부 스킬·코드·에셋 원문은 교재에 복제하지 않았습니다.

2026-11-06 중급반 데이터 확장: 10단원·44개 따라 하기 단계의 주 실습은 회차별 **1만 행 XLSX 두 개**, 준비 연습은48행, 선택 확장은10회차·10만 행 UTF-8 CSV로 구성합니다. 공백·누락·중복·참여값 오류·만족도 빈값/형식오류를 전체 행에서 정리하고 집계·차트·PPT로 연결합니다. 원본 전체 수와 제외·보류·분모를 검산하며, 미리보기 몇 행을 전체 처리로 표시하지 않습니다. 기존48행 메모·체크는 보존하고 본 실습은 새 검토 기록을 사용합니다.

2026-11-06 중급반 웹 개정: [중급반 전체 수업](https://zeusk302-png.github.io/ulsan-ai-workshop/#automation?course=intermediate&unit=purpose)은 지침 파일·작업 폴더·RAG 근거 → 엑셀 정리·수식·집계·차트 → PPT 제작·검토·새 회차 실행을 연결합니다. 3교시·10단원·41개 따라 하기 단계이며 단원마다 필요한 이유, 조작형 도식, 판단표, 예상 결과와 문제 해결을 제공합니다. 실제 AGENTS.md·CLAUDE.md 원문과 폴더 구조를 웹에서 확인할 수 있고, 가상 데이터·수식 XLSX·편집 가능한 PPTX·운영 기준·실습 ZIP을 내려받습니다. 새 단원 메모·체크는 기존 JSON 백업에 함께 보존합니다. 상세 편성과 검증 범위는 `docs/intermediate-course-2026-11-06.md`, `docs/verification.md`를 보세요. 아래의 이전 중급 사례·시간표는 참고 기록이며 현재 중급 주 수업은 새 웹 교재입니다. PDF v2.1은 이전 편성의 기본 교재로 유지합니다.

2026-11-05 초급반 웹 개정: [초급반 수업](https://zeusk302-png.github.io/ulsan-ai-workshop/#basics?unit=ai)은 3교시·10중단원·30소단원으로 AI 원리·모델/요금제·환각, 토큰/컨텍스트/요청, RAG/노트북을 다룹니다. 홈페이지는 강의 제목·QR을 담은 독립 로비이며 기초반·심화반 소개와 입장 링크를 제공합니다. 수업 화면 상단에서도 QR을 열 수 있습니다. PDF v2.1은 유지합니다. 현재 웹 편성·저장 호환·검증 범위는 `docs/beginner-course-2026-11-05.md`를 기준으로 보세요. 아래 기록의 이전 초급 편성보다 이 개정이 우선합니다.

일반인·학생·구직자·직장인을 위한 초급반·중급반 독립 AI 실습 과정입니다. 각 반은 3시간이며, 중급반도 AI 기본 안내부터 시작합니다. 초급반 수강은 필수가 아닙니다.

## 교육 방향

- 초급반 180분: 50분씩 3교시(개념·시연·실습 포함), 휴식 20분, 정리 10분. 중급반 180분: 개념·시연 30분, 직접 실습 120분, 휴식 20분, 정리 10분.
- 진행 흐름: 목적·기준 → 자료·컨텍스트 → 추출·구조화 → 근거 조회·RAG → 작성·수정 → 평가·오류 진단 → 저장·재사용.
- 실제 공개 공문·법령·편람 전문을 사용하며 실제 개인정보와 기밀자료를 요구하지 않습니다.

## 구현 범위

GitHub Pages에서 동작하는 정적 웹 플랫폼으로 구성합니다. 실습별 안내, 샘플 자료, 프롬프트 복사, 결과물 작성, 완료 표시, 브라우저 저장, 파일 내보내기를 제공합니다. 서버 기반 회원가입이나 과제 제출 기능은 범위에 포함하지 않습니다.

## 사이트

배포 주소: https://zeusk302-png.github.io/ulsan-ai-workshop/

`main`에 push하면 GitHub Actions가 테스트·빌드 후 GitHub Pages에 배포합니다. 실제 최신 배포 상태는 저장소의 Actions 및 Environments에서 확인합니다.

초급반 수업: https://zeusk302-png.github.io/ulsan-ai-workshop/#basics?unit=ai

중급반 진입: https://zeusk302-png.github.io/ulsan-ai-workshop/#intermediate

기존 실습 ID와 저장 키를 유지합니다. `day`와 `days`는 기존 데이터 호환용 내부 분류 키이며 화면·교재에서는 초급반·중급반으로 표시합니다.

## 사용 방법

1. 초급반은 `초급반 수업`에서, 중급반은 `AI 활용 흐름`에서 AI의 처리와 사람의 판단, 단계별 입력·결과·통과 기준을 확인합니다.
2. `실제 문서 자료실`에서 전체 원문 파일을 준비하고 AI 도구에 등록한 뒤 `자료·프롬프트`의 요청을 실행합니다. 이 플랫폼 자체는 AI를 호출하지 않습니다.
3. 연결된 사례의 `내 작업`에 결과와 프롬프트·근거·미결을 기록합니다. 새 기준의 검토 항목 세 개를 확인하고 검토 완료를 기록합니다.
4. `내 작업함`에서 전체 텍스트 또는 JSON 백업을 내려받습니다. 다른 기기에서는 JSON 백업을 가져옵니다.

결과물과 진행률은 현재 브라우저의 localStorage에 저장되며 서버에 제출되지 않습니다. 공용 PC에서는 백업 후 기록을 초기화하세요. 무료 AI 도구는 가입·로그인 및 사용 한도 제한이 있을 수 있습니다.

## 자세한 안내와 실제 화면

수강생 교재PDF는 첫 화면·자료실·상단 및 메뉴에서 내려받습니다. 79쪽이며 반별 독립 시간표·AI 기본 안내·개념6개·실습6개·전체프롬프트·실제화면31개·원문링크·검토/저장양식과 공고전문을 포함합니다. 공고HWP와TXT4개를PDF첨부파일로 보존했고, 기관 전체PDF2개는 원본 링크로 제공합니다. 사이트 없이 교재의 순서와 요청으로 진행하고 결과는 메모장·문서편집기에 저장할 수 있습니다. 실제AI도구와원문다운로드에는인터넷이 필요합니다.

재생성: `node scripts/export-workbook-data.mjs`, `python scripts/build-student-workbook.py`, `python scripts/verify-student-workbook.py`. Windows맑은고딕·Python의reportlab/PyMuPDF/Pillow를 사용합니다. 최종배포파일은 `public/course/`, 동일한로컬교재는 `output/pdf/`에 생성합니다. `content/student-workbook.json`은분량·SHA-256·교재입력해시를 보존하며 내용수정 후 교재재생성이 필요한지CI에서 검사합니다.

`AI 활용 흐름`(#concepts)은 반별 7단계를 중심으로 AI가 줄이는 수고와 사람이 판단할 부분을 설명합니다. 초급은 17쪽 업무계획 하나를 추출·구조화·작성·검토하고, 중급은 편람383쪽·규정·공고의 역할을 구분해 RAG 조회·인용 대조·문서 작성·컨텍스트 전환을 설계합니다. 두 반 모두 AI 기본부터 시작하는 독립180분 과정입니다. 설명·시연30분, 단계 실행·분석120분, 휴식20분, 정리10분을 유지합니다. 흐름·소스 선택·RAG5단계·컨텍스트 트리·오류 복귀·하네스 도식을 제공합니다. 설계와 사례 대응은 `docs/workflow-redesign.md`에 있습니다.

각 실습에 시간별5단계 안내, 확인할 결과, 후속 요청과 문제 해결, 다른 작업에 적용할 조건를 제공합니다. `실제 화면` 탭에는 편람383쪽·업무계획17쪽·공고·법령을 직접 등록해 실행한 캡처가 있습니다. 기존 캡처 파일은 보존하며 화면별 실제 사용 자료와 새 요청의 차이를 설명합니다. 화면은 확대·전체 맞춤과 원본 새 탭 열기를 지원합니다.

공식 문서6개의 분량·출처·수집일·시행일과 원문 다운로드, 공고·법령 전문 읽기·검색·복사를 제공합니다. 편람의 실제 추출 본문은11,521줄이며 빈 줄을 늘려 분량을 만들지 않습니다. 전체PDF2개는 발행기관에서 내려받습니다. 자료 출처·범위·실제AI 오류 대조는 `docs/official-document-lab.md`에 기록했습니다.

실제 캡처는 AI 생성 이미지나 재구성 화면이 아닙니다. 개인정보 영역만 제외했으며, AI 답변에 나타난 부정확한 표현은 이미지에서 고치지 않고 별도 검토 지점으로 설명합니다. 계정·시점별 메뉴 차이와 캡처 계정의 유료 기능 표시가 있을 수 있습니다. 자세한 캡처 범위와 검증은 `docs/real-screen-guide.md`에 있습니다.

## 로컬 실행

Node.js 22 이상을 권장합니다.

```sh
npm ci
npm run dev -- --port 8289
```

앱: http://127.0.0.1:8289/

OpenDesign viewer: http://127.0.0.1:8289/opendesign/

```sh
npm test
npm run build
npm run preview
```

## 디자인

[manalkaff/opendesign](https://github.com/manalkaff/opendesign)의 opendesign, frontend-design, interactive-prototype, setup-opendesign, run-opendesign 스킬을 참고했습니다. 사용자 제공 강좌 개요의 흑백 구조를 바탕으로 차콜 탐색 메뉴, 종이색 작업 공간, 올리브·라임 진행 표시를 적용했습니다.

스킬 출처와 버전은 `opendesign/PROVENANCE.md`, 디자인 규칙은 `opendesign/design-systems/workroom/SKILL.md`에 기록했습니다. upstream viewer의 MIT 라이선스는 `opendesign/UPSTREAM-LICENSE`에 보존합니다.

Google Fonts의 Noto Sans KR와 IBM Plex Mono를 사용하며 외부 폰트를 가져올 수 없으면 로컬 대체 글꼴로 표시합니다. UI 아이콘은 lucide-react입니다.

## 파일

- `content/curriculum.json`: 반별 독립 과정 시간표와 실습 목표
- `docs/platform-brief.md`: 화면, 기능, 디자인, 검증 기준
- `src/content.js`: 6개 실습의 자료·프롬프트·검토 항목·강사 예시
- `src/main.jsx`, `src/style.css`: 실제 앱과 반응형 스타일
- `src/state.js`: 저장 데이터와 백업 검증
- `tests/state.test.js`: 시간표·콘텐츠·저장 데이터 검증
- `src/walkthroughs.js`, `src/LessonGuide.jsx`: 상세 단계·후속 요청·확대 화면
- `content/screen-captures.json`, `public/screens/`: 실제 캡처 설명·해시·파일
- `tests/walkthroughs.test.js`, `tests/walkthrough-qa.cjs`: 상세 안내와 실제 화면 검증
- `.github/workflows/pages.yml`: GitHub Pages 배포

## 운영 시 수정

웹 사례는 `src/flow-lessons.js`, 웹 시간표는 `src/flow-curriculum.js`, 원리와 사례별 설명은 `src/flow-content.js`에서 수정합니다. `src/content.js`와 `content/curriculum.json`은 현재 PDF의 교재용 원본입니다. 식별자와 저장 호환을 유지하고 `npm test`를 실행하세요. 강의 날짜는 확정되지 않아 플랫폼에 실제 행사 일정을 표시하지 않습니다. 공식 문서의 과거 접수일정은 강의 일정이 아닙니다. 민원법2026-12-03시행예정본은 추가 비교용으로 구분합니다.

`src/PdfReader.jsx`는 Mozilla PDF.js(Apache-2.0)로 내려받은 PDF 전체를 현재 브라우저에서 읽습니다. 원문 파일 전송 없이 페이지 이동·확대·전체 본문 검색을 지원합니다. 라이선스는 `public/PDFJS-LICENSE.txt`에 보존합니다.

## 웹 흐름과 교재 버전

2026-11-04 웹을 작업 흐름 중심으로 개편했습니다. 웹의 사례 요청·검토 기준·시간 배정은 표시 계층에서 새로 구성하며 기존 교재용 원문과 PDF v2.1은 유지합니다. 다운로드 PDF는 새 7단계 편성과 다를 수 있음을 화면에 명시합니다. `content/web-copy-revision.json`과 CI는 PDF 바이트 및 교재용 개념 데이터가 그대로인지 확인합니다.

기존 저장 글·프롬프트·이전 검토 기록은 보존합니다. 새 검토 기준은 같은 저장 키의 별도 `workflow` 필드에 기록하며 기존 완료 표시를 자동 승계하지 않습니다. JSON 백업은 두 기록을 함께 담습니다.

`#concepts?course=beginner&stage=purpose`에서 7단계 흐름을, `#concepts?course=intermediate&stage=evidence`에서 RAG 처리를 엽니다. 기존 `topic` 주소도 관련 흐름으로 연결됩니다. `#reference?course=beginner&topic=context`는 개념·도구 참고서입니다. 고유 주제15개를 양 과정 모두 제공하며 기존 상세 설명·도구 사용법·판단 사례·공식 출처를 유지합니다.

검증: `npm test`, `npm run build`. 재현용 브라우저 스크립트는 `tests/workflow-qa.cjs`(새 흐름), `tests/concepts-qa.cjs`(참고서), `tests/browser-qa.cjs`(저장·사례), `tests/walkthrough-qa.cjs`(단계·캡처)입니다. 이번 초급반 개정은 `scripts/verify-beginner-structure.mjs`로 정적 렌더링을 검사했습니다. 브라우저 제어가 비활성화되어 이번 화면 QA는 실행하지 못했으며, 이전 판의 UI 검증과 범위는 `docs/verification.md`에 구분해 기록합니다. 재현용 CLI 브라우저 스크립트의 실행을 이번 검증으로 주장하지 않습니다.

수업 시각화는 `src/LearningVisuals.jsx`에서 제공합니다. 작업 분담표, 실제 원문과 정리표·초안·주장 검토의 비교, RAG 소스·근거·주장 연결, 컨텍스트의 유지·제외 비교, 전체 폭 실제 캡처를 제공합니다. 인용 자료는 `src/visual-examples.js`에서 보존 원문과 대조하며 새 AI 실행 결과로 표시하지 않습니다. 점검·개선 범위는 `docs/visual-revision.md`에 있습니다.
