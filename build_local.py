#!/usr/bin/env python3
"""把 content/ 里的公众号原文编译成 content-local.js（本地版专用，不进 git）。
   改了 content/ 之后重跑一次即可。"""
import os,re,json,glob
ROOT=os.path.dirname(os.path.abspath(__file__))
out={}
for d in sorted(glob.glob(os.path.join(ROOT,'content','[0-9][0-9]'))):
    no=int(os.path.basename(d))
    md=glob.glob(os.path.join(d,'*.md'))
    if not md: continue
    raw=open(md[0],encoding='utf-8').read()
    lines=raw.split('\n')
    title=lines[0].lstrip('# ').strip()
    src=''
    blocks=[]
    for l in lines[1:]:
        l=l.strip()
        if not l or l=='---': continue
        if l.startswith('> 来源：'): src=l[5:].strip(); continue
        m=re.match(r'!\[[^\]]*\]\((.+?)\)',l)
        if m:
            blocks.append(['img','content/%02d/%s'%(no,m.group(1))])
        else:
            blocks.append(['p',l])
    out[no]={'title':title,'src':src,'blocks':blocks}
js=('/* 本地版原文，由 build_local.py 生成，勿手改；不进 git */\n'
    'const ORIGINALS='+json.dumps(out,ensure_ascii=False,indent=0)+';\n')
open(os.path.join(ROOT,'content-local.js'),'w',encoding='utf-8').write(js)
print('已生成 content-local.js：%d 课，共 %d 段，%d 张图，%.1f 万字'%(
  len(out),
  sum(len(v['blocks']) for v in out.values()),
  sum(1 for v in out.values() for b in v['blocks'] if b[0]=='img'),
  sum(len(b[1]) for v in out.values() for b in v['blocks'] if b[0]=='p')/10000))
