import course from '../content/public-data-course.json';
export const publicSnapshots=Object.entries(course.snapshots).sort(([a],[b])=>a.localeCompare(b));
export const publicTotalRows=publicSnapshots.reduce((sum,[,item])=>sum+item.rows,0);
export const guidedFiles={text:'automation/public-data/references/all-references.txt',originalGuide:'automation/public-data/references/sbiz-openapi-guide-260805-original.zip',dataZip:'automation/public-data/data/ulsan-two-quarters.zip',codebook:'automation/public-data/data/industry-codes-2023.csv',template:'automation/public-data/templates/ulsan-report-template.pptx',exampleExcel:'automation/public-data/examples/ulsan-summary.xlsx',examplePpt:'automation/public-data/examples/ulsan-report.pptx'};
export const ragHandoffRequest=`등록한 실제 공식 자료 전체와 강사의 업무 안내를 읽고 울산 상가업소 분포·두 시점 비교 보고를 준비해 줘.
먼저 [1. 적용할 기준과 주의사항]을 작성해 줘. 공식 활용가이드, 항목 설명, 2023 업종코드표에서 확인한 기준과 원문 위치를 적고 강사가 정한 보고 요구와 구분해 줘. 업종코드와 이름, 행정동과 법정동, 두 시점 자료의 의미, 좌표의 뜻과 자료의 한계를 확인해 줘. 확인되지 않은 조건은 임의 결정하지 마.
다음 [2. 파일 작업 AI에게 그대로 줄 실행 프롬프트]를 작성해 줘. 첫 부분의 기준을 빠뜨리지 말고 아래 작업을 실제 파일에서 수행하도록 요청해 줘.
입력은 ulsan-two-quarters.zip(2026년6월·9월 울산 원본 CSV 두 개), industry-codes-2023.csv(공식 업종코드표), ulsan-report-template.pptx(발표 양식)다. 원본 전체를 읽고 두 시점의 구·군별 업종 분포, 코드표에서 확인한 카페 업종의 행정동별 분포, 상가업소번호로 연결한 계속 관측·새로 관측·미관측, 좌표의 누락·범위·변경 상태를 정리해 줘. 자료 날짜와 실제 처리 범위를 확인해 줘.
원본의 업종 이름과 코드표의 이름이 다르면 원본을 덮어쓰지 말고 각각 별도 열로 보존해 줘. 매출이나 실제 개업·폐업·이전을 이 자료에서 확인한 것처럼 주장하지 마. 행정동과 법정동을 혼용하지 마.
명칭 차이를 보고할 때 대분류·중분류·소분류를 각각 구분해 세고 어느 수준의 차이인지 표시하게 해 줘. 소분류명 차이를 전체 업종명 차이라고 적지 않게 해 줘.
원본과 자료 출처를 보존하고 새 XLSX와 수정 가능한5장 PPTX를 다운로드로 제공하도록 요청해 줘. 보고 구성은 자료·범위/구군별 업종/카페 행정동 분포/두 시점 관측과 좌표 상태/한계와 후속 확인이다. 실제 파일 열기와 제목·표 수정, 엑셀과 발표 내용 일치를 완료 조건에 넣어 줘. 아직 점포 원본 파일은 받지 않았으므로 수치 계산이나 파일 생성이 끝났다고 말하지 마.
원본 CSV 두 개는 별도 원본으로 보존하고, 결과 XLSX에는 전체 행에서 계산한 집계·비교·차트·품질·출처를 담아 줘. 원본 수백만 셀을 결과 XLSX에 다시 복제할 필요는 없어. 사용자에게 셀 주소·수식·코드를 직접 입력시키지 말고 파일 작업 AI가 처리하도록 지시해 줘. 원본을 아직 받지 않았다는 현재 상태 설명은 첫 부분에만 두고, 두 번째 실행 프롬프트는 실제 원본이 첨부된 다음 단계에서 바로 수행할 명령으로 써 줘. 최종 답변은 위 두 부분을 모두 다른 AI에 복사할 수 있게 작성해 줘.`;
export const fileExecutionLead=`아래에 자료 기반 AI가 실제로 작성한 [업무 기준과 주의사항]과 [실행 프롬프트]를 함께 붙였습니다. 첨부한 실제 울산 두 시점 자료 ZIP, 공식 업종코드표 CSV, 발표 양식 PPTX를 읽고 작업해 주세요.
이 대화에는 실제 원본이 첨부되어 있습니다. 자료 기반 AI가 원본을 아직 받지 않았다고 설명한 부분은 앞선 기준 추출 단계의 상태입니다. 지금은 첨부 원본으로 실제 실행하는 단계입니다. ZIP 안의 CSV 두 개를 모두 풀어 전체 행을 처리해 주세요. 원본 CSV는 별도 원본으로 보존하고 결과 XLSX에는 전체 행에서 계산한 집계·비교·차트·품질·출처를 담아 주세요. 원본 수백만 셀을 결과 XLSX에 다시 복제할 필요는 없습니다. 업종코드표는 CP949 인코딩입니다. 명칭 차이는 대분류·중분류·소분류별로 구분하고 해당 분류 수준을 보고서에 표시해 주세요. 원본의 값과 이름을 바꾸거나 예시로 대체하지 말고 새 XLSX와 수정 가능한5장 PPTX를 다운로드로 주세요. 읽을 수 없거나 지원하지 못하는 작업은 먼저 알려 주세요.
[이 아래에 자료 기반 AI의 실제 답변 두 부분을 모두 붙여넣습니다]`;
export const repeatRequest=`같은 실제 울산 두 시점 자료와 같은 보고 기준을 유지하고, 이번에는 카페 대신 공식 코드표에서 확인한 다른 업종 하나의 행정동 분포를 분석해 주세요. 선택한 업종과 적용한 코드표 항목을 먼저 알려 주세요. 앞서 만든 파일은 보존하고 새 이름의 XLSX와5장 PPTX로 저장해 주세요. 제목·차트·내용·출처를 새 분석 대상에 맞춰 갱신해 주세요. 매출·실제 개업·폐업·이전의 근거로 확대하지 마세요.`;
export const guidedSteps=[{number:1,title:'공식 설명 자료 등록',short:'통합 참고자료 → 자료 기반 AI'},{number:2,title:'기준과 실행 요청 받기',short:'원문을 읽은 AI → 두 부분의 답변'},{number:3,title:'실제 데이터와 함께 실행',short:'실제 답변 + 자료3개 → 파일 작업 AI'},{number:4,title:'파일 확인·다른 업종 반복',short:'XLSX·PPTX 열기 → 같은 자료로 응용'}];
