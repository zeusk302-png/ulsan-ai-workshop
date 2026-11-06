import React from 'react';
import {ArrowRight,ArrowUpRight,BookOpen,Clock3,FileText,FolderOpen} from 'lucide-react';
import {SiteAccess} from './SiteAccess';
import './lobby.css';

const courses=[
  {id:'beginner',label:'기초반',number:'01',title:'AI 이해부터 첫 자료 기반 작업까지',description:'AI를 처음 쓰거나, 사용 방법을 체계적으로 정리하고 싶은 분을 위한 과정입니다.',topics:['AI 작동 원리 · 대표 모델 · 무료와 유료 · 환각','토큰과 컨텍스트 · 요청 설계와 수정','RAG 원리 · 노트북 · 공개 공문 실습'],start:'#basics?course=beginner&unit=ai'},
  {id:'intermediate',label:'심화반',number:'02',title:'RAG와 AI로 엑셀·PPT 작업 자동화',description:'AI 작업 지침과 폴더를 구성하고, 엑셀 분석부터 발표 자료까지 직접 완성하는 과정입니다.',topics:['AGENTS.md · CLAUDE.md · 작업 폴더의 역할과 이유','RAG 근거 → 엑셀 정리·수식·집계·차트','PPT 제작 · 스킬·디자인 참고 · 검토와 재실행'],start:'#automation?course=intermediate&unit=purpose'}
];

export function LobbyHeader(){
  return <header className="lobby-header"><a className="lobby-wordmark" href="#home">AI WORKROOM<span>.</span></a><span>울산대학교 · 생성형 AI 특강</span><a className="lobby-header-link" href="#documents">실습 자료실<ArrowUpRight size={15}/></a></header>;
}

export function WorkshopLobby(){
  return <div className="workshop-lobby">
    <section className="lobby-hero" aria-labelledby="lobby-title">
      <div className="lobby-hero-copy"><div className="lobby-eyebrow">ULSAN UNIVERSITY / AI WORKSHOP</div><h1 id="lobby-title">생성형 AI<br/><span>실무 활용</span></h1><p className="lobby-subtitle">AI를 이해하고, 내 자료로 일하는 방법.</p><p className="lobby-description">작동 원리와 도구 선택부터 자료 기반 질의응답까지.<br/>공개 문서와 교육용 데이터로 직접 실습합니다.</p><div className="lobby-facts"><span><Clock3 size={15}/>과정별 3시간</span><span><FileText size={15}/>공개 원문 실습</span><span>계정·도구 사전 확인</span></div></div>
      <SiteAccess/>
    </section>
    <section className="lobby-courses" aria-labelledby="lobby-courses-title"><div className="lobby-section-heading"><div><span>CHOOSE YOUR COURSE</span><h2 id="lobby-courses-title">수강할 과정을 선택하세요</h2></div><p>기초반과 심화반은 각각 독립된 3시간 과정입니다.</p></div><div className="lobby-course-grid">{courses.map(course=><article key={course.id} className={`lobby-course-card ${course.id}`}><div className="lobby-course-meta"><span>{course.number} / {course.label}</span><span><Clock3 size={14}/>3시간</span></div><h3>{course.title}</h3><p>{course.description}</p><ul>{course.topics.map(topic=><li key={topic}>{topic}</li>)}</ul><div className="lobby-course-actions"><a className="btn primary" href={course.start}>{course.label} 수업 입장<ArrowRight size={17}/></a><a href={`#${course.id}`} aria-label={`${course.label} 상세 구성`}>상세 구성<ArrowUpRight size={15}/></a></div></article>)}</div></section>
    <nav className="lobby-resources" aria-label="공통 수업 자료"><div><BookOpen size={20}/><span><b>수업 자료와 작업 기록</b><small>공개 원문·실습 파일·준비 안내·작업 기록을 확인하세요.</small></span></div><a href="#documents">실습 자료실<ArrowUpRight size={15}/></a><a href="#guide?course=beginner">수업 준비<ArrowUpRight size={15}/></a><a href="#workbook"><FolderOpen size={15}/>내 작업함<ArrowUpRight size={15}/></a></nav>
  </div>;
}

export function LobbyFooter(){
  return <footer className="lobby-footer"><span>ULSAN UNIVERSITY · AI WORKROOM</span><p>AI 이해 · 자료 분석 · 문서 작업</p></footer>;
}
