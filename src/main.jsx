import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, Clipboard, Download, FileText, FolderOpen, HelpCircle, Menu, RotateCcw, Upload, Clock3, ShieldCheck } from 'lucide-react';
import { lessons as teachingLessons, tools } from './content';
import { presentLesson, presentCourse } from './web-copy';
const lessons = teachingLessons.map(presentLesson).sort((a,b)=>Number(a.number)-Number(b.number));
import { emptyState, readState, validateState, workflowProgress, STORAGE_KEY } from './state';
import curriculumData from '../content/curriculum.json';
const curriculum = { ...curriculumData, days: curriculumData.days.map(presentCourse) };
import { DetailedLessonGuide, ScreenGallery } from './LessonGuide';
import { composeLessonPrompt } from './lesson-utils';
import { OfficialLibrary, DocumentCards } from './OfficialDocuments';
const Concepts = lazy(()=>import('./Concepts').then(module=>({default:module.Concepts})));
import { WorkflowCourse, WorkflowMap, CourseSchedule } from './WorkflowCourse';
import { legacyTopicStages } from './flow-curriculum';
import { flowGuides } from './flow-lessons';
import './course-foundations.css';
import { WorkbookDownload, workbookUrl } from './WorkbookDownload';
import captures from '../content/screen-captures.json';
import './style.css';

function download(name, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initialPage() {
  const value = location.hash.slice(1).split('?')[0];
  return ['home', 'beginner', 'intermediate', 'workbook', 'guide', 'documents', 'concepts', 'reference', ...lessons.map(l => l.id)].includes(value) ? value : 'home';
}

function initialCourse() {
  const slug = new URLSearchParams(location.hash.split('?')[1] || '').get('course');
  return slug === 'intermediate' || initialPage() === 'intermediate' ? 2 : lessons.find(l => l.id === initialPage())?.day || 1;
}

function App() {
  const [state, setState] = useState(() => readState(localStorage));
  const [page, setPage] = useState(initialPage);
  const [day, setDay] = useState(initialCourse);
  const [routeKey, setRouteKey] = useState(() => location.hash);
  const [tab, setTab] = useState('guide');
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const mainRef = useRef(null);
  const fileRef = useRef(null);
  const lesson = lessons.find(l => l.id === page);
  const course = curriculum.days[(lesson?.day || day) - 1];
  const classLessons = lessons.filter(l => l.day === (lesson?.day || day));
  const progress = workflowProgress(state);
  const classCount = classLessons.filter(l => progress.completed.includes(l.id)).length;
  const selectTab = id => {
    setTab(id);
    requestAnimationFrame(() => { const el = document.querySelector('.lesson-tabs'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 760 ? 60 : 0), behavior: 'instant' }); });
  };
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [state]);
  useEffect(() => {
    const handler = () => {
      const next=initialPage(); setPage(next); setRouteKey(location.hash);
      const target=curriculum.days.findIndex(c=>c.slug===next); setDay(target>=0 ? target+1 : initialCourse());
      setMenu(false); setTab('guide'); setShowExample(false);
      const params=new URLSearchParams(location.hash.split('?')[1]||'');
      const readingJump=(next==='concepts'&&window.innerWidth<=760&&(params.has('stage')||params.has('topic'))) || (next==='reference'&&window.innerWidth<=900&&params.has('topic'));
      if(!readingJump){window.scrollTo({top:0,behavior:'instant'});mainRef.current?.focus();}
    };
    window.addEventListener('hashchange',handler); return()=>window.removeEventListener('hashchange',handler);
  }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 4000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { document.title = `${lesson?.short || ({ home: '과정 안내', beginner: '초급반', intermediate: '중급반', workbook: '내 작업함', guide: '시작 안내', documents: '실제 문서 자료실', concepts: 'AI 활용 흐름', reference:'개념·도구 참고서' }[page])} — AI WORKROOM`; }, [page]);
  const go = (id, topic, requestedCourse) => {
    const chosen=requestedCourse ? curriculum.days[requestedCourse-1] : course;
    const parameter=id==='concepts' ? 'stage='+(legacyTopicStages[topic]||topic||'purpose') : id==='reference'&&topic ? 'topic='+topic : '';
    const hash=`#${id}${['concepts','reference','guide'].includes(id) ? '?course='+chosen.slug+(parameter?'&'+parameter:'') : ''}`;
    history.pushState(null,'',hash); setRouteKey(hash); setPage(id);
    const target=curriculum.days.findIndex(c=>c.slug===id);
    if(target>=0)setDay(target+1); else if(lessons.some(l=>l.id===id))setDay(lessons.find(l=>l.id===id).day); else if(requestedCourse)setDay(requestedCourse);
    setMenu(false);setTab('guide');setShowExample(false);
    if (lessons.some(l => l.id === id)) setState(s => ({ ...s, current: id }));
    window.scrollTo({ top: 0, behavior: 'instant' }); mainRef.current?.focus();
  };
  const draft = id => state.drafts[id] || { result: '', prompt: '' };
  const update = (id, field, value) => setState(s => ({ ...s, drafts: { ...s.drafts, [id]: { ...draft(id), [field]: value } } }));
  const check = (id,n) => setState(s=>{const current=workflowProgress(s);const values=current.checks[id]||[];return {...s,workflow:{...current,checks:{...current.checks,[id]:values.includes(n)?values.filter(v=>v!==n):[...values,n]}}};});
  const copy = async value => {
    try { await navigator.clipboard.writeText(value); setToast('복사했습니다. AI 도구에 붙여넣어 보세요.'); }
    catch { setToast('복사가 차단되었습니다. 내용을 선택해 직접 복사해 주세요.'); }
  };
  const exportBackup = () => { download('AI-실습실-내작업.json', JSON.stringify(state, null, 2), 'application/json'); setToast('백업 파일을 내려받았습니다.'); };
  const exportText = () => download('AI-실습실-결과물.txt', lessons.map(l => `${l.number}. ${l.title}\n\n내 프롬프트\n${draft(l.id).prompt || '(작성 전)'}\n\n결과물\n${draft(l.id).result || '(작성 전)'}\n\n${'─'.repeat(40)}`).join('\n\n'));
  const importFile = async event => {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    if (file.size > 2000000) { setToast('2MB 이하의 실습실 JSON 백업을 선택해 주세요.'); return; }
    try { const next = validateState(JSON.parse(await file.text())); setConfirm({ type: 'import', state: next }); }
    catch { setToast('가져오지 못했습니다. 실습실에서 내려받은 JSON 백업 파일인지 확인해 주세요.'); }
  };
  const toggleComplete = () => {
    const done = progress.completed.includes(lesson.id);
    if (!done && (!draft(lesson.id).result.trim() || (progress.checks[lesson.id] || []).length < 3)) { setToast('결과물을 작성하고 검토 항목 3개를 확인해 주세요.'); setTab('work'); return; }
    setState(s => {const current=workflowProgress(s);return {...s,workflow:{...current,completed:done?current.completed.filter(id=>id!==lesson.id):[...current.completed,lesson.id]}};});
    setToast(done ? '완료 표시를 해제했습니다.' : '실습을 완료로 표시했습니다.');
  };
  const lessonCard = l => <button className="lesson-card" key={l.id} onClick={() => go(l.id)}>
    <span className="card-number">{l.number}<span>{progress.completed.includes(l.id) ? <CheckCircle2 size={20} /> : <ArrowUpRight size={20} />}</span></span>
    <span className="card-meta">{l.minutes}분 실습 <span>·</span> {l.tool}</span>
    <strong>{l.title}</strong><span className="card-description">{l.description}</span>
    <span className="card-bottom">{progress.completed.includes(l.id) ? '완료한 실습 다시 보기' : draft(l.id).result ? '작성하던 실습 이어가기' : '실습 시작하기'}<ArrowRight size={17} /></span>
  </button>;

  return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>본문으로 바로가기</a>
    <div className="mobile-bar"><button onClick={() => setMenu(!menu)} aria-label="메뉴 열기" aria-expanded={menu}><Menu /></button><b>AI WORKROOM<span>.</span></b><span className="mobile-progress">{classCount}/3 완료</span></div>
    {menu && <button className="scrim" aria-label="메뉴 닫기" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'open' : ''}`} aria-label="주 메뉴">
      <button className="wordmark" onClick={() => go('home')}>AI WORKROOM<span>.</span></button>
      <div className="sidebar-sub">울산대학교 · 생활과 일에 쓰는 AI</div>
      <div className="course-label">WORKSHOP / 2026</div>
      <nav className="primary-nav"><button className={page === 'concepts' ? 'active' : ''} onClick={() => go('concepts')}><BookOpen size={18}/>AI 활용 흐름<ChevronRight size={15}/></button><button className={page === 'documents' ? 'active' : ''} onClick={() => go('documents')}><FileText size={18} />실제 문서 자료실<ChevronRight size={15} /></button>
        <button className={['home','beginner','intermediate'].includes(page) ? 'active' : ''} onClick={() => go('home')}><BookOpen size={18} />과정 안내<ChevronRight size={15} /></button>
        <button className={page === 'concepts' && day === 2 ? 'active' : ''} onClick={()=>go('concepts','evidence',2)}><FileText size={18}/>RAG·근거 조회<ChevronRight size={15}/></button>
        <button className={page === 'reference' ? 'active' : ''} onClick={()=>go('reference','understand')}><BookOpen size={18}/>개념·도구 참고서<ChevronRight size={15}/></button>
        <button className={page === 'workbook' ? 'active' : ''} onClick={() => go('workbook')}><FolderOpen size={18} />내 작업함<span className="nav-count">{Object.values(state.drafts).filter(d => d.result || d.prompt).length}</span></button>
      </nav>
      {[1, 2].map(d => <div className="sidebar-day" key={d}><p>{curriculum.days[d - 1].label}<span>3시간</span></p>
        {lessons.filter(l => l.day === d).map(l => <button className={`lesson-link ${page === l.id ? 'selected' : ''}`} key={l.id} onClick={() => go(l.id)}><span className={`lesson-dot ${progress.completed.includes(l.id) ? 'done' : ''}`}>{progress.completed.includes(l.id) ? <Check size={11} /> : l.number}</span>{l.short}</button>)}
      </div>)}
      <div className="sidebar-bottom"><a className="sidebar-pdf-link" href={workbookUrl} download="울산대학교-AI실습-수강생교재.pdf"><Download size={17}/>수강생 교재 PDF</a><button className={`guide-link ${page === 'guide' ? 'selected' : ''}`} onClick={() => go('guide')}><HelpCircle size={17} />수업 준비 안내</button>
        <div className="sidebar-progress"><div><span>{course.label} 사례 검토</span><b>{Math.round(classCount / 3 * 100)}%</b></div><progress value={classCount} max="3" /><small>{course.label} 적용 사례 {classCount}/3 검토 기록</small></div>
        <p className="local-note">작성 내용은 이 브라우저에 저장됩니다.</p>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div><span>WORKSPACE</span><ChevronRight size={13} /><b>{lesson ? `${course.label} 실습` : { home: '과정 안내', beginner: '초급반', intermediate: '중급반', workbook: '내 작업함', guide: '시작 안내', documents: '실제 문서 자료실', concepts: 'AI 활용 흐름', reference:'개념·도구 참고서' }[page]}</b></div><a className="workbook-top-link" href={workbookUrl} download="울산대학교-AI실습-수강생교재.pdf"><Download size={15}/>수강생 교재 PDF</a><button onClick={exportBackup}><Download size={15} />내 작업 백업</button></header>
      {storageError && <div className="storage-warning" role="alert">브라우저 저장 공간을 사용할 수 없습니다. 페이지를 닫기 전에 내 작업 백업을 내려받으세요.</div>}
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {['home', 'beginner', 'intermediate'].includes(page) && <>
          <section className="hero flow-hero"><div className="hero-copy"><div className="eyebrow"><span className="live-dot"/>생성형 AI · 자료 분석과 문서 작업</div><h1>자료와 문서의 일을<br/><span>AI와 나눠 설계합니다.</span></h1><p>목적과 자료를 정하고, AI가 맡을 처리와<br/>사람이 검토할 지점을 연결합니다.</p><button className="btn primary" onClick={()=>go('concepts','purpose')}>{course.label} 작업 흐름 열기<ArrowRight size={18}/></button><div className="hero-caption">초급·중급 각 3시간 · 공개 원문 · 무료 기능 중심</div></div><div className="hero-art flow-hero-art"><div className="flow-hero-step"><small>사람이 정의</small><strong>목적 · 자료 · 판단 기준</strong></div><ArrowRight/><div className="flow-hero-step ai"><small>AI가 처리</small><strong>추출 · 구조화 · 작성</strong></div><ArrowRight/><div className="flow-hero-step"><small>사람이 검토</small><strong>근거 · 누락 · 다음 행동</strong></div><span>준비부터 검토·수정까지의 전체 수고로 활용을 판단합니다.</span></div></section>
          <section className="flow-home-intro"><div className="flow-section-label">ONE WORKFLOW / TWO COURSES</div><h2>같은 흐름, 다른 자료와 판단의 복잡성</h2><p>초급은 한 자료에서 문서를 완성하는 과정에, 중급은 RAG로 여러 근거를 연결하고 작업 상태를 관리하는 과정에 집중합니다.</p><WorkflowMap slug={course.slug} compact/><div className="flow-home-actions"><button className="btn primary" onClick={()=>go('concepts','purpose',1)}>초급 흐름<ArrowRight size={15}/></button><button className="btn secondary" onClick={()=>go('concepts','evidence',2)}>중급 RAG 흐름<ArrowRight size={15}/></button><button className="text-btn" onClick={()=>go('reference','understand')}>개념·도구 참고서<ArrowUpRight size={15}/></button></div></section>
          <div className="course-strip"><div><Clock3 size={19}/><b>초급반·중급반</b><span>각 3시간 · 독립 수강</span></div><div><Clipboard size={19}/><b>단계 실행·분석 120분</b><span>기본 설명·시연 30분</span></div><div><FolderOpen size={19}/><b>근거와 작업 상태</b><span>최종본·미결·다음 단계 보존</span></div></div>
          <section className="curriculum-section"><div className="section-heading"><div><span className="eyebrow">COURSE / WORKING PROCESS</span><h2>과정 구성</h2></div><button className="text-btn" onClick={()=>go('guide')}>수업 준비 안내<ArrowUpRight size={15}/></button></div><div className="day-switch" role="group" aria-label="수강 과정 선택">{[1,2].map(d=><button key={d} aria-pressed={day===d} className={day===d?'current':''} onClick={()=>go(curriculum.days[d-1].slug)}><span>{curriculum.days[d-1].label}</span>{curriculum.days[d-1].title}<small>3시간</small></button>)}</div><section className="course-entry" aria-label={`${course.label} 과정 안내`}><span className="eyebrow">{course.label} · 3시간</span><h3>{course.outcome}</h3><p>{course.prerequisite}</p><div className="course-start-actions"><button className="btn primary" onClick={()=>go('concepts','purpose')}>전체 흐름과 기본 개념<ArrowRight size={15}/></button><button className="btn secondary" onClick={()=>go(classLessons[0].id)}>적용 사례 열기<ArrowRight size={15}/></button></div></section><div className="lesson-grid">{classLessons.map(lessonCard)}</div><CourseSchedule course={course} onCase={go}/></section>
          <div className="official-update"><b>원문과 실제 실행 기록</b> 편람 383쪽 · 업무계획 17쪽 · 공고·붙임 · 관련 법령 <button className="text-btn" onClick={()=>go('documents')}>자료 역할과 원문 확인<ArrowUpRight size={15}/></button></div>
          <section className="tools-section"><div><span className="eyebrow">TOOLS / ROLE</span><h2>도구는 작업 단계에 맞춰 선택합니다</h2><p>추출·작성은 파일을 처리할 수 있는 도구에서, 자료 기반 질문과 인용 대조는 NotebookLM에서 실행합니다. 정확한 계산과 정형 표 처리는 검산 가능한 도구와 나눠 사용합니다.</p></div><div className="tool-grid">{tools.map(t=><a key={t.name} href={t.href} target="_blank" rel="noreferrer"><strong>{t.name}<ArrowUpRight size={16}/></strong><span>{t.label}</span></a>)}</div><small>실제 화면 {captures.screens.length}개는 2026-10-14 실행 기록입니다. 계정·기능·사용 한도는 도구에서 확인하고, 필요한 조작은 참고서를 활용합니다.</small></section><WorkbookDownload/>
        </>}
        {page === 'concepts' && <WorkflowCourse key={course.slug+'-'+routeKey} courseSlug={course.slug} onCourse={d=>go('concepts','purpose',d)} onCopy={copy} onCase={go}/>}
        {page === 'reference' && <Suspense fallback={<p>개념·도구 참고서를 불러오는 중입니다.</p>}><Concepts key={`${day}-${routeKey}`} courseIndex={day} onCourse={d=>go('reference','understand',d)} onCopy={copy} onLesson={go}/></Suspense>}
        {page === 'documents' && <><section className="flow-home-intro"><h2>자료를 역할과 질문 범위로 선택합니다</h2><p>작성 기준, 사업 사실, 다른 업무의 계획을 구분합니다. 원문 전체와 실제 인용 대조 화면을 보존합니다.</p><button className="btn secondary" onClick={()=>go('concepts','inputs',2)}>소스 역할·선택 트리<ArrowRight size={15}/></button></section><OfficialLibrary onCopy={copy} onStart={()=>go('meeting')}/></>}
        {lesson && <>
          <div className="lesson-heading"><button className="back-link" onClick={() => { setDay(lesson.day); go(course.slug); }}><ArrowLeft size={15} />과정 구성</button><div className="eyebrow">{course.label}<span>/</span>CASE {lesson.number}</div><h1>{lesson.title}</h1><p>{lesson.description}</p><div className="lesson-tags"><span><Clock3 size={15} />{lesson.minutes}분 실습</span><span>{lesson.tool}</span>{progress.completed.includes(lesson.id) && <span className="complete-tag"><CheckCircle2 size={15} />검토 기록 있음</span>}</div></div>
          <div className="official-update"><button className="text-btn" onClick={() => { setDay(lesson.day); go('concepts',lesson.stage); }}>이 사례의 작업 흐름<ArrowRight size={15}/></button> 자료 준비 → AI 도구에서 실행 → 결과 검토·저장 <button className="text-btn" onClick={() => go('documents')}>전체 자료실</button></div><div className="lesson-layout"><div className="lesson-main"><div className="lesson-tabs" role="tablist" aria-label="실습 단계">{[['guide', '1. 실습 안내'], ['materials', '2. 자료·프롬프트'], ['screens', '실제 화면'], ['work', '3. 내 작업']].map(([id, name]) => <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab === id} onClick={() => selectTab(id)}>{name}{id === 'screens' && <span className="tab-count">{flowGuides[lesson.id].screens.length}</span>}</button>)}</div>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-content">
              {tab === 'guide' && <DetailedLessonGuide lesson={lesson} onMaterials={() => selectTab('materials')} onCopy={copy} />}
              {tab === 'screens' && <>{flowGuides[lesson.id].screenNote&&<p className="flow-screen-note">{flowGuides[lesson.id].screenNote}</p>}<ScreenGallery ids={flowGuides[lesson.id].screens}/></>}
              {tab === 'materials' && <><div className="screen-shortcut"><BookOpen size={18} /><div><b>입력·응답 화면 확인</b><p>파일 첨부와 요청 입력, 응답 검토 위치를 확인하세요.</p></div><button onClick={() => selectTab('screens')}>실제 화면 보기<ArrowUpRight size={15} /></button></div><div className="block-heading"><h2>실습 자료</h2></div><p className="muted">{lesson.source}</p><div className="lesson-material-docs"><DocumentCards ids={lesson.documentIds} onCopy={copy}/></div><div className="block-heading"><h2>시작 프롬프트</h2><button className="text-btn" onClick={() => copy(lesson.prompt)}><Clipboard size={15} />복사</button></div><pre className="prompt-content">{lesson.prompt}</pre><p className="muted">원문 파일 전체를 AI 도구에 첨부한 뒤 요청문을 입력하세요. ‘프롬프트 + 파일 준비 안내 복사’에는 요청문과 준비할 파일 목록이 포함됩니다.</p><div className="material-actions"><button className="btn secondary" onClick={() => copy(composeLessonPrompt(lesson))}><Clipboard size={16} />프롬프트 + 파일 준비 안내 복사</button><button className="btn primary" onClick={() => selectTab('work')}>내 작업에 기록하기<ArrowRight size={16} /></button></div></>}
              {tab === 'work' && <><div className="block-heading"><h2>실습 결과물</h2><span className="save-label">{storageError ? '저장 불가 · 백업 필요' : '이 브라우저에 자동 저장'}</span></div><label className="field-label" htmlFor="result">AI 초안을 붙여넣고, 직접 검토한 최종 문서로 다듬어 보세요.</label><textarea id="result" maxLength={100000} rows={12} value={draft(lesson.id).result} onChange={e => update(lesson.id, 'result', e.target.value)} placeholder="여기에 결과물을 기록하세요. 개인정보나 회사 기밀은 입력하지 마세요." /><label className="field-label strong" htmlFor="my-prompt">다음에도 쓸 내 프롬프트</label><textarea id="my-prompt" maxLength={100000} rows={6} value={draft(lesson.id).prompt} onChange={e => update(lesson.id, 'prompt', e.target.value)} placeholder="다시 사용할 요청문과 수정 조건을 기록하세요." /><h2 className="block-title">결과 검토 항목</h2><div className="checklist">{lesson.checks.map((s, n) => <label key={n}><input type="checkbox" checked={(progress.checks[lesson.id] || []).includes(n)} onChange={() => check(lesson.id, n)} /><span>{s}</span></label>)}</div><div className="material-actions"><button className="btn primary" onClick={toggleComplete}><Check size={17} />{progress.completed.includes(lesson.id) ? '완료 표시 해제' : '검토 완료 기록'}</button><button className="btn secondary" disabled={!draft(lesson.id).result.trim() && !draft(lesson.id).prompt.trim()} onClick={() => download(`실습${lesson.number}-내작업.txt`, `${lesson.title}\n\n내 프롬프트\n${draft(lesson.id).prompt}\n\n결과물\n${draft(lesson.id).result}`)}><Download size={16} />내 작업 내려받기</button></div><button className="example-toggle" aria-expanded={showExample} onClick={() => setShowExample(!showExample)}>{showExample ? '강사 예시 닫기' : '강사 예시 보기'}<ChevronRight size={17} className={showExample ? 'rotate' : ''} /></button>{showExample && <pre className="source-content">{lesson.example}</pre>}</>}
            </div>
          </div><aside className="lesson-aside"><span className="eyebrow">WORKFLOW</span><h3>실습 진행 순서</h3>{['안내 읽기', 'AI 도구에서 실습', '검토하고 저장'].map((s, i) => <div className={`workflow-step ${(tab === 'screens' ? 1 : ['guide', 'materials', 'work'].indexOf(tab)) === i ? 'active' : ''}`} key={s}><span>0{i + 1}</span>{s}</div>)}<div className="aside-tools"><b>AI 도구 열기</b>{tools.filter(t => ['document', 'meeting', 'sources'].includes(lesson.id) ? ['NotebookLM', 'Gemini'].includes(t.name) : ['ChatGPT', 'Gemini', 'Claude'].includes(t.name)).map(t => <a href={t.href} target="_blank" rel="noreferrer" key={t.name}>{t.name}<ArrowUpRight size={15} /></a>)}</div><p className="aside-note"><ShieldCheck size={18} />초안은 AI가, 최종 확인은 내가.<br />자료에 없는 사실은 만들지 마세요.</p></aside></div>
          <div className="lesson-pagination">{classLessons.indexOf(lesson) > 0 ? <button onClick={() => go(classLessons[classLessons.indexOf(lesson) - 1].id)}><ArrowLeft size={16} />이전 실습</button> : <span />}{classLessons.indexOf(lesson) < classLessons.length - 1 ? <button onClick={() => go(classLessons[classLessons.indexOf(lesson) + 1].id)}>다음 실습<ArrowRight size={16} /></button> : <button onClick={() => go('workbook')}>내 작업함 보기<ArrowRight size={16} /></button>}</div>
        </>}
        {page === 'workbook' && <><div className="page-heading"><div className="eyebrow">MY WORKBOOK</div><h1>작업 기록과 검토 결과</h1><p>작성한 결과물과 요청문을 확인하고, 파일로 저장하세요.</p></div><div className="workbook-toolbar"><span>{Object.values(state.drafts).filter(d => d.result || d.prompt).length}개 실습 기록</span><div><button className="btn secondary" onClick={() => fileRef.current?.click()}><Upload size={16} />백업 가져오기</button><button className="btn secondary" onClick={exportText}><FileText size={16} />결과물 텍스트 저장</button><button className="btn primary" onClick={exportBackup}><Download size={16} />백업 파일 저장</button></div></div><div className="notice"><ShieldCheck size={19} /><p>작성 내용은 <b>현재 기기·브라우저</b>에만 저장됩니다. 다른 기기로 옮길 때는 JSON 백업을 내려받아 가져오세요. 공용 PC에서는 백업 후 기록을 삭제하세요.</p></div><p className="old-work-notice">기존 작성 내용과 이전 검토 기록은 보존합니다. 새 흐름의 검토 기준 확인은 별도로 기록하며, JSON 백업에 함께 포함됩니다.</p><div className="workbook-list">{lessons.map(l => <article key={l.id}><div className="workbook-title"><span className="card-number">{l.number}</span><div><small>{curriculum.days[l.day - 1].label} · {progress.completed.includes(l.id) ? '완료' : draft(l.id).result || draft(l.id).prompt ? '작성 중' : '작성 전'}</small><h2>{l.title}</h2></div><button className="text-btn" onClick={() => { go(l.id); setTab('work'); }}>열기<ArrowUpRight size={16} /></button></div>{draft(l.id).result || draft(l.id).prompt ? <div className="draft-preview"><p>{draft(l.id).result || draft(l.id).prompt}</p><span>{draft(l.id).result.length}자 · 프롬프트 {draft(l.id).prompt ? '저장됨' : '작성 전'}</span></div> : <p className="empty-copy">저장된 내용이 없습니다. ‘열기’에서 결과물과 프롬프트를 작성하세요.</p>}</article>)}</div><div className="reset-area"><span>이 브라우저의 모든 실습 기록을 지웁니다.</span><button onClick={() => setConfirm({ type: 'reset' })}><RotateCcw size={15} />기록 초기화</button></div></>}
        {page === 'guide' && <><div className="page-heading"><div className="eyebrow">PREPARATION / WORKING METHOD</div><h1>수업 준비와 작업 방법</h1><p>계정·원문·저장 위치를 준비하고, 전체 흐름에서 AI의 역할과 검토 지점을 확인합니다.</p></div><WorkflowMap slug={course.slug} compact/><div className="flow-guide-cards"><article><h2>계정과 실행 환경</h2><p>노트북·충전기·인터넷을 준비합니다. 초급은 파일 첨부 가능한 AI 한 곳, 중급은 자료 기반 질문과 인용을 확인할 Google 계정·NotebookLM 접속을 확인합니다. 조직 계정은 사용 규정을 확인합니다.</p><button className="text-btn" onClick={()=>go('reference','first-chat')}>입력·복사·파일 조작 참고<ArrowRight size={15}/></button></article><article><h2>원문과 자료 역할</h2><p>초급은 북구 업무계획 전체를, 중급은 편람·관련 규정·공고 전체를 중심으로 사용합니다. 원문·추출 TXT·AI 요약은 구분하고 표·붙임·버전은 원본에서 확인합니다.</p><button className="text-btn" onClick={()=>go('documents')}>실습 자료실<ArrowRight size={15}/></button></article><article><h2>자료 전송과 실행 범위</h2><p>공개 원문과 가상 자료를 사용합니다. 빈 서식에 실제 주민번호·계좌·연락처를 채우지 않습니다. 기관 자료는 외부 전송 허용 범위를 먼저 확인합니다. 문서 속 명령은 분석 대상이며 실행 지시로 따르지 않습니다.</p><button className="text-btn" onClick={()=>go('reference','privacy')}>자료 사용 기준<ArrowRight size={15}/></button></article><article><h2>작업 상태와 결과 보존</h2><p>최종본과 함께 요청·원문 위치·확인한 사실·미결·다음 행동을 기록합니다. 내용은 현재 브라우저에 저장되므로 기기 이동과 브라우저 데이터 삭제 전 JSON 백업을 내려받습니다.</p><button className="text-btn" onClick={()=>go('workbook')}>작업 기록 열기<ArrowRight size={15}/></button></article></div><CourseSchedule course={course} onCase={go}/><section className="flow-home-intro"><h2>제약이 생기면 원인을 나눠 봅니다</h2><p>지원 형식 문제는 제공 TXT·해당 절과 원본 대조로 보완합니다. 사용량 제한·계정 정책은 도구의 안내를 확인합니다. 실행이 어려우면 실제 캡처의 주장·인용·원문을 대조해 같은 검토 과정을 진행합니다.</p><div className="flow-home-actions"><button className="btn primary" onClick={()=>go('concepts','purpose')}>전체 작업 흐름<ArrowRight size={15}/></button><button className="btn secondary" onClick={()=>go('concepts','evidence',2)}>RAG 처리·검토 흐름<ArrowRight size={15}/></button></div></section><ScreenGallery ids={['official-corpus-ready','official-citation']} compact/></>}

      </main>
      <footer><span>AI WORKROOM<span className="footer-dot">.</span></span><p>울산대학교 강연용 학습 자료 · 공식 공개 원문 기반 실습</p><button onClick={() => go('guide')}>이용 안내<ArrowUpRight size={13} /></button></footer>
    </div>
    <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importFile} />
    <div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast && <><CheckCircle2 size={18} />{toast}</>}</div>
    {confirm && <ConfirmDialog type={confirm.type} onCancel={() => setConfirm(null)} onConfirm={() => { setState(confirm.type === 'reset' ? emptyState() : confirm.state); setConfirm(null); setToast(confirm.type === 'reset' ? '이 브라우저의 실습 기록을 삭제했습니다.' : '백업을 가져왔습니다.'); }} />}
  </>;
}
function ConfirmDialog({ type, onCancel, onConfirm }) {
  const cancelRef = useRef(null);
  useEffect(() => { const before = document.activeElement; cancelRef.current?.focus(); const escape = e => { if (e.key === 'Escape') onCancel(); }; document.addEventListener('keydown', escape); return () => { document.removeEventListener('keydown', escape); before?.focus(); }; }, []);
  return <div className="modal-backdrop"><div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" onKeyDown={e => { if (e.key === 'Tab') { const buttons = [...e.currentTarget.querySelectorAll('button')]; const first = buttons[0], last = buttons.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } }}><h2 id="confirm-title">{type === 'reset' ? '실습 기록을 모두 지울까요?' : '백업으로 현재 기록을 바꿀까요?'}</h2><p id="confirm-description">{type === 'reset' ? '현재 브라우저의 결과물·프롬프트·완료 표시가 삭제됩니다. 필요한 기록은 먼저 백업해 주세요.' : '현재 브라우저의 기록을 선택한 백업 내용으로 교체합니다. 기존 기록이 필요하면 취소 후 백업해 주세요.'}</p><div><button ref={cancelRef} className="btn secondary" onClick={onCancel}>취소</button><button className="btn primary" onClick={onConfirm}>{type === 'reset' ? '모두 삭제' : '가져오기'}</button></div></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
