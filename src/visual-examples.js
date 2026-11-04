// Teaching reconstructions grounded in the preserved public documents, not new AI runs.
export const weeklyExamples = [
  {
    id:'education',label:'주민 교육',title:'주민참여예산학교 시민위원회 교육(2차)',
    quote:'□ 주민참여예산학교 시민위원회 교육(2차)\n○일시/장소: 2. 28.(토) 10:00 / 2층대회의실\n○참석대상: 주민참여예산시민위원회위원',
    type:'교육·행사',date:'2. 28. 10:00',place:'2층 대회의실',audience:'주민참여예산시민위원회 위원',
    reason:'교육 목적과 참석 대상이 원문에 명시되어 있습니다.',
    wrong:'누구나 신청할 수 있는 주민 교육입니다.',
    corrected:'주민참여예산시민위원회 위원을 대상으로 한 교육이 예정되어 있습니다.',
    verdict:'교육 일정은 확인할 수 있지만, 일반인 신청 가능 여부는 이 문장으로 입증되지 않습니다.'
  },
  {
    id:'committee',label:'행정 회의',title:'제2회 구정조정위원회(민간위탁 관리위원회) 개최',
    quote:'□ 제2회 구정조정위원회(민간위탁 관리위원회) 개최\n○일시/장소: 2. 20.(금) 10:00 / 부구청장실\n○참석대상: 위원(부구청장등7명), 해당안건부서장및팀장',
    type:'내부 행정',date:'2. 20. 10:00',place:'부구청장실',audience:'위원, 해당 안건 부서장·팀장',
    reason:'회의 대상과 심의 목적을 기준으로 내부 행정으로 분류한 예입니다.',
    wrong:'주민이 참여할 수 있는 민간위탁 프로그램입니다.',
    corrected:'위원과 해당 안건 담당 부서가 참석하는 위원회 개최 계획입니다.',
    verdict:'민간위탁이라는 주제와 주민 참여 프로그램이라는 해석은 구분해야 합니다.'
  }
];

export const ragExamples = {
  format:{label:'문서 형식 조회',question:'공문 본문에는 어떤 항목이 필요한가?',active:['manual','regulation','rules'],
    evidence:[{id:'form',label:'시행규칙 제4조제3항',file:'rules',quote:'③ 제1항에 따른 본문(이하 “본문”이라 한다)은 제목, 내용 및 붙임(문서에 다른 서식 등이 첨부되는 경우에만 해당한다)으로 구성한다.'}],
    claim:'본문은 제목·내용·붙임으로 구성하며, 붙임은 첨부물이 있을 때 포함합니다.',
    state:'근거 범위 확인',note:'작성 형식의 근거입니다. 사업의 지원 금액을 증명하는 근거로 쓸 수 없습니다.'},
  amount:{label:'사업 금액 조회',question:'이 공고의 재료비 한도는 얼마인가?',active:['notice'],
    evidence:[{id:'body',label:'공고 본문 · 지원내용',file:'notice',quote:'- 재료비 지원: 강좌당 최대 130,000원 이내'},{id:'attachment',label:'붙임 2 · 강의운영 계획서',file:'notice',quote:'※최대 150,000원 지원가능'}],
    claim:'본문은 130,000원, 붙임은 150,000원으로 다릅니다. 적용 한도는 담당기관 확인이 필요합니다.',
    state:'원문 상충 · 미결',note:'서로 다른 두 값을 모두 보존합니다. 편람이나 다른 업무계획으로 어느 금액이 맞는지 확정하지 않습니다.'}
};

export const responsibilityColumns = ['목적·자료','추출·분류','작성·수정','검토·채택'];
export const responsibilityRows = [
  {id:'human',label:'사람의 판단',cells:['목적·범위·기준 정의','분류·누락 확인','독자·고정 사실 결정','원문 대조·채택']},
  {id:'ai',label:'AI의 처리',cells:['구성안·질문 제안','후보 추출·표준화','초안·형식 변환','대조표·누락 후보']},
  {id:'record',label:'남길 작업물',cells:['작업 명세','근거가 있는 항목표','문서 초안·변경점','검토본·미결 기록']}
];
