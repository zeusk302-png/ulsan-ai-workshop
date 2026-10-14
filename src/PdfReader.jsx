import React, { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfReader({ url, name }) {
  const [pdf, setPdf] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pageText, setPageText] = useState('');
  const [status, setStatus] = useState('전체 PDF를 여는 중…');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [searchStatus, setSearchStatus] = useState('');
  const canvas = useRef(null);
  const index = useRef(new Map());
  const searchToken = useRef(0);
  useEffect(() => {
    let alive = true;
    const task = getDocument({ url, useSystemFonts: true });
    setPdf(null); setStatus('전체 PDF를 여는 중…'); setPageNumber(1); index.current.clear();
    task.promise.then(doc => { if (alive) { setPdf(doc); setStatus(`전체 ${doc.numPages}쪽 로드됨`); } })
      .catch(() => { if (alive) setStatus('PDF를 열지 못했습니다. 위의 새 탭에서 읽기로 원본을 열어보세요.'); });
    return () => { alive = false; searchToken.current++; void task.destroy(); };
  }, [url]);
  useEffect(() => {
    if (!pdf) return;
    setStatus(`PDF ${pageNumber} / ${pdf.numPages}쪽을 표시하는 중…`);
    let alive = true, render;
    (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        if (!alive) return;
        const text = content.items.map(v => v.str || '').join(' ');
        index.current.set(pageNumber, text); setPageText(text);
        const viewport = page.getViewport({ scale: 1.7 * zoom });
        const element = canvas.current;
        element.width = Math.ceil(viewport.width); element.height = Math.ceil(viewport.height);
        render = page.render({ canvasContext: element.getContext('2d'), viewport });
        await render.promise;
        if (alive) setStatus(`PDF 뷰어 ${pageNumber} / ${pdf.numPages}쪽 · 원본 페이지 표시됨`);
      } catch (e) { if (alive && e.name !== 'RenderingCancelledException') setStatus('페이지 표시 실패 · 새 탭 원본을 확인하세요.'); }
    })();
    return () => { alive = false; render?.cancel(); };
  }, [pdf, pageNumber, zoom]);
  async function search(event) {
    event.preventDefault();
    const value = query.trim().toLocaleLowerCase();
    if (!pdf || !value) return;
    const token = ++searchToken.current, found = [];
    setMatches([]);
    for (let i=1; i<=pdf.numPages; i++) {
      if (token !== searchToken.current) return;
      let text = index.current.get(i);
      if (text === undefined) {
        try { const page = await pdf.getPage(i); const c = await page.getTextContent(); text = c.items.map(v => v.str || '').join(' '); index.current.set(i,text); }
        catch { text = ''; }
      }
      if (token !== searchToken.current) return;
      if (text.toLocaleLowerCase().includes(value)) found.push(i);
      if (i % 12 === 0 || i === pdf.numPages) setSearchStatus(`전체 ${pdf.numPages}쪽 중 ${i}쪽 검색 · ${found.length}쪽에서 발견`);
    }
    setMatches(found); setSearchStatus(found.length ? `${found.length}쪽에서 발견 · 번호를 눌러 원본으로 이동` : '추출 가능한 텍스트에서 찾지 못했습니다. 표·이미지와 띄어쓰기는 원본을 확인하세요.');
    if (found.length) setPageNumber(found[0]);
  }
  function move(value) { if (pdf && Number.isInteger(value) && value >= 1 && value <= pdf.numPages) setPageNumber(value); }
  return <div className="pdf-reader">
    <div className="pdf-controls"><button className="btn secondary" disabled={!pdf || pageNumber <= 1} onClick={() => move(pageNumber-1)}>이전 쪽</button><label>PDF 쪽 <input type="number" aria-label="PDF 쪽수" min="1" max={pdf?.numPages || 1} value={pageNumber} onChange={e => move(Number(e.target.value))}/></label><b>/ {pdf?.numPages || '…'}</b><button className="btn secondary" disabled={!pdf || pageNumber >= pdf.numPages} onClick={() => move(pageNumber+1)}>다음 쪽</button><label>확대 <select aria-label="PDF 확대" value={zoom} onChange={e => setZoom(Number(e.target.value))}><option value="1">화면 맞춤</option><option value="1.5">150%</option><option value="2">200%</option></select></label></div>
    <p className="reader-meta" role="status">{status}</p>
    <form className="pdf-search" onSubmit={search}><input aria-label="PDF 전체 검색" value={query} onChange={e => setQuery(e.target.value)} placeholder="전체 PDF에서 단어 찾기"/><button className="btn secondary" disabled={!pdf || !query.trim()}>전체 원문 검색</button><button className="btn secondary" type="button" onClick={() => { searchToken.current++; setSearchStatus('검색을 중지했습니다.'); }}>검색 중지</button></form>
    {searchStatus && <p className="reader-meta" role="status">{searchStatus}</p>}
    <div className="pdf-matches">{matches.map(i => <button key={i} onClick={() => move(i)}>{i}쪽</button>)}</div>
    <div className="pdf-canvas-wrap"><canvas ref={canvas} aria-label={`${name} 원본 PDF ${pageNumber}쪽`} style={{ width:`${zoom*100}%` }}/></div>
    {pdf && <details><summary>현재 쪽의 추출 텍스트 · 표 배치는 위 원본 확인</summary><p className="pdf-page-text">{pageText || '이 쪽에서 텍스트를 추출하지 못했습니다. 원본 페이지를 읽으세요.'}</p></details>}
  </div>;
}
