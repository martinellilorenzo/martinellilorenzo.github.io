(() => {
  'use strict';
  const figure = document.querySelector('[data-stellar-oscillation]');
  if (!figure) return;
  const still = figure.querySelector('.oscillation-still');
  const canvas = figure.querySelector('canvas:not(.solar-surface-canvas)');
  const contours = figure.querySelector('.oscillation-contours');
  const controls = figure.querySelector('.oscillation-controls');
  const button = controls.querySelector('button');
  const tabs = [...figure.querySelectorAll('[role=tab]')];
  const label = figure.querySelector('.oscillation-mode-label');
  const speed = figure.querySelector('.oscillation-speed');
  const stage = figure.querySelector('.oscillation-stage');
  const modes = {
    l0m0: {speed:114,l:0,n:22,m:0,still:'assets/profile242-l0m0-still.webp?v=2',field:'assets/profile242-l0m0-field.png?v=2'},
    l1m0: {speed:112,l:1,n:22,m:0,still:'assets/profile242-l1m0-still.webp?v=2',field:'assets/profile242-l1m0-field.png?v=2'},
    l2m0: {speed:114,l:2,n:21,m:0,still:'assets/profile242-l2m0-still.webp?v=2',field:'assets/profile242-l2m0-field.png?v=2'},
    l1m1: {speed:112,l:1,n:22,m:1,still:'assets/profile242-l1m1-still.webp?v=2',field:'assets/profile242-l1m1-field.png?v=2'},
    l2m1: {speed:114,l:2,n:21,m:1,still:'assets/profile242-l2m1-still.webp?v=2',field:'assets/profile242-l2m1-field.png?v=2'},
    l2m2: {speed:114,l:2,n:21,m:2,still:'assets/profile242-l2m2-still.webp?v=2',field:'assets/profile242-l2m2-field.png?v=2'}
  };
  let rotationEnabled=true;
  const rotationToggle=figure.querySelector('.rotation-toggle');
  let selected = 'surface', travelling = 1, lastDegree = 'l1';
  const submenu=figure.querySelector('.degree-submenu');
  const asterTab=figure.querySelector('#mode-asteroseismic');
  const multipletPanel=figure.querySelector('.multiplet-panel');let spectrum;
  fetch('assets/multiplet-data.json?v=2').then(r=>r.json()).then(data=>{spectrum=new window.MultipletSpectrum(figure.querySelector('.multiplet-spectrum'),data);describeMode();});
  const surfaceCaption=figure.querySelector('.surface-caption');
  const oscillationCaption=figure.querySelector('.oscillation-caption');
  const patterns=figure.querySelector('.oscillation-patterns');
  const observations=figure.querySelector('.observational-panel');
  const surfaceCanvas=figure.querySelector('.solar-surface-canvas');let surfaceRenderer;
  const patternButtons = [...figure.querySelectorAll('[data-pattern]')];
  const fieldKey = () => selected==='surface'?'surface':selected==='l0'?'l0m0':selected+'m'+Math.abs(travelling);
  figure.querySelector('.oscillation-patterns').hidden = false;
  const cache = new Map();
  figure.querySelector('.oscillation-mode-tabs').hidden = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, visible = false, ready = false, frame = null;
  let phase = 0, previous = null, lastPaint = 0;
  let source, pixels, ctx;
  const palette = [[73,159,236],[23,33,58],[255,133,141]];
  const lookup = new Uint8Array(256 * 3);
  for (let value = 0; value < 256; value++) {
    const signed = value/255*2-1;
    const to = signed<0 ? palette[0] : palette[2];
    for (let channel=0;channel<3;channel++)
      lookup[value*3+channel]=Math.round(palette[1][channel]+Math.abs(signed)*(to[channel]-palette[1][channel]));
  }
  function draw() {
    if(selected==='observations')return;
    if(selected==='surface'){surfaceRenderer.draw(phase);return;}

    const c = Math.cos(phase), s = Math.sign(travelling)*Math.sin(phase);
    // Re[Y_l^m exp(-i omega t)] = C cos(phase) + sign(m) S sin(phase).
    for (let i=0;i<source.length;i+=4) {
      const displacement=(source[i]/255*2-1)*c+(source[i+1]/255*2-1)*s;
      const key=Math.round(Math.max(0,Math.min(255,(displacement+1)*127.5)))*3;
      pixels.data[i]=lookup[key];pixels.data[i+1]=lookup[key+1];pixels.data[i+2]=lookup[key+2];pixels.data[i+3]=source[i+3];
    }
    ctx.putImageData(pixels,0,0);
  }
  function active() { return selected!=='observations' && ready && visible && !paused && !document.hidden && !motion.matches; }
  function tick(time) {
    frame = null;
    if (!active()) { previous = null; return; }
    if(previous!==null){
      phase+=Math.min(time-previous,100)*Math.PI*2/(selected==='surface'?3500:3000);
      if(selected!=='surface')phase%=Math.PI*2;
    }
    previous = time;
    if (time-lastPaint >= 1000/24) { draw(); lastPaint = time; }
    frame = requestAnimationFrame(tick);
  }
  function update() {
    if(frame!==null){cancelAnimationFrame(frame);frame=null;}
    previous=null;
    let nonrotating=figure.querySelector('.nonrotating-description');
    if(!nonrotating){nonrotating=document.createElement('span');nonrotating.className='mode-description nonrotating-description';figure.querySelector('.mode-description-panel').append(nonrotating);}
    nonrotating.hidden=rotationEnabled||!selected.startsWith('l');
    if(!rotationEnabled){figure.querySelectorAll('[data-mode-description]').forEach(note=>note.hidden=true);const degree=Number(selected.slice(1));const it=window.siteLanguage?.()==='it';nonrotating.textContent=it?(degree===0?'ℓ = 0 è una pulsazione radiale: la stella si espande e si contrae sfericamente.':`ℓ = ${degree} è un’oscillazione non radiale con ${degree===1?'una linea nodale':'due linee nodali'} sulla superficie, dove lo spostamento radiale è nullo. La stella qui non ruota; le diverse componenti m hanno la stessa frequenza.`):(degree===0?'ℓ = 0 is a radial pulsation: the star expands and contracts spherically.':`ℓ = ${degree} is a nonradial oscillation with ${degree===1?'one surface nodal line':'two surface nodal lines'}, where radial displacement is zero. The star here is not rotating; its different m components have the same frequency.`);}
    const surface=selected==='surface',blank=selected==='observations',show=ready&&!motion.matches&&!blank;
    still.hidden=show||blank;canvas.hidden=!show||surface;contours.hidden=!show||surface;surfaceCanvas.hidden=!show||!surface;controls.hidden=!show;
    if(active())frame=requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => {
    paused = !paused;
    button.textContent=(paused?'Play ':'Pause ')+(selected==='surface'?'rotation':'oscillation');
    button.setAttribute('aria-pressed', String(paused));
    update();
  });
  document.addEventListener('visibilitychange', update);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !ready && !motion.matches) initialize();
    update();
  }, {threshold:0.08});
  observer.observe(figure);
  let loadingKey = null;
  const loadImage = url => new Promise((resolve,reject) => {
    const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url;
  });
  async function initialize() {
    if(selected==='observations')return;
    const key = fieldKey();
    if (loadingKey === key || ready) return;
    loadingKey = key;
    const mode = modes[key];
    try {
      if(key==='surface') {
        if(!surfaceRenderer){const response=await fetch('assets/solar-surface-rotation.json');if(!response.ok)throw Error('Solar data unavailable');const data=await response.json();const image=await loadImage("assets/observed-granule-atlas.png");surfaceRenderer=new window.SolarSurfaceRenderer(surfaceCanvas,data,image);}
        if(fieldKey()!==key)return;
        ready=true;draw();update();return;
      }
      if (!cache.has(key)) cache.set(key, Promise.all([loadImage(mode.field),loadImage('assets/rotation-contours.png')]));
      const [field] = await cache.get(key);
      if (fieldKey() !== key) return;
      canvas.width = field.naturalWidth; canvas.height = field.naturalHeight;
      ctx = canvas.getContext('2d'); ctx.drawImage(field,0,0);
      source = ctx.getImageData(0,0,canvas.width,canvas.height).data;
      pixels = ctx.createImageData(canvas.width,canvas.height);
      contours.src = 'assets/rotation-contours.png';
      await contours.decode();
      if (fieldKey() !== key) return;
      ready = true; draw(); update();
    } catch (_) { cache.delete(key); /* Keep the selected mode's static fallback. */ }
    finally { if (loadingKey === key) loadingKey = null; }
  }
  function describeMode() {
    const descriptionKey=selected==='l0'?'radial':selected+'-'+(travelling===0?'axisymmetric':'travelling');
    figure.querySelectorAll('[data-mode-description]').forEach(note=>{note.hidden=note.dataset.modeDescription!==descriptionKey;});
    let nonrotating=figure.querySelector('.nonrotating-description');
    if(!nonrotating){nonrotating=document.createElement('span');nonrotating.className='mode-description nonrotating-description';figure.querySelector('.mode-description-panel').append(nonrotating);}
    nonrotating.hidden=rotationEnabled||!selected.startsWith('l');
    if(!rotationEnabled){figure.querySelectorAll('[data-mode-description]').forEach(note=>note.hidden=true);const degree=Number(selected.slice(1));const it=window.siteLanguage?.()==='it';nonrotating.textContent=it?(degree===0?'ℓ = 0 è una pulsazione radiale: la stella si espande e si contrae sfericamente.':`ℓ = ${degree} è un’oscillazione non radiale con ${degree===1?'una linea nodale':'due linee nodali'} sulla superficie, dove lo spostamento radiale è nullo. La stella qui non ruota; le diverse componenti m hanno la stessa frequenza.`):(degree===0?'ℓ = 0 is a radial pulsation: the star expands and contracts spherically.':`ℓ = ${degree} is a nonradial oscillation with ${degree===1?'one surface nodal line':'two surface nodal lines'}, where radial displacement is zero. The star here is not rotating; its different m components have the same frequency.`);}
    const surface=selected==='surface',blank=selected==='observations',aster=!surface&&!blank;
    figure.querySelector('.stellar-rotation-guide').toggleAttribute('hidden',!aster||!rotationEnabled);
    contours.style.visibility=rotationEnabled?'':'hidden';
    rotationToggle.textContent=window.siteLanguage?.()==='it'?(rotationEnabled?'Rimuovi rotazione':'Ripristina rotazione'):(rotationEnabled?'Remove rotation':'Restore rotation');
    rotationToggle.setAttribute('aria-pressed',String(!rotationEnabled));
    rotationToggle.hidden=!aster;
    figure.classList.toggle('rotation-disabled',!rotationEnabled);
    observations.hidden=!blank;figure.classList.toggle('show-observations',blank);
    submenu.hidden=false;submenu.style.visibility=aster?'visible':'hidden';submenu.inert=!aster;submenu.setAttribute('aria-hidden',String(!aster));multipletPanel.hidden=!aster;if(aster&&spectrum)spectrum.draw(Number(selected.slice(1)),travelling,rotationEnabled);asterTab.setAttribute('aria-expanded',String(aster));
    patterns.hidden=false;patterns.style.visibility=aster?'visible':'hidden';patterns.inert=!aster;patterns.setAttribute('aria-hidden',String(!aster));
    surfaceCaption.hidden=false;oscillationCaption.hidden=false;
    surfaceCaption.style.visibility=surface?'visible':'hidden';oscillationCaption.style.visibility=aster?'visible':'hidden';
    surfaceCaption.inert=!surface;oscillationCaption.inert=!aster;surfaceCaption.setAttribute('aria-hidden',String(!surface));oscillationCaption.setAttribute('aria-hidden',String(!aster));

    button.textContent=(paused?'Play ':'Pause ')+(surface?'rotation':'oscillation');
    if(blank){label.textContent='';label.title='';} else if(surface) {
      label.textContent='';
      label.title='Observed Solar Orbiter/PHI granulation texture from 28 May 2020, mapped at its published 200,000 km field scale. Mirrored tiling is illustrative; this is a photospheric appearance reference, not a convection simulation. Individually masked observed granules are distributed randomly and advected independently at their centre-latitude GONG rates. No tiled patch boundaries or regular rows. Their source-calibrated size is preserved. This is a resolution-limited display approximation, not time-accurate convection. Synthetic spots rotate rigidly at their measured centre-latitude GONG rate.';
      still.src='assets/solar-surface-rigid-still.webp';still.alt='Synthetic solar granulation and spots rotating at measured solar differential rotation rates.';
      surfaceCanvas.setAttribute('aria-label','Synthetic solar granulation and spots rotate as rigid features at measured latitude-dependent solar rates. Equatorial period is 3.5 seconds.');
    } else {
    const mode=modes[fieldKey()];
    label.textContent=`Oscillation mode: n = ${mode.n} · ℓ = ${mode.l} · m = ${travelling===0?'0':(travelling>0?'+':'−')+Math.abs(travelling)}`;
    label.title='Spherical eigenfunctions from profile 242: cos(mφ − ωt); m = 0 is axisymmetric. Rotational splitting is shown in the spectrum below; the colour animation uses the unsplit frequency.';
    speed.textContent=`Oscillation shown about ${mode.speed} times faster.`;
    still.src=mode.still;
    still.alt=`Cutaway star with measured solar rotation contours and profile 242 radial displacement: ${label.textContent}, at phase zero.`;
    canvas.setAttribute('aria-label',travelling===0?'Axisymmetric stellar oscillation: radial displacement reverses periodically.':'Travelling stellar oscillation with m='+travelling+': angular displacement pattern propagates in azimuth.');
    }
    for (const tab of tabs) {
      const active=tab.dataset.mode===selected||(tab===asterTab&&aster);
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      if(active&&tab!==asterTab)stage.setAttribute('aria-labelledby',tab.id);
    }
    for (const item of patternButtons) {
      const m=Number(item.dataset.pattern);
      item.disabled=Math.abs(m)>Number(selected.slice(1));
      item.setAttribute('aria-pressed',String(m===travelling));
    }
  }
  function resetField() {
    ready=false;phase=0;describeMode();update();
    if(visible&&!motion.matches)initialize();
  }
  let panelCycleTimer;
  function restartPanelCycle(){
    clearTimeout(panelCycleTimer);
    panelCycleTimer=setTimeout(()=>{
      if(!document.hidden&&visible){selectMode(selected==='surface'?'observations':selected==='observations'?'asteroseismic':'surface');}
      else restartPanelCycle();
    },60000);
  }
  function selectMode(key) {
    restartPanelCycle();
    if(key==='asteroseismic')key=lastDegree;
    if(!['surface','observations','l0','l1','l2'].includes(key)||key===selected)return;
    if(key==='l0'||key==='l1'||key==='l2')lastDegree=key;
    selected=key;
    if(selected==='l0')travelling=0;
    if(selected==='l1'&&Math.abs(travelling)===2)travelling=Math.sign(travelling);
    resetField();
  }
  patternButtons.forEach(item=>item.addEventListener('click',()=>{
    const next=Number(item.dataset.pattern);
    if(next===travelling)return;
    travelling=next;resetField();
  }));
  rotationToggle.addEventListener('click',()=>{rotationEnabled=!rotationEnabled;describeMode();restartPanelCycle();});
  describeMode();
  restartPanelCycle();
  tabs.forEach((tab,index) => {
    tab.addEventListener('click',()=>selectMode(tab.dataset.mode));
    tab.addEventListener('keydown',event => {
      let target;
      if(event.key==='ArrowRight')target=tabs[(index+1)%tabs.length];
      else if(event.key==='ArrowLeft')target=tabs[(index+tabs.length-1)%tabs.length];
      else if (event.key==='Home') target=tabs[0];
      else if (event.key==='End') target=tabs[tabs.length-1];
      if (target) { event.preventDefault(); target.focus(); selectMode(target.dataset.mode); }
    });
  });
  document.addEventListener('languagechange',()=>{describeMode();});
  motion.addEventListener('change', () => { if (!motion.matches && visible) initialize(); update(); });
})();
