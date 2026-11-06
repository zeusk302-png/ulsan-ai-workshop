"""Build a faithful, offline RAG companion to the actual Ulsan store CSVs.

Standard-library only. Does not change any raw data, course metrics or templates.
Writes content/public-data-references.json and public/automation/public-data/references/.
Run after the official sources and content/public-data-course.json have been acquired.
Original acquisition files fall back to byte-identical committed source copies
in references/. Pinned source hashes are checked before use. Generated documents
and manifests are never used to reconstruct inputs. The source inventory holds
the original 39 Swagger records; the field-dictionary CSV mapping is an output.
"""
from __future__ import annotations

import collections
import csv
import hashlib
import html
import io
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
from urllib.parse import urlsplit, unquote
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts/public-data-2026-11-06'
PUBLIC = ROOT / 'public'
DATA = PUBLIC / 'automation/public-data/data'
OUT = PUBLIC / 'automation/public-data/references'
BASE = 'automation/public-data/references/'
FETCHED = '2026-11-06'
SOURCE_INPUTS = {
    'learning-research.json': ('source-inventory.json', '00f6c4a51d7992aacf9178f4e6a54d3f70516afa37a1659c60aa75c86bb97d68'),
    'download-info-202606.json': ('official-file-metadata-202606.json', 'e63579f1f7c6829419ec2040fcc1dc65d22c9fd4bd2992a23a1cf9ed92cb4a60'),
    'download-info.json': ('official-file-metadata-202609.json', 'e4b9c9cdfb5c24114816e8b8623fb98faaeb91fe1b20e8e9f05fe5149b8d48c6'),
    'sbiz-openapi-guide-260805-original.zip': ('sbiz-openapi-guide-260805-original.zip', '4ed2112e2a90e49e88243fa7963ae7d19628aed247b6492bcbae6a947534970e'),
    'sbiz-openapi-guide-260805-extracted.txt': ('sbiz-openapi-guide-260805-extracted.txt', '5084bad8635f90b8f953433bd2673fdfab90c846e78a15eb911a52239237bc42'),
}
LICENSE = '이용 허락 범위 제한 없음(공식 포털 표시). 첨부 HWP만의 별도 이용 조건은 확인하지 못 했으므로 제공 기관· 원본 출처와 추출 사실을 유지한다.'

API_NAMES = [
    'bizesId','bizesNm','brchNm','indsLclsCd','indsLclsNm','indsMclsCd','indsMclsNm',
    'indsSclsCd','indsSclsNm','ksicCd','ksicNm','ctprvnCd','ctprvnNm','signguCd',
    'signguNm','adongCd','adongNm','ldongCd','ldongNm','lnoCd','plotSctCd',
    'plotSctNm','lnoMnno','lnoSlno','lnoAdr','rdnmCd','rdnm','bldMnno','bldSlno',
    'bldMngNo','bldNm','rdnmAdr','oldZipcd','newZipcd','dongNo','flrNo','hoNo','lon','lat',
]
CSV_NAMES = [
    '상가업소번호','상호명','지점명','상권업종대분류코드','상권업종대분류명','상권업종중분류코드',
    '상권업종중분류명','상권업종소분류코드','상권업종소분류명','표준산업분류코드','표준산업분류명',
    '시도코드','시도명','시군구코드','시군구명','행정동코드','행정동명','법정동코드','법정동명',
    '지번코드','대지구분코드','대지구분명','지번본번지','지번부번지','지번주소','도로명코드',
    '도로명','건물본번지','건물부번지','건물관리번호','건물명','도로명주소','구우편번호','신우편번호',
    '동정보','층정보','호정보','경도','위도',
]

TASK_PROMPT = '첨부한 공식 자료와 강사 업무 지시를 구분해, 울산 광역시 상가 업소 두 분기의 지역· 업종 분포 보고를 준비해 줘.\n\n[1. 이번 업무에 사용할 자료 뜻과 주의 사항]\n공식 OpenAPI 활용 가이드의 전체 추출 문, 공식 39개 항목 설명과 실제 CSV 열 대응, 공식 2023 업종 코드 표, 두 분기 파일 메타 데이터·README를 참고해 식별 번호· 행정동/ 법정동· 업종 분류· 좌표의 뜻을 설명해 줘. 문서 이름· 버전· 관련 위치를 붙여 줘. 공식 원문에 서로 다른 설명이 있으면 원문을 바꾸지 말고 차이를 밝혀 줘. 강사가 정한 보고 구성은 공식 기관 규정이라고 표현하지 마.\n\n[2. 파일 작업 AI에게 그대로 줄 실행 프롬프트]\n다른 AI에는 ulsan-202606.csv와 ulsan-202609.csv 전체, industry-codes-2023.csv, ulsan-report-template.pptx 양식을 첨부할 예정이다. 두 CSV는 ulsan-two-quarters.zip으로 함께 전달할 수도 있고, 도구가 ZIP을 풀지 못하면 두 CSV를 직접 첨부한다. 원본 두 파일은 각 54,737 행·53,777 행,39개 열이며 총 108,514개 원본 레코드다. 이는 서로 다른 108,514개 업소라는 뜻이 아니다. 위에서 확인한 기준과 주의 사항도 실행 요청 안에 포함해 줘.\n파일 작업 AI가 원본 전체를 읽어 구 군 × 업종 구성, 관심 소분류의 행정동 분포, 분기 간 식별 번호 관찰 여부와 속성 차이를 계산하고 XLSX와 양식에 맞춘 편집 가능한 5 장 PPTX를 새 파일로 만들게해 줘. 구 군별 합계· 업종별 합계· 관심 업종 동별 합계· 조인 전후 행 수를 도구가 검 산하게해 줘. 원본은 보존하고 식별자· 지역· 업종 코드는 텍스트로 읽게해 줘. 두 상가 CSV는 UTF-8,2023 코드 표는 CP949이므로 각각 실제 한글과 열을 확인하게해 줘.\n2023 코드 표 이름으로 2026 CSV 이름을 덮어쓰지 않게해 줘. 코드는 연결되지만 명칭 버전 차이가 있다는 사실과 공식 설명 충돌을 기록하게해 줘. 이전· 현재 관찰 차이를 신규 개업· 폐업이나 좌표 차이를 이전으로 단정하지 않게해 줘. 매출· 수익· 유동 인구· 인구 분모는 제공되지 않았다.\nXLSX에는 원본 또는 변경 없는 원본 연결, 정리· 코드조인, 품질, 구 군 × 업종, 행정동 × 관심 업종, 두 분기 비교, 차트, 출처를 남기게해 줘. PPT 제목· 본문· 표는 각각 수정할 수 있게하고 차트나 지도가 이미 지면 그 사실을 표시하게해 줘. 같은 코드의 분류 이름이 다르면 원문 두 값을 모두 남기게해 줘.\n사람이 셀 주소· 수식· 코드를 직접 입력하는 절차 대신 파일 작업 AI가 처리할 지시로 써 줘. 실제 읽은 파일· 전체 범위· 사용한 처리 도구· 생성한 다운로드를 구분하고 실행하지 못한 것은 미수행으로 표시하게해 줘. 아직 원본 파일을 받지 않은 이 단계에서 전체 집계를 실행했다거나 완성 XLSX/PPTX를 만들었다고 말하지 마.\n\n최종 답변은 위 두 부분을 모두 복사해 다른 AI로 옮길 수 있게 작성해 줘. 질문에 답을 맞추는 활동이나 자기 평가 양식은 만들지 마.'


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def teacher_text(text):
    """Restore technical compounds in authored prose; never apply to official text."""
    changes={
        '울산 광역시':'울산광역시','구 군':'구군','검 산':'검산','위 도':'위도','경 도':'경도',
        '식별 번호':'식별번호','코드 표':'코드표','메타 데이터':'메타데이터','스냅 샷':'스냅샷',
        '원본해 시':'원본 해시','해 시':'해시','이미 지면':'이미지면','전 후':'전후',
        '기준 일':'기준일','주의 사항':'주의사항','추출 문':'추출문','참조 이름':'참조 이름',
        '미 매칭':'미매칭','상가 업소 번호':'상가업소번호','상가 업소':'상가업소',
        '다른 AI 에게줄실행프롬프트':'다른 AI에게 줄 실행 프롬프트',
        '읽게할':'읽게 할','검토하게하고':'검토하게 하고','가능하게하며':'가능하게 하며',
        '만들게해':'만들게 해','검산하게해':'검산하게 해','읽게해':'읽게 해','확인하게해':'확인하게 해',
        '않게해':'않게 해','기록하게해':'기록하게 해','표시하게해':'표시하게 해','있게하고':'있게 하고',
        '247 코드표결합과명칭버전보존':'247 코드표 결합과 명칭 버전 보존',
        '1 만행':'1만 행','csv247 행':'csv 247행','두분기비교':'두 분기 비교',
        '자기 평가':'자기평가','제공 기관':'제공기관','몇 행 도':'몇 행도',
    }
    original=text
    for old,new in changes.items():text=text.replace(old,new)
    text=re.sub(r'· +','·',text)
    text=re.sub(r'(\d) +(행|열|장)(?=[\s·.,이며은과을가의])',r'\1\2',text)
    assert ''.join(original.split())==''.join(text.split())
    return text


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_input(name):
    """Reject changed source bytes whether using acquisition or committed copy."""
    committed_name, expected = SOURCE_INPUTS[name]
    candidates = [path for path in (ART/name, OUT/committed_name) if path.is_file()]
    if not candidates:
        raise FileNotFoundError(f'Required source: {ART/name} or committed {OUT/committed_name}')
    for path in candidates:
        if sha(path) != expected:
            raise ValueError(f'Source SHA-256 mismatch; do not normalize original bytes: {path}')
    return candidates[0]


def preserve_copy(source, target):
    """Fallback can be the target itself: never truncate or normalize it."""
    if source.resolve() != target.resolve():
        shutil.copyfile(source, target)
    assert sha(source) == sha(target)


def put(path, text):
    path.write_text(text, encoding='utf-8', newline='\n')


def strip_markup(value):
    return html.unescape(re.sub('<[^>]+>', '\n', value or '')).strip()


def source_checks(course, research, codes):
    """Stream raw files, keeping classification-version observations descriptive."""
    code_map={r['소분류코드']:r for r in codes}
    assert len(code_map)==len(codes)==247
    results={}; idsets={}; matched_values={}
    for period in ['202606','202609']:
        path=DATA/f'ulsan-{period}.csv'; provenance=next(x for x in course['provenance'] if x['period']==period)
        assert sha(path)==provenance['sha256'], f'raw hash {period}'
        counts=collections.Counter(); labels=collections.Counter(); example={}; ids=set(); value_map={}
        coord_lons=[]; coord_lats=[]
        with path.open(encoding='utf-8-sig', newline='') as f:
            reader=csv.DictReader(f); assert reader.fieldnames==CSV_NAMES==course['fields']
            for row in reader:
                counts['rows']+=1; ident=row['상가업소번호']
                if not ident:counts['missingIdRows']+=1
                if ident in ids:counts['duplicateIdRows']+=1
                ids.add(ident)
                code=row['상권업종소분류코드']; ref=code_map.get(code)
                if not ref:counts['unknownCodeRows']+=1
                else:
                    differs=False
                    for source_name,code_name in [('상권업종대분류명','대분류명'),('상권업종중분류명','중분류명'),('상권업종소분류명','소분류명')]:
                        if row[source_name]!=ref[code_name]:
                            labels[source_name]+=1;differs=True
                            example.setdefault(source_name,dict(code=code,csvName=row[source_name],codebookName=ref[code_name]))
                    if differs:counts['anyLabelDifferenceRows']+=1
                value_map[ident]=(row['도로명주소'],row['경도'],row['위도'])
                try:coord_lons.append(float(row['경도']));coord_lats.append(float(row['위도']))
                except ValueError:counts['unparsedCoordinateRows']+=1
        assert counts['rows']==course['snapshots'][period]['rows']
        assert counts['unknownCodeRows']==0
        assert counts['anyLabelDifferenceRows']==counts['rows']
        results[period]=dict(rows=counts['rows'],columns=39,uniqueIds=len(ids),
                            missingIdRows=counts['missingIdRows'],duplicateIdRows=counts['duplicateIdRows'],
                            unmatchedCodeRows=counts['unknownCodeRows'],anyLabelDifferenceRows=counts['anyLabelDifferenceRows'],
                            labelDifferenceByField=dict(labels),labelExamples=example,
                            coordinateRanges=dict(longitude=[min(coord_lons),max(coord_lons)],latitude=[min(coord_lats),max(coord_lats)]))
        idsets[period]=ids;matched_values[period]=value_map
    matched=idsets['202606']&idsets['202609']; changed=0; same_address_changed=0
    for ident in matched:
        old=matched_values['202606'][ident];new=matched_values['202609'][ident]
        if old[1:]!=new[1:]:
            changed+=1
            if old[0]==new[0]:same_address_changed+=1
    assert changed==same_address_changed==1223
    return dict(snapshots=results,totalSnapshotRows=sum(x['rows'] for x in results.values()),
                matchedCoordinateChanged=changed,coordinateChangedWithSameRoadAddress=same_address_changed,
                note='原본 전체를 파일로 읽은 출처·품질 관찰. 개업·폐업·이전·매출의 사실 판정이 아니다.'.replace('原본','원본'))


def make_documents(course,research,codes,checks,guide_body):
    sources={s['id']:s for s in research['sources']}
    api_fields={x['apiName']:x for x in sources['sbiz-field-dictionary']['fields']}
    assert set(API_NAMES)==set(api_fields)
    mapping=[]
    for api,csv_name in zip(API_NAMES,CSV_NAMES):
        item=dict(csvName=csv_name,apiName=api,officialDescription=api_fields[api]['description'],apiType=api_fields[api]['type'])
        if api=='lon':item['instructorNote']='공식 Swagger 원문은 위도라고 되어 있어 lat 설명과 충돌한다. 원문을 수정하지 않는다. 실제 CSV 경도 열· 가이드의 경도 문맥· 값 범위를 함께 대조한다.'
        elif api=='lat':item['instructorNote']='공식 Swagger 원문은 위도. 실제 CSV 위도 열과 값 범위를 대조한다. lon 설명과의 충돌은 별도 기록한다.'
        elif '코드' in csv_name or api in ['bizesId','bldMngNo','oldZipcd','newZipcd']:
            item['instructorNote']='식별·분류용 텍스트로 보존한다. 덧셈 대상이 아니며 숫자형 자동변환·앞자리 손실을 피한다.'
        elif api in ['adongNm','ldongNm']:
            item['instructorNote']='행정동과 법정동은 다른 구분이다. 단순 명칭 동일성을 키 일치로 보지 않는다.'
        else:item['instructorNote']='원문 열을 보존하고 분석 목적에 필요한 경우에만 파생 열을 만든다.'
        mapping.append(item)

    docs=[]
    def doc(id,title,kind,authority,version,sourceids,sections):
        sections=[(t,teacher_text(b) if id in ('P05','P06') or t.startswith('[강사') else b) for t,b in sections]
        docs.append(dict(id=id,title=title,kind=kind,authority=authority,version=version,sourceIds=sourceids,
                         path=BASE+id+'.txt',htmlPath=BASE+id+'.html',
                         sections=[dict(id=f's{i}',title=t,text=b) for i,(t,b) in enumerate(sections,1)]))

    period_sections=[]
    for period in ['202606','202609']:
        raw=load(source_input('download-info-202606.json' if period=='202606' else 'download-info.json'))
        meta=raw['dataSetFileDetailInfo'];p=next(x for x in course['provenance'] if x['period']==period)
        text=(f"공식 파일명: {meta['dataNm']}\n공식 기준일 표기: {meta['stdrDe']}\n"
              f"제공기관: {meta['insttNm']}\n포털 등록일: {meta['registDt']}\n포털 수정일: {meta['updtDt']}\n"
              f"파일 다운로드: {p['downloadUrl']}\n전국 ZIP 내부 원본 멤버: {p['originalMember']}\n"
              f"수업용 배포 파일: ulsan-{period}.csv\n원본 멤버 바이트: {p['bytes']:,}\n원본 멤버 SHA-256: {p['sha256']}\n"
              "공식 포털 설명(HTML 태그만 제거):\n"+strip_markup(meta['publicDataDc'])+'\n'
              '포털 기타 유의사항 원문:\n'+strip_markup(meta['etcAtentMatter']))
        period_sections.append((period+' 공식 포털 메타데이터 발췌',text))
        period_sections.append((period+' 전국 ZIP 동봉 README 원문',
                                (DATA/f'original-readme-{period}.txt').read_text(encoding='utf-8')))
    doc('P01','공식 파일 설명·두 분기 기준일·원본 README','official-extract','공식 원문 발췌와 동봉 원문',
        '2026-06-30 / 2026-09-30',['sbiz-file-202606','sbiz-file-202609'],[
            ('문서의 역할과 이용 조건','두 전국 ZIP에서 울산 CSV 원본 멤버만 바이트 동일하게 추출했다. 표본화· 행 복제· 합성 오류 삽입· 원본 셀 변경을 하지 않았다. 아래 포털 설명은 해당 두 파일의 공식 메타 데이터에서 필요한 항목을 발췌했고 README는 전문을 보존했다. '+LICENSE),
            *period_sections,
            ('[강사 주석] README와 현재 분류의 차이','위 README 끝에는 관광/ 여가/ 오락 등 과거 대분류 8개가 적혀 있다. 현재 공식 포털은 대 10· 중 75· 소 247을 안내하며 실제 두 CSV는 10개 대분류를 사용한다. README의 인코딩 안내와 분류 안내를 구분한다. 과거 8개를 현재 CSV의 유효 범주 검사로 쓰거나 나머지 범주를 오류로 삭제하지 않는다. 원문은 고치지 않고 출처의 시점 차이로 표시한다. 두 파일의 실제 기준 일은 위 메타 데이터와 파일 명으로 고정한다.'),
            ('[강사 주석] 포털 화면의 AI 요약과 행 수 표시','포털의 Quick AI Summary가 마케팅· 고객 유동 등에 관해 쓴 문장은 제공 기관의 통계 정의나 실제 데이터 열의 근거로 채택하지 않는다. 이 묶음은 제공 기관 설명· 원본 가이드· 실제 파일을 구분해 사용한다. 포털 카탈로그의 “전체 행 1” 표시는 전국 ZIP/ 카탈로그의 컨테이너 단위일 수 있어 울산 CSV의 실제 행 수로 읽지 않는다. 실제 CSV를 파일로 읽고 원본해 시와 대조해 확인한 전체 레코드는 6월 54,737·9월 53,777이다. 목차 쪽 수· 검색 결과 일부· 화면 미리 보기 몇 행 도 전체 데이터 처리 범위의 증거가 아니다.')])

    guide_source=sources['sbiz-api-guide']
    doc('P02','공식 OpenAPI 활용가이드 전체 문단 추출','official-extract','공식 HWP 전체 문단 추출 / 원본 ZIP 우선',
        '표지 2026.7 / 파일명 260805',['sbiz-api-guide'],[
            ('출처·버전·추출 한계',f"제공기관: 소상공인시장진흥공단\n공식 안내: {guide_source['officialPage']}\n원본 다운로드: {guide_source['downloadUrl']}\n원본 ZIP SHA-256: {guide_source['sha256']}\n원본 ZIP 바이트: {guide_source['downloadBytes']:,}\n확보일: {FETCHED}\n표지 날짜와 파일명 날짜 토큰은 서로 다른 표기이므로 모두 보존한다.\n{LICENSE}\n아래는 HWP BodyText 문단 텍스트 전체를 추출한 것이다. 문단 내용은 임의 요약하거나 교재 사례로 증량하지 않았다. HWP 확장 제어 블록은 제외되어 표의 셀 대응·하이퍼링크·그림·쪽 배치가 손실될 수 있다. URL 문자열이 남아 있어도 원래 링크 기능을 보존한다는 뜻은 아니다. 표 항목이 이어 붙어 보이면 공식 원본 HWP로 확인한다. 목차의 쪽번호는 원문 표기이며 실제 렌더 페이지 수를 측정한 값이 아니므로 이 자료집의 쪽 수로 광고하지 않는다. API 키 발급·호출 예는 공식 문맥을 보존한 참고이고 이 수업은 다운로드한 CSV를 사용하므로 API 키를 새로 만들거나 코드를 입력할 필요가 없다."),
            ('공식 가이드 추출 전문 - 원문 순서 유지',guide_body)])

    dictionary='\n\n'.join(f"{i:02}. 실제 CSV 열: {m['csvName']}\n대응 API 항목: {m['apiName']}\n공식 Swagger 설명(원문): {m['officialDescription']}\n공식 API 타입: {m['apiType']}\n[강사 적용 주석] {m['instructorNote']}" for i,m in enumerate(mapping,1))
    ul=sources['sbiz-ulsan-code-appendix']['verifiedUlsanCodes']
    doc('P03','공식 API 39개 상가 항목과 실제 CSV 39열의 대응','official-dictionary-plus-mapping',
        '공식 Swagger 설명 그대로 / CSV 열 대응과 적용 주석은 강사 작성','Swagger 1.0.0 / 확보 2026-11-06',
        ['sbiz-field-dictionary','sbiz-api-guide'],[
            ('대응표의 출처와 한계','공식 API 페이지에 포함된 Swagger의 storeOne 응답 항목을 사용했다. 응답 속성 44개에서 columns·description·resultCode·resultMsg·stdrYm이라는 응답 메타 정보 5개를 제외하면 상가 항목이 39개다. 이 수는 실제 울산 두 CSV의 39개 헤더와 독립적으로 대조했다. 아래 대응 표는 API 순서를 CSV 순서라고 가정해 자동 연결한 것이 아니라 영문 항목과 한글 CSV 열을 명시적으로 대응한 강사 작성 표다. API 타입은 원문 string으로 보존하며 좌표를 숫자로 해석하는 분석 처리는 원 문 타입 정의의 변경이 아니다. '+LICENSE),
            ('39개 항목 대응표',dictionary),
            ('울산 구·군 코드 - 공식 가이드 부록에서 확인',
             '출처 위치: 공식 가이드의 참조·행정구역 조회→시군구. 아래 코드를 새로 발명한 것이 아니다.\n'+'\n'.join(f"시도 {r['sidoCode']} {r['sidoName']} | 시군구 {r['sigunguCode']} {r['sigunguName']}" for r in ul)+'\n[강사 적용 주석] 시 군 구 코드를 텍스트로 사용해 이름과 함께 집계한다. 행정동과 법정동을 같은 단위로 결합하지 않는다. 코드 북· 주소의 관측 시점 차이는 원본과 함께 남긴다.'),
            ('[강사 주석] 공식 좌표 설명 충돌',
             '공식 Swagger는 lon과 lat 두 항목 설명에 모두 “WGS84 기준 위도 좌표 값”이라고 쓴다. 원문을 경도로 고쳐 인용하지 않는다. 실제 CSV 헤더는 경도· 위도로 분리돼 있고 울산 자료의 경도는 약 129, 위도는 약 35이다. 가이드의 경도/ 위도 요청· 응답 문맥과 실제 헤더· 값 범위를 함께 대조해 경도 열은 가로 축, 위도 열은 세로 축으로 사용한다. 이 판단은 공식 설명의 불일치에 대한 강사 적용 해설이지 두 설명이 원래부터 일치했다는 주장이 아니다. 좌표가 그럴 듯한 범위라고 개별 위치 정확성을 현장 검증한 것은 아니다.')])

    code_buffer=io.StringIO(newline='')
    writer=csv.DictWriter(code_buffer,fieldnames=list(codes[0]),lineterminator='\n')
    writer.writeheader();writer.writerows(codes)
    code_text=code_buffer.getvalue()
    assert list(csv.DictReader(io.StringIO(code_text)))==codes
    csrc=sources['sbiz-industry-2023']
    doc('P04','공식 2023 상권업종 코드표 247행과 명칭 버전','official-codebook','공식 CSV 전체 코드·명칭 보존 / 적용 주석은 강사 작성',
        '기준 2023-02-28 / 포털 수정 2025-08-26',['sbiz-industry-2023'],[
            ('출처·인코딩·조인 범위',f"공식 안내: {csrc['officialPage']}\n공식 다운로드: {csrc['downloadUrl']}\n원본 CSV SHA-256: {csrc['sha256']}\n원본 바이트: {csrc['downloadBytes']:,}\n원본 인코딩: CP949\n행 수: 247 / 대분류10·중분류75·소분류247\n{LICENSE}\n아래 표는 원본 CSV를 CP949로 해독해 UTF-8 텍스트에 옮겼다. 코드·이름은 고치지 않았다. 원본 CP949 CSV도 별도 제공하며 두 상가 CSV의 UTF-8과 혼동하지 않는다."),
            ('코드표 전체 - 원본 열·행 순서 유지',code_text),
            ('공식 포털의 개편 주의사항과 적용 범위','공식 코드표 안내는 과거 837개에서 247개로 분류 체계를 개편했고 표준 산업 분류도 9차에서 10차로 바뀌었으며 상가 업소 번호가 재생성돼 과거 자료와 연결할 수 없다고 설명한다. 이 경고는 아무 시기의 식별 번호나 같은 체계라고 가정해 연결하지 말라는 뜻이다. 2026년 두 분기를 비교하는 현재 과제에서도 식별 번호의 실제 결 측· 유일성· 범위를 확인한다. 상권업종 코드와 표준 산업 분류 코드를 동일한 코드로 결합하지 않는다. 공식 안내의 업종 정제에 따라 표준 산업 분류가 연계 표와 상이할 수 있다는 경고도 유지한다.'),
            ('[강사 주석] 코드 일치와 명칭 버전 차이를 분리',
             '두 2026 CSV의 상권업종 소분류 코드를 이 247 행 표의 소분류 코드와 연결하면 미매칭은 없다. 그러나 대· 중· 소분류 이름 가운데 하나 이상이 다른 레코드는 두 분기 모두 전체 레코드다. 이는 2023 코드표와 2026CSV의 이름 버전 차이를 관찰한 사실이며 전체 원본이 불량이라는 뜻이 아니다. 2026 원문 이름과 2023 코드 표 이름을 별도 열로 보존하고 코드로 집계한다. 코드 표를 붙인 뒤 원 본 행 수가 늘지 않는지 검사한다. 시점 비교 차트의 표시 이름은 어느 버전을 썼는지 밝혀 두 분기에서 일관되게 사용하며 원문 열은 덮어쓰지 않는다.')])

    doc('P05','실제 자료의 충돌·품질·분기 비교를 다루는 방법','instructor-method',
        '강사 작성 분석 방법 / 공식 정책·데이터 정의가 아님','2026-11-06',
        ['sbiz-api-guide','sbiz-field-dictionary','sbiz-industry-2023','sbiz-file-202606','sbiz-file-202609'],[
            ('공식 사실과 강사 분석 지시의 구분','이 문서의 절차는 수업용 분석 방법이다. 공식 원문은 P01~P04에 보존했고 원문과 충돌하는 설명을 조용히 수정하지 않는다. 실제 CSV의 열· 값· 기준 일과 공식 설명을 함께 읽는다. RAG는 정의와 주의 사항을 찾아 실행 요청에 포함하는 역할이고 전체 108,514 레코드의 집계는 실제 파일을 읽는 계산 도구의 역할이다. 문서가 길거나 인용이 붙었다는 사실은 전체 데이터 계산의 완료 증거가 아니다.'),
            ('인코딩·식별자·지역·분류의 처리','두 상가 CSV는 UTF-8로 읽고 코드 표는 CP949로 읽는다. CSV를 더블 클릭했을 때 한글이 깨졌다고 원본 파일이 손상됐다고 단정하지 않는다. 분석 AI가 각각 인코딩을 지정하고 실제 39개/6개 열과 한글을 확인한다. 상가 업소 번호· 지역 코드· 업종 코드· 우편 번호· 건물 관리 번호는 텍스트로 보존한다. 같은 상호나 주소만으로 행을 중복 제거하지 않는다. 식별 번호 중복이 있다면 동일· 상이 열과 출처를 확인한 뒤 처리 근거를 남긴다. 가상 참가자 실습의 첫 행 채택· 누락 수· 참여 Y/N 조건을 실제 상가에 적용하지 않는다. 행정동과 법정동은 별개이며 동명만으로 결합하지 않는다.'),
            ('코드와 이름을 조인하는 순서','코드표 소분류 코드가 유일한지 확인 →두 분기의 소분류 코드를 텍스트로 대조 →미 매칭을 별도 표시 →2023 참조 이름을 새 열로 추가 →조인 전후 행 수 검 산 순서다. 2026CSV의 원문 이름은 보존한다. 모든 행에 이름 차이가 있어도 삭제하거나 기준 숫자에 맞춰 이름을 덮어쓰지 않는다. 대· 중· 소분류 코드를 함께 보관해 상하위 관계를 검토한다. 표준 산업 분류와 상권업종을 임의로 같은 키로 쓰지 않는다. 분석 결과에서는 선택한 표시 명칭의 버전을 밝힌다.'),
            ('분포 지표와 분모','구 군 업소 수와 구 군의 울산 전체 비중, 구 군 내부 업종 구성비, 선택 업종의 동별 수와 해당 동 전체 업소 대비 비중은 서로 다른 지표다. 이름이 모두 비중이라도 분모를 구체적으로 적는다. 업소 기록은 사람 수가 아니며 두 분기 레코드 합은 고유 업소 수가 아니다. 구 군별 합 =해당 분기 전체, 구 군 × 업종 합 =해당 분기 전체, 선택 업종 동별 합 =해당 분기 선택 업종 전체를 같은 필터· 미확인 처리로 대조한다. 상호 명에 특정 단어가 있다는 이유로 업종을 정의하지 않고 코드표의 소분류를 확인한다.'),
            ('신규 관찰·미관찰과 개업·폐업의 차이','두 분기의 상가 업소 번호를 연결한 뒤 양쪽 관찰· 현재에만 관찰· 이전에만 관찰을 구분한다. 이 상태는 공개 스냅 샷의 관찰 여부이며 신규 개업· 폐업이라는 행정 사건을 직접 증명하지 않는다. 수집· 정비· 포함 범위· 분류 변경의 영향을 배제할 자료가 없으므로 개업률· 폐업률· 생존율을 단정하지 않는다. 현재에만 관찰된 레코드 수는 9월 전체 −양쪽 관찰, 이전에만 관찰된 수는 6월 전체 −양쪽 관찰로 검산한다. 지역· 업종별 증감은 원인 분석이 아니라 관찰 수의 차이로 표현한다.'),
            ('좌표 차이와 주소 불변을 함께 읽기','양쪽에서 관찰되는 식별 번호 중 1,223개는 경도· 위도문자열이 달라졌지만 도로명 주소 문자열은 같다. 이를 1,223건의 업소 이전이라고 부르지 않는다. 위치 정비 등 다른 이유가 있을 수 있고 실제 이유는 확인하지 못했다. 좌표를 숫자로 비교할 때 문자 표현 차이와 수치 차이도 구분한다. 지도는 제공 좌표의 분포를 보여 주는 보조 표현이며 현장 위치· 영업 상태의 검증이 아니다. 좌표가 없는 행이 발견되면 지도 표현과 일반 지역 집계의 처리 영향을 분리한다.'),
            ('공식 문서 내부의 다른 시점과 설명','전국 ZIP README의 8개 과거 대분류와 현재 포털/CSV의 10개 분류, 가이드의 분기 갱신 안내와 API 카탈로그의 실시간 안내, Swagger에서 lon/lat 설명이 모두 위 도인 문제를 각각 출처별로 기록한다. 한 문서를 새로운 통일 규칙으로 고쳐 전체에 적용하지 않는다. 현재 분석은 6월 말·9월 말 파일 스냅 샷이며 실시간 조회 완료라고 쓰지 않는다. 공식 출처라는 이유만으로 서로 다른 자료의 설명이 모두 일치한다고 가정하지 않는다.'),
            ('데이터가 없는 지표와 해석','제공된 파일에는 매출· 이익· 방문객· 유동 인구· 공실· 폐업 사건· 영업 시간· 주민 등록 인구 분모가 없다. 인구 1 천 명당 업소 수, 수익성, 창업 성공 가능성, 좋은 입지를 계산했다고 쓰지 않는다. 업소가 많거나 특정 업종 비중이 높다는 관찰은 보고할 수 있지만 수요· 경쟁 강도· 수익의 확정 판정과 다르다. 인구 자료를 별도로 얻는 후속 분석은 같은 지역 단위· 기준 시점· 코드· 대상 범위를 확인해야하며 현재 제공 과제의 필수 입력이 아니다.'),
            ('파일 생성·검토의 완료 범위','XLSX와 PPTX 실제 파일 다운로드를 받고 열어 본다. 설명· 목차· 코드만 받은 상태는 파일 생성 완료가 아니다. 제목 한 글자와 표 내용 하나를 고쳐 개별 편집 요소인지 확인한다. 차트/ 지도 이미지와 원본 데이터 차트의 편집 범위를 구분한다. 엑셀과 PPT 의회차· 단위· 분모· 숫자· 출처가 일치하는지 파일 작업 AI와 실제 편집 화면에서 확인한다. 지원하지 못한 계산· 생성· 표시 검증은 미수행으로 남긴다.')])

    doc('P06','울산 두 분기 실제 상가자료로 만드는 지역·업종 보고','instructor-assignment',
        '강사 작성 수업 과제·실행 요청 / 공식 기관의 보고 지침 아님','2026-11-06',
        ['sbiz-file-202606','sbiz-file-202609','sbiz-industry-2023','sbiz-api-guide'],[
            ('업무와 실제 입력','업무는“울산의 어느 구 군과 행정동에 어떤 업종이 분포하며 두 분기에 관찰 구성이 어떻게 달라졌는가”를 설명하는 지역 브리핑이다. 원본은 ulsan-202606.csv 전체 54,737 행과 ulsan-202609.csv 전체 53,777 행이며 두 파일 모두 39 열이다. 총 108,514 레코드를 사용하고 표본 1 만행으로 대체하지 않는다. 이 합은 고유 업소 108,514개가 아니다. industry-codes-2023.csv247 행과 ulsan-report-template.pptx 양식을 첨부한다. 원본은 바꾸지 않고 새 XLSX/PPTX를 받는다. 실제 파일 도구가 처리한 행수와 남은 범위를 기록한다.'),
            ('초보자가 따라갈 네 단계','1. 이 자료집의 all-references.txt 한 개를 자료 기반 AI의 소스로 등록한다. ZIP나 HWP를 반드시 직접 읽게할 필요는 없지만 표· 항목이 모호하면 공식 원본 HWP를 확인한다.\n2. 아래 요청으로 적용할 자료 뜻· 주의 사항과 다른 AI 에게줄실행프롬프트를 받는다. 답변의 두 부분을 함께 복사한다.\n3. 파일 작업 AI에 실제 두 CSV· 코드표·PPTX 양식과 복사한 답변을 첨부해 작업시킨다. 자료 기반 AI의 대화/ 파일이 자동으로 넘어가는 것은 아니다.\n4. 실제 XLSX/PPTX 다운로드를 받아 편집기로 연다. 도구가 집계 합· 조인· 출처를 검토하게하고 제목· 표의 수정 가능성과 글자 잘림을 확인한다. 수식·A1 주소· 코드 입력· 자기 평가 표· 답 맞추기 활동은 필수 과정이 아니다.'),
            ('파일 작업 AI가 할 분석','분기별 전체 행· 열· 식별자 유일성· 코드 값· 좌표/ 주소 품질 확인 →247 코드표결합과명칭버전보존 →구군 × 대/ 중분류 집계· 비중 →코드로 정한 관심 소분류의 행정동 분포 →식별 번호 양쪽 관찰/ 현재만/ 이전만 구분 →속성 차이와 좌표/ 주소 관계 확인 →XLSX 차트· 편집 PPT 제작 순서다. 관심 소분류는 예를 들어 카페를 코드 표에서 찾아 정의하고 상호 키워드 검색으로 대체하지 않는다. 구 군별 합· 업종별 합· 관심 업종 동별 합· 조인 전 후 행수와 실제 읽은 전체 범위를 도구가 검 산한다. 학생이 수식을 직접 작성하도록 돌려 보내지 않는다.'),
            ('XLSX와 편집 가능한5장 PPTX','XLSX는 원본 보존 또는 변경 없는 원본 연결, 정리/ 코드조인, 품질, 구 군 × 업종, 행정동 × 관심 업종, 두분기비교, 차트, 출처를 담는다. 원본 39 열을 보존하고 파생 열은 다른 이름으로 붙인다.\nPPT1 장: 공식 출처· 두 기준 일· 전체 처리 규모· 분석 질문\n2장: 구군 업소 수와 업종 구성(수와 비율의 분모 구분)\n3 장: 구 군 × 중분류 및 관심 업종의 행정동 분포\n4장: 두 분기 관찰 여부· 속성 차이(개업/ 폐업/ 이전으로 단정하지 않음)\n5장: 출처 차이· 명칭 버전· 좌표 해석· 자료 없는 지표 등 한계와 후속 작업\n실제 PPTX 양식을 읽고 장별 역할에 맞춰 채운다. 제목· 본문· 표는 개별 수정 가능하게하며 이미지 차트/ 지도이면 명시한다. 없는 매출· 인구· 효과를 채워 넣지 않는다.'),
            ('자료 기반 AI에 보낼 통합 요청',TASK_PROMPT)])
    return docs,mapping


STYLE='''body{font-family:"Malgun Gothic",sans-serif;color:#20372b;background:#f5f7f1;line-height:1.9;margin:0}main{max-width:1060px;margin:auto;padding:32px 24px}article{background:white;border:1px solid #c4d1bc;padding:25px;margin:28px 0}h1{font-size:1.8rem;line-height:1.5}h2{font-size:1.35rem}h3{font-size:1.12rem}p,pre{white-space:pre-wrap;overflow-wrap:anywhere}pre{font-family:inherit;font-size:14px;line-height:1.9}a{color:#215d35}.notice{background:#fff4d9;border-left:5px solid #8c6726;padding:18px}.meta{color:#476044;font-size:14px}nav a{display:inline-block;padding:5px 10px}input{padding:12px;width:95%;font:inherit}section:target{outline:3px solid #74934e;outline-offset:8px}small{display:block}summary{cursor:pointer}@media(max-width:640px){main{padding:20px 14px}article{padding:19px 16px}pre{font-size:13px}}@media print{body{background:white}nav,input{display:none}article{border:0}a{color:inherit}}'''


def page(title,body,script=''):
    return '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape(title)+'</title><style>'+STYLE+'</style><main>'+body+'</main>'+script+'</html>'


def plaintext(d):
    return f"{d['id']} | {d['title']}\n성격: {d['authority']}\n버전: {d['version']}\n출처ID: {', '.join(d['sourceIds'])}\n\n"+'\n\n'.join(f"{s['id']} {s['title']}\n{s['text']}" for s in d['sections'])+'\n'


def article(d,full=False):
    e=html.escape
    return f'<article id="{d["id"]}"><h2>{d["id"]} · {e(d["title"])}</h2><p class="meta">{e(d["authority"])}<br>버전: {e(d["version"])} / 출처ID: {e(", ".join(d["sourceIds"]))}</p>'+''.join(f'<section id="{d["id"]+"-"+s["id"] if full else s["id"]}"><h3>{e(s["id"]+" · "+s["title"])}</h3><pre>{e(s["text"])}</pre></section>' for s in d['sections'])+'</article>'


class Links(HTMLParser):
    def __init__(self):super().__init__();self.ids=set();self.links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.add(a['id'])
        if 'href' in a:self.links.append(a['href'])


def verify_links():
    parsed={};checked=0
    for path in OUT.glob('*.html'):
        p=Links();p.feed(path.read_text(encoding='utf-8'));parsed[path.resolve()]=p
    for path,p in parsed.items():
        for href in p.links:
            u=urlsplit(href)
            if u.scheme or u.netloc:continue
            target=(path.parent/unquote(u.path)).resolve() if u.path else path;checked+=1
            assert target.exists(),(path,href)
            if u.fragment and target in parsed:assert unquote(u.fragment) in parsed[target].ids,(path,href)
    return checked


def main():
    global TASK_PROMPT
    TASK_PROMPT=teacher_text(TASK_PROMPT)
    research=load(source_input('learning-research.json'));course=load(ROOT/'content/public-data-course.json')
    sources={s['id']:s for s in research['sources']}
    gsrc=sources['sbiz-api-guide'];csrc=sources['sbiz-industry-2023']
    original=source_input('sbiz-openapi-guide-260805-original.zip')
    assert sha(original)==gsrc['sha256']
    assert sha(DATA/'industry-codes-2023.csv')==csrc['sha256']
    guide_text=source_input('sbiz-openapi-guide-260805-extracted.txt').read_text(encoding='utf-8')
    guide_body=guide_text[guide_text.index('OpenAPI 활용가이드'):]
    assert len(guide_body)==gsrc['extraction']['bodyCharacters']==100418
    with (DATA/'industry-codes-2023.csv').open(encoding='cp949',newline='') as f:codes=list(csv.DictReader(f))
    assert len(codes)==247 and len({r['대분류코드'] for r in codes})==10
    checks=source_checks(course,research,codes)
    assert checks['totalSnapshotRows']==108514
    docs,mapping=make_documents(course,research,codes,checks,guide_body)
    OUT.mkdir(parents=True,exist_ok=True)
    preserve_copy(original,OUT/'sbiz-openapi-guide-260805-original.zip')
    preserve_copy(source_input('sbiz-openapi-guide-260805-extracted.txt'),OUT/'sbiz-openapi-guide-260805-extracted.txt')
    preserve_copy(source_input('learning-research.json'),OUT/'source-inventory.json')
    assert sha(OUT/'sbiz-openapi-guide-260805-original.zip')==sha(original)
    # Copy raw official metadata for auditing selected P01 fields offline.
    for period,name in [('202606','download-info-202606.json'),('202609','download-info.json')]:
        preserve_copy(source_input(name),OUT/f'official-file-metadata-{period}.json')
    put(OUT/'official-field-dictionary.json',json.dumps(mapping,ensure_ascii=False,indent=2)+'\n')
    notice='실제 공식 자료와 강사 작성 업무 지시를 구분한 참고 묶음입니다. P02는 공식 가이드 전문 추출이고 P01·P03·P04는 공식 원문/ 코드와 표시된 강사 주석입니다. P05·P06은 공식 규정이 아닌 강사 해설· 과제입니다. 공식 원본 ZIP/HWP가 추출 문보다 우선합니다.'
    nav='<nav><a href="index.html">자료 목록</a><a href="all-references.txt" download>통합 TXT</a><a href="all-references.html">통합 HTML</a><a href="sbiz-openapi-guide-260805-original.zip" download>공식 가이드 원본 ZIP/HWP</a><a href="../data/industry-codes-2023.csv" download>공식247행 코드표 원본</a><a href="../data/ulsan-two-quarters.zip" download>두 분기 CSV ZIP</a><a href="../data/ulsan-202606.csv" download>6월 울산 CSV 전체</a><a href="../data/ulsan-202609.csv" download>9월 울산 CSV 전체</a></nav>'
    for d in docs:
        put(PUBLIC/d['path'],plaintext(d))
        put(PUBLIC/d['htmlPath'],page(d['title'],nav+f'<p class="notice">{notice}</p>'+article(d)))
    combined='실제 울산 상가자료 분석용 참고 자료\n'+notice+'\n확보일: '+FETCHED+'\n\n'+'\n\n'.join('='*60+'\n'+plaintext(d) for d in docs)
    put(OUT/'all-references.txt',combined)
    search='<label for="q">원문 검색</label><input id="q" type="search" placeholder="행정동, 소분류, lon, 식별번호 등"><p id="count" aria-live="polite">6개 문서</p>'
    script='''<script>document.getElementById('q').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let n=0;document.querySelectorAll('article').forEach(a=>{a.hidden=!a.textContent.toLowerCase().includes(q);if(!a.hidden)n++});document.getElementById('count').textContent=n+'개 문서';});</script>'''
    put(OUT/'all-references.html',page('공식 원문·분류·업무 지시 통합',nav+f'<h1>실제 자료 참고 묶음</h1><p class="notice">{notice}</p>'+search+''.join(article(d,True) for d in docs),script))
    index=nav+f'<h1>울산 실제 상가자료 · 공식 원문과 업무 지시</h1><p class="notice">{notice}</p><p>자료 기반 AI에는 통합 TXT 한 개를 등록합니다. API 키 발급·수식·코드 입력 없이 실제 파일 작업 AI로 실행을 이어갑니다. 파일 작업에는 두 울산 CSV 전체·247행 코드표·제공 PPTX 양식이 필요합니다.</p>'
    index+=''.join(f'<article><h2><a href="{d["id"]}.html">{d["id"]} · {html.escape(d["title"])}</a></h2><p>{html.escape(d["authority"])}</p><a href="{d["id"]}.txt" download>이 문서 TXT</a></article>' for d in docs)
    index+='<section><h2>출처와 변환 한계</h2><p>공식 HWP는 표· 그림· 링크· 쪽 배치가 있어 추출 문에서 구조가 손실될 수 있습니다. 원본 ZIP을 내려받아 HWP와 대조합니다. 원문 전체 100,418 자를 유지했으며 목차 쪽 번호를 실제 쪽 수로 세지 않았습니다. 현재 제공되지 않은 매출· 인구· 개 폐업 사건은 만들지 않습니다.</p></section>'
    put(OUT/'index.html',page('울산 실제 상가자료 참고 자료',index))

    source_manifest=[]
    for sid in ['sbiz-api-guide','sbiz-industry-2023','sbiz-field-dictionary']:
        s=sources[sid]
        source_manifest.append(dict(id=sid,title=s['title'],officialPage=s['officialPage'],
            downloadUrl=s.get('downloadUrl'),catalogUrl=s.get('catalog'),fetchedOn=FETCHED,
            version=s.get('coverDate') or s.get('basisName') or s.get('version'),
            catalogModified=s.get('catalogModified'),license=s.get('license'),
            originalSha256=s.get('sha256'),originalBytes=s.get('downloadBytes'),
            sourceInventoryPath=BASE+'source-inventory.json',
            sourceInventorySha256=sha(source_input('learning-research.json')),
            hashScopeNote='ZIP/CSV의 originalSha256은 HTTP 다운로드 원본 바이트 해시다. Swagger는 원본 HTML 해시를 보존하지 못해 originalSha256이 없으며 source-inventory의 확인된 항목 추출을 보존한다.',
            originalLocalPath=BASE+'sbiz-openapi-guide-260805-original.zip' if sid=='sbiz-api-guide' else 'automation/public-data/data/industry-codes-2023.csv' if sid=='sbiz-industry-2023' else None,
            transformationLimitations=s.get('extraction',{}).get('limitations') or '원문 이름·설명 보존. CSV와 API 대응 및 적용 주석은 강사 작성이며 별도 표시.'))
    for p in course['provenance']:
        source_manifest.append(dict(id='sbiz-file-'+p['period'],title=p['archiveName'],officialPage=p['officialPage'],
            downloadUrl=p['downloadUrl'],fetchedOn=FETCHED,version=p['asOf'],license=LICENSE,
            originalSha256=p['sha256'],originalBytes=p['bytes'],originalLocalPath=p['localPath'],
            originalMember=p['originalMember'],transformationLimitations=p['extraction'],
            hashScopeNote='originalSha256과 originalBytes는 전국 ZIP 전체가 아니라 바이트 동일하게 추출한 울산 CSV 원본 멤버의 값이다.',
            offlineMetadataSha256=sha(OUT/f'official-file-metadata-{p["period"]}.json'),
            offlineMetadataPath=BASE+f'official-file-metadata-{p["period"]}.json'))
    stats=dict(documentCount=len(docs),sectionCount=sum(len(d['sections']) for d in docs),
               bodyCharacters=sum(len(s['text']) for d in docs for s in d['sections']),
               officialGuideBodyCharacters=len(guide_body),combinedTextCharacters=len(combined),
               fieldMappingCount=len(mapping),codebookRows=len(codes),snapshotRows=checks['totalSnapshotRows'],
               renderedPageCount=None,pageCountNote='PDF를 새로 만들지 않았고 HWP 렌더 쪽 수는 측정하지 않았다.',
               originalGuideZipByteIdentical=True,fullGuideBodyPreserved=guide_body in combined,
               guideExtractionFileSha256=sha(source_input('sbiz-openapi-guide-260805-extracted.txt')),
               sourceInventorySha256=sha(source_input('learning-research.json')),
               actualSourceChecks=checks)
    manifest=dict(schemaVersion=1,title='실제 울산 상가자료 분석 참고 묶음',generatedOn=FETCHED,
        description=notice,sources=source_manifest,documents=docs,fieldMapping=mapping,taskPrompt=TASK_PROMPT,
        stats=stats,downloads=dict(combinedText=BASE+'all-references.txt',combinedHtml=BASE+'all-references.html',
          indexHtml=BASE+'index.html',officialGuideZip=BASE+'sbiz-openapi-guide-260805-original.zip',
          officialGuideText=BASE+'sbiz-openapi-guide-260805-extracted.txt',
          fieldDictionary=BASE+'official-field-dictionary.json',codebook='automation/public-data/data/industry-codes-2023.csv',
          twoQuarterDataZip='automation/public-data/data/ulsan-two-quarters.zip',
          sourceInventory=BASE+'source-inventory.json',
          manifest=BASE+'manifest.json'))
    stats['offlineLinksVerified']=verify_links()
    put(OUT/'manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    put(ROOT/'content/public-data-references.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    assert (OUT/'all-references.txt').read_text(encoding='utf-8').count(guide_body)==1
    assert len(docs)==6 and len(mapping)==39
    print(json.dumps({k:v for k,v in stats.items() if k!='actualSourceChecks'},ensure_ascii=False,indent=2))


if __name__=='__main__':main()
