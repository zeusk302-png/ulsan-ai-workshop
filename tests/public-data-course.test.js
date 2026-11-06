import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url));
const course=JSON.parse(read('content/public-data-course.json'));
const base='public/automation/public-data/';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function zipEntries(bytes){
 const end=bytes.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));assert.ok(end>=0,'ZIP end record');
 let offset=bytes.readUInt32LE(end+16);const entries=new Map();
 for(let i=0;i<bytes.readUInt16LE(end+10);i++){
  assert.equal(bytes.readUInt32LE(offset),0x02014b50);
  const nl=bytes.readUInt16LE(offset+28),el=bytes.readUInt16LE(offset+30),cl=bytes.readUInt16LE(offset+32),local=bytes.readUInt32LE(offset+42),size=bytes.readUInt32LE(offset+20),method=bytes.readUInt16LE(offset+10);
  const name=bytes.subarray(offset+46,offset+46+nl).toString('utf8');
  entries.set(name,()=>{const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28),data=bytes.subarray(start,start+size);assert.ok(method===0||method===8);return method===8?inflateRawSync(data):data;});
  offset+=46+nl+el+cl;
 }
 return entries;
}
function* csv(text){
 let row=[],value='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(value);value='';}
  else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);yield row;row=[];value='';}
  else value+=c;
 }
 assert.equal(quoted,false,'closed CSV quote');
 if(value||row.length){row.push(value);yield row;}
}
const codeRows=[...csv(new TextDecoder('euc-kr').decode(read(base+'data/industry-codes-2023.csv')))];
const codeHeader=codeRows.shift();
const codes=new Map(codeRows.map(r=>[r[4],r]));
let computed;
function actual(){
 if(computed)return computed;
 computed={};
 for(const provenance of course.provenance){
  const bytes=read('public/'+provenance.localPath);assert.equal(sha(bytes),provenance.sha256,'official CSV byte hash');
  const iter=csv(bytes.toString('utf8').replace(/^\uFEFF/,''));const header=iter.next().value;assert.deepEqual(header,course.fields);
  const ix=Object.fromEntries(header.map((x,i)=>[x,i])),ids=new Map(),districts={},labels={상권업종대분류명:0,상권업종중분류명:0,상권업종소분류명:0};let rows=0,missing=0,duplicates=0,unknown=0,invalidCoordinates=0;
  for(const row of iter){
   assert.equal(row.length,39,'every raw record has all39 fields');rows++;
   const id=row[ix.상가업소번호];if(!id)missing++;if(ids.has(id))duplicates++;
   ids.set(id,['상호명','상권업종소분류코드','시군구코드','행정동코드','도로명주소','경도','위도'].map(k=>row[ix[k]]));
   const district=row[ix.시군구명];districts[district]=(districts[district]||0)+1;
   const mapped=codes.get(row[ix.상권업종소분류코드]);
   if(!mapped)unknown++;else for(const [field,column]of [['상권업종대분류명',1],['상권업종중분류명',3],['상권업종소분류명',5]])if(row[ix[field]]!==mapped[column])labels[field]++;
   const lon=Number(row[ix.경도]),lat=Number(row[ix.위도]);if(!row[ix.경도]||!row[ix.위도]||!Number.isFinite(lon)||!Number.isFinite(lat)||lon<-180||lon>180||lat<-90||lat>90)invalidCoordinates++;
  }
  computed[provenance.period]={rows,header,ids,missing,duplicates,districts,unknown,labels,invalidCoordinates};
 }
 return computed;
}

test('official full snapshots preserve provenance bytes and all39 fields without sampling',()=>{
 assert.equal(course.fields.length,39);
 for(const [period,m]of Object.entries(actual())){
  const expected=course.snapshots[period];assert.equal(m.rows,expected.rows);assert.equal(m.ids.size,expected.uniqueIds);assert.equal(m.missing,expected.missingIdRows);assert.equal(m.duplicates,expected.duplicateIdRows);assert.deepEqual(m.districts,expected.districts);assert.equal(m.invalidCoordinates,expected.invalidCoordinates);
 }
 assert.equal(Object.values(actual()).reduce((sum,m)=>sum+m.rows,0),course.provenance.reduce((sum,p)=>sum+p.rows,0));
});

test('official classification joins by code while original and codebook labels remain distinct',()=>{
 assert.equal(sha(read(base+'data/industry-codes-2023.csv')),course.codebook.sha256);
 assert.deepEqual(codeHeader,course.codebook.columns);assert.equal(codeRows.length,247);assert.equal(codes.size,247);
 assert.equal(new Set(codeRows.map(r=>r[0])).size,10);assert.equal(new Set(codeRows.map(r=>r[2])).size,75);
 for(const row of codeRows){assert.ok(row[2].startsWith(row[0]));assert.ok(row[4].startsWith(row[2]));}
 for(const [period,m]of Object.entries(actual())){assert.equal(m.unknown,course.snapshots[period].classificationUnknownRows);assert.deepEqual(m.labels,course.snapshots[period].classificationLabelDifferenceByField);assert.ok(m.labels.상권업종대분류명>0,'a valid code join does not imply identical labels');}
});

test('two-quarter ID sets conserve each snapshot and coordinate differences do not establish relocation',()=>{
 const periods=Object.keys(actual()).sort(),previous=actual()[periods[0]],current=actual()[periods[1]];let matched=0,newIds=0,absent=0;const fields=['상호명','상권업종소분류코드','시군구코드','행정동코드','도로명주소','경도','위도'],diffs=Object.fromEntries(fields.map(k=>[k,0]));
 for(const [id,row]of current.ids){const old=previous.ids.get(id);if(!old){newIds++;continue;}matched++;fields.forEach((k,i)=>{if(old[i]!==row[i])diffs[k]++;});}
 for(const id of previous.ids.keys())if(!current.ids.has(id))absent++;
 assert.equal(matched+newIds,current.rows);assert.equal(matched+absent,previous.rows);
 assert.equal(matched,course.temporal.matchedIds);assert.equal(newIds,course.temporal.newlyObservedIds);assert.equal(absent,course.temporal.noLongerObservedIds);assert.equal(newIds-absent,course.temporal.netRows);assert.deepEqual(diffs,course.temporal.matchedFieldDifferences);
 assert.ok(diffs.경도>0&&diffs.도로명주소===0,'changed coordinates coexist with unchanged addresses');
});

test('student data ZIP contains byte-identical complete raw CSV members',()=>{
 const entries=zipEntries(read(base+'data/ulsan-two-quarters.zip'));
 for(const p of course.provenance){const name=p.localPath.split('/').at(-1),entry=[...entries].find(([key])=>key.split('/').at(-1)===name);assert.ok(entry,name);assert.equal(sha(entry[1]()),p.sha256,name);}
});

test('RAG references retain substantial actual official guide text with a separate instructor brief',t=>{
 const official=read(base+'references/sbiz-openapi-guide-260805-original.zip');assert.equal(sha(official),'4ed2112e2a90e49e88243fa7963ae7d19628aed247b6492bcbae6a947534970e');
 const guide=read(base+'references/sbiz-openapi-guide-260805-extracted.txt').toString('utf8').replace(/\r\n/g,'\n');const body=guide.split('\n\n').slice(1).join('\n\n');assert.ok(body.length>95000,'actual HWP text, not a short fabricated manual');
 const path=base+'references/all-references.txt';if(!fs.existsSync(new URL('../'+path,import.meta.url))){t.skip('Combined reference build is still pending.');return;}
 const combined=read(path).toString('utf8').replace(/\r\n/g,'\n');assert.ok(combined.length>body.length);assert.ok(combined.includes('강사'));assert.ok(combined.includes('39')&&combined.includes('247'));
 for(const fragment of [body.slice(0,140),body.slice(Math.floor(body.length/2),Math.floor(body.length/2)+140),body.slice(-140)])assert.ok(combined.includes(fragment),'official guide beginning/middle/end retained without synthetic inflation');
});

test('teacher result artifacts contain3 worksheets and5 editable presentation slides when supplied',t=>{
 const xlsx=base+'examples/ulsan-summary.xlsx',pptx=base+'examples/ulsan-report.pptx';if(!fs.existsSync(new URL('../'+xlsx,import.meta.url))||!fs.existsSync(new URL('../'+pptx,import.meta.url))){t.skip('Official-data teacher outputs are still being built.');return;}
 const book=zipEntries(read(xlsx)),presentation=zipEntries(read(pptx));const workbook=book.get('xl/workbook.xml')().toString('utf8');assert.equal((workbook.match(/<(?:\w+:)?sheet\b/g)||[]).length,3);
 const slides=[...presentation.keys()].filter(k=>/^ppt\/slides\/slide\d+\.xml$/.test(k));assert.equal(slides.length,5);
 for(const slide of slides)assert.match(presentation.get(slide)().toString('utf8'),/<a:t>/,'actual text objects rather than only a full-slide picture');
});
