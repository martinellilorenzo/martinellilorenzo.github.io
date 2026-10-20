(() => {
  const panel=document.querySelector('.observational-panel'),canvas=panel.querySelector('.pixel-flux-plot'),ctx=canvas.getContext('2d');
  canvas.width=824;canvas.height=610;
  let rng=44;const random=()=>{rng=(1664525*rng+1013904223)>>>0;return rng/4294967296;};
  const cells=Array.from({length:100},(_,i)=>{const x=i%10,y=Math.floor(i/10);return {base:100+2420*Math.exp(-((x-5.1)**2+(y-4.9)**2)/(2*.95**2))+570*Math.exp(-((x-.1)**2+(y-7.3)**2)/1.2),noise:0,target:0};});
  const stops=[[17,28,35],[32,60,78],[62,112,137],[116,174,190],[232,221,171]];
  function color(value){const t=Math.max(0,Math.min(3.999,value/2700*4)),i=Math.floor(t),f=t-i;return `rgb(${stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*f)).join(',')})`;}
  const lightcurve=panel.querySelector('.lightcurve-animation');
  let reveal=null,elapsed=0,sample=0;
  const cadenceSeconds=58.8489,spanDays=25,totalSamples=Math.floor(spanDays*86400/cadenceSeconds);
  function connectLightcurve(){reveal=lightcurve.querySelector('#lightcurve-reveal');if(reveal)reveal.setAttribute('width',String(reduced.matches?622:622*sample/totalSamples));}
  lightcurve.addEventListener('load',connectLightcurve);
  function draw(){
    ctx.clearRect(0,0,824,610);ctx.save();ctx.translate(24,0);const left=115,top=55,size=45;
    cells.forEach((c,i)=>{const x=i%10,y=Math.floor(i/10);ctx.fillStyle=color(c.base*(1+c.noise+brightness*Math.exp(-((i%10-5.1)**2+(Math.floor(i/10)-4.9)**2)/5)));ctx.fillRect(left+x*size,top+y*size,size,size);});
    // Aperture outlines stay fixed: only the measured flux changes.
    ctx.strokeStyle='#a5ced9';ctx.lineWidth=1.2;for(let y=4;y<=6;y++)for(let x=4;x<=6;x++){ctx.strokeRect(left+x*size+.5,top+y*size+.5,size-1,size-1);}
    ctx.strokeStyle='#587583';ctx.strokeRect(left,top,450,450);
    ctx.fillStyle='#e7d5a3';ctx.font='34px Inter, Arial, sans-serif';ctx.textAlign='left';ctx.fillText(window.siteText('Star'),left+285,top+92);
    const ax=left+296,ay=top+106,bx=left+(5.1+.5)*size,by=top+(4.9+.5)*size;
    ctx.strokeStyle='#e7d5a3';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    const angle=Math.atan2(by-ay,bx-ax);ctx.beginPath();ctx.moveTo(bx-9*Math.cos(angle-.45),by-9*Math.sin(angle-.45));ctx.lineTo(bx,by);ctx.lineTo(bx-9*Math.cos(angle+.45),by-9*Math.sin(angle+.45));ctx.stroke();
    ctx.fillStyle='#b7c8ce';ctx.font='34px Inter, Arial, sans-serif';ctx.textAlign='left';ctx.fillText(`t = ${(sample*cadenceSeconds/86400).toFixed(5)} ${window.siteLanguage?.()==='it'?'giorni':'days'}`,left,37);
    ctx.fillStyle='#b7c8ce';ctx.font='34px Inter, Arial, sans-serif';ctx.textAlign='center';
    for(let x=0;x<10;x+=2)ctx.fillText(660+x,left+(x+.5)*size,top+480);
    ctx.fillText(window.siteText('Pixel column'),left+225,top+525);ctx.textAlign='right';for(let y=0;y<10;y+=2)ctx.fillText(343-y,left-15,top+(y+.6)*size);
    ctx.save();ctx.translate(16,top+225);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillText(window.siteText('Pixel row'),0,0);ctx.restore();
    for(let j=0;j<450;j++){ctx.fillStyle=color((449-j)/449*2700);ctx.fillRect(605,top+j,20,1);}
    ctx.fillStyle='#b7c8ce';ctx.textAlign='left';ctx.font='34px Inter, Arial, sans-serif';for(const v of [0,500,1000,1500,2000,2500])ctx.fillText(v,636,top+450-v/2700*450+5);
    ctx.save();ctx.translate(760,top+225);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.fillText(window.siteText('Flux (electrons / s)'),0,0);ctx.restore();ctx.restore();
  }
  let last=0,next=0,visible=false,targetBrightness=0,brightness=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;},{threshold:.05}).observe(panel);
  function tick(time){
    const active=visible&&!panel.hidden&&!document.hidden&&!reduced.matches;
    if(active){
      elapsed+=last?Math.min(time-last,80):0;
      sample=Math.floor(Math.min(1,elapsed/5000)*totalSamples);
      if(!reveal)connectLightcurve();
      if(reveal)reveal.setAttribute('width',String(622*sample/totalSamples));
      if(time>next){cells.forEach(c=>c.target=(random()-.5)*.02);targetBrightness=(random()-.5)*.10;next=time+850;}
      const f=1-Math.exp(-Math.min(time-last,80)/450);cells.forEach(c=>c.noise+=(c.target-c.noise)*f);brightness+=(targetBrightness-brightness)*f;draw();
      if(elapsed>=5000)elapsed=0;
    }
    last=time;requestAnimationFrame(tick);
  }
  document.addEventListener('languagechange',draw);
  reduced.addEventListener('change',()=>{elapsed=0;sample=reduced.matches?totalSamples:0;connectLightcurve();draw();});

  sample=reduced.matches?totalSamples:0;connectLightcurve();draw();requestAnimationFrame(tick);
})();
