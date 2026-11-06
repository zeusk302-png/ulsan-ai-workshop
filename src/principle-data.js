// Separate, deliberately small teaching model; never the 10,000-row exercise.
export const principleRows=[
 {row:1,round:'R01',id:' a01 ',attendance:'Y',score:5},
 {row:2,round:'R01',id:'A01',attendance:'N',score:3},
 {row:3,round:'R01',id:'A02',attendance:'Y',score:null},
 {row:4,round:'R01',id:'A03',attendance:'Y',score:6},
 {row:5,round:'R01',id:'A04',attendance:'N',score:4},
 {row:6,round:'R01',id:'A05',attendance:'?',score:5},
 {row:7,round:'R01',id:'',attendance:'Y',score:4},
 {row:8,round:'R01',id:'A06',attendance:'Y',score:3},
];
export const evidenceRules=[
 {id:'§1.3',text:'참가자ID와 참여여부는 앞뒤 공백을 제거하고 영문을 대문자로 통일한다.',condition:'TRIM + UPPER'},
 {id:'§2.1–2.3',text:'빈 ID와 후속 중복은 제외, Y/N 밖의 참여값은 보류한다.',condition:'채택 / 제외 / 보류'},
 {id:'§3.1',text:'참여율 = 채택행 중 참여여부 Y 건수 / 채택행 건수.',condition:'참여 ÷ 채택'},
 {id:'§3.2–3.4',text:'채택 + 참여 Y의 정수 1~5점만 만족도 평균에 포함한다. 공란과 불량은 평균에서 제외한다.',condition:'유효 점수 합 ÷ 유효 응답'},
];
export function calculatePrinciple(rows=principleRows,{blankZero=false,extra=false}={}){
 const seen=new Set();
 const inputs=extra?[...rows,{row:9,round:rows[0]?.round||'R01',id:'A07',attendance:'Y',score:1}]:rows;
 const processed=inputs.map(raw=>{
  const id=raw.id.trim().toUpperCase(),attendance=raw.attendance.trim().toUpperCase(),key=`${raw.round}:${id}`;
  let status='채택',reason='ID·중복·참여 조건 통과',source='§2.4';
  if(!id){status='제외';reason='ID 누락';source='§2.1';}
  else if(seen.has(key)){status='제외';reason='후속 중복 · 원본 1행 유지';source='§2.2';}
  else {seen.add(key);if(!['Y','N'].includes(attendance)){status='보류';reason='참여값이 Y/N 밖';source='§2.3';}}
  const participating=status==='채택'&&attendance==='Y';
  const valid=participating&&Number.isInteger(raw.score)&&raw.score>=1&&raw.score<=5;
  const included=valid||(blankZero&&participating&&raw.score===null);
  return {...raw,id,rawId:raw.id,attendance,status,reason,source,participating,valid,included,contribution:valid?raw.score:0,cell:`정리!A${raw.row+1}:J${raw.row+1}`};
 });
 const count=s=>processed.filter(r=>r.status===s).length;
 const accepted=count('채택'),participants=processed.filter(r=>r.participating).length,responses=processed.filter(r=>r.included).length,sum=processed.reduce((a,r)=>a+r.contribution,0);
 return {rows:processed,raw:processed.length,accepted,excluded:count('제외'),held:count('보류'),participants,responses,sum,mean:responses?sum/responses:null,rate:accepted?participants/accepted:null};
}
export const principleCells={accepted:'요약!B2',participants:'요약!B3',sum:'요약!B4',responses:'요약!B5',rate:'요약!B6',mean:'요약!B7'};
