// Original teaching copy. Linked third-party skills, libraries, fonts and assets are not bundled here.
export const resourceCategories = [
  { id: 'skills', label: '스킬·작업 절차' },
  { id: 'files', label: 'PPTX 파일 생성' },
  { id: 'alternatives', label: '웹·Markdown 발표' },
  { id: 'design', label: '디자인·아이콘·글꼴' },
];

export const comparisonColumns = ['구분', '주는 것', 'AI에 전달할 것', '직접 확인할 것'];
export const comparisonRows = [
  ['스킬', '조건·순서·검토를 담은 재사용 절차', '지원 환경·호출할 스킬·내 입력·완료 기준', '설치·활성 여부와 실제 수행 범위'],
  ['생성 라이브러리', 'PPTX 등을 만드는 코드 기능', '공식 API 문서·검산한 데이터·디자인 브리프', '실행 환경·생성 파일·요소 편집·레이아웃'],
  ['웹·Markdown 발표', '브라우저 또는 텍스트 중심 발표 방식', '원고·슬라이드 구조·원하는 출력 형식', 'HTML·PDF·PPTX의 차이와 편집 가능성'],
  ['디자인 에셋', '아이콘·글꼴 같은 개별 시각 재료', '선택한 에셋·역할·색·크기·이용 조건', '한글·표시·고지·다른 PC에서의 재현'],
  ['템플릿', '슬라이드 틀·자리표시자·서식', '수업에서 받은 report-template.pptx·채울 내용', '원래 틀과 수정된 내용·편집 가능성'],
];

export const skillStructureExample = `.agents/skills/report-review/      ← 설명용 경로
  SKILL.md                          ← 이름·설명·입력·검토 절차
  references/                       ← 내가 작성한 계산·보고 기준
  assets/                           ← 사용 권한을 확인한 양식
  scripts/                          ← 필요한 경우의 선택 실행 도구`;
export const skillStructureNote = 'OpenAI 공식 구조를 바탕으로 만든 자체 설명용 예시입니다. 이 페이지는 해당 폴더나 설치 패키지를 생성하지 않습니다. SKILL.md에는 name·description과 수행 절차가 들어가며 나머지 폴더는 선택입니다. 웹 채팅에 문서를 첨부한 것, 로컬 스킬 등록, 실제 스킬 활성·실행을 구분합니다. 외부 Proprietary 스킬 원문을 이 구조에 복사하지 않습니다.';

const commonFacts = '데이터 근거는 내가 제공한 운영 기준·검산 엑셀이며 디자인 참고와 분리한다. R01 참여율은7,509/9,824=76.4%, 만족도는27,379/7,181=3.81/5점이다. 프로그램 참여자는 디지털기초3,815명·생활문화2,438명·진로탐색1,256명이다. 숫자·분모·단위·회차·출처·가상 교육자료 표시는 유지한다. 디자인 예시의 수치·문장·사업성과를 내 자료의 사실로 가져오지 않는다.';

export const pptResources = [
  {
    id: 'openai-build-skills', name: 'OpenAI · Build skills', category: 'skills', owner: 'OpenAI',
    url: 'https://learn.chatgpt.com/docs/build-skills', docsUrl: 'https://developers.openai.com/plugins/concepts/skills',
    description: '반복 작업의 입력·절차·출력을 스킬로 구성하는 공식 안내입니다. 강의의 PPT 제작 순서를 재사용 절차로 설명할 때 참고합니다.',
    when: '다음 회차에도 같은 제작·검토 순서를 반복하려고 할 때. 수업에서는 구조를 이해하며 설치는 수행하지 않습니다.',
    how: [
      '공식 안내에서 SKILL.md의 이름·설명·절차와 선택적인 scripts·references·assets 역할을 확인합니다.',
      '내 작업을 “검산표 읽기→5장 구성→PPTX 생성→열어 검토”처럼 입력과 결과가 있는 절차로 적습니다.',
      '현재 Codex의 프로젝트 스킬 위치는 .agents/skills이며, 문서를 웹 채팅에 첨부한 것과 설치·자동 호출은 구분합니다.',
      '실제로 사용할 때는 해당 환경의 지원·등록 상태를 먼저 확인합니다. 이 페이지의 설명은 설치 패키지가 아닙니다.',
    ],
    aiPrompt: `${commonFacts}\n공식 Build skills 안내는 절차 구조를 이해하는 참고로 사용해 줘. 내 5장 보고 작업의 입력/실행 순서/결과/검토 기준을 먼저 설명해 줘. 지금은 스킬을 설치하거나 SKILL.md 패키지를 만들지 말고, 반복 가능한 작업 설명만 작성해 줘. 웹에 문서를 첨부한 상태와 설치·활성 상태를 구분해 줘.`,
    output: '재사용 작업의 설계 설명. 스킬 자체가 PPTX 파일은 아닙니다.',
    limit: '지원 환경과 활성 상태가 필요합니다. 구조를 적거나 문서를 읽었다고 실제 파일 생성이 실행된 것은 아닙니다.',
    license: { label: '공식 문서 · 참조', url: 'https://learn.chatgpt.com/docs/build-skills', note: '공식 문서를 링크로 참고합니다. 별도 예제 코드·에셋을 재사용할 때는 해당 파일의 이용 조건을 확인합니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'openai-plugins', name: 'OpenAI · Plugins 공식 예제 저장소', category: 'skills', owner: 'OpenAI',
    url: 'https://github.com/openai/plugins', docsUrl: 'https://developers.openai.com/plugins/concepts/skills',
    description: '스킬과 연결 도구가 어떤 역할로 묶이는지 살펴보는 현행 공식 예제 저장소입니다. 예전 openai/skills 저장소는 폐기 안내와 이 저장소로의 이동 안내가 있습니다.',
    when: 'AI가 참고할 저장소의 구조와 필요한 도구를 구분하려고 할 때. 전용 PPT 양식 묶음으로 보지는 않습니다.',
    how: [
      'README에서 예제의 목적과 구성 요소를 먼저 읽습니다. 파일 생성·연결 도구·스킬의 역할을 구분합니다.',
      '관심 있는 예제 폴더에서 지시 문서와 의존성, 이용 조건을 확인합니다. 저장소 전체를 한 가지 라이선스로 가정하지 않습니다.',
      'AI에게 공식 문서 URL과 원하는 출력·현재 가능한 도구를 전달하고, 내 환경에서 가능한 부분을 설명하게 합니다.',
      '읽은 방법과 실제 실행한 작업을 작업 기록에 나눠 적습니다. 이 실습에서는 플러그인을 설치하지 않습니다.',
    ],
    aiPrompt: `${commonFacts}\nhttps://github.com/openai/plugins 의 README는 방법 참고로만 읽어 줘. 내 환경의 파일 생성 도구와 스킬이 맡을 일을 구분하고, 예제에 필요한 도구·계정·이용 조건 중 확인하지 못한 것을 표시해 줘. 설치·연결·실행은 하지 말고 내 5장 PPT 제작 흐름과의 차이만 설명해 줘. README를 읽은 일을 파일 생성 완료로 표현하지 마.`,
    output: '공식 예제 구조와 내 도구의 역할 비교표.',
    limit: '예제 저장소를 보는 것만으로 도구가 설치·연결되지 않습니다. 외부 서비스 지원과 개별 조건은 선택한 예제에서 확인해야 합니다.',
    license: { label: '예제·파일별 확인', url: 'https://github.com/openai/plugins', note: '저장소 전체를 MIT·Apache로 일괄 표시하지 않습니다. 선택한 예제의 LICENSE·NOTICE와 외부 서비스 조건을 확인하고, 확인되지 않은 파일을 복제·배포하지 않습니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'anthropic-pptx', name: 'Anthropic · 공식 PPTX 스킬 안내 위치', category: 'skills', owner: 'Anthropic',
    url: 'https://github.com/anthropics/skills/tree/main/skills/pptx', docsUrl: 'https://github.com/anthropics/skills/blob/main/skills/pptx/LICENSE.txt',
    description: '공식 프레젠테이션 스킬의 공개 위치와 이용 조건을 확인하는 링크입니다. 이 교재에는 해당 스킬의 원문·코드·에셋을 넣지 않습니다.',
    when: '사용 중인 Anthropic 서비스에서 제공하는 프레젠테이션 기능과 그 이용 조건을 확인할 때.',
    how: [
      '먼저 해당 폴더의 LICENSE.txt를 공식 원문에서 확인합니다. 공개 열람과 자유 복제·배포를 같은 뜻으로 보지 않습니다.',
      '자신의 서비스에서 프레젠테이션 기능이 실제로 제공되는지 확인하고 내 가상 자료·자체 디자인 브리프를 전달합니다.',
      '외부 스킬 파일을 수업 ZIP에 복사하거나 다른 AI용 매뉴얼로 재가공하지 않습니다.',
      '현재 서비스 안에서 수행 가능한 범위와 생성 파일을 확인합니다. 수업의 강사 제작 PPT 양식은 별도의 자료입니다.',
    ],
    aiPrompt: `${commonFacts}\n현재 서비스에서 실제 사용할 수 있는 프레젠테이션 기능을 확인하고, 내가 제공한 강사 제작 양식과 자체 디자인 브리프로 5장 PPT 작업을 진행할 수 있는지 알려 줘. 외부 PPTX 스킬의 원문·스크립트·에셋을 복사하거나 재배포하지 마. 사용할 수 없는 기능과 수행하지 않은 실행은 구분해 줘.`,
    output: '서비스에서 허용·지원하는 경우의 프레젠테이션 작업. 이 카드 자체는 설치 자료가 아닙니다.',
    limit: '개별 PPTX 스킬은 Proprietary 조건입니다. 공식 링크 소개만 제공하며 스킬 원문 추출·외부 보관·복제·파생·배포를 위한 자료로 사용하지 않습니다.',
    license: { label: 'Proprietary · 개별 약관', url: 'https://github.com/anthropics/skills/blob/main/skills/pptx/LICENSE.txt', note: '서비스 계약과 추가 제한이 적용됩니다. 저장소의 다른 스킬에 적용되는 오픈소스 조건을 이 PPTX 스킬에 적용하지 않습니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'pptxgenjs', name: 'PptxGenJS', category: 'files', owner: 'Brent Ely · PptxGenJS contributors',
    url: 'https://github.com/gitbrent/PptxGenJS', docsUrl: 'https://gitbrent.github.io/PptxGenJS/docs/quick-start/',
    description: 'JavaScript로 텍스트·표·도형·차트를 넣어 PPTX를 만드는 라이브러리입니다. 검산한 집계에서 반복 보고 파일을 만드는 선택지입니다.',
    when: 'AI의 현재 실행 환경에서 지원되며 편집할 텍스트·표·차트가 있는 PPTX를 만들 때.',
    how: [
      '공식 Quick Start와 README에서 출력 형식·예제·의존성을 읽고 Releases에서 사용할 버전을 확인합니다.',
      'AI에게 검산한 엑셀, 5장 구성, 좌표·글꼴·색을 정한 브리프와 공식 문서 링크를 전달합니다. 강사 제작 PPT는 레이아웃 참고로 구분합니다.',
      '현재 환경에 실행 도구가 있다면 AI가 생성 코드를 구성하게 합니다. 학생의 직접 코딩이나 라이브러리 설치는 필수가 아닙니다.',
      'PPTX를 열어 제목·표를 수정하고 차트의 숫자·단위·잘림을 확인합니다. 이미지로 넣은 요소는 이미지라는 점도 표시합니다.',
    ],
    aiPrompt: `${commonFacts}\n공식 PptxGenJS 문서를 참고해 현재 환경에서 가능한 경우 5장 보고 PPTX를 만들어 줘. JavaScript 코드 작성은 네가 맡고, 필요한 입력·실행 가능 여부를 먼저 알려 줘. 제목·본문·표는 편집 가능한 요소로, 차트도 지원하는 경우 네이티브 요소로 만들어 줘. 그림으로 넣은 것은 밝혀 줘. 강사 제작 report-template.pptx는 레이아웃 참고로 사용하되, PptxGenJS가 기존 PPTX를 그대로 읽어 수정한다고 가정하지 마. 원본을 보존하고 참고한 배치를 새 파일 output/round-01-report-refined.pptx로 구성해 줘. 실제 생성·열기 확인 여부를 구분해 줘.`,
    output: 'PPTX. 생성한 텍스트·표·차트와 삽입 이미지는 편집 성격이 다릅니다.',
    limit: '문서 링크만으로 실행되지는 않습니다. 기존 PPTX를 그대로 가져와 편집하는 도구로 가정하지 않고 새 슬라이드 생성 범위를 확인합니다. 글꼴·줄바꿈·앱별 표시도 직접 검토합니다.',
    license: { label: 'MIT · 소프트웨어', url: 'https://github.com/gitbrent/PptxGenJS/blob/master/LICENSE', note: '소프트웨어 재사용 시 저작권·허가 고지를 유지합니다. 발표에 넣는 사진·아이콘·폰트의 권리는 별도로 확인합니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'python-pptx', name: 'python-pptx', category: 'files', owner: 'Steve Canny · python-pptx contributors',
    url: 'https://github.com/scanny/python-pptx', docsUrl: 'https://python-pptx.readthedocs.io/en/latest/',
    description: 'Python에서 PPTX를 읽고 생성·수정하는 라이브러리입니다. 파일 계산 도구로 만든 집계와 발표 생성을 연결할 때 참고합니다.',
    when: '현재 AI 환경에서 Python으로 엑셀을 처리했고 같은 환경에서 PPTX를 만들거나 수정할 때.',
    how: [
      '공식 문서의 지원 기능과 예제를 읽고 표·차트·텍스트 중 필요한 기능을 고릅니다.',
      '검산한 요약 수치와 강사 제작 양식을 전달하고 채울 슬라이드·자리표시자를 지정합니다.',
      '현재 실행 환경에서 가능하면 AI가 코드를 구성해 새 PPTX로 저장하게 합니다. 원본 양식을 덮어쓰지 않습니다.',
      '생성 파일에서 제목·숫자·차트·서식이 유지됐는지 확인하고 지원되지 않은 요소는 기록합니다.',
    ],
    aiPrompt: `${commonFacts}\n공식 python-pptx 문서와 지원 범위를 확인해 현재 Python 환경에서 가능한 부분만 수행해 줘. 검산한 round-01-summary.xlsx와 강사 제작 report-template.pptx로 5장 보고서를 만들고 원본은 보존해 줘. 표·제목·본문은 수정 가능한 요소로 넣고 지원하지 않는 서식이나 요소는 밝혀 줘. 코드는 네가 구성하며 학생이 작성할 필요 없이 결과 파일과 검토 위치를 제공해 줘. output/round-01-report-refined.pptx로 저장해 줘.`,
    output: 'PPTX 생성·읽기·수정. 지원되는 요소 범위에서 자동화합니다.',
    limit: 'PowerPoint의 모든 기능을 지원하는 것은 아닙니다. 복잡한 양식·효과·요소는 지원 범위와 실제 열기 결과를 확인합니다.',
    license: { label: 'MIT · 소프트웨어', url: 'https://github.com/scanny/python-pptx/blob/master/LICENSE', note: '코드 재사용 시 해당 고지를 유지합니다. 양식·시각 자료의 이용 조건은 별도입니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'marp', name: 'Marp · Markdown 발표', category: 'alternatives', owner: 'Marp team',
    url: 'https://github.com/marp-team/marp-cli', docsUrl: 'https://github.com/marp-team/marp-cli#convert-to-powerpoint-document---pptx-',
    description: 'Markdown 원고와 테마로 발표를 구성하는 도구입니다. 텍스트 수정과 버전 비교가 중요한 발표의 선택지입니다.',
    when: '원고를 텍스트로 관리하거나 HTML·PDF 발표를 만들고 싶을 때. PPT 요소 편집이 필수인 본 실습과 출력 차이를 먼저 확인합니다.',
    how: [
      '공식 README에서 Markdown 입력과 HTML·PDF·PPTX 출력의 차이를 읽습니다.',
      'AI에게 검산 수치와 5장 구조를 전달해 원고를 구성하고 원하는 최종 형식을 지정합니다.',
      '기본 PPTX는 렌더링 이미지 중심이라는 점을 확인합니다. 편집형 옵션은 실험 기능과 추가 환경이 필요하므로 수업의 필수 경로로 두지 않습니다.',
      '내보낸 결과를 열어 글자 잘림·단위·원고와의 숫자 일치를 확인합니다.',
    ],
    aiPrompt: `${commonFacts}\nMarp 공식 README를 참고해 같은 5장 내용을 Markdown 원고로 정리해 줘. 최종 형식은 우선 HTML 또는 PDF 비교용이며 본 실습의 편집 가능한 PPTX 완료와 구분해 줘. 기본 PPTX의 이미지 기반 특성과 편집형 실험 옵션의 환경·재현 한계를 먼저 설명해 줘. 지금은 설치나 변환 성공을 가정하지 말고 현재 도구에서 실제 수행한 결과만 알려 줘.`,
    output: 'Markdown·HTML·PDF, 기본 PPTX는 슬라이드 배경 이미지.',
    limit: '기본 PPTX를 텍스트·도형별 편집 가능 파일로 보장하지 않습니다. 실험 편집형은 브라우저·LibreOffice가 필요하고 재현성과 발표자 노트 제약이 있습니다.',
    license: { label: 'MIT · Marp CLI', url: 'https://github.com/marp-team/marp-cli/blob/main/LICENSE', note: 'CLI의 라이선스와 사용한 테마·이미지·글꼴의 이용 조건을 분리해 확인합니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'reveal', name: 'reveal.js · HTML 발표', category: 'alternatives', owner: 'Hakim El Hattab · reveal.js contributors',
    url: 'https://github.com/hakimel/reveal.js', docsUrl: 'https://revealjs.com/',
    description: '브라우저에서 보여 주는 HTML 발표 프레임워크입니다. 웹 발표와 PPTX 보고 파일의 차이를 비교할 때 참고합니다.',
    when: '웹에서 넘겨 보는 발표나 상호작용이 필요한 설명 자료를 만들 때.',
    how: [
      '공식 데모에서 발표 이동 방식과 웹 요소를 확인하고 README의 실행 조건을 읽습니다.',
      'AI에게 원고·근거·표·차트와 HTML 발표라는 출력 조건을 전달합니다.',
      '가능한 실행 환경에서만 생성하고 브라우저에서 키보드 이동·숫자·화면 크기를 확인합니다.',
      'PDF 내보내기를 선택해도 편집 가능한 PPTX와는 다른 결과임을 작업 기록에 적습니다.',
    ],
    aiPrompt: `${commonFacts}\nreveal.js 공식 문서를 참고해 동일한 5장 내용을 웹 발표 구조로 제안해 줘. 결과는 HTML 발표이며 편집 가능한 PPTX 파일과 구분해 줘. 원본 표와 근거를 유지하고 차트의 단위·대체 설명·키보드 이동을 확인할 항목으로 적어 줘. 실제 실행 환경이 없다면 구조 제안까지만 수행했다고 표시해 줘.`,
    output: 'HTML 발표. 지원 환경에서 PDF로 내보낼 수 있습니다.',
    limit: '웹 발표를 생성한 것을 본 실습의 PPTX 생성 완료로 표시하지 않습니다. 브라우저 표시와 파일 배포 방식도 확인해야 합니다.',
    license: { label: 'MIT · 소프트웨어', url: 'https://github.com/hakimel/reveal.js/blob/master/LICENSE', note: '프레임워크 고지와 별도로 외부 플러그인·이미지·글꼴의 조건을 확인합니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'ms-accessibility', name: 'Microsoft · 읽기 쉬운 PowerPoint', category: 'design', owner: 'Microsoft',
    url: 'https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities',
    docsUrl: 'https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities',
    description: '제목·읽기 순서·대체 텍스트·대비를 확인하는 공식 안내입니다. 본 실습 20분에서 선택할 참고 자료로 권합니다.',
    when: '설치 시간을 추가하지 않고 생성한 5장 PPT의 읽기 쉬움과 접근성을 개선할 때.',
    how: [
      '공식 안내에서 지금 고칠 항목 두 가지를 고릅니다. 예를 들어 고유한 제목과 차트 대체 설명을 선택합니다.',
      'AI에게 내 PPT와 선택한 기준을 전달하고 문제 위치·수정안을 먼저 받습니다.',
      'PPT에서 제목·본문을 읽고 검토→접근성 검사로 확인 가능한 항목을 살핍니다.',
      '검사 결과와 별개로 실제 슬라이드를 보며 숫자·잘림·대비와 읽기 흐름을 확인합니다.',
    ],
    aiPrompt: `${commonFacts}\nMicrosoft 공식 PowerPoint 접근성 안내를 참고해 내 PPT의 고유한 제목과 차트 대체 설명 두 항목을 검토해 줘. 문제 슬라이드/현재 상태/수정안/사람이 확인할 항목으로 적어 줘. 원본 숫자·단위·분모·출처를 유지하고 접근성 검사를 실제 실행했는지와 제안만 한 것을 구분해 줘.`,
    output: '기존 PPT의 디자인·접근성 수정안과 직접 확인할 목록.',
    limit: '공식 문서 자체가 PPT 생성 도구나 자유 배포 템플릿은 아닙니다. 자동 검사가 모든 시각·정보 오류를 대신하지 않습니다.',
    license: { label: '공식 안내 · 링크 참조', url: 'https://support.microsoft.com/en-us/accessibility/powerpoint/make-your-powerpoint-presentations-accessible-to-people-with-disabilities', note: '문서의 설명을 참고하고 자체 자료를 수정합니다. 문서·스크린샷 전체를 교재에 재배포하지 않습니다.' },
    verifiedOn: '2026-11-06', level: 'core',
  },
  {
    id: 'lucide', name: 'Lucide · 일관된 선형 아이콘', category: 'design', owner: 'Lucide Icons and Contributors',
    url: 'https://lucide.dev/icons/', docsUrl: 'https://lucide.dev/guide/static',
    description: '같은 계열의 아이콘으로 데이터·근거·검토 단계 등을 표시할 때 사용할 시각 재료입니다.',
    when: '핵심 문장이나 단계의 의미를 보조하는 작은 아이콘이 필요할 때.',
    how: [
      '공식 아이콘 목록에서 필요한 의미의 아이콘만 선택하고 이름과 출처를 기록합니다.',
      '라이선스와 해당 고지를 확인하고 사용할 색·크기·선 두께를 정합니다.',
      'AI에게 선택한 아이콘 또는 공식 출처와 배치 역할을 전달합니다. 아이콘만으로 중요한 뜻을 전달하지 않습니다.',
      'PPT에서 실제 표시·텍스트 레이블·대체 설명을 확인하고 불필요한 장식을 줄입니다.',
    ],
    aiPrompt: `${commonFacts}\nLucide 공식 자료에서 선택한 아이콘을 데이터/근거/검토의 보조 표시로만 사용해 줘. 아이콘 이름·출처·적용한 고지를 기록하고 색·크기·선 두께를 통일해 줘. 숫자와 문장은 그대로 두고 아이콘만 보고 의미를 추측해야 하는 구성을 피하도록 텍스트 레이블도 넣어 줘.`,
    output: '선택한 아이콘 파일과 이를 적용한 슬라이드.',
    limit: '아이콘은 PPT 양식이나 데이터 근거가 아닙니다. 삽입 형식과 편집기 지원에 따라 실제 표시를 확인합니다.',
    license: { label: 'ISC · 일부 Feather 유래 MIT', url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE', note: '재사용한 아이콘의 저작권·허가 고지를 유지합니다. ISC 본문과 Feather 유래 항목의 MIT 고지를 함께 확인합니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'google-fonts', name: 'Google Fonts · 글꼴 선택과 이용 조건', category: 'design', owner: 'Google Fonts · 각 글꼴 제작자',
    url: 'https://fonts.google.com/', docsUrl: 'https://github.com/google/fonts#license',
    description: '한글과 숫자를 미리 보고 사용할 글꼴을 고르는 공식 경로입니다. 글꼴마다 들어 있는 이용 조건을 확인합니다.',
    when: '제목·본문·숫자에 쓸 한글 글꼴과 다른 PC에서의 대체 글꼴을 정할 때.',
    how: [
      '미리보기 문장에 “참여율76.4% / 만족도3.81 / 유효 응답7,181명”을 넣어 한글·숫자를 함께 봅니다.',
      '선택한 글꼴 가족의 공식 파일과 라이선스를 확인하고 본문·제목의 굵기를 정합니다.',
      'AI에게 정확한 글꼴 이름과 대체 글꼴을 알려 줍니다. 생성 환경에 실제 설치돼 있는지는 별도로 확인합니다.',
      'PPT를 다른 PC나 편집기에서 열어 대체·줄바꿈·잘림을 확인합니다. 글꼴 설치·내장 여부를 추정하지 않습니다.',
    ],
    aiPrompt: `${commonFacts}\nGoogle Fonts에서 내가 선택한 한글 글꼴 이름과 굵기를 참고해 제목·본문·숫자의 서체 규칙을 제안해 줘. 글꼴별 라이선스를 확인하고 생성 환경의 설치 여부·대체 글꼴·다른 PC에서 확인할 항목을 적어 줘. 폰트 링크만 주었다고 PPT에 글꼴이 설치·내장됐다고 말하지 마.`,
    output: '글꼴 선택·굵기·대체 글꼴과 표시 검토 기준.',
    limit: 'Google Fonts 전체를 단일 라이선스로 묶지 않습니다. 폰트 파일 배포·수정 조건과 그 폰트로 만든 발표 결과물은 구분합니다.',
    license: { label: '글꼴 가족별 확인', url: 'https://github.com/google/fonts#license', note: '각 글꼴 폴더의 이용 조건을 읽습니다. 예를 들어 Noto Sans KR은 해당 OFL 원문을 확인하며, 다른 글꼴에도 같다고 가정하지 않습니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
  {
    id: 'fontsource-noto', name: 'Fontsource · Noto Sans KR', category: 'design', owner: 'Fontsource · 원 글꼴 권리자',
    url: 'https://fontsource.org/fonts/noto-sans-kr', docsUrl: 'https://fontsource.org/docs/getting-started/introduction',
    description: 'Noto Sans KR의 웹폰트 파일과 자체 호스팅 경로를 살펴보는 자료입니다. 웹 교재나 HTML 발표의 한글 재현을 검토할 때 참고합니다.',
    when: 'PPT와 함께 제공하는 웹 페이지·HTML 발표에서 한글 글꼴을 일관되게 쓰고 싶을 때.',
    how: [
      '글꼴 페이지에서 한글 미리보기·굵기·개별 OFL 표시를 확인합니다.',
      '웹 구현을 맡은 AI에게 필요한 굵기와 한글 범위, 이 공식 경로를 전달합니다.',
      '현재 웹 환경에서 가능한 적용 방식과 폰트 파일 고지를 확인합니다. 학생이 npm 설치를 수행할 필요는 없습니다.',
      '웹에서 글꼴을 불러온 결과와 PPT 프로그램의 설치·내장 상태는 각각 확인합니다.',
    ],
    aiPrompt: `${commonFacts}\nFontsource의 Noto Sans KR 공식 페이지와 개별 글꼴 LICENSE를 참고해 HTML 발표 또는 웹 교재의 한글 표시 방식을 제안해 줘. 필요한 굵기와 대체 글꼴, 파일 고지를 기록해 줘. 웹폰트 import가 PPT의 글꼴 설치·내장을 수행하는 것은 아니므로 두 환경을 구분해 줘. 지금은 패키지를 설치하지 말고 현재 환경에서 가능한 적용 계획을 설명해 줘.`,
    output: '웹·HTML 발표의 한글 글꼴 적용 계획. PPTX 글꼴 설치와는 별도입니다.',
    limit: 'Fontsource 도구의 라이선스와 Noto Sans KR 폰트 파일의 라이선스는 다릅니다. 웹폰트 적용만으로 PPT의 한글 재현을 보장하지 않습니다.',
    license: { label: 'Noto Sans KR · SIL OFL 1.1', url: 'https://github.com/fontsource/font-files/blob/main/fonts/google/noto-sans-kr/LICENSE', note: '개별 폰트 파일의 OFL과 저작권 고지를 확인합니다. Fontsource 도구의 MIT 조건을 폰트 자체의 조건으로 바꾸어 설명하지 않습니다.' },
    verifiedOn: '2026-11-06', level: 'optional',
  },
];

export const designPrinciples = [
  { id: 'message', title: '한 장에 전달할 질문 하나', why: '읽는 사람이 어느 숫자와 결론을 먼저 봐야 하는지 알게 합니다.', bad: '같은 장에 원본1만 행·모든 지표·원인 추정·다음 계획을 한꺼번에 배치', good: '3장은 “누가 얼마나 참여했나?”에 답하며 참여율과 프로그램별 참여인원만 배치', check: '슬라이드 제목만 읽어도 그 장의 질문과 핵심 내용이 드러나는가?' },
  { id: 'hierarchy', title: '제목·핵심 수치·근거의 순서', why: '숫자는 눈에 띄게, 의미와 한계는 놓치지 않게 읽힙니다.', bad: '76.4%만 크게 적고 누구의 비율인지와 분모를 생략', good: '참여율76.4% 아래에 참여7,509/유효신청9,824와 기준·출처를 표시', check: '가장 큰 숫자의 대상·분모·단위·회차를 바로 찾을 수 있는가?' },
  { id: 'grid', title: '한 슬라이드 안의 정보 시작선 맞추기', why: '같은 역할의 이름과 숫자를 같은 시작선에 맞추면 항목을 따라 읽고 비교하기 쉽습니다.', bad: '같은 세 항목의 이름과 숫자가 서로 다른 시작선에 놓임', good: '내용·색·크기는 유지하고 이름과 숫자의 시작선만 통일', check: '항목 이름 세 개와 숫자 세 개가 각각 같은 수직선에서 시작하는가?' },
  { id: 'typography', title: '같은 내용에서 본문 글자 크기 비교', why: '같은 서체·내용·색·굵기를 유지하고 본문 크기만 바꿔 실제 읽힘을 비교합니다.', bad: '본문 10px 모형: 내용은 같지만 작은 화면에서 읽기 어려움', good: '본문 16px 모형: 같은 내용을 더 큰 글자로 표시', check: '실제 발표 거리에서 분모까지 읽히는가? 이 웹 모형의 px는 PPT 권장 pt 크기가 아닙니다.' },
  { id: 'contrast', title: '색만으로 뜻을 전달하지 않기', why: '프로젝터·흑백 출력·색각 차이가 있어도 범주를 구분할 수 있습니다.', bad: '같은 세 프로그램 막대를 색으로만 구분해 이름과 각 인원을 알 수 없음', good: '막대 색·길이·축은 유지하고 프로그램 이름과 직접 인원 레이블을 추가', check: '색을 지워도 범주와 숫자를 읽을 수 있고 본문과 배경이 명확히 구분되는가?' },
  { id: 'evidence', title: '보기 좋은 문장도 근거 범위 안에서', why: '디자인 예시와 검산 데이터가 섞이는 것을 막고 지표의 의미를 지킵니다.', bad: '디자인 예제의 “매출200% 성장”을 내 자료에 넣거나 만족도만으로 성공 원인을 단정', good: '만족도3.81/5점·유효응답7,181과 가상자료·미응답 한계를 함께 표시', check: '새 수치·새 성과·원인 단정이 추가되지 않았고 모든 지표를 검산 엑셀로 되짚을 수 있는가?' },
  { id: 'editability', title: '이미지·편집 요소·읽기 순서 확인', why: '발표 뒤 숫자를 수정하고 다른 사람도 내용을 읽을 수 있어야 합니다.', bad: '파일 확장자가PPTX라는 이유로 전체 이미지 슬라이드를 편집 가능한 자료로 기록', good: '제목·본문·표를 직접 수정하고 차트가 이미지라면 원본 엑셀을 보존하며 읽기 순서·대체 설명도 확인', check: '제목 한 글자와 표 숫자를 고칠 수 있고 차트의 의미를 글로도 전달할 수 있는가?' },
];

export const resourceWorkflow = [
  { title: '1 · 원하는 결과와 현재 도구부터 확인', action: '본 실습은20분 안에 강사 제작 PPT 양식과 검산 엑셀로5장 PPTX를 개선합니다. 제목·본문·표 편집이 필요하다고 적고 현재 계정의 파일 생성·다운로드 가능 여부를 확인합니다. 추가 라이브러리 설치는 필수 과제가 아닙니다.', expect: '출력 형식과 편집 범위를 먼저 정하고 이미 가능한 도구에서 시작합니다.', fix: '파일 생성이 안 되면 제공 PPT 양식을 열어 같은 수치와 디자인 기준을 직접 적용합니다. 목차·HTML·PDF만 받은 것은 PPTX 완료로 적지 않습니다.' },
  { title: '2 · 참고 자료 하나와 원칙 두 개 선택', action: '처음에는 Microsoft 접근성 안내처럼 설치가 필요 없는 자료1개를 고릅니다. 위7원칙에서 고유 제목·근거 표시처럼 수정할2개를 정합니다. 나머지 카탈로그는 수업 뒤 자습용이며 전부 설치·강독하지 않습니다.', expect: '이번 수정의 범위가 작고 직접 확인할 기준이 분명합니다.', fix: '여러 저장소·폰트·도구를 동시에 바꾸려 한다면 당장 고칠 슬라이드의 문제1~2개로 줄입니다.' },
  { title: '3 · GitHub에서는 README·LICENSE·예제·변경 이력 확인', action: 'README에서 목적과 출력 형식, LICENSE에서 선택한 파일의 조건, examples·demos에서 실제 사용법, Releases·변경 이력에서 현재 환경과의 호환 정보를 봅니다. 별 수보다 내 과제·출력·의존성이 맞는지 판단합니다. 스킬·코드·에셋·템플릿을 구분합니다.', expect: '읽을 자료의 역할과 이용 조건, 아직 확인하지 못한 실행 조건을 압니다.', fix: '저장소 전체에 한 가지 라이선스를 적용하지 않습니다. Proprietary 자료는 공식 링크 안내에 머물고 원문을 교재나 다른 AI용 패키지로 복제하지 않습니다.' },
  { title: '4 · 데이터 근거와 디자인 참고를 나눠 전달', action: '데이터 근거로 운영 기준·검산 XLSX를, 디자인 참고로 선택한 공식 문서·아이콘·글꼴의 역할을 별도로 적습니다. 아래 브리프를 복사하고 실제 파일을 첨부합니다. 웹 AI는 링크만으로 로컬 파일을 읽지 못하므로 첨부 목록을 확인합니다.', expect: 'AI는 데이터에서 사실을 가져오고 디자인 자료에서는 배치·스타일·방법만 참고합니다.', fix: '디자인 예제의 숫자나 성과 문구가 들어오면 삭제하고 검산표의 수치로 복원합니다. 읽기·설치·실행 상태도 나눠 확인합니다.' },
  { title: '5 · 수정안 확인 후 실제 파일에 적용', action: 'AI에게 슬라이드/현재 문제/적용 원칙/수정안/유지할 근거를 먼저 받습니다. 두 원칙만 적용해 기존 결과를 보존하고 output/round-01-report-refined.pptx로 저장합니다. 아이콘·폰트·라이브러리를 사용했다면 출처와 해당 고지를 작업 기록에 남깁니다.', expect: '새 파일과 무엇을 바꿨는지 설명할 수 있는 수정 기록이 있습니다.', fix: '공식 README를 읽었거나 코드를 제시한 것만으로 실행 완료라 기록하지 않습니다. 실제 파일 생성이 실패하면 가능한 범위와 남은 작업을 표시합니다.' },
  { title: '6 · 숫자·편집·표시를 원본과 대조', action: 'PPT2장의10000=9824+119+57,3장의76.4%와프로그램3,815/2,438/1,256명,4장의3.81/5점·응답7,181을 엑셀과 대조합니다. 제목·표를 수정해 보고 잘림·폰트·대비·읽기 순서·대체 설명을 확인합니다. 선택한 두 원칙의 전후도 비교합니다.', expect: '숫자·출처를 보존하며 읽기 쉬움이 개선된 실제 결과를 확인합니다.', fix: '표시만 예쁘고 수치가 다르면 검산 엑셀로 되돌아갑니다. 한 장 전체가 이미지라면 편집 가능한 제목·본문·표로 고치거나 그 한계를 표시합니다.' },
];

export const referenceBrief = `[작업과 산출물]
강사 제작 가상 교육자료의 R01 결과 보고 PPT를 개선한다. 기존 round-01-summary.xlsx와 report-template.pptx를 실제로 읽고, 기존 결과를 보존해 output/round-01-report-refined.pptx로 저장한다. 본 실습은 참고 자료1개와 디자인 원칙2개만 적용한다. 추가 라이브러리·스킬 설치는 하지 않는다.

[데이터 근거: 사실·계산에 사용]
운영 기준 TXT의 조항, 사람이 확인한 RAG 근거표, 검산한 엑셀의 요약·정리·원본·근거 시트다.
원본10,000=채택9,824+제외119+보류57.
참여율7,509/9,824=76.4%.
만족도27,379/7,181=3.81/5점. 미응답173·불량155.
프로그램 참여자는 디지털기초3,815·생활문화2,438·진로탐색1,256명이다.
숫자·분모·단위·회차·출처·가상 교육자료 표시를 유지한다.

[디자인 참고: 방법·배치에만 사용]
내가 고른 공식 참고 자료의 URL과 이름을 여기에 적는다.
선택한 원칙2개와 고칠 슬라이드를 적는다.
디자인 예시의 숫자·문장·사업성과를 내 데이터의 사실로 가져오지 않는다. README는 방법 참고이며 실제 파일 생성·설치·실행 완료의 증거가 아니다.

[5장 구성]
1 보고 범위와 가상자료 / 2 정리 결과 / 3 참여율과 프로그램별 참여 차트 / 4 만족도와 분모 / 5 확인사항·한계·다음 작업.

[이번 실습의 시각 방향]
16:9, 흰 배경, 짙은 글자, 강조색1개, 제목·본문·근거의 위치를 통일한다. 한글이 읽히는 서체를 쓰고 실제 폰트 설치 여부와 대체 글꼴을 확인한다. 제목·본문·표는 편집 가능한 요소로 만들고 차트가 이미지라면 표시한다. 한 장에 핵심 질문 하나를 둔다.

[진행과 확인]
먼저 슬라이드/문제/수정 원칙/수정안/유지할 근거 표를 보여 준다. 확인한 범위에서 실제 파일을 만든 뒤 숫자를 엑셀과 대조한다. 제목·표 편집, 잘림, 대비, 읽기 순서·대체 설명을 사람이 확인한다. 수행하지 않은 설치·실행·화면 검증은 미수행으로 표시한다.`;
