import React, {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Clipboard,Expand,FileText,X} from 'lucide-react';
import {beginnerHref,beginnerPeriods,beginnerReferences,beginnerUnits,beginnerVisuals,resolveBeginnerUnit} from './beginner-course-data';
import {ScreenGallery} from './LessonGuide';
import {ContextTree} from './WorkflowCourse';
import './beginner-course.css';

export function BeginnerOverview(){
  return <section className="beginner-overview" aria-label="초급반 3교시 구성"><div className="beginner-section-title"><span>BEGINNER / 3 CLASSES</span><h2>이해하고 선택한 뒤, 내 자료로 실행합니다</h2></div><div className="beginner-period-cards">{beginnerPeriods.map(period=><a key={period.id} href={beginnerHref(period.units[0])}><span>{period.id}교시 <small>50분</small></span><h3>{period.title}</h3><p>{period.description}</p><div>{period.units.length}개 중단원<ArrowUpRight size={17}/></div></a>)}</div><p className="beginner-time-note">수업 50분 × 3교시 · 휴식 10분 × 2회 · 마무리 10분</p></section>;
}

function TeachingGraphic({id}){
  const item=beginnerVisuals[id],dialog=useRef(null);
  return <figure className="teaching-graphic"><button onClick={()=>dialog.current?.showModal()} aria-label={`${item.title} 확대`}><img src={`${import.meta.env.BASE_URL}${item.path}`} alt={item.alt} loading="lazy"/><span><Expand size={16}/>그림 확대</span></button><figcaption><b>{item.title}</b><p>{item.note}</p>{id==='tokens'&&<a href={`${import.meta.env.BASE_URL}learning/context-token-measurements.json`} target="_blank" rel="noreferrer">측정 구성과 수치<ArrowUpRight size={13}/></a>}</figcaption><dialog ref={dialog} className="teaching-image-dialog" aria-label={item.title} onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><header><strong>{item.title}</strong><button onClick={()=>dialog.current.close()} aria-label="학습 그림 닫기"><X size={22}/></button></header><img src={`${import.meta.env.BASE_URL}${item.path}`} alt={item.alt}/><p>{item.note}</p><a href={`${import.meta.env.BASE_URL}${item.path}`} target="_blank" rel="noreferrer">원본 크기로 열기<ArrowUpRight size={14}/></a></dialog></figure>;
}

function LegalTimeline(){
  return <section className="legal-timeline"><div><span>CASE / MATA V. AVIANCA</span><h3>허위 인용이 실제 제재로 이어진 과정</h3></div><ol>{[['2023.03.01','허위 판례가 포함된 자료 제출'],['2023.05.25','ChatGPT 생성 판례 인용 사실 인정'],['2023.06.22','법원이 총 5,000달러 공동·연대 금전 제재 명령']].map(([date,event])=><li key={date}><time>{date}</time><p>{event}</p></li>)}</ol><p>판결문에 기록된 사건 경과입니다. 형사상 벌금이나 모든 AI 사용에 대한 일률적인 제재로 설명하지 않습니다.</p></section>;
}

export function BeginnerCourse({onCopy,onCase}){
  const [unit,setUnit]=useState(()=>resolveBeginnerUnit(location.hash));
  const heading=useRef(null),contents=useRef(null);
  const period=beginnerPeriods.find(item=>item.id===unit.period),index=beginnerUnits.indexOf(unit);
  function focusUnit(){heading.current?.focus({preventScroll:true});if(heading.current)window.scrollTo({top:heading.current.getBoundingClientRect().top+window.scrollY-(innerWidth<=760?78:24),behavior:'instant'});}
  useEffect(()=>{const handler=()=>setUnit(resolveBeginnerUnit(location.hash));window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);
  useEffect(()=>{if(new URLSearchParams(location.hash.split('?')[1]||'').has('unit'))focusUnit();},[unit.id]);
  return <div className="beginner-course">
    <div className="page-heading"><div className="eyebrow">AI FUNDAMENTALS / BEGINNER</div><h1>초급반 · AI 이해에서 자료 기반 실습까지</h1><p>작동 원리·도구 선택·환각을 이해하고, 요청과 컨텍스트를 관리해 검토 가능한 결과를 만듭니다.</p></div>
    <BeginnerOverview/>
    <div className="beginner-reading-layout">
      <nav className="beginner-contents" ref={contents} tabIndex={-1} aria-label="초급반 대중소단원 목차">{beginnerPeriods.map(item=><section key={item.id}><h2><span>{item.id}교시</span>{item.title}<small>50분</small></h2><ol>{item.units.map(id=>{const entry=beginnerUnits.find(u=>u.id===id);return <li key={id}><a href={beginnerHref(id)} aria-current={unit.id===id?'page':undefined} onClick={e=>{if(unit.id===id&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();focusUnit();}}}><span>{entry.number}</span><strong>{entry.title}</strong><small>{entry.minutes}분</small></a></li>;})}</ol></section>)}<a className="beginner-flow-reference" href="#concepts?course=beginner&stage=purpose">7단계 작업 흐름 참고<ArrowRight size={14}/></a></nav>
      <article className="beginner-unit" key={unit.id}>
        <header className="beginner-unit-heading" ref={heading} tabIndex={-1}><button className="text-btn" onClick={()=>{contents.current?.focus({preventScroll:true});if(contents.current)window.scrollTo({top:contents.current.getBoundingClientRect().top+scrollY-78,behavior:'instant'});}}><ArrowLeft size={14}/>전체 목차 보기</button><div className="beginner-unit-meta"><span>{period.id}교시 · {period.title}</span><span>{unit.number} · {unit.minutes}분</span></div><h2>{unit.title}</h2><p>{unit.lead}</p></header>
        {unit.visual&&<TeachingGraphic id={unit.visual}/>}
        <section className="beginner-concepts"><span className="beginner-label">소단원 / 핵심 개념</span>{unit.concepts.map(([title,text],i)=><section key={title}><h3><span>{unit.number}-{i+1}</span>{title}</h3><p>{text}</p></section>)}</section>
        {unit.id==='context'&&<ContextTree advanced/>}
        {unit.id==='hallucinations'&&<LegalTimeline/>}
        {unit.table&&<section className="beginner-table-section"><h3>{unit.id==='models'?'대표 모델 비교 · 2026-11-05 공식 안내 기준':'개념을 구분하는 기준'}</h3><div className="beginner-table-wrap" tabIndex={0} role="region" aria-label={`${unit.title} 비교표`}><table><thead><tr>{unit.table.headers.map(text=><th scope="col" key={text}>{text}</th>)}</tr></thead><tbody>{unit.table.rows.map(row=><tr key={row[0]}>{row.map((cell,i)=>i===0?<th scope="row" key={i}>{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>{unit.id==='models'&&<p className="beginner-source-note">제조사의 제품 위치 설명과 계정 접근 안내를 요약했습니다. 독립 성능 순위가 아니며 사용 가능한 모델·요금제는 계정과 배포 상태에 따라 확인합니다.</p>}</section>}
        {unit.example&&<section className="beginner-worked"><span className="beginner-label">적용·판단 예시</span><h3>{unit.example.title}</h3><div><article><span>처음의 판단·요청</span><p>{unit.example.before}</p></article><ArrowRight size={21}/><article><span>확인·조정할 방향</span><p>{unit.example.after}</p></article></div><p>{unit.example.why}</p></section>}
        {unit.prompt&&<section className="beginner-request"><header><h3>실습에 사용할 요청</h3><button className="text-btn" onClick={()=>onCopy(unit.prompt)} aria-label={`${unit.title} 요청 복사`}><Clipboard size={15}/>복사</button></header><pre>{unit.prompt}</pre></section>}
        <section className="beginner-activity"><span className="beginner-label">설명과 연결해 직접 확인</span><h3>함께 진행할 활동</h3><ol>{unit.activity.map((text,i)=><li key={text}><span>{String(i+1).padStart(2,'0')}</span><p>{text}</p></li>)}</ol>{unit.lesson&&<button className="btn primary" onClick={()=>onCase(unit.lesson)}><FileText size={16}/>교시 활동과 작업 기록 열기<ArrowRight size={16}/></button>}</section>
        {unit.screens&&<details className="beginner-capture-reference"><summary>실제 조작·검토 화면 보기</summary><p>2026-10-14의 기존 실행 기록입니다. 새 요청의 실행 결과와 구분하고 화면 속 수치·주장도 원문과 대조합니다.</p><ScreenGallery ids={unit.screens} compact/></details>}
        <section className="beginner-checkpoints"><h3>다음 단원으로 가기 전</h3><ul>{unit.checks.map(text=><li key={text}>{text}</li>)}</ul></section>
        <footer className="beginner-unit-sources"><span>개념·기능·사건 원문 · 확인 2026-11-05</span>{unit.refs.map(id=><a key={id} href={beginnerReferences[id][1]} target="_blank" rel="noreferrer">{beginnerReferences[id][0]}<ArrowUpRight size={13}/></a>)}</footer>
        <nav className="beginner-unit-pagination" aria-label="초급반 단원 이동">{index>0?<a className="btn secondary" href={beginnerHref(beginnerUnits[index-1].id)}><ArrowLeft size={15}/>이전 단원</a>:<span/>}{index<beginnerUnits.length-1?<a className="btn primary" href={beginnerHref(beginnerUnits[index+1].id)}>다음 단원<ArrowRight size={15}/></a>:<button className="btn primary" onClick={()=>onCase('email')}>실습 결과 저장<ArrowRight size={15}/></button>}</nav>
      </article>
    </div>
  </div>;
}
