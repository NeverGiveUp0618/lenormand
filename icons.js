/* 双鱼座装饰件与月相。牌面图标已移除——牌图由用户自行设计后放进 assets/cards/ */
/* 双鱼座装饰件 */
/* 一条朝右游的鱼，60×30 的格子里 */
const FISH =
 '<path d="M4 15C10 5 34 5 44 15 34 25 10 25 4 15z"/>'+          /* 身 */
 '<path d="M44 15L57 6.5 54 15l3 8.5z"/>'+                        /* 分叉尾 */
 '<path d="M21 6.2C25 1.6 31 2.6 33.5 6.8"/>'+                    /* 背鳍 */
 '<path d="M20 23.8C24 28.2 29 27.2 31.5 23"/>'+                  /* 腹鳍 */
 '<path d="M16 8.6C13 12 13 18 16 21.4" opacity=".6"/>'+          /* 鳃 */
 '<circle cx="11.5" cy="13" r="1.35"/>';
const ORN = {
  /* ♓ 双鱼符号：两道背向的弧，一横相连 */
  pisces:{vb:'0 0 24 24',d:'<path d="M6.5 3.5c-3.2 3.4-3.2 13.6 0 17M17.5 3.5c3.2 3.4 3.2 13.6 0 17"/><path d="M3.5 12h17"/>'},
  /* 双鱼座星群：两串星在「结」处相连（Alrescha 即阿尔里沙，那颗结星） */
  constel:{vb:'0 0 74 26',d:
    '<path d="M4 6.5 13 4 22 7 31 9.5 40 13.5 49 10 58 5.5 67 8" opacity=".38"/>'+
    '<circle cx="4" cy="6.5" r="1.1"/><circle cx="13" cy="4" r="1.4"/><circle cx="22" cy="7" r="1"/>'+
    '<circle cx="31" cy="9.5" r="1.2"/><circle cx="40" cy="13.5" r="2" opacity=".95"/>'+
    '<circle cx="49" cy="10" r="1.1"/><circle cx="58" cy="5.5" r="1.4"/><circle cx="67" cy="8" r="1"/>'+
    '<path d="M40 15.5v6" opacity=".28"/><circle cx="40" cy="22" r=".9" opacity=".6"/>'},
  /* 两条鱼朝相反方向游开，尾巴被一根绳系住，绳心是「结」 */
  fishpair:{vb:'0 0 200 42',d:
    '<g transform="translate(60,6) scale(-1,1)">'+FISH+'</g>'+
    '<g transform="translate(140,6)">'+FISH+'</g>'+
    '<path d="M60 21c8-7 14 7 22 0s14-7 22 0 14 7 22 0 14-7 14 0" opacity=".75"/>'+
    '<path d="M100 14.5l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" opacity=".9"/>'},
  /* 海浪分隔 */
  wave:{vb:'0 0 120 10',d:'<path d="M2 5c5-5 10 5 15 0s10-5 15 0 10 5 15 0 10-5 15 0 10 5 15 0 10-5 15 0 10 5 13 0" opacity=".55"/>'}
};
/* 月相：p 为 0(新月)→0.5(满月)→1，返回可填充的路径 */
function moonPath(p){
  const r=9,cx=12,cy=12,k=Math.cos(2*Math.PI*p),rx=Math.abs(k)*r,waxing=p<0.5;
  const so=waxing?1:0, si=waxing?(k>0?0:1):(k>0?1:0);
  return `M${cx} ${cy-r} A ${r} ${r} 0 0 ${so} ${cx} ${cy+r} A ${rx.toFixed(2)} ${r} 0 0 ${si} ${cx} ${cy-r} Z`;
}
const MOON_NAMES=['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'];
function moonOf(dateStr){
  const d=new Date(dateStr+'T12:00:00');
  const syn=29.530588853, base=Date.UTC(2000,0,6,18,14)/86400000;
  let p=((d.getTime()/86400000-base)/syn)%1; if(p<0)p+=1;
  return {p,name:MOON_NAMES[Math.round(p*8)%8]};
}
