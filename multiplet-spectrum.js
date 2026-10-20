window.MultipletSpectrum=class {
 constructor(canvas,data){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.data=data;canvas.width=1000;canvas.height=620;let state=242;const rand=()=>{state=(1664525*state+1013904223)>>>0;return Math.max(1e-9,state/4294967296)};this.panels=[[0,2],[1]].map(degrees=>{const modes=data.modes.filter(mode=>degrees.includes(mode.l)),min=Math.min(...modes.map(mode=>mode.frequency_uHz))-3,max=Math.max(...modes.map(mode=>mode.frequency_uHz))+3;return {modes,min,max,noise:Array.from({length:Math.floor((max-min)/.04)+1},()=>-Math.log(rand()))}});this.draw(1,1);}
 weight(l,m){const c=Math.cos(this.data.inclination_deg*Math.PI/180),s=1-c*c,a=Math.abs(m);if(l===0)return 1;if(l===1)return a===0?c*c:s/2;return a===0?(3*c*c-1)**2/4:a===1?1.5*c*c*s:3*s*s/8;}
 draw(l,m,rotation=true){
 const note=this.canvas.parentElement.querySelector('.rotation-frequency-note');
 const it=window.siteLanguage?.()==='it';
 if(note)note.textContent=!rotation?(it?'Senza rotazione, tutte le componenti m dello stesso modo (n, ℓ) hanno la stessa frequenza.':'Without rotation, all m components of the same (n, ℓ) mode have the same frequency.'):m===0?(it?'Per m = 0, la rotazione non modifica la frequenza al primo ordine.':'For m = 0, rotation leaves the frequency unchanged to first order.'):(it?`Per m = ${m>0?'+':''}${m}, la rotazione ${m>0?'aumenta':'diminuisce'} la frequenza rispetto alla componente m = 0 e al caso senza rotazione (al primo ordine).`:`For m = ${m>0?'+':''}${m}, rotation ${m>0?'increases':'decreases'} the frequency relative to both the m = 0 component and the nonrotating case (to first order).`);
 const {ctx:c,data:d}=this;c.clearRect(0,0,1000,620);c.fillStyle='#111c23';c.fillRect(0,0,1000,620);const top=85,h=400,B=d.white_background_ppm2_per_uHz;
 const meanAt=(v,panel)=>B+panel.modes.reduce((sum,mode)=>{for(let k=-mode.l;k<=mode.l;k++){const at=mode.frequency_uHz+k*mode.splitting_uHz*(rotation?1:0);sum+=d.height_ppm2_per_uHz*this.weight(mode.l,k)/(1+4*((v-at)/mode.linewidth_uHz)**2);}return sum;},0);
 const ymax=Math.max(...this.panels.flatMap(panel=>panel.noise.map((r,j)=>meanAt(panel.min+j*.04,panel)*r)));
 const y=v=>top+h-v/ymax*h;
 this.panels.forEach((panel,index)=>{const left=index?585:155,w=index?385:330,x=v=>left+(v-panel.min)/(panel.max-panel.min)*w,components=[];
 for(const mode of panel.modes)for(let k=-mode.l;k<=mode.l;k++)components.push({l:mode.l,m:k,at:mode.frequency_uHz+k*mode.splitting_uHz*(rotation?1:0),height:d.height_ppm2_per_uHz*this.weight(mode.l,k),width:mode.linewidth_uHz});
 const lor=(v,p)=>p.height/(1+4*((v-p.at)/p.width)**2),mean=v=>B+components.reduce((a,p)=>a+lor(v,p),0);
 c.strokeStyle='#37515f';c.lineWidth=1.5;c.beginPath();c.moveTo(left,top);c.lineTo(left,top+h);c.lineTo(left+w,top+h);c.stroke();c.fillStyle='#b7c8ce';c.font='32px Arial';c.textAlign='right';if(!index)for(const v of [0,10,20,30,40,50,60,70,80].filter(v=>v<=ymax))c.fillText(v,left-12,y(v)+6);
 c.save();c.beginPath();c.rect(left,top,w,h);c.clip();c.strokeStyle='rgba(158,177,186,.4)';c.lineWidth=1;c.beginPath();panel.noise.forEach((r,j)=>{const v=panel.min+j*.04;if(j)c.lineTo(x(v),y(mean(v)*r));else c.moveTo(x(v),y(mean(v)*r));});c.stroke();
 for(const p of [...components].sort((a,b)=>(a.l===l&&a.m===m)-(b.l===l&&b.m===m))){const active=p.l===l&&p.m===m;c.strokeStyle=active?'#f5d895':'#5998b4';c.lineWidth=active?3:1.6;c.setLineDash(active?[]:[5,4]);c.beginPath();for(let v=panel.min;v<=panel.max;v+=.005){if(v>panel.min)c.lineTo(x(v),y(lor(v,p)));else c.moveTo(x(v),y(lor(v,p)));}c.stroke();}
 c.setLineDash([]);c.strokeStyle='#d6e5e9';c.lineWidth=2;c.beginPath();for(let v=panel.min;v<=panel.max;v+=.005){if(v>panel.min)c.lineTo(x(v),y(mean(v)));else c.moveTo(x(v),y(mean(v)));}c.stroke();c.restore();
 c.textAlign='center';for(const mode of panel.modes){c.fillStyle=mode.l===l?'#f5d895':'#a5ced9';c.font='32px Arial';c.fillText(`ℓ = ${mode.l}`,x(mode.frequency_uHz),40);c.font='32px Arial';c.fillText(`n = ${mode.n}`,x(mode.frequency_uHz),72);}
 c.fillStyle='#b7c8ce';c.font='32px Arial';const step=index?2:4;for(let v=Math.ceil(panel.min/step)*step;v<=panel.max;v+=step){c.fillText(v,x(v),top+h+36);c.strokeStyle='#37515f';c.beginPath();c.moveTo(x(v),top+h);c.lineTo(x(v),top+h+9);c.stroke();}
 const chosen=components.find(p=>p.l===l&&p.m===m);if(chosen){c.fillStyle='#f5d895';c.font='32px Arial';c.fillText(`${window.siteLanguage?.()==='it'?'Selezionato':'Selected'} m = ${m>0?'+':m<0?'−':''}${Math.abs(m)}`,left+w/2,top+30);}
 });
 c.save();c.translate(60,top+h/2);c.rotate(-Math.PI/2);c.fillStyle='#b7c8ce';c.font='32px Arial';c.textAlign='center';if(window.siteLanguage?.()==='it'){c.fillText('Densità spettrale',0,-18);c.fillText('di potenza (ppm²/μHz)',0,18);}else{c.fillText('Oscillation power',0,-18);c.fillText('(ppm²/μHz)',0,18);}c.restore();c.textAlign='center';c.fillStyle='#b7c8ce';c.font='32px Arial';c.fillText(window.siteText('Frequency (μHz)'),535,578);
 }
};
