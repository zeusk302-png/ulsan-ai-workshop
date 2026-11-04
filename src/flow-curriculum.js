export const flowStages = [
  { id:'purpose', number:'01', short:'목적·판단 기준', owner:'사람이 정의', title:'목적과 결과 기준 정의' },
  { id:'inputs', number:'02', short:'자료·컨텍스트', owner:'사람이 선택', title:'자료와 작업 맥락 준비' },
  { id:'structure', number:'03', short:'추출·구조화', owner:'AI가 처리', title:'정보 추출·분류·구조화' },
  { id:'evidence', number:'04', short:'근거 조회·RAG', owner:'AI 조회 + 사람 대조', title:'근거 연결·조건 비교' },
  { id:'draft', number:'05', short:'작성·수정', owner:'AI가 재구성', title:'문서 작성·수정' },
  { id:'review', number:'06', short:'평가·오류 진단', owner:'사람이 판단', title:'결과 평가·오류 진단' },
  { id:'reuse', number:'07', short:'저장·재사용', owner:'작업 체계로 보존', title:'저장·인수인계·재사용' }
];

function schedule(first, second, third, middleConcept, finalConcept) {
  return [
    {type:'concept',minutes:20,title:'AI 기본과 전체 작업 흐름',stage:'purpose'},
    {type:'practice',minutes:35,lesson:first,title:'목적·자료 설정과 추출·구조화'},
    {type:'break',minutes:10,title:'휴식'},
    {type:'concept',minutes:5,title:middleConcept,stage:'evidence'},
    {type:'practice',minutes:40,lesson:second,title:'근거 대조와 문서 작성'},
    {type:'break',minutes:10,title:'휴식'},
    {type:'concept',minutes:5,title:finalConcept,stage:'review'},
    {type:'practice',minutes:45,lesson:third,title:'오류 진단·작업 전환·저장'},
    {type:'review',minutes:10,title:'내 작업에 적용할 흐름 정리'}
  ];
}

export const webCurriculum = {
  title:'생성형 AI로 설계하는 자료·문서 작업',
  audience:'일반인·학생·구직자·직장인',
  days:[
    {id:'day1',slug:'beginner',label:'초급반',title:'한 자료에서 문서 완성까지',independent:true,
     prerequisite:'자료를 읽고 정리해 문서로 만드는 과정에서 AI를 활용하려는 분을 위한 과정입니다.',
     outcome:'작업을 단계로 나누고, 한 자료의 추출·작성·검토에 AI를 배치합니다.',
     question:'어떤 수고를 AI에 맡기고, 어디에서 직접 판단할 것인가?',
     focus:'17쪽 업무계획을 중심으로 정보 추출 → 구조화 → 문서 작성 → 오류 진단을 연결합니다.',
     lessonIds:['meeting','adapt','email'],
     schedule:schedule('meeting','adapt','email','출력 기준과 원문 사실의 구분','오류 유형과 수정할 단계')},
    {id:'day2',slug:'intermediate',label:'중급반',title:'RAG와 근거 기반 작업 설계',independent:true,
     prerequisite:'여러 자료의 근거를 연결하고, 작업 상태와 반복 절차를 관리하려는 분을 위한 과정입니다.',
     outcome:'자료 역할·소스 범위·인용 근거를 관리하고, 검토 가능한 작업 흐름을 재사용합니다.',
     question:'여러 자료에서 어떤 근거를 찾아, 어떤 상태로 다음 작업에 넘길 것인가?',
     focus:'편람·규정·공고의 역할을 나누고 RAG 조회, 인용 대조, 컨텍스트 전환을 설계합니다.',
     lessonIds:['document','sources','template'],
     schedule:schedule('document','sources','template','질문별 소스 선택과 인용의 범위','컨텍스트 인수인계와 하네스 구성')}
  ]
};

export const legacyTopicStages = {
  understand:'purpose','first-chat':'inputs',prompt:'purpose',revise:'draft',files:'inputs',search:'inputs',plans:'inputs',
  verify:'review',privacy:'inputs',context:'inputs',rag:'evidence',workflow:'purpose',handoff:'reuse',templates:'reuse',transfer:'reuse'
};

export function resolveFlowStage(hash) {
  const params = new URLSearchParams(hash.split('?')[1] || '');
  const requested = params.get('stage') || legacyTopicStages[params.get('topic')];
  return flowStages.some(s => s.id === requested) ? requested : 'purpose';
}

export function flowHref(slug, stage='purpose') {
  const course = slug === 'intermediate' ? slug : 'beginner';
  const valid = flowStages.some(s=>s.id===stage) ? stage : 'purpose';
  return `#concepts?course=${course}&stage=${valid}`;
}

export function compareEffort({manual, preparation, execution, review, repeats}) {
  const supplied = [manual,preparation,execution,review,repeats];
  if (supplied.some(v => v === '' || v === null || v === undefined)) return null;
  const values=supplied.map(Number);
  if(values.some(v=>!Number.isFinite(v)||v<0)||!Number.isInteger(values[4])||values[4]<1) return null;
  const [m,p,e,r,n]=values;
  const manualTotal=m*n, aiTotal=p+(e+r)*n;
  return {manualTotal,aiTotal,difference:manualTotal-aiTotal,perUse:aiTotal/n};
}
