/* ============================================================================
   Vantage FC - Negotiation
   ----------------------------------------------------------------------------
   Two-stage transfer negotiation:
     1. "fee"       - offer, counter, accept, walk away (club-to-club)
     2. "contract"  - wage, bonus, length, role (player + agent)

   Free agents skip straight to stage 2. Contract renewals are stage 2 only.
   The cutscene from pixel-striker-negotiation.html runs full-screen behind
   the negotiation panel while it is open.
   ========================================================================== */
(function () {
  "use strict";

  /* ─────────────────────────── CUTSCENE ───────────────────────────
     Ported from pixel-striker-negotiation.html. Nothing here talks to the
     negotiation engine; it only draws.                                   */
  const CW = 480, CH = 270, TAU = Math.PI * 2;
  const clamp = (v,a,b)=>v<a?a:v>b?b:v;
  const ez = u=>u*u*(3-2*u);
  const hx = h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const mixc = (a,b,u)=>{const x=hx(a),y=hx(b);return 'rgb('+Math.round(x[0]+(y[0]-x[0])*u)+','+Math.round(x[1]+(y[1]-x[1])*u)+','+Math.round(x[2]+(y[2]-x[2])*u)+')';};
  const rgbHex = s=>{const m=s.match(/\d+/g).map(Number);return '#'+m.map(v=>v.toString(16).padStart(2,'0')).join('');};

  let cv=null, cx=null, cutRaf=null, cutT=0, cutLast=0, cutRunning=false;
  function P(x,y,w,h,c){cx.fillStyle=c;cx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function rng(s){return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;}

  function mk(rows,pal){
    const h=rows.length,w=rows[0].length,Wd=w+2,Hd=h+2,c=document.createElement('canvas');c.width=Wd;c.height=Hd;
    const g=c.getContext('2d');
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=rows[y][x];if(ch!=='.'&&pal[ch]){g.fillStyle=pal[ch];g.fillRect(x+1,y+1,1,1);}}
    const im=g.getImageData(0,0,Wd,Hd),d=im.data,so=new Uint8Array(Wd*Hd);
    for(let i=0;i<Wd*Hd;i++)so[i]=d[i*4+3]>0?1:0;
    for(let y=0;y<Hd;y++)for(let x=0;x<Wd;x++){const i=y*Wd+x;if(so[i])continue;
      if((x>0&&so[i-1])||(x<Wd-1&&so[i+1])||(y>0&&so[i-Wd])||(y<Hd-1&&so[i+Wd])){d[i*4]=18;d[i*4+1]=14;d[i*4+2]=24;d[i*4+3]=255;}}
    g.putImageData(im,0,0);return c;
  }
  const BD=['..hhhh..','.hhhhhh.','.hssssh.','.sesses.','..ssss..','.kkkkkk.','skkkkkks','skkkkkks','.kkkkkk.','.pppppp.'];
  const BU=['..hhhh..','.hhhhhh.','.hhhhhh.','.hhhhhh.','..hhhh..','.kkkkkk.','skkkkkks','skkkkkks','.kkkkkk.','.pppppp.'];
  const pad=(a,n)=>a.map(s=>'.'.repeat(n)+s+'.'.repeat(n));
  const legsFB=fr=>{const n=['p','o','o','b'],l=['p','o','b','.'],r=[];for(let i=0;i<4;i++){const a=fr===1?l[i]:n[i],b=fr===3?l[i]:n[i];r.push('.'+a+a+'..'+b+b+'.');}return r;};
  function armRows(body,L,R,fr,suit){
    const g=body.map(s=>('...'+s+'...').split(''));
    g[6][3]='k';g[6][10]='k';g[7][3]='k';g[7][10]='k';
    if(suit){g[5][6]='w';g[5][7]='w';g[6][6]='t';g[6][7]='t';g[7][6]='t';g[7][7]='t';}
    const arm=(t,sd)=>{const sh=sd<0?3:10,x0=sd<0?2:11;
      if(t==='d'){g[6][sh]='s';g[7][sh]='s';}
      else if(t==='u'){g[5][sh]='k';for(let r=5;r>=1;r--)g[r][x0]='k';g[0][x0]='s';}
      else if(t==='w'){for(let i=0;i<3;i++)g[6][sh+sd*(i+1)]=i<2?'k':'s';}
      else if(t==='f'){const c0=sd<0?4:7;for(let c=c0;c<c0+3;c++)g[7][c]='s';}};
    arm(L,-1);arm(R,1);
    return g.map(a=>a.join('')).concat(pad(legsFB(fr),3));
  }
  const ROLES_CUT={
    mgr:{skin:'#e8b98a',hair:'#cfd0d8',s:'#1e2744',p:'#1e2744',tie:'#b02a30',suit:1},
    agt:{skin:'#f6d1a8',hair:'#241a14',s:'#7b8190',p:'#5f6575',tie:'#2a4a8a',suit:1},
    ply:{skin:'#9b6a43',hair:'#17110d',s:'#2f6fe4',p:'#1a2850',tie:null,suit:0}
  };
  const SC=new Map();
  function spr(role,pose){
    const key=role+pose;let c=SC.get(key);if(c)return c;const R=ROLES_CUT[role];
    c=mk(armRows(pose[0]==='B'?BU:BD,pose[1],pose[2],+pose[3]||0,pose[0]==='A'&&R.suit),{h:R.hair,s:R.skin,e:'#1a1420',k:R.s,p:R.p,o:R.s,b:'#15131c',w:'#f2f2f2',t:R.tie||R.s});SC.set(key,c);return c;
  }
  function face(x,y,sc,role,o){
    const sk=ROLES_CUT[role].skin,E='#1a1420',Q=(cx_,cy,w,h,c)=>P(x+cx_*sc,y+cy*sc,w*sc,h*sc,c);
    if(o.down){Q(6,4,1,1,sk);Q(9,4,1,1,sk);Q(6,5,1,1,E);Q(9,5,1,1,E);}
    else if(o.blink){Q(6,4,1,1,sk);Q(9,4,1,1,sk);}
    if(o.brow){Q(6,3,1,1,ROLES_CUT[role].hair);Q(9,3,1,1,ROLES_CUT[role].hair);}
    if(!o.down){if(o.mouth==='smile')Q(6,5,4,1,'#3a1c1c');else if(o.mouth==='talk')Q(7,5,2,1,'#3a1c1c');else Q(7,5,2,1,'#7a5a48');}
    if(o.sweat){const f=(o.sweat*1.6)%1;Q(11,3+f*3,1,2,'#7ad0ff');Q(11,3+f*3,1,1,'#d8f4ff');}
  }
  function chr(role,pose,cx_,top,sc,o){
    o=o||{};const s=spr(role,pose),w=s.width*sc,x=Math.round(cx_-w/2),y=Math.round(top);
    cx.drawImage(s,x,y,w,s.height*sc);
    if(pose[0]==='A')face(x,y,sc,role,o);
  }
  const LOOP=40;
  const SPK=[[0,4.5,'agt'],[4.5,7,'mgr'],[7,9,'agt'],[9,12.5,'mgr'],[13.8,15.6,'ply'],[15.6,19,'agt'],[19.6,23.5,'mgr'],[23.5,26,'agt'],[26,29,'mgr'],[29,30.8,'ply'],[34.8,36.4,'mgr'],[36.4,40,'agt']];
  const CUTS=[[0,3,'A'],[3,4.5,'G'],[4.5,7,'M'],[7,8.4,'B'],[8.4,9.2,'Y'],[9.2,10.8,'A'],[10.8,12.5,'M'],[12.5,15.6,'Y'],[15.6,17.2,'B'],[17.2,19,'G'],[19,19.6,'A'],[19.6,22,'M'],[22,23.5,'A'],[23.5,25,'G'],[25,26,'B'],[26,28.5,'M'],[28.5,29.2,'Y'],[29.2,30.8,'A'],[30.8,33,'G'],[33,34.8,'B'],[34.8,36.4,'M'],[36.4,38.2,'G'],[38.2,40,'A']];
  function speaker(T){for(const s of SPK)if(T>=s[0]&&T<s[1])return s[2];return null;}
  const inR=(T,a)=>a.some(r=>T>=r[0]&&T<r[1]);
  const GM=[['d','d'],['f','f'],['w','d'],['u','d'],['f','f'],['w','w'],['d','u']],GA=[['w','u'],['u','w'],['w','w'],['d','u'],['u','d'],['w','d']];
  function arms(role,T){const sp=speaker(T)===role;
    if(role==='mgr')return sp?GM[Math.floor(T*.9)%GM.length]:['f','f'];
    if(role==='agt')return sp?GA[Math.floor(T*1.3+1)%GA.length]:(inR(T,[[30.8,34.8]])?['f','f']:['d','f']);
    return sp?['d','f']:(Math.floor(T*.4)%3===0?['f','f']:['d','d']);}
  const smiling=(role,T)=>(role==='agt'&&inR(T,[[31.2,34],[26,26.8]]))||(role==='mgr'&&inR(T,[[36.4,38]]))||(role==='ply'&&inR(T,[[37,39.5]]));
  function mouth(role,T){if(speaker(T)===role)return Math.sin(T*17+role.length*2)>-.2?'talk':'flat';return smiling(role,T)?'smile':'flat';}
  const blinkAt=(T,k)=>((T+k)%3.4)<.12;
  const brow=(role,T)=>role==='mgr'?inR(T,[[4.5,7],[19.6,23.5]]):role==='agt'?inR(T,[[7,9],[15.6,17],[23.5,24.5]]):inR(T,[[7,12.5],[19.6,23.5]]);
  const plyDown=T=>!inR(T,[[10.4,11.4],[13.8,15.6],[26.5,27.5],[29,30.8],[36.8,38.2]]);
  const sweat=T=>inR(T,[[7,9.5],[19.6,22.5]])?T:0;
  const nodAmt=(role,T)=>{const other=speaker(T);if(!other||other===role)return 0;return Math.max(0,Math.sin(T*2.4+role.length))*(role==='ply'?2:3);};
  function rain(x,y,w,h,t,n,a){cx.fillStyle='rgba(190,210,255,'+a+')';for(let k=0;k<n;k++){const ry=(k*97+t*340)%h,rx=((k*53)%w+ry*.2)%w;cx.fillRect(Math.round(x+rx),Math.round(y+ry),1,5);}}
  const SKY=(()=>{const r=rng(9);return Array.from({length:24},(_,i)=>({x:i/24,w:.03+r()*.03,h:.1+r()*.2,wl:Array.from({length:8},()=>r())}));})();
  function winScene(x,y,w,h,t,dk){
    cx.save();cx.beginPath();cx.rect(x,y,w,h);cx.clip();
    const top=rgbHex(mixc('#1a2040','#05080f',dk)),hor=rgbHex(mixc('#5a3a58','#101830',dk));
    for(let i=0;i<10;i++){cx.fillStyle=mixc(top,hor,i/9);cx.fillRect(x,y+i*h*.07,w,h*.07+1);}
    for(const b of SKY){const bx=x+b.x*w,bw=b.w*w,bh=b.h*h;P(bx,y+h*.7-bh,bw,bh,'#080b14');
      for(let k=0;k<b.wl.length;k++)if(b.wl[k]<.55)P(bx+2+(k%3)*3,y+h*.7-bh+3+((k/3)|0)*5,2,2,'rgba(255,214,120,'+(.5+.3*Math.sin(t*.8+b.x*20+k)).toFixed(2)+')');}
    P(x,y+h*.7,w,h*.3,mixc('#1e4d28','#0d2614',dk*.6));
    P(x,y+h*.78,w,1,'rgba(255,255,255,.18)');P(x+w*.5,y+h*.7,1,h*.3,'rgba(255,255,255,.18)');
    cx.globalCompositeOperation='lighter';
    for(const fx of [.12,.88]){cx.fillStyle='rgba(255,246,208,.28)';cx.beginPath();cx.arc(x+w*fx,y+h*.62,h*.09,0,TAU);cx.fill();
      cx.fillStyle='rgba(255,246,208,.09)';cx.beginPath();cx.moveTo(x+w*fx-2,y+h*.62);cx.lineTo(x+w*fx+2,y+h*.62);cx.lineTo(x+w*.5+(fx<.5?w*.2:-w*.2)+w*.1,y+h);cx.lineTo(x+w*.5+(fx<.5?w*.2:-w*.2)-w*.1,y+h);cx.fill();}
    cx.globalCompositeOperation='source-over';
    for(let k=0;k<5;k++){const px=x+w*(.3+.4*((t*.04+k*.21)%1)),py=y+h*(.8+.035*k);P(px,py,2,3,['#d8e8ff','#ffd870','#ff8a70'][k%3]);}
    rain(x,y,w,h,t,Math.round(w*.5),.32);
    for(let k=0;k<5;k++){const dx=x+w*(.1+.18*k),dy=y+((t*9+k*31)%h);P(dx,dy,1,3,'rgba(220,235,255,.45)');}
    cx.restore();
  }
  function cabinet(g,x,y,w,h){
    const q=Math.round((h-16)/3);
    g.fillStyle='#2a1a10';g.fillRect(x,y,w,h);g.fillStyle='#0f141f';g.fillRect(x+3,y+3,w-6,h-6);
    for(let s=0;s<3;s++){const sy=y+8+s*q;g.fillStyle='#3a2616';g.fillRect(x+3,sy+q-4,w-6,3);
      for(let i=0;i<4;i++){const tx=x+10+i*Math.round((w-20)/4);g.fillStyle='#e8c24a';g.fillRect(tx+2,sy+q-14,4,8);g.fillRect(tx,sy+q-14,8,3);g.fillRect(tx+3,sy+q-6,2,2);g.fillStyle='#8a6a14';g.fillRect(tx+1,sy+q-7,6,3);}}
    g.fillStyle='rgba(255,255,255,.07)';g.fillRect(x+4,y+4,8,h-8);
  }
  function board(g,x,y,w,h){
    g.fillStyle='#2a1a10';g.fillRect(x-3,y-3,w+6,h+6);g.fillStyle='#1f4a35';g.fillRect(x,y,w,h);
    g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x+4,y+4,w-8,1);g.fillRect(x+4,y+h-5,w-8,1);g.fillRect(x+4,y+4,1,h-8);g.fillRect(x+w-5,y+4,1,h-8);g.fillRect(x+(w>>1),y+4,1,h-8);
    const r=rng(5);for(let i=0;i<10;i++){g.fillStyle=i<5?'#d83a3a':'#4a90ff';g.fillRect(x+10+((r()*(w-24))|0),y+10+((r()*(h-24))|0),4,4);}
    g.fillStyle='#ffe45e';for(let i=0;i<14;i++)g.fillRect(x+16+i*5,y+(h>>1)-14+Math.round(Math.sin(i*.5)*6),2,2);
  }
  function mkc(){const c=document.createElement('canvas');c.width=CW;c.height=CH;return c;}
  const bgFront=(()=>{
    const c=mkc(),g=c.getContext('2d');
    g.fillStyle='#18202e';g.fillRect(0,0,CW,CH);
    for(let x=0;x<CW;x+=30){g.fillStyle='#131a27';g.fillRect(x,0,2,176);g.fillStyle='rgba(255,255,255,.025)';g.fillRect(x+2,0,2,176);}
    g.fillStyle='#241a14';g.fillRect(0,118,CW,58);for(let x=0;x<CW;x+=40){g.fillStyle='#1b130e';g.fillRect(x,122,2,50);g.fillStyle='#32241a';g.fillRect(x+4,122,30,1);g.fillRect(x+4,171,30,1);}
    g.fillStyle='#120d0a';g.fillRect(0,174,CW,4);
    g.fillStyle='#2c1c26';g.fillRect(0,178,CW,92);for(let y=184;y<270;y+=12){g.fillStyle='rgba(0,0,0,.14)';g.fillRect(0,y,CW,3);}
    cabinet(g,22,50,110,126);board(g,352,58,108,82);
    g.fillStyle='#2a1a10';g.fillRect(140,60,26,32);g.fillStyle='#8a6a4a';g.fillRect(143,63,20,26);g.fillStyle='#d83a3a';g.fillRect(146,70,14,14);
    g.fillStyle='#2a1a10';g.fillRect(318,60,22,28);g.fillStyle='#8a6a4a';g.fillRect(321,63,16,22);g.fillStyle='#2f6fe4';g.fillRect(324,68,10,12);
    g.fillStyle='#e8e2d0';g.beginPath();g.arc(418,40,14,0,TAU);g.fill();g.strokeStyle='#2a1a10';g.lineWidth=3;g.beginPath();g.arc(418,40,14,0,TAU);g.stroke();
    g.fillStyle='#1a1210';g.fillRect(417,30,2,10);g.fillRect(417,39,8,2);
    g.fillStyle='#3a1c3a';g.fillRect(160,30,16,98);g.fillRect(304,30,16,98);g.fillStyle='#4a2a4a';for(let y=30;y<128;y+=6)g.fillRect(162,y,2,4),g.fillRect(306,y,2,4);
    g.fillStyle='#0d1119';g.fillRect(172,30,136,96);g.clearRect(176,34,128,88);
    return c;})();
  const deskFront=(()=>{
    const c=mkc(),g=c.getContext('2d');
    g.fillStyle='#4a2e1c';g.beginPath();g.moveTo(74,142);g.lineTo(406,142);g.lineTo(432,172);g.lineTo(48,172);g.fill();
    for(let i=0;i<14;i++){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(70+i*24,144,1,26);}
    g.fillStyle='#6a4a30';g.fillRect(48,172,384,3);g.fillStyle='#3a2216';g.fillRect(52,175,376,40);
    for(let i=0;i<3;i++){g.fillStyle='#2e1b11';g.fillRect(70+i*120,181,100,28);g.fillStyle='#8a6a30';g.fillRect(114+i*120,193,12,3);}
    g.fillStyle='#1d3a2a';g.fillRect(104,130,22,12);g.fillRect(112,126,6,6);
    g.fillStyle='#2a2a34';g.fillRect(318,150,54,8);g.fillStyle='#14141c';g.fillRect(324,152,42,4);
    g.fillStyle='#f4efe0';g.fillRect(240,148,36,12);g.fillStyle='#e2dccb';g.fillRect(244,146,36,12);
    g.fillStyle='#f4f4f4';g.fillRect(196,146,10,9);g.fillStyle='#4a2a1a';g.fillRect(197,147,8,3);g.fillRect(380,148,10,9);
    g.fillStyle='#e8c24a';g.fillRect(150,148,5,9);g.fillRect(148,148,9,3);g.fillStyle='#7a5a1a';g.fillRect(149,156,7,2);
    return c;})();
  const bgRev=(()=>{
    const c=mkc(),g=c.getContext('2d');
    g.fillStyle='#1a1f2c';g.fillRect(0,0,CW,CH);
    for(let x=0;x<CW;x+=34){g.fillStyle='#151a26';g.fillRect(x,0,2,190);}
    g.fillStyle='#2c1c26';g.fillRect(0,190,CW,80);
    g.fillStyle='#3a2616';g.fillRect(16,46,80,156);g.fillStyle='#2a1a0e';g.fillRect(22,52,68,144);g.fillStyle='#9ab8c0';g.fillRect(34,62,44,54);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(36,64,10,50);g.fillStyle='#c8a030';g.fillRect(80,126,5,5);
    g.fillStyle='#2a1a10';g.fillRect(200,36,200,140);g.fillStyle='#120d12';g.fillRect(205,41,190,130);
    const r=rng(11),bc=['#8a3030','#2a5a8a','#c8a040','#3a7a4a','#6a3a8a','#d0d0d0','#a05a2a'];
    for(let s=0;s<4;s++){g.fillStyle='#3a2616';g.fillRect(205,41+s*32+28,190,4);let x=209;while(x<390){const w=3+((r()*5)|0),h=14+((r()*12)|0);g.fillStyle=bc[(r()*7)|0];g.fillRect(x,41+s*32+28-h,w,h);x+=w+1;}}
    [[112,52],[134,52],[156,52]].forEach((p,i)=>{g.fillStyle='#2a1a10';g.fillRect(p[0],p[1],20,26);g.fillStyle='#8a6a4a';g.fillRect(p[0]+2,p[1]+2,16,22);g.fillStyle=['#d83a3a','#2f6fe4','#f2c21b'][i];g.fillRect(p[0]+5,p[1]+6,10,14);});
    g.fillStyle='#5a3a22';g.fillRect(424,150,30,40);g.fillStyle='#2f7a3a';for(let i=0;i<7;i++)g.fillRect(420+i*5,104+((i*13)%30),8,38);
    return c;})();
  const bgClose=(()=>{
    const c=mkc(),g=c.getContext('2d'),r=rng(3);
    g.fillStyle='#100c12';g.fillRect(0,0,CW,CH);
    for(let i=0;i<22;i++){g.fillStyle='rgba('+(200+((r()*55)|0))+','+(130+((r()*60)|0))+',70,'+(.05+r()*.12).toFixed(2)+')';g.beginPath();g.arc(r()*CW,20+r()*150,6+r()*22,0,TAU);g.fill();}
    g.fillStyle='rgba(60,40,80,.5)';g.fillRect(330,30,120,150);g.fillStyle='rgba(20,30,60,.7)';g.fillRect(340,40,100,130);
    g.fillStyle='#3a2216';g.fillRect(0,206,CW,64);g.fillStyle='#5a3a24';g.fillRect(0,206,CW,4);
    return c;})();
  function chairBack(cx_,y){P(cx_-46,y,92,60,'#2b2024');P(cx_-42,y+4,84,52,'#3a2a30');for(let i=0;i<5;i++)P(cx_-36+i*16,y+8,1,44,'rgba(0,0,0,.25)');P(cx_-46,y,92,3,'#4a3a40');}
  function officeA(T){
    winScene(176,34,128,88,T,.4);cx.drawImage(bgFront,0,0);
    cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,200,120,'+(.08+.02*Math.sin(T*2)).toFixed(3)+')';cx.beginPath();cx.arc(115,138,60,0,TAU);cx.fill();cx.globalCompositeOperation='source-over';
    const M=arms('mgr',T),A=arms('agt',T),Pl=arms('ply',T);
    chr('mgr','A'+M[0]+M[1]+'0',240,110+Math.round(Math.sin(T*2)*1),4,{mouth:mouth('mgr',T),blink:blinkAt(T,0),brow:brow('mgr',T)});
    cx.drawImage(deskFront,0,0);
    chr('agt','B'+A[0]+A[1]+'0',140,206-nodAmt('agt',T)+(inR(T,[[15.6,17]])?3:0),6);
    chr('ply','B'+Pl[0]+Pl[1]+'0',340,206-nodAmt('ply',T)+(inR(T,[[7,9.5],[19.6,22.5]])?3:0),6);
    chairBack(140,246);chairBack(340,246);
  }
  function officeB(T){
    cx.drawImage(bgRev,0,0);
    const A=arms('agt',T),M=arms('mgr',T);
    P(160,92,80,112,'#2b2024');P(166,98,68,100,'#3a2a30');P(290,92,80,112,'#2b2024');P(296,98,68,100,'#3a2a30');
    chr('ply','A'+(Math.floor(T*.4)%3===0?'ff':'dd')+'0',200,112-nodAmt('ply',T),5,{down:plyDown(T),blink:blinkAt(T,1),mouth:mouth('ply',T),sweat:sweat(T),brow:brow('ply',T)});
    chr('agt','A'+A[0]+A[1]+'0',330,110-nodAmt('agt',T),5,{mouth:mouth('agt',T),blink:blinkAt(T,2),brow:brow('agt',T)});
    P(0,206,CW,64,'#3a2216');P(0,206,CW,5,'#6a4a30');
    P(250,208,34,22,'#f4efe0');P(256,212,34,22,'#e8e2d0');P(180,214,14,12,'#f4f4f4');P(184,216,8,4,'#4a2a1a');P(336,218,14,12,'#f4f4f4');P(340,220,8,4,'#4a2a1a');
    chr('mgr','B'+M[0]+M[1]+'0',60,116+Math.round(Math.sin(T*2)*2)+Math.round(speaker(T)==='mgr'?Math.max(0,Math.sin(T*3))*2:0),9);
    cx.fillStyle='rgba(8,6,12,.45)';cx.fillRect(0,0,150,CH);
    cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,200,120,.05)';cx.fillRect(150,0,330,CH);cx.globalCompositeOperation='source-over';
  }
  function closeUp(role,T,drift){
    cx.drawImage(bgClose,0,0);
    const a=arms(role,T),pose='A'+a[0]+a[1]+'0',sc=10,o=role==='mgr'?{mouth:mouth('mgr',T),blink:blinkAt(T,0),brow:brow('mgr',T)}:
      role==='agt'?{mouth:mouth('agt',T),blink:blinkAt(T,2),brow:brow('agt',T)}:{down:plyDown(T),mouth:mouth('ply',T),blink:blinkAt(T,1),sweat:sweat(T),brow:brow('ply',T)};
    cx.save();cx.beginPath();cx.rect(0,0,CW,206);cx.clip();
    chr(role,pose,240+Math.round(Math.sin(T*.5)*drift),34+Math.round(Math.sin(T*2)*2)-Math.round(nodAmt(role,T)*1.5),sc,o);
    cx.restore();
    P(0,206,CW,64,'#3a2216');P(0,206,CW,5,'#6a4a30');P(150,214,34,24,'#f4efe0');P(330,222,16,14,'#f4f4f4');
    cx.globalCompositeOperation='lighter';cx.fillStyle='rgba(255,190,110,.10)';cx.beginPath();cx.moveTo(0,0);cx.lineTo(180,0);cx.lineTo(100,206);cx.lineTo(0,206);cx.fill();cx.globalCompositeOperation='source-over';
    cx.fillStyle='rgba(0,0,0,.35)';cx.fillRect(380,0,100,206);
  }
  function cutAt(t){for(const c of CUTS)if(t>=c[0]&&t<c[1])return c;return CUTS[CUTS.length-1];}
  function grain(){for(let k=0;k<60;k++){cx.fillStyle=Math.random()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.06)';cx.fillRect((Math.random()*CW)|0,(Math.random()*CH)|0,1,1);}}
  function cutFrame(now){
    if(!cutRunning)return;
    cutRaf=requestAnimationFrame(cutFrame);
    const dt=Math.min(.05,(now-(cutLast||now))/1000);cutLast=now;cutT+=dt;
    const t=cutT%LOOP,c=cutAt(t);
    cx.setTransform(1,0,0,1,0,0);cx.fillStyle='#000';cx.fillRect(0,0,CW,CH);
    if(c[2]==='A')officeA(cutT);else if(c[2]==='B')officeB(cutT);else if(c[2]==='M')closeUp('mgr',t,3);else if(c[2]==='G')closeUp('agt',t,3);else closeUp('ply',t,2);
    cx.strokeStyle='rgba(0,0,0,.09)';for(let k=0;k<6;k++)cx.strokeRect(k+.5,k+.5,CW-2*k-1,CH-2*k-1);
    grain();P(0,0,CW,14,'#000');P(0,CH-14,CW,14,'#000');
    let dip=0;if(t<.25)dip=1-t/.25;else if(t>LOOP-.25)dip=(t-(LOOP-.25))/.25;
    if(dip>.01)P(0,0,CW,CH,'rgba(0,0,0,'+dip.toFixed(2)+')');
  }
  function startCutscene(){if(!cv)return;cutRunning=true;cutT=0;cutLast=0;if(cutRaf)cancelAnimationFrame(cutRaf);cutRaf=requestAnimationFrame(cutFrame);}
  function stopCutscene(){cutRunning=false;if(cutRaf){cancelAnimationFrame(cutRaf);cutRaf=null;}}

  /* ─────────────────────────── ENGINE ─────────────────────────── */

  const AGENTS = {
    tough:    { key:"tough",    label:"Tough",    flex:0.30, greed:1.20, patience:2, desc:"Rarely budges and expects full value." },
    fair:     { key:"fair",     label:"Fair",     flex:0.60, greed:1.00, patience:4, desc:"Reasonable - a good offer usually lands." },
    friendly: { key:"friendly", label:"Friendly", flex:0.85, greed:0.90, patience:5, desc:"Easy to work with, but knows the market." },
    greedy:   { key:"greedy",   label:"Greedy",   flex:0.40, greed:1.30, patience:2, desc:"Wants every penny. Will walk away quickly." },
    patient:  { key:"patient",  label:"Patient",  flex:0.75, greed:1.05, patience:6, desc:"Will wait for the right offer." }
  };
  const ROLE_LIST = [
    { key:"crucial",   label:"Crucial",   weight:1.00 },
    { key:"important", label:"Important", weight:0.78 },
    { key:"rotation",  label:"Rotation",  weight:0.55 },
    { key:"sporadic",  label:"Sporadic",  weight:0.32 }
  ];
  const ROLE_INDEX = { crucial:0, important:1, rotation:2, sporadic:3 };

  function esc(s) {
    if (typeof mcEsc === "function") return mcEsc(s);
    if (typeof escapeHtml === "function") return escapeHtml(s);
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  }
  function num(v, d) {
    if (typeof mcNum === "function") return mcNum(v, d);
    const n = parseFloat(v); return isFinite(n) ? n : (d || 0);
  }
  function money(v) {
    if (typeof mcMoney === "function") return mcMoney(v);
    if (typeof formatMoney === "function") return formatMoney(v);
    return "£" + v + "M";
  }
  function ovrOf(p) {
    if (typeof mcOvr === "function") return mcOvr(p);
    if (typeof calculateOverall === "function") return Math.round(calculateOverall(p, p && p.role || "attacker"));
    return 60;
  }
  function teamAvgOvr(c) {
    if (!c || !Array.isArray(c.squad) || !c.squad.length) return 65;
    let s = 0, n = 0;
    for (const p of c.squad) { if (p) { s += ovrOf(p); n++; } }
    return n ? s / n : 65;
  }
  function currentWage(p) {
    if (p && typeof p.wage === "number" && p.wage > 0) return p.wage;
    return Math.round(Math.pow(ovrOf(p), 2) * 6 / 100) * 100;
  }
  function budgetOf(c) { return (c && typeof c.budget === "number") ? c.budget : 0; }

  function pickAgent(p) {
    const keys = Object.keys(AGENTS);
    let h = 2166136261;
    const s = String(p && p.name || "x");
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return AGENTS[keys[h % keys.length]];
  }
  function askingFeeFor(p, agent) {
    if (typeof mcValue === "function") {
      return Math.max(0.5, Math.round(mcValue(p) * agent.greed * 10) / 10);
    }
    const ovr = ovrOf(p);
    return Math.max(0.5, Math.round(Math.pow(ovr - 40, 2) * 0.15 * agent.greed * 10) / 10);
  }
  function wageDemandFor(p, roleKey, career) {
    const ovr = ovrOf(p);
    const role = ROLE_LIST[ROLE_INDEX[roleKey] == null ? 2 : ROLE_INDEX[roleKey]];
    const avg = teamAvgOvr(career);
    const bonus = ovr >= avg ? 1 + Math.min(0.5, (ovr - avg) * 0.04) : 0.85;
    let base = Math.pow(ovr, 2) * 8;
    base *= role.weight * 1.4 * bonus;
    const cur = currentWage(p);
    base = Math.max(base, cur * 1.15);
    return Math.round(base / 100) * 100;
  }
  function bonusDemandFor(p, fee, agent, kind) {
    if (kind === "renewal") return 0;
    if (kind === "freeAgent") {
      const ovr = ovrOf(p);
      return Math.round(Math.pow(ovr, 2) * 25 * agent.greed) / 100 / 100; // in £M-ish
    }
    return Math.round(fee * 0.15 * agent.greed * 100) / 100;
  }
  function roleDemandFor(p, c) {
    const ovr = ovrOf(p), avg = teamAvgOvr(c);
    if (ovr >= avg + 5) return "crucial";
    if (ovr >= avg + 1) return "important";
    if (ovr >= avg - 4) return "rotation";
    return "sporadic";
  }
  function isOnCooldown(c, p) {
    if (!c || !p || !c.negCooldowns) return false;
    const until = c.negCooldowns[p.name];
    return until && Date.now() < until;
  }
  function cooldownRemaining(c, p) {
    if (!c || !p || !c.negCooldowns) return 0;
    const until = c.negCooldowns[p.name];
    return Math.max(0, (until || 0) - Date.now());
  }
  function setCooldown(c, p, ms) {
    if (!c || !p) return;
    if (!c.negCooldowns) c.negCooldowns = {};
    c.negCooldowns[p.name] = Date.now() + ms;
  }

  let NEG = null, overlay = null;

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.id = "negotiationOverlay";
    overlay.className = "modalOverlay negotiationOverlay";
    overlay.style.cssText = "z-index:1500;display:none;padding:0;overflow:hidden";
    overlay.innerHTML =
      '<canvas id="negCutCanvas" width="480" height="270" style="position:absolute;inset:0;width:100vw;height:100vh;object-fit:cover;image-rendering:pixelated;background:#000;pointer-events:none"></canvas>' +
      '<div class="negScrim" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 40%, rgba(4,8,16,0.35), rgba(4,8,16,0.88) 80%);pointer-events:none"></div>' +
      '<div class="negPanelWrap" id="negPanelWrap"></div>';
    document.body.appendChild(overlay);
    cv = document.getElementById("negCutCanvas");
    cx = cv.getContext("2d");
    cx.imageSmoothingEnabled = false;
  }

  function openUI() {
    ensureOverlay();
    overlay.style.display = "flex";
    startCutscene();
    renderPanel();
    if (typeof uiRefreshFocus === "function") uiRefreshFocus();
  }
  function closeUI() {
    if (overlay) overlay.style.display = "none";
    stopCutscene();
  }

  function renderPanel() {
    const wrap = document.getElementById("negPanelWrap");
    if (!wrap || !NEG) return;
    const p = NEG.player, agent = NEG.agent, ovr = ovrOf(p);
    let html = '<div class="negHead">' +
      '<div class="negHeadLabel">NEGOTIATION · ' + esc(NEG.sellerClub || "Free Agent") + '</div>' +
      '<div class="negHeadName">' + esc(p.name) + '</div>' +
      '<div class="negHeadMeta">OVR ' + ovr + ' · ' + esc((p.role || "player").toUpperCase()) +
        ' · AGE ' + (p.age || "?") + ' · Agent: ' + esc(agent.label) + '</div>' +
      '</div>';
    if (NEG.stage === "fee") html += renderFeeStage();
    else if (NEG.stage === "contract") html += renderContractStage();
    else html += renderDoneStage();
    html += '<div class="negMsg" id="negMsg">' + esc(NEG.lastMsg || "") + '</div>';
    wrap.innerHTML = html;
    if (typeof uiRefreshFocus === "function") uiRefreshFocus();
  }

  function renderFeeStage() {
    const ask = NEG.askingPrice;
    const cur = NEG.currentOffer || ask;
    const curM = cur.toFixed(1);
    const askM = ask.toFixed(1);
    const maxM = Math.max(ask * 1.6, cur * 1.2, 10).toFixed(1);
    const budget = budgetOf(NEG.career);
    const canAfford = budget >= cur;
    const log = (NEG.log || []).slice(-4).reverse().map(l => '<div class="negLogLine">' + esc(l) + '</div>').join("");
    return '<div class="negSection">' +
      '<div class="negSectionTitle">Transfer Fee</div>' +
      '<div class="negRow"><span>Asking price</span><b>' + money(ask) + '</b></div>' +
      '<div class="negRow"><span>Your budget</span><b class="' + (canAfford ? "good" : "bad") + '">' + money(budget) + '</b></div>' +
      '<div class="negRow"><span>Last offer</span><b>' + (NEG.lastOffer ? money(NEG.lastOffer) : "—") + '</b></div>' +
      '<div class="negSectionTitle" style="margin-top:12px">Your Offer</div>' +
      '<div class="negSliderRow">' +
        '<input id="negFeeSlider" type="range" min="0" max="' + maxM + '" step="0.1" value="' + curM + '" oninput="Negotiation._feeChange(this.value)">' +
        '<div class="negSliderVal" id="negFeeVal">' + money(cur) + '</div>' +
      '</div>' +
      log +
      '<div class="negActions">' +
        '<button class="negBtn negBtnPrimary" onclick="Negotiation._submitFee()">Submit Offer</button>' +
        '<button class="negBtn" onclick="Negotiation._acceptAsking()">Accept Asking (' + money(ask) + ')</button>' +
        '<button class="negBtn negBtnDanger" onclick="Negotiation._walkAway()">Walk Away</button>' +
      '</div></div>';
  }

  function renderContractStage() {
    const isRenewal = NEG.kind === "renewal";
    const wageK = Math.round(NEG.wage / 1000);
    const bonusM = NEG.signingBonus || 0;
    const demandWageK = Math.round(wageDemandFor(NEG.player, NEG.role, NEG.career) / 1000);
    const roleNeed = roleDemandFor(NEG.player, NEG.career);
    const roleOpts = ROLE_LIST.map(r =>
      '<option value="' + r.key + '"' + (r.key === NEG.role ? " selected" : "") + '>' + r.label + '</option>').join('');
    const budget = budgetOf(NEG.career);
    const feeM = NEG.fee || 0;
    const remaining = budget - feeM - bonusM;
    const log = (NEG.log || []).slice(-4).reverse().map(l => '<div class="negLogLine">' + esc(l) + '</div>').join("");
    return '<div class="negSection">' +
      '<div class="negSectionTitle">Contract Terms</div>' +
      (isRenewal
        ? '<div class="negRow"><span>Current wage</span><b>£' +
  Math.round(currentWage(NEG.player) / 1000) + 'K/wk</b></div>'
        : '<div class="negRow"><span>Fee agreed</span><b>' + money(feeM) + '</b></div>') +
      '<div class="negRow"><span>Budget left</span><b class="' + (remaining >= 0 ? "good" : "bad") + '">' + money(remaining) + '</b></div>' +
      '<div class="negRow"><span>Wage demand</span><b>£' + demandWageK + 'K/wk</b></div>' +
      '<div class="negRow"><span>Role demand</span><b>' + ROLE_LIST[ROLE_INDEX[roleNeed] == null ? 2 : ROLE_INDEX[roleNeed]].label + '</b></div>' +
      '<div class="negSectionTitle" style="margin-top:12px">Weekly Wage</div>' +
      '<div class="negSliderRow">' +
        '<input id="negWageSlider" type="range" min="1" max="300" step="1" value="' + wageK + '" oninput="Negotiation._wageChange(this.value)">' +
        '<div class="negSliderVal" id="negWageVal">£' + wageK + 'K/wk</div>' +
      '</div>' +
      (!isRenewal
        ? '<div class="negSectionTitle" style="margin-top:12px">Signing Bonus</div>' +
          '<div class="negSliderRow">' +
            '<input id="negBonusSlider" type="range" min="0" max="' + Math.max(1, Math.ceil(bonusM * 2 + 0.5)) + '" step="0.1" value="' + bonusM.toFixed(1) + '" oninput="Negotiation._bonusChange(this.value)">' +
            '<div class="negSliderVal" id="negBonusVal">' + money(bonusM) + '</div>' +
          '</div>'
        : '') +
      '<div class="negSectionTitle" style="margin-top:12px">Contract Length</div>' +
      '<select id="negLenSelect" class="negSelect" onchange="Negotiation._lenChange(this.value)">' +
        [1,2,3,4,5].map(y => '<option value="' + y + '"' + (y === NEG.length ? " selected" : "") + '>' + y + ' year' + (y > 1 ? "s" : "") + '</option>').join('') +
      '</select>' +
      '<div class="negSectionTitle" style="margin-top:12px">Squad Role</div>' +
      '<select id="negRoleSelect" class="negSelect" onchange="Negotiation._roleChange(this.value)">' + roleOpts + '</select>' +
      log +
      '<div class="negActions">' +
        '<button class="negBtn negBtnPrimary" onclick="Negotiation._submitContract()">Submit Terms</button>' +
        '<button class="negBtn" onclick="Negotiation._acceptContractDemands()">Accept Their Demands</button>' +
        '<button class="negBtn negBtnDanger" onclick="Negotiation._walkAway()">Walk Away</button>' +
      '</div></div>';
  }

  function renderDoneStage() {
    return '<div class="negSection">' +
      '<div class="negSectionTitle">Deal Complete</div>' +
      '<p class="negHint" style="color:#7ee787">' + esc(NEG.lastMsg || "") + '</p>' +
      '<div class="negActions"><button class="negBtn negBtnPrimary" onclick="Negotiation._close()">Done</button></div>' +
      '</div>';
  }

  function feeChange(v) { const el = document.getElementById("negFeeVal"); if (el) el.textContent = money(Number(v)); }
  function wageChange(v) { const el = document.getElementById("negWageVal"); if (el) el.textContent = "£" + v + "K/wk"; }
  function bonusChange(v) { const el = document.getElementById("negBonusVal"); if (el) el.textContent = money(Number(v)); }

  function submitFee() {
    if (!NEG) return;
    const el = document.getElementById("negFeeSlider");
    if (!el) return;
    const offer = Math.round(parseFloat(el.value) * 10) / 10;
    if (!isFinite(offer) || offer <= 0) { NEG.lastMsg = "Enter a valid offer."; renderPanel(); return; }
    if (offer > budgetOf(NEG.career)) { NEG.lastMsg = "You cannot afford that offer."; renderPanel(); return; }
    NEG.log = NEG.log || [];
    NEG.log.push("You offered " + money(offer) + ".");
    NEG.lastOffer = offer;

    const ask = NEG.askingPrice;
    if (offer >= ask * 0.98) {
      NEG.fee = offer;
      NEG.log.push("The club accepted.");
      NEG.lastMsg = "Fee agreed at " + money(offer) + ".";
      moveToContract();
      return;
    }
    const gap = ask - offer;
    const counter = Math.min(ask, Math.round((offer + gap * (0.55 + (1 - NEG.agent.flex) * 0.2)) * 10) / 10);
    NEG.counterCount = (NEG.counterCount || 0) + 1;
    NEG.askingPrice = counter;
    NEG.currentOffer = counter;
    NEG.log.push("They counter-offered " + money(counter) + ".");

    if (NEG.counterCount >= NEG.agent.patience) {
      NEG.stage = "done";
      NEG.lastMsg = "The selling club has ended talks - your offer was too far off.";
      setCooldown(NEG.career, NEG.player, 1000 * 60 * 60 * 24 * 7);
      persist();
      renderPanel();
      return;
    }
    NEG.lastMsg = "They want " + money(counter) + ". Submit a better offer.";
    renderPanel();
  }

  function acceptAsking() {
    if (!NEG) return;
    if (NEG.askingPrice > budgetOf(NEG.career)) { NEG.lastMsg = "You cannot afford the asking price."; renderPanel(); return; }
    NEG.fee = NEG.askingPrice;
    NEG.log = NEG.log || [];
    NEG.log.push("You met the asking price of " + money(NEG.fee) + ".");
    NEG.lastMsg = "Fee agreed.";
    moveToContract();
  }

  function moveToContract() {
    NEG.stage = "contract";
    NEG.counterCount = 0;
    const role = roleDemandFor(NEG.player, NEG.career);
    NEG.role = role;
    NEG.wage = wageDemandFor(NEG.player, role, NEG.career);
    NEG.signingBonus = NEG.kind === "renewal" ? 0 : Math.max(0.1, bonusDemandFor(NEG.player, NEG.fee || 0, NEG.agent, NEG.kind));
    NEG.length = ovrOf(NEG.player) >= 82 ? 4 : (NEG.player.age >= 32 ? 2 : 3);
    NEG.lastMsg = "Now discuss the player's personal terms.";
    renderPanel();
  }

  function submitContract() {
    if (!NEG) return;
    const wageEl = document.getElementById("negWageSlider");
    const bonusEl = document.getElementById("negBonusSlider");
    const lenEl = document.getElementById("negLenSelect");
    const roleEl = document.getElementById("negRoleSelect");
    if (!wageEl || !lenEl || !roleEl) return;
    const wage = parseInt(wageEl.value, 10) * 1000;
    const bonus = NEG.kind === "renewal" ? 0 : Number(bonusEl ? bonusEl.value : 0);
    const len = parseInt(lenEl.value, 10);
    const role = roleEl.value;
    NEG.wage = wage; NEG.signingBonus = bonus; NEG.length = len; NEG.role = role;
    NEG.log = NEG.log || [];
    NEG.log.push("You offered £" + Math.round(wage / 1000) + "K/wk · " + len + "y · " + ROLE_LIST[ROLE_INDEX[role] == null ? 2 : ROLE_INDEX[role]].label + ".");

    const left = budgetOf(NEG.career) - (NEG.fee || 0) - bonus;
    if (left < 0) { NEG.lastMsg = "That signing bonus would put you over budget."; renderPanel(); return; }

    const demandWage = wageDemandFor(NEG.player, role, NEG.career);
    const roleNeed = ROLE_INDEX[roleDemandFor(NEG.player, NEG.career)] ?? 2;
    const roleOffered = ROLE_INDEX[role] ?? 2;
    const wageOk = wage >= demandWage * (1 - NEG.agent.flex * 0.12);
    const roleOk = roleOffered <= roleNeed;
    const lengthOk = len >= 2;

    if (wageOk && roleOk && lengthOk) {
  NEG.stage = "done";
  NEG.lastMsg = NEG.deferred
    ? "Deal agreed! " + NEG.player.name + " will join when the transfer window opens."
    : "Deal agreed! " + NEG.player.name + " has signed for " + len + " year" + (len > 1 ? "s" : "") + ".";
  finalize();
  return;
}

    NEG.counterCount = (NEG.counterCount || 0) + 1;
    if (NEG.counterCount >= NEG.agent.patience) {
      NEG.stage = "done";
      NEG.lastMsg = "The player has walked away from talks.";
      NEG.log.push("They refused to continue negotiating.");
      setCooldown(NEG.career, NEG.player, 1000 * 60 * 60 * 24 * 7);
      persist();
      renderPanel();
      return;
    }

    if (!wageOk) { NEG.lastMsg = "They want higher wages."; NEG.log.push("The agent demands at least £" + Math.round(demandWage / 1000) + "K/wk."); }
    else if (!roleOk) { NEG.lastMsg = "They insist on a bigger role."; NEG.log.push("They want at least a " + ROLE_LIST[roleNeed].label + " role."); }
    else { NEG.lastMsg = "They want a longer contract."; NEG.log.push("They want a deal of at least 2 years."); }
    renderPanel();
  }

  function acceptContractDemands() {
    if (!NEG) return;
    const role = roleDemandFor(NEG.player, NEG.career);
    NEG.role = role;
    NEG.wage = wageDemandFor(NEG.player, role, NEG.career);
    NEG.signingBonus = NEG.kind === "renewal" ? 0 : Math.max(0.1, bonusDemandFor(NEG.player, NEG.fee || 0, NEG.agent, NEG.kind));
    NEG.length = ovrOf(NEG.player) >= 82 ? 4 : 3;
    const left = budgetOf(NEG.career) - (NEG.fee || 0) - NEG.signingBonus;
    if (left < 0) { NEG.lastMsg = "Those demands would put you over budget."; renderPanel(); return; }
    NEG.stage = "done";
NEG.lastMsg = NEG.deferred
  ? "Deal agreed on their terms! " + NEG.player.name + " will join when the window opens."
  : "Deal agreed on their terms!";
finalize();
  }

  function finalize() {
  const c = NEG.career, p = NEG.player;
  const fee = NEG.fee || 0, bonus = NEG.signingBonus || 0;
  const wage = NEG.wage || 0, len = NEG.length || 3, role = NEG.role || "rotation";

  if (NEG.kind === "renewal") {
    p.wage = wage;
    p.contractEnd = num(c.season, 1) + len;
    p.squadRole = role;
  } else if (NEG.deferred) {
    // Queue the transfer; the player joins when the window opens.
    if (!Array.isArray(c.pendingDeals)) c.pendingDeals = [];
    c.pendingDeals.push({
      id: "pd" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36),
      name: p.name,
      role: p.role,
      fromClub: NEG.sellerClub || "",
      fee: fee,
      wage: wage,
      signingBonus: bonus,
      length: len,
      squadRole: role,
      player: JSON.parse(JSON.stringify(p)),
      agreedSeason: num(c.season, 1),
      agreedDay: num(c.calDay, 1)
    });
    c.budget = Math.max(0, Math.round((num(c.budget, 0) - fee - bonus) * 10) / 10);
    if (typeof mcLog === "function") {
      mcLog(c, "Agreed " + p.name + " from " + (NEG.sellerClub || "free agent") +
        " for " + (fee > 0 ? money(fee) : "free") +
        " - the deal completes when the transfer window opens.");
    }
  } else {
    c.budget = Math.max(0, Math.round((num(c.budget, 0) - fee - bonus) * 10) / 10);
    p.wage = wage;
    p.contractEnd = num(c.season, 1) + len;
    p.squadRole = role;
    p.acquiredFor = fee;
    p.acquiredSeason = num(c.season, 1);
    if (!Array.isArray(c.squad)) c.squad = [];
    c.squad.push(p);
    if (typeof mcLog === "function") {
      mcLog(c, "Signed " + p.name + " for " + (fee > 0 ? money(fee) : "free") +
        " on £" + Math.round(wage / 1000) + "K/wk.");
    }
    if (typeof mcNewsPush === "function") {
      try { mcNewsPush(c, "signing", { club: c.clubName, player: p.name }); } catch (e) {}
    }
  }
  persist();
  renderPanel();
}

  function walkAway() {
    if (!NEG) return;
    NEG.stage = "done";
    NEG.lastMsg = "You walked away from the negotiations.";
    setCooldown(NEG.career, NEG.player, 1000 * 60 * 60 * 24 * 3);
    persist();
    renderPanel();
  }

  function persist() {
    if (typeof saveMyClubData === "function") saveMyClubData();
    if (typeof mcSave === "function") { try { mcSave(); } catch (e) {} }
  }

  function closePanel() {
    closeUI();
    const cb = NEG && NEG.onComplete;
    NEG = null;
    if (cb) { try { cb(); } catch (e) {} }
  }

  function start(opts) {
    if (!opts || !opts.player || !opts.career) return null;
    if (isOnCooldown(opts.career, opts.player)) {
      const days = Math.ceil(cooldownRemaining(opts.career, opts.player) / (1000 * 60 * 60 * 24));
      alert("You cannot negotiate with " + opts.player.name + " for another " + days + " day" + (days > 1 ? "s" : "") + ".");
      return null;
    }
    const agent = pickAgent(opts.player);
    const kind = opts.kind || "transfer";
    const asking = kind === "transfer" ? askingFeeFor(opts.player, agent) : 0;
    NEG = {
      kind, career: opts.career, player: opts.player,
      sellerClub: opts.sellerClub || "",
      agent,
      deferred: opts.deferred === true,
      stage: kind === "transfer" ? "fee" : "contract",
      askingPrice: asking,
      currentOffer: asking,
      lastOffer: 0,
      counterCount: 0,
      fee: kind === "transfer" ? null : 0,
      wage: 0, signingBonus: 0, length: 3, role: "rotation",
      log: [],
      lastMsg: "",
      onComplete: opts.onComplete || null
    };
    if (kind !== "transfer") {
      const role = roleDemandFor(opts.player, opts.career);
      NEG.role = role;
      NEG.wage = wageDemandFor(opts.player, role, opts.career);
      NEG.signingBonus = kind === "renewal" ? 0 : Math.max(0.1, bonusDemandFor(opts.player, 0, agent, kind));
      NEG.length = ovrOf(opts.player) >= 82 ? 4 : 3;
    }
    openUI();
    return NEG;
  }

  window.Negotiation = {
    start: start,
    _feeChange: feeChange,
    _wageChange: wageChange,
    _bonusChange: bonusChange,
    _lenChange: function(v){ if (NEG) NEG.length = parseInt(v, 10); },
    _roleChange: function(v){ if (NEG) NEG.role = v; },
    _submitFee: submitFee,
    _acceptAsking: acceptAsking,
    _submitContract: submitContract,
    _acceptContractDemands: acceptContractDemands,
    _walkAway: walkAway,
    _close: closePanel,
    wageDemandFor: wageDemandFor,
    roleDemandFor: roleDemandFor,
    currentWage: currentWage,
    isOnCooldown: isOnCooldown
  };
})();