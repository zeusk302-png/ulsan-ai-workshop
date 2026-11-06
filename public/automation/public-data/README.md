# 실제 울산 공공데이터로 엑셀·PPT 만들기

guide/start-here.html을 브라우저에서 열면 자료 준비부터 결과 파일 확인까지 따라갈 수 있다. 기본 실습에 API 키 발급·프로그래밍·셀 주소·수식 입력·자기판단 작성은 필요하지 않다.

1. references/all-references.txt를 자료 기반 AI의 새 노트북에 등록한다. 공식 가이드 원문·항목 설명·업종코드표와 강사 업무 안내가 한 파일에 있으므로 소스 1개로 표시된다.
2. prompts/01-rag.txt를 보내고 실제로 생성된 업무 기준과 실행 프롬프트 두 부분을 모두 복사한다.
3. 파일 작업 AI에 실제 답변 두 부분과 data/ulsan-two-quarters.zip, data/industry-codes-2023.csv, templates/ulsan-report-template.pptx를 함께 첨부한다. ZIP을 못 읽으면 압축을 풀고 원본 CSV 두 개를 각각 첨부한다. prompts/02-file-ai.txt는 실제 답변 앞에 붙이는 시작 문장이다.
4. 새 XLSX와 PPTX를 내려받아 열고 내용·시점·출처·차트·5장 구성과 제목·표의 편집을 확인한다. 같은 파일에서 다른 업종으로 다시 작업할 때 prompts/03-repeat.txt를 사용한다.

원본은 2026년6월54,737행·9월53,777행이며 각각39항목이다. 전체108,514행은 실제 공식 배포 원본이며, 행을 복제하거나 오류를 주입하지 않았다. 2023 업종코드표는247개 항목이다. 코드표와 원본의 이름 표기가 달라도 원본을 덮어쓰지 않는다.

examples의 파일은 강사가 전체 원본을 처리해 준비한 집계 예시다. 자신의 AI에서 생성한 파일과 구분한다. 원본은 별도 CSV로 제공하며 요약 XLSX에 모든 원본 셀이 들어 있다고 주장하지 않는다.

공식 데이터: https://www.data.go.kr/data/15083033/fileData.do
공식 업종코드: https://www.data.go.kr/data/15067631/fileData.do
공식 가이드: https://www.data.go.kr/data/15012005/openapi.do
출처·추출 방법·해시·기준일은 provenance.json 및 references/manifest.json에서 확인한다.

AGENTS.md·CLAUDE.md와 폴더 구조는 선택 참고다. 이전 가상 72문서·참가자 1만 행 과제는 별도 준비/원리 예제로 보존하며 이번 실제 상가업소 기준에 혼용하지 않는다.
