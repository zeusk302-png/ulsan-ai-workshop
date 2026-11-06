export const guidedFiles={
 text:'automation/reference-corpus/all-documents.txt',
 pdf:'automation/reference-corpus/reference-corpus.pdf',
 first:'automation/data/round-01.xlsx',
 second:'automation/data/round-02.xlsx',
 template:'automation/templates/report-template.pptx',
 exampleExcel:'automation/examples/round-01-summary.xlsx',
 examplePpt:'automation/examples/round-01-report.pptx',
};
export const ragHandoffRequest=`첨부한 자료 전체를 참고해 교육용 프로그램의 1회차 성과보고를 준비해 줘.
이 자료는 강사가 만든 가상 교육자료다. 실제 기관의 정책이나 성과로 표현하지 마.

먼저 자료 전체에서 지금 적용되는 운영·보고 기준과 주의사항을 확인해 줘. 이전 자료, 시행 예정 자료, 채택되지 않은 제안이 현재 기준과 섞이지 않게 구분해 줘. 확인한 내용에는 문서 이름과 관련 원문 위치를 붙여 줘. 서로 충돌하거나 확인할 수 없는 사항은 임의로 정하지 말고 표시해 줘.

그다음 파일을 만들 수 있는 다른 AI에 그대로 전달할 내용을 아래 두 부분으로 작성해 줘.

[1. 이번 업무에 적용할 기준과 주의사항]
현재 적용할 기준, 주의할 자료, 원문 근거, 아직 확인하지 못한 사항을 업무 담당자가 이해할 수 있는 말로 정리해 줘.

[2. 다른 AI에게 그대로 줄 실행 프롬프트]
입력 파일은 round-01.xlsx(1회차 원본 10,000행)와 report-template.pptx(발표 양식)다. 위에서 확인한 업무 기준을 프롬프트 안에도 포함해 줘.
실제 원본 파일 전체를 읽어 정리하고, 참여와 만족도 결과 및 프로그램별 참여 차트를 담은 XLSX와 양식에 맞춘 5장 PPTX를 만들도록 요청해 줘. 원본은 보존하고 새로운 결과 파일로 저장하게 해 줘.
보고 대상, 사용할 자료와 첨부할 파일, 해야 할 작업, 발표 양식 사용 방법, 유지할 원문 근거, 실제 파일을 열어 확인할 완료 조건을 포함해 줘. 제목·본문·표를 수정할 수 있는 발표 자료를 요청하고, 지원하지 못한 기능이나 실행하지 못한 작업은 구분하게 해 줘.
아직 원본 참가자 파일을 받지 않았으므로 이 단계에서는 결과 숫자나 완성 파일을 만들어 냈다고 말하지 마.

최종 답변은 위 두 부분을 모두 복사해 다른 AI에 붙여넣을 수 있도록 작성해 줘. 진행 설명은 초보자가 따라갈 수 있는 말로 쓰고, 사람이 셀 주소·수식·코드를 입력하는 절차 대신 파일 작업 AI가 수행할 지시로 작성해 줘.`;
export const fileExecutionLead=`아래에 자료 기반 AI가 실제로 작성한 업무 기준과 실행 프롬프트를 함께 붙였습니다. 첨부한 round-01.xlsx와 report-template.pptx를 실제로 읽고 그 내용에 따라 작업해 주세요.
원본 파일은 보존하고 새로운 XLSX와 5장 PPTX를 만들어 다운로드할 수 있게 주세요. 읽을 수 없는 파일이나 지원하지 못하는 작업은 먼저 알려 주세요. 대화창의 설명이나 목차만으로 파일 작업을 완료했다고 말하지 마세요.

[이 아래에 자료 기반 AI의 실제 답변 두 부분을 모두 붙여넣습니다]`;
export const repeatRequest=`이번에는 첨부한 round-02.xlsx로 2회차 보고를 만들어 주세요. 앞서 확인한 운영·보고 기준과 5장 발표 양식을 유지하고, 새 원본 전체에서 작업해 주세요. 1회차 원본과 결과는 보존하고 2회차 XLSX와 PPTX를 새 파일로 주세요. 이전 숫자를 복사하지 말고 제목·내용·차트·출처의 회차까지 함께 바꿔 주세요. 실행하지 못한 작업은 알려 주세요.`;
export const guidedSteps=[
 {number:1,title:'자료 전체를 한 번에 등록',short:'통합 자료 → 자료 기반 AI',result:'등록한 통합 자료가 소스 목록에 보입니다.'},
 {number:2,title:'업무 기준과 실행 요청 받기',short:'자료를 읽은 AI → 두 부분의 답변',result:'업무 기준과 다른 AI에 줄 실행 프롬프트가 함께 나옵니다.'},
 {number:3,title:'원본·양식과 함께 실행',short:'두 부분의 답변 + 원본·양식 → 파일 작업 AI',result:'새 XLSX와 5장 PPTX의 다운로드가 제공됩니다.'},
 {number:4,title:'파일을 열고 다음 회차에 반복',short:'실제 결과 확인 → 새 회차',result:'파일 내용을 수정할 수 있고 새 회차 결과도 별도로 남습니다.'},
];
