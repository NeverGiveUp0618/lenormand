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
const {ORN}=new Function(src('icons.js')+';return{ORN}')();

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
// 课程口径：幸运 9 / 中性 18 / 挑战 9
ok(DECK.filter(c=>c.pol===1).length===9,`幸运牌应为 9 张，实为 ${DECK.filter(c=>c.pol===1).length}`);
ok(DECK.filter(c=>c.pol===-1).length===9,`挑战牌应为 9 张，实为 ${DECK.filter(c=>c.pol===-1).length}`);
ok(DECK.filter(c=>c.pol===0).length===18,`中性牌应为 18 张，实为 ${DECK.filter(c=>c.pol===0).length}`);
ok(!DECK.some(c=>c.pol===2),'课程只分三档，不应再有「强正面」');
[[1,'骑士'],[22,'十字路口'],[26,'书籍'],[27,'信件'],[36,'十字架']].forEach(([n,nm])=>
  ok(DECK.find(c=>c.n===n).name===nm,`${n} 号牌名应为 ${nm}`));
[3,4,5,13,17,20,30,32,34,35].forEach(n=>
  ok(DECK.find(c=>c.n===n).pol===0,`${n} 号按课程口径应为中性牌`));
DECK.forEach(c=>ok(c.univ&&c.univ.length>1,`${c.name} 缺「雷诺曼宇宙」称号`));
sec('二、装饰件与图位');
['pisces','constel','fishpair','wave'].forEach(k=>{
  ok(ORN[k]&&ORN[k].vb&&ORN[k].d,`装饰件 ${k} 缺失`);
  ok(/^<(g|path|circle|rect)/.test(ORN[k].d),`装饰件 ${k} 不是合法 svg 片段`);});
ok(!/ICONS/.test(src('icons.js'))&&!/ICONS/.test(src('app.js')),'手绘牌面图标应已全部移除');
ok(!fs.existsSync(path.join(ROOT,'assets','course')),'原文照片目录应已删除');
{
  const figs=LESSONS.flatMap(l=>l.body.filter(b=>b[0]==='fig').map(b=>({l:l.id,b})));
  ok(figs.length>=4,`图位太少：${figs.length}`);
  ok(new Set(figs.map(f=>f.b[1])).size===figs.length,'图位编号不能重复');
  figs.forEach(({l,b})=>{
    ok(new RegExp(`^L${l}-\\d\\d$`).test(b[1]),`图位编号应形如 L${l}-01，实为 ${b[1]}`);
    ok(b[2]&&b[2].length>3,`图位 ${b[1]} 没写该配什么`);
    ok(b[3]&&b[3].length>10,`图位 ${b[1]} 没写清元素`);});
}
sec('三、课程与牌阵');
ok(LESSONS.length===12,`应有 12 篇，实为 ${LESSONS.length}`);
LESSONS.forEach(l=>{
  ok(l.title&&l.sub,`第 ${l.id} 课缺标题`);
  ok(l.body.length>=8,`第 ${l.id} 篇内容过短：${l.body.length} 块`);
  ok(l.body.filter(b=>b[0]==='p').reduce((n,b)=>n+b[1].length,0)>=300,`第 ${l.id} 篇正文太少`);
  l.body.filter(b=>b[0]==='cards').forEach(b=>
    b[1].forEach(n=>ok(!!DECK.find(c=>c.n===n),`第 ${l.id} 课引用了不存在的牌 ${n}`)));
  l.body.filter(b=>b[0]==='img').forEach(b=>{
    const f=path.join(ROOT,b[1]);
    ok(fs.existsSync(f),`第 ${l.id} 课的图不在：${b[1]}`);
    if(fs.existsSync(f)) ok(fs.statSync(f).size<400*1024,`${b[1]} 超过 400KB，手机上会慢`);
    ok(b[2]&&b[2].length>6,`第 ${l.id} 课有照片缺图注`);});
  l.body.filter(b=>b[0]==='tableau').forEach(b=>{
    ok(b[1]*4+b[2]===36,`第 ${l.id} 课排布图格数不等于 36：${b[1]}×4+${b[2]}`);
    ok(b[3]&&b[3].length>6,`第 ${l.id} 课排布图缺图注`);});
  l.body.filter(b=>b[0]==='plate').forEach(b=>{
    b[1].filter(x=>typeof x==='number').forEach(n=>
      ok(!!DECK.find(c=>c.n===n),`第 ${l.id} 课插图引用了不存在的牌 ${n}`));
    ok(b[2]&&b[2].length>6,`第 ${l.id} 课有插图缺图注`);});
});
// 每篇挂一到多条原文链接
const ALLSRC=[];
LESSONS.forEach(l=>{
  ok(Array.isArray(l.src)&&l.src.length>=1,`第 ${l.id} 篇没挂原文链接`);
  (l.src||[]).forEach(u=>{
    ok(/^https:\/\/mp\.weixin\.qq\.com\/s\/[\w-]+$/.test(u),`第 ${l.id} 篇链接格式不对：${u}`);
    ALLSRC.push(u);});});
ok(new Set(ALLSRC).size===ALLSRC.length,'同一条原文链接不应挂在两篇上');
ok(ALLSRC.length===29,`29 课原文应全部挂上，实为 ${ALLSRC.length} 条`);
ok(SPREADS.every(s=>s.slots.length===s.size),'牌阵 slots 数量须等于 size');
ok(LESSONS.reduce((n,l)=>n+l.body.filter(b=>b[0]==='plate').length,0)===0,'手绘插图应已全部撤除');
ok(LESSONS.reduce((n,l)=>n+l.body.filter(b=>b[0]==='layout').length,0)>=10,'牌位示意图应不少于 10 张');
LESSONS.forEach(l=>l.body.filter(b=>b[0]==='layout').forEach(b=>{
  ok(Array.isArray(b[1])&&b[1].length>0,`第 ${l.id} 篇有空的牌位示意图`);
  ok(new Set(b[1].map(r=>r.length)).size>=1,`第 ${l.id} 篇牌位示意图行为空`);
  ok(b[2]&&b[2].length>4,`第 ${l.id} 篇牌位示意图缺图注`);}));
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
ok(view().includes('雷诺曼宇宙')&&view().includes(DECK.find(c=>c.n===24).univ),
  '牌详情应显示「雷诺曼宇宙」称号');
go('#/lesson/2');
ok(w.document.querySelectorAll('.fig.slot').length===2,'第 2 篇应有 2 个图位');
ok([...w.document.querySelectorAll('.fig.slot')].every(f=>f.querySelector('.ph-id')&&
   f.querySelector('.ph-t')&&f.querySelector('.ph-e')),'图位标记应含编号/该配什么/元素三行');
ok([...w.document.querySelectorAll('.fig.slot img')].every(i=>i.getAttribute('loading')==='lazy'),
  '图位的图应带 loading=lazy');
go('#/cards');
ok(w.document.querySelectorAll('#cg .tile svg').length===0,'牌面不应再有手绘图标');
{const t0=w.document.querySelector('#cg .tile');
 ok(/骑士/.test(t0.textContent)&&/♥9/.test(t0.textContent)&&/Rider/.test(t0.textContent),
   '牌面应显示牌名、花色点数、英文名');
 ok(t0.querySelector('.pk.r'),'红花色应标红');
 ok(w.document.querySelector('[data-card="3"] .pk.b'),'黑花色应标黑');
 ok(t0.getAttribute('data-no')==='1','牌面应带号码水印属性');
 ok(t0.querySelector('img.face')&&t0.querySelector('img.face').getAttribute('src')==='assets/cards/01.jpg',
   '牌面应留出牌图位 assets/cards/01.jpg');}
go('#/slots');
{const sl=w.document.querySelectorAll('.sl');
 ok(sl.length===5+36,`图位清单应列 41 条（5 插图 + 36 牌面），实为 ${sl.length}`);
 ok([...sl].every(s=>s.querySelector('.sl-f').textContent.trim()),'每条都应写明文件名');
 ok([...sl].every(s=>s.querySelector('.st-wait')),'每条都应有待补/已补状态');}
go('#/lesson/9');
{const tabs=w.document.querySelectorAll('.tableau');
 ok(tabs.length===2,'第 9 篇应有 2 张大牌阵排布图');
 tabs.forEach((t,i)=>{const cells=t.querySelectorAll('.tc');
   ok(cells.length===36,`第 ${i+1} 张排布图应有 36 格，实为 ${cells.length}`);
   ok([...cells].map(c=>+c.textContent).join()===Array.from({length:36},(_,k)=>k+1).join(),
     `第 ${i+1} 张排布图编号应为 1–36 顺序`);});}
go('#/lesson/4');
{const a=w.document.querySelector('a.btn.src');
 ok(!!a,'课程页应有原文链接按钮');
 ok(a&&a.getAttribute('target')==='_blank'&&/noopener/.test(a.getAttribute('rel')||''),
   '原文链接须新开窗口且带 rel=noopener');
 ok(a&&a.getAttribute('href')===LESSONS.find(l=>l.id===4).src[0],'第 4 篇链接指向应与数据一致');}
go('#/lesson/3');
ok(w.document.querySelectorAll('.tile').length===36,'第 3 篇应内嵌全部 36 张牌');
{const links=w.document.querySelectorAll('a.btn.src');
 ok(links.length===4,`第 3 篇应挂 4 条原文链接，实为 ${links.length}`);}
go('#/lesson/8');
ok(w.document.querySelectorAll('.lay').length>=3,'第 8 篇应有多张牌位示意图');
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
sec('四之四、原文入口只在本地版出现');
{
  go('#/lesson/1');
  ok(!view().includes('读这一篇的原文'),'公开版不该出现原文入口');
  w.location.hash='#/orig/1'; w.eval('route()');
  ok(view().includes('课程'),'公开版访问 #/orig 应回落到课程页');
  // 注入一份假的本地原文，模拟本地版
  w.eval(`window.ORIGINALS={1:{title:'测试标题',src:'https://example.test/x',
    blocks:[['p','第一段'],['img','content/01/img/01.png'],['p','第二段 <b>不该当成标签</b>']]}}`);
  go('#/lesson/1');
  ok(view().includes('读这一篇的原文'),'本地版应出现原文入口');
  go('#/orig/1');
  ok(w.document.querySelectorAll('.body p').length===2,'原文视图应渲染 2 段');
  ok(w.document.querySelectorAll('.fig img').length===1,'原文视图应渲染 1 张图');
  ok(!view().includes('<b>不该当成标签</b>'),'原文正文须转义，不能当 HTML 执行');
  ok(w.document.getElementById('stl').textContent==='测试标题','原文视图应把原标题放进副标题');
  w.eval('delete window.ORIGINALS');
  go('#/lesson/1');
  ok(!view().includes('读这一篇的原文'),'撤掉本地原文后入口应消失');
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
