"""Rebuild the classroom-only report automation pack (all data is synthetic)."""
from pathlib import Path
import json, html, subprocess, zipfile, shutil, sys, os, csv, random, time

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/automation'
BUILD = ROOT / 'scripts/.automation-build'
RUNTIME = Path(r'C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1104-1290-0_26.1104.1290.0_x64__3k8sg7r9htsxt\dependencies')
NODE = RUNTIME / 'node/bin/node.exe'
PYTHON = RUNTIME / 'python/python.exe'
SKILLS = Path.home()/'.codex/plugins/cache/openai-primary-runtime'

def put(name, content):
    p = OUT/name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8', newline='\n')

def warmup_rows(round_no=1):
    rows=[]
    for i in range(1,49):
        active = i % (5 if round_no == 1 else 4) != 0
        score = (3 + i % 3) if round_no == 1 else (2 + i % 4)
        rows.append([i, f'R0{round_no}', f'P{i:03}', ['디지털기초','생활문화','진로탐색'][(i-1)%3], 'Y' if active else 'N', score if active and i%11 else None])
    rows[2][4]=' y '
    rows[44][2]='P010' if round_no==1 else 'P008'
    rows[45][2]=''
    rows[46][4]='?'
    rows[47][4]='Y'
    rows[47][5]=6 if round_no==1 else 0
    return rows

def rows_for(round_no, count=10000, global_offset=0):
    """Independent seeded records, not repetitions of the 48-row warmup."""
    rng=random.Random(2026110600+round_no)
    rows=[]
    programs=['디지털기초','생활문화','진로탐색']
    for i in range(1,count+1):
        group=rng.choices(range(3),weights=[45,35,20],k=1)[0]
        active=rng.random() < min(.97,[.86,.73,.64][group]+(round_no-1)*.012)
        score=rng.choices([1,2,3,4,5],weights=[[2,5,18,40,35],[4,9,27,38,22],[5,12,28,35,20]][group],k=1)[0] if active else None
        identifier=f'P{i:06}'
        if i%137==0: identifier=rows[-1][2].strip().upper() or 'P000001'
        if i%211==0: identifier=''
        elif i%41==0: identifier=' '+identifier.lower()+' '
        attendance='Y' if active else 'N'
        if i%37==0: attendance=' '+attendance.lower()+' '
        if i%173==0: attendance='?'
        if active:
            if i%43==0: score=None
            elif i%181==0: score=6
            elif i%193==0: score=0
            elif i%197==0: score='좋음'
            elif i%199==0: score=3.5
        rows.append([global_offset+i,f'R{round_no:02}',identifier,programs[group],attendance,score])
    return rows

def evaluate(rows):
    seen=set(); clean=[]
    for r in rows:
        seq, rnd, identifier, program, attendance, score=r
        identifier=identifier.strip().upper(); attendance=attendance.strip().upper()
        if not identifier: status, reason='제외','참가자ID 누락'
        elif (rnd,identifier) in seen: status, reason='제외','동일ID 후속 중복행'
        elif attendance not in ('Y','N'): status, reason='보류','참여여부 확인 필요'
        else: status,reason='채택','기준 충족'
        if identifier: seen.add((rnd,identifier))
        valid=int(status=='채택'); participated=int(valid and attendance=='Y')
        response=int(participated and isinstance(score,(int,float)) and 1<=score<=5 and score==int(score))
        sat_status='대상아님' if not participated else '미응답' if score is None or score=='' else '유효' if response else '범위/형식오류'
        clean.append([seq,rnd,identifier,program,attendance,score,status,reason,valid,participated,response,score if response else 0,sat_status])
    valid=sum(r[8] for r in clean); participated=sum(r[9] for r in clean); response=sum(r[10] for r in clean); score_sum=sum(r[11] for r in clean)
    return {'rawRows':len(rows),'validApplicants':valid,'participants':participated,'participationRate':participated/valid if valid else None,'validResponses':response,'scoreSum':score_sum,'satisfactionMean':score_sum/response if response else None,'excludedRows':sum(r[6]=='제외' for r in clean),'heldRows':sum(r[6]=='보류' for r in clean),'missingSatisfaction':sum(r[12]=='미응답' for r in clean),'invalidSatisfaction':sum(r[12]=='범위/형식오류' for r in clean),'excludedMissingId':sum(r[7]=='참가자ID 누락' for r in clean),'excludedDuplicate':sum(r[7]=='동일ID 후속 중복행' for r in clean),'programParticipants':{p:sum(r[9] for r in clean if r[3]==p) for p in ['디지털기초','생활문화','진로탐색']},'programApplicants':{p:sum(r[8] for r in clean if r[3]==p) for p in ['디지털기초','생활문화','진로탐색']},'cleanRows':clean}

RULES='''교육용 프로그램 운영·보고 기준 v2.0
작성: 울산대학교 AI 실습용 강사 제작 자료 / 기준일: 2026-11-06
이 기준과 참가자 데이터는 모두 가상 교육자료다. 실제 기관의 운영 기준이나 실제 사업 실적을 나타내지 않는다.

1. 자료와 원본 보존
1.1 한 행은 한 회차의 신청 기록 1건이다. 준비 연습은 48행, 본 실습은 회차별 10,000행, 확장 CSV는 R01~R10 총 100,000행이다. 원본행 번호와 순서를 유지한다.
1.2 본 실습 회차는 R01 또는 R02다. 확장 CSV는 회차별로 따로 집계한다. 원본 파일을 덮어쓰지 않는다.
1.3 참가자ID와 참여여부는 앞뒤 공백을 제거하고 영문을 대문자로 통일한다. 참가자ID는 식별용 가상 값이다.
1.4 확장 CSV는 UTF-8 BOM·쉼표 구분이다. 원문을 보존하고 회차·ID는 텍스트로 읽는다. 만족도 '3'처럼 숫자로 해석 가능한 문자열은 별도 숫자값으로 변환한 뒤 3절을 적용한다. 빈 문자열은 미응답이며 문자·0·6·소수는 불량이다.

2. 신청 기록 정리
2.1 참가자ID가 비어 있는 행은 제외한다. 새 ID를 추정하여 채우지 않는다.
2.2 같은 회차의 동일 참가자ID는 원본행 번호가 가장 작은 첫 행만 후보로 유지하고 이후 중복행을 제외한다. 첫 행의 값이 불량이어도 후속행으로 자동 대체하지 않는다.
2.3 참여여부는 Y 또는 N만 허용한다. 그 외 값은 보류로 기록한다. 보류행은 유효 신청과 참여의 분모·분자 모두에서 제외한다.
2.4 위 제외·보류 조건에 해당하지 않는 행을 채택한다. 원본 행수 = 채택 + 제외 + 보류로 대조한다. 대량 자료의 중복은 회차와 정규화ID를 묶은 키로 한 번씩 처리한다. 누적 COUNTIF를 매행 반복하지 않는다.

3. 지표 정의와 분모
3.1 참여율 = 채택행 중 참여여부 Y 건수 / 채택행 건수. 참여여부 N도 유효 신청 분모에 포함한다. 분모가 0이면 0% 대신 미확인으로 표시한다.
3.2 만족도는 채택행 중 참여여부 Y인 사람의 응답만 대상으로 한다. 숫자 1, 2, 3, 4, 5만 유효하다.
3.3 빈 만족도는 미응답이다. 0, 6, 소수, 문자 등은 범위/형식오류다. 미응답과 불량 만족도는 평균에서 제외하되 유효 신청과 참여 건수는 유지한다.
3.4 만족도 평균 = 유효 만족도 점수 합 / 유효 응답자 수. 분모가 0이면 미확인으로 표시한다. 비참여자 응답은 평균에 포함하지 않는다.
3.5 보고서에는 참여율과 만족도의 분자·분모를 함께 적는다. 참여율은 소수점 1자리 %, 만족도는 소수점 2자리 /5점으로 표시한다. 계산에는 반올림 전 값을 쓴다.

4. 근거와 해석
4.1 기준표에는 질문 / 기준 / 근거 문서와 조항 / 원문 문장 / 확인 상태를 남긴다. AI의 인용 표시를 누른 뒤 실제 원문과 대조한다.
4.2 수치는 원본·정리·요약 시트로 추적 가능해야 한다. PPT에는 교육용 가상 자료라는 표시, 회차, 지표 분모, 출처 파일을 남긴다.
4.3 이 자료만으로 실제 사업 효과, 전체 주민의 만족, 개선의 원인을 주장하지 않는다. 미확인 사항은 삭제하거나 임의 확정하지 않는다.
4.4 회차 간 비교는 같은 기준으로 계산한 뒤 한다. 원인을 입증하는 자료가 없으면 증감의 원인은 미확인이다.

5. 재실행과 결과 저장
5.1 sources는 기준 자료, data는 입력 원본, templates는 보고 양식, work는 중간 기록, output은 최종 결과, checks는 검산 기록으로 쓴다.
5.2 다음 회차에는 입력 파일·회차만 바꾸고 이 기준을 유지한다. 전체 원본 행수, 정리 판정, 분모·분자, 차트, PPT 수치를 다시 확인한다. 첫·중간·마지막 행 표본 검토와 전체행 검산을 함께 한다.
5.3 자동화가 파일을 생성한 뒤 사람이 하는 업로드·복사·검토 작업은 작업 기록에 남긴다. 한 번 생성한 결과만으로 완전 자동 실행을 구현했다고 표현하지 않는다.
'''

PROMPTS={
'01-rag.txt':'''첨부한 operating-rules 자료만 근거로 다음 질문에 답해줘. 아직 계산하거나 PPT를 만들지 마.
1) 참여율의 분자·분모는 무엇인가?
2) 참가자ID 누락·중복·참여여부 오류·만족도 미응답/불량은 각각 어떻게 처리하는가?
질문 / 기준 / 문서·조항 / 원문 문장 / 확인 상태 표를 만들어줘. 자료에 없는 조건은 미확인으로 남겨줘. 인용이 실제로 그 기준을 지지하는지 확인할 위치도 적어줘.''',
'02-excel.txt':'''sources/operating-rules.txt와 work/evidence.txt의 확인된 기준을 적용해 data/round-01.xlsx의 원본 시트를 읽고 분석해줘. 실제 파일 생성 기능이 있는 도구에서는 편집 가능한 output/round-01-summary.xlsx로 저장해줘.
원본은 10,000행이다. 덮어쓰지 말고 원본/정리/요약/근거 네 시트를 만들어줘. 원본행 번호·행순서를 유지하고 ID누락·동일회차 후속중복은 제외, Y/N외 참여값은 보류하되 원본값과 사유를 보존해줘. 회차+정규화ID를 키로 한 Python·Power Query 등 선형 전처리로 정리 판정을 만들고 매행 누적 COUNTIF는 쓰지 마. 정리 A-H는 정규화값·판정·사유, I-L은 유효신청·참여수·유효응답·점수합 수식, M은 만족도 처리 상태로 구성해줘. 요약은 SUM/COUNTIF/SUMIF 등 수식으로 참여율·만족도 및 분자·분모를 계산해줘. 프로그램별 참여자 수 차트 하나를 만들어줘. 미응답·불량 점수는 0점으로 바꾸지 마. 근거 조항과 전처리 방법을 보존해줘.
최종 저장 전에 10,000=채택+제외+보류와 전체 10,000행의 판정·수식 결과를 검산해줘. 첫·중간·마지막 행도 열어보고 확인하지 못한 사항을 알려줘. 수식만 텍스트로 설명하고 파일을 만든 것처럼 말하지 마.''',
'03-ppt.txt':'''output/round-01-summary.xlsx와 sources/operating-rules.txt, templates/report-template.pptx를 사용해 교육용 가상 프로그램 운영결과 보고 PPT를 5장으로 작성해줘. 실제 파일 생성 기능이 있는 도구에서는 output/round-01-report.pptx로 저장해줘.
1 보고 범위(10,000행/회차/교육용 가상 자료), 2 데이터 정리(원본/채택/제외/보류), 3 참여율(분자·분모와 프로그램별 참여자 차트), 4 만족도(점수합/유효응답 수/평균), 5 확인할 사항과 다음 작업으로 구성해줘.
숫자는 엑셀 요약만 사용하고 표·텍스트는 편집 가능하게 만들어줘. 차트도 가능하면 편집 가능한 차트로 만들고 불가능한 경우 알려줘. 참여율·만족도 분모와 출처를 표기하고 미확인 원인을 단정하지 마. 생성 후 엑셀 숫자와 슬라이드 숫자를 대조해줘. 이미지 한 장으로 된 PPT는 완료로 처리하지 마.''',
'04-rerun.txt':'''같은 운영 기준과 작업 순서를 유지하며 입력만 data/round-02.xlsx, 회차만 R02로 바꿔 output/round-02-summary.xlsx와 output/round-02-report.pptx를 생성해줘. R01 수치를 남기거나 두 회차를 합산하지 마.
정리 판정부터 다시 실행하고 I-L 수식·요약·차트를 재계산해줘. 원본 10,000행 전체 보존, 제외/보류 사유, 참여율 분모·분자, 만족도 점수합·분모, 프로그램별 참여 차트, PPT의 회차·숫자·출처를 검토해줘. 이전 회차와 다른 값과 바뀌지 않아야 할 기준을 work/rerun-log.txt에 기록해줘. 실제로 수행하지 못한 작업은 미수행으로 남겨줘.'''
}

def main():
    build_started=time.perf_counter()
    initial_chart_temp={p.name for p in ROOT.glob('.chart-data-*')}
    BUILD.mkdir(parents=True,exist_ok=True)
    for d in ['data','sources','templates','examples','guide','checks','prompts','work','output']:
        (OUT/d).mkdir(parents=True,exist_ok=True)
    generation_started=time.perf_counter()
    data={f'round-0{n}':{'rows':rows_for(n),'expected':evaluate(rows_for(n))} for n in (1,2)}
    data['warmup']={'rows':warmup_rows(),'expected':evaluate(warmup_rows())}
    csv_rows=[row for n in range(1,11) for row in rows_for(n,global_offset=(n-1)*10000)]
    extension=evaluate(csv_rows)
    with (OUT/'data/extension-100000.csv').open('w',encoding='utf-8-sig',newline='') as stream:
        writer=csv.writer(stream);writer.writerow(['원본행','회차','참가자ID','프로그램','참여여부','만족도']);writer.writerows(csv_rows)
    generation_seconds=time.perf_counter()-generation_started
    (BUILD/'data.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    expected={k:{a:b for a,b in v['expected'].items() if a!='cleanRows'} for k,v in data.items()}
    expected['extension']={k:v for k,v in extension.items() if k!='cleanRows'}
    expected['extension']['byRound']={f'R{n:02}':{k:v for k,v in evaluate(rows_for(n)).items() if k!='cleanRows'} for n in range(1,11)}
    expected['extension']['aggregationPurpose']='전체파일 검산용 합계이며 보고서는 회차별로 따로 작성한다.'
    expected['dataScale']={'warmupRows':48,'mainRowsPerRound':10000,'extensionRows':100000,'seedBase':2026110600,'extensionRounds':10,'duplicateKey':['회차','정규화 참가자ID']}
    put('checks/expected-values.json',json.dumps(expected,ensure_ascii=False,indent=2))
    (ROOT/'content/automation-metrics.json').write_text(json.dumps(expected,ensure_ascii=False,indent=2),encoding='utf-8',newline='\n')
    if '--metrics-only' in sys.argv:
        print(json.dumps(expected,ensure_ascii=False,indent=2));return
    put('sources/operating-rules.txt',RULES)
    put('sources/operating-rules.html',f'<!doctype html><html lang="ko"><meta charset="utf-8"><title>교육용 운영·보고 기준</title><style>body{{font:18px/1.8 sans-serif;max-width:900px;margin:48px auto;padding:20px}}pre{{white-space:pre-wrap;font:inherit}}</style><h1>교육용 운영·보고 기준</h1><pre>{html.escape(RULES)}</pre></html>')
    put('sources/report-guide.txt','보고서는 5장으로 구성한다. 1 범위(교육용 가상 자료·회차), 2 정리 판정과 원본10,000행 대조, 3 참여율과 프로그램별 참여자수, 4 만족도와 유효응답 분모, 5 미확인·다음 작업. 근거 조항과 엑셀 출처를 남긴다. 숫자·원인을 임의 생성하지 않는다. 48행은 준비연습으로 분리한다. 100,000행 CSV는 확장 과제이며 회차별로 따로 집계한다.')
    for name,content in PROMPTS.items(): put('prompts/'+name,content+'\n')
    agents='''# 교육용 보고 자동화 작업 규칙

이 폴더의 기준과 데이터는 모두 강사 제작 가상 자료다. 실제 기관의 성과·공적 기준으로 표현하지 않는다.

1. sources/operating-rules.txt와 sources/report-guide.txt를 읽고 시작한다.
2. data 원본과 sources를 수정하지 않는다. 작업중 기록은 work, 최종 XLSX/PPTX는 output에 저장한다.
3. 원본의 ID·행번호·값을 보존한다. 회차+정규화ID로 한 번씩 처리하고 누적 COUNTIF를 매행 반복하지 않는다. 누락은 추정하지 않고 제외/보류 사유를 남긴다.
4. 참여율과 만족도는 서로 다른 분모를 쓰므로 운영기준 3절에 따라 계산한다.
5. 엑셀은 원본/정리/요약/근거 시트를 두고 수식을 유지한다. PPT는 수정 가능한 텍스트·표를 사용한다.
6. 출력에 가상 자료·회차·분모·출처·미확인 사항을 남긴다. 실제 AI 실행 여부와 수행하지 못한 검증을 정확히 기록한다.
7. 외부 발송·게시·원본 삭제를 하지 않는다. 불필요한 패키지 설치와 파일 실행 없이 가능한 범위부터 처리한다.
8. checks/expected-values.json은 생성 후 검산에 사용한다. 기대값을 원본 분석 대신 답으로 복사하지 않는다.
'''
    put('AGENTS.md',agents); put('CLAUDE.md','@AGENTS.md\n\n이 파일은 AGENTS.md의 작업 규칙을 참조합니다. 실제 사용 도구가 참조를 읽었는지 확인하고, 지원하지 않으면 AGENTS.md를 직접 첨부하세요.\n')
    procedure='''# 업무 절차

1. sources 운영기준을 자료 기반 AI 도구에 등록하고 prompts/01-rag.txt로 지표·정리 기준을 찾는다. 인용을 열어 원문을 대조하고 work/evidence.txt에 확인한 기준을 저장한다.
2. 실제 파일 생성이 가능한 AI 도구에 data/round-01.xlsx, 기준, 확인한 근거표를 전달한다. prompts/02-excel.txt로 XLSX를 만든다. 원본/정리/요약/근거, 수식, 분모, 프로그램별 차트를 확인한다.
3. prompts/03-ppt.txt와 엑셀 결과·PPT 템플릿·기준을 전달해 PPTX를 만든다. 원본10,000행·참여율·만족도 숫자를 엑셀과 대조한다.
4. data/round-02.xlsx로 prompts/04-rerun.txt를 실행한다. R01 숫자 혼입, 분모·차트·슬라이드 갱신, 미확인 보존을 검사한다.
5. checks 기대값은 생성 후 확인한다. 다르면 원본→정리 기준→수식→슬라이드 순서로 원인을 찾는다. 차이를 숨기거나 기대값에 맞추기 위해 원본을 바꾸지 않는다.

AGENTS.md는 도구별 자동 적용 여부가 다르다. 자동 적용이 확인되지 않으면 직접 읽게 하거나 내용과 자료를 첨부한다. CLAUDE.md의 @AGENTS.md 역시 실제 도구의 지원 여부를 확인한다.
자료 검색 도구와 파일 생성 도구 사이 업로드·복사는 사람이 수행한다. 예약 실행·API 연결·무인 실행은 이 실습에 포함하지 않는다.
'''
    put('업무절차.md',procedure)
    put('README.md','''# RAG·엑셀·PPT 중급 실습 묶음

압축을 푼 뒤 guide/start-here.html을 브라우저로 여세요. 이 폴더의 자료는 모두 강사 제작 교육용 예제입니다. examples는 외부 AI가 실행한 결과가 아니라 검산용 완성 예시입니다.

sources: 운영·보고 기준 / data: 회차별 원본 / templates: 편집 가능한 PPT 양식 / work: 근거표·작업 기록 / output: 수강생 결과 / checks: 기대값·검산표 / prompts: 단계별 요청문.

실습은 prompts/01-rag.txt → 02-excel.txt → 03-ppt.txt → 04-rerun.txt 순서입니다. 파일 생성이 안 되는 계정에서는 원본을 직접 정리하고 제공된 examples 파일을 열어 수식과 PPT를 수정하세요. 계산 자동화와 수동 파일 전달을 구분합니다.

준비연습은 data/warmup-48.xlsx(48행), 본 실습은 data/round-01.xlsx와 round-02.xlsx(각10,000행)입니다. data/extension-100000.csv는10회차100,000행의 별도 확장 다운로드이며 이 ZIP에는 포함하지 않습니다. CSV다운로드는 공개 강의 웹의 자료 링크를 사용하세요. 48행을 복제한 자료가 아니라 프로그램별 분포가 다른 시드 데이터입니다.

Excel 파일은 수식·계산 캐시를 포함합니다. 다른 앱에서 값이 비거나 오래된 값이면 자동 계산을 켜고 지금 계산을 실행하세요. 정리 판정은 선형 전처리로 재생성하고 I-L 수식·요약·차트는 재계산합니다. 본 예제 범위는 원본 A2:F10001, 정리 A2:M10001입니다. 행 추가 시 범위와 차트도 확장하세요. 원본 교체 후 정리 단계부터 재실행하고 checks 기대값을 비교하세요.
''')
    put('work/evidence.txt','질문 / 기준 / 문서·조항 / 원문 문장 / 확인 상태\n수강생이 01-rag 단계에서 작성합니다.\n')
    put('work/rerun-log.txt','입력 회차 / 실행한 단계 / 생성 파일 / 확인한 값 / 미확인 / 사람이 한 전달·수정\n')
    put('output/여기에-결과를-저장하세요.txt','수강생이 생성한 XLSX와 PPTX를 이 폴더에 저장합니다. 제공된 examples는 강사 제작 완성 예시입니다.\n')
    values=''.join(f'<tr><td>{k}</td><td>{v["rawRows"]:,}</td><td>{v["validApplicants"]:,}</td><td>{v["participants"]:,}</td><td>{v["participationRate"]*100:.1f}%</td><td>{v["scoreSum"]:,}/{v["validResponses"]:,}</td><td>{v["satisfactionMean"]:.2f}/5</td><td>{v["excludedRows"]}/{v["heldRows"]}</td></tr>' for k,v in expected.items() if k in ('warmup','round-01','round-02'))
    expected_html=f'<table><thead><tr><th>회차</th><th>원본</th><th>유효신청</th><th>참여</th><th>참여율</th><th>점수합/응답</th><th>만족도</th><th>제외/보류</th></tr></thead><tbody>{values}</tbody></table>'
    put('checks/expected-values.html','<!doctype html><html lang="ko"><meta charset="utf-8"><title>검산 기대값</title><style>body{font:18px/1.7 sans-serif;margin:40px}table{border-collapse:collapse}td,th{padding:12px;border:1px solid #ccc}</style><h1>검산 기대값</h1><p>강사 제작 가상 데이터의 정해진 기준 계산값입니다. 먼저 직접 생성한 뒤 비교하세요.</p>'+expected_html)
    guide='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RAG·엑셀·PPT 실습 시작</title><style>body{font:18px/1.8 system-ui,sans-serif;color:#202d42;max-width:1000px;margin:32px auto;padding:24px}h1{font-size:2.2rem}h2{margin-top:40px}a{color:#174eaa}pre{white-space:pre-wrap;background:#f1f4f8;padding:20px;font:inherit;border-left:3px solid #4b6d9d}table{border-collapse:collapse;width:100%;font-size:16px}td,th{padding:10px;border:1px solid #ced7e3;text-align:left}.note{background:#fff7e0;padding:16px}li{margin:10px 0}</style><h1>RAG·엑셀·PPT 실습 시작</h1><p>운영 기준을 찾아 엑셀로 계산하고 보고 PPT를 만듭니다. 기준과 데이터는 모두 강사 제작 가상 자료이며, 완성 예시는 외부 AI 실행 결과가 아닙니다.</p><p class="note">압축을 풀어 이 페이지를 열었다면 아래 파일이 함께 있어야 합니다. 웹에서 보고 있다면 전체 ZIP을 내려받아 압축을 풀어 시작하세요. 자료 기반 AI 도구와 파일 생성 AI 도구는 직접 열어 사용합니다. 파일 생성·다운로드 가능 여부는 자신의 계정에서 확인하세요.</p><h2>0. 폴더와 준비 파일</h2><p>sources는 기준, data는 원본, templates는 PPT 양식, work는 근거표, output은 내 결과, checks는 검산 자료입니다.</p><ul><li><a href="../sources/operating-rules.txt">운영 기준 TXT</a> / <a href="../sources/operating-rules.html">읽기용 HTML</a> / <a href="../sources/operating-rules.pdf">PDF</a></li><li><a href="../data/round-01.xlsx">1회차 원본 XLSX</a> / <a href="../data/round-02.xlsx">2회차 원본 XLSX</a></li><li><a href="../templates/report-template.pptx">5장 PPT 양식</a></li><li><a href="../AGENTS.md">AGENTS.md</a> / <a href="../CLAUDE.md">CLAUDE.md</a> / <a href="../업무절차.md">업무 절차</a></li></ul><h2>1. RAG로 계산 기준 찾기 · 약 15분</h2><ol><li>자료 기반 질문 도구에 운영 기준 TXT 또는 PDF를 새 소스로 등록합니다.</li><li>아래 요청을 입력합니다. 출처 표시를 열어 조항과 원문을 대조합니다.</li><li>확인한 표를 work/evidence.txt에 저장합니다. 이후 파일 생성 도구로 옮길 때 기준 원문과 근거표도 함께 전달합니다.</li></ol><pre>@@RAG@@</pre><h2>2. 엑셀 정리·계산·차트 · 약 65분</h2><p>실제 XLSX를 생성·다운로드할 수 있는 AI 도구에 원본 XLSX, 운영기준, 근거표를 첨부합니다. AGENTS.md가 자동 적용되지 않으면 내용도 직접 전달하세요.</p><pre>@@EXCEL@@</pre><p>다운로드한 파일을 열어 원본/정리/요약/근거 시트, 실제 수식, 참여율 분모와 만족도 분모를 확인합니다. 숫자가 비거나 갱신되지 않으면 자동 계산을 켜고 지금 계산을 실행합니다. 원본은 바꾸지 않습니다.</p><h2>3. 편집 가능한 보고 PPT · 약 30분</h2><p>검토한 엑셀 결과, 운영기준, PPT 양식을 첨부합니다. 텍스트 상자를 눌러 글자가 수정되는지 확인하세요.</p><pre>@@PPT@@</pre><h2>4. 다음 회차로 재실행 · 약 10분</h2><pre>@@RERUN@@</pre><p>회차·분모·차트·PPT 숫자가 모두 바뀌었는지 확인합니다. 파일 간 전달은 사람이 합니다. 예약·무인 실행을 구현한 것으로 기록하지 않습니다.</p><h2>파일 생성이 안 될 때</h2><p>엑셀 원본을 직접 열고 AI가 제안한 수식을 적용하거나, <a href="../examples/round-01-summary.xlsx">완성 엑셀 예시</a>의 정리·요약 수식을 읽고 바꿔봅니다. PPT는 <a href="../examples/round-01-report.pptx">완성 PPT 예시</a>를 열어 숫자·문구를 직접 수정합니다. 계정에서 하지 못한 생성은 미수행으로 기록합니다.</p><h2>직접 수행한 뒤 검산하기</h2><details><summary>기대값 열기</summary>@@VALUES@@<p><a href="../checks/expected-values.json">원시 기대값 JSON</a>. 차이가 나면 원본→정리 판정→계산 분모→PPT 순서로 확인하세요. 기준을 바꾸거나 원본을 고쳐 답에 맞추지 않습니다.</p></details><h2>완료 기준</h2><ul><li>근거표에 기준 조항과 직접 확인한 원문이 있습니다.</li><li>엑셀에 수식·분모·제외/보류 사유·프로그램별 참여 차트가 있습니다.</li><li>PPT가 편집 가능하고 핵심 숫자가 엑셀과 같습니다.</li><li>2회차에 같은 기준을 적용하고 이전 수치가 남지 않았는지 확인했습니다.</li></ul></html>'''
    volume='<h2>실습 규모와 순서</h2><p><strong>준비48행 → 본 실습10,000행 → 선택 확장100,000행</strong> 순서입니다. 본 실습의 원본 A2:F10001, 정리 A2:M10001을 전체 검산합니다. 프로그램마다 참여율과 점수 분포가 다르며 누락·중복·보류·문자·0·6·소수·미응답을 구분합니다. 정리는 회차+정규화ID 키로 한 번씩 처리하고 매행 누적 COUNTIF를 반복하지 않습니다.</p>'
    guide=guide.replace('<h2>0. 폴더와 준비 파일</h2>',volume+'<h2>0. 폴더와 준비 파일</h2>')
    extra_links='<li><a href="../data/warmup-48.xlsx">48행 준비연습</a> / <a href="../examples/warmup-48-summary.xlsx">48행 완성 엑셀</a> / <a href="../examples/warmup-48-report.pptx">48행 완성 PPT</a></li><li><a href="https://zeusk302-png.github.io/ulsan-ai-workshop/automation/data/extension-100000.csv">100,000행 CSV 별도 다운로드</a> (UTF-8 BOM, ZIP에 미포함)</li>'
    guide=guide.replace('</ul><h2>1. RAG',extra_links+'</ul><h2>1. RAG',1)
    extension_guide='<h2>선택 확장 · 100,000행 CSV</h2><p>Excel의 데이터→텍스트/CSV에서 파일을 열고 UTF-8·쉼표 구분을 확인합니다. 데이터 변환에서 회차·ID를 텍스트로 두고 만족도 원문을 보존한 뒤 별도 숫자값으로 변환합니다. 빈값은 미응답, 숫자 1~5 정수만 유효합니다. 먼저 R01 10,000행만 골라 본 실습과 같은 결과인지 확인한 뒤 R01~R10을 각각 집계합니다. 중복키는 회차+정규화ID이며 같은 ID라도 회차가 다르면 별도 신청입니다. 전체 CSV를 채팅 본문에 붙이지 말고 파일 처리로 실행하세요.</p>'
    guide=guide.replace('<h2>완료 기준</h2>',extension_guide+'<h2>완료 기준</h2>')
    for key,value in [('RAG',PROMPTS['01-rag.txt']),('EXCEL',PROMPTS['02-excel.txt']),('PPT',PROMPTS['03-ppt.txt']),('RERUN',PROMPTS['04-rerun.txt'])]: guide=guide.replace('@@'+key+'@@',html.escape(value))
    put('guide/start-here.html',guide.replace('@@VALUES@@',expected_html))
    print(json.dumps(expected,ensure_ascii=False,indent=2),flush=True)
    # Author the optional source PDF with the bundled Python/reportlab.
    if '--resume' not in sys.argv:
        subprocess.run([str(NODE),'container_tools/mark_artifact_operation_started.mjs','--operation-kind','create','--expected-output-count','1','--output-format','pdf'],cwd=SKILLS/'pdf/26.1104.12130/skills/pdf',check=True)
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib import colors
    pdfmetrics.registerFont(TTFont('Malgun',r'C:\Windows\Fonts\malgun.ttf'))
    style=ParagraphStyle('body',fontName='Malgun',fontSize=10,leading=17,spaceAfter=7,textColor=colors.HexColor('#26364d'))
    title=ParagraphStyle('heading',parent=style,fontSize=18,leading=26,spaceAfter=14)
    story=[]
    for index,line in enumerate(RULES.splitlines()):
        if line: story.append(Paragraph(html.escape(line), title if index==0 else style))
        else: story.append(Spacer(1,6))
    doc=SimpleDocTemplate(str(OUT/'sources/operating-rules.pdf'),pagesize=(595.28,841.89),rightMargin=46,leftMargin=46,topMargin=40,bottomMargin=40)
    doc.build(story)
    # A conversation-specific build folder resolves only bundled JS dependencies.
    link=BUILD/'node_modules'
    if not link.exists(): subprocess.run(['powershell','-NoProfile','-Command',f"New-Item -ItemType Junction -Path '{link}' -Target '{RUNTIME/'node/node_modules'}' | Out-Null"],check=True)
    shutil.copy2(ROOT/'scripts/build-automation-materials.mjs',BUILD/'build.mjs')
    for kind,count in ([] if '--resume' in sys.argv else [('xlsx',5),('pptx',3)]):
        skill='spreadsheets' if kind=='xlsx' else 'presentations'
        subprocess.run([str(NODE),'container_tools/mark_artifact_operation_started.mjs','--operation-kind','create','--expected-output-count',str(count),'--output-format',kind],cwd=SKILLS/f'{skill}/26.1104.12130/skills/{skill}',check=True)
    env=os.environ.copy();env['RUNTIME_NODE_MODULES']=str(RUNTIME/'node/node_modules')
    env['RUNTIME_NODE']=str(NODE);env['RUNTIME_PYTHON']=str(PYTHON)
    artifact_started=time.perf_counter()
    subprocess.run([str(NODE),str(BUILD/'build.mjs'),str(ROOT),str(PYTHON)],check=True,env=env)
    artifact_seconds=time.perf_counter()-artifact_started
    evidence_dir=ROOT/'artifacts/automation-volume-2026-11-06'
    evidence_dir.mkdir(parents=True,exist_ok=True)
    for p in OUT.rglob('*.inspect.ndjson'):
        shutil.move(str(p),str(evidence_dir/p.name))
    for pattern in ('*.png','*-validation.json','workbook-error-scan.json','rerun-verification.json'):
        for p in BUILD.glob(pattern): shutil.copy2(p,evidence_dir/p.name)
    # ZIP paths mirror the folder instructions; examples remain clearly separate.
    subprocess.run([sys.executable,str(ROOT/'scripts/integrate-reference-pack.py'),'--no-zip'],check=True)
    with zipfile.ZipFile(OUT/'report-workspace.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(OUT.rglob('*')):
            if p.is_file() and p.name not in ('report-workspace.zip','extension-100000.csv') and p.suffix not in ('.png','.webp','.ndjson','.zip'):
                z.write(p,'report-workspace/'+p.relative_to(OUT).as_posix())
    # Reopen the actual outputs. openpyxl is used for reading only.
    import openpyxl
    from pypdf import PdfReader
    from html.parser import HTMLParser
    from urllib.parse import unquote
    verification_started=time.perf_counter()
    checks=[]
    for n in (1,2):
        wb=openpyxl.load_workbook(OUT/f'data/round-0{n}.xlsx',data_only=True)
        assert wb.sheetnames==['원본','정리','요약','근거']
        assert wb['원본'].max_row==10001
        actual_rows=[list(row) for row in wb['원본'].iter_rows(min_row=2,values_only=True)]
        expected_rows=rows_for(n)
        assert [[None if v=='' else v for v in row] for row in actual_rows]==[[None if v=='' else v for v in row] for row in expected_rows]
        checks.append(f'R0{n} input reopened: all 10,000 original rows preserved; original is the first worksheet')
    wb=openpyxl.load_workbook(OUT/'examples/round-01-summary.xlsx',data_only=True)
    fw=openpyxl.load_workbook(OUT/'examples/round-01-summary.xlsx',data_only=False)
    metric_keys=['rawRows','validApplicants','participants','participationRate','validResponses','scoreSum','satisfactionMean','excludedRows','heldRows','missingSatisfaction','invalidSatisfaction']
    for r,k in enumerate(metric_keys,5): assert abs(wb['요약'][f'B{r}'].value-expected['round-01'][k])<1e-10
    actual_clean=[list(row) for row in wb['정리'].iter_rows(min_row=2,values_only=True)]
    expected_clean=data['round-01']['expected']['cleanRows']
    assert [[None if v=='' else v for v in row] for row in actual_clean]==[[None if v=='' else v for v in row] for row in expected_clean]
    for row in fw['정리'].iter_rows(min_row=2,min_col=9,max_col=12):
        assert all(cell.data_type=='f' and cell.value.startswith('=') for cell in row)
    assert fw['요약']['B8'].value=='=IF(B6=0,"미확인",B7/B6)'
    assert len(fw['요약']._charts)==1 and fw['요약']._charts[0].y_axis.scaling.min==0
    checks.append('Example XLSX reopened: all 10,000 cleaned rows and cached metrics match; 40,000 I-L formulas and zero-baseline native chart retained')
    warmup=openpyxl.load_workbook(OUT/'data/warmup-48.xlsx',data_only=True)
    assert warmup['원본'].max_row==49
    warmup_result=openpyxl.load_workbook(OUT/'examples/warmup-48-summary.xlsx',data_only=True)
    assert warmup_result['요약']['B7'].value==37 and warmup_result['요약']['B9'].value==32
    checks.append('Warmup 48-row original and completed example preserved separately')
    assert (OUT/'data/extension-100000.csv').read_bytes()[:3]==b'\xef\xbb\xbf'
    with (OUT/'data/extension-100000.csv').open(encoding='utf-8-sig',newline='') as stream:
        reader=csv.reader(stream);assert next(reader)==['원본행','회차','참가자ID','프로그램','참여여부','만족도']
        loaded=[]
        for row in reader:
            score=row[5]
            if score=='': score=None
            else:
                try: score=float(score)
                except ValueError: pass
            loaded.append([int(row[0]),*row[1:5],score])
    assert len(loaded)==100000 and loaded==csv_rows
    assert loaded[:10000]==rows_for(1)
    loaded_result=evaluate(loaded)
    for key,value in loaded_result.items():
        if key!='cleanRows': assert value==expected['extension'][key],key
    checks.append('UTF-8 BOM CSV reopened: all 100,000 rows checked with round+normalized-ID key; R01 matches main workbook source')
    page_count=len(PdfReader(OUT/'sources/operating-rules.pdf').pages)
    assert 2<=page_count<=3
    checks.append(f'Rules PDF reopened: {page_count} pages')
    class Links(HTMLParser):
        def __init__(self): super().__init__();self.hrefs=[]
        def handle_starttag(self,tag,attrs):
            if tag=='a': self.hrefs += [v for k,v in attrs if k=='href']
    parser=Links();parser.feed((OUT/'guide/start-here.html').read_text(encoding='utf-8'))
    local_hrefs=[h for h in parser.hrefs if not h.startswith(('https://','http://'))]
    for href in local_hrefs: assert (OUT/'guide'/unquote(href)).resolve().is_file(),href
    checks.append(f'Start guide: {len(local_hrefs)} local download links resolve; CSV is a separate public download')
    with zipfile.ZipFile(OUT/'report-workspace.zip') as z:
        assert z.testzip() is None
        assert not any(name.endswith('.ndjson') or '/input/' in name or name.endswith('extension-100000.csv') for name in z.namelist())
        for item in ['AGENTS.md','CLAUDE.md','README.md','업무절차.md','data/round-01.xlsx','data/round-02.xlsx','data/warmup-48.xlsx','examples/warmup-48-summary.xlsx','templates/report-template.pptx','guide/start-here.html']:
            assert 'report-workspace/'+item in z.namelist(),item
        checks.append(f'ZIP reopened and CRC checked: {len(z.namelist())} files, data folder used consistently')
    timings={'seedGenerationAndCsvSeconds':generation_seconds,'artifactGenerationRenderingAndValidationSeconds':artifact_seconds,'fileVerificationSeconds':time.perf_counter()-verification_started,'totalBuilderSeconds':time.perf_counter()-build_started,'scope':'Local deterministic generator and file checks only; not student AI execution or saved work time'}
    (evidence_dir/'file-verification.json').write_text(json.dumps({'status':'pass','checks':checks,'timings':timings,'limits':['Native Excel/PowerPoint UI not opened','External AI execution and student account availability not tested'],'expectedValues':expected},ensure_ascii=False,indent=2),encoding='utf-8')
    print('Wrote classroom pack:',OUT/'report-workspace.zip')
    # Remove the junction itself before removing our flat private build files.
    # Never recursively traverse the bundled dependency junction.
    assert BUILD.resolve()==ROOT/'scripts/.automation-build'
    if link.exists():
        assert Path(os.path.realpath(link))==Path(os.path.realpath(RUNTIME/'node/node_modules'))
        os.rmdir(link)
    for p in BUILD.iterdir():
        if p.is_file(): p.unlink()
    BUILD.rmdir()
    for p in ROOT.glob('.chart-data-*'):
        if p.name not in initial_chart_temp:
            assert p.resolve().parent==ROOT.resolve()
            if p.is_file(): p.unlink()
            elif p.is_dir(): shutil.rmtree(p)

if __name__=='__main__': main()
