import React from 'react';
import { Download, ArrowUpRight } from 'lucide-react';
import workbook from '../content/student-workbook.json';
import './workbook-download.css';
export const workbookUrl = `${import.meta.env.BASE_URL}${workbook.path}`;
export function WorkbookDownload() {
  return <section className="workbook-download" aria-label="수강생 교재 다운로드">
    <img src={`${import.meta.env.BASE_URL}course/student-workbook-cover.jpg`} alt="울산대학교 초급반·중급반 AI 실습 교재 표지" loading="lazy" width="280" height="396"/>
    <div><span className="eyebrow">COURSE WORKBOOK / PREVIOUS EDITION</span><h2>이전 편성 기본 교재 PDF</h2><p>공개 문서 실습의 기본 개념과 기존 실행 기록을 담았습니다. 현재 중급반의 엑셀·PPT 자동화, 지침 파일·폴더 실습은 웹 교재와 새 자료 묶음을 사용하세요.</p><div className="workbook-specs"><span>{workbook.pages}쪽</span><span>{(workbook.bytes/1024/1024).toFixed(1)}MB</span><span>실제 화면{workbook.realScreens}개</span><span>원문 파일{workbook.embeddedSources}개 첨부</span></div>
    <div className="workbook-download-actions"><a className="btn primary" href={workbookUrl} download="울산대학교-AI실습-수강생교재.pdf">수강생 교재 PDF 다운로드<Download size={17}/></a><a className="btn secondary" href={workbookUrl} target="_blank" rel="noreferrer">PDF 미리보기<ArrowUpRight size={17}/></a></div>
    <small>기본 교재 v{workbook.version} · {workbook.updatedOn} · 개편된 작업 흐름·과정 편성은 웹 기준입니다. PDF는 이전 편성의 기본 교재이며 전체 요청문을 선택·복사할 수 있습니다. 실제 AI 실행과 기관 원문 조회에는 인터넷이 필요합니다.</small></div>
  </section>;
}
