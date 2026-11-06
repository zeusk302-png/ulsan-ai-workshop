import React,{useState} from 'react';
import course from '../content/public-data-course.json';
import './public-data-principles.css';

const previous=course.snapshots['202606'],current=course.snapshots['202609'],temporal=course.temporal;
const number=value=>Number(value).toLocaleString('ko-KR');
const total=previous.rows+current.rows;
const sample=current.sampleRow;
const medical=current.classificationLabelExamples.find(item=>item.code==='Q10201');
const examples=[
 {id:'cafe',code:'I21201',name:'카페',original:[sample?.['상권업종대분류명']||'음식',sample?.['상권업종중분류명']||'비알코올 ',sample?.['상권업종소분류명']||'카페'],codebook:['음식점업','비알코올 음료점업','카페']},
 ...(medical?[{id:'medical',code:medical.code,name:medical.snapshotSmall,original:[medical.snapshotLarge,medical.snapshotMedium,medical.snapshotSmall],codebook:[medical.codebookLarge,medical.codebookMedium,medical.codebookSmall]}]:[])
];
function Controls({label,items,value,onChange}){return <div className="pdp-controls" role="group" aria-label={label}>{items.map(([id,text])=><button key={id} type="button" aria-pressed={value===id} onClick={()=>onChange(id)}>{text}</button>)}</div>;}
function Arrow({label}){return <div className="pdp-arrow"><span aria-hidden="true">↓</span>{label&&<small>{label}</small>}</div>;}

function Retrieval(){const [question,setQuestion]=useState('meaning');const meaning=question==='meaning';return <>
 <h3>원문에서 기준을 찾고, 전체 파일에서 숫자를 만듭니다</h3>
 <Controls label="확인할 업무 선택" value={question} onChange={setQuestion} items={ [['meaning','카페는 어떤 기준으로 묶나요?'],['count','두 시점 전체를 집계하려면?']]}/>
 <div className="pdp-question-result" aria-live="polite"><strong>{meaning?'먼저 업종의 뜻과 연결 기준을 찾습니다.':'파일 작업 AI가 두 CSV의 모든 행을 처리합니다.'}</strong><p>{meaning?'관련 설명과 코드표 구절을 찾아 실행 요청에 넣습니다. 이 답변만으로 전체 업소 수를 계산한 것은 아닙니다.':`6월 ${number(previous.rows)}행과 9월 ${number(current.rows)}행, 합계 ${number(total)}행을 읽어 집계해야 합니다. 소스 등록 완료나 앞부분 미리보기만으로 전체 처리를 확인할 수 없습니다.`}</p></div>
 <div className="pdp-lanes">
  <section className={`pdp-lane ${meaning?'pdp-active':''}`}><h4>① 기준을 읽는 AI</h4><div className="pdp-document-stack"><span>공식 활용가이드</span><span>항목 설명</span><span>공식 업종코드표</span></div><Arrow label="질문과 관련된 부분 찾기"/><div className="pdp-excerpt"><small>확인할 원문 내용의 예</small><p>상권업종 소분류 코드로 연결<br/><b>I21201 · 카페</b></p></div><Arrow label="기준과 원문 위치를 함께 전달"/><div className="pdp-endpoint">업무 기준 + 파일 작업 요청</div></section>
  <section className={`pdp-lane ${!meaning?'pdp-active':''}`}><h4>② 파일을 만드는 AI</h4><div className="pdp-input-counts"><span>6월 CSV <b>{number(previous.rows)}행</b></span><span>9월 CSV <b>{number(current.rows)}행</b></span></div><Arrow label="두 시점 전체를 읽어 분류·연결·집계"/><div className="pdp-exhaustive"><strong>{number(total)}행 전체</strong><span>원본의 지역·업종·업소번호·좌표</span></div><Arrow label="원본 수와 집계 범위를 함께 확인"/><div className="pdp-endpoint">집계·비교 XLSX + 5장 PPTX</div></section>
 </div><p className="pdp-note">앞 단계의 답변과 실제 데이터 파일을 함께 전달해야 뒤 단계가 같은 기준으로 작업합니다. 이 도식은 실행 원리를 설명하며 외부 AI를 자동 실행하지 않습니다.</p>
 </>;}

function Classification(){const [exampleId,setExampleId]=useState('cafe');const item=examples.find(x=>x.id===exampleId)||examples[0];return <>
 <h3>같은 업종코드로 연결하고, 두 자료의 이름을 보존합니다</h3>
 <Controls label="실제 업종 사례 선택" value={exampleId} onChange={setExampleId} items={examples.map(x=>[x.id,x.name])}/>
 <div className="pdp-join" aria-live="polite">
  <section><h4>2026년 9월 원본</h4><span className="pdp-key-label">상권업종소분류코드</span><strong className="pdp-key">{item.code}</strong><dl>{['대분류명','중분류명','소분류명'].map((label,i)=><div key={label}><dt>{label}</dt><dd>“{item.original[i]}”</dd></div>)}</dl></section>
  <div className="pdp-join-link"><strong>같은 코드</strong><span aria-hidden="true">↔</span><small>글자 검색으로 이름을 맞추지 않음</small></div>
  <section><h4>2023년 공식 코드표</h4><span className="pdp-key-label">소분류코드</span><strong className="pdp-key">{item.code}</strong><dl>{['대분류명','중분류명','소분류명'].map((label,i)=><div key={label}><dt>{label}</dt><dd>“{item.codebook[i]}”</dd></div>)}</dl></section>
 </div>
 <div className="pdp-joined-result"><strong>연결 후 남길 정보</strong><p><b>{item.code}</b>에 원본 이름과 코드표 이름을 각각 둡니다. {item.id==='cafe'?'“음식”과 “음식점업”, “비알코올 ”과 “비알코올 음료점업”의 차이를 지우지 않습니다.':'“보건의료”와 “보건의료업”의 차이를 지우지 않습니다.'}</p></div>
 <p className="pdp-note">9월 원본 {number(current.classificationLabelDifferenceRows)}행 모두에서 코드표와 하나 이상의 명칭 차이가 있습니다. 코드표 미등록 {number(current.classificationUnknownRows)}행, 분류 계층 코드 불일치 {number(current.hierarchyCodeMismatchRows)}행입니다. 이름이 다르다는 이유만으로 업소 행을 삭제하지 않습니다.</p>
 <p className="pdp-source">실제 원본의 분류값과 공식 코드표 {number(course.codebook.rows)}개 항목을 사용했습니다. 카페 원본 중분류명 끝의 공백도 인용 안에 유지했습니다.</p>
 </>;}

function Observations(){const [mode,setMode]=useState('presence');const common=temporal.matchedIds;const fields=temporal.matchedFieldDifferences;return <>
 <h3>같은 업소번호의 두 시점을 비교합니다</h3>
 <Controls label="두 시점 비교 관점 선택" value={mode} onChange={setMode} items={ [['presence','목록에서 보이는 업소번호'],['coordinates','공통 업소의 주소와 좌표']]}/>
 {mode==='presence'?<div aria-live="polite"><div className="pdp-timeline">
  <section><h4>2026년 6월 30일</h4><strong>{number(previous.rows)}행</strong><div className="pdp-observation-bar" role="img" aria-label={`두 시점 공통 ${number(common)}개, 6월에만 관찰 ${number(temporal.noLongerObservedIds)}개`}><i className="pdp-common" style={{width:`${common/previous.rows*100}%`}}/><i className="pdp-previous-only" style={{width:`${temporal.noLongerObservedIds/previous.rows*100}%`}}/></div><p>공통 {number(common)} + 6월에만 {number(temporal.noLongerObservedIds)}</p></section>
  <div className="pdp-time-link"><span aria-hidden="true">↓</span><strong>상가업소번호로 연결</strong></div>
  <section><h4>2026년 9월 30일</h4><strong>{number(current.rows)}행</strong><div className="pdp-observation-bar" role="img" aria-label={`두 시점 공통 ${number(common)}개, 9월에만 관찰 ${number(temporal.newlyObservedIds)}개`}><i className="pdp-common" style={{width:`${common/current.rows*100}%`}}/><i className="pdp-current-only" style={{width:`${temporal.newlyObservedIds/current.rows*100}%`}}/></div><p>공통 {number(common)} + 9월에만 {number(temporal.newlyObservedIds)}</p></section>
 </div><p className="pdp-source">각 막대는 해당 시점의 전체 목록을 100%로 표시합니다.</p><div className="pdp-observation-legend"><span><i className="pdp-common"/>두 시점 공통</span><span><i className="pdp-previous-only"/>6월에만 관찰</span><span><i className="pdp-current-only"/>9월에만 관찰</span></div><p className="pdp-note"><b>9월에 새로 관측 {number(temporal.newlyObservedIds)}개, 9월에 미관측 {number(temporal.noLongerObservedIds)}개.</b> 이는 공개 목록의 차이입니다. 실제 개업·폐업 건수나 그 원인은 이 비교만으로 확정할 수 없습니다.</p></div>:<div aria-live="polite"><div className="pdp-common-group"><span>두 시점에 모두 있는 업소번호</span><strong>{number(common)}개</strong></div><Arrow label="같은 업소번호의 필드를 각각 비교"/><div className="pdp-field-comparison"><div><span>도로명주소가 달라진 행</span><strong>{number(fields['도로명주소'])}</strong><small>비교한 공통 업소의 주소 문자열은 같음</small></div><div><span>경도가 달라진 행</span><strong>{number(fields['경도'])}</strong><small>6월 값과 9월 값을 비교</small></div><div><span>위도가 달라진 행</span><strong>{number(fields['위도'])}</strong><small>6월 값과 9월 값을 비교</small></div></div><p className="pdp-note">주소 문자열이 같은 업소에서도 좌표 값은 달라졌습니다. <b>좌표 차이를 실제 점포 이전으로 바꾸어 설명하지 않습니다.</b> 위치 정보의 정정 등 원인을 확인할 추가 자료가 필요합니다.</p></div>}
 <p className="pdp-source">이번 두 공식 CSV 전체에서 계산한 비교입니다. 업소번호·주소·좌표 원본 값은 변경하지 않았습니다.</p>
 </>;}

export function PublicDataPrinciples(){const [view,setView]=useState('retrieval');return <details className="pdp-principles"><summary>왜 이 순서로 작업하나요? · 원리 그림 펼치기</summary><div className="pdp-content"><p className="pdp-intro">기준 찾기, 파일 연결, 시점 비교가 각각 무엇을 하는지 확인할 수 있습니다. 이번 울산 공개데이터의 실제 값으로 설명합니다.</p><Controls label="살펴볼 작업 원리" value={view} onChange={setView} items={ [['retrieval','① 기준 찾기와 전체 처리'],['classification','② 코드로 연결하기'],['observations','③ 두 시점 비교하기']]}/><section hidden={view!=='retrieval'}><Retrieval/></section><section hidden={view!=='classification'}><Classification/></section><section hidden={view!=='observations'}><Observations/></section></div></details>;}
export default PublicDataPrinciples;
