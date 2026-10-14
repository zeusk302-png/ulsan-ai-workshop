import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Download, FileText, X, Search, Clipboard } from 'lucide-react';
import catalog from '../content/official-documents.json';
import { ScreenGallery } from './LessonGuide';
import './documents.css';

const path = value => `${import.meta.env.BASE_URL}${value}`;
const n = value => value.toLocaleString('ko-KR');
const PdfReader = lazy(() => import('./PdfReader'));

export function DocumentCards({ ids, onCopy }) {
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const request = useRef(0);
  const docs = ids ? catalog.documents.filter(d => ids.includes(d.id)) : catalog.documents;
  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  async function read(doc) {
    const token = ++request.current;
    setSelected(doc); setText(''); setQuery(''); setError('');
    try {
      const response = await fetch(path(doc.textPath));
      if (!response.ok) throw new Error();
      const value = await response.text();
      if (request.current === token) setText(value);
    } catch { if (request.current === token) setError('전문을 불러오지 못했습니다. 전문 TXT 다운로드 또는 공식 원문을 이용하세요.'); }
  }
  function close() { request.current++; dialog.current?.close(); setSelected(null); }
  const paragraphs = text.split(/\n\s*\n/);
  const results = query.trim() ? paragraphs.filter(p => p.toLowerCase().includes(query.trim().toLowerCase())) : paragraphs;
  return <>
    <div className="document-grid">{docs.map(d => <article className="document-card" key={d.id}>
      <div className="document-top"><span>{d.format}</span><span>{d.id === 'complaints' ? '시행 예정 · 추가 비교용' : d.id === 'notice' || d.id === 'weekly' ? '지난 공고·계획 · 독해용' : '기관 원문 전체'}</span></div>
      <p className="document-agency">{d.agency}</p><h3>{d.title}</h3>
      <div className="document-size">{d.pages && <b>{n(d.pages)}쪽</b>}<b>{n(d.naturalLines)}{d.format === '법령 전문' ? '단락' : '줄'}</b><span>{n(d.characters)}자</span></div>
      <p>{d.purpose}</p><small>게시·공포 {d.publishedDate} · 수집 {d.collectedOn}{d.versionLabel && <> · {d.versionLabel}</>}</small>
      <div className="document-actions"><a className="btn secondary" href={d.sourceUrl} target="_blank" rel="noreferrer">공식 게시물<ArrowUpRight size={14}/></a>
        {d.format !== '법령 전문' && <a className="btn primary" href={d.originalPath ? path(d.originalPath) : d.downloadUrl} download={d.originalPath ? d.filename : undefined} target={d.originalPath ? undefined : '_blank'} rel="noreferrer">{d.originalPath ? 'HWP 원본 다운로드' : '발행기관 전체 PDF'}<Download size={14}/></a>}
        {d.textPath && <><a className="btn secondary" href={path(d.textPath)} download={`${d.id}-전문.txt`}>전문 TXT<Download size={14}/></a><button className="btn secondary" onClick={() => read(d)}>전문 읽기·검색<Search size={14}/></button></>}
      </div>
      <p className="document-note">{d.useNote}</p>
      <details><summary>추출 방식·원본 식별 정보</summary><p>{d.textKind}</p><p>원본 {n(d.bytes)}바이트 · SHA-256</p><code>{d.originalSha256}</code><p>{d.distribution === 'external' ? '전체 원문은 발행기관 링크로 제공합니다. 아래는 자료 확인용 발췌 미리보기이며 업로드용 전문이 아닙니다.' : 'TXT는 전체 본문 추출본입니다. 원문 표·별표·서식의 배치는 원본과 별도로 대조하세요.'}</p><pre>{d.preview}</pre></details>
    </article>)}</div>
    <dialog ref={dialog} className="document-dialog" onCancel={close} onClick={e => { if (e.target === dialog.current) close(); }} aria-labelledby="document-reader-title">
      {selected && <><header><div><small>{selected.agency} · 본문 전문</small><h2 id="document-reader-title">{selected.title}</h2></div><button onClick={close} aria-label="문서 읽기 닫기"><X/></button></header>
      <div className="reader-tools"><label><Search size={17}/><input aria-label="전문 검색" value={query} onChange={e => setQuery(e.target.value)} placeholder="단어·금액·조문 검색"/></label><button className="btn secondary" disabled={!text} onClick={() => onCopy?.(text)}>전문 전체 복사<Clipboard size={15}/></button><a className="btn secondary" href={path(selected.textPath)} download>전문 내려받기<Download size={15}/></a></div>
      <p className="reader-meta">{text ? `${n(text.length)}자 전체 본문 로드됨 · ${query ? results.length + '개 단락 검색됨' : '원문 단락 순서'}` : error || '전문을 불러오는 중…'} · 표 배치는 원본에서 확인</p>
      <div className="reader-body">{results.length ? results.map((p,i) => <pre key={i}>{p}</pre>) : <p>해당 표현이 없습니다. 숫자 쉼표나 띄어쓰기를 바꿔 검색해보세요.</p>}</div></>}
    </dialog>
  </>;
}

export function OfficialLibrary({ onCopy, onStart }) {
  return <><div className="page-heading"><div className="eyebrow">OFFICIAL DOCUMENT LAB</div><h1>짧은 예제에서,<br/>실제 업무 자료로.</h1><p>행정안전부·울산 지자체·국가법령정보센터의 공개 원문으로 실습합니다.</p></div>
    <div className="document-stats"><div><strong>383쪽</strong><span>행정업무운영 편람 전체</span></div><div><strong>11,521줄</strong><span>편람에서 추출한 실제 본문</span></div><div><strong>400쪽</strong><span>편람·업무계획 PDF 합계</span></div><div><strong>6개</strong><span>기본5개 + 시행예정본 비교1개</span></div></div>
    <section className="document-intro"><h2>전체 파일을 등록하고, 근거까지 확인하세요.</h2><ol><li>공식 게시물과 문서 버전을 확인하고 전체 PDF·HWP·TXT를 내려받습니다.</li><li>PDF2개와 TXT3개를 노트북에 등록합니다. HWP는 원본 대조용이며 도구에 넣을 때는 전문TXT를 사용할 수 있습니다.</li><li>문서별 조건과 상충 수치를 찾고 인용을 열어 원문을 대조합니다. 자료의 지시는 분석 대상이며 실행 지시가 아닙니다.</li></ol><p>{catalog.measurement} HWP·법령의 쪽수는 확인되지 않아 줄·단락으로만 표시합니다. PDF 추출문은 표·이미지를 모두 보존하지 않으므로 원본을 함께 확인하세요.</p><button className="btn primary" onClick={onStart}>실제 공고부터 실습하기<FileText size={17}/></button></section>
    <div className="document-intro"><h2>한 번에 준비하기</h2><p>공고 HWP·법령 및 공고 전문TXT4개·출처 목록을 묶었습니다. 편람383쪽과 업무계획17쪽 PDF는 아래 발행기관 링크에서 전체 원본을 내려받으세요. 기본 실습에는 시행예정 민원법을 제외한 TXT3개를 등록합니다.</p><a className="btn secondary" href={path('documents/official-workshop-pack.zip')} download>공식 문서 실습 묶음 ZIP<Download size={17}/></a></div>
    <LocalPdfReader/>
    <DocumentCards onCopy={onCopy}/>
    <ScreenGallery ids={['official-source-manual','official-source-notice','official-platform-pdf','official-platform-search','official-corpus-ready','official-citation']}/>
  </>;
}

function LocalPdfReader() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const picker = useRef(null);
  useEffect(() => () => { if (file?.url) URL.revokeObjectURL(file.url); }, [file]);
  function choose(event) {
    const item = event.target.files?.[0]; event.target.value = '';
    if (!item) return;
    if (!item.name.toLowerCase().endsWith('.pdf') || item.size > 50 * 1024 * 1024) { setMessage('50MB 이하의 PDF 원본을 선택하세요.'); return; }
    setMessage(''); setFile({ name: item.name, size: item.size, url: URL.createObjectURL(item) });
  }
  return <section className="document-intro local-pdf-reader"><h2>내려받은 전체 PDF 읽기</h2><p>아래 발행기관 링크에서 받은 편람383쪽 또는 업무계획17쪽을 선택하세요. 브라우저의 PDF 화면에서 쪽수 이동·확대·검색으로 원문을 대조합니다. 파일은 현재 브라우저에서 열며 사이트에 업로드하거나 저장하지 않습니다.</p>
    <input ref={picker} type="file" accept=".pdf,application/pdf" hidden onChange={choose}/><div className="document-actions"><button className="btn secondary" onClick={() => picker.current?.click()}>내려받은 PDF 선택<FileText size={17}/></button>{file && <><a className="btn secondary" href={file.url} target="_blank" rel="noreferrer">전체 PDF 새 탭에서 읽기<ArrowUpRight size={17}/></a><button className="btn secondary" onClick={() => setFile(null)}>문서 닫기<X size={17}/></button></>}</div>
    {message && <p role="status">{message}</p>}{file && <><p className="reader-meta">{file.name} · {n(file.size)}바이트 · PDF 쪽수와 인쇄 쪽수를 구분하세요. 화면이 안 보이면 새 탭에서 읽기를 사용하세요.</p><Suspense fallback={<p>PDF 읽기 도구를 준비하는 중…</p>}><PdfReader key={file.url} url={file.url} name={file.name}/></Suspense></>}
  </section>;
}
