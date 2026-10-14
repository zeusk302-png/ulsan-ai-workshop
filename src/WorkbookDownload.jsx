import React from 'react';
import { Download, ArrowUpRight } from 'lucide-react';
import workbook from '../content/student-workbook.json';
import './workbook-download.css';
export const workbookUrl = `${import.meta.env.BASE_URL}${workbook.path}`;
export function WorkbookDownload() {
  return <section className="workbook-download" aria-label="수강생 교재 다운로드">
    <img src={`${import.meta.env.BASE_URL}course/student-workbook-cover.jpg`} alt="울산대학교 직장인 AI 실습 수강생 교재 표지" loading="lazy" width="280" height="396"/>
    <div><span className="eyebrow">STUDENT WORKBOOK / 6-HOUR COURSE</span><h2>수강생 교재 PDF</h2><p>준비부터 개념·실습·원문 검토·결과 저장까지. PDF를 보며 한 단계씩 따라갈 수 있습니다.</p><div className="workbook-specs"><span>{workbook.pages}쪽</span><span>{(workbook.bytes/1024/1024).toFixed(1)}MB</span><span>실제 화면{workbook.realScreens}개</span><span>원문 파일{workbook.embeddedSources}개 첨부</span></div>
    <div className="workbook-download-actions"><a className="btn primary" href={workbookUrl} download="울산대학교-AI실습-수강생교재.pdf">수강생 교재 PDF 다운로드<Download size={17}/></a><a className="btn secondary" href={workbookUrl} target="_blank" rel="noreferrer">PDF 미리보기<ArrowUpRight size={17}/></a></div>
    <small>v{workbook.version} · {workbook.updatedOn} · 전체 요청문을 선택·복사할 수 있습니다. 실제 AI 실행과 기관 PDF 원문 다운로드에는 인터넷이 필요합니다.</small></div>
  </section>;
}
