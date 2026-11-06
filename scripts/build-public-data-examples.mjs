import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const workspace=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const build=path.join(workspace,'artifacts/public-data-examples-build');
const runtime=process.env.CODEX_ARTIFACT_RUNTIME||'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1104-1290-0_26.1104.1290.0_x64__3k8sg7r9htsxt/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
process.env.RUNTIME_NODE=path.join(runtime,'node/bin/node.exe');
const skill=process.env.CODEX_PRESENTATIONS_SKILL||path.join(process.env.USERPROFILE||process.env.HOME||'', '.codex/plugins/cache/openai-primary-runtime/presentations/26.1104.12130/skills/presentations');
const runtimePython=path.join(runtime,'python/python.exe');
const requireRuntime=createRequire(path.join(runtime,'node/runtime-anchor.mjs'));
const {Workbook,SpreadsheetFile,Presentation,PresentationFile}=await import(pathToFileURL(requireRuntime.resolve('@oai/artifact-tool')).href);
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const meta=JSON.parse(await fs.readFile(path.join(workspace,'content/public-data-course.json'),'utf8'));
const previous=meta.snapshots['202606'],current=meta.snapshots['202609'],temporal=meta.temporal;
const examples=path.join(workspace,'public/automation/public-data/examples'),templates=path.join(workspace,'public/automation/public-data/templates');
await Promise.all([fs.mkdir(build,{recursive:true}),fs.mkdir(examples,{recursive:true}),fs.mkdir(templates,{recursive:true})]);
const font='Malgun Gothic',ink='#20334A',blue='#245C8A',prior='#8A9CAF',muted='#536579',light='#EEF3F7',amber='#8A5D17';
const count=value=>Number(value).toLocaleString('ko-KR'),signed=value=>`${value>0?'+':''}${count(value)}`;
const districts=Object.keys(previous.districts).sort((a,b)=>current.districts[b]-current.districts[a]);
const industries=Object.keys(current.largeIndustries).sort((a,b)=>current.largeIndustries[b]-current.largeIndustries[a]);
const cafeTotal=s=>s.smallIndustries.find(item=>item.code==='I21201')?.count;
assert.equal(previous.rows,54737);assert.equal(current.rows,53777);assert.equal(previous.columns,39);assert.equal(current.columns,39);
assert.equal(temporal.matchedIds+temporal.newlyObservedIds,current.rows);assert.equal(temporal.matchedIds+temporal.noLongerObservedIds,previous.rows);
for(const s of [previous,current]){assert.equal(Object.values(s.districts).reduce((a,b)=>a+b,0),s.rows);assert.equal(Object.values(s.largeIndustries).reduce((a,b)=>a+b,0),s.rows);assert.equal(s.cafeByDong.reduce((sum,d)=>sum+d.count,0),cafeTotal(s));}
for(const source of meta.provenance){const bytes=await fs.readFile(path.join(workspace,'public',source.localPath));assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);}

const workbook=Workbook.create();
const summary=workbook.worksheets.add('요약'),detail=workbook.worksheets.add('상세집계'),source=workbook.worksheets.add('출처와품질');
for(const sheet of [summary,detail,source]){sheet.showGridLines=false;sheet.getRange('A1:Q150').format.font={name:font,size:11,color:ink};sheet.getRange('A1:Q150').format.rowHeight=23;sheet.getRange('A1:A150').format.columnWidth=3;sheet.getRange('B1:B150').format.columnWidth=23;sheet.getRange('C1:F150').format.columnWidth=15;sheet.getRange('G1:G150').format.columnWidth=3;sheet.getRange('H1:Q150').format.columnWidth=11;}
summary.tabColor=blue;
function cell(sheet,address,value){sheet.getRange(address).values=[[value]];}
function title(sheet,address,value){cell(sheet,address,value);sheet.getRange(address).format.font={name:font,size:16,bold:true,color:ink};sheet.getRange(address).format.rowHeight=30;}
function header(sheet,range,values){sheet.getRange(range).values=[values];sheet.getRange(range).format={fill:blue,font:{name:font,size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:27};}
function table(sheet,top,headers,rows){const last=String.fromCharCode(66+headers.length-1);header(sheet,`B${top}:${last}${top}`,headers);sheet.getRange(`B${top+1}:${last}${top+rows.length}`).values=rows;sheet.getRange(`C${top+1}:${last}${top+rows.length}`).setNumberFormat('#,##0');sheet.getRange(`B${top+rows.length}:${last}${top+rows.length}`).format.borders={bottom:{style:'thin',color:'#AFBFCC'}};}
title(summary,'B2','울산 상가업소 공개데이터 요약');
cell(summary,'B4','2026년 6월 30일과 9월 30일의 전체 공개 목록');
cell(summary,'B5','두 CSV 전체 108,514행을 집계했습니다. 원본 39열 CSV는 별도 제공하며 이 파일에는 중복 수록하지 않았습니다.');
summary.getRange('B4:B5').format.font={name:font,size:11,color:muted};
table(summary,7,['기준 시점','전체 행 수','열 수','고유 업소번호','카페 행 수'],[['2026-06-30',previous.rows,39,previous.uniqueIds,cafeTotal(previous)],['2026-09-30',current.rows,39,current.uniqueIds,cafeTotal(current)]]);
title(summary,'B12','구·군별 목록 행 수');
table(summary,14,['구·군','2026년 6월','2026년 9월','목록 증감','9월 구성비'],districts.map(d=>[d,previous.districts[d],current.districts[d],null,null]));
for(let i=0;i<districts.length;i++){const r=15+i;summary.getRange(`E${r}:F${r}`).formulas=[[`=D${r}-C${r}`,`=D${r}/$D$20`]];}
cell(summary,'B20','합계');summary.getRange('C20:E20').formulas=[['=SUM(C15:C19)','=SUM(D15:D19)','=D20-C20']];summary.getRange('F15:F20').setNumberFormat('0.0%');
summary.getRange('B20:F20').format.font={name:font,size:11,bold:true,color:ink};summary.getRange('C20:E20').setNumberFormat('#,##0');
title(summary,'B25','상권업종 대분류');
table(summary,27,['원본 업종명','2026년 6월','2026년 9월','목록 증감','9월 구성비'],industries.map(name=>[name,previous.largeIndustries[name],current.largeIndustries[name],null,null]));
industries.forEach((_,i)=>{const r=28+i;summary.getRange(`E${r}:F${r}`).formulas=[[`=D${r}-C${r}`,`=D${r}/$D$38`]];});
cell(summary,'B38','합계');summary.getRange('C38:E38').formulas=[['=SUM(C28:C37)','=SUM(D28:D37)','=D38-C38']];summary.getRange('C38:E38').setNumberFormat('#,##0');summary.getRange('F28:F38').setNumberFormat('0.0%');
title(summary,'B43','목록 비교와 해석 범위');
table(summary,45,['비교 항목','행 수'],[['두 시점에 모두 관찰',temporal.matchedIds],['9월에만 관찰',temporal.newlyObservedIds],['6월에만 관찰',temporal.noLongerObservedIds],['전체 목록 순증감',temporal.netRows]]);
cell(summary,'B51','9월에만·6월에만 보이는 업소번호를 개업·폐업 건수로 해석하지 않습니다.');
cell(summary,'B52','매출·개폐업일·생존율·수익성은 원본 제공 항목으로 계산할 수 없습니다.');
cell(summary,'B53','구·군은 시군구명, 카페의 동은 행정동명, 업종은 상권업종 분류를 사용했습니다.');
summary.getRange('B51:B53').format.font={name:font,size:11,color:muted};
const chart1=summary.charts.add('bar',summary.getRange('B14:D19'));chart1.title='구·군별 공개 목록 행 수';chart1.setPosition('H12','R24');
const chart2=summary.charts.add('bar',[summary.getRange('B27:B37'),summary.getRange('D27:D37')]);chart2.title='2026년 9월 업종별 행 수';chart2.setPosition('H26','R44');
for(const chart of [chart1,chart2]){chart.titleTextStyle.typeface=font;chart.titleTextStyle.fontSize=15;chart.xAxis={axisType:'textAxis',textStyle:{typeface:font,fontSize:12}};chart.yAxis={min:0,numberFormatCode:'#,##0',numberFormatSourceLinked:false,textStyle:{typeface:font,fontSize:12}};chart.legend={position:'top',textStyle:{typeface:font,fontSize:12}};chart.series.items.forEach((s,i)=>s.fill=i?blue:prior);}
chart2.hasLegend=false;chart2.series.items[0].fill=blue;

title(detail,'B2','전체 구·군·업종 집계와 카페의 행정동 분포');
cell(detail,'B4','모든 원본 행을 포함합니다. 같은 업소번호라도 서로 다른 시점의 목록을 합쳐 한 업소로 세지 않았습니다.');
const cross=[];for(const d of districts)for(const name of industries){const lookup=s=>s.districtByLarge.find(x=>x.district===d&&x.industry===name)?.count??0;cross.push([d,name,lookup(previous),lookup(current),null]);}
table(detail,6,['구·군','원본 대분류명','2026년 6월','2026년 9월','목록 증감'],cross);
for(let i=0;i<cross.length;i++)detail.getRange(`F${7+i}`).formulas=[[`=E${7+i}-D${7+i}`]];
detail.getRange('C1:C150').format.columnWidth=22;detail.freezePanes.freezeRows(6);
const cafeKeys=[...new Set([...previous.cafeByDong,...current.cafeByDong].map(d=>d.dongCode))];
const cafes=cafeKeys.map(key=>{const a=previous.cafeByDong.find(x=>x.dongCode===key),b=current.cafeByDong.find(x=>x.dongCode===key),d=b||a;return [d.district,d.dong,d.dongCode,a?.count??0,b?.count??0,null];}).sort((a,b)=>b[4]-a[4]||a[2].localeCompare(b[2]));
title(detail,'B60','카페 I21201의 전체 행정동 분포');
cell(detail,'B62','원본 상권업종 소분류 코드 I21201만 선택했습니다. 행정동 코드로 연결하고 원본 명칭을 유지했습니다.');
table(detail,64,['구·군','행정동명','행정동 코드','2026년 6월','2026년 9월','목록 증감'],cafes);
cafes.forEach((_,i)=>detail.getRange(`G${65+i}`).formulas=[[`=F${65+i}-E${65+i}`]]);
detail.getRange(`D65:D${64+cafes.length}`).setNumberFormat('@');detail.getRange('G64:G120').format.columnWidth=15;

title(source,'B2','출처·자료 범위·품질');
cell(source,'B4','소상공인시장진흥공단 상가(상권)정보');cell(source,'B5',meta.source);
cell(source,'B7','원본 CSV 전체를 읽은 집계 결과입니다. 원본 행·업소번호·주소·좌표·분류명은 수정하지 않았습니다.');
source.getRange('B4:B7').format.font={name:font,size:11,color:muted};
table(source,9,['항목','2026년 6월','2026년 9월'],[['전체 행 수',previous.rows,current.rows],['열 수',previous.columns,current.columns],['업소번호 누락 행',previous.missingIdRows,current.missingIdRows],['중복 업소번호 행',previous.duplicateIdRows,current.duplicateIdRows],['코드북 미등록 행',previous.classificationUnknownRows,current.classificationUnknownRows],['분류 계층 코드 불일치',previous.hierarchyCodeMismatchRows,current.hierarchyCodeMismatchRows],['범위 밖·잘못된 좌표',previous.invalidCoordinates,current.invalidCoordinates],['코드북과 명칭 차이가 있는 행',previous.classificationLabelDifferenceRows,current.classificationLabelDifferenceRows]]);
cell(source,'B20','명칭 차이에는 2023년 코드북과 2026년 원본의 표현 차이가 포함됩니다. 해당 행을 불량으로 제외하지 않았습니다.');
table(source,22,['명칭 차이 항목','2026년 6월','2026년 9월'],Object.keys(current.classificationLabelDifferenceByField).map(key=>[key,previous.classificationLabelDifferenceByField[key],current.classificationLabelDifferenceByField[key]]));
title(source,'B28','공통 업소번호의 필드 차이');
table(source,30,['필드','값이 달라진 행'],Object.entries(temporal.matchedFieldDifferences));
cell(source,'B40','두 시점 공통 업소번호 51,145개 중 경도·위도 값이 각각 1,223개 달랐습니다. 원인과 실제 이전 여부는 이 자료로 확정하지 않습니다.');
title(source,'B43','원본 필드별 공란');
table(source,45,['원본 필드','2026년 6월','2026년 9월'],meta.fields.map(field=>[field,previous.missingByField[field],current.missingByField[field]]));
cell(source,'B86','지점명·건물명·동·층·호 공란은 필드 성격에 따라 발생합니다. 공란이라는 이유만으로 업소 행을 삭제하지 않았습니다.');
title(source,'B89','원본 파일과 식별값');
let sr=91;for(const item of meta.provenance){for(const [label,value]of [['기준일',item.asOf],['공식 원본명',item.originalMember],['원본 크기(바이트)',item.bytes],['SHA256',item.sha256],['공식 다운로드',item.downloadUrl]]){cell(source,`B${sr}`,label);cell(source,`C${sr}`,value);sr++;}sr++;}
title(source,'B105','2026년 원본명과 2023년 코드북명 예시');
table(source,107,['소분류 코드','원본 대분류명','코드북 대분류명','원본 소분류명','코드북 소분류명'],current.classificationLabelExamples.slice(0,10).map(d=>[d.code,d.snapshotLarge,d.codebookLarge,d.snapshotSmall,d.codebookSmall]));
source.getRange('C1:F150').format.columnWidth=25;source.getRange('B1:B150').format.columnWidth=29;source.getRange('B20:B20').format.font={name:font,size:11,color:amber};
source.getRange('B108:F117').format.wrapText=true;source.getRange('B108:F117').format.rowHeight=38;source.getRange('B108:F117').format.verticalAlignment='center';
source.freezePanes.freezeRows(9);
workbook.recalculate();
assert.equal(summary.getRange('D20').values[0][0],current.rows);assert.equal(summary.getRange('D38').values[0][0],current.rows);assert.equal(summary.getRange('E20').values[0][0],-960);
const originalDistrictValue=summary.getRange('D15').values[0][0];
cell(summary,'D15',originalDistrictValue+1);
assert.equal(summary.getRange('D20').values[0][0],current.rows+1,'district total recalculates');
assert.equal(summary.getRange('E15').values[0][0],originalDistrictValue+1-previous.districts[districts[0]],'district change recalculates');
assert.ok(Math.abs(summary.getRange('F15').values[0][0]-(originalDistrictValue+1)/(current.rows+1))<1e-12,'share recalculates');
cell(summary,'D15',originalDistrictValue);workbook.recalculate();
assert.equal(chart1.series.items.length,2);assert.equal(chart2.series.items.length,1);
await fs.writeFile(path.join(build,'workbook-chart-bindings.json'),JSON.stringify([chart1,chart2].map(c=>({title:c.title.text,series:c.series.items.map(s=>({name:s.name,valuesFormula:s.formula,categoryFormula:s.categoryFormula}))})),null,2));
const err=await workbook.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!',options:{useRegex:true,maxResults:50},maxChars:4000});await fs.writeFile(path.join(build,'workbook-formula-scan.ndjson'),err.ndjson);
for(const [sheet,range]of [['요약','B2:R54'],['상세집계','B2:G24'],['출처와품질','B2:F26']]){const img=await workbook.render({sheetName:sheet,range,scale:1,format:'png'});await fs.writeFile(path.join(build,`${sheet}.png`),new Uint8Array(await img.arrayBuffer()));}
for(const [sheet,range,name]of [['상세집계','B60:G82','cafe-detail'],['출처와품질','B105:F117','classification-labels']]){const img=await workbook.render({sheetName:sheet,range,scale:1,format:'png'});await fs.writeFile(path.join(build,`${name}.png`),new Uint8Array(await img.arrayBuffer()));}
const workbookPath=path.join(examples,'ulsan-summary.xlsx');await(await SpreadsheetFile.exportXlsx(workbook)).save(workbookPath);
await fs.rename(workbookPath+'.inspect.ndjson',path.join(build,'workbook-export-inspect.ndjson')).catch(error=>{if(error.code!=='ENOENT')throw error;});

function text(slide,value,left,top,width,height,size=26,bold=false,color=ink){const box=slide.shapes.add({geometry:'textbox',position:{left,top,width,height},fill:'none',line:{fill:'none',width:0}});box.text=value;box.text.style={typeface:font,fontSize:size,bold,color,insets:0,autoFit:'none',verticalAlignment:'top',wrap:'square'};return box;}
function slideBase(p,title,n,scope='2026년 6월·9월 공개 목록'){const slide=p.slides.add();slide.background.fill='#FFFFFF';text(slide,title,64,42,1152,78,40,true);text(slide,scope,64,126,1152,34,22,false,muted);text(slide,`소상공인시장진흥공단 상가(상권)정보  ${n}/5`,64,670,1152,24,16,false,muted);slide.speakerNotes.text=`출처: ${meta.source}\n원본: ${meta.provenance.map(s=>`${s.originalMember} (${s.asOf})`).join(', ')}\n전체 CSV ${previous.rows}+${current.rows}행을 집계했습니다. 원본 CSV는 별도 보존합니다.`;return slide;}
function nativeTable(slide,values,left,top,width,height,widths){const table=slide.tables.add({rows:values.length,columns:values[0].length,left,top,width,height,values,columnWidths:widths});table.borders.assign({style:'solid',fill:'#D8E1E8',width:1});for(let r=0;r<values.length;r++)for(let c=0;c<values[0].length;c++){const cell=table.getCell(r,c);cell.fill=r===0?blue:r%2?'#FFFFFF':light;cell.text.style={typeface:font,fontSize:r===0?22:24,color:r===0?'#FFFFFF':ink,bold:r===0,insets:10,verticalAlignment:'middle'};}return table;}
function nativeChart(slide,categories,series,left,top,width,height){const chart=slide.charts.add('bar',{position:{left,top,width,height},categories,series,hasLegend:series.length>1,legend:{position:'top',textStyle:{fontSize:20}},barOptions:{direction:'bar',grouping:'clustered',gapWidth:100},xAxis:{min:0,numberFormatCode:'#,##0',textStyle:{fontSize:18},majorGridlines:{fill:'#E4EAF0',width:1}},yAxis:{textStyle:{fontSize:21}},dataLabels:{showValue:true,position:'outEnd',numberFormatCode:'#,##0',textStyle:{fontSize:19}},chartFill:'#FFFFFF',plotAreaFill:'#FFFFFF'});applyPresentationChartFont(chart,{fontFamily:font});return chart;}
const report=Presentation.create({slideSize:{width:1280,height:720}});
let slide=slideBase(report,'울산 상가업소 공개데이터 분석',1);
text(slide,'전체 공개 목록 108,514행',64,203,1152,65,46,true,blue);
nativeTable(slide,[['기준 시점','목록 행 수','원본 열 수'],['2026년 6월 30일',count(previous.rows),'39열'],['2026년 9월 30일',count(current.rows),'39열']],64,304,1152,209,[620,300,232]);
text(slide,'각 시점의 전체 CSV를 집계했습니다. 원본 CSV는 별도 제공합니다.',64,548,1152,72,25,false,muted);
slide=slideBase(report,'구·군별 상가업소 목록',2,'행 수 기준. 구·군은 원본 시군구명 사용');
nativeChart(slide,districts,[{name:'2026년 6월',values:districts.map(d=>previous.districts[d]),fill:prior},{name:'2026년 9월',values:districts.map(d=>current.districts[d]),fill:blue}],64,187,1152,429);
text(slide,`9월 남구 ${count(current.districts['남구'])}행. 구·군 합계 ${count(current.rows)}행`,64,623,1152,31,23,false,muted);
slide=slideBase(report,'업종별 분포와 카페의 행정동 분포',3,'2026년 9월. 원본 상권업종 분류명과 행정동 사용');
nativeChart(slide,industries.slice(0,6),[{name:'2026년 9월',values:industries.slice(0,6).map(i=>current.largeIndustries[i]),fill:blue}],64,195,628,410);
text(slide,`카페 I21201  ${count(cafeTotal(current))}행`,744,196,472,42,27,true);
nativeTable(slide,[['행정동','카페 행 수'],...current.cafeByDong.slice(0,5).map(d=>[`${d.district} ${d.dong}`,count(d.count)])],744,253,472,310,[326,146]);
text(slide,'왼쪽은 대분류 상위 6개. 전체 업종·55개 행정동은 XLSX에 수록',64,620,1152,36,22,false,muted);
slide=slideBase(report,'목록 변화와 필드 차이',4,'업소번호를 연결해 두 공개 시점의 목록을 비교');
nativeTable(slide,[['목록 비교','업소번호 수'],['두 시점 모두 관찰',count(temporal.matchedIds)],['9월에만 관찰',count(temporal.newlyObservedIds)],['6월에만 관찰',count(temporal.noLongerObservedIds)],['9월 전체 목록 순증감',signed(temporal.netRows)]],64,197,660,323,[450,210]);
text(slide,'공통 업소번호 51,145개',777,198,439,42,27,true);
text(slide,'상호·주소·분류코드 차이 0행\n경도·위도 차이 각각 1,223행',777,261,439,126,26);
text(slide,'코드북 미등록·계층 코드 불일치 0행\n명칭 차이 행은 제외하지 않음',777,426,439,108,24,false,muted);
text(slide,'목록의 신규 관찰·미관찰은 실제 개업·폐업 건수를 뜻하지 않습니다.',64,573,1152,65,27,true,amber);
slide=slideBase(report,'자료의 한계와 다음 시점 재사용',5,'관찰한 목록의 구성과 차이만 설명');
text(slide,'원본이 제공하는 범위',64,202,530,42,29,true);
text(slide,'업소 식별번호와 업종\n구·군 및 행정동\n주소와 위치 좌표',64,271,530,156,28);
text(slide,'원본만으로 알 수 없는 내용',678,202,538,42,29,true);
text(slide,'매출과 수익성\n개업·폐업일과 생존율\n증감과 좌표 변경의 원인',678,271,538,156,28);
text(slide,'다음 공개 시점에도 같은 분류 기준으로 집계하고, 원본과 이전 결과를 별도 보존합니다.',64,483,1152,98,29,true,blue);
text(slide,'2023년 코드북 명칭과 2026년 원본 명칭은 함께 보존했습니다.',64,602,1152,38,22,false,muted);

const template=Presentation.create({slideSize:{width:1280,height:720}});
const templateBodies=[
 ['울산 상가업소 현황','자료 범위와 기준 시점',[['자료','기준일','전체 행 수'],['원본 1','[기준일]','[전체 행 수]'],['원본 2','[기준일]','[전체 행 수]']]],
 ['구·군별 상가업소 목록','시점별 전체 목록에서 집계',[['구·군','이전 시점','다음 시점'],...districts.map(d=>[d,'[행 수]','[행 수]'])]],
 ['업종과 카페의 행정동 분포','원본 업종 코드와 행정동 기준',[['분석 대상','결과'],['업종별 분포','[엑셀 차트 또는 편집 가능한 표]'],['카페 행정동 분포','[원본 코드 I21201 집계]']]],
 ['목록 변화와 자료 품질','업소번호 연결 결과',[['비교 항목','집계 결과'],['두 시점 모두 관찰','[업소번호 수]'],['다음 시점에만 관찰','[업소번호 수]'],['이전 시점에만 관찰','[업소번호 수]']]],
 ['자료의 한계와 다음 시점 재사용','해석 범위와 후속 작업',[['항목','내용'],['확인할 수 있는 내용','[목록 구성과 차이]'],['확인할 수 없는 내용','[매출·개폐업 등 원본에 없는 항목]'],['다음 시점 작업','[같은 기준으로 재집계]']]]
];
for(const [index,[name,context,values]]of templateBodies.entries()){const s=slideBase(template,name,index+1,context);nativeTable(s,values,64,211,1152,index===1?340:290,values[0].length===3?[550,301,301]:[390,762]);text(s,'[출처 파일과 기준일을 입력]',64,582,1152,42,23,false,muted);s.speakerNotes.text=`이 양식은 공개데이터 분석 결과를 입력하는 편집 가능한 5장 PPTX입니다. [] 안은 실제 집계로 바꿉니다. 원본 출처: ${meta.source}`;}

async function exportDeck(p,name,outputDirectory,requirements){
 const staging=path.join(build,name);await fs.mkdir(staging,{recursive:true});
 const candidate=path.join(staging,'candidate.pptx');await(await PresentationFile.exportPptx(p)).save(candidate);
 const validatedDir=path.join(build,'validated',name);await fs.mkdir(validatedDir,{recursive:true});
 const validationStamp=Date.now();const versioned=path.join(validatedDir,`validated-${validationStamp}.pptx`);
 await finalizePresentation({...requirements,workspaceDir:workspace,candidatePath:candidate,finalPath:versioned,pythonExecutable:runtimePython,integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit',...(requirements.requiredNativeTableOwnerSlides||[]).flatMap(n=>['--require-native-table-slide',String(n)])],explicitTotalSlideCount:5,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,materializeLiteralChartWorkbooks:true,receiptPath:path.join(staging,`validation-${validationStamp}.json`)});
 const target=path.join(outputDirectory,`${name}.pptx`);await fs.copyFile(versioned,target);
 for(const [index,s]of p.slides.items.entries()){const preview=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(staging,`slide-${index+1}.png`),new Uint8Array(await preview.arrayBuffer()));}
 return target;
}
const reportPath=await exportDeck(report,'ulsan-report',examples,{requiredNativeChartOwnerSlides:[2,3],requiredNativeTableOwnerSlides:[1,3,4]});
const templatePath=await exportDeck(template,'ulsan-report-template',templates,{requiredNativeChartOwnerSlides:[],requiredNativeTableOwnerSlides:[1,2,3,4,5]});
const result={createdAt:new Date().toISOString(),input:'content/public-data-course.json',fullRowsProcessed:previous.rows+current.rows,rawRowsEmbedded:0,outputs:[workbookPath,reportPath,templatePath],totals:{previous:previous.rows,current:current.rows,net:temporal.netRows},note:'Artifact-tool exports and structural validation completed; render images require human visual inspection. Native application editing is not tested here.'};
await fs.writeFile(path.join(build,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
