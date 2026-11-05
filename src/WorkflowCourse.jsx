import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Clipboard, Download, FileText } from 'lucide-react';
import documents from '../content/official-documents.json';
import { flowStages, webCurriculum, flowHref, resolveFlowStage, compareEffort } from './flow-curriculum';
import { diagnosticBranches, flowContent, flowReferences, ragOperations, sourceQuestions, stagePrinciples } from './flow-content';
import { flowLessonCopy } from './flow-lessons';
import { ScreenGallery } from './LessonGuide';
import { ContextTransferView, RealScreenSpotlight, StageVisual } from './LearningVisuals';
import './workflow.css';
const ApplicationCases = lazy(()=>import('./UsageGuide').then(module=>({default:module.ApplicationCases})));

export function WorkflowMap({ slug='beginner', active, compact=false, onCurrent }) {
  return <nav className={`flow-map ${compact?'compact':''}`} aria-label="작업 흐름 7단계"><ol>{flowStages.map(stage=><li key={stage.id}><a href={flowHref(slug,stage.id)} aria-current={active===stage.id?'step':undefined} onClick={e=>{if(active===stage.id&&onCurrent&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();onCurrent();}}}><span className="flow-node-number">{stage.number}</span><strong>{stage.short}</strong><small>{stage.owner}</small></a></li>)}</ol><div className="flow-return"><span>검토 후 복귀</span><a href={flowHref(slug,'inputs')}>자료·범위 문제 → 자료 단계</a><a href={flowHref(slug,'draft')}>표현·구조 문제 → 작성 단계</a></div></nav>;
}

function CopyRequest({ text, onCopy, label='이 단계의 요청' }) {
  return <div className="flow-request"><div><h3>{label}</h3><button className="text-btn" onClick={()=>onCopy(text)} aria-label={`${label} 복사`}><Clipboard size={15}/>복사</button></div><pre>{text}</pre></div>;
}

export function EffortComparison() {
  const [values,setValues]=useState({manual:'',preparation:'',execution:'',review:'',repeats:'1'});
  const result=compareEffort(values);
  const fields=[['manual','직접 처리 · 건당 분'],['preparation','AI 자료 준비 · 최초 분'],['execution','AI 입력·생성 · 건당 분'],['review','AI 결과 검토·수정 · 건당 분'],['repeats','동일 절차의 반복 건수']];
  return <details className="flow-effort"><summary>총작업시간 비교</summary><p>실측값을 입력합니다. AI 준비 시간은 최초 1회 비용으로, 처리·검토는 건별 비용으로 계산합니다. 자료를 매번 새로 준비한다면 그 시간은 건당 입력·생성에 포함하세요. 품질·누락·추가 비용은 별도로 비교합니다.</p><div className="flow-effort-fields">{fields.map(([id,label])=><label key={id}>{label}<input type="number" min={id==='repeats'?1:0} step={id==='repeats'?1:'any'} value={values[id]} onChange={e=>setValues(v=>({...v,[id]:e.target.value}))} placeholder={id==='repeats'?'건수':'실측 분'}/></label>)}</div><div className="flow-effort-result" role="status">{result ? <><span>직접 처리 합계 <b>{result.manualTotal.toFixed(1)}분</b></span><span>AI 활용 합계 <b>{result.aiTotal.toFixed(1)}분</b></span><span>차이 <b>{result.difference.toFixed(1)}분</b></span><p>{result.difference>0?'입력한 시간 기준으로 AI 흐름의 총 소요시간이 적습니다. 결과 품질과 누락도 함께 확인합니다.':result.difference<0?'입력한 시간 기준으로 AI 흐름의 총 소요시간이 더 큽니다. 맡길 단계와 준비·검토 부담을 다시 봅니다.':'입력한 시간 기준으로 총 소요시간이 같습니다. 품질과 재사용 이점을 별도로 봅니다.'}</p></> : '시간과 반복 건수를 모두 입력하면 비교값이 표시됩니다.'}</div></details>;
}

export function ContextTree({ advanced=false }) {
  const [mode,setMode]=useState('current');
  return <section className="flow-visual context-visual"><div className="flow-section-label">CONTEXT / STATE</div><h3>어떤 정보를 다음 요청에 넘길 것인가</h3><p>상황을 바꾸면 유지·제외할 정보와 다음 작업 묶음이 함께 바뀝니다.</p><div className="flow-choice" role="group" aria-label="컨텍스트 상황 선택">{[['current','같은 작업 수정'],['handoff','새 대화 인수인계'],...(advanced?[['switch','다른 업무로 전환']]:[])].map(([id,title])=><button className="btn secondary" key={id} aria-pressed={mode===id} onClick={()=>setMode(id)}>{title}</button>)}</div><ContextTransferView mode={mode} advanced={advanced}/><p className="flow-caption">요약은 원문의 길잡이입니다. 화면의 전체 대화와 실제 참고 범위는 구분하며, 개인화 메모리나 앞선 AI 초안을 원문 근거의 대체물로 사용하지 않습니다.</p></section>;
}

export function SourceRoleTree() {
  const [question,setQuestion]=useState('format');
  const current=sourceQuestions.find(q=>q.id===question);
  const roles={manual:'작성·처리 기준',regulation:'관련 규정·시점',rules:'구체적 작성 규칙',notice:'사업 사실·붙임',weekly:'다른 업무의 계획'};
  return <section className="flow-visual"><div className="flow-section-label">SOURCE / QUESTION</div><h3>질문별 소스 선택 설계</h3><p>아래 선택은 수업용 설계 예시입니다. 실제 NotebookLM에서는 소스 패널에서 같은 범위를 확인합니다.</p><div className="flow-choice" role="group" aria-label="근거 질문 선택">{sourceQuestions.map(q=><button className="btn secondary" key={q.id} aria-pressed={question===q.id} onClick={()=>setQuestion(q.id)}>{q.title}</button>)}</div><p className="flow-question-reason" role="status">{current.why}</p><div className="source-role-grid">{documents.documents.filter(d=>d.id!=='complaints').map(d=><article className={current.active.includes(d.id)?'active':'inactive'} key={d.id}><span>{current.active.includes(d.id)?'이번 질문의 근거':'이번 질문에서 제외'}</span><h4>{d.title}</h4><p>{roles[d.id]}</p><small>{d.versionLabel || d.publishedDate} · {d.format}</small></article>)}</div><p className="flow-caption">민원법 2026-12-03 시행예정본은 기본 5개 소스와 별도의 시점 비교 자료로 유지합니다.</p></section>;
}

export function RagExplorer() {
  const [selected,setSelected]=useState('ingest');
  const current=ragOperations.find(n=>n.id===selected);
  return <section className="flow-visual rag-explorer"><div className="flow-section-label">RAG / RETRIEVAL → GENERATION</div><h3>RAG의 처리 단계와 확인 지점</h3><p>단계를 선택하면 입력·결과·실패 지점을 확인할 수 있습니다. 일반 RAG 구조를 수업의 자료 기반 작업에 대응한 도식입니다.</p><ol className="rag-pipeline" aria-label="RAG 처리 단계">{ragOperations.map((operation,i)=><li key={operation.id}><button aria-pressed={selected===operation.id} onClick={()=>setSelected(operation.id)}><span>0{i+1}</span><strong>{operation.title}</strong></button></li>)}</ol><div className="rag-operation" role="region" aria-live="polite" aria-label="선택한 RAG 단계"><h4>{current.title}</h4><dl><div><dt>입력</dt><dd>{current.input}</dd></div><div><dt>결과</dt><dd>{current.output}</dd></div><div><dt>실패 지점</dt><dd>{current.failure}</dd></div><div><dt>확인·조정</dt><dd>{current.decision}</dd></div></dl></div><div className="rag-system-line"><span>원문</span><ArrowRight size={15}/><span>변환·청크·색인</span><ArrowRight size={15}/><span>질문에 관련된 근거</span><ArrowRight size={15}/><span>생성</span><ArrowRight size={15}/><span>원문 대조</span></div><p className="flow-caption">개별 서비스의 내부 구현과 설정 가능 범위는 다릅니다. 등록·검색·생성·검증을 동일한 단계로 취급하지 않습니다.</p></section>;
}

export function DiagnosticTree({slug}) {
  const [selected,setSelected]=useState('source');
  const branch=diagnosticBranches.find(b=>b.id===selected);
  return <section className="flow-visual"><div className="flow-section-label">DIAGNOSIS / RETURN PATH</div><h3>오류 유형별 복귀 경로</h3><p>관찰한 문제를 선택합니다. 원인 판정은 원문·입력·소스 기록을 확인한 뒤 내립니다.</p><div className="diagnostic-options" role="group" aria-label="오류 유형 선택">{diagnosticBranches.map(item=><button key={item.id} aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}>{item.label}</button>)}</div><div className="diagnostic-result" role="status"><span>확인할 원인</span><h4>{branch.why}</h4><p>{branch.action}</p><a className="text-btn" href={flowHref(slug,branch.stage)}>{flowStages.find(s=>s.id===branch.stage).title}로 이동<ArrowRight size={15}/></a></div></section>;
}

function HarnessDiagram() {
  const parts=[['지시','목적·독자·출력·완료 기준'],['자료','활성 원문·버전·제외 범위'],['도구','조회·작성·대조·저장'],['상태','확인한 사실·미결·다음 단계'],['검토','통과 기준·사람의 확인·복귀 지점']];
  return <section className="flow-visual"><div className="flow-section-label">HARNESS / WORKING SYSTEM</div><h3>작업을 운영하는 다섯 구성</h3><div className="harness-center">자료 조회 → 작성 → 검토 → 수정 → 저장</div><ul className="harness-grid">{parts.map(([title,text])=><li key={title}><strong>{title}</strong><p>{text}</p></li>)}</ul><p className="flow-caption">이 수업은 사람이 운영할 절차를 설계합니다. 모델·도구 실행 루프를 코드로 구현한 에이전트 하네스와 구분합니다.</p></section>;
}

export function CourseSchedule({ course, onCase }) {
  let elapsed=0;
  const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  return <details className="flow-schedule"><summary>{course.label} 3시간 진행표<span>{course.slug==='beginner'?'3교시 × 50분 · 휴식 20분 · 마무리 10분':'설명·시연 30분 · 단계 실행·분석 120분 · 휴식 20분 · 정리 10분'}</span></summary><ol>{course.schedule.map((slot,i)=>{const from=elapsed;elapsed+=slot.minutes;return <li key={i}><time>{clock(from)}–{clock(elapsed)}</time><span>{slot.lesson?flowLessonCopy[slot.lesson].title:slot.title}</span><small>{slot.minutes}분</small>{slot.lesson&&onCase&&<button className="text-btn" onClick={()=>onCase(slot.lesson)}>적용 사례<ArrowUpRight size={13}/></button>}</li>;})}</ol></details>;
}

export function WorkflowCourse({courseSlug='beginner',onCourse,onCopy,onCase}) {
  const course=webCurriculum.days.find(c=>c.slug===courseSlug)||webCurriculum.days[0];
  const [active,setActive]=useState(()=>resolveFlowStage(location.hash));
  const headerRef=useRef(null),mapRef=useRef(null);
  const node=flowStages.find(s=>s.id===active);
  const content=flowContent[course.slug][active],principle=stagePrinciples[active];
  function showCurrent(){headerRef.current?.focus({preventScroll:true});if(headerRef.current)window.scrollTo({top:headerRef.current.getBoundingClientRect().top+window.scrollY-(window.innerWidth<=760?78:24),behavior:'instant'});}
  useEffect(()=>{const change=()=>setActive(resolveFlowStage(location.hash));window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  useEffect(()=>{
    if(new URLSearchParams(location.hash.split('?')[1]||'').has('stage')||new URLSearchParams(location.hash.split('?')[1]||'').has('topic')){
      headerRef.current?.focus({preventScroll:true});
      if(headerRef.current)window.scrollTo({top:headerRef.current.getBoundingClientRect().top+window.scrollY-(window.innerWidth<=760?78:24),behavior:'instant'});
    }
  },[active]);
  function saveStage(){
    const parts=[course.label,node.title,content.lead,'AI가 줄이는 수고',content.ai,'사람의 판단',content.human,principle.heading,...principle.paragraphs,...content.explanation,'입력',...content.inputs,'결과',...content.outputs,'요청',content.request,'비교·판정 예시',...content.contrast,'통과 기준',content.gate,'공식 참고 자료 · 2026-11-04',...principle.refs.map(id=>flowReferences[id].join('\n'))];
    const url=URL.createObjectURL(new Blob([parts.join('\n\n')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`AI작업흐름-${course.slug}-${active}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <>
    <div className="page-heading flow-page-heading"><div className="eyebrow">AI WORKFLOW / {course.slug.toUpperCase()}</div><h1>{course.label} · {course.title}</h1><p>{course.focus}</p></div>
    <div className="flow-course-switch" role="group" aria-label="작업 흐름 과정 선택">{webCurriculum.days.map((c,i)=><button key={c.slug} className="btn secondary" aria-pressed={c.slug===course.slug} onClick={()=>onCourse(i+1)}>{c.label}<span>{c.title}</span></button>)}</div>
    <section className="flow-course-principle"><span className="flow-section-label">이 과정의 판단</span><p>{course.question}</p><div><span>AI가 맡을 처리</span><ArrowRight size={15}/><span>사람의 확인 지점</span><ArrowRight size={15}/><span>다음 단계의 입력</span></div></section>
    <div ref={mapRef}><WorkflowMap slug={course.slug} active={active} onCurrent={showCurrent}/></div>
    <article className="flow-stage" key={active}>
      <header className="flow-stage-header" ref={headerRef} tabIndex={-1}><div className="flow-stage-header-nav"><button className="text-btn flow-map-return" onClick={()=>{if(mapRef.current)window.scrollTo({top:mapRef.current.getBoundingClientRect().top+window.scrollY-(window.innerWidth<=760?78:24),behavior:'instant'});}}>전체 흐름 보기<ArrowLeft size={14}/></button><button className="text-btn" onClick={saveStage}><Download size={15}/>단계 안내 TXT 저장</button></div><div className="flow-stage-meta"><span>STAGE {node.number} / 07</span><span>{node.owner}</span></div><h2>{node.title}</h2><p>{content.lead}</p></header>
      <StageVisual stage={active} courseSlug={course.slug}/>
      {['inputs','reuse'].includes(active)&&<ContextTree advanced={course.slug==='intermediate'}/>}
      <div className="flow-contribution"><div><span>지금의 번거로움</span><p>{content.friction}</p></div><div><span>AI가 맡을 처리</span><p>{content.ai}</p></div><div><span>사람이 판단할 부분</span><p>{content.human}</p></div></div>
      <section className="flow-section"><h3>{principle.heading}</h3>{principle.paragraphs.map(text=><p key={text}>{text}</p>)}<dl className="flow-term-list">{principle.terms.map(([term,meaning])=><div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl></section>
      <section className="flow-section"><div className="flow-section-label">INPUT → PROCESS → OUTPUT</div><h3>이 단계의 입력과 다음 결과</h3><div className="flow-contract"><div><h4>준비할 입력</h4><ul>{content.inputs.map(text=><li key={text}>{text}</li>)}</ul></div><ArrowRight size={22}/><div><h4>다음 단계로 넘길 것</h4><ul>{content.outputs.map(text=><li key={text}>{text}</li>)}</ul></div></div></section>
      {active==='purpose'&&<EffortComparison/>}
      {active==='inputs'&&course.slug==='intermediate'&&<SourceRoleTree/>}
      {active==='evidence'&&<><RagExplorer/>{course.slug==='intermediate'&&<SourceRoleTree/>}</>}
      {active==='review'&&<><DiagnosticTree slug={course.slug}/><EffortComparison/></>}
      {active==='reuse'&&<><HarnessDiagram/><div className="flow-section"><Suspense fallback={<p>영역별 적용 자료를 불러오는 중입니다.</p>}><ApplicationCases onCopy={onCopy}/></Suspense></div></>}
      <section className="flow-section"><div className="flow-section-label">CASE / WORKING REASON</div><h3>기존 자료에 적용하면</h3>{content.explanation.map(text=><p key={text}>{text}</p>)}<div className="flow-contrast">{content.contrast.map((text,i)=><div key={text}><span>{i===0?'관찰·조건':'해석·처리'}</span><p>{text}</p></div>)}</div></section>
      <CopyRequest text={content.request} onCopy={onCopy}/>
      <div className="flow-gate"><span>다음 단계로 넘길 기준</span><p>{content.gate}</p></div>
      <section className="flow-section flow-linked-cases"><h3>흐름을 실행할 사례</h3><p>자료·요청·중간 결과·검토 기준을 연결해 기록합니다.</p>{content.caseIds.map(id=><button key={id} onClick={()=>onCase(id)}><span>{flowLessonCopy[id].number}</span><div><strong>{flowLessonCopy[id].title}</strong><small>{flowLessonCopy[id].description}</small></div><ArrowUpRight size={18}/></button>)}</section>
      {content.screens.length>0&&<section className="flow-section flow-evidence-screens"><h3>실제 실행과 원문 대조 화면</h3>{content.screenNote&&<p className="flow-screen-note">{content.screenNote}</p>}<RealScreenSpotlight ids={content.screens}/><details className="visual-screen-archive"><summary>캡처 전체와 확대 보기</summary><ScreenGallery ids={content.screens} compact/></details></section>}
      <details className="flow-reading"><summary>관련 개념·도구 사용법</summary><p>필요한 조작과 개념을 참고 자료에서 확인합니다.</p><div>{content.topics.map(topic=><a key={topic} href={`#reference?course=${course.slug}&topic=${topic}`}>{({understand:'AI·모델·서비스',prompt:'요청 구성',plans:'무료·유료 선택',files:'파일 준비',context:'컨텍스트',privacy:'자료 보안',verify:'검증',rag:'RAG·소스 관리',long:'장문 자료',revise:'후속 수정',handoff:'인수인계',transfer:'영역별 적용',templates:'요청 재사용',workflow:'하네스'})[topic]||topic}<ArrowRight size={14}/></a>)}</div></details>
      <section className="flow-references"><span>공식 개념·기능 참고 · 2026-11-04 확인</span>{principle.refs.map(id=><a key={id} href={flowReferences[id][1]} target="_blank" rel="noreferrer">{flowReferences[id][0]}<ArrowUpRight size={13}/></a>)}<p>사례의 해석·요청·판정 예시는 강사 구성입니다. 실제 캡처는 각 화면의 날짜와 사용 자료를 구분해 봅니다.</p></section>
      <nav className="flow-stage-pagination" aria-label="흐름 단계 이동">{flowStages.indexOf(node)>0?<a className="btn secondary" href={flowHref(course.slug,flowStages[flowStages.indexOf(node)-1].id)}><ArrowLeft size={15}/>이전 단계</a>:<span/>}{flowStages.indexOf(node)<6?<a className="btn primary" href={flowHref(course.slug,flowStages[flowStages.indexOf(node)+1].id)}>다음 단계<ArrowRight size={15}/></a>:<button className="btn primary" onClick={()=>onCase(course.lessonIds[0])}>전체 흐름 적용<ArrowRight size={15}/></button>}</nav>
    </article>
    <CourseSchedule course={course} onCase={onCase}/>
  </>;
}
