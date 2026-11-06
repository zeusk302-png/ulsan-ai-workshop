import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { Workbook, SpreadsheetFile, Presentation, PresentationFile } from '@oai/artifact-tool';

const root=process.argv[2], python=process.argv[3];
const out=path.join(root,'public/automation');
const build=path.join(root,'scripts/.automation-build');
const data=JSON.parse(await fs.readFile(path.join(build,'data.json'),'utf8'));
const skill=path.join(os.homedir(),'.codex/plugins/cache/openai-primary-runtime/presentations/26.1104.12130/skills/presentations');
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const font='Malgun Gothic';
const color={ink:'#20324D',accent:'#305FA1',muted:'#596A80',light:'#EDF2F8'};
const rawHeaders=['원본행','회차','참가자ID','프로그램','참여여부','만족도'];
const cleanHeaders=[...rawHeaders,'판정','사유','유효신청','참여수','유효응답','점수합','만족도처리'];
const ruleRows=[
 ['항목','기준','근거 위치'],
 ['자료 성격','강사 제작 교육용 가상 기준·가상 데이터','운영기준 첫머리'],
 ['원본 보존','48행 원본과 원본행 순서를 유지한다','1.1~1.2'],
 ['정규화','ID·참여여부의 앞뒤 공백 제거 및 영문 대문자','1.3'],
 ['ID 누락','제외하며 ID를 추정하지 않는다','2.1'],
 ['중복','동일회차 동일ID 첫 행만 후보, 후속행 제외','2.2'],
 ['참여 오류','Y/N 외는 보류, 신청·참여 분모분자 제외','2.3'],
 ['참여율','채택행 중 Y / 채택행 전체','3.1'],
 ['만족도','채택+Y 중 정수1~5의 합 / 유효응답 수','3.2~3.4'],
 ['미응답·불량','평균에서 제외하되 신청·참여는 유지','3.3'],
 ['표시','참여율 0.0%, 만족도 0.00/5점, 분자분모 표기','3.5'],
 ['해석','원인·전체주민 효과를 단정하지 않음','4.3~4.4'],
 ['출처','sources/operating-rules.txt 및 해당 회차 원본','4.1~4.2'],
];

function baseSheet(sheet,range){
 sheet.showGridLines=false;
 sheet.getRange(range).format.font.name=font;
 sheet.getRange(range).format.font.size=11;
 sheet.getRange(range).format.font.color=color.ink;
 sheet.getRange(range).format.rowHeight=23;
 sheet.getRange(range).format.verticalAlignment='center';
}
function header(sheet,address){
 sheet.getRange(address).format.fill=color.ink;
 sheet.getRange(address).format.font.color='#FFFFFF';
 sheet.getRange(address).format.font.bold=true;
 sheet.getRange(address).format.rowHeight=28;
}
async function workbook(round, solved){
 const wb=Workbook.create();
 const summary=wb.worksheets.add('요약');
 const cleaned=wb.worksheets.add('정리');
 const raw=wb.worksheets.add('원본');
 const evidence=wb.worksheets.add('근거');
 raw.getRange('A1:F49').values=[rawHeaders,...data[round].rows];
 baseSheet(raw,'A1:F49');header(raw,'A1:F1');
 raw.getRange('A1:A49').format.columnWidth=10;raw.getRange('B1:C49').format.columnWidth=16;
 raw.getRange('D1:D49').format.columnWidth=20;raw.getRange('E1:F49').format.columnWidth=14;
 raw.freezePanes.freezeRows(1);raw.tables.add('A1:F49',true,'RawRecords');
 baseSheet(evidence,'A1:C13'); evidence.getRange('A1:C13').values=ruleRows;header(evidence,'A1:C1');
 evidence.getRange('A1:A13').format.columnWidth=18;evidence.getRange('B1:B13').format.columnWidth=68;evidence.getRange('C1:C13').format.columnWidth=29;
 baseSheet(cleaned,'A1:M49');cleaned.getRange('A1:M1').values=[cleanHeaders];header(cleaned,'A1:M1');
 cleaned.getRange('A1:B49').format.columnWidth=10;cleaned.getRange('C1:C49').format.columnWidth=15;cleaned.getRange('D1:D49').format.columnWidth=18;cleaned.getRange('E1:G49').format.columnWidth=13;cleaned.getRange('H1:H49').format.columnWidth=28;cleaned.getRange('I1:L49').format.columnWidth=13;cleaned.getRange('M1:M49').format.columnWidth=20;cleaned.freezePanes.freezeRows(1);
 baseSheet(summary,'A1:L24');summary.getRange('A1:A24').format.columnWidth=27;summary.getRange('B1:B24').format.columnWidth=20;summary.getRange('C1:L24').format.columnWidth=12;
 summary.getRange('A2').values=[[`${round==='round-01'?'R01':'R02'} 운영 결과`]];summary.getRange('A2').format.font.size=16;summary.getRange('A2').format.font.bold=true;
 summary.getRange('A3').values=[['강사 제작 가상 자료 · 실제 사업 실적 아님']];summary.getRange('A3').format.font.color=color.muted;
 if(solved){
   const f=[];
   for(let r=2;r<=49;r++) f.push([
    `='원본'!A${r}`,`='원본'!B${r}`,`=UPPER(TRIM('원본'!C${r}))`,`='원본'!D${r}`,`=UPPER(TRIM('원본'!E${r}))`,`=IF(ISBLANK('원본'!F${r}),"",'원본'!F${r})`,
    `=IF(C${r}="","제외",IF(COUNTIF($C$2:C${r},C${r})>1,"제외",IF(OR(E${r}="Y",E${r}="N"),"채택","보류")))`,
    `=IF(C${r}="","참가자ID 누락",IF(COUNTIF($C$2:C${r},C${r})>1,"동일ID 후속 중복행",IF(OR(E${r}="Y",E${r}="N"),"기준 충족","참여여부 확인 필요")))`,
    `=IF(G${r}="채택",1,0)`,`=IF(AND(G${r}="채택",E${r}="Y"),1,0)`,
    `=IF(AND(J${r}=1,ISNUMBER(F${r}),F${r}>=1,F${r}<=5,IFERROR(INT(F${r})=F${r},FALSE)),1,0)`,
    `=IF(K${r}=1,F${r},0)`,`=IF(J${r}=0,"대상아님",IF(ISNUMBER(F${r}),IF(K${r}=1,"유효","범위/형식오류"),IF(F${r}="","미응답","범위/형식오류")))`
   ]);
   cleaned.getRange('A2:M49').formulas=f;
   cleaned.getRange('G2:G49').conditionalFormats.add('containsText',{text:'보류',format:{fill:'#FFF0C4',font:{color:'#7E4A00'}}});
   cleaned.getRange('G2:G49').conditionalFormats.add('containsText',{text:'제외',format:{fill:'#FBE4E1',font:{color:'#9A3029'}}});
   summary.getRange('A4:B15').values=[['지표','값'],['원본 기록 수',null],['유효 신청 수',null],['참여자 수',null],['참여율',null],['만족도 유효 응답 수',null],['만족도 점수 합',null],['만족도 평균 /5점',null],['제외행 수',null],['보류행 수',null],['만족도 미응답 수',null],['만족도 불량 수',null]];
   header(summary,'A4:B4');
   summary.getRange('B5:B15').formulas=[['=COUNTA(\'원본\'!A2:A49)'],['=SUM(\'정리\'!I2:I49)'],['=SUM(\'정리\'!J2:J49)'],['=IF(B6=0,"미확인",B7/B6)'],['=SUM(\'정리\'!K2:K49)'],['=SUM(\'정리\'!L2:L49)'],['=IF(B9=0,"미확인",B10/B9)'],['=COUNTIF(\'정리\'!G2:G49,"제외")'],['=COUNTIF(\'정리\'!G2:G49,"보류")'],['=COUNTIF(\'정리\'!M2:M49,"미응답")'],['=COUNTIF(\'정리\'!M2:M49,"범위/형식오류")']];
   summary.getRange('B8').setNumberFormat('0.0%');summary.getRange('B11').setNumberFormat('0.00');
   summary.getRange('A18:B21').values=[['프로그램','참여자 수'],['디지털기초',null],['생활문화',null],['진로탐색',null]];header(summary,'A18:B18');
   summary.getRange('B19:B21').formulas=[['=SUMIF(\'정리\'!D2:D49,A19,\'정리\'!J2:J49)'],['=SUMIF(\'정리\'!D2:D49,A20,\'정리\'!J2:J49)'],['=SUMIF(\'정리\'!D2:D49,A21,\'정리\'!J2:J49)']];
   const chart=summary.charts.add('bar',summary.getRange('A18:B21'));chart.setPosition('D5','L20');chart.title='프로그램별 참여자 수';chart.titleTextStyle.fontSize=14;chart.titleTextStyle.typeface=font;chart.xAxis={textStyle:{typeface:font,fontSize:11}};chart.yAxis={min:0,max:15,majorUnit:5,numberFormatCode:'0',numberFormatSourceLinked:false,textStyle:{typeface:font,fontSize:11}};chart.legend={position:'bottom',textStyle:{typeface:font,fontSize:11}};
   summary.getRange('A23').values=[['근거: 운영기준 2절·3절. 원본→정리→요약 순서로 추적합니다.']];summary.getRange('A24').values=[['48행 전용 예제 수식입니다. 행 추가 시 범위·차트도 확장하세요.']];
 } else {
   cleaned.getRange('A3').values=[['실습에서 원본 참조·정리 판정·검산용 수식을 작성합니다.']];
   summary.getRange('A5').values=[['실습 전 원본 파일']];summary.getRange('A7').values=[['원본: 48행 / ID누락·중복·참여오류·만족도오류 포함']];summary.getRange('A9').values=[['운영 기준을 확인한 뒤 정리·요약 시트를 작성하세요.']];summary.getRange('A11').values=[['완성 예시는 examples 폴더에 있습니다.']];
 }
 wb.recalculate();
 if(solved){
   const vals=summary.getRange('B5:B15').values.flat();const e=data[round].expected;
   const expected=[48,e.validApplicants,e.participants,e.participationRate,e.validResponses,e.scoreSum,e.satisfactionMean,e.excludedRows,e.heldRows,e.missingSatisfaction,e.invalidSatisfaction];
   for(let i=0;i<vals.length;i++)if(typeof vals[i]!=='number'||Math.abs(vals[i]-expected[i])>1e-10)throw new Error(`Calculation mismatch B${i+5}: ${vals[i]} expected ${expected[i]}`);
   console.log((await wb.inspect({kind:'table',range:'요약!A4:B15',include:'values,formulas',tableMaxRows:12,tableMaxCols:2})).ndjson);
   const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},summary:'Formula error scan'});await fs.writeFile(path.join(build,'workbook-error-scan.json'),errors.ndjson);
   // Verify the same formulas react to a replacement input; restore before export.
   raw.getRange('A2:F49').values=data['round-02'].rows;wb.recalculate();
   const rerun=summary.getRange('B5:B15').values.flat();const e2=data['round-02'].expected;
   const expected2=[48,e2.validApplicants,e2.participants,e2.participationRate,e2.validResponses,e2.scoreSum,e2.satisfactionMean,e2.excludedRows,e2.heldRows,e2.missingSatisfaction,e2.invalidSatisfaction];
   for(let i=0;i<rerun.length;i++)if(typeof rerun[i]!=='number'||Math.abs(rerun[i]-expected2[i])>1e-10)throw new Error(`R02 replay mismatch B${i+5}: ${rerun[i]} expected ${expected2[i]}`);
   await fs.writeFile(path.join(build,'rerun-verification.json'),JSON.stringify({engine:'Artifact Tool',input:'R02 replaces R01 raw rows in a temporary in-memory copy',expected:expected2,actual:rerun,restoredR01BeforeExport:true},null,2));
   raw.getRange('A2:F49').values=data[round].rows;wb.recalculate();
 }
 const target=solved?'examples/round-01-summary.xlsx':`data/${round}.xlsx`;
 await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(out,target));
 for(const [sheetName,range] of solved?[['요약','A1:L24'],['정리','A1:M9'],['원본','A1:F10'],['근거','A1:C13']]:[['요약','A1:H12']]){
   try {const img=await wb.render({sheetName,range,scale:1.5,format:'png'});await fs.writeFile(path.join(build,`${solved?'example':round}-${sheetName}.png`),new Uint8Array(await img.arrayBuffer()));}catch(err){await fs.writeFile(path.join(build,`${solved?'example':round}-${sheetName}-render.txt`),String(err));console.log('Spreadsheet render unavailable:',sheetName,String(err).slice(0,180));}
 }
 return wb;
}

function textbox(slide,text,x,y,w,h,size=30,bold=false,fill=color.ink){
 const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 shape.text=text;shape.text.style={fontFamily:font,typeface:font,fontSize:size,bold,color:fill};return shape;
}
function slide(p,title,number,isTemplate=false){
 const s=p.slides.add();s.background.fill='#FFFFFF';textbox(s,title,72,58,1136,92,42,true);textbox(s,`교육용 가상 자료 · ${isTemplate?'[회차]':'R01'}   ${number}/5`,72,650,1136,30,18,false,color.muted);
 s.speakerNotes.text='출처: 강사 제작 운영기준 v1.0 및 round-01.xlsx. 실제 기관의 실적이나 외부 AI 실행 결과가 아닙니다. 엑셀 요약값과 슬라이드 숫자를 대조하세요.';
 return s;
}
async function deck(template){
 const p=Presentation.create({slideSize:{width:1280,height:720}});const e=data['round-01'].expected;
 let s=slide(p,template?'[프로그램명] 운영 결과':'교육 프로그램 운영 결과',1,template);
 textbox(s,template?'[회차와 보고 범위]':'R01 · 신청 기록 48건 검토',72,215,1100,100,49,true,color.accent);
 textbox(s,'강사 제작 가상 데이터로 작성한 보고서',72,350,1100,70,30);
 textbox(s,template?'[원본 파일·기준 버전·보고자]':'기준: 운영·보고 기준 v1.0\n자료: round-01.xlsx / 실제 사업 실적 아님',72,460,1100,100,25,false,color.muted);
 s=slide(p,'데이터 정리 결과',2,template);
 textbox(s,template?'[원본 48 = 채택 + 제외 + 보류]':`원본 48 = 채택 ${e.validApplicants} + 제외 ${e.excludedRows} + 보류 ${e.heldRows}`,72,200,1136,90,43,true,color.accent);
 textbox(s,template?'[제외·보류 사유와 처리 기준]':'제외 2건: ID 누락 1건, 후속 중복 1건\n보류 1건: 참여여부 Y/N 확인 필요\n정규화: 앞뒤 공백 제거·영문 대문자 통일',72,340,1136,190,31);
 textbox(s,'근거: 운영기준 1.3·2.1~2.4 / 원본·정리 시트',72,565,1136,45,21,false,color.muted);
 s=slide(p,'참여율과 프로그램별 참여자',3,template);
 textbox(s,template?'[참여자/유효 신청 = 참여율]':`${e.participants}/${e.validApplicants} = ${(e.participationRate*100).toFixed(1)}%`,72,180,530,100,50,true,color.accent);
 textbox(s,'분자: 채택행 중 참여 Y\n분모: 채택행 전체(Y·N)',72,330,520,115,29);
 if(template)textbox(s,'[프로그램별 참여자 수 차트 삽입]\n단위: 명',670,220,500,230,27,false,color.muted);
 else {
   const chart=s.charts.add('bar',{position:{left:650,top:175,width:550,height:350},categories:Object.keys(e.programParticipants),series:[{name:'참여자 수',values:Object.values(e.programParticipants),fill:color.accent}],hasLegend:false,barOptions:{direction:'column',grouping:'clustered'},dataLabels:{showValue:true,position:'outEnd',textStyle:{fontSize:20}},yAxis:{min:0,max:15,majorUnit:5,numberFormatCode:'0',textStyle:{fontSize:18},majorGridlines:{fill:'#E1E7EF',width:1}},xAxis:{textStyle:{fontSize:20}}});
   applyPresentationChartFont(chart,{fontFamily:font});
 }
 textbox(s,'근거: 운영기준 3.1 / 요약 B6:B8, A18:B21',72,565,1136,45,21,false,color.muted);
 s=slide(p,'만족도 집계',4,template);
 textbox(s,template?'[점수 합 / 유효 응답 수 = 평균]':`${e.scoreSum}/${e.validResponses} = ${e.satisfactionMean.toFixed(2)}/5점`,72,200,1136,100,52,true,color.accent);
 textbox(s,template?'[미응답·범위/형식오류 처리와 분모]':`참여자 ${e.participants}명 중 유효 응답 ${e.validResponses}명\n미응답 ${e.missingSatisfaction}명·범위/형식오류 ${e.invalidSatisfaction}명은 평균에서 제외\n신청·참여 건수는 그대로 유지`,72,350,1136,180,31);
 textbox(s,'근거: 운영기준 3.2~3.5 / 요약 B9:B11, B14:B15',72,565,1136,45,21,false,color.muted);
 s=slide(p,'확인할 사항과 다음 작업',5,template);
 textbox(s,template?'[미확인 사항과 확인 방법]\n[다음 회차에 유지할 기준]\n[변경할 입력·회차·파일명]':'보류 1건은 참여여부 원본 확인 필요\n미응답·불량 만족도는 0점으로 대체하지 않음\nR02 입력으로 같은 기준을 다시 적용',72,200,1136,200,33);
 textbox(s,'이 자료만으로 실제 사업 효과나 증감 원인을 단정하지 않습니다.\n다음 회차에는 분모·차트·PPT 수치·출처를 함께 확인합니다.',72,465,1136,105,26,false,color.muted);
 const name=template?'report-template':'round-01-report';
 for(let i=0;i<p.slides.items.length;i++){
   try{const image=await p.export({slide:p.slides.items[i],format:'png',scale:1});await fs.writeFile(path.join(build,`${name}-${i+1}.png`),new Uint8Array(await image.arrayBuffer()));}catch(err){console.log('Presentation render unavailable',name,i+1,String(err).slice(0,220));await fs.writeFile(path.join(build,`${name}-${i+1}-render.txt`),String(err));}
 }
 const candidate=path.join(build,`${name}-candidate.pptx`);await(await PresentationFile.exportPptx(p)).save(candidate);
 const final=path.join(out,template?'templates/report-template.pptx':'examples/round-01-report.pptx');await fs.rm(final,{force:true});
 await fs.rm(path.join(build,`${name}-validation.json`),{force:true});
 await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath:final,pythonExecutable:python,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],explicitTotalSlideCount:5,requiredNativeChartOwnerSlides:template?[]:[3],materializeLiteralChartWorkbooks:!template,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(build,`${name}-validation.json`)});
 console.log('PPTX finalized',final);
}

await workbook('round-01',false);await workbook('round-02',false);await workbook('round-01',true);await deck(true);await deck(false);
