export function composeLessonPrompt(lesson) {
  const placeholder = /\[(?:아래에 샘플 메모|샘플 자료|선택한 가상 상황|회의 메모) 붙여넣기\]/g;
  if (placeholder.test(lesson.prompt)) {
    placeholder.lastIndex = 0;
    return lesson.prompt.replace(placeholder, lesson.source);
  }
  return `${lesson.prompt}\n\n${lesson.source}`;
}
