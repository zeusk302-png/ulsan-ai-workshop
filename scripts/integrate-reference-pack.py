"""Refresh novice packet requests and ZIP; preserve original fixture bytes."""
from pathlib import Path
import hashlib, html, json, re, sys, zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/automation'

def write(path,text): path.write_bytes(text.replace('\r\n','\n').encode('utf-8'))

def fixtures():
    return {p.relative_to(OUT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
            for p in OUT.rglob('*') if p.is_file() and not p.name.startswith('~$') and
            (p.suffix.lower() in ('.xlsx','.pptx','.pdf') or p.parent.name=='data')}

def main():
    before=fixtures()
    source=(ROOT/'src/guided-automation-data.js').read_text(encoding='utf-8-sig')
    guide=OUT/'guide/start-here.html'
    text=guide.read_text(encoding='utf-8-sig')
    for key,name in [('ragHandoffRequest','01-rag.txt'),('fileExecutionLead','02-file-ai-start.txt'),('repeatRequest','04-repeat-novice.txt')]:
        found=re.search(r'export const '+key+r'=`(.*?)`;',source,re.S)
        assert found,key
        prompt=found.group(1)
        write(OUT/'prompts'/name,prompt+'\n')
        pattern=r'(<pre id="'+key+r'">).*?(</pre>)'
        assert re.search(pattern,text,re.S),key
        text=re.sub(pattern,lambda m:m.group(1)+html.escape(prompt)+m.group(2),text,flags=re.S)
    write(guide,text)
    count=len(json.loads((ROOT/'content/reference-corpus.json').read_text(encoding='utf-8-sig'))['documents'])
    guidance=f'''# 처음 시작하는 AI 업무 자동화

강사 제작 가상 교육자료입니다. 압축을 풀고 guide/start-here.html을 브라우저로 여세요. 기본 실습은 교육용 프로그램 1회차 성과보고 하나입니다.

1. reference-corpus/all-documents.txt 또는 reference-corpus/reference-corpus.pdf 중 하나를 자료 기반 AI에 등록합니다. {count}개 문서가 한 파일에 있으므로 소스 1개가 정상입니다.
2. prompts/01-rag.txt를 보냅니다. AI가 실제 작성한 업무 기준과 실행 프롬프트 두 부분을 모두 복사합니다.
3. 파일 작업 AI에 두 부분의 실제 답변과 data/round-01.xlsx, templates/report-template.pptx를 첨부합니다. 새 XLSX와 5장 PPTX 다운로드를 요청합니다. 필요하면 prompts/02-file-ai-start.txt 아래에 실제 답변을 붙입니다.
4. 두 파일을 지원 편집기로 열어 내용·차트·5장 구성·제목과 표의 편집·원본 보존을 확인합니다. data/round-02.xlsx와 prompts/04-repeat-novice.txt로 반복합니다. 다른 대화나 AI에서는 기준과 실행 요청, 양식도 다시 전달합니다.

선택 참고: guide/rag-generated-handoff.txt는 강사의 실제 RAG 시연 응답입니다. 내 계정의 응답이나 파일 작업 AI의 생성 완료 증거가 아닙니다.
생성할 수 없는 계정은 examples/round-01-summary.xlsx와 examples/round-01-report.pptx로 결과 확인을 이어갑니다. 강사 예시와 자신의 AI 생성을 구분합니다.

<details><summary>더 알아보기 · 선택 참고</summary>

AGENTS.md·CLAUDE.md는 일부 로컬 도구용이며 기본 실습 선행 과제가 아닙니다. 도구별 자동 발견·적용은 따로 확인합니다.
sources 기준 / data 원본 / templates 양식 / work 중간 자료 / output 결과 / checks 검토 자료.
개별 문서·추가 업무·8행 모형·48행 준비·10만 행 확장은 기본 실습과 구분합니다.

</details>
'''
    write(OUT/'README.md',guidance)
    write(OUT/'업무절차.md',guidance.replace('# 처음 시작하는 AI 업무 자동화','# 교육용 성과보고 · 네 단계 업무 순서',1))
    assert before==fixtures(),'Original fixtures changed'
    if '--no-zip' not in sys.argv:
        with zipfile.ZipFile(OUT/'report-workspace.zip','w',zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(OUT.rglob('*')):
                if path.is_file() and not path.name.startswith('~$') and path.suffix!='.zip' and path.name!='extension-100000.csv' and not path.name.endswith('.inspect.ndjson'):
                    archive.write(path,'report-workspace/'+path.relative_to(OUT).as_posix())
        with zipfile.ZipFile(OUT/'report-workspace.zip') as archive:
            assert archive.testzip() is None
            for name in ('reference-corpus/all-documents.txt','reference-corpus/reference-corpus.pdf','guide/start-here.html','guide/rag-generated-handoff.txt','data/round-01.xlsx','templates/report-template.pptx'):
                assert 'report-workspace/'+name in archive.namelist(),name
            for name,digest in before.items():
                if name=='data/extension-100000.csv': continue
                assert hashlib.sha256(archive.read('report-workspace/'+name)).hexdigest()==digest,name
    print(f'Built novice four-stage packet: {count} documents; preserved {len(before)} Office/data/PDF fixtures')

if __name__=='__main__': main()
