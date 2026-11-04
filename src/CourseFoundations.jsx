import React from 'react';
import { courseFoundations } from './course-foundations';
import './course-foundations.css';

export function CourseFoundations({ label }) {
  return <section className="course-foundations" aria-label={`${label} AI 기본 안내`}>
    <span className="eyebrow">{label} / START HERE</span>
    <h2>{courseFoundations.title}</h2>
    <p>{courseFoundations.introduction}</p>
    <div className="foundation-grid">{courseFoundations.items.map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
    <h3>활용 영역</h3>
    <ul>{courseFoundations.areas.map(([title, text]) => <li key={title}><b>{title}</b> · {text}</li>)}</ul>
    <p>오늘 만들고 싶은 결과물 한 개를 정하고, 실습 후 다음에 적용할 일을 기록하세요.</p>
  </section>;
}
