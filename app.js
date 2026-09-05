/* 雷诺曼学习站 · 逻辑层 */
const LS='lenormand_v1';
const S=(()=>{try{return JSON.parse(localStorage.getItem(LS))||{}}catch(e){return{}}})();
S.stat=S.stat||{}; S.journal=S.journal||[]; S.read=S.read||{};
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
const byN=n=>DECK.find(c=>c.n===+n);
const hasOrig=id=>typeof ORIGINALS!=='undefined'&&ORIGINALS&&ORIGINALS[id];
/* 牌图位：用户把自己设计的牌存成 assets/cards/01.jpg…36.jpg，放进去就自动显示；
   没有该文件时图元素自行移除，牌面退回纯文字排版 */
const CARD_DIR='assets/cards/';
const face=n=>`<img class="face" src="${CARD_DIR}${String(n).padStart(2,'0')}.jpg"
  alt="" loading="lazy" onerror="this.remove()">`;
const orn=(k,cls)=>`<svg class="${cls||''}" viewBox="${ORN[k].vb}" fill="none" stroke="currentColor"
  stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ORN[k].d}</svg>`;
const SEC=t=>`<h2 class="sec">${orn('pisces','gl')}${t}</h2>`;
const moonSvg=p=>`<svg class="moon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
  stroke-width="1"><circle cx="12" cy="12" r="9" fill="none" opacity=".3"/><path d="${moonPath(p)}"/></svg>`;
const polCls=p=>p>0?'pos':(p<0?'neg':'');
const polTag=p=>p>=2?'<span class="pol p">强正面</span>':p===1?'<span class="pol p">正面</span>'
  :p===-1?'<span class="pol n">负面</span>':'<span class="pol z">中性</span>';
const esc=s=>String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.random()*a.length|0];
const today=()=>new Date().toLocaleDateString('sv');

function tile(c,extra){
  return `<div class="tile ${polCls(c.pol)} ${extra||''}" data-card="${c.n}">
    <span class="no">${String(c.n).padStart(2,'0')}</span><span class="pk">${c.pk}</span>
    ${face(c.n)}<div class="nm">${c.name}</div><div class="en">${c.en}</div></div>`;
}

/* ---------- 主题 ---------- */
const THEMES=[['pearl','珠贝','奶白贝壳，海沫青与藕荷紫'],
              ['dusk','暮汐','黄昏的海面，藕紫蜜桃'],
              ['sea','深海','午夜潮汐，星与水'] ];
function applyTheme(t){
  if(!THEMES.some(x=>x[0]===t)) t='pearl';
  S.theme=t; save();
  document.documentElement.setAttribute('data-theme',t);
  const tc=getComputedStyle(document.documentElement).getPropertyValue('--tc').trim();
  const m=document.getElementById('tc'); if(m&&tc) m.setAttribute('content',tc);
  const box=document.getElementById('themes');
  if(box) box.innerHTML=THEMES.map(([id,nm,d])=>
    `<button data-theme-set="${id}" class="${t===id?'on':''}" title="${nm} · ${d}" aria-label="${nm}"></button>`).join('');
}

/* ---------- 路由 ---------- */
const TABS=[['learn','学','学'],['cards','查','查'],['train','练','练'],['journal','记','记']];
function nav(){
  const o=document.getElementById('orn'); if(o&&!o.innerHTML) o.innerHTML=orn('constel');
  const cur=(location.hash.split('/')[1]||'learn');
  document.getElementById('nav').innerHTML=TABS.map(([id,blk,txt])=>
    `<button data-go="#/${id}" class="${cur===id?'on':''}"><span class="blk">${blk}</span>${txt}</button>`).join('');
}
function head(t,s,back){
  document.getElementById('ttl').textContent=t;
  document.getElementById('stl').textContent=s||'';
  const b=document.getElementById('back'); b.hidden=!back; b.dataset.go=back||'';
}
function route(){
  const p=location.hash.replace(/^#\/?/,'').split('/');
  const v=document.getElementById('view');
  const r={learn:vLearn,lesson:vLesson,cards:vCards,card:vCard,combo:vCombo,
           train:vTrain,quiz:vQuiz,draw:vDraw,journal:vJournal,orig:vOrig,slots:vSlots}[p[0]]||vLearn;
  v.innerHTML=r(p[1],p[2])||''; v.scrollTop=0; window.scrollTo(0,0); nav();
}

/* ---------- 学 ---------- */
function vLearn(){
  head('雷诺曼 · 三十六牌','从零到能读盘，十二篇');
  return orn('constel','constel')+`${SEC(`课程`)}<div class="card">`+
   LESSONS.map(l=>`<div class="lesson-li" data-go="#/lesson/${l.id}">
     <span class="idx">${l.id}</span><div><div class="t">${l.title}</div><div class="s">${l.sub}</div></div>
     </div>`).join('')+
   `</div>
   ${SEC(`快速入口`)}<div class="row">
     <button class="btn" data-go="#/cards">36 张牌义</button>
     <button class="btn" data-go="#/combo">两张牌组合器</button></div>
   <div class="row" style="margin-top:8px">
     <button class="btn" data-go="#/train">开始练习</button>
     <button class="btn" data-go="#/draw/d1">今日一张</button></div>
   <div class="row" style="margin-top:8px">
     <button class="btn" data-go="#/slots">图位清单 · 等补图</button></div>`;
}
function vLesson(id){
  const l=LESSONS.find(x=>x.id===+id)||LESSONS[0];
  S.read[l.id]=1; save();
  head(`第 ${l.id} 篇 · ${l.title}`,l.sub,'#/learn');
  const html=l.body.map(b=>{
    if(b[0]==='p') return `<p>${b[1]}</p>`;
    if(b[0]==='h') return `<h3>${b[1]}</h3>`;
    if(b[0]==='ex') return `<div class="ex"><b>${b[1]}</b><span>${b[2]}</span></div>`;
    if(b[0]==='cards') return `<div class="grid">${b[1].map(n=>tile(byN(n))).join('')}</div>`;
    if(b[0]==='fig'){ // 图位：图做好了就显示，没做就显示标记框
      return `<figure class="fig slot" data-slot="${b[1]}">
        <img src="${CARD_DIR}../figs/${b[1]}.jpg" alt="${b[2]}" loading="lazy"
          onload="this.closest('.slot').classList.add('done')" onerror="this.remove()">
        <div class="ph">
          <div class="ph-id">图位 ${b[1]}</div>
          <div class="ph-t">${b[2]}</div>
          <div class="ph-e">${b[3]}</div>
        </div></figure>`;
    }
    if(b[0]==='img') return `<figure class="fig"><img src="${b[1]}" alt="${b[2]}" loading="lazy">
      <figcaption class="cap">${b[2]}</figcaption></figure>`;
    if(b[0]==='layout'){ // 牌位示意图：一格一个标签，空串留白
      const rows=b[1].map(r=>`<div class="lrow" style="grid-template-columns:repeat(${r.length},1fr)">`+
        r.map(x=>x?`<span class="lc">${x}</span>`:'<span class="lc none"></span>').join('')+'</div>').join('');
      return `<figure class="plate"><div class="lay">${rows}</div>
        <figcaption class="cap">${b[2]}</figcaption></figure>`;
    }
    if(b[0]==='tableau'){ // 大牌阵排布图，用格子画
      const cols=b[1],extra=b[2],main=36-extra;
      const cell=n=>`<span class="tc${n>main?' ex':''}">${n}</span>`;
      const rows=[];
      for(let r=0;r<main/cols;r++)
        rows.push(`<div class="trow" style="grid-template-columns:repeat(${cols},1fr)">`+
          Array.from({length:cols},(_,i)=>cell(r*cols+i+1)).join('')+`</div>`);
      if(extra) rows.push(`<div class="trow ex-row" style="grid-template-columns:repeat(${extra},1fr)">`+
        Array.from({length:extra},(_,i)=>cell(main+i+1)).join('')+`</div>`);
      return `<figure class="plate"><div class="tableau">${rows.join('')}</div>
        <figcaption class="cap">${b[3]}</figcaption></figure>`;
    }
    if(b[0]==='plate'){ // 牌面插图：几张牌 + 运算符 + 图注
      const parts=b[1].map(x=>typeof x==='number'?tile(byN(x)):`<span class="op">${x}</span>`).join('');
      return `<figure class="plate"><div class="cards">${parts}</div>
        <figcaption class="cap">${b[2]}</figcaption>${orn('wave','wv')}</figure>`;
    }
    return '';
  }).join('');
  const nx=LESSONS.find(x=>x.id===l.id+1);
  const srcs=[].concat(l.src||[]);
  const link=srcs.length?`${SEC(`这一篇的原文`)}
    <div class="mut" style="margin:-4px 0 10px">本篇由我通读全部课程后重写。对应的作者原稿共 ${srcs.length} 篇，在微信里打开：</div>
    <div class="opts">`+srcs.map((u,i)=>`<a class="btn src" href="${u}" target="_blank" rel="noopener">
      <b>原文 ${i+1} ›</b></a>`).join('')+`</div>`:'';
  const og=hasOrig(l.id)?`<button class="btn" data-go="#/orig/${l.id}" style="margin-bottom:9px">
    <b>读这一篇的原文</b><br><span class="mut">公众号原稿，图文按原序（本地版才有）</span></button>`:'';
  return `<div class="body rd">${html}</div>`+link+og+
    (nx?`<button class="btn pri" data-go="#/lesson/${nx.id}">下一篇 · ${nx.title}</button>`
       :`<button class="btn pri" data-go="#/train">十二篇读完了，去练一练</button>`);
}

/* ---------- 图位清单 ---------- */
const FIGS=()=>LESSONS.flatMap(l=>l.body.filter(b=>b[0]==='fig')
  .map(b=>({id:b[1],what:b[2],el:b[3],where:`第 ${l.id} 篇 · ${l.title}`,
            file:`assets/figs/${b[1]}.jpg`})));
function vSlots(){
  head('图位清单','等你的牌图和插图','#/learn');
  const rows=(arr)=>arr.map(s=>`<div class="sl" data-slot="${s.id}">
      <img src="${s.file}" alt="" loading="lazy"
        onload="this.closest('.sl').classList.add('done')" onerror="this.remove()">
      <div class="sl-b"><div class="sl-h"><b>${s.id}</b>
        <span class="st st-wait">待补</span><span class="st st-done">已补</span></div>
        <div class="sl-t">${s.what}</div>
        <div class="sl-e">${s.el}</div>
        <div class="sl-f">${s.file}</div></div></div>`).join('');
  const cards=DECK.map(c=>({id:String(c.n).padStart(2,'0'),what:`${c.name} ${c.en}`,
    el:`${c.pk} · ${c.keys.join(' / ')}`,where:'牌面',
    file:`${CARD_DIR}${String(c.n).padStart(2,'0')}.jpg`}));
  return `<div class="card pad mut">图做好了按下面的文件名存进去，页面会自动换上，不用改代码。
      牌面统一竖版，长宽比 2:3；课程插图宽度按 900px 出图即可。</div>
    ${SEC(`课程插图 · ${FIGS().length} 个`)}<div class="slots">${rows(FIGS())}</div>
    ${SEC(`牌面 · 36 张`)}<div class="slots">${rows(cards)}</div>`;
}

/* ---------- 原文（仅本地版） ---------- */
function vOrig(id){
  const o=hasOrig(id); if(!o) return vLearn();
  head('原文 · 第 '+id+' 篇',o.title,'#/lesson/'+id);
  const body=o.blocks.map(b=>b[0]==='img'
    ? `<figure class="fig"><img src="${b[1]}" alt="课程原图" loading="lazy"></figure>`
    : `<p>${esc(b[1])}</p>`).join('');
  return `<div class="card pad mut" style="margin-bottom:14px">
      公众号原稿，图文按原序。${o.src?`<br><span style="word-break:break-all">${esc(o.src)}</span>`:''}
    </div><div class="body rd">${body}</div>
    <button class="btn pri" data-go="#/lesson/${id}">回到第 ${id} 课讲解</button>`;
}

/* ---------- 查 ---------- */
let filter='all';
function vCards(){
  head('36 张牌','点开看牌义');
  const f={all:()=>1,pos:c=>c.pol>0,neg:c=>c.pol<0,mid:c=>c.pol===0};
  const list=DECK.filter(f[filter]);
  return `<div class="row" style="margin-bottom:12px">`+
    [['all','全部'],['pos','正面'],['neg','负面'],['mid','中性']].map(([k,t])=>
      `<button class="btn ${filter===k?'on':''}" data-filter="${k}" style="text-align:center">${t}</button>`).join('')+
    `</div><input type="text" id="q" placeholder="搜牌名 / 英文 / 扑克 / 关键词" style="margin-bottom:12px">
    <div class="grid" id="cg">${list.map(c=>tile(c)).join('')}</div>`;
}
function vCard(n){
  const c=byN(n); if(!c) return vCards();
  head(`${String(c.n).padStart(2,'0')} ${c.name}`,c.en+' · '+c.pk,'#/cards');
  const F=(t,v)=>v&&v.length?`<dt>${t}</dt><dd>${Array.isArray(v)
    ?`<div class="chips">${v.map(x=>`<span class="chip">${x}</span>`).join('')}</div>`:v}</dd>`:'';
  return `<div class="card pad rd">
    <div class="hero"><div class="facebox">${face(c.n)}<span>${String(c.n).padStart(2,'0')}</span></div><div>
      <div class="nm">${c.name}</div>
      <div class="meta">${c.en} · ${c.pk} · ${String(c.n).padStart(2,'0')} 号</div>
      <div style="margin-top:6px">${polTag(c.pol)}</div></div></div>
    <dl class="f">
      ${F('概括',c.gist)}${F('作用',c.role)}
      <dt>关键词</dt><dd><div class="chips">${c.keys.map(k=>`<span class="chip k">${k}</span>`).join('')}</div></dd>
      ${F('名词',c.noun)}${F('形容词',c.adj)}${F('动词',c.verb)}${F('副词',c.adv)}
      ${F('人物',c.people)}${F('时间',c.time)}
    </dl></div>
    <div class="row" style="margin-top:12px">
      <button class="btn" data-go="#/combo/${c.n}">用它做组合</button>
      <button class="btn" data-go="#/card/${c.n%36+1}">下一张 ›</button></div>`;
}

/* ---------- 组合器 ---------- */
let comboA=null,comboB=null;
function phrases(a,b){
  const out=[];
  b.adj.forEach(x=>a.noun.slice(0,2).forEach(y=>out.push(`${x}${y}`)));
  a.noun.slice(0,1).forEach(y=>b.verb.slice(0,2).forEach(v=>out.push(`${y}${v}`)));
  return [...new Set(out)].slice(0,6);
}
function vCombo(pre){
  if(pre){comboA=+pre;comboB=null}
  head('组合器','第一张是主语，第二张修饰它','#/cards');
  const a=comboA&&byN(comboA), b=comboB&&byN(comboB);
  let res='';
  if(a&&b){
    res=`<div class="card pad" style="margin:12px 0">
      <div class="mut">${a.name} + ${b.name}</div>
      <div class="chips" style="margin-top:8px">${phrases(a,b).map(p=>`<span class="chip k">${p}</span>`).join('')}</div>
      <div class="mut" style="margin-top:10px">反过来读（${b.name} + ${a.name}）：</div>
      <div class="chips" style="margin-top:6px">${phrases(b,a).map(p=>`<span class="chip">${p}</span>`).join('')}</div>
      </div>`;
  }
  return `${orn('fishpair','fishpair')}
    <div class="mut" style="text-align:center;margin:-2px 0 4px">两条鱼朝相反方向游，绳子却系在一起——换个顺序，就是另一句话。</div>
    <div class="spread">
      <div>${a?tile(a,'sel'):'<div class="tile" style="opacity:.4">?</div>'}<span class="slot">主语</span></div>
      <div>${b?tile(b,'sel'):'<div class="tile" style="opacity:.4">?</div>'}<span class="slot">修饰</span></div>
    </div>${res}
    <button class="btn" id="creset" style="text-align:center">清空重选</button>
    ${SEC(`选牌`)}
    <div class="grid" id="cg">${DECK.map(c=>tile(c,(c.n===comboA||c.n===comboB)?'sel':'')).join('')}</div>`;
}

/* ---------- 练 ---------- */
const MODES=[
 {id:'num',t:'牌号与扑克',d:'号 ↔ 牌名 ↔ 扑克牌，铺大牌阵的基本功'},
 {id:'key',t:'关键词认牌',d:'看关键词想是哪张牌'},
 {id:'combo',t:'组合造句',d:'把两张牌读成一句话'},
 {id:'mix',t:'混合练习',d:'三种题型打散来一轮'}
];
function weak(){
  return DECK.map(c=>{const s=S.stat[c.n]||{r:0,w:0};return{c,score:s.w*2-s.r}})
    .sort((a,b)=>b.score-a.score).map(x=>x.c);
}
function vTrain(){
  head('练习','答错的牌会被多抽到');
  const done=Object.values(S.stat).reduce((n,s)=>n+s.r+s.w,0);
  const rate=(()=>{let r=0,w=0;Object.values(S.stat).forEach(s=>{r+=s.r;w+=s.w});
    return r+w?Math.round(r*100/(r+w)):0})();
  const wk=weak().filter(c=>{const s=S.stat[c.n];return s&&s.w>s.r}).slice(0,8);
  return `<div class="card pad">
      <div class="mut">累计答题 ${done} 题 · 正确率 ${rate}%</div>
      <div class="bar"><i style="width:${rate}%"></i></div>
    </div>
    ${SEC(`题型`)}<div class="opts">`+
    MODES.map(m=>`<button class="btn" data-go="#/quiz/${m.id}"><b>${m.t}</b><br>
      <span class="mut">${m.d}</span></button>`).join('')+`</div>`+
    (wk.length?`${SEC(`薄弱的牌`)}<div class="grid">${wk.map(c=>tile(c)).join('')}</div>`:'')+
    `${SEC(`抽牌`)}<div class="opts">`+
    SPREADS.map(s=>`<button class="btn" data-go="#/draw/${s.id}"><b>${s.name}</b><br>
      <span class="mut">${s.tip}</span></button>`).join('')+`</div>`;
}
let quiz=null;
function makeQ(mode){
  const pool=weak(), c=pick(pool.slice(0,12).concat(shuffle(DECK).slice(0,12)));
  const m=mode==='mix'?pick(['num','key','combo']):mode;
  if(m==='num'){
    const ask=pick(['n2name','pk2name','name2n']);
    if(ask==='n2name'){
      const o=shuffle([c,...shuffle(DECK.filter(x=>x.n!==c.n)).slice(0,3)]);
      return{q:`${c.n} 号是哪张牌？`,opts:o.map(x=>({t:x.name,ok:x.n===c.n})),card:c,
        tip:`${c.n} ${c.name} ${c.en}（${c.pk}）`};
    }
    if(ask==='pk2name'){
      const o=shuffle([c,...shuffle(DECK.filter(x=>x.n!==c.n)).slice(0,3)]);
      return{q:`${c.pk} 对应哪张牌？`,opts:o.map(x=>({t:`${x.n} ${x.name}`,ok:x.n===c.n})),card:c,
        tip:`${c.pk} → ${c.n} ${c.name}`};
    }
    const o=shuffle([c.n,...shuffle(DECK.filter(x=>x.n!==c.n)).slice(0,3).map(x=>x.n)]);
    return{q:`${c.name}是几号牌？`,opts:o.map(n=>({t:`${n} 号`,ok:n===c.n})),card:c,
      tip:`${c.name} = ${c.n} 号（${c.pk}）`};
  }
  if(m==='key'){
    const o=shuffle([c,...shuffle(DECK.filter(x=>x.n!==c.n&&x.pol!==c.pol)).slice(0,3)]);
    return{q:`「${c.keys.join(' · ')}」说的是哪张牌？`,opts:o.map(x=>({t:`${x.n} ${x.name}`,ok:x.n===c.n})),
      card:c,tip:c.gist};
  }
  const ph=(x,y)=>`${y.adj[0]}${x.noun[0]}`;
  const a=c;
  // 干扰项不能凑出和正确答案一样的短语，否则一题两解
  const bs=shuffle(DECK.filter(x=>x.n!==a.n&&x.adj.length&&ph(x,a)!==ph(a,x)));
  const b=bs[0];
  const target=ph(a,b);
  const c3=pick(DECK.filter(x=>x.n!==a.n&&x.n!==b.n
    &&ph(a,x)!==target&&ph(x,b)!==target&&ph(x,a)!==target&&ph(b,x)!==target))
    ||DECK.find(x=>x.n!==a.n&&x.n!==b.n);
  const opts=shuffle([
    {t:`${a.name} + ${b.name}`,ok:true},
    {t:`${b.name} + ${a.name}`,ok:false},
    {t:`${a.name} + ${c3.name}`,ok:false},
    {t:`${c3.name} + ${b.name}`,ok:false}]);
  return{q:`要读出「${target}」，该是哪个组合？`,opts,card:a,
    tip:`第一张给名词（${a.name}→${a.noun[0]}），第二张给修饰（${b.name}→${b.adj[0]}）。顺序反过来意思就变了。`};
}
function vQuiz(mode){
  const m=MODES.find(x=>x.id===mode)||MODES[0];
  if(!quiz||quiz.mode!==m.id){quiz={mode:m.id,i:0,r:0,q:makeQ(m.id),ans:null}}
  head(m.t,`第 ${quiz.i+1} 题 · 答对 ${quiz.r}`,'#/train');
  const q=quiz.q;
  return `<div class="card pad">
      <div class="q">${q.q}</div>
      <div class="opts">${q.opts.map((o,i)=>{
        let cls='';
        if(quiz.ans!==null) cls=o.ok?'ok':(i===quiz.ans?'bad':'');
        return `<button class="btn ${cls}" data-opt="${i}">${o.t}</button>`}).join('')}</div>
      ${quiz.ans===null?'':`<div class="fb ${q.opts[quiz.ans].ok?'ok':'bad'}">
        ${q.opts[quiz.ans].ok?'对了。':'不对。'}${q.tip}</div>
        <div class="row" style="margin-top:12px">
          <button class="btn" data-go="#/card/${q.card.n}">看这张牌</button>
          <button class="btn pri" id="next">下一题</button></div>`}
    </div>`;
}

/* ---------- 抽牌 ---------- */
let drawn=null;
function vDraw(id){
  const sp=SPREADS.find(s=>s.id===id)||SPREADS[0];
  head(sp.name,sp.tip,'#/train');
  if(!drawn||drawn.id!==sp.id) drawn={id:sp.id,cards:shuffle(DECK).slice(0,sp.size)};
  const cls=sp.size===9?'nine':'spread';
  const body=drawn.cards.map((c,i)=>`<div>${tile(c)}${sp.slots[i]?`<span class="slot">${sp.slots[i]}</span>`:''}</div>`).join('');
  let read='';
  if(sp.size>1){
    const [a,b]=drawn.cards;
    read=`<div class="card pad" style="margin-top:12px"><div class="mut">前两张先连起来读：</div>
      <div class="chips" style="margin-top:8px">${phrases(a,b).map(p=>`<span class="chip k">${p}</span>`).join('')}</div></div>`;
  }
  const j=sp.id==='d1';
  return `<div class="${cls}">${body}</div>${read}
    ${j?`<div class="card pad" style="margin-top:12px">
      <div class="mut">${moonSvg(moonOf(today()).p)}${today()} · ${moonOf(today()).name}</div>
      <div class="mut" style="margin-top:6px">今天你怎么解？晚上回来补一句实际发生了什么。</div>
      <textarea id="jn" placeholder="我的解读…" style="margin-top:8px"></textarea>
      <button class="btn pri" id="jsave" style="margin-top:8px">存进日记</button></div>`:''}
    <button class="btn" id="redraw" style="margin-top:12px;text-align:center">重新抽</button>`;
}

/* ---------- 记 ---------- */
function vJournal(){
  head('抽牌日记','回看比抽牌更重要');
  if(!S.journal.length) return `<div class="card pad mut">还没有记录。去「练 › 每日一张」抽一张，写下你的解读；
    过几天回来补上实际发生了什么，这一栏最值钱。</div>
    <button class="btn pri" data-go="#/draw/d1" style="margin-top:12px">抽今天这一张</button>`;
  return S.journal.map((e,i)=>{
    const c=byN(e.n);
    return `<div class="card pad" style="margin-bottom:10px">
      <div class="row" style="align-items:center">
        <div style="flex:0 0 66px">${tile(c)}</div>
        <div style="flex:1"><div class="mut">${moonSvg(moonOf(e.d).p)}${e.d} · ${moonOf(e.d).name}</div><div>${esc(e.txt||'')}</div></div></div>
      ${e.real?`<div class="ex" style="margin:10px 0 0"><b>实际</b><span>${esc(e.real)}</span></div>`:
      `<input type="text" data-real="${i}" placeholder="实际发生了什么？回车保存" style="margin-top:10px">`}
    </div>`}).join('');
}

/* ---------- 事件 ---------- */
document.addEventListener('click',e=>{
  const th=e.target.closest('[data-theme-set]');
  if(th){applyTheme(th.dataset.themeSet);return}
  const g=e.target.closest('[data-go]'); if(g&&g.dataset.go){location.hash=g.dataset.go;return}
  const t=e.target.closest('[data-card]');
  if(t&&location.hash.startsWith('#/combo')){
    const n=+t.dataset.card;
    if(comboA===n){comboA=comboB;comboB=null}
    else if(comboB===n){comboB=null}
    else if(comboA===null)comboA=n; else comboB=n;
    route();return;
  }
  if(t){location.hash='#/card/'+t.dataset.card;return}
  const f=e.target.closest('[data-filter]');
  if(f){filter=f.dataset.filter;route();return}
  if(e.target.id==='creset'){comboA=comboB=null;route();return}
  if(e.target.id==='redraw'){drawn=null;route();return}
  if(e.target.id==='next'){quiz.i++;quiz.q=makeQ(quiz.mode);quiz.ans=null;route();return}
  if(e.target.id==='jsave'){
    const c=drawn.cards[0],txt=document.getElementById('jn').value.trim();
    S.journal.unshift({d:today(),n:c.n,txt});save();location.hash='#/journal';return;
  }
  const o=e.target.closest('[data-opt]');
  if(o&&quiz&&quiz.ans===null){
    const i=+o.dataset.opt,ok=quiz.q.opts[i].ok,n=quiz.q.card.n;
    S.stat[n]=S.stat[n]||{r:0,w:0}; S.stat[n][ok?'r':'w']++; save();
    quiz.ans=i; if(ok)quiz.r++; route();
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){
    const v=e.target.value.trim().toLowerCase();
    const hit=DECK.filter(c=>!v||[c.name,c.en,c.pk,...c.keys,...c.noun].join(' ').toLowerCase().includes(v));
    document.getElementById('cg').innerHTML=hit.map(c=>tile(c)).join('')||'<div class="mut">没有匹配的牌</div>';
  }
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.dataset.real!==undefined){
    S.journal[+e.target.dataset.real].real=e.target.value.trim();save();route();
  }
});
window.addEventListener('hashchange',route);
applyTheme(new URLSearchParams(location.search).get('t')||S.theme||'pearl');
{const m=document.getElementById('mark'); if(m) m.innerHTML=orn('fishpair');}
route();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
