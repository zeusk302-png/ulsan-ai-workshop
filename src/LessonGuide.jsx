import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, Clipboard, Clock3, Expand, X } from 'lucide-react';
import { walkthroughs, basics } from './walkthroughs';
import { presentGuide, presentBasic } from './web-copy';
import captures from '../content/screen-captures.json';
import './walkthrough.css';

export function ScreenGallery({ ids, compact = false }) {
  const [selected, setSelected] = useState(null);
  const [readSize, setReadSize] = useState(false);
  const dialogRef = useRef(null);
  const imageRef = useRef(null);
  const screens = ids.map(id => captures.screens.find(s => s.id === id)).filter(Boolean);
  useEffect(() => { if (selected) dialogRef.current?.showModal(); }, [selected]);
  useEffect(() => { setSelected(null); dialogRef.current?.close(); }, [ids.join(',')]);
  useEffect(() => { if (readSize && imageRef.current) imageRef.current.scrollLeft = (imageRef.current.scrollWidth - imageRef.current.clientWidth) / 2; }, [readSize]);
  const src = screen => `${import.meta.env.BASE_URL}screens/${screen.file}`;
  const close = () => { dialogRef.current?.close(); setSelected(null); };
  return <section className={`capture-gallery ${compact ? 'compact' : ''}`}>
    <div className="capture-heading"><div><span className="eyebrow">REAL SCREEN WALKTHROUGH</span><h2>실제 실습 화면</h2></div><span className="real-badge"><span />실제 실행 캡처</span></div>
    <p className="capture-notice">{captures.capturedOn} 캡처. 답변 속 오류와 수정 사항은 각 화면의 검토 항목을 확인하세요. 메뉴는 계정과 업데이트에 따라 다를 수 있습니다.</p>
    <div className="screen-grid">{screens.map((s, i) => <figure key={s.id} className="screen-card"><button className="screenshot-button" onClick={() => { setReadSize(false); setSelected(s); }} aria-label={`${s.title} 화면 크게 보기`}><img src={src(s)} alt={s.alt} loading="lazy" width={s.width} height={s.height} /><span><Expand size={15} />화면 크게 보기</span></button><figcaption><div><span className="screen-index">{String(i + 1).padStart(2, '0')}</span><span>{s.tool}</span></div><h3>{s.title}</h3><ol>{s.focus.map((point, n) => <li key={n}>{point}</li>)}</ol><a href={src(s)} target="_blank" rel="noreferrer">원본 캡처 새 탭에서 보기<ArrowUpRight size={14} /></a></figcaption></figure>)}</div>
    <dialog className="screen-dialog" ref={dialogRef} onCancel={() => setSelected(null)} onClick={e => { if (e.target === dialogRef.current) close(); }} onClose={() => setSelected(null)} aria-labelledby="screen-dialog-title">
      {selected && <><div className="screen-dialog-header"><div><span>{selected.tool} · 실제 캡처</span><h2 id="screen-dialog-title">{selected.title}</h2></div><button onClick={close} aria-label="확대 화면 닫기"><X size={22} /></button></div><div className={`screen-dialog-image ${readSize ? "read-size" : ""}`} ref={imageRef}><img src={src(selected)} alt={selected.alt} /></div><p>{readSize ? "이미지를 좌우로 밀어 내용을 확인하세요. 전체 화면 맞추기로 돌아갈 수 있습니다." : "전체 화면에 맞춘 보기입니다. 작게 보이면 글자 크게 보기를 선택하거나 원본을 새 탭으로 여세요."} 캡처된 답변은 원문과 대조해 검토하세요.</p><button className="btn secondary" onClick={() => setReadSize(v => !v)}>{readSize ? "전체 화면 맞추기" : "글자 크게 보기"}<Expand size={16} /></button> <a className="btn secondary" href={src(selected)} target="_blank" rel="noreferrer">원본 캡처 열기<ArrowUpRight size={16} /></a></>}
    </dialog>
  </section>;
}

export function DetailedLessonGuide({ lesson, onMaterials, onCopy }) {
  const guide = presentGuide(lesson, walkthroughs[lesson.id]);
  return <>
    <div className="lesson-deliverable"><span className="eyebrow">WORKING OUTPUT</span><h2>단계 목표와 작업 기록</h2><p>{guide.output}</p><small>{guide.preparation}</small></div>
    <section className="concept-block"><span className="eyebrow">작업의 원리</span><h2>이 단계의 판단 기준</h2><p>{lesson.concept}</p><a className="text-btn" href={lesson.day===1?`#basics?unit=${({meeting:'models',adapt:'prompt',email:'lab'})[lesson.id]}`:`#concepts?course=intermediate&stage=${lesson.stage}`}>해당 작업 흐름과 원리<ArrowRight size={15}/></a></section>
    <div className="walkthrough-heading"><h2>실습 순서</h2><span><Clock3 size={14} />총 {lesson.minutes}분</span></div>
    <ol className="detailed-steps">{guide.detailedSteps.map(([title, action, expected], i) => <li key={title}><div className="step-number">{String(i + 1).padStart(2, '0')}</div><div><div className="step-title"><h3>{title}</h3><span>{guide.timing[i]}분</span></div><p>{action}</p><div className="expected"><CheckCircle2 size={15} /><p><b>확인할 내용</b>{expected}</p></div></div></li>)}</ol>
    <button className="btn primary" onClick={onMaterials}>자료·프롬프트로 실습하기<ArrowRight size={17} /></button>
    {guide.screenNote&&<p className="flow-screen-note">{guide.screenNote}</p>}<ScreenGallery ids={guide.screens} />
    <section className="follow-up-section"><span className="eyebrow">TRY ONE MORE THING</span><h2>후속 요청</h2><p>같은 대화에서 필요한 요청 하나를 골라 입력하세요. 사실이 바뀌지 않았는지 다시 확인합니다.</p>{guide.followUps.map(([title, prompt], i) => <article className="follow-up" key={title}><div><span>0{i + 1}</span><h3>{title}</h3><button onClick={() => onCopy(prompt)} aria-label={`${title} 후속 요청 복사`}><Clipboard size={15} />복사</button></div><p>{prompt}</p></article>)}</section>
    <section className="trouble-section"><h2>문제 해결</h2>{guide.trouble.map(([q, a]) => <details key={q}><summary>{q}<ChevronRight size={16} /></summary><p>{a}</p></details>)}</section>
    <section className="challenge-block"><div className="eyebrow">TRANSFER / EVALUATION</div><h2>다른 작업에 적용할 조건</h2><p>{guide.challenge}</p><div><b>활용 효과 기록</b><p>{guide.debrief}</p></div></section>
  </>;
}

export function Foundations() {
  return <section className="foundations"><div className="capture-heading"><div><span className="eyebrow">THE ESSENTIALS / 4 THINGS</span><h2>AI 활용 기본 원칙</h2></div></div><div className="foundation-grid">{basics.map(presentBasic).map((b, i) => <article key={b.title}><span>0{i + 1}</span><h3>{b.title}</h3><p>{b.text}</p><small>{b.action}</small></article>)}</div><a className="official-source" href="https://learn.chatgpt.com/docs/prompting" target="_blank" rel="noreferrer">더 읽기: OpenAI 공식 프롬프트 안내<ArrowUpRight size={14} /></a></section>;
}
