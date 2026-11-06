"""Extract official Ulsan snapshots unchanged and compute the course's real controls."""
from pathlib import Path
import csv, io, json, hashlib, zipfile
from collections import Counter, defaultdict

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'artifacts/public-data-2026-11-06'
OUT=ROOT/'public/automation/public-data'
DATA=OUT/'data'
PERIODS={'202606':'2026-06-30','202609':'2026-09-30'}
SOURCE='https://www.data.go.kr/data/15083033/fileData.do'

def write_json(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')

def digest(b): return hashlib.sha256(b).hexdigest()

def main():
    DATA.mkdir(parents=True,exist_ok=True)
    code_bytes=(DATA/'industry-codes-2023.csv').read_bytes()
    code_rows=list(csv.DictReader(io.StringIO(code_bytes.decode('cp949'))))
    codebook={r['소분류코드']:r for r in code_rows}
    prior_path=ROOT/'content/public-data-course.json'
    prior_meta=json.loads(prior_path.read_text(encoding='utf-8')) if prior_path.exists() else {}
    prior_sources={p['period']:p for p in prior_meta.get('provenance',[])}
    metrics={}; snapshots={}; provenance=[]; headers=None
    for period,date in PERIODS.items():
        archive=CACHE/f'sbiz-national-{period}.zip'
        if archive.exists():
            with zipfile.ZipFile(archive) as z:
                member=next(i for i in z.infolist() if '울산' in i.filename and i.filename.endswith('.csv'))
                raw=z.read(member)
                (DATA/f'ulsan-{period}.csv').write_bytes(raw)
                original_readme=z.read('[필독]파일열람방법.txt')
                (DATA/f'original-readme-{period}.txt').write_bytes(original_readme)
        else:
            assert period in prior_sources, 'Acquire official archives and metadata before the first extraction'
            raw=(DATA/f'ulsan-{period}.csv').read_bytes()
            assert digest(raw)==prior_sources[period]['sha256'], 'Committed original differs from verified extraction'
        reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
        if headers is None: headers=reader.fieldnames
        assert headers==reader.fieldnames
        districts=Counter(); large=Counter(); district_large=Counter(); small=Counter(); cafe_dongs=Counter()
        ids=Counter(); missing=Counter(); unknown=Counter(); mismatches=Counter(); code_mismatches=Counter(); label_fields=Counter(); label_examples={}; coords=[]; bad_coords=0; n=0; records={}; sample_cafe=None
        for row in reader:
            n+=1
            for key,value in row.items():
                if not value.strip(): missing[key]+=1
            key=row['상가업소번호']; ids[key]+=1
            districts[row['시군구명']]+=1;large[row['상권업종대분류명']]+=1
            district_large[(row['시군구명'],row['상권업종대분류명'])]+=1
            small[(row['상권업종소분류코드'],row['상권업종소분류명'])]+=1
            if row['상권업종소분류코드']=='I21201':
                cafe_dongs[(row['시군구명'],row['행정동코드'],row['행정동명'])]+=1
                if sample_cafe is None:sample_cafe=dict(row)
            code=codebook.get(row['상권업종소분류코드'])
            if code is None:unknown[row['상권업종소분류코드']]+=1
            else:
                if any(row[a]!=code[b] for a,b in [('상권업종대분류코드','대분류코드'),('상권업종중분류코드','중분류코드')]):code_mismatches[row['상권업종소분류코드']]+=1
                differences=[a for a,b in [('상권업종대분류명','대분류명'),('상권업종중분류명','중분류명'),('상권업종소분류명','소분류명')] if row[a]!=code[b]]
                if differences:mismatches[row['상권업종소분류코드']]+=1
                for a,b in [('상권업종대분류명','대분류명'),('상권업종중분류명','중분류명'),('상권업종소분류명','소분류명')]:
                    if row[a]!=code[b]:
                        label_fields[a]+=1;label_examples.setdefault(row['상권업종소분류코드'],{'code':row['상권업종소분류코드'],'snapshotLarge':row['상권업종대분류명'],'codebookLarge':code['대분류명'],'snapshotMedium':row['상권업종중분류명'],'codebookMedium':code['중분류명'],'snapshotSmall':row['상권업종소분류명'],'codebookSmall':code['소분류명']})
            try:
                lon=float(row['경도']);lat=float(row['위도'])
                if not (-180<=lon<=180 and -90<=lat<=90):raise ValueError()
                coords.append((lon,lat))
            except (ValueError,TypeError):bad_coords+=1
            # Keep an explicit unique-ID precondition. Never silently choose one duplicate.
            records[key]={k:row[k] for k in ['상호명','상권업종소분류코드','시군구코드','시군구명','행정동코드','행정동명','도로명주소','경도','위도']}
        duplicates={k:v for k,v in ids.items() if v>1};assert not duplicates,'Resolve duplicate identifiers before temporal matching'
        assert not ids.get(''), 'Missing identifiers require explicit matching policy'
        m={'asOf':date,'rows':n,'columns':len(headers),'uniqueIds':len(ids),'duplicateIdRows':sum(v-1 for v in ids.values()),'missingIdRows':ids.get('',0),'districts':dict(districts),'largeIndustries':dict(large),'districtByLarge':[{'district':a,'industry':b,'count':v} for (a,b),v in sorted(district_large.items())],'smallIndustries':[{'code':a,'name':b,'count':v} for (a,b),v in small.most_common()],'cafeByDong':[{'district':a,'dongCode':b,'dong':c,'count':v} for (a,b,c),v in cafe_dongs.most_common()],'missingByField':{h:missing[h] for h in headers},'classificationUnknownRows':sum(unknown.values()),'classificationUnknownCodes':dict(unknown),'classificationMismatchRows':sum(mismatches.values()),'classificationMismatchCodes':dict(mismatches),'invalidCoordinates':bad_coords,'coordinateRange':{'longitude':[min(v[0] for v in coords),max(v[0] for v in coords)],'latitude':[min(v[1] for v in coords),max(v[1] for v in coords)]}}
        m['hierarchyCodeMismatchRows']=sum(code_mismatches.values())
        m['classificationLabelDifferenceRows']=m.pop('classificationMismatchRows')
        m['classificationLabelDifferenceCodes']=m.pop('classificationMismatchCodes')
        m['classificationLabelDifferenceByField']=dict(label_fields)
        m['classificationLabelExamples']=list(label_examples.values())[:12]
        m['sampleRow']=sample_cafe
        metrics[period]=m;snapshots[period]=records
        info_name='download-info.json' if period=='202609' else 'download-info-202606.json'
        info_path=CACHE/info_name
        if archive.exists() and info_path.exists():
            info=json.loads(info_path.read_text(encoding='utf-8'))
            provenance.append({'period':period,'asOf':date,'officialPage':SOURCE,'downloadUrl':f"https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId={info['atchFileId']}&fileDetailSn={info['fileDetailSn']}",'archiveName':info['dataSetFileDetailInfo']['dataNm']+'.zip','archiveBytes':archive.stat().st_size,'originalMember':member.filename,'localPath':f'automation/public-data/data/ulsan-{period}.csv','bytes':len(raw),'sha256':digest(raw),'encoding':'UTF-8','rows':n,'columns':len(headers),'extraction':'Original Ulsan CSV member, byte-identical; no sampling, row duplication, cell editing or synthetic error injection.'})
        else:
            saved=prior_sources[period]
            assert saved['sha256']==digest(raw) and saved['rows']==n and saved['columns']==len(headers)
            provenance.append(saved)
    old,new=snapshots['202606'],snapshots['202609'];both=old.keys()&new.keys();added=new.keys()-old.keys();absent=old.keys()-new.keys()
    changes={k:sum(old[i][k]!=new[i][k] for i in both) for k in ['상호명','상권업종소분류코드','시군구코드','행정동코드','도로명주소','경도','위도']}
    deltas=[{'district':d,'previous':metrics['202606']['districts'].get(d,0),'current':metrics['202609']['districts'].get(d,0),'change':metrics['202609']['districts'].get(d,0)-metrics['202606']['districts'].get(d,0)} for d in sorted(metrics['202609']['districts'])]
    temporal={'previous':'2026-06-30','current':'2026-09-30','matchedIds':len(both),'newlyObservedIds':len(added),'noLongerObservedIds':len(absent),'netRows':len(new)-len(old),'matchedFieldDifferences':changes,'districtChanges':deltas,'interpretation':'새로 관측/다음 분기 미관측이며 실제 개업/폐업 건수가 아니다. 주소/분류 정정·수집범위 변화도 포함될 수 있어 원인을 단정하지 않는다.'}
    assert len(old)==len(both)+len(absent);assert len(new)==len(both)+len(added)
    assert temporal['netRows']==len(added)-len(absent)
    result={'generatedOn':'2026-11-06','scope':'울산광역시 전체 상가업소의 2026년 6월·9월 공식 공개 스냅샷','source':SOURCE,'fields':headers,'snapshots':metrics,'temporal':temporal,'codebook':{'rows':len(code_rows),'columns':list(code_rows[0]),'encoding':'CP949','joinKey':'상권업종소분류코드 = 소분류코드','sha256':digest(code_bytes)},'provenance':provenance,'limitations':['매출·매출일자·영업상태 변경일·실제 개업일/폐업일·인구 분모가 없다.','원본 두 분기의 행·열을 변경하지 않았다. 공란은 실제 원본 값이며 임의 채움·행 삭제를 하지 않는다.','시군구/행정동/법정동과 상권업종/표준산업분류는 서로 구분한다.','CSV 업종코드표와 실제 코드 일치 여부를 검증한 뒤 집계한다.','원본 CSV는 별도 제공하며 강사 예시 XLSX는 원본 전체를 처리한 집계 결과를 담는다.']}
    write_json(ROOT/'content/public-data-course.json',result)
    write_json(OUT/'provenance.json',result)
    with zipfile.ZipFile(DATA/'ulsan-two-quarters.zip','w',zipfile.ZIP_DEFLATED) as z:
        for period in PERIODS:z.write(DATA/f'ulsan-{period}.csv',f'ulsan-{period}.csv')
    print(json.dumps({'rows':{p:m['rows'] for p,m in metrics.items()},'columns':len(headers),'temporal':temporal,'classificationJoin':{p:{'unknown':m['classificationUnknownRows'],'codeMismatch':m['hierarchyCodeMismatchRows'],'labelDifference':m['classificationLabelDifferenceRows'],'fields':m['classificationLabelDifferenceByField']} for p,m in metrics.items()}},ensure_ascii=False))

if __name__=='__main__':main()
