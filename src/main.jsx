import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, ArrowLeft, BookOpen, Check, CheckCircle2, ChevronRight, Clipboard, Download, FileText, FolderOpen, HelpCircle, Menu, RotateCcw, Upload, Clock3, ShieldCheck } from 'lucide-react';
import { lessons, tools } from './content';
import { emptyState, readState, validateState, STORAGE_KEY } from './state';
import curriculum from '../content/curriculum.json';
import './style.css';

function download(name, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initialPage() {
  const value = location.hash.slice(1);
  return ['home', 'workbook', 'guide', ...lessons.map(l => l.id)].includes(value) ? value : 'home';
}

function App() {
  const [state, setState] = useState(() => readState(localStorage));
  const [page, setPage] = useState(initialPage);
  const [day, setDay] = useState(1);
  const [tab, setTab] = useState('guide');
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [showExample, setShowExample] = useState(false);
  const mainRef = useRef(null);
  const fileRef = useRef(null);
  const lesson = lessons.find(l => l.id === page);
  const count = state.completed.length;
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [state]);
  useEffect(() => { const handler = () => { setPage(initialPage()); setTab('guide'); setShowExample(false); }; window.addEventListener('hashchange', handler); return () => window.removeEventListener('hashchange', handler); }, []);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(''), 4000); return () => clearTimeout(id); }, [toast]);
  useEffect(() => { document.title = `${lesson?.short || ({ home: '실습 둘러보기', workbook: '내 작업함', guide: '시작 안내' }[page])} — AI WORKROOM`; }, [page]);
  const go = id => {
    history.pushState(null, '', `#${id}`); setPage(id); setMenu(false); setTab('guide'); setShowExample(false);
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
    setToast(done ? '완료 표시를 해제했습니다.' : '실습을 완료했습니다. 수고하셨습니다!');
  };
  const lessonCard = l => <button className="lesson-card" key={l.id} onClick={() => go(l.id)}>
    <span className="card-number">{l.number}<span>{state.completed.includes(l.id) ? <CheckCircle2 size={20} /> : <ArrowUpRight size={20} />}</span></span>
    <span className="card-meta">{l.minutes}분 실습 <span>·</span> {l.tool}</span>
    <strong>{l.title}</strong><span className="card-description">{l.description}</span>
    <span className="card-bottom">{state.completed.includes(l.id) ? '완료한 실습 다시 보기' : draft(l.id).result ? '작성하던 실습 이어가기' : '실습 시작하기'}<ArrowRight size={17} /></span>
  </button>;

  return <>
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>본문으로 바로가기</a>
    <div className="mobile-bar"><button onClick={() => setMenu(!menu)} aria-label="메뉴 열기" aria-expanded={menu}><Menu /></button><b>AI WORKROOM<span>.</span></b><span className="mobile-progress">{count}/6 완료</span></div>
    {menu && <button className="scrim" aria-label="메뉴 닫기" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'open' : ''}`} aria-label="주 메뉴">
      <button className="wordmark" onClick={() => go('home')}>AI WORKROOM<span>.</span></button>
      <div className="sidebar-sub">울산대학교 · 직장인 AI 실습실</div>
      <div className="course-label">WORKSHOP / 2026</div>
      <nav className="primary-nav">
        <button className={page === 'home' ? 'active' : ''} onClick={() => go('home')}><BookOpen size={18} />실습 둘러보기<ChevronRight size={15} /></button>
        <button className={page === 'workbook' ? 'active' : ''} onClick={() => go('workbook')}><FolderOpen size={18} />내 작업함<span className="nav-count">{Object.values(state.drafts).filter(d => d.result || d.prompt).length}</span></button>
      </nav>
      {[1, 2].map(d => <div className="sidebar-day" key={d}><p>DAY 0{d}<span>{d === 1 ? '문서 업무' : '자료 정리·업무 적용'}</span></p>
        {lessons.filter(l => l.day === d).map(l => <button className={`lesson-link ${page === l.id ? 'selected' : ''}`} key={l.id} onClick={() => go(l.id)}><span className={`lesson-dot ${state.completed.includes(l.id) ? 'done' : ''}`}>{state.completed.includes(l.id) ? <Check size={11} /> : l.number}</span>{l.short}</button>)}
      </div>)}
      <div className="sidebar-bottom"><button className={`guide-link ${page === 'guide' ? 'selected' : ''}`} onClick={() => go('guide')}><HelpCircle size={17} />처음 오셨나요?</button>
        <div className="sidebar-progress"><div><span>나의 실습 진행률</span><b>{Math.round(count / 6 * 100)}%</b></div><progress value={count} max="6" /><small>6개의 실습 중 {count}개 완료</small></div>
        <p className="local-note">작성 내용은 이 브라우저에 저장됩니다.</p>
      </div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div><span>WORKSPACE</span><ChevronRight size={13} /><b>{lesson ? `${lesson.day}일차 실습` : { home: '실습 둘러보기', workbook: '내 작업함', guide: '시작 안내' }[page]}</b></div><button onClick={exportBackup}><Download size={15} />내 작업 백업</button></header>
      {storageError && <div className="storage-warning" role="alert">브라우저 저장 공간을 사용할 수 없습니다. 페이지를 닫기 전에 내 작업 백업을 내려받으세요.</div>}
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        {page === 'home' && <>
          <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="live-dot" />직장인을 위한 AI 실무 워크숍</div><h1>배우는 AI에서,<br /><span>일하는 AI로.</span></h1><p>메일 한 통부터 나만의 업무 템플릿까지.<br />직접 만들고, 고치고, 내 업무에 가져가세요.</p><button className="btn primary" onClick={() => go(state.current)}>{Object.keys(state.drafts).length || count ? '이어서 실습하기' : '첫 번째 실습 시작하기'}<ArrowUpRight size={19} /></button><div className="hero-caption">코딩 없이 · 유료 구독 없이 · 내 노트북으로</div></div>
            <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-badge">LESS THEORY.<br /><b>MORE PRACTICE.</b></div><div className="paper paper-back"><span>업무 메모</span><i /><i /><i /></div><div className="paper paper-front"><div><FileText size={19} /><span>내 업무의 첫 번째 변화</span><CheckCircle2 size={17} /></div><h3>막막했던 초안이,<br />쓸 수 있는 문서로.</h3><i /><i /><i className="short-line" /><div className="paper-footer"><span>초안 작성</span><ArrowRight size={14} /><span>검토·수정</span><ArrowRight size={14} /><b>완성</b></div></div><div className="art-index">01 — 06 / HANDS-ON LAB</div></div>
          </section>
          <div className="course-strip"><div><Clock3 size={19} /><b>2일, 총 6시간</b><span>하루 3시간</span></div><div><Clipboard size={19} /><b>직접 실습 120분 / 일</b><span>개념·시연 30분</span></div><div><FolderOpen size={19} /><b>내 업무 결과물</b><span>저장하고 다시 활용</span></div></div>
          <section className="curriculum-section"><div className="section-heading"><div><span className="eyebrow">YOUR LEARNING PATH</span><h2>하나씩 해보면, 내 것이 됩니다.</h2></div><button className="text-btn" onClick={() => go('guide')}>수업 준비하기<ArrowUpRight size={16} /></button></div>
            <div className="day-switch" role="group" aria-label="학습 일차 선택">{[1, 2].map(d => <button aria-pressed={day === d} className={day === d ? 'current' : ''} key={d} onClick={() => setDay(d)}><span>DAY 0{d}</span>{d === 1 ? 'AI 기초와 업무 문서 작성' : '자료 정리와 내 업무 적용'}<small>3시간</small></button>)}</div>
            <div className="lesson-grid">{lessons.filter(l => l.day === day).map(lessonCard)}</div>
            <details className="schedule"><summary>DAY 0{day} 전체 진행 순서 보기 <span>개념·시연 30분 + 실습 120분 + 휴식 20분 + 정리 10분</span></summary><ol>{curriculum.days[day - 1].schedule.map((s, i) => <li key={i}><span>{s.type === 'practice' ? '실습' : s.type === 'concept' ? '개념·시연' : s.type === 'break' ? '휴식' : '정리'}</span><b>{s.title}</b><small>{s.minutes}분</small></li>)}</ol></details>
          </section>
          <section className="tools-section"><div><span className="eyebrow">YOUR TOOLKIT</span><h2>도구는 가볍게, 활용은 확실하게.</h2><p>주력 도구 하나로 시작하세요. 자료 기반 실습에는 NotebookLM을 사용합니다.</p></div><div className="tool-grid">{tools.map(t => <a key={t.name} href={t.href} target="_blank" rel="noreferrer"><strong>{t.name}<ArrowUpRight size={16} /></strong><span>{t.label}</span></a>)}</div><small>무료 플랜의 기능과 사용 한도는 달라질 수 있습니다. 가입·로그인이 필요할 수 있으며, 제한 시 샘플 답변 검토로 실습을 이어가세요.</small></section>
          <div className="bottom-callout"><ShieldCheck size={24} /><p><b>좋은 결과는, 확인하는 습관에서 시작합니다.</b><span>모든 자료는 교육용 가상 사례입니다. AI가 쓴 날짜·수치·근거를 직접 확인해 보세요.</span></p><button onClick={() => go('guide')} aria-label="안전한 실습 안내 보기"><ArrowRight size={20} /></button></div>
        </>}
        {lesson && <>
          <div className="lesson-heading"><button className="back-link" onClick={() => { setDay(lesson.day); go('home'); }}><ArrowLeft size={15} />실습 목록</button><div className="eyebrow">DAY 0{lesson.day}<span>/</span>EXERCISE {lesson.number}</div><h1>{lesson.title}</h1><p>{lesson.description}</p><div className="lesson-tags"><span><Clock3 size={15} />{lesson.minutes}분 실습</span><span>{lesson.tool}</span>{state.completed.includes(lesson.id) && <span className="complete-tag"><CheckCircle2 size={15} />완료한 실습</span>}</div></div>
          <div className="lesson-layout"><div className="lesson-main"><div className="lesson-tabs" role="tablist" aria-label="실습 단계">{[['guide', '1. 실습 안내'], ['materials', '2. 자료·프롬프트'], ['work', '3. 내 작업']].map(([id, name]) => <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab === id} onClick={() => setTab(id)}>{name}</button>)}</div>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-content">
              {tab === 'guide' && <><section className="concept-block"><span className="eyebrow">개념은 짧게</span><h2>시작 전에, 이것만 기억하세요.</h2><p>{lesson.concept}</p></section><h2 className="block-title">이번 실습의 목표</h2><p className="goal-text">{lesson.goal}</p><h2 className="block-title">이렇게 해보세요</h2><ol className="steps">{lesson.steps.map((s, i) => <li key={i}><span>{String(i + 1).padStart(2, '0')}</span><p>{s}</p></li>)}</ol><div className="hint"><b>내 업무로 바꾸기</b><p>{lesson.variation}</p></div><button className="btn primary" onClick={() => setTab('materials')}>자료와 프롬프트 보기<ArrowRight size={17} /></button></>}
              {tab === 'materials' && <><div className="block-heading"><h2>실습용 샘플 자료</h2><button className="text-btn" onClick={() => download(`실습${lesson.number}-샘플.txt`, lesson.source)}><Download size={15} />자료 다운로드</button></div><p className="muted">아래 내용은 교육용 가상 자료입니다. 복사하거나 파일로 내려받아 사용하세요.</p><pre className="source-content">{lesson.source}</pre><div className="material-actions"><button className="btn secondary" onClick={() => copy(lesson.source)}><Clipboard size={16} />샘플 자료 복사</button>{lesson.id === 'sources' && [0, 1].map(n => <button className="btn secondary" key={n} onClick={() => download(`문서${n + 1}-${n ? 'FAQ' : '운영지침'}.txt`, lesson.source.split('【문서 2')[n === 0 ? 0 : 1] ? (n === 0 ? lesson.source.split('【문서 2')[0] : '【문서 2' + lesson.source.split('【문서 2')[1]) : '')}><Download size={15} />문서 {n + 1} 다운로드</button>)}</div><div className="block-heading"><h2>시작 프롬프트</h2><button className="text-btn" onClick={() => copy(lesson.prompt)}><Clipboard size={15} />복사</button></div><pre className="prompt-content">{lesson.prompt}</pre><p className="muted">대괄호를 채우고 샘플 자료를 함께 넣으세요. 사이트가 AI 답변을 생성하지는 않습니다.</p><div className="material-actions"><button className="btn secondary" onClick={() => copy(`${lesson.prompt}\n\n${lesson.source}`)}><Clipboard size={16} />프롬프트 + 자료 함께 복사</button><button className="btn primary" onClick={() => setTab('work')}>내 작업에 기록하기<ArrowRight size={16} /></button></div></>}
              {tab === 'work' && <><div className="block-heading"><h2>내가 만든 결과물</h2><span className="save-label">{storageError ? '저장 불가 · 백업 필요' : '이 브라우저에 자동 저장'}</span></div><label className="field-label" htmlFor="result">AI 초안을 붙여넣고, 직접 검토한 최종 문서로 다듬어 보세요.</label><textarea id="result" maxLength={100000} rows={12} value={draft(lesson.id).result} onChange={e => update(lesson.id, 'result', e.target.value)} placeholder="여기에 결과물을 기록하세요. 개인정보나 회사 기밀은 입력하지 마세요." /><label className="field-label strong" htmlFor="my-prompt">다음에도 쓸 내 프롬프트</label><textarea id="my-prompt" maxLength={100000} rows={6} value={draft(lesson.id).prompt} onChange={e => update(lesson.id, 'prompt', e.target.value)} placeholder="효과가 있었던 요청과 후속 요청을 저장해 두세요." /><h2 className="block-title">완료 전에, 직접 확인하세요.</h2><div className="checklist">{lesson.checks.map((s, n) => <label key={n}><input type="checkbox" checked={(state.checks[lesson.id] || []).includes(n)} onChange={() => check(lesson.id, n)} /><span>{s}</span></label>)}</div><div className="material-actions"><button className="btn primary" onClick={toggleComplete}><Check size={17} />{state.completed.includes(lesson.id) ? '완료 표시 해제' : '검토했어요 · 실습 완료'}</button><button className="btn secondary" disabled={!draft(lesson.id).result.trim() && !draft(lesson.id).prompt.trim()} onClick={() => download(`실습${lesson.number}-내작업.txt`, `${lesson.title}\n\n내 프롬프트\n${draft(lesson.id).prompt}\n\n결과물\n${draft(lesson.id).result}`)}><Download size={16} />내 작업 내려받기</button></div><button className="example-toggle" aria-expanded={showExample} onClick={() => setShowExample(!showExample)}>{showExample ? '예시 답변 접기' : '직접 해본 뒤, 강사 예시 확인하기'}<ChevronRight size={17} className={showExample ? 'rotate' : ''} /></button>{showExample && <pre className="source-content">{lesson.example}</pre>}</>}
            </div>
          </div><aside className="lesson-aside"><span className="eyebrow">WORKFLOW</span><h3>완성까지, 세 걸음.</h3>{['안내 읽기', 'AI 도구에서 실습', '검토하고 저장'].map((s, i) => <div className={`workflow-step ${['guide', 'materials', 'work'].indexOf(tab) === i ? 'active' : ''}`} key={s}><span>0{i + 1}</span>{s}</div>)}<div className="aside-tools"><b>AI 도구 열기</b>{tools.filter(t => lesson.id === 'sources' ? ['NotebookLM', 'Gemini'].includes(t.name) : ['ChatGPT', 'Gemini', 'Claude'].includes(t.name)).map(t => <a href={t.href} target="_blank" rel="noreferrer" key={t.name}>{t.name}<ArrowUpRight size={15} /></a>)}</div><p className="aside-note"><ShieldCheck size={18} />초안은 AI가, 최종 확인은 내가.<br />자료에 없는 사실은 만들지 마세요.</p></aside></div>
          <div className="lesson-pagination">{lessons.indexOf(lesson) > 0 ? <button onClick={() => go(lessons[lessons.indexOf(lesson) - 1].id)}><ArrowLeft size={16} />이전 실습</button> : <span />}{lessons.indexOf(lesson) < 5 ? <button onClick={() => go(lessons[lessons.indexOf(lesson) + 1].id)}>다음 실습<ArrowRight size={16} /></button> : <button onClick={() => go('workbook')}>내 작업함 보기<ArrowRight size={16} /></button>}</div>
        </>}
        {page === 'workbook' && <><div className="page-heading"><div className="eyebrow">MY WORKBOOK</div><h1>오늘 만든 것, 내일 쓸 것.</h1><p>실습 결과물과 나만의 프롬프트를 한곳에 모았습니다.</p></div><div className="workbook-toolbar"><span>{Object.values(state.drafts).filter(d => d.result || d.prompt).length}개 실습에 기록이 있어요</span><div><button className="btn secondary" onClick={() => fileRef.current?.click()}><Upload size={16} />백업 가져오기</button><button className="btn secondary" onClick={exportText}><FileText size={16} />전체 텍스트</button><button className="btn primary" onClick={exportBackup}><Download size={16} />JSON 백업</button></div></div><div className="notice"><ShieldCheck size={19} /><p>작성 내용은 <b>현재 기기·브라우저</b>에만 저장됩니다. 다른 기기로 옮길 때는 JSON 백업을 내려받아 가져오세요. 공용 PC에서는 백업 후 기록을 삭제하세요.</p></div><div className="workbook-list">{lessons.map(l => <article key={l.id}><div className="workbook-title"><span className="card-number">{l.number}</span><div><small>DAY 0{l.day} · {state.completed.includes(l.id) ? '완료' : draft(l.id).result || draft(l.id).prompt ? '작성 중' : '작성 전'}</small><h2>{l.title}</h2></div><button className="text-btn" onClick={() => { go(l.id); setTab('work'); }}>열기<ArrowUpRight size={16} /></button></div>{draft(l.id).result || draft(l.id).prompt ? <div className="draft-preview"><p>{draft(l.id).result || draft(l.id).prompt}</p><span>{draft(l.id).result.length}자 · 프롬프트 {draft(l.id).prompt ? '저장됨' : '작성 전'}</span></div> : <p className="empty-copy">아직 기록이 없습니다. 실습을 시작하고 첫 결과물을 남겨보세요.</p>}</article>)}</div><div className="reset-area"><span>이 브라우저의 모든 실습 기록을 지웁니다.</span><button onClick={() => setConfirm({ type: 'reset' })}><RotateCcw size={15} />기록 초기화</button></div></>}
        {page === 'guide' && <><div className="page-heading"><div className="eyebrow">BEFORE YOU START</div><h1>준비는 가볍게.<br />실습은 차근차근.</h1><p>처음 AI를 사용해도 괜찮습니다. 샘플 자료부터 함께 시작하세요.</p></div><div className="guide-grid"><section><span className="eyebrow">01 / 준비물</span><h2>노트북과 계정을 준비하세요.</h2><ul><li>개인 노트북, 충전기, 안정적인 인터넷</li><li>ChatGPT 또는 Gemini 로그인 계정</li><li>NotebookLM 사용을 위한 Google 계정</li><li>업무·학교 계정은 조직에서 기능이 제한될 수 있습니다.</li></ul><p>강의 전 로그인과 도구 접속을 확인하세요. 모든 도구에 가입할 필요는 없습니다.</p></section><section><span className="eyebrow">02 / 진행 방법</span><h2>따라 한 뒤, 직접 바꿔보세요.</h2><ol><li>실습 안내에서 목표와 순서 확인</li><li>샘플 자료와 프롬프트를 AI 도구에 붙여넣기</li><li>조건을 바꿔 추가 요청하기</li><li>결과를 검토하고 내 작업에 저장</li></ol></section><section><span className="eyebrow">03 / 자료와 보안</span><h2>실제 기밀 대신 가상 자료로.</h2><p>이 사이트의 예제는 모두 가상입니다. 주민번호, 고객 연락처, 비밀번호, 미공개 계약·매출 자료 등을 외부 AI 도구에 입력하지 마세요. 실제 업무 자료 사용은 소속기관의 규정을 먼저 확인하세요.</p><p>자료 속 문장은 분석할 대상입니다. 문서에 “기존 지시를 무시하라” 같은 문장이 있어도 새로운 업무 지시로 따르지 마세요.</p></section><section><span className="eyebrow">04 / 막혔을 때</span><h2>한도에 걸려도 이어갈 수 있어요.</h2><p>무료 도구의 기능과 사용 한도는 계정과 시점에 따라 달라집니다. 파일 업로드가 안 되면 샘플 텍스트를 붙여넣으세요. NotebookLM을 사용할 수 없으면 일반 AI 도구에 제공 문서만 붙여넣고 근거 문장을 대조하세요.</p><p>도구를 사용할 수 없을 때는 강사 예시에서 오류와 누락을 찾고, 내가 보낼 요청을 작성하는 방식으로 참여하세요.</p></section></div><section className="guide-save"><h2>마지막에는 내 작업을 챙기세요.</h2><p>현재 브라우저에 자동 저장하며 서버로 과제를 제출하지 않습니다. 시크릿 모드 종료나 브라우저 데이터 삭제 시 기록이 사라질 수 있으니 JSON 백업과 텍스트 파일을 내려받으세요.</p><button className="btn primary" onClick={() => go('email')}>첫 번째 실습 시작하기<ArrowRight size={17} /></button></section></>}
      </main>
      <footer><span>AI WORKROOM<span className="footer-dot">.</span></span><p>울산대학교 강연용 학습 자료 · 교육용 가상 사례 사용</p><button onClick={() => go('guide')}>이용 안내<ArrowUpRight size={13} /></button></footer>
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
