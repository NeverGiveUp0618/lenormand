/* 雷诺曼学习站 · 逻辑层 */
const LS='lenormand_v1';
const S=(()=>{try{return JSON.parse(localStorage.getItem(LS))||{}}catch(e){return{}}})();
S.stat=S.stat||{}; S.journal=S.journal||[]; S.read=S.read||{}; S.mem=S.mem||{};
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
const byN=n=>DECK.find(c=>c.n===+n);
const hasOrig=id=>typeof ORIGINALS!=='undefined'&&ORIGINALS&&ORIGINALS[id];
/* 牌图位：用户把自己设计的牌存成 assets/cards/01.jpg…36.jpg，放进去就自动显示；
   没有该文件时图元素自行移除，牌面退回纯文字排版 */
const CARD_DIR='assets/cards/', FIG_DIR='assets/figs/';
/* 牌图两档：网格用 260px 缩略，详情用 600px 大图 */
/* 三档：t=网格缩略(260) / 空=正常显示(600) / z=放大看细节(1024，原始分辨率) */
const face=(n,big,zoom)=>{
  const id=String(n).padStart(2,'0'), p=`${CARD_DIR}${big?'':'t/'}${id}`;
  return `<picture><source srcset="${p}.webp" type="image/webp">
    <img class="face${zoom?' zoomable':''}" ${zoom?`data-zoom="${n}"`:''}
      src="${p}.jpg" alt="" loading="lazy" onerror="this.remove()"></picture>`;
};
/* 全屏看细节 */
function openZoom(n){
  const c=byN(n), id=String(n).padStart(2,'0');
  const el=document.createElement('div');
  el.className='zoomer'; el.id='zoomer';
  el.innerHTML=`<div class="zbox"><picture>
      <source srcset="${CARD_DIR}z/${id}.webp" type="image/webp">
      <img src="${CARD_DIR}${id}.jpg" alt="${c.name}"></picture>
      <div class="zcap">${c.n} · ${c.name} · ${c.pk}</div></div>`;
  document.body.appendChild(el);
  document.body.style.overflow='hidden';
}
function closeZoom(){
  const el=document.getElementById('zoomer');
  if(el){el.remove(); document.body.style.overflow='';}
}
const orn=(k,cls)=>`<svg class="${cls||''}" viewBox="${ORN[k].vb}" fill="none" stroke="currentColor"
  stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ORN[k].d}</svg>`;
const SEC=t=>`<h2 class="sec">${orn('pisces','gl')}<span class="t">${t}</span></h2>`;
const moonSvg=p=>`<svg class="moon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor"
  stroke-width="1"><circle cx="12" cy="12" r="9" fill="none" opacity=".3"/><path d="${moonPath(p)}"/></svg>`;
const polCls=p=>p>0?'pos':(p<0?'neg':'');
const polTag=p=>p>=2?'<span class="pol p">强正面</span>':p===1?'<span class="pol p">正面</span>'
  :p===-1?'<span class="pol n">负面</span>':'<span class="pol z">中性</span>';
const esc=s=>String(s).replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=a=>a[Math.random()*a.length|0];
const today=()=>new Date().toLocaleDateString('sv');

/* 扑克花色：中文 → 符号 + 点数，红黑分色 */
const SUIT={'红桃':['♥','r'],'方块':['♦','r'],'黑桃':['♠','b'],'梅花':['♣','b']};
function pip(pk){
  const s=SUIT[pk.slice(0,2)]||['',''];
  return `<span class="pk ${s[1]}">${s[0]}${pk.slice(2)}</span>`;
}
const ROLE3=p=>p>0?'幸运':(p<0?'挑战':'中性');
function tile(c,extra){
  return `<div class="tile ${polCls(c.pol)} ${extra||''}" data-card="${c.n}" data-no="${c.n}">
    <div class="bar"><span class="no">${String(c.n).padStart(2,'0')}</span>
      <span class="rl">${ROLE3(c.pol)}</span></div>
    ${face(c.n)}<div class="nm">${c.name}</div>
    <div class="en">${c.en}${pip(c.pk)}</div></div>`;
}

/* ---------- 每日任务 ---------- */
/* 全部按当天真实行为计数，不靠手动打勾；跨天自动清零 */
const DAILY=[
 {k:'read', n:1, t:'读一篇课程',   d:'或回看一篇要点',  m:3, go:()=>{
    const nx=LESSONS.find(l=>!S.read[l.id]); return '#/lesson/'+(nx?nx.id:1)}},
 {k:'mem',  n:6, t:'数字桩 6 题',  d:'把号码和牌钉在一起', m:2, go:()=>'#/mem'},
 {k:'quiz', n:10,t:'牌义 10 题',   d:'牌义、组合、扑克混着来', m:3, go:()=>'#/quiz/mix'},
 {k:'draw', n:1, t:'抽今日一张',   d:'写一句解读，晚上补实际', m:1, go:()=>'#/draw/d1'},
];
function daily(){
  const t=today();
  if(!S.daily||S.daily.d!==t){S.daily={d:t,read:0,mem:0,quiz:0,draw:0};save()}
  return S.daily;
}
function bump(k,by){
  const s=daily(); s[k]=(s[k]||0)+(by||1); save();
}
function dailyDone(){const s=daily(); return DAILY.filter(x=>s[x.k]>=x.n).length}

/* ---------- 主题 ---------- */
const THEMES=[['pearl','月白','暖象牙纸，墨与旧金'],
              ['dusk','玫瑰金','胭脂纸，梅子色与霜绿'],
              ['sea','夜航','墨蓝纸，月光银与金'] ];
function applyTheme(t){
  if(!THEMES.some(x=>x[0]===t)) t='dusk';   // 默认玫瑰金
  S.theme=t; save();
  document.documentElement.setAttribute('data-theme',t);
  const tc=getComputedStyle(document.documentElement).getPropertyValue('--tc').trim();
  const m=document.getElementById('tc'); if(m&&tc) m.setAttribute('content',tc);
  const box=document.getElementById('themes');
  if(box) box.innerHTML=THEMES.map(([id,nm,d])=>
    `<button data-theme-set="${id}" class="${t===id?'on':''}" title="${nm} · ${d}" aria-label="${nm}"></button>`).join('');
}

/* ---------- 路由 ---------- */
const TABS=[['learn','学','学'],['cards','查','查'],['train','练','练']];
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
  document.body.classList.remove('guiding');
  const p=location.hash.replace(/^#\/?/,'').split('/');
  const v=document.getElementById('view');
  const r={learn:vLearn,lesson:vLesson,cards:vCards,card:vCard,combo:vCombo,
           train:vTrain,quiz:vQuiz,draw:vDraw,journal:vJournal,orig:vOrig,slots:vSlots,mem:vMem}[p[0]]||vLearn;
  v.innerHTML=r(p[1],p[2])||''; v.scrollTop=0; window.scrollTo(0,0); nav();
}

/* ---------- 学 ---------- */
function vLearn(){
  head('雷诺曼 · 三十六牌','从零到能读盘，十二篇');
  const read=LESSONS.filter(l=>S.read[l.id]).length;
  const nx=LESSONS.find(l=>!S.read[l.id])||LESSONS[LESSONS.length-1];
  const st=Object.values(S.stat); let r=0,w=0; st.forEach(s=>{r+=s.r;w+=s.w});
  const known=DECK.filter(c=>{const s=S.stat[c.n];return s&&s.r>=3&&s.r>s.w*2}).length;
  const done=read===LESSONS.length;
  const s=daily(), dn=dailyDone(), mins=DAILY.reduce((n,x)=>n+x.m,0);
  const task=`<div class="daily ${dn===DAILY.length?'alldone':''}">
      <div class="dh"><b>今日任务</b>
        <span>${dn===DAILY.length?'今天全部做完了':`约 ${mins} 分钟 · ${dn}/${DAILY.length}`}</span></div>
      ${DAILY.map((x,i)=>{const c=Math.min(s[x.k]||0,x.n), ok=c>=x.n;
        return `<div class="dt ${ok?'ok':''}" data-go="${x.go()}">
          <span class="dbox">${ok?'✓':i+1}</span>
          <span class="dtx"><b>${x.t}</b><i>${x.d}</i></span>
          <span class="dnum">${x.n>1?`${c}/${x.n}`:`${x.m} 分钟`}</span></div>`}).join('')}
    </div>`;
  return task+
   `<button class="btn pri big" data-go="#/lesson/${nx.id}">
      ${done?'重读':'继续学'} · 第 ${nx.id} 篇 ${nx.title}</button>
    <div class="prog">
      <div class="pr"><b>${read}/${LESSONS.length}</b><span>课程读完</span>
        <i class="bar"><s style="width:${read/LESSONS.length*100}%"></s></i></div>
      <div class="pr"><b>${known}/36</b><span>牌义已熟</span>
        <i class="bar"><s style="width:${known/36*100}%"></s></i></div>
    </div>
`+SEC(`十二篇`)+`<div class="card">`+
   LESSONS.map(l=>`<div class="lesson-li" data-go="#/lesson/${l.id}">
     <span class="idx">${l.id}</span><div style="flex:1"><div class="t">${l.title}</div>
     <div class="s">${l.sub}</div></div>
     ${S.read[l.id]?'<span class="tick">✓</span>':''}</div>`).join('')+`</div>`;
}
function vLesson(id){
  const l=LESSONS.find(x=>x.id===+id)||LESSONS[0];
  S.read[l.id]=1; bump('read'); save();
  head(`第 ${l.id} 篇 · ${l.title}`,l.sub,'#/learn');
  const keys=(l.key||[]).length?`<div class="keys"><div class="kh">本篇要点</div><ol>`+
    l.key.map(k=>`<li>${k}</li>`).join('')+`</ol></div>`:'';
  const html=l.body.map(b=>{
    if(b[0]==='p') return `<p>${b[1]}</p>`;
    if(b[0]==='h') return `<h3>${b[1]}</h3>`;
    if(b[0]==='ex') return `<div class="ex"><b>${b[1]}</b><span>${b[2]}</span></div>`;
    if(b[0]==='cards') return `<div class="grid">${b[1].map(n=>tile(byN(n))).join('')}</div>`;
    if(b[0]==='fig'){ // 图位：图做好了就显示，没做就显示标记框
      return `<figure class="fig slot" data-slot="${b[1]}">
        <picture><source srcset="${FIG_DIR}${b[1]}.webp" type="image/webp">
          <img src="${FIG_DIR}${b[1]}.jpg" alt="${b[2]}" loading="lazy"
            onload="this.closest('.slot').classList.add('done')" onerror="this.remove()"></picture>
        <div class="ph">
          <div class="ph-id">图位 ${b[1]}</div>
          <div class="ph-t">${b[2]}</div>
          <div class="ph-e">${b[3]}</div>
        </div>
        <figcaption class="cap done-only">${b[2]}</figcaption></figure>`;
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
  return keys+`<div class="body rd">${html}</div>`+link+og+
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
function vCards(mode){
  if(mode&&['all','pos','neg','mid','list','peg'].includes(mode)) filter=mode;
  head('36 张牌',filter==='list'?'一行一张，一屏扫完'
    :filter==='peg'?'数字桩 · 点标题展开画面':'点开看牌义');
  const TABS_F=[['all','全部'],['pos','幸运'],['neg','挑战'],['mid','中性'],
                ['list','速查'],['peg','记忆法']];
  const bar=`<div class="fbar">`+
    TABS_F.map(([k,t])=>`<button class="btn ${filter===k?'on':''}" data-filter="${k}">${t}</button>`)
    .join('')+`</div>`;
  if(filter==='peg'){    // 记忆法全文，默认折叠
    return bar+`<div class="row" style="margin-bottom:11px">
        <button class="btn" id="pgopen">全部展开</button>
        <button class="btn" id="pgclose">全部收起</button></div>`+
      DECK.map(c=>{const m=MEM[c.n]; return `<details class="mrow" data-peg="${c.n}">
        <summary><span class="pn">${String(c.n).padStart(2,'0')}</span>
          <span class="pg">${m.peg}</span><span class="pl">＋</span>
          <span class="pc">${c.name}</span><span class="pk ${SUIT[c.pk.slice(0,2)][1]}">${SUIT[c.pk.slice(0,2)][0]}${c.pk.slice(2)}</span>
        </summary>
        <div class="pbody">
          <div class="pthumb">${face(c.n,1,1)}</div>
          <div class="ptxt"><div class="plab">逻辑画面</div><p>${m.scene}</p>
            <div class="plab">合理性</div><p class="pwhy">${m.why}</p>
            <button class="btn" data-go="#/card/${c.n}" style="margin-top:12px">看这张牌义 ›</button>
          </div></div></details>`}).join('');
  }
  if(filter==='list'){   // 速查：一行一张，一屏扫完
    return bar+`<div class="card lst">`+DECK.map(c=>`<div class="li" data-card="${c.n}">
      <span class="n">${String(c.n).padStart(2,'0')}</span>
      <span class="nm">${c.name}</span>${pip(c.pk)}
      <span class="rl ${polCls(c.pol)}">${ROLE3(c.pol)}</span>
      <span class="kw">${c.keys.join(' · ')}</span></div>`).join('')+`</div>`;
  }
  const f={all:()=>1,pos:c=>c.pol>0,neg:c=>c.pol<0,mid:c=>c.pol===0};
  const list=DECK.filter(f[filter]||f.all);
  return bar+`<input type="text" id="q" placeholder="搜牌名 / 英文 / 扑克 / 关键词"
      style="margin-bottom:12px">
    <div class="grid" id="cg">${list.map(c=>tile(c)).join('')}</div>`;
}

function vCard(n){
  const c=byN(n); if(!c) return vCards();
  head(`${String(c.n).padStart(2,'0')} ${c.name}`,c.en+' · '+c.pk,'#/cards');
  const F=(t,v)=>v&&v.length?`<dt>${t}</dt><dd>${Array.isArray(v)
    ?`<div class="chips">${v.map(x=>`<span class="chip">${x}</span>`).join('')}</div>`:v}</dd>`:'';
  return `<div class="card pad rd">
    <div class="hero"><div class="facebox">${face(c.n,1,1)}<span>${String(c.n).padStart(2,'0')}</span></div><div>
      <div class="nm">${c.name}</div>
      <div class="meta">${c.en} · ${c.pk} · ${String(c.n).padStart(2,'0')} 号</div>
      <div style="margin-top:6px">${polTag(c.pol)}</div></div></div>
    <dl class="f">
      ${F('概括',c.gist)}${F('作用',c.role)}
      <dt>关键词</dt><dd><div class="chips">${c.keys.map(k=>`<span class="chip k">${k}</span>`).join('')}</div></dd>
      ${F('名词',c.noun)}${F('形容词',c.adj)}${F('动词',c.verb)}${F('副词',c.adv)}
      ${F('人物',c.people)}${F('时间',c.time)}${F('雷诺曼宇宙',c.univ)}
      ${MEM[c.n]?`<dt>记忆钩子</dt><dd><b class="peg">${c.n} · ${MEM[c.n].peg}</b>
        <span class="scene">${MEM[c.n].scene}</span>
        <span class="scene why">${MEM[c.n].why}</span></dd>`:''}
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

/* ---------- 记忆：数字桩测验（不靠自评，按答题结果判定） ---------- */
/* S.mem[n] = 连对次数 box：0 没记住 / 1 对过一次 / 2 以上算掌握 */
const MEM_OK=2;
const box=n=>{const v=S.mem[n]; return typeof v==='number'?v:(v?1:0);};
const memDone=()=>DECK.filter(c=>box(c.n)>=MEM_OK).length;
let memQ=null;   // 当前题
function nextMem(){
  const pool=shuffle(DECK).sort((x,y)=>box(x.n)-box(y.n));   // 生的排前面
  const c=pool[Math.random()<0.75?0:Math.floor(Math.random()*Math.min(6,pool.length))];
  const dir=Math.random()<0.65?'peg2card':'card2peg';
  const others=shuffle(DECK.filter(x=>x.n!==c.n)).slice(0,5);
  return {c,dir,opts:shuffle([c,...others]),ans:null};
}
function vMem(arg){
  // 已经看过结果的题不再重复出现：离开再回来给新题
  if(!memQ||arg==='r'||(memQ.ans!==null&&memQ.seen)) memQ=nextMem();
  const {c,dir,opts,ans}=memQ, m=MEM[c.n], done=memDone();
  if(ans!==null) memQ.seen=true;
  head('数字桩记忆',`已掌握 ${done}/36`,'#/train');
  const ok=ans!==null&&ans===c.n;
  const grid=dir==='peg2card'
    ? `<div class="memgrid">`+opts.map(x=>`<div class="mopt ${ans===null?'':(x.n===c.n?'right':(x.n===ans?'wrong':'dim'))}"
        data-mem="${x.n}">${face(x.n)}<span>${x.name}</span></div>`).join('')+`</div>`
    : `<div class="opts">`+opts.map(x=>`<button class="btn ${ans===null?'':(x.n===c.n?'ok':(x.n===ans?'bad':''))}"
        data-mem="${x.n}" style="text-align:center">${MEM[x.n].peg}</button>`).join('')+`</div>`;
  const q=dir==='peg2card'
    ? `<span class="mno">${String(c.n).padStart(2,'0')}</span><span class="mpeg">${m.peg}</span>
       <p class="mhint">这个桩挂的是哪张牌？</p>`
    : `<div class="mcard">${face(c.n)}</div><div class="mname">${c.name}</div>
       <p class="mhint">它的桩词是哪个？</p>`;
  return `<div class="pr" style="margin-bottom:14px"><b>${done}/36</b><span>已掌握（连对两次算）</span>
      <i class="bar"><s style="width:${done/36*100}%"></s></i></div>
    <div class="memcard">${q}</div>${grid}
    ${ans===null?'':`<div class="fb ${ok?'ok':'bad'}" style="margin-top:14px">
        ${ok?'对了。':`不对，是 <b>${c.n} ${c.name}</b>。`}</div>
      <div class="mcard mcard-a">${face(c.n,1,1)}</div>
      <div class="memsc"><b>${c.n} · ${m.peg} · ${c.name}</b>
        <p>${m.scene}</p><p class="mwhy">${m.why}</p></div>
      <button class="btn pri" id="mnext" style="margin-top:12px">下一题</button>`}`;
}

/* ---------- 练 ---------- */
const MODES=[
 {id:'num',t:'牌号与扑克',d:'号 ↔ 牌名 ↔ 扑克牌，铺大牌阵的基本功'},
 {id:'key',t:'关键词认牌',d:'看关键词想是哪张牌'},
 {id:'combo',t:'组合造句',d:'把两张牌读成一句话'},
 {id:'peg',t:'数字桩',d:'号码 ↔ 桩词 ↔ 牌，背牌序最快的路'},
 {id:'mix',t:'混合练习',d:'四种题型打散来一轮'}
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
  const memd=memDone();
  return `<button class="btn pri" data-go="#/mem" style="margin-bottom:12px">
      数字桩记忆 · ${memd}/36</button>
    <div class="card pad">
      <div class="mut">累计答题 ${done} 题 · 正确率 ${rate}%</div>
      <div class="bar"><i style="width:${rate}%"></i></div>
    </div>
    ${SEC(`题型`)}<div class="opts">`+
    MODES.map(m=>`<button class="btn" data-go="#/quiz/${m.id}"><b>${m.t}</b><br>
      <span class="mut">${m.d}</span></button>`).join('')+`</div>`+
    (wk.length?`${SEC(`薄弱的牌`)}<div class="grid">${wk.map(c=>tile(c)).join('')}</div>`:'')+
    `${SEC(`抽牌与日记`)}<div class="opts">
      <button class="btn" data-go="#/journal"><b>抽牌日记</b><br>
        <span class="mut">回看比抽牌更重要：记下解读，事后补实际发生了什么</span></button>`+
    SPREADS.map(s=>`<button class="btn" data-go="#/draw/${s.id}"><b>${s.name}</b><br>
      <span class="mut">${s.tip}</span></button>`).join('')+`</div>`;
}
let quiz=null;
function makeQ(mode){
  const pool=weak(), c=pick(pool.slice(0,12).concat(shuffle(DECK).slice(0,12)));
  const m=mode==='mix'?pick(['num','key','combo','peg']):mode;
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
  if(m==='peg'){
    const ask=pick(['peg2card','card2peg']);
    if(ask==='peg2card'){
      const o=shuffle([c,...shuffle(DECK.filter(x=>x.n!==c.n)).slice(0,3)]);
      return{q:`桩词「${MEM[c.n].peg}」挂的是哪张牌？`,
        opts:o.map(x=>({t:`${x.n} ${x.name}`,ok:x.n===c.n})),card:c,tip:MEM[c.n].scene};
    }
    const o=shuffle([c,...shuffle(DECK.filter(x=>x.n!==c.n)).slice(0,3)]);
    return{q:`${c.n} 号 ${c.name} 的桩词是什么？`,
      opts:o.map(x=>({t:MEM[x.n].peg,ok:x.n===c.n})),card:c,tip:MEM[c.n].scene};
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

/* ---------- 盘面统计（第十一、十二篇的机械步骤，自动算好） ---------- */
const RANKV={A:1,J:11,Q:12,K:13};
const pkVal=pk=>{const r=pk.slice(2); return RANKV[r]||+r};
const isCourt=pk=>['J','Q','K'].includes(pk.slice(2));
function stats(cards){
  const suits={红桃:0,方块:0,黑桃:0,梅花:0};
  cards.forEach(c=>suits[c.pk.slice(0,2)]++);
  const sum=cards.reduce((n,c)=>n+pkVal(c.pk),0);
  const digit=n=>{while(n>36)n=String(n).split('').reduce((a,b)=>a+ +b,0); return n};
  const minus=n=>{while(n>36)n-=36; return n};
  const a=digit(sum), b=minus(sum);
  const ranks={};
  cards.forEach(c=>{const r=c.pk.slice(2); ranks[r]=(ranks[r]||0)+1});
  return {suits,sum,
    sumCards:[...new Set([a,b])].filter(n=>n>=1&&n<=36),
    pol:{p:cards.filter(c=>c.pol>0).length,z:cards.filter(c=>c.pol===0).length,
         n:cards.filter(c=>c.pol<0).length},
    courts:cards.filter(c=>isCourt(c.pk)),
    pairs:Object.entries(ranks).filter(([,v])=>v>=2)};
}
function vStats(cards){
  if(cards.length<3) return '';
  const s=stats(cards), tot=cards.length;
  const SU={红桃:['♥','r','人情'],方块:['♦','r','动能'],黑桃:['♠','b','事务'],梅花:['♣','b','难处']};
  const top=Object.entries(s.suits).sort((a,b)=>b[1]-a[1]);
  return `<div class="stats">
    <div class="sh"><b>盘面统计</b><span>点数总和 ${s.sum}</span></div>
    <div class="sb">
      <div class="srow"><i>花色</i><span>`+
        Object.entries(s.suits).map(([k,v])=>`<em class="su ${SU[k][1]} ${v===0?'z':''}">
          ${SU[k][0]}${v}</em>`).join('')+
        `<u>${top[0][1]>=Math.ceil(tot/2)?`${SU[top[0][0]][0]} 占多数 · 这盘的底色是${SU[top[0][0]][2]}`:'没有明显的主导花色'}</u></span></div>
      <div class="srow"><i>吉凶</i><span>
        <em class="pp">幸运 ${s.pol.p}</em><em class="pz">中性 ${s.pol.z}</em><em class="pn">挑战 ${s.pol.n}</em></span></div>
      <div class="srow"><i>总和</i><span>`+
        s.sumCards.map(n=>`<em class="sc" data-card="${n}">${n} ${byN(n).name}</em>`).join('')+
        `<u>${s.sum>36?'超过 36，两种化简都列出来了':''}从这张提一句祝福收尾</u></span></div>
      ${s.courts.length?`<div class="srow"><i>宫廷牌</i><span>`+
        s.courts.map(c=>`<em class="sq" data-card="${c.n}">${c.name}</em>`).join('')+
        `<u>可能代表具体的人</u></span></div>`:''}
      ${s.pairs.length?`<div class="srow"><i>同点数</i><span>`+
        s.pairs.map(([r,v])=>`<em class="sr">${v} 张 ${r}</em>`).join('')+
        `<u>同点数成组出现，特别有话说</u></span></div>`:''}
    </div></div>`;
}

/* ---------- 牌阵分步引导 ---------- */
const GUIDE={
 box9:[
  {t:'中心',i:[4],h:'先看正中这张：这盘到底在讲什么。它是主题，其余八张都围着它转。'},
  {t:'过去',i:[0,3,6],h:'左边一列从上往下读成一句：事情是怎么来的。牌 1 常常就是起因或触发点。'},
  {t:'现在',i:[1,4,7],h:'中间一列：眼下的状况。它穿过中心牌，是全盘最要紧的一条线。'},
  {t:'未来',i:[2,5,8],h:'右边一列：照这样下去会怎样。这是结果，不是判决——行动会改它。'},
  {t:'四角',i:[0,2,6,8],h:'四个角合起来读：这件事的基本盘、大环境。'},
  {t:'菱形',i:[1,3,5,7],h:'上下左右四张：没摆到台面上的内部动态，往往是真正的推手。'},
  {t:'挑牌简化',i:[4,6,8,1,3],h:'从中心每隔一张取一张，得到五张：把它们连起来读，就是给对方的最后一句话。'}],
 s5:[
  {t:'焦点',i:[2],h:'中间这张是事情本身，先把它读准。'},
  {t:'两翼',i:[1,3],h:'紧挨着的两张：它们描述这件事的性质。'},
  {t:'来去',i:[0,4],h:'最外两张：左边是来路，右边是去处。'},
  {t:'镜像',i:[0,4],h:'把最外两张配对读一次，看首尾有没有呼应或矛盾。'},
  {t:'连读',i:[0,1,2,3,4],h:'最后整行连起来说一句人话，加上连接词，别读成电报稿。'}]
};
let gStep=null;

/* ---------- 抽牌 ---------- */
let drawn=null;
function vDraw(id){
  const sp=SPREADS.find(s=>s.id===id)||SPREADS[0];
  head(sp.name,sp.tip,'#/train');
  if(!drawn||drawn.id!==sp.id){drawn={id:sp.id,cards:shuffle(DECK).slice(0,sp.size)}; gStep=null;}
  const g=GUIDE[sp.id], on=g&&gStep!==null?g[gStep]:null;
  const cls=sp.size===9?'nine':'spread';
  document.body.classList.toggle('guiding',gStep!==null);
  const body=drawn.cards.map((c,i)=>{
    const hl=on?(on.i.includes(i)?' hl':' dim'):'';
    return `<div class="dslot${hl}">${tile(c)}${sp.slots[i]?`<span class="slot">${sp.slots[i]}</span>`:''}</div>`;
  }).join('');
  // 分步引导
  let guide='';
  if(g){
    guide=gStep===null
      ? `<button class="btn pri" id="gstart" style="margin-top:12px">带我一步步读这盘</button>`
      : `<div class="guide">
          <div class="gh"><b>第 ${gStep+1}/${g.length} 步 · ${on.t}</b>
            <span>${on.i.map(k=>drawn.cards[k].name).join(' + ')}</span></div>
          <p>${on.h}</p>
          <div class="row">
            <button class="btn" id="gprev" ${gStep===0?'disabled':''}>‹ 上一步</button>
            ${gStep===g.length-1
              ? `<button class="btn pri" id="gend">读完了</button>`
              : `<button class="btn pri" id="gnext">下一步 ›</button>`}
          </div></div>`;
  }
  // 前两张的组合读法
  let read='';
  if(sp.size>1&&gStep===null){
    const [x,y]=drawn.cards;
    read=`<div class="card pad" style="margin-top:12px"><div class="mut">前两张先连起来读：</div>
      <div class="chips" style="margin-top:8px">${phrases(x,y).map(p=>`<span class="chip k">${p}</span>`).join('')}</div></div>`;
  }
  const j=sp.id==='d1';
  return `<div class="${cls}" style="--n:${sp.size}">${body}</div>${guide}${vStats(drawn.cards)}${read}
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
  if(e.target.closest('#zoomer')){closeZoom();return}
  const z=e.target.closest('[data-zoom]');
  if(z){openZoom(+z.dataset.zoom);return}
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
  if(f){filter=f.dataset.filter;location.hash='#/cards/'+filter;route();return}
  if(e.target.id==='creset'){comboA=comboB=null;route();return}
  if(e.target.id==='pgopen'||e.target.id==='pgclose'){
    const on=e.target.id==='pgopen';
    document.querySelectorAll('details.mrow').forEach(d=>{d.open=on});
    return;
  }
  if(e.target.id==='redraw'){drawn=null;gStep=null;route();return}
  if(e.target.id==='gstart'){gStep=0;route();return}
  if(e.target.id==='gnext'){gStep++;route();return}
  if(e.target.id==='gprev'){gStep--;route();return}
  if(e.target.id==='gend'){gStep=null;route();return}
  if(e.target.id==='mnext'){memQ=nextMem();route();return}
  const mo=e.target.closest('[data-mem]');
  if(mo&&memQ&&memQ.ans===null){
    const pickN=+mo.dataset.mem, right=pickN===memQ.c.n, n=memQ.c.n;
    S.mem[n]=right?Math.min(3,box(n)+1):0;      // 连对累加，答错清零
    S.stat[n]=S.stat[n]||{r:0,w:0}; S.stat[n][right?'r':'w']++;
    bump('mem'); save(); memQ.ans=pickN; route(); return;
  }
  if(e.target.id==='next'){quiz.i++;quiz.q=makeQ(quiz.mode);quiz.ans=null;route();return}
  if(e.target.id==='jsave'){
    const c=drawn.cards[0],txt=document.getElementById('jn').value.trim();
    S.journal.unshift({d:today(),n:c.n,txt});bump('draw');save();location.hash='#/journal';return;
  }
  const o=e.target.closest('[data-opt]');
  if(o&&quiz&&quiz.ans===null){
    const i=+o.dataset.opt,ok=quiz.q.opts[i].ok,n=quiz.q.card.n;
    S.stat[n]=S.stat[n]||{r:0,w:0}; S.stat[n][ok?'r':'w']++; bump('quiz'); save();
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
window.addEventListener('hashchange',()=>{closeZoom();route()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeZoom()});
applyTheme(new URLSearchParams(location.search).get('t')||S.theme||'dusk');
{const m=document.getElementById('mark'); if(m) m.innerHTML=orn('fishpair');}
route();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
