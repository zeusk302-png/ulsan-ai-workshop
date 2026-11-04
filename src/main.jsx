import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, Clipboard, Download, FileText, FolderOpen, HelpCircle, Menu, RotateCcw, Upload, Clock3, ShieldCheck } from 'lucide-react';
import { lessons as teachingLessons, tools } from './content';
import { presentLesson, presentCourse } from './web-copy';
const lessons = teachingLessons.map(presentLesson);
import { emptyState, readState, validateState, STORAGE_KEY } from './state';
import curriculumData from '../content/curriculum.json';
const curriculum = { ...curriculumData, days: curriculumData.days.map(presentCourse) };
import { walkthroughs } from './walkthroughs';
import { DetailedLessonGuide, ScreenGallery, Foundations } from './LessonGuide';
import { composeLessonPrompt } from './lesson-utils';
import { OfficialLibrary, DocumentCards } from './OfficialDocuments';
import { Concepts } from './Concepts';
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
  return ['home', 'beginner', 'intermediate', 'workbook', 'guide', 'documents', 'concepts', ...lessons.map(l => l.id)].includes(value) ? value : 'home';
}

function initialCourse() {
  const slug = new URLSearchParams(location.hash.split('?')[1] || '').get('course');
  return slug === 'intermediate' || initialPage() === 'intermediate' ? 2 : lessons.find(l => l.id === initialPage())?.day || 1;
}

function App() {
  const [state, setState] = useState(() => readState(localStorage));
  const [page, setPage] = useState(initialPage);
  const [day, setDay] = useState(initialCourse);
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
  const classCount = classLessons.filter(l => state.completed.includes(l.id)).length;
  const selectTab = id => {
    setTab(id);
    requestAnimationFrame(() => { const el = document.querySelector('.lesson-tabs'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 760 ? 60 : 0), behavior: 'instant' }); });
  };
  const count = state.completed.length;
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [state]);
  useEffect(() => { const handler = () => { const next = initialPage(); setPage(next); const target = curriculum.days.findIndex(c => c.slug === next); if (target >= 0) setDay(target + 1); else setDay(initialCourse()); setTab('guide'); setShowExample(false); window.scrollTo({ top: 0, behavior: 'instant' }); mainRef.current?.focus(); }; window.addEventListener('hashchange', handler); return () => window.removeEventListener('hashchange', handler); }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 4000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { document.title = `${lesson?.short || ({ home: '실습 둘러보기', beginner: '초급반', intermediate: '중급반', workbook: '내 작업함', guide: '시작 안내', documents: '실제 문서 자료실', concepts: 'AI 개념·사용법' }[page])} — AI WORKROOM`; }, [page]);
  const go = id => {
    history.pushState(null, '', `#${id}${['concepts','guide'].includes(id) ? '?course=' + course.slug : ''}`); setPage(id); const target = curriculum.days.findIndex(c => c.slug === id); if (target >= 0) setDay(target + 1); else if (lessons.some(l => l.id === id)) setDay(lessons.find(l => l.id === id).day); setMenu(false); setTab('guide'); setShowExample(false);
    if (lessons.some(l => l.id === id)) setState(s => ({ ...s, current: id }));
    window.scrollTo({ top: 0, behavior: 'instant' }); mainRef.current?.focus();
  };
  const draft = id => state.drafts[id] || { result: '', prompt: '' };
  const update = (id, field, value) => setState(s => ({ ...s, drafts: { ...s.drafts, [id]: { ...draft(id), [field]: value } } }));
  const check = (id, n) => setState(s => { const values = s.checks[id] || []; return { ...s, checks: { ...s.checks, [id]: values.includes(n) ? values.filter(v => v !== n) : [...values, n] } }; });
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
    const done = state.completed.includes(lesson.id);
    if (!done && (!draft(lesson.id).result.trim() || (state.checks[lesson.id] || []).length < 3)) { setToast('결과물을 작성하고 검토 항목 3개를 확인해 주세요.'); setTab('work'); return; }
    setState(s => ({ ...s, completed: done ? s.completed.filter(id => id !== lesson.id) : [...s.completed, lesson.id] }));
    setToast(done ? '완료 표시를 해제했습니다.' : '실습을 완료로 표시했습니다.');
  };
  const lessonCard = l => <button className="lesson-card" key={l.id} onClick={() => go(l.id)}>
    <span className="card-number">{l.number}<span>{state.completed.includes(l.id) ? <CheckCircle2 size={20} /> : <ArrowUpRight size={20} />}</span></span>
    <span className="card-meta">{l.minutes}분 실습 <span>·</span> {l.tool}</span>
    <strong>{l.title}</strong><span className="card-description">{l.description}</span>
    <span className="card-bottom">{state.completed.includes(l.id) ? '완료한 실습 다시 보기' : draft(l.id).result ? '작성하던 실습 이어가기' : '실습 시작하기'}<ArrowRight size={17} /></span>
  </button>;

  return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>본문으로 바로가기</a>
    <div className="mobile-bar"><button onClick={() => setMenu(!menu)} aria-label="메뉴 열기" aria-expanded={menu}><Menu /></button><b>AI WORKROOM<span>.</span></b><span className="mobile-progress">{classCount}/3 완료</span></div>
    {menu && <button className="scrim" aria-label="메뉴 닫기" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'open' : ''}`} aria-label="주 메뉴">
      <button className="wordmark" onClick={() => go('home')}>AI WORKROOM<span>.</span></button>
      <div className="sidebar-sub">울산대학교 · 생활과 일에 쓰는 AI</div>
      <div className="course-label">WORKSHOP / 2026</div>
      <nav className="primary-nav"><button className={page === 'concepts' ? 'active' : ''} onClick={() => go('concepts')}><BookOpen size={18}/>AI 개념·사용법<ChevronRight size={15}/></button><button className={page === 'documents' ? 'active' : ''} onClick={() => go('documents')}><FileText size={18} />실제 문서 자료실<ChevronRight size={15} /></button>
        <button className={['home','beginner','intermediate'].includes(page) ? 'active' : ''} onClick={() => go('home')}><BookOpen size={18} />실습 둘러보기<ChevronRight size={15} /></button>
        <button className={page === 'workbook' ? 'active' : ''} onClick={() => go('workbook')}><FolderOpen size={18} />내 작업함<span className="nav-count">{Object.values(state.drafts).filter(d => d.result || d.prompt).length}</span></button>
      </nav>
      {[1, 2].map(d => <div className="sidebar-day" key={d}><p>{curriculum.days[d - 1].label}<span>3시간</span></p>
        {lessons.filter(l => l.day === d).map(l => <button className={`lesson-link ${page === l.id ? 'selected' : ''}`} key={l.id} onClick={() => go(l.id)}><span className={`lesson-dot ${state.completed.includes(l.id) ? 'done' : ''}`}>{state.completed.includes(l.id) ? <Check size={11} /> : l.number}</span>{l.short}</button>)}
      </div>)}
      <div className="sidebar-bottom"><a className="sidebar-pdf-link" href={workbookUrl} download="울산대학교-AI실습-수강생교재.pdf"><Download size={17}/>수강생 교재 PDF</a><button className={`guide-link ${page === 'guide' ? 'selected' : ''}`} onClick={() => go('guide')}><HelpCircle size={17} />수업 준비 안내</button>
        <div className="sidebar-progress"><div><span>{course.label} 진행률</span><b>{Math.round(classCount / 3 * 100)}%</b></div><progress value={classCount} max="3" /><small>{course.label} 3개 실습 중 {classCount}개 완료</small></div>
        <p className="local-note">작성 내용은 이 브라우저에 저장됩니다.</p>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div><span>WORKSPACE</span><ChevronRight size={13} /><b>{lesson ? `${course.label} 실습` : { home: '실습 둘러보기', beginner: '초급반', intermediate: '중급반', workbook: '내 작업함', guide: '시작 안내', documents: '실제 문서 자료실', concepts: 'AI 개념·사용법' }[page]}</b></div><a className="workbook-top-link" href={workbookUrl} download="울산대학교-AI실습-수강생교재.pdf"><Download size={15}/>수강생 교재 PDF</a><button onClick={exportBackup}><Download size={15} />내 작업 백업</button></header>
      {storageError && <div className="storage-warning" role="alert">브라우저 저장 공간을 사용할 수 없습니다. 페이지를 닫기 전에 내 작업 백업을 내려받으세요.</div>}
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {['home', 'beginner', 'intermediate'].includes(page) && <>
          <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="live-dot" />일반인·학생·구직자·직장인을 위한 AI 실습</div><h1>생활과 업무에<br /><span>활용하는 AI</span></h1><p>실제 문서로 요약·작성·검토를 연습합니다.<br />필요한 과정을 선택해 실습을 시작하세요.</p><button className="btn primary" onClick={() => go('concepts')}>{course.label} 학습 시작하기<ArrowUpRight size={19} /></button><div className="hero-caption">코딩 없이 · 유료 구독 없이 · 내 노트북으로</div></div>
            <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-badge">LESS THEORY.<br /><b>MORE PRACTICE.</b></div><div className="paper paper-back"><span>업무 메모</span><i /><i /><i /></div><div className="paper paper-front"><div><FileText size={19} /><span>문서 작성과 자료 정리</span><CheckCircle2 size={17} /></div><h3>자료를 정리하고,<br />문서를 완성하세요.</h3><i /><i /><i className="short-line" /><div className="paper-footer"><span>초안 작성</span><ArrowRight size={14} /><span>검토·수정</span><ArrowRight size={14} /><b>완성</b></div></div><div className="art-index">01 — 06 / HANDS-ON LAB</div></div>
          </section>
          <WorkbookDownload/><div className="course-strip"><div><Clock3 size={19} /><b>초급반·중급반</b><span>각 3시간 · 독립 수강</span></div><div><Clipboard size={19} /><b>직접 실습 120분 / 반</b><span>개념·시연 30분</span></div><div><FolderOpen size={19} /><b>실습 결과와 프롬프트</b><span>저장하고 다시 활용</span></div></div>
          <div className="official-update"><b>실제 공개 문서로 실습합니다.</b> 편람383쪽 · 실제 본문11,521줄 · 울산 지자체 공고·업무계획 · 법령 전문 <button className="text-btn" onClick={() => go('documents')}>원문 자료실 열기<ArrowUpRight size={15}/></button></div><div className="official-update"><b>AI 기본 개념</b> 생성형AI의 원리와 한계 · 업무 요청 · 컨텍스트 관리 · 새 대화로 옮기기 <button className="text-btn" onClick={() => go('concepts')}>반별 AI 기본·개념 보기<ArrowRight size={15}/></button></div><section className="curriculum-section"><div className="section-heading"><div><span className="eyebrow">YOUR LEARNING PATH</span><h2>과정 선택</h2></div><button className="text-btn" onClick={() => go('guide')}>수업 준비하기<ArrowUpRight size={16} /></button></div>
            <div className="day-switch" role="group" aria-label="수강 과정 선택">{[1, 2].map(d => <button aria-pressed={day === d} className={day === d ? 'current' : ''} key={d} onClick={() => go(curriculum.days[d - 1].slug)}><span>{curriculum.days[d - 1].label}</span>{curriculum.days[d - 1].title}<small>3시간</small></button>)}</div>
            <section className="course-entry" aria-label={`${course.label} 시작 안내`}><span className="eyebrow">{course.label} · 3시간</span><h3>{course.outcome}</h3><p>{course.prerequisite}</p><div className="course-start-actions"><button className="btn primary" onClick={() => go('concepts')}>{course.label} AI 기본 안내 보기<ArrowRight size={16}/></button><button className="btn secondary" onClick={() => go(classLessons[0].id)}>{course.label} 첫 실습 열기<ArrowRight size={16}/></button></div></section><div className="lesson-grid">{lessons.filter(l => l.day === day).map(lessonCard)}</div>
            <details className="schedule"><summary>{course.label} 전체 진행 순서 보기 <span>개념·시연 30분 + 실습 120분 + 휴식 20분 + 정리 10분</span></summary><ol>{curriculum.days[day - 1].schedule.map((s, i) => <li key={i}><span>{s.type === 'practice' ? '실습' : s.type === 'concept' ? '개념·시연' : s.type === 'break' ? '휴식' : '정리'}</span><b>{s.lesson ? lessons.find(l => l.id === s.lesson)?.title || s.title : s.title}</b><small>{s.minutes}분</small></li>)}</ol></details>
          </section>
          <section className="tools-section"><div><span className="eyebrow">YOUR TOOLKIT</span><h2>실습에 사용할 AI 도구</h2><p>문서 작성에는 익숙한 도구를 선택하세요. 자료 기반 질문과 출처 확인에는 NotebookLM을 사용합니다.</p></div><div className="tool-grid">{tools.map(t => <a key={t.name} href={t.href} target="_blank" rel="noreferrer"><strong>{t.name}<ArrowUpRight size={16} /></strong><span>{t.label}</span></a>)}</div><small>실제 화면 안내에는 2026-10-14에 직접 실행해 캡처한 {captures.screens.length}개 화면이 포함되어 있습니다. 무료 플랜의 기능과 사용 한도는 달라질 수 있습니다. 가입·로그인이 필요할 수 있으며, 제한 시 샘플 답변 검토로 실습을 이어가세요.</small></section>
          <div className="bottom-callout"><ShieldCheck size={24} /><p><b>결과 검토</b><span>AI가 작성한 날짜·수치·조건을 원문과 대조하고, 확인이 필요한 내용은 따로 기록하세요.</span></p><button onClick={() => go('guide')} aria-label="자료 사용 안내 보기"><ArrowRight size={20} /></button></div>
        </>}
        {page === 'concepts' && <Concepts courseIndex={day} onCourse={d => { setDay(d); history.replaceState(null, '', '#concepts?course=' + curriculum.days[d - 1].slug); }} onCopy={copy} onLesson={go}/>}
        {page === 'documents' && <OfficialLibrary onCopy={copy} onStart={() => go('email')}/>}
        {lesson && <>
          <div className="lesson-heading"><button className="back-link" onClick={() => { setDay(lesson.day); go(course.slug); }}><ArrowLeft size={15} />실습 목록</button><div className="eyebrow">{course.label}<span>/</span>EXERCISE {lesson.number}</div><h1>{lesson.title}</h1><p>{lesson.description}</p><div className="lesson-tags"><span><Clock3 size={15} />{lesson.minutes}분 실습</span><span>{lesson.tool}</span>{state.completed.includes(lesson.id) && <span className="complete-tag"><CheckCircle2 size={15} />완료한 실습</span>}</div></div>
          <div className="official-update"><button className="text-btn" onClick={() => { setDay(lesson.day); go('concepts'); }}>{course.label} AI 기본 안내 보기<ArrowRight size={15}/></button> 자료 준비 → AI 도구에서 실행 → 결과 검토·저장 <button className="text-btn" onClick={() => go('documents')}>전체 자료실</button></div><div className="lesson-layout"><div className="lesson-main"><div className="lesson-tabs" role="tablist" aria-label="실습 단계">{[['guide', '1. 실습 안내'], ['materials', '2. 자료·프롬프트'], ['screens', '실제 화면'], ['work', '3. 내 작업']].map(([id, name]) => <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab === id} onClick={() => selectTab(id)}>{name}{id === 'screens' && <span className="tab-count">{walkthroughs[lesson.id].screens.length}</span>}</button>)}</div>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-content">
              {tab === 'guide' && <DetailedLessonGuide lesson={lesson} onMaterials={() => selectTab('materials')} onCopy={copy} />}
              {tab === 'screens' && <ScreenGallery ids={walkthroughs[lesson.id].screens} />}
              {tab === 'materials' && <><div className="screen-shortcut"><BookOpen size={18} /><div><b>입력·응답 화면 확인</b><p>파일 첨부와 요청 입력, 응답 검토 위치를 확인하세요.</p></div><button onClick={() => selectTab('screens')}>실제 화면 보기<ArrowUpRight size={15} /></button></div><div className="block-heading"><h2>실습 자료</h2></div><p className="muted">{lesson.source}</p><div className="lesson-material-docs"><DocumentCards ids={lesson.documentIds} onCopy={copy}/></div><div className="block-heading"><h2>시작 프롬프트</h2><button className="text-btn" onClick={() => copy(lesson.prompt)}><Clipboard size={15} />복사</button></div><pre className="prompt-content">{lesson.prompt}</pre><p className="muted">원문 파일 전체를 AI 도구에 첨부한 뒤 요청문을 입력하세요. ‘프롬프트 + 파일 준비 안내 복사’에는 요청문과 준비할 파일 목록이 포함됩니다.</p><div className="material-actions"><button className="btn secondary" onClick={() => copy(composeLessonPrompt(lesson))}><Clipboard size={16} />프롬프트 + 파일 준비 안내 복사</button><button className="btn primary" onClick={() => selectTab('work')}>내 작업에 기록하기<ArrowRight size={16} /></button></div></>}
              {tab === 'work' && <><div className="block-heading"><h2>실습 결과물</h2><span className="save-label">{storageError ? '저장 불가 · 백업 필요' : '이 브라우저에 자동 저장'}</span></div><label className="field-label" htmlFor="result">AI 초안을 붙여넣고, 직접 검토한 최종 문서로 다듬어 보세요.</label><textarea id="result" maxLength={100000} rows={12} value={draft(lesson.id).result} onChange={e => update(lesson.id, 'result', e.target.value)} placeholder="여기에 결과물을 기록하세요. 개인정보나 회사 기밀은 입력하지 마세요." /><label className="field-label strong" htmlFor="my-prompt">다음에도 쓸 내 프롬프트</label><textarea id="my-prompt" maxLength={100000} rows={6} value={draft(lesson.id).prompt} onChange={e => update(lesson.id, 'prompt', e.target.value)} placeholder="다시 사용할 요청문과 수정 조건을 기록하세요." /><h2 className="block-title">결과 검토 항목</h2><div className="checklist">{lesson.checks.map((s, n) => <label key={n}><input type="checkbox" checked={(state.checks[lesson.id] || []).includes(n)} onChange={() => check(lesson.id, n)} /><span>{s}</span></label>)}</div><div className="material-actions"><button className="btn primary" onClick={toggleComplete}><Check size={17} />{state.completed.includes(lesson.id) ? '완료 표시 해제' : '실습 완료 표시'}</button><button className="btn secondary" disabled={!draft(lesson.id).result.trim() && !draft(lesson.id).prompt.trim()} onClick={() => download(`실습${lesson.number}-내작업.txt`, `${lesson.title}\n\n내 프롬프트\n${draft(lesson.id).prompt}\n\n결과물\n${draft(lesson.id).result}`)}><Download size={16} />내 작업 내려받기</button></div><button className="example-toggle" aria-expanded={showExample} onClick={() => setShowExample(!showExample)}>{showExample ? '강사 예시 닫기' : '강사 예시 보기'}<ChevronRight size={17} className={showExample ? 'rotate' : ''} /></button>{showExample && <pre className="source-content">{lesson.example}</pre>}</>}
            </div>
          </div><aside className="lesson-aside"><span className="eyebrow">WORKFLOW</span><h3>실습 진행 순서</h3>{['안내 읽기', 'AI 도구에서 실습', '검토하고 저장'].map((s, i) => <div className={`workflow-step ${(tab === 'screens' ? 1 : ['guide', 'materials', 'work'].indexOf(tab)) === i ? 'active' : ''}`} key={s}><span>0{i + 1}</span>{s}</div>)}<div className="aside-tools"><b>AI 도구 열기</b>{tools.filter(t => ['document', 'meeting', 'sources'].includes(lesson.id) ? ['NotebookLM', 'Gemini'].includes(t.name) : ['ChatGPT', 'Gemini', 'Claude'].includes(t.name)).map(t => <a href={t.href} target="_blank" rel="noreferrer" key={t.name}>{t.name}<ArrowUpRight size={15} /></a>)}</div><p className="aside-note"><ShieldCheck size={18} />초안은 AI가, 최종 확인은 내가.<br />자료에 없는 사실은 만들지 마세요.</p></aside></div>
          <div className="lesson-pagination">{classLessons.indexOf(lesson) > 0 ? <button onClick={() => go(classLessons[classLessons.indexOf(lesson) - 1].id)}><ArrowLeft size={16} />이전 실습</button> : <span />}{classLessons.indexOf(lesson) < classLessons.length - 1 ? <button onClick={() => go(classLessons[classLessons.indexOf(lesson) + 1].id)}>다음 실습<ArrowRight size={16} /></button> : <button onClick={() => go('workbook')}>내 작업함 보기<ArrowRight size={16} /></button>}</div>
        </>}
        {page === 'workbook' && <><div className="page-heading"><div className="eyebrow">MY WORKBOOK</div><h1>실습 결과와 프롬프트</h1><p>작성한 결과물과 요청문을 확인하고, 파일로 저장하세요.</p></div><div className="workbook-toolbar"><span>{Object.values(state.drafts).filter(d => d.result || d.prompt).length}개 실습 기록</span><div><button className="btn secondary" onClick={() => fileRef.current?.click()}><Upload size={16} />백업 가져오기</button><button className="btn secondary" onClick={exportText}><FileText size={16} />결과물 텍스트 저장</button><button className="btn primary" onClick={exportBackup}><Download size={16} />백업 파일 저장</button></div></div><div className="notice"><ShieldCheck size={19} /><p>작성 내용은 <b>현재 기기·브라우저</b>에만 저장됩니다. 다른 기기로 옮길 때는 JSON 백업을 내려받아 가져오세요. 공용 PC에서는 백업 후 기록을 삭제하세요.</p></div><div className="workbook-list">{lessons.map(l => <article key={l.id}><div className="workbook-title"><span className="card-number">{l.number}</span><div><small>{curriculum.days[l.day - 1].label} · {state.completed.includes(l.id) ? '완료' : draft(l.id).result || draft(l.id).prompt ? '작성 중' : '작성 전'}</small><h2>{l.title}</h2></div><button className="text-btn" onClick={() => { go(l.id); setTab('work'); }}>열기<ArrowUpRight size={16} /></button></div>{draft(l.id).result || draft(l.id).prompt ? <div className="draft-preview"><p>{draft(l.id).result || draft(l.id).prompt}</p><span>{draft(l.id).result.length}자 · 프롬프트 {draft(l.id).prompt ? '저장됨' : '작성 전'}</span></div> : <p className="empty-copy">저장된 내용이 없습니다. ‘열기’에서 결과물과 프롬프트를 작성하세요.</p>}</article>)}</div><div className="reset-area"><span>이 브라우저의 모든 실습 기록을 지웁니다.</span><button onClick={() => setConfirm({ type: 'reset' })}><RotateCcw size={15} />기록 초기화</button></div></>}
        {page === 'guide' && <><div className="page-heading"><div className="eyebrow">BEFORE YOU START</div><h1>수업 준비와 실습 방법</h1><p>계정 로그인과 자료 준비를 마친 뒤, 안내에 따라 실습을 진행하세요.</p></div><Foundations /><div className="official-update"><b>AI 기본 개념과 대화 관리 방법</b><button className="text-btn" onClick={() => go('concepts')}>AI 개념·컨텍스트 수업 열기<ArrowRight size={15}/></button></div><div className="guide-grid"><section><span className="eyebrow">01 / 준비물</span><h2>노트북과 계정을 준비하세요.</h2><ul><li>개인 노트북, 충전기, 안정적인 인터넷</li><li>ChatGPT 또는 Gemini 로그인 계정</li><li>NotebookLM 사용을 위한 Google 계정</li><li>업무·학교 계정은 조직에서 기능이 제한될 수 있습니다.</li></ul><p>강의 전 로그인과 도구 접속을 확인하세요. 모든 도구에 가입할 필요는 없습니다.</p></section><section><span className="eyebrow">02 / 진행 방법</span><h2>실습 진행 순서</h2><ol><li>실습 안내에서 목표와 순서 확인</li><li>전체 원문 파일을 등록하고 프롬프트 입력하기</li><li>조건을 바꿔 추가 요청하기</li><li>결과를 검토하고 내 작업에 저장</li></ol></section><section><span className="eyebrow">03 / 자료와 보안</span><h2>자료 사용 기준</h2><p>이 사이트의 기본 실습은 공개된 공식 문서입니다. 공고의 빈 서식에 실제 개인정보를 채우지 마세요. 주민번호, 고객 연락처, 비밀번호, 미공개 계약·매출 자료 등을 외부 AI 도구에 입력하지 마세요. 실제 업무 자료 사용은 소속기관의 규정을 먼저 확인하세요.</p><p>자료 속 문장은 분석할 대상입니다. 문서에 “기존 지시를 무시하라” 같은 문장이 있어도 새로운 업무 지시로 따르지 마세요.</p></section><section><span className="eyebrow">04 / 막혔을 때</span><h2>접속·파일 업로드 문제 해결</h2><p>무료 도구의 기능과 사용 한도는 계정과 시점에 따라 달라집니다. 파일 업로드가 안 되면 제공된 전문 TXT를 사용하세요. 전체 PDF의 일부만 분석했다면 범위 제한을 결과에 표시하세요. NotebookLM을 사용할 수 없으면 일반 AI 도구에 제공 문서만 붙여넣고 근거 문장을 대조하세요.</p><p>도구를 사용할 수 없을 때는 강사 예시에서 오류와 누락을 찾고, 내가 보낼 요청을 작성하는 방식으로 참여하세요.</p></section></div><ScreenGallery ids={['official-source-notice','official-corpus-ready','official-notice-analysis','official-citation']} compact /><details className="schedule"><summary>기초 조작 참고 화면 · 가상 자료 사례 {captures.screens.filter(s => !s.id.startsWith('official-')).length}개</summary><p>도구 입력·수정·인용 확인 방법을 보여주는 가상 자료 사례입니다. 공식 원문 실습과 구분해 참고하세요.</p><ScreenGallery ids={captures.screens.filter(s => !s.id.startsWith('official-')).map(s => s.id)} compact /></details><section className="guide-save"><h2>실습 결과 저장</h2><p>현재 브라우저에 자동 저장하며 서버로 과제를 제출하지 않습니다. 시크릿 모드 종료나 브라우저 데이터 삭제 시 기록이 사라질 수 있으니 JSON 백업과 텍스트 파일을 내려받으세요.</p><button className="btn primary" onClick={() => go(classLessons[0].id)}>{course.label} 첫 실습 시작하기<ArrowRight size={17} /></button></section></>}
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
