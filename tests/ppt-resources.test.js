import test from 'node:test';
import assert from 'node:assert/strict';
import {resourceCategories,pptResources,designPrinciples,resourceWorkflow,referenceBrief} from '../src/ppt-resources-data.js';

test('PPT references identify their purpose, outputs, owner, license and actionable reading steps',()=>{
  assert.ok(pptResources.length>=10&&pptResources.length<=12);
  assert.equal(new Set(pptResources.map(item=>item.id)).size,pptResources.length);
  for(const item of pptResources){
    assert.ok(resourceCategories.some(category=>category.id===item.category),item.id);
    for(const key of ['name','owner','description','when','aiPrompt','output','limit'])assert.ok(item[key]?.length>2,item.id+': '+key);
    for(const url of [item.url,item.docsUrl,item.license.url])assert.equal(new URL(url).protocol,'https:');
    assert.ok(item.license.label&&item.license.note);
    assert.ok(item.how.length>=3);
    assert.equal(item.verifiedOn,'2026-11-06');
    assert.ok(['core','optional'].includes(item.level));
  }
});

test('reference catalog preserves restricted-skill and editable-export distinctions',()=>{
  const anthropic=pptResources.find(item=>/anthropic/i.test(item.name+' '+item.owner));
  assert.ok(/proprietary|제한|독점/i.test(anthropic.license.label));
  const marp=pptResources.find(item=>/marp/i.test(item.name));
  assert.ok(/이미지/.test(marp.output+' '+marp.limit));
  assert.ok(/실험/.test(marp.output+' '+marp.limit));
  const reveal=pptResources.find(item=>/reveal/i.test(item.name));
  assert.ok(/HTML/.test(reveal.output));
  assert.ok(pptResources.some(item=>item.url.includes('github.com/openai/plugins')));
  assert.ok(!pptResources.some(item=>item.url.replace(/\/$/,'')==='https://github.com/openai/skills'));
});

test('reference application teaches a complete workflow and preserves verified report data',()=>{
  assert.ok(resourceWorkflow.length>=5);
  for(const step of resourceWorkflow)for(const key of ['title','action','expect','fix'])assert.ok(step[key]?.length>5,key);
  const brief=referenceBrief.replace(/[ ,]/g,'');
  for(const value of ['7509','9824','27379','7181'])assert.ok(brief.includes(value),value);
  assert.ok(/출처/.test(referenceBrief));
  assert.ok(/pptx/i.test(referenceBrief));
  assert.ok(designPrinciples.length>=6&&designPrinciples.length<=8);
  for(const principle of designPrinciples)for(const key of ['title','why','bad','good','check'])assert.ok(principle[key]?.length>5,principle.id+': '+key);
});
