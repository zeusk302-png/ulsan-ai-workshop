import React, { useState } from 'react';
import { ArrowRight, ArrowDown, ArrowUpRight, Check, CheckCheck, FileText, Files, GitBranch, Layers3, ListFilter, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import catalog from '../content/official-documents.json';
import captures from '../content/screen-captures.json';
import { weeklyExamples, ragExamples, responsibilityColumns, responsibilityRows } from './visual-examples';
import './learning-visuals.css';

const docNames={manual:'행정업무운영 편람',regulation:'행정업무 규정',rules:'시행규칙',notice:'중구 사업 공고',weekly:'북구 업무계획'};
const sourceUrl=id=>catalog.documents.find(d=>d.id===id)?.sourceUrl;

function VisualHeader({number,title,children}) {
  return <header className="lesson-visual-heading"><div><span className="visual-kicker">WORKING VIEW / {number}</span><h3>{title}</h3></div>{children}</header>;
}

export function HeroWorkPreview({advanced=false,onOpen}) {
  const item=weeklyExamples[0];
  return <div className="hero-work-preview"><div className="hero-preview-label"><FileText size={16}/><span>{advanced?'편람·규정·공고 5개':'북구 업무계획 17쪽'}</span><small>보존한 공개 원문</small></div><div className="hero-source-excerpt"><span>원문에서</span><strong>{advanced?'문서 작성 기준 조회':item.title}</strong><p>{advanced?ragExamples.format.evidence[0].quote:`일시: ${item.date} / 참석 대상: ${item.audience}`}</p></div><div className="hero-transform-label"><ArrowDown size={18}/><span>{advanced?'소스 선택 → 근거 조회':'AI 추출 → 공통 구조로 변환'}</span></div><div className="hero-result-preview"><span>{advanced?'근거가 있는 문장':'검토할 수 있는 항목표'}</span>{advanced?<><p>{ragExamples.format.claim}</p><small>근거: 시행규칙 제4조제3항</small></>:<dl>{[['유형',item.type],['일정',item.date],['대상',item.audience]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}</div><button onClick={onOpen}>변환 과정 살펴보기<ArrowRight size={16}/></button></div>;
}

export function ResponsibilityView() {
  return <section className="lesson-visual responsibility-view" aria-label="사람과 AI의 작업 분담">
    <VisualHeader number="01" title="어느 단계의 수고를 나눌 것인가"><span className="visual-label">전체 작업 기준</span></VisualHeader>
    <div className="responsibility-scroll" role="region" aria-label="작업 분담 표 · 좁은 화면에서는 좌우로 이동" tabIndex={0}><table><thead><tr><th scope="col">담당과 결과</th>{responsibilityColumns.map((label,i)=><th scope="col" key={label}><span>0{i+1}</span>{label}</th>)}</tr></thead><tbody>{responsibilityRows.map(row=><tr key={row.id} className={'responsibility-'+row.id}><th scope="row">{row.id==='human'?<UserRound size={18}/>:row.id==='ai'?<Layers3 size={18}/>:<FileText size={18}/>} {row.label}</th>{row.cells.map(cell=><td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
    <div className="visual-takeaway"><GitBranch size={20}/><p><b>AI 활용의 단위는 문서 한 장보다 처리 단계입니다.</b> 추출과 재구성에 맡길 수고가 있는지, 준비·검토 부담까지 포함해 판단합니다.</p></div>
  </section>;
}

export function DocumentTransform({stage='structure'}) {
  const [selected,setSelected]=useState('education');
  const [view,setView]=useState(stage==='draft'?'draft':stage==='review'?'review':'table');
  const item=weeklyExamples.find(e=>e.id===selected);
  return <section className="lesson-visual document-transform" aria-label="원문에서 결과로 변환하는 사례">
    <VisualHeader number="02" title="같은 원문이 어떻게 결과로 바뀌는가"><span className="visual-label">17쪽 업무계획 · 설명용 재구성</span></VisualHeader>
    <div className="visual-example-picker" role="group" aria-label="업무계획 항목 선택">{weeklyExamples.map(example=><button key={example.id} aria-pressed={selected===example.id} onClick={()=>setSelected(example.id)}><FileText size={16}/>{example.label}<span>{example.title}</span></button>)}</div>
    <div className="transform-canvas">
      <article className="source-paper"><div className="paper-topline"><span>원문 발췌</span><small>PDF 3쪽 / 본문 1쪽</small></div><h4>기획예산실</h4><pre>{item.quote}</pre><div className="paper-source"><FileText size={15}/><span>2026년 2월 3~4주 주간업무계획</span><a href={sourceUrl('weekly')} target="_blank" rel="noreferrer" aria-label="북구 업무계획 공식 게시물 열기"><ArrowUpRight size={16}/></a></div></article>
      <div className="transform-bridge" aria-label="AI 추출·재구성"><ListFilter size={22}/><span>추출<br/>재구성</span><ArrowRight size={21}/></div>
      <article className="result-paper"><div className="result-view-switch" role="group" aria-label="결과 표현 선택">{[['table','구조화 표'],['draft','문서 초안'],['review','주장 검토']].map(([id,label])=><button key={id} aria-pressed={view===id} onClick={()=>setView(id)}>{label}</button>)}</div>
        <div className="transform-result" aria-live="polite">{view==='table'?<><span className="result-type"><Layers3 size={15}/>기준에 따른 분류 예</span><h4>{item.title}</h4><dl>{[['유형',item.type],['일정',item.date],['장소',item.place],['대상',item.audience],['근거','PDF 3쪽 · 기획예산실']].map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><p className="classification-reason">{item.reason}</p></>:view==='draft'?<><span className="result-type"><FileText size={15}/>공유 메모 · 강사 작성 예</span><h4>교육·행정 일정 검토</h4><p>{item.corrected}</p><p>{item.date} / {item.place}</p><div className="fact-lock"><ShieldCheck size={16}/><span>일정·대상·예정 상태를 유지합니다.</span></div></>:<><span className="result-type"><ShieldCheck size={15}/>원문이 주장 전체를 지지하는가?</span><div className="claim-before"><span><X size={14}/>근거를 넘어선 표현</span><p>{item.wrong}</p></div><div className="claim-after"><span><Check size={14}/>근거 범위에 맞춘 표현</span><p>{item.corrected}</p></div></>}</div>
      </article>
    </div>
    <div className="visual-takeaway"><UserRound size={21}/><p><b>사람이 확인할 판단</b>{item.verdict}</p></div>
    <p className="visual-provenance">원문 일부를 발췌해 강사가 분류·초안·검토 예를 구성했습니다. 새 AI 실행 결과가 아닙니다. 2026년 2월 당시 계획이며 현재 모집·완료 사실로 사용하지 않습니다.</p>
  </section>;
}

export function RagEvidenceView() {
  const [mode,setMode]=useState('format');
  const [selected,setSelected]=useState('form');
  const example=ragExamples[mode];
  const evidence=example.evidence.find(e=>e.id===selected)||example.evidence[0];
  return <section className="lesson-visual rag-evidence-view" aria-label="RAG의 자료·근거·주장 연결">
    <VisualHeader number="03" title="RAG는 문서와 답변 사이에 근거를 연결합니다"><span className="visual-label">조회 과정 설명도</span></VisualHeader>
    <div className="rag-question-picker" role="group" aria-label="RAG 설명 사례 선택">{Object.entries(ragExamples).map(([id,value])=><button key={id} aria-pressed={mode===id} onClick={()=>{setMode(id);setSelected(value.evidence[0].id);}}><Search size={16}/>{value.label}</button>)}</div>
    <div className="rag-question"><span>QUESTION</span><strong>{example.question}</strong></div>
    <div className="rag-evidence-canvas">
      <section className="rag-corpus"><header><Files size={18}/><h4>등록한 자료</h4><span>5개</span></header><p>질문에 맞는 범위 선택</p><ul>{Object.entries(docNames).map(([id,name])=><li key={id} className={example.active.includes(id)?'selected':'excluded'}><FileText size={15}/><span>{name}</span>{example.active.includes(id)?<Check size={14}/>:<X size={13}/>}</li>)}</ul><div className="corpus-legend"><span><i/>조회 범위</span><span>회색: 이번 질문에서 제외</span></div></section>
      <div className="evidence-arrow"><ArrowRight size={21}/><span>관련 구절</span></div>
      <section className="rag-fragments"><header><Search size={18}/><h4>근거 후보</h4></header><p>근거를 선택해 원문 확인</p><div className="fragment-list">{example.evidence.map((entry,i)=><button key={entry.id} aria-pressed={evidence.id===entry.id} onClick={()=>setSelected(entry.id)}><span className="evidence-number">{String(i+1).padStart(2,'0')}</span><div><strong>{entry.label}</strong><blockquote>{entry.quote}</blockquote></div></button>)}</div><a className="evidence-source" href={`${import.meta.env.BASE_URL}documents/text/${evidence.file}.txt`} target="_blank" rel="noreferrer">선택 근거의 전문 TXT<ArrowUpRight size={14}/></a></section>
      <div className="evidence-arrow"><ArrowRight size={21}/><span>근거로 생성</span></div>
      <section className="rag-answer"><header><ShieldCheck size={18}/><h4>주장과 판정</h4></header><span className={'evidence-state '+(mode==='amount'?'unresolved':'supported')}>{mode==='amount'?<GitBranch size={14}/>:<CheckCheck size={14}/>} {example.state}</span><p className="evidence-claim">{example.claim}</p><div className="evidence-verdict"><span>원문 대조 후 남길 상태</span><p>{example.note}</p></div></section>
    </div>
    <div className="rag-return-line"><ArrowDown size={16}/><span>근거가 없거나 범위가 다르면</span><ArrowRight size={15}/><strong>질문·소스 선택으로 돌아갑니다.</strong></div>
    <p className="visual-provenance">보존한 공개 원문으로 구성한 설명도입니다. 실제 서비스의 조회 결과·검색 순위·내부 구현을 재현한 화면은 아닙니다.</p>
  </section>;
}

export function ContextTransferView({mode='current',advanced=false}) {
  const handoff=mode==='handoff',switching=mode==='switch';
  const parts=[
    {title:'근거·상충 처리 규칙',detail:'원문 위치 표시 · 없는 정보는 미확인',keep:true},
    {title:switching?'공고의 금액·접수기한':'검토한 사실과 원문 위치',detail:switching?'이전 업무의 사실':'사람이 확인한 항목만 전달',keep:!switching},
    {title:'미결 항목',detail:'상충·누락·다음 확인 질문',keep:!switching},
    {title:'버린 초안·오류 값',detail:'수정 전 주장과 잘못된 숫자',keep:false}
  ];
  return <div className="context-transfer-view">
    <div className="context-payload"><span className="context-panel-label">{switching?'이전 작업 · 중구 공고':handoff?'이전 대화의 작업 상태':'현재 대화의 정보'}</span><ul>{parts.map(part=><li key={part.title} className={part.keep?'keep':'leave'}><span>{part.keep?<Check size={15}/>:<X size={15}/>}</span><div><strong>{part.title}</strong><small>{part.detail}</small></div></li>)}</ul></div>
    <div className="context-transfer-arrow"><ListFilter size={23}/><span>{switching?'업무 전환':handoff?'검토 후 전달':'현재 범위 선택'}</span><ArrowRight size={22}/></div>
    <div className="context-brief"><div className="context-panel-label">{switching?'다음 작업 · 북구 업무계획':handoff?'새 대화에 제공할 작업 묶음':'이번 요청에 필요한 작업 묶음'}</div><h4>{switching?'새 자료와 목적부터 교체':handoff?'확인한 상태와 원문을 함께':'목적·자료·상태를 명시'}</h4><ol><li><span>목적</span>{switching?'교육·모집 항목 분류':'현재 결과물과 판단 기준'}</li><li><span>자료</span>{switching?'북구 업무계획 원문':advanced?'선택한 원문·규정·버전':'업무계획 원문·근거 위치'}</li><li><span>상태</span>{switching?'이전 공고의 사실 제외':'확인한 사실 / 미결 분리'}</li><li><span>다음</span>{switching?'새 분류 기준과 출력 열':'다음 요청 한 단계'}</li></ol><div className="context-original"><Files size={18}/><span>{handoff?'필요 원문은 새 대화에 다시 제공합니다.':'원문 전체는 별도로 보관합니다.'}</span></div></div>
  </div>;
}

export function RealScreenSpotlight({ids}) {
  const screens=ids.map(id=>captures.screens.find(s=>s.id===id)).filter(Boolean);
  const [selected,setSelected]=useState(0);
  const screen=screens[selected]||screens[0];
  if(!screen)return null;
  return <section className="real-screen-spotlight"><div className="spotlight-description"><span className="visual-kicker">ACTUAL CAPTURE / {captures.capturedOn}</span><h3>실제 화면에서 확인</h3><p>{screen.title}</p><ol>{screen.focus.map(point=><li key={point}>{point}</li>)}</ol><div className="spotlight-picker" role="group" aria-label="크게 볼 실제 화면">{screens.map((s,i)=><button key={s.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{String(i+1).padStart(2,'0')}<span>{s.title}</span></button>)}</div></div><figure><a href={`${import.meta.env.BASE_URL}screens/${screen.file}`} target="_blank" rel="noreferrer" aria-label={`${screen.title} 원본 확대`}><img src={`${import.meta.env.BASE_URL}screens/${screen.file}`} width={screen.width} height={screen.height} alt={screen.alt} loading="lazy"/><span>원본 화면 열기<ArrowUpRight size={15}/></span></a><figcaption>실제 캡처 · 답변의 수치·쪽수는 원문과 대조합니다.</figcaption></figure></section>;
}

export function StageVisual({stage,courseSlug}) {
  if(stage==='purpose')return <ResponsibilityView/>;
  if(courseSlug==='intermediate'&&['evidence','structure','draft','review'].includes(stage))return <RagEvidenceView/>;
  if(stage==='evidence')return <DocumentTransform stage="review"/>;
  if(['structure','draft','review'].includes(stage))return <DocumentTransform stage={stage}/>;
  return null;
}
