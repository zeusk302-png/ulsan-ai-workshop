// Web presentation copy is separate from the published workbook's teaching data.
// Web flow lessons keep existing IDs and originals while revising presentation and requests.
import { flowLessonCopy, flowGuides } from './flow-lessons.js';
import { webCurriculum } from './flow-curriculum.js';

export function presentLesson(lesson) {
  return { ...lesson, ...flowLessonCopy[lesson.id] };
}

export function presentCourse(course, index) {
  return { ...course, ...webCurriculum.days[index] };
}

export function presentBasic(basic, index) {
  const titles = ['초안 작성과 형식 변환', '요청에 포함할 정보', '후속 요청으로 수정', '원문 대조와 결과 저장'];
  return { ...basic, title: titles[index] };
}

export function presentGuide(lesson, guide) {
  return flowGuides[lesson.id] || { ...guide, preparation:lesson.source };
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
