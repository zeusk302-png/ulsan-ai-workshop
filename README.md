# 울산대학교 직장인 AI 실습실

비전공 직장인을 위한 2일 · 총 6시간 AI 업무 활용 강의 플랫폼입니다.

## 교육 방향

- 하루 180분: 개념·시연 30분, 직접 실습 120분, 휴식 20분, 정리 10분.
- 실습 흐름: 강사 시연 → 따라 하기 → 조건 바꾸기 → 결과 확인 → 저장.
- 샘플 자료는 가상의 업무 사례로 제공하며 실제 개인정보와 기밀자료를 요구하지 않습니다.

## 구현 범위

GitHub Pages에서 동작하는 정적 웹 플랫폼으로 구성합니다. 실습별 안내, 샘플 자료, 프롬프트 복사, 결과물 작성, 완료 표시, 브라우저 저장, 파일 내보내기를 제공합니다. 서버 기반 회원가입이나 과제 제출 기능은 범위에 포함하지 않습니다.

## 사이트

배포 주소: https://zeusk302-png.github.io/ulsan-ai-workshop/

`main`에 push하면 GitHub Actions가 테스트·빌드 후 GitHub Pages에 배포합니다. 실제 최신 배포 상태는 저장소의 Actions 및 Environments에서 확인합니다.

## 사용 방법

1. 일차와 실습을 선택하고 `실습 안내`를 읽습니다.
2. `자료·프롬프트`를 복사해 외부 AI 도구에서 실행합니다. 이 플랫폼 자체는 AI를 호출하지 않습니다.
3. `내 작업`에 결과와 프롬프트를 기록합니다. 검토 항목 세 개를 체크하고 완료 표시합니다.
4. `내 작업함`에서 전체 텍스트 또는 JSON 백업을 내려받습니다. 다른 기기에서는 JSON 백업을 가져옵니다.

결과물과 진행률은 현재 브라우저의 localStorage에 저장되며 서버에 제출되지 않습니다. 공용 PC에서는 백업 후 기록을 초기화하세요. 무료 AI 도구는 가입·로그인 및 사용 한도 제한이 있을 수 있습니다.

## 자세한 안내와 실제 화면

각 실습에 시간별 5단계 안내, 확인할 결과, 후속 요청 3개, 문제 해결 3개, 선택 과제를 추가했습니다. `실제 화면` 탭에서 ChatGPT·Gemini·NotebookLM에 가상 자료를 직접 입력한 실제 캡처 13개를 볼 수 있습니다. 화면은 확대·전체 맞춤과 원본 새 탭 열기를 지원합니다.

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

- `content/curriculum.json`: 2일 과정 시간표와 실습 목표
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

실습 내용은 `src/content.js`, 일차별 시간표는 `content/curriculum.json`에서 수정합니다. 시간이나 실습 식별자를 바꿀 때는 두 파일을 일치시키고 `npm test`를 실행하세요. 강의 날짜는 확정되지 않아 플랫폼에 실제 행사 일정을 표시하지 않습니다. 샘플의 날짜와 사람 이름은 실제 강의나 조직 정보를 뜻하지 않습니다.

