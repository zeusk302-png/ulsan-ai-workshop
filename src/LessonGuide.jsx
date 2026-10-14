import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, Clipboard, Clock3, Expand, X } from 'lucide-react';
import { walkthroughs, basics } from './walkthroughs';
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
    <div className="capture-heading"><div><span className="eyebrow">REAL SCREEN WALKTHROUGH</span><h2>실제 화면으로 따라 해보세요.</h2></div><span className="real-badge"><span />실제 실행 캡처</span></div>
    <p className="capture-notice">{captures.capturedOn} 캡처 · {captures.notice}</p>
    <div className="screen-grid">{screens.map((s, i) => <figure key={s.id} className="screen-card"><button className="screenshot-button" onClick={() => { setReadSize(false); setSelected(s); }} aria-label={`${s.title} 화면 크게 보기`}><img src={src(s)} alt={s.alt} loading="lazy" width={s.width} height={s.height} /><span><Expand size={15} />화면 크게 보기</span></button><figcaption><div><span className="screen-index">{String(i + 1).padStart(2, '0')}</span><span>{s.tool}</span></div><h3>{s.title}</h3><ol>{s.focus.map((point, n) => <li key={n}>{point}</li>)}</ol><a href={src(s)} target="_blank" rel="noreferrer">원본 캡처 새 탭에서 보기<ArrowUpRight size={14} /></a></figcaption></figure>)}</div>
    <dialog className="screen-dialog" ref={dialogRef} onCancel={() => setSelected(null)} onClick={e => { if (e.target === dialogRef.current) close(); }} onClose={() => setSelected(null)} aria-labelledby="screen-dialog-title">
      {selected && <><div className="screen-dialog-header"><div><span>{selected.tool} · 실제 캡처</span><h2 id="screen-dialog-title">{selected.title}</h2></div><button onClick={close} aria-label="확대 화면 닫기"><X size={22} /></button></div><div className={`screen-dialog-image ${readSize ? "read-size" : ""}`} ref={imageRef}><img src={src(selected)} alt={selected.alt} /></div><p>{readSize ? "이미지를 좌우로 밀어 내용을 확인하세요. 전체 화면 맞추기로 돌아갈 수 있습니다." : "전체 화면에 맞춘 보기입니다. 작게 보이면 글자 크게 보기를 선택하거나 원본을 새 탭으로 여세요."} 화면 내용은 캡처 시점의 실제 응답이며 정답을 보증하지 않습니다.</p><button className="btn secondary" onClick={() => setReadSize(v => !v)}>{readSize ? "전체 화면 맞추기" : "글자 크게 보기"}<Expand size={16} /></button> <a className="btn secondary" href={src(selected)} target="_blank" rel="noreferrer">원본 캡처 열기<ArrowUpRight size={16} /></a></>}
    </dialog>
  </section>;
}

export function DetailedLessonGuide({ lesson, onMaterials, onCopy }) {
  const guide = walkthroughs[lesson.id];
  return <>
    <div className="lesson-deliverable"><span className="eyebrow">TODAY'S OUTPUT</span><h2>오늘 가져갈 결과물</h2><p>{guide.output}</p><small>{guide.preparation}</small></div>
    <section className="concept-block"><span className="eyebrow">개념은 짧게</span><h2>시작 전에, 이것만 기억하세요.</h2><p>{lesson.concept}</p></section>
    <div className="prompt-comparison"><h2>같은 일도, 이렇게 설명하면 달라집니다.</h2><div><article><span>정보가 부족한 요청</span><p>{guide.weak}</p></article><article><span>업무가 보이는 요청</span><p>{guide.strong}</p></article></div><small>원하는 말투만 지정하기보다 자료·독자·형식·확인 조건을 함께 전달하세요.</small></div>
    <div className="walkthrough-heading"><h2>한 단계씩 직접 해보기</h2><span><Clock3 size={14} />총 {lesson.minutes}분</span></div>
    <ol className="detailed-steps">{guide.detailedSteps.map(([title, action, expected], i) => <li key={title}><div className="step-number">{String(i + 1).padStart(2, '0')}</div><div><div className="step-title"><h3>{title}</h3><span>{guide.timing[i]}분</span></div><p>{action}</p><div className="expected"><CheckCircle2 size={15} /><p><b>여기까지 확인</b>{expected}</p></div></div></li>)}</ol>
    <button className="btn primary" onClick={onMaterials}>자료·프롬프트로 실습하기<ArrowRight size={17} /></button>
    <ScreenGallery ids={guide.screens} />
    <section className="follow-up-section"><span className="eyebrow">TRY ONE MORE THING</span><h2>첫 답변 다음에는 이렇게 요청하세요.</h2><p>같은 대화에서 필요한 요청 하나를 골라 입력하세요. 사실이 바뀌지 않았는지 다시 확인합니다.</p>{guide.followUps.map(([title, prompt], i) => <article className="follow-up" key={title}><div><span>0{i + 1}</span><h3>{title}</h3><button onClick={() => onCopy(prompt)} aria-label={`${title} 후속 요청 복사`}><Clipboard size={15} />복사</button></div><p>{prompt}</p></article>)}</section>
    <section className="trouble-section"><h2>막혔을 때는 여기부터</h2>{guide.trouble.map(([q, a]) => <details key={q}><summary>{q}<ChevronRight size={16} /></summary><p>{a}</p></details>)}</section>
    <section className="challenge-block"><div className="eyebrow">혼자 해보기 · 기본 실습 후 선택</div><h2>조건을 바꿔 내 것으로 만들기</h2><p>{guide.challenge}</p><div><b>마지막 1분, 돌아보기</b><p>{guide.debrief}</p></div></section>
  </>;
}

export function Foundations() {
  return <section className="foundations"><div className="capture-heading"><div><span className="eyebrow">THE ESSENTIALS / 4 THINGS</span><h2>설명은 짧게, 이 네 가지만.</h2></div></div><div className="foundation-grid">{basics.map((b, i) => <article key={b.title}><span>0{i + 1}</span><h3>{b.title}</h3><p>{b.text}</p><small>{b.action}</small></article>)}</div><a className="official-source" href="https://learn.chatgpt.com/docs/prompting" target="_blank" rel="noreferrer">더 읽기: OpenAI 공식 프롬프트 안내<ArrowUpRight size={14} /></a></section>;
}
