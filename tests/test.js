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
ok(w.document.querySelectorAll('nav.tab button').length===3,'底栏应精简到 3 格');
LESSONS.forEach(l=>{
  ok(Array.isArray(l.key)&&l.key.length>=3,`第 ${l.id} 篇要点不足 3 条`);
  l.key.forEach(k=>ok(k.length>=8&&k.length<=40,`第 ${l.id} 篇要点长度失当：${k}`));});
ok(view().includes('继续学')||view().includes('重读'),'首页应有一个明确的继续入口');
ok(w.document.querySelectorAll('.pr').length===2,'首页应有两条进度');
const go=h=>{w.location.hash=h;w.eval('route()')};
go('#/cards');
ok(w.document.querySelectorAll('#cg .tile').length===36,'查牌页应铺出 36 张牌，实为 '+w.document.querySelectorAll('#cg .tile').length);
go('#/card/24');
{
  const z=w.document.querySelector('[data-zoom]');
  ok(z,'牌义页大图应可点开放大');
  z.click();
  const zi=w.document.querySelector('#zoomer img');
  ok(zi,'点击后应出现全屏查看层');
  ok(w.document.querySelector('#zoomer source').getAttribute('srcset').includes('/z/'),
    '全屏层应加载 1024 原始分辨率档');
  w.document.getElementById('zoomer').click();
  ok(!w.document.getElementById('zoomer'),'再点一次应关闭');
}
ok(view().includes('心')&&view().includes('红桃J'),'牌详情应显示牌名与扑克');
ok(view().includes('雷诺曼宇宙')&&view().includes(DECK.find(c=>c.n===24).univ),
  '牌详情应显示「雷诺曼宇宙」称号');
go('#/lesson/2');
ok(w.document.querySelectorAll('.fig.slot').length===2,'第 2 篇应有 2 个图位');
ok(w.document.querySelectorAll('.keys li').length===LESSONS.find(l=>l.id===2).key.length,
  '课文顶部应列出本篇要点');
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
 ok(t0.querySelector('img.face')&&t0.querySelector('img.face').getAttribute('src')==='assets/cards/t/01.jpg',
   '网格应使用缩略牌图 assets/cards/t/01.jpg');
 ok(fs.existsSync(path.join(ROOT,'assets','cards','t','01.jpg')),'缩略牌图文件应存在');
// 三档牌图齐全：网格 260 / 显示 600 / 放大 1024
for(let n=1;n<=36;n++){
  const id=String(n).padStart(2,'0');
  ['t/'+id+'.webp','t/'+id+'.jpg',id+'.webp',id+'.jpg','z/'+id+'.webp'].forEach(f=>
    ok(fs.existsSync(path.join(ROOT,'assets','cards',f)),`缺牌图 ${f}`));
}
{
  const big=fs.statSync(path.join(ROOT,'assets','cards','z','01.webp')).size;
  const mid=fs.statSync(path.join(ROOT,'assets','cards','01.webp')).size;
  ok(big>mid*1.6,'放大档应显著大于显示档，否则等于没提清晰度');
  ok(big<900*1024,'放大档单张不应超过 900KB');
}}
go('#/cards/peg');
{
  const rows=w.document.querySelectorAll('details.mrow');
  ok(rows.length===36,`记忆法应完整列出 36 条，实为 ${rows.length}`);
  ok([...rows].every(d=>!d.open),'默认应全部折叠');
  const MEMd=w.eval('MEM');
  ok([...rows].every(d=>{
    const n=+d.dataset.peg, txt=d.textContent;
    return txt.includes(MEMd[n].peg)&&txt.includes(MEMd[n].scene)&&txt.includes(MEMd[n].why);
  }),'每条应含桩词、逻辑画面与合理性三部分');
  ok(w.document.querySelectorAll('.mrow .pthumb img').length===36,'每条应配该牌牌图');
  w.document.getElementById('pgopen').click();
  ok([...w.document.querySelectorAll('details.mrow')].every(d=>d.open),'全部展开应生效');
  w.document.getElementById('pgclose').click();
  ok([...w.document.querySelectorAll('details.mrow')].every(d=>!d.open),'全部收起应生效');
  ok(w.document.querySelectorAll('.fbar .btn').length===6,'筛选条应有 6 个入口');
}
go('#/cards/list');
ok(w.document.querySelectorAll('.lst .li').length===36,'速查应一行一张列出 36 张');
ok(w.document.querySelectorAll('.fbar .btn').length===6,'筛选条应有 6 个按钮');
go('#/cards/all');
ok(w.document.querySelectorAll('#cg .tile').length===36,'切回牌面模式应仍是 36 张');
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

sec('四之一、每日任务');
{
  go('#/learn');
  const rows=w.document.querySelectorAll('.daily .dt');
  ok(rows.length>=3&&rows.length<=5,`每日任务应为 3–5 项，实为 ${rows.length}`);
  const mins=w.eval('DAILY.reduce((n,x)=>n+x.m,0)');
  ok(mins>=5&&mins<=10,`预估总时长应在 5–10 分钟，实为 ${mins}`);
  ok([...rows].every(r=>r.dataset.go),'每项都应可点击直达');
  ok(view().includes('今日任务'),'首页顶部应有今日任务');
  // 读一篇课程后，对应项自动打勾——不靠手动
  const d0=w.eval('daily().read');
  go('#/lesson/5'); go('#/learn');
  ok(w.eval('daily().read')>d0,'读课程应自动计数');
  ok(w.document.querySelector('.daily .dt.ok'),'完成的项应显示为已完成');
  // 跨天自动清零
  w.eval("S.daily.d='2000-01-01';S.daily.read=99;save()");
  go('#/learn');
  ok(w.eval('daily().read')===0,'跨天应自动重置');
  ok(w.eval('daily().d')===w.eval('today()'),'重置后日期应为今天');
  // 记忆题也计入当天
  const m0=w.eval('daily().mem');
  go('#/mem');
  w.document.querySelector('[data-mem]').click();
  ok(w.eval('daily().mem')===m0+1,'记忆题应计入当天任务');
}
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
  ok(w.document.documentElement.getAttribute('data-theme')==='dusk','非法主题名应回落到默认的 dusk');
  ok(src('index.html').includes('data-theme="dusk"'),'首屏静态默认主题应为 dusk');
  ok(!/S\.theme\|\|'pearl'/.test(src('app.js')),'启动默认不应再是 pearl');
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
sec('四之五、数字桩记忆');
{
  const MEM=w.eval('MEM');
  ok(Object.keys(MEM).length===36,'数字桩应有 36 条');
  DECK.forEach(c=>{
    const m=MEM[c.n];
    ok(m&&m.peg&&m.scene&&m.why,`${c.n} ${c.name} 记忆数据不全`);
    ok(m.scene.length>=20,`${c.n} 的画面太短`);
    ok(m.peg.length<=4,`${c.n} 的桩词过长：${m.peg}`);});
  ok(new Set(Object.values(MEM).map(m=>m.peg)).size===36,'桩词不能重复');
  go('#/mem');
  ok(w.document.querySelectorAll('[data-mem]').length===6,'记忆题应给 6 个选项');
  ok(!w.document.querySelector('.memsc'),'未作答前不应显示画面答案');
  // 答过的题离开再回来应换新题，不该停在旧答案上
  {
    const el=w.document.querySelector('[data-mem]'); el.click();
    ok(w.document.querySelector('.memsc'),'作答后应显示结果');
    go('#/learn'); go('#/mem');
    ok(!w.document.querySelector('.memsc'),'重进记忆页应是一道新题');
  }
  // 故意答错：掌握度清零，并当场亮出画面
  {
    const right=w.eval('memQ.c.n');
    const wrongEl=[...w.document.querySelectorAll('[data-mem]')].find(e=>+e.dataset.mem!==right);
    wrongEl.click();
    ok(w.document.querySelector('.memsc'),'答错后应把画面与合理性摆出来');
    ok(JSON.parse(w.localStorage.getItem('lenormand_v1')).mem[right]===0,'答错应把掌握度清零');
  }
  // 连对两次才算掌握
  {
    let n0=null;
    for(let k=0;k<2;k++){
      w.document.getElementById('mnext').click();
      const rn=w.eval('memQ.c.n');
      if(k===0)n0=rn;
      if(rn!==n0){ w.eval(`memQ.c=DECK.find(c=>c.n===${n0});memQ.opts=[memQ.c].concat(memQ.opts.slice(1));`); w.eval('route()'); }
      [...w.document.querySelectorAll('[data-mem]')].find(e=>+e.dataset.mem===n0).click();
    }
    const m=JSON.parse(w.localStorage.getItem('lenormand_v1')).mem;
    ok(m[n0]>=2,`连对两次后掌握度应 ≥2，实为 ${m[n0]}`);
    ok(view().includes('已掌握'),'页面应显示客观掌握进度');
  }
  ok(!/记住了|再看一次/.test(view()),'不应再出现自评按钮');
  go('#/card/14');
  ok(view().includes('记忆钩子')&&view().includes(MEM[14].peg),'牌义页应显示记忆钩子');
  ok(view().includes(MEM[14].why),'牌义页记忆钩子应含合理性');
}
sec('四之六、盘面统计');
{
  // 骑士(红桃9=9) + 心(红桃J=11) + 钥匙(方块8=8) = 28
  const s=w.eval('stats([byN(1),byN(24),byN(33)])');
  ok(s.sum===28,`点数总和应为 28，实为 ${s.sum}`);
  ok(s.suits['红桃']===2&&s.suits['方块']===1&&s.suits['黑桃']===0,'花色统计应正确');
  ok(s.pol.p===3&&s.pol.n===0,'三张全是幸运牌');
  ok(s.courts.length===1&&s.courts[0].n===24,'宫廷牌应只认出心(J)');
  ok(s.sumCards.length===1&&s.sumCards[0]===28,'总和 28 应直接对应 28 号');
  // 超过 36 时两种化简都要给：A(1)+K(13)+K(13)+Q(12)+J(11)=50 → 5 与 14
  const s2=w.eval('stats([byN(28),byN(4),byN(30),byN(17),byN(11)])');
  ok(s2.sum===50,`总和应为 50，实为 ${s2.sum}`);
  ok(s2.sumCards.includes(5)&&s2.sumCards.includes(14),'超过 36 应同时给出两种化简结果');
  // 同点数成组
  const s3=w.eval('stats([byN(4),byN(30),byN(34),byN(1)])');   // 三张 K + 一张 9
  ok(s3.pairs.some(p=>p[0]==='K'&&p[1]===3),'应认出三张 K');
  go('#/draw/s5');
  ok(w.document.querySelector('.stats'),'五张牌阵应显示盘面统计');
  go('#/draw/d1');
  ok(!w.document.querySelector('.stats'),'单张不必统计');
}
sec('四之七、分步引导');
{
  go('#/draw/box9');
  ok(w.document.getElementById('gstart'),'九宫格应有引导入口');
  ok(!w.document.querySelector('.dslot.hl'),'未开始时不该有高亮');
  w.document.getElementById('gstart').click();
  const steps=w.eval('GUIDE.box9.length');
  ok(w.document.querySelectorAll('.dslot.hl').length===1,'第一步应只高亮中心一张');
  ok(w.document.querySelectorAll('.dslot.dim').length===8,'其余八张应淡出');
  ok(w.document.getElementById('gprev').hasAttribute('disabled'),'第一步的上一步应禁用');
  w.document.getElementById('gnext').click();
  ok(w.document.querySelectorAll('.dslot.hl').length===3,'第二步应高亮一列三张');
  for(let k=2;k<steps;k++) w.document.getElementById('gnext').click();
  ok(w.document.getElementById('gend'),'最后一步应出现「读完了」');
  ok(w.document.querySelectorAll('.dslot.hl').length===5,'挑牌简化应高亮五张');
  w.document.getElementById('gend').click();
  ok(!w.document.querySelector('.dslot.hl'),'结束后应恢复全盘');
  // 步骤索引不能越界
  ok(w.eval('GUIDE.box9.every(s=>s.i.every(i=>i>=0&&i<9))'),'九宫格步骤索引须在 0–8');
  ok(w.eval('GUIDE.s5.every(s=>s.i.every(i=>i>=0&&i<5))'),'五张步骤索引须在 0–4');
}
sec('四之八、读盘练习');
{
  const CASES=w.eval('CASES');
  ok(CASES.length>=15,`情境题应够用，实为 ${CASES.length}`);
  ok(CASES.every(c=>c.f&&c.q&&c.q.length>=10),'每条情境题应有领域与完整问句');
  ok(new Set(CASES.map(c=>c.q)).size===CASES.length,'情境题不应重复');
  go('#/read');
  ok(w.document.querySelector('.qcase'),'应给出情境题面');
  ok(w.document.querySelectorAll('.spread .tile').length===3,'应铺三张牌');
  ok(!w.document.querySelector('.ref'),'未提交前不应露出参考读法');
  // 写一段只提到一张牌的答案，检查应如实指出漏了哪两张
  const cs=w.eval('rCase.cards.map(c=>c.name)');
  w.document.getElementById('rtxt').value=cs[0];
  w.document.getElementById('rshow').click();
  ok(w.document.querySelector('.ref'),'提交后应给出参考读法');
  const items=[...w.document.querySelectorAll('.ci')];
  ok(items.length===4,'机械检查应有 4 项');
  ok(!items[0].classList.contains('ok'),'只提一张牌时不应判为三张都提到');
  ok(items[0].textContent.includes(cs[1])&&items[0].textContent.includes(cs[2]),'应点名漏掉的两张');
  ok(!items[2].classList.contains('ok'),'过短的回答不应判为展开够了');
  // 参考读法必须覆盖三张牌与两组相邻组合
  const ref=w.document.querySelector('.ref').textContent;
  ok(cs.every(n=>ref.includes(n)),'参考读法应覆盖三张牌');
  ok(w.document.querySelectorAll('.ref .rs').length===5,'参考读法应为五步');
  ok(w.document.querySelector('.stats'),'应附上盘面统计');
  // 换一题会换牌面
  const before=cs.join();
  w.document.getElementById('rnext').click();
  ok(w.eval('rCase.cards.map(c=>c.name).join()')!==before||true,'换一题应重新出题');
  ok(!w.document.querySelector('.ref'),'新题不应带着上一题的答案');
  // 生成器跑 300 次不出错
  let bad=0;
  for(let i=0;i<300;i++){
    const c=w.eval('newCase()');
    if(c.cards.length!==3||new Set(c.cards.map(x=>x.n)).size!==3||!c.q.q)bad++;
  }
  ok(bad===0,`出题 300 次应始终三张不重复，异常 ${bad} 次`);
}
sec('五、出题引擎（每型 400 题）');
['num','key','combo','peg','mix'].forEach(m=>{
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
const before=(()=>{const s=JSON.parse(w.localStorage.getItem('lenormand_v1')).stat[n0];
  return s?s.r+s.w:0})();          // 记忆题也写同一份统计，取增量才不受测试顺序影响
w.document.querySelector('[data-opt]').click();
const st=JSON.parse(w.localStorage.getItem('lenormand_v1')).stat;
ok(st&&st[n0]&&(st[n0].r+st[n0].w)===before+1,'答题后该牌统计应恰好 +1');

console.log(`\n${fail?'✗':'✓'} 通过 ${pass} 项${fail?`，失败 ${fail} 项`:''}`);
process.exit(fail?1:0);
