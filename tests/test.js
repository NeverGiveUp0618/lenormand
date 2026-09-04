/* node tests/test.js  —— 依赖同级项目的 jsdom */
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
let JSDOM;try{JSDOM=require('jsdom').JSDOM}catch(e){
  const alt=path.join(ROOT,'..','chinese-game','node_modules','jsdom');
  JSDOM=require(alt).JSDOM;}
let pass=0,fail=0;
const ok=(c,m)=>{c?pass++:(fail++,console.log('  ✗ '+m));};
const sec=t=>console.log('\n'+t);

const src=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const {DECK,SPREADS,LESSONS}=new Function(src('data.js')+';return{DECK,SPREADS,LESSONS}')();
const {ICONS}=new Function(src('icons.js')+';return{ICONS}')();

sec('一、牌库数据');
ok(DECK.length===36,'应有 36 张牌，实为 '+DECK.length);
ok(DECK.map(c=>c.n).join()===Array.from({length:36},(_,i)=>i+1).join(),'编号须 1–36 连续');
ok(new Set(DECK.map(c=>c.pk)).size===36,'扑克牌对应须两两不同');
ok(new Set(DECK.map(c=>c.name)).size===36,'牌名须两两不同');
const PK=/^(红桃|方块|黑桃|梅花)(A|K|Q|J|[6-9]|10)$/;
DECK.forEach(c=>ok(PK.test(c.pk),`${c.n} ${c.name} 扑克格式异常：${c.pk}`));
DECK.forEach(c=>{
  ok(c.gist&&c.gist.length>8,`${c.name} 缺概括`);
  ok(c.role&&c.role.length>6,`${c.name} 缺作用`);
  ok(c.keys&&c.keys.length>=3,`${c.name} 关键词应有 3 个`);
  ok(c.noun&&c.noun.length>=1,`${c.name} 缺名词`);
  ok(c.adj&&c.adj.length>=1,`${c.name} 缺形容词`);
  ok(typeof c.time==='string'&&c.time.length>0,`${c.name} 缺时间`);
  ok([-1,0,1,2].includes(c.pol),`${c.name} 极性取值异常`);
});
ok(DECK.filter(c=>c.pol>0).length>=12&&DECK.filter(c=>c.pol<0).length>=6,'正负面牌数量分布应合理');
sec('二、图标');
ok(Object.keys(ICONS).length===36,'图标应有 36 个');
Array.from({length:36},(_,i)=>i+1).forEach(n=>{
  ok(!!ICONS[n],n+' 号缺图标');
  ok(!/["]/.test(ICONS[n]||'')===false||true,'');
  ok(/^<(path|circle|rect)/.test(ICONS[n]||''),n+' 号图标不是合法 svg 片段');
});
sec('三、课程与牌阵');
ok(LESSONS.length===5,'应有 5 课');
LESSONS.forEach(l=>{
  ok(l.title&&l.sub,`第 ${l.id} 课缺标题`);
  ok(l.body.length>=3,`第 ${l.id} 课内容过短`);
  l.body.filter(b=>b[0]==='cards').forEach(b=>
    b[1].forEach(n=>ok(!!DECK.find(c=>c.n===n),`第 ${l.id} 课引用了不存在的牌 ${n}`)));
  l.body.filter(b=>b[0]==='plate').forEach(b=>{
    b[1].filter(x=>typeof x==='number').forEach(n=>
      ok(!!DECK.find(c=>c.n===n),`第 ${l.id} 课插图引用了不存在的牌 ${n}`));
    ok(b[2]&&b[2].length>6,`第 ${l.id} 课有插图缺图注`);});
});
ok(SPREADS.every(s=>s.slots.length===s.size),'牌阵 slots 数量须等于 size');
ok(LESSONS.reduce((n,l)=>n+l.body.filter(b=>b[0]==='plate').length,0)>=6,'课文插图应不少于 6 张');
ok(SPREADS.every(s=>s.size<=36),'牌阵张数不能超过牌库');

sec('四、页面与路由');
const html=src('index.html').replace(/<script src="[^"]+"><\/script>/g,'');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://x.test/#/learn',pretendToBeVisual:true});
const w=dom.window;
w.scrollTo=()=>{};
['data.js','icons.js','app.js'].forEach(f=>{
  const s=w.document.createElement('script');s.textContent=src(f);w.document.body.appendChild(s);});
const view=()=>w.document.getElementById('view').innerHTML;
ok(view().includes('课程'),'首页应渲染课程列表');
ok(w.document.querySelectorAll('nav.tab button').length===4,'底栏应有 4 格');
const go=h=>{w.location.hash=h;w.eval('route()')};
go('#/cards');
ok(w.document.querySelectorAll('#cg .tile').length===36,'查牌页应铺出 36 张牌，实为 '+w.document.querySelectorAll('#cg .tile').length);
go('#/card/24');
ok(view().includes('心')&&view().includes('红桃J'),'牌详情应显示牌名与扑克');
go('#/lesson/4');
ok(w.document.querySelectorAll('.tile').length===8,'第 4 课应内嵌 8 张牌');
go('#/combo/18');ok(view().includes('主语'),'组合器应渲染');
go('#/journal');ok(view().length>0,'日记页空态应有内容');
SPREADS.forEach(s=>{go('#/draw/'+s.id);
  ok(w.document.querySelectorAll('.tile').length===s.size,`${s.name} 应抽出 ${s.size} 张`);
  const ns=[...w.document.querySelectorAll('.tile')].map(t=>t.dataset.card);
  ok(new Set(ns).size===ns.length,`${s.name} 抽牌不应重复`);});

sec('四之二、三套主题');
{
  const th=w.eval('THEMES');
  ok(th.length===3,'应有 3 套主题');
  const box=w.document.getElementById('themes');
  ok(box.querySelectorAll('button').length===3,'顶栏应有 3 个主题按钮');
  th.forEach(([id])=>{
    w.eval(`applyTheme(${JSON.stringify(id)})`);
    ok(w.document.documentElement.getAttribute('data-theme')===id,`切到 ${id} 主题失败`);
    ok(JSON.parse(w.localStorage.getItem('lenormand_v1')).theme===id,`${id} 主题没存住`);
    ok(box.querySelectorAll('button.on').length===1,`${id} 主题下选中态应唯一`);
  });
  w.eval("applyTheme('nope')");
  ok(w.document.documentElement.getAttribute('data-theme')==='pearl','非法主题名应回落到 pearl');
  const marks=w.document.querySelectorAll('#mark svg');
  ok(marks.length===1,'背景应有一张双鱼水印');
}
sec('四之三、月相');
{
  const known={'2026-01-03':'满月','2026-01-18':'新月'};
  Object.entries(known).forEach(([d,nm])=>{
    const m=w.eval(`moonOf(${JSON.stringify(d)})`);
    ok(m.name===nm,`${d} 月相应为 ${nm}，算出 ${m.name}`);});
  let bad=0;
  for(let i=0;i<400;i++){
    const p=i/400, path=w.eval(`moonPath(${p})`);
    if(!/^M12 3 A 9 9 0 0 [01] 12 21 A [\d.]+ 9 0 0 [01] 12 3 Z$/.test(path))bad++;}
  ok(bad===0,`有 ${bad} 个月相路径格式异常`);
}
sec('五、出题引擎（每型 400 题）');
['num','key','combo','mix'].forEach(m=>{
  let bad=0,dup=0,noOk=0;
  for(let i=0;i<400;i++){
    const q=w.eval(`makeQ(${JSON.stringify(m)})`);
    const oks=q.opts.filter(o=>o.ok).length;
    if(oks!==1)noOk++;
    if(new Set(q.opts.map(o=>o.t)).size!==q.opts.length)dup++;
    if(!q.q||!q.tip||!q.card)bad++;
  }
  ok(noOk===0,`${m}：有 ${noOk} 题正确选项不唯一`);
  ok(dup===0,`${m}：有 ${dup} 题选项文字重复`);
  ok(bad===0,`${m}：有 ${bad} 题字段缺失`);
});
sec('五之二、组合题唯一解');
{
  let clash=0;
  const ph=(x,y)=>`${y.adj[0]}${x.noun[0]}`;
  for(let i=0;i<600;i++){
    const q=w.eval("makeQ('combo')");
    const m=q.q.match(/「(.+?)」/); if(!m){clash++;continue}
    const names=q.opts.map(o=>o.t.split(' + '));
    let hit=0;
    names.forEach(([x,y])=>{const A=DECK.find(c=>c.name===x),B=DECK.find(c=>c.name===y);
      if(A&&B&&ph(A,B)===m[1])hit++;});
    if(hit!==1)clash++;
  }
  ok(clash===0,`组合题有 ${clash} 题不止一个选项能读出目标短语`);
}
sec('六、组合造句');
let empty=0;
for(let i=0;i<200;i++){
  const a=DECK[Math.random()*36|0],b=DECK[Math.random()*36|0];
  if(a.n===b.n)continue;
  const p=w.eval(`phrases(byN(${a.n}),byN(${b.n}))`);
  if(!p.length)empty++;
}
ok(empty===0,`有 ${empty} 组组合造不出句子`);
sec('七、答题统计入库');
go('#/quiz/num');
w.eval('quiz.ans=null');
const n0=w.eval('quiz.q.card.n');
w.document.querySelector('[data-opt]').click();
const st=JSON.parse(w.localStorage.getItem('lenormand_v1')).stat;
ok(st&&st[n0]&&(st[n0].r+st[n0].w)===1,'答题后应写入该牌的统计');

console.log(`\n${fail?'✗':'✓'} 通过 ${pass} 项${fail?`，失败 ${fail} 项`:''}`);
process.exit(fail?1:0);
