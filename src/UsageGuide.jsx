import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clipboard, Download } from 'lucide-react';
import { ScreenGallery } from './LessonGuide';
import { applicationCases, buildPracticePrompt, chaptersForCourse, usageReferences, validUsageTopic } from './usage-guide-data';
import './usage-guide.css';

function topicFromUrl(slug) {
  return validUsageTopic(slug, new URLSearchParams(location.hash.split('?')[1] || '').get('topic'));
}

function PromptBox({ label, text, onCopy }) {
  return <div className="usage-prompt"><div><h4>{label}</h4><button className="text-btn" onClick={() => onCopy(text)} aria-label={`${label} 복사`}><Clipboard size={15}/>복사</button></div><pre>{text}</pre></div>;
}

function ApplicationCases({ onCopy }) {
  const [selected, setSelected] = useState('life');
  const item = applicationCases.find(c => c.id === selected);
  return <section className="usage-section" aria-label="영역별 활용 사례"><h3>내 활동에 맞는 예제 선택</h3><div className="usage-case-switch" role="group" aria-label="활용 영역 선택">{applicationCases.map(c => <button key={c.id} className="btn secondary" aria-pressed={selected === c.id} onClick={() => setSelected(c.id)}>{c.label}</button>)}</div><div className="usage-case"><h4>{item.title}</h4><p><b>준비할 자료</b> {item.input}</p><PromptBox label="첫 요청" text={item.prompt} onCopy={onCopy}/><PromptBox label="후속 요청" text={item.followup} onCopy={onCopy}/><h4>결과에서 확인할 것</h4><ul>{item.checks.map(check => <li key={check}>{check}</li>)}</ul></div></section>;
}

function RequestBuilder({ onCopy }) {
  const [values, setValues] = useState({ purpose: '중구 모집공고의 조건과 상충 항목 검토', material: '중구 공고 본문과 붙임 전문 TXT 전체', audience: '담당부서에 문의할 검토자', format: '조건 / 원문 표현 / 근거 위치 / 확인 필요 표 + 확인 질문 3개', conditions: '접수방법·숫자·단위는 원문대로 유지. 서로 다른 금액은 병기. 실제 신청·발송은 하지 않음.' });
  const labels = { purpose: '완성할 결과물', material: '사용할 자료와 범위', audience: '읽을 사람', format: '출력 형식과 분량', conditions: '유지할 사실과 검토 기준' };
  return <section className="usage-section"><h3>내 요청문 구성하기</h3><p>바꿀 항목만 수정한 뒤 완성한 요청문을 복사하세요. 이 구성기의 입력값은 페이지를 떠나면 초기화됩니다. 보관할 요청은 ‘내 작업’에 저장하고, AI 서비스에서 실행할 때는 실제 원문 파일을 함께 제공합니다.</p><div className="usage-builder">{Object.entries(labels).map(([key,label]) => <label key={key}>{label}<textarea rows={2} maxLength={1500} value={values[key]} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}/></label>)}</div><PromptBox label="완성한 요청문" text={buildPracticePrompt(values)} onCopy={onCopy}/></section>;
}

export function UsageGuide({ courseSlug, onCopy, onLesson }) {
  const chapters = chaptersForCourse(courseSlug);
  const [topic, setTopic] = useState(() => topicFromUrl(courseSlug));
  const headingRef = useRef(null);
  const contentsRef = useRef(null);
  const chapter = chapters.find(c => c.id === topic) || chapters[0];
  const index = chapters.indexOf(chapter);
  useEffect(() => {
    const change = () => setTopic(topicFromUrl(courseSlug));
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, [courseSlug]);
  function selectTopic(id) {
    location.hash = `concepts?course=${courseSlug}&topic=${id}`;
  }
  function showChapter() {
    headingRef.current?.focus({ preventScroll: true });
    if (window.innerWidth <= 900 && headingRef.current) {
      window.scrollTo({ top:headingRef.current.parentElement.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 760 ? 80 : 24), behavior:'instant' });
    }
  }
  useEffect(() => {
    if (new URLSearchParams(location.hash.split('?')[1] || '').has('topic')) showChapter();
  }, [topic]);
  function saveChapter() {
    const parts = [chapter.title, chapter.outcome, ...chapter.explanation, '진행 방법', ...chapter.steps.map(([title,text],i) => `${i+1}. ${title}\n${text}`)];
    if (chapter.table) parts.push(chapter.table.headers.join(' / '), ...chapter.table.rows.map(row => row.join(' / ')));
    if (chapter.contrast) parts.push('조건이 빠진 요청', chapter.contrast.bad, chapter.contrast.reason, '수정한 요청', chapter.contrast.good);
    for (const prompt of chapter.prompts || []) parts.push(prompt.label, prompt.text);
    parts.push('강사가 작성한 점검 예시',chapter.worked.source,chapter.worked.result,chapter.worked.inspect,'직접 연습',chapter.practice.task,...chapter.practice.checks,'점검 예시',chapter.practice.answer);
    for (const [question,answer] of chapter.troubleshooting) parts.push(question,answer);
    if (chapter.id === 'transfer') for (const item of applicationCases) parts.push(item.title,item.input,item.prompt,item.followup,...item.checks);
    parts.push('공식 참고 자료 · 확인일 2026-11-04', ...chapter.sources.map(id => `${usageReferences[id].title}\n${usageReferences[id].url}`));
    const url = URL.createObjectURL(new Blob([parts.join('\n\n')], { type:'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `AI사용법-${chapter.id}.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  const lessonId = courseSlug === 'beginner'
    ? ({ context:'adapt', plans:'adapt', privacy:'email', transfer:'adapt' }[chapter.id] || chapter.lesson)
    : ({ understand:'meeting', 'first-chat':'meeting', prompt:'meeting', files:'sources', verify:'sources', privacy:'sources' }[chapter.id] || chapter.lesson);
  return <div className="usage-layout">
    <nav className="usage-nav" ref={contentsRef} tabIndex={-1} aria-label="AI 사용법 목차"><span className="eyebrow">사용법 목차</span><ol>{chapters.map((item,i) => <li key={item.id}><a href={`#concepts?course=${courseSlug}&topic=${item.id}`} aria-current={chapter.id === item.id ? 'page' : undefined} onClick={e => { if (chapter.id === item.id && !e.ctrlKey && !e.metaKey && !e.shiftKey) { e.preventDefault(); history.replaceState(null,'',`#concepts?course=${courseSlug}&topic=${item.id}`); showChapter(); } }}><span>{String(i+1).padStart(2,'0')}</span><span>{item.short}</span></a></li>)}</ol><p>설명을 읽고 요청을 실행한 뒤, 점검 기준으로 결과를 확인하세요.</p></nav>
    <article className="usage-article" aria-labelledby="usage-title" key={chapter.id}>
      <header className="usage-header"><button className="text-btn usage-toc-button" onClick={() => { contentsRef.current?.focus({preventScroll:true}); if (contentsRef.current) window.scrollTo({top:contentsRef.current.getBoundingClientRect().top + window.scrollY - 80,behavior:'instant'}); }}><ArrowLeft size={14}/>목차 보기</button><span className="eyebrow">{courseSlug === 'beginner' ? '초급반' : '중급반'} · {chapter.group} · {String(index+1).padStart(2,'0')} / {chapters.length}</span><h2 id="usage-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h2><p>{chapter.outcome}</p><div className="usage-actions"><a className="btn secondary" href="https://chatgpt.com/" target="_blank" rel="noreferrer">ChatGPT 열기</a><a className="btn secondary" href="https://gemini.google.com/" target="_blank" rel="noreferrer">Gemini 열기</a>{chapter.id === 'rag' && <a className="btn secondary" href="https://notebooklm.google.com/" target="_blank" rel="noreferrer">NotebookLM 열기</a>}<button className="text-btn" onClick={saveChapter}><Download size={15}/>이 주제 TXT 저장</button></div></header>
      <section className="usage-section"><h3>이해하기</h3>{chapter.explanation.map(text => <p key={text}>{text}</p>)}{chapter.table && <div className="usage-table-wrap"><table><thead><tr>{chapter.table.headers.map(text => <th scope="col" key={text}>{text}</th>)}</tr></thead><tbody>{chapter.table.rows.map(row => <tr key={row[0]}>{row.map((text,i) => i === 0 ? <th scope="row" key={i}>{text}</th> : <td key={i}>{text}</td>)}</tr>)}</tbody></table></div>}</section>
      <section className="usage-section"><h3>직접 하는 순서</h3><ol className="usage-steps">{chapter.steps.map(([title,text],i) => <li key={title}><span>{String(i+1).padStart(2,'0')}</span><div><h4>{title}</h4><p>{text}</p></div></li>)}</ol></section>
      {chapter.contrast && <section className="usage-section"><h3>요청을 비교해보세요</h3><div className="usage-before"><h4>조건이 빠진 요청</h4><blockquote>{chapter.contrast.bad}</blockquote><p>{chapter.contrast.reason}</p></div><PromptBox label="수정한 요청" text={chapter.contrast.good} onCopy={onCopy}/></section>}
      {chapter.prompts && <section className="usage-section"><h3>복사해서 실행할 요청</h3>{chapter.prompts.map(prompt => <PromptBox key={prompt.label} {...prompt} onCopy={onCopy}/>)}</section>}
      {chapter.id === 'prompt' && <RequestBuilder onCopy={onCopy}/>}
      <section className="usage-section usage-worked"><span className="eyebrow">강사가 작성한 점검 예시</span><h3>{chapter.worked.title}</h3><p>{chapter.worked.source}</p><pre>{chapter.worked.result}</pre><p className="usage-inspect"><b>여기를 확인</b> {chapter.worked.inspect}</p></section>
      {chapter.screens && <section className="usage-section"><h3>실제 화면에서 위치 확인</h3>{chapter.screenNote && <p>{chapter.screenNote}</p>}<ScreenGallery ids={chapter.screens} compact/></section>}
      {chapter.id === 'transfer' && <ApplicationCases onCopy={onCopy}/>}
      <section className="usage-section usage-practice"><span className="eyebrow">직접 연습</span><h3>직접 해보고 결과 점검</h3><p>{chapter.practice.task}</p><ul>{chapter.practice.checks.map(text => <li key={text}>{text}</li>)}</ul><details><summary>점검 예시와 해설</summary><p>{chapter.practice.answer}</p></details><button className="btn primary" onClick={() => onLesson(lessonId)}>실제 문서 실습으로 연결<ArrowRight size={16}/></button></section>
      <section className="usage-section"><h3>막혔을 때</h3>{chapter.troubleshooting.map(([question,answer]) => <details className="usage-faq" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
      <section className="usage-section usage-references"><h3>공식 참고 자료</h3><p>기능·개념 확인: 2026-11-04. 절차와 점검 예시는 이 워크숍에 맞춰 구성했습니다. 실제 화면은 각 캡처의 날짜를 확인하세요.</p>{chapter.sources.map(id => <a href={usageReferences[id].url} target="_blank" rel="noreferrer" key={id}>{usageReferences[id].title}<ArrowRight size={14}/></a>)}</section>
      <nav className="usage-related" aria-label="관련 사용법">{chapter.related.filter(id => chapters.some(c => c.id === id)).map(id => <button className="text-btn" key={id} onClick={() => selectTopic(id)}>{chapters.find(c => c.id === id).short}<ArrowRight size={15}/></button>)}</nav>
      <div className="usage-pagination">{index > 0 ? <button className="btn secondary" onClick={() => selectTopic(chapters[index-1].id)}><ArrowLeft size={15}/>이전 주제</button> : <span/>}{index < chapters.length-1 ? <button className="btn primary" onClick={() => selectTopic(chapters[index+1].id)}>다음 주제<ArrowRight size={15}/></button> : <button className="btn primary" onClick={() => onLesson(courseSlug === 'beginner' ? 'email' : 'meeting')}>첫 문서 실습 열기<ArrowRight size={15}/></button>}</div>
    </article>
  </div>;
}
