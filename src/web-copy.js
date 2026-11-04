// Web presentation copy is separate from the published workbook's teaching data.
// Prompts, examples, checklists, source files, and exercise IDs remain unchanged.
const lessonCopy = {
  email: {
    title: '공고 조건 정리와 확인 메일 작성', short: '공고 분석·확인 메일',
    description: '공고와 붙임 서식에서 접수 조건을 정리하고, 확인이 필요한 내용을 메일로 작성합니다.',
    source: '중구 주민강사 공고 HWP와 전문 TXT를 준비하세요. TXT에는 공고 본문과 신청서·운영계획서가 포함되어 있습니다. HWP를 읽지 못하는 AI 도구에는 TXT 전체를 첨부하고, 표와 서식은 원본에서 확인하세요. 접수가 종료된 2026년 9월 공고를 실습 자료로 사용합니다.'
  },
  document: {
    title: '편람을 활용한 공문 초안 작성', short: '편람 활용·공문 작성',
    description: '편람과 법령에서 작성 기준을 찾고, 근거를 표시한 공문 초안과 검토표를 만듭니다.',
    source: '행정안전부 편람 PDF 383쪽 전체와 규정·시행규칙 TXT를 준비하세요. 공문에 사용할 사실 자료로 중구 공고 TXT를 함께 등록합니다. 편람은 2025년판, 규정은 2026년 10월 2일 시행본입니다.'
  },
  adapt: {
    title: '보고서와 주민 안내문 작성', short: '보고서·주민 안내',
    description: '같은 공고를 내부 검토 보고서와 주민용 FAQ로 바꾸고, 조건의 누락과 과장된 표현을 확인합니다.',
    source: '중구 공고의 HWP 원본 또는 전문 TXT를 사용하세요. 공고 본문과 붙임 신청서·운영계획서를 함께 확인합니다. 종료된 공고임을 표시하고, 빈 서식에는 실제 개인정보를 입력하지 마세요.'
  },
  meeting: {
    title: '업무계획을 실행 목록으로 정리', short: '업무계획·실행 목록',
    description: '부서별 업무계획에서 일정·예산·담당부서를 추출하고, 할 일과 추가 확인 사항을 정리합니다.',
    source: '북구 「2026년 2월 3~4주 주간업무계획」 PDF 17쪽 전체를 첨부하세요. 2026년 2월 15~28일의 계획 자료입니다. 예정된 일정을 실제 완료 사실로 바꾸지 않도록 확인하세요.'
  },
  sources: {
    title: '여러 문서의 근거 비교와 검증', short: '다중 문서·근거 검증',
    description: '자료 5개를 등록하고 질문별로 소스를 선택해, 답변의 인용과 적용 범위를 확인합니다.',
    source: '편람 PDF 383쪽, 북구 업무계획 PDF 17쪽, 중구 공고 TXT, 규정 TXT, 시행규칙 TXT를 준비하세요. 민원법 2026년 12월 3일 시행예정본은 별도 비교 자료이며, 기본 소스 5개에는 포함하지 않습니다.'
  },
  template: {
    title: '재사용 프롬프트 작성과 검증', short: '재사용 프롬프트 작성',
    description: '문서가 바뀌어도 사용할 수 있는 요청 양식을 만들고, 두 자료에 적용해 결과를 비교합니다.',
    source: '첫 시험에는 중구 공고 전문을, 두 번째 시험에는 북구 업무계획 PDF 17쪽 전체를 사용하세요. 두 번째 시험은 새 대화에서 진행하거나 소스를 북구 업무계획 하나로 제한합니다.'
  }
};

export function presentLesson(lesson) {
  return { ...lesson, ...lessonCopy[lesson.id] };
}

export function presentCourse(course, index) {
  return {
    ...course,
    title: index === 0 ? 'AI 기본 사용과 문서 작성' : '자료 기반 AI와 작업 흐름 관리'
  };
}

export function presentBasic(basic, index) {
  const titles = ['초안 작성과 형식 변환', '요청에 포함할 정보', '후속 요청으로 수정', '원문 대조와 결과 저장'];
  return { ...basic, title: titles[index] };
}

export function presentGuide(lesson, guide) {
  const next = { ...guide, preparation: lesson.source };
  if (lesson.id === 'email') {
    next.detailedSteps = guide.detailedSteps.map((step, i) => i === 0
      ? [step[0], step[1], '공고 본문과 붙임 신청서·운영계획서가 모두 포함되어 있는지 확인합니다.'] : step);
  }
  return next;
}

const conceptTitles = {
  ai: '생성형 AI의 특징과 활용 범위',
  prompt: '목적과 조건을 담은 요청 작성',
  verify: 'AI 답변과 원문 대조',
  context: '컨텍스트와 대화 관리',
  long: '장문 자료와 소스 관리',
  handoff: '하네스와 작업 흐름 관리'
};

export function presentConcept(unit) {
  return {
    ...unit,
    title: conceptTitles[unit.id],
    paragraphs: unit.paragraphs.map(p => p
      .replace('이것은 입문용 설명입니다. ', '')
      .replace('이 수업에서 고정 토큰 수나 “몇 쪽까지 완벽히 기억”을 약속하지 않습니다.', '쪽수만으로 입력 가능한 분량이나 답변의 정확도를 판단하지 마세요.')
      .replace('하네스는 모델 주변에 지시·자료·도구·작업 상태·검토 절차를 구성하는 관점으로 소개합니다. 이 요소를 어떤 순서와 조건으로 연결할지 생각해봅니다. 프로그램으로 구현하는 하네스와 이번에 사람이 운영하는 작업 흐름은 구분합니다. 이 수업은 코딩 없이 자료 등록 → 추출 → 작성 → 근거 대조 → 수정 → 저장의 순서를 설계합니다.', '하네스는 AI가 작업을 수행하도록 지시·자료·도구·작업 상태·검토 절차를 연결한 실행 환경입니다. 실습에서는 자료 등록 → 추출 → 작성 → 근거 대조 → 수정 → 저장의 흐름을 직접 구성합니다. 각 단계에서 사람이 확인할 항목도 정하세요.'))
  };
}
