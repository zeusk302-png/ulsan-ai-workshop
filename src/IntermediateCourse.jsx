import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,CheckCircle2,Clipboard,Download,Expand,FileText,FolderOpen,X} from 'lucide-react';
import {intermediatePeriods,intermediateUnits,intermediateReferences,intermediateHref,resolveIntermediateUnit} from './intermediate-course-data';
import {IntermediateVisual} from './intermediate-visuals';
import './intermediate-course.css';

const REVISION='automation-2026-11-06';
function safeRecord(value){
  const units={};
  for(const unit of intermediateUnits){const entry=value?.units?.[unit.id];if(entry&&typeof entry==='object')units[unit.id]={note:typeof entry.note==='string'?entry.note:'',checks:Array.isArray(entry.checks)?[...new Set(entry.checks.filter(n=>Number.isInteger(n)&&n>=0&&n<unit.checks.length))]:[]};}
  return {revision:REVISION,units};
}
function readUnit(){const value=resolveIntermediateUnit(location.hash);return typeof value==='string'?intermediateUnits.find(u=>u.id===value)||intermediateUnits[0]:value||intermediateUnits[0];}
function assetUrl(path){return `${import.meta.env.BASE_URL}${String(path||'').replace(/^\/?public\//,'').replace(/^\//,'')}`;}
function saveText(name,content){const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function isComplete(unit,entry){return unit.checks.length>0&&unit.checks.every((_,i)=>entry?.checks?.includes(i));}

export function IntermediateOverview(){return <section className="ia-overview" aria-label="중급반 3교시 구성"><span className="ia-kicker">INTERMEDIATE / 3 CLASSES</span><h2>근거를 찾고, 계산하고, 보고 자료로 완성합니다</h2><div className="ia-period-grid">{intermediatePeriods.map(period=><a key={period.id} href={intermediateHref((period.units||period.unitsIds)[0])}><span>{period.id}교시 <small>50분</small></span><h3>{period.title}</h3><p>{period.description}</p><div>{(period.units||period.unitsIds).length}개 단원<ArrowUpRight size={17}/></div></a>)}</div><p className="ia-time-note">수업 50분 × 3교시 · 휴식 10분 × 2회 · 마무리 10분 = 180분</p></section>;}

function Diagram({kind,title}){const dialog=useRef(null);return <figure className="ia-diagram"><figcaption><div><span className="ia-kicker">원리를 보며 직접 조작</span><h3>{title} · 작업 도식</h3></div><button type="button" className="text-btn" onClick={()=>dialog.current?.showModal()} aria-label={`${title} 도식 확대`}><Expand size={16}/>확대</button></figcaption><p className="ia-illustration-label">설명용 도식 · 실제 서비스 화면 캡처가 아닙니다. 예시 수치는 실습 파일의 측정 결과와 구분합니다.</p><IntermediateVisual kind={kind}/><dialog ref={dialog} className="ia-visual-dialog" aria-label={`${title} 도식 확대`} onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}><header><strong>{title} · 작업 도식</strong><button type="button" onClick={()=>dialog.current.close()} aria-label="확대 도식 닫기"><X size={22}/></button></header><p className="ia-illustration-label">설명용 도식 · 실제 화면 캡처가 아닙니다. Escape 키로 닫을 수 있습니다.</p><IntermediateVisual kind={kind}/></dialog></figure>;}

function DownloadLinks({files,compact=false}){return <div className={`ia-download-links ${compact?'compact':''}`}>{files.map(file=><a key={`${file.path}-${file.name}`} href={assetUrl(file.path)} download><Download size={17}/><span><strong>{file.name}</strong>{file.note&&<small>{file.note}</small>}</span><ArrowDownIcon/></a>)}</div>;}
function ArrowDownIcon(){return <span className="ia-download-arrow" aria-hidden="true">↓</span>;}

const instructionFiles=[{name:'AGENTS.md',path:'automation/AGENTS.md'},{name:'CLAUDE.md',path:'automation/CLAUDE.md'}];
function LiveInstructionFiles({onCopy}){
  const [files,setFiles]=useState({}),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();let active=true;
    setFiles(Object.fromEntries(instructionFiles.map(file=>[file.name,{status:'loading'}])));
    Promise.allSettled(instructionFiles.map(async file=>{
      try{
        const response=await fetch(assetUrl(file.path),{signal:controller.signal,cache:'no-store'});
        if(!response.ok||(response.headers.get('content-type')||'').includes('text/html'))throw new Error('instruction-unavailable');
        const text=await response.text();if(!text.trim())throw new Error('instruction-empty');
        if(active)setFiles(previous=>({...previous,[file.name]:{status:'ready',text}}));
      }catch(error){if(active&&error.name!=='AbortError')setFiles(previous=>({...previous,[file.name]:{status:'error'}}));}
    }));
    return()=>{active=false;controller.abort();};
  },[attempt]);
  return <section className="ia-unit-section ia-live-instructions"><span className="ia-kicker">READ THE ACTUAL FILES</span><h3>실제 실습 지침 파일 읽기</h3><p>아래는 실습 ZIP과 함께 제공하는 파일의 원문입니다. 항목의 의미를 먼저 읽은 뒤, 사용하는 도구에 이 규칙이 실제로 전달됐는지 확인하세요.</p><div className="ia-instruction-explanations">{[
    ['목표 · 무엇을 만드는가','첫 문단은 가상 교육용 자료라는 범위를 정합니다. 실제 기관의 성과로 오인하지 않도록 결과물에도 이 표시를 남깁니다.'],
    ['읽을 자료 · 어떤 기준을 쓰는가','1항의 운영 기준과 보고 안내를 먼저 읽습니다. CLAUDE.md의 @AGENTS.md는 공통 규칙을 참조하므로, 도구가 해당 파일까지 읽었는지 확인해야 합니다.'],
    ['추정 금지 · 원본을 어떻게 지키는가','2·3항은 원본을 보존하고 누락·제외·보류 사유를 남기게 합니다. 빠진 점수나 ID를 그럴듯한 값으로 채우지 않고 원본 행으로 되돌아갈 수 있게 합니다.'],
    ['출력·완료 · 무엇을 확인하는가','4~6·8항은 분모, 시트 구성, 편집 가능한 PPT, 출처와 검산을 정합니다. 실제 파일을 열고 검토하기 전에는 대화창의 답변만으로 완료라고 하지 않습니다.']
  ].map(([title,text])=><article key={title}><h4>{title}</h4><p>{text}</p></article>)}</div>{instructionFiles.map(file=>{const entry=files[file.name]||{status:'loading'};return <article className="ia-source-file" key={file.name} aria-busy={entry.status==='loading'}><header><div><strong>{file.name}</strong><span>실습 폴더 루트 · 원문</span></div><div>{entry.status==='ready'&&<button type="button" className="text-btn" onClick={()=>onCopy?.(entry.text)} aria-label={`${file.name} 원문 복사`}><Clipboard size={15}/>원문 복사</button>}<a href={assetUrl(file.path)} download aria-label={`${file.name} 원본 다운로드`}><Download size={15}/>파일 받기</a></div></header>{entry.status==='ready'?<pre><code>{entry.text}</code></pre>:entry.status==='error'?<div className="ia-source-error" role="status"><p>원문을 불러오지 못했습니다. 위 ‘파일 받기’ 또는 전체 ZIP을 내려받아 텍스트 편집기로 열어 읽으세요.</p><button type="button" className="text-btn" onClick={()=>setAttempt(value=>value+1)}>원문 다시 불러오기</button></div>:<p className="ia-source-loading" role="status">{file.name} 원문을 불러오는 중입니다. 파일 다운로드는 바로 사용할 수 있습니다.</p>}</article>;})}<p className="ia-instruction-boundary">원문을 화면에서 읽거나 복사했다고 외부 AI에 적용되는 것은 아닙니다. 웹 AI에서는 필요한 파일을 직접 첨부하고, 로컬 에이전트에서는 지원하는 지침 파일과 적용 범위를 확인합니다.</p></section>;
}

function ActualFolderTree(){return <section className="ia-unit-section ia-actual-tree"><span className="ia-kicker">MATCH YOUR EXTRACTED FOLDER</span><h3>압축을 푼 실제 폴더와 비교하세요</h3><p>아래는 실습의 핵심 여섯 폴더와 루트 지침 네 파일입니다. 위 도식에서 각 항목을 누르면 역할을 볼 수 있고, 아래 표에서는 읽을 위치와 저장할 위치를 비교할 수 있습니다.</p><pre aria-label="실습 핵심 폴더와 루트 지침 파일 구조">{`report-workspace/
├─ sources/        기준·근거 문서
├─ data/           회차별 원본 XLSX
├─ templates/      보고 PPT 양식
├─ work/           중간 작업 기록
├─ output/         검토할 XLSX·PPTX
├─ checks/         검산 기준·확인 기록
├─ AGENTS.md       공통 작업 규칙
├─ CLAUDE.md       공통 규칙 참조
├─ README.md       시작 안내
└─ 업무절차.md     단계별 실행 순서`}</pre><p className="ia-tree-note">ZIP에는 guide/ 시작 안내, prompts/ 단계별 요청, examples/ 검토용 예시도 함께 들어 있습니다. work/와 output/에 결과를 새로 저장하고 data/ 원본은 보존합니다.</p></section>;}

export function IntermediateCourse({onCopy,record,onRecord}){
  const [unit,setUnit]=useState(readUnit),[exported,setExported]=useState(false);
  const currentHash=location.hash;
  const heading=useRef(null),contents=useRef(null),latest=useRef(null),firstEntry=useRef(true);
  const clean=safeRecord(record);latest.current=clean;
  const current=clean.units[unit.id]||{note:'',checks:[]};
  const index=intermediateUnits.findIndex(item=>item.id===unit.id),period=intermediatePeriods.find(item=>item.id===unit.period);
  const done=intermediateUnits.filter(item=>isComplete(item,clean.units[item.id])).length;
  const allDownloads=[...new Map(intermediateUnits.flatMap(item=>item.downloads||[]).map(file=>[file.path,file])).values()];
  function focusUnit(){heading.current?.focus({preventScroll:true});if(heading.current)window.scrollTo({top:heading.current.getBoundingClientRect().top+window.scrollY-(innerWidth<=760?82:24),behavior:'instant'});}
  function patchUnit(patch){const next=safeRecord(latest.current);next.units[unit.id]={note:'',checks:[],...next.units[unit.id],...patch};latest.current=next;onRecord?.(next);}
  function toggleCheck(check){const entry=latest.current?.units?.[unit.id]||current;patchUnit({checks:entry.checks.includes(check)?entry.checks.filter(n=>n!==check):[...entry.checks,check]});}
  function exportUnit(){const entry=latest.current?.units?.[unit.id]||current;const references=(unit.refs||[]).map(id=>intermediateReferences[id]).filter(Boolean);const text=[`중급반 · ${unit.number} ${unit.title}`,`편성: ${REVISION}`,`검토: ${entry.checks.length}/${unit.checks.length}`,`\n내 작업 기록\n${entry.note||'(아직 작성한 기록이 없습니다.)'}`,`\n검토 기준\n${unit.checks.map((check,i)=>`${entry.checks.includes(i)?'[확인]':'[미확인]'} ${check}`).join('\n')}`,`\n실행 요청\n${unit.prompt||''}`,`\n공식 참고 자료\n${references.map(ref=>`${ref[0]}\n${ref[1]}`).join('\n\n')}`,'\n이 기록은 수강생이 입력한 확인 내용입니다. 외부 AI의 실제 실행이나 자동 검증을 의미하지 않습니다.'].join('\n');saveText(`중급반-${unit.number}-${unit.id}-작업기록.txt`,text);setExported(true);}
  useEffect(()=>{const handler=()=>setUnit(readUnit());window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);
  useEffect(()=>{setUnit(readUnit());},[currentHash]);
  useEffect(()=>{setExported(false);const showPreparation=firstEntry.current&&unit.id==='purpose';firstEntry.current=false;if(!showPreparation&&new URLSearchParams(location.hash.split('?')[1]||'').has('unit'))focusUnit();},[unit.id]);
  return <div className="intermediate-course">
    <div className="page-heading"><div className="eyebrow">RAG / EXCEL / PRESENTATION</div><h1>중급반 · AI로 엑셀·PPT 업무 자동화하기</h1><p>자료에서 기준을 찾고, 엑셀로 계산·검토한 뒤, 다음 회차에도 쓸 보고 자료를 만듭니다.</p></div>
    <IntermediateOverview/>
    <section className="ia-preparation" aria-label="실습 준비와 자료"><header><div><span className="ia-kicker">BEFORE YOU START</span><h2>자료를 준비하고 실행 환경을 선택하세요</h2></div><FolderOpen size={25}/></header><p>이 웹은 수업 안내와 작업 기록을 제공합니다. 파일 분석·생성은 수강생이 사용하는 외부 AI 도구에서 실행하고, 엑셀·PPT 파일은 내려받아 직접 확인합니다.</p><a className="btn primary ia-bundle-link" href={assetUrl('automation/report-workspace.zip')} download><Download size={17}/>실습 작업 폴더 전체 받기 · ZIP</a><details><summary>실행 환경에 따라 따라갈 방법 확인</summary><div className="ia-environments"><article><h3>로컬 에이전트로 진행할 때</h3><p>압축을 풀고 해당 작업 폴더를 엽니다. 에이전트가 파일을 읽을 수 있는지, 어떤 작업 지침을 자동 인식하는지 확인합니다. 도구마다 지원 파일명·적용 범위가 다릅니다.</p></article><article><h3>웹 AI로 진행할 때</h3><p>필요한 지침과 기준·원본 파일을 직접 첨부합니다. 파일 역할과 작업 순서를 요청에 함께 적습니다. 내 컴퓨터의 폴더를 만들었다고 웹 AI가 자동으로 읽지는 않습니다.</p></article></div><p className="ia-prep-note">자료 기반 질문 도구, 파일을 만들 수 있는 AI, XLSX·PPTX를 열 수 있는 프로그램을 준비합니다. 파일 생성·다운로드와 계정 사용량은 수업 전에 확인하세요. 제한이 생기면 제공 예시와 템플릿으로 계산·검토를 이어갑니다.</p></details><details><summary>단계별로 필요한 자료만 받기 · {allDownloads.length}개</summary><DownloadLinks files={allDownloads} compact/></details></section>
    <div className="ia-reading-layout"><nav className="ia-contents" ref={contents} tabIndex={-1} aria-label="중급반 교시별 단원 목차"><div className="ia-progress"><span>내 검토 기록</span><strong>{done} / {intermediateUnits.length} 단원</strong><progress value={done} max={intermediateUnits.length} aria-label="중급반 검토 완료 단원"/></div>{intermediatePeriods.map(item=><section key={item.id}><h2><span>{item.id}교시</span>{item.title}<small>50분</small></h2><ol>{(item.units||item.unitsIds).map(id=>{const entry=intermediateUnits.find(u=>u.id===id);if(!entry)return null;return <li key={id}><a href={intermediateHref(id)} aria-current={unit.id===id?'page':undefined} onClick={event=>{if(unit.id===id&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey){event.preventDefault();focusUnit();}}}><span>{entry.number}</span><strong>{entry.title}</strong>{isComplete(entry,clean.units[id])?<CheckCircle2 size={15} aria-label="검토 완료"/>:<small>{entry.minutes}분</small>}</a></li>;})}</ol></section>)}<a className="ia-old-reference" href="#concepts?course=intermediate&stage=evidence">기존 RAG 작업 흐름 참고<ArrowRight size={15}/></a></nav>
    <article className="ia-unit" key={unit.id}><header className="ia-unit-heading" tabIndex={-1} ref={heading}><button type="button" className="text-btn" onClick={()=>{contents.current?.focus({preventScroll:true});if(contents.current)window.scrollTo({top:contents.current.getBoundingClientRect().top+scrollY-82,behavior:'instant'});}}><ArrowLeft size={14}/>전체 목차 보기</button><div className="ia-unit-meta"><span>{period?.id||unit.period}교시 · {period?.title}</span><span>{unit.number} · {unit.minutes}분</span></div><h2>{unit.title}</h2><p>{unit.lead}</p></header>
    {unit.why&&<section className="ia-why ia-unit-section"><span className="ia-kicker">WHY THIS STEP</span><h3>왜 이 작업을 하나요?</h3><div>{[['지금 생기는 문제',unit.why.problem],['이 단계가 필요한 이유',unit.why.reason],['작업 후 얻는 것',unit.why.benefit]].map(([label,text])=><article key={label}><span>{label}</span><p>{text}</p></article>)}</div></section>}
    <section className="ia-concepts ia-unit-section"><span className="ia-kicker">소단원 / 알아둘 개념</span>{(unit.concepts||[]).map(([title,text],i)=><section key={title}><h3><span>{unit.number}-{i+1}</span>{title}</h3><p>{text}</p></section>)}</section>
    <Diagram kind={unit.diagram} title={unit.title}/>
    {unit.id==='folders'&&<ActualFolderTree/>}
    {unit.id==='instructions'&&<LiveInstructionFiles onCopy={onCopy}/>}
    {unit.table&&<section className="ia-table-section ia-unit-section"><h3>판단 기준과 작업 구조</h3><p className="ia-table-hint">좁은 화면에서는 표 안을 좌우로 움직여 모든 열을 확인하세요.</p><div className="ia-table-wrap" role="region" tabIndex={0} aria-label={`${unit.title} 기준표`}><table><thead><tr>{unit.table.headers.map((text,i)=><th key={i} scope="col">{text}</th>)}</tr></thead><tbody>{unit.table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th key={j} scope="row">{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></section>}
    {!!unit.downloads?.length&&<section className="ia-unit-section ia-unit-downloads"><h3>이 단원에서 사용할 자료</h3><DownloadLinks files={unit.downloads}/></section>}
    <section className="ia-unit-section ia-steps"><span className="ia-kicker">FOLLOW ALONG</span><h3>이 순서대로 직접 진행하세요</h3><p className="ia-step-intro">사용 도구의 버튼 이름은 버전·계정에 따라 다를 수 있습니다. 각 단계의 결과와 막혔을 때 확인할 내용을 함께 보세요.</p><ol>{(unit.steps||[]).map((step,i)=><li key={`${step.title}-${i}`}><span className="ia-step-number">{String(i+1).padStart(2,'0')}</span><div><h4>{step.title}</h4><p>{step.action}</p><dl><div><dt>보여야 할 결과</dt><dd>{step.expect}</dd></div><div><dt>막혔다면</dt><dd>{step.fix}</dd></div></dl></div></li>)}</ol></section>
    {unit.prompt&&<section className="ia-request"><header><h3>외부 AI에 붙여 넣을 요청</h3><button type="button" className="text-btn" onClick={()=>onCopy?.(unit.prompt)} aria-label={`${unit.title} 실행 요청 복사`}><Clipboard size={16}/>복사</button></header><pre>{unit.prompt}</pre><p>자료를 먼저 첨부하고 파일명·회차가 실제 입력과 일치하는지 확인한 뒤 실행하세요.</p></section>}
    {unit.example&&<section className="ia-worked ia-unit-section"><span className="ia-kicker">BEFORE / AFTER</span><h3>요청과 결과를 이렇게 판단합니다</h3><div><article><span>그대로 진행하면</span><p>{unit.example.before}</p></article><ArrowRight size={21} aria-hidden="true"/><article><span>확인하고 조정하면</span><p>{unit.example.after}</p></article></div><p>{unit.example.why}</p></section>}
    <section className="ia-checks ia-unit-section"><span className="ia-kicker">REVIEW BEFORE CONTINUING</span><h3>내 결과를 확인하세요</h3><p>실제로 확인한 항목만 선택하세요. 체크는 수강생의 검토 기록이며, 파일을 자동으로 검사한 결과는 아닙니다.</p><fieldset><legend className="ia-sr-only">{unit.title} 검토 항목</legend>{unit.checks.map((check,i)=><label key={check}><input type="checkbox" checked={current.checks.includes(i)} onChange={()=>toggleCheck(i)}/><span>{check}</span></label>)}</fieldset>{isComplete(unit,current)&&<div className="ia-check-success" role="status"><CheckCircle2 size={17}/>이 단원의 검토 항목을 모두 확인했습니다.</div>}</section>
    <section className="ia-record ia-unit-section"><label htmlFor={`ia-note-${unit.id}`}><FileText size={18}/><span>내 작업 기록</span></label><p id={`ia-note-help-${unit.id}`}>만든 파일명, 확인한 수식·출처, 수정한 내용, 아직 해결하지 못한 질문을 적으세요. 현재 브라우저에 저장되며 전체 백업은 ‘내 작업함’에서 받을 수 있습니다.</p><textarea id={`ia-note-${unit.id}`} aria-describedby={`ia-note-help-${unit.id}`} value={current.note} onChange={event=>patchUnit({note:event.target.value})} rows={6} maxLength={100000} placeholder="예: 집계 파일의 만족도 분모를 확인했다. 공란을 0점으로 처리한 수식을 수정했다."/><div className="ia-record-actions"><button type="button" className="btn secondary" onClick={exportUnit}><Download size={16}/>이 단원 기록 TXT 받기</button><span role="status">{exported?'기록 파일을 다운로드했습니다.':''}</span></div></section>
    <footer className="ia-unit-sources"><span>공식 참고 자료 · 서비스 기능은 계정과 배포 상태에 따라 확인</span>{(unit.refs||[]).map(id=>{const ref=intermediateReferences[id];return ref?<a key={id} href={ref[1]} target="_blank" rel="noreferrer">{ref[0]}<ArrowUpRight size={14}/></a>:null;})}</footer>
    <nav className="ia-unit-pagination" aria-label="중급반 단원 이동">{index>0?<a className="btn secondary" href={intermediateHref(intermediateUnits[index-1].id)}><ArrowLeft size={15}/>이전 단원</a>:<span/>}{index<intermediateUnits.length-1?<a className="btn primary" href={intermediateHref(intermediateUnits[index+1].id)}>다음 단원<ArrowRight size={15}/></a>:<a className="btn primary" href="#workbook?course=intermediate">내 작업함에서 백업<ArrowRight size={15}/></a>}</nav>
    </article></div>
  </div>;
}

export default IntermediateCourse;
