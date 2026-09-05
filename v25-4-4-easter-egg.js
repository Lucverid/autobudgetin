(() => {
  'use strict';
  const puzzles = [
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    '300000000005009000200504000020000700160000058704310600000890100000067080000005437',
    '000000907000420180000705026100904000050000040000507009920108000034059000507000000'
  ];
  let solution = '', puzzle = '', values = [], selected = -1, startedAt = 0, timerId = null;
  let audioCtx = null, musicOn = false, musicTimer = null, masterGain = null, musicBus = null, compressor = null;
  let activeNodes = [];

  function solveSudoku(str){
    const a = str.split('').map(Number);
    const valid=(idx,n)=>{const r=Math.floor(idx/9),c=idx%9;for(let i=0;i<9;i++){if(a[r*9+i]===n||a[i*9+c]===n)return false;}const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;for(let rr=br;rr<br+3;rr++)for(let cc=bc;cc<bc+3;cc++)if(a[rr*9+cc]===n)return false;return true};
    function go(){let i=a.indexOf(0);if(i<0)return true;for(let n=1;n<=9;n++){if(valid(i,n)){a[i]=n;if(go())return true;a[i]=0;}}return false}
    return go()?a.join(''):'';
  }

  function build(){
    if(document.getElementById('sudokuEggOverlay')) return;
    const el=document.createElement('div'); el.id='sudokuEggOverlay'; el.setAttribute('aria-hidden','true');
    el.innerHTML=`<div class="sudoku-lounge" role="dialog" aria-modal="true" aria-label="Sudoku Lounge">
      <div class="sudoku-lounge-head"><div><div class="sudoku-lounge-kicker">hidden lounge</div><div class="sudoku-lounge-title">Sudoku After Hours</div><div class="sudoku-lounge-sub">Sedikit ruang tenang di balik angka-angka finansial.</div></div><button class="sudoku-icon-btn" id="sudokuClose" aria-label="Tutup">✕</button></div>
      <div class="sudoku-toolbar"><button class="sudoku-tool" id="sudokuNew">↻ Game baru</button><button class="sudoku-tool active" id="sudokuMusic">♫ Midnight on</button><button class="sudoku-tool" id="sudokuErase">⌫ Hapus</button></div>
      <div class="sudoku-board" id="sudokuBoard"></div><div class="sudoku-pad" id="sudokuPad"></div>
      <div class="sudoku-status"><span>Tap angka untuk mengisi.</span><span>Waktu <strong id="sudokuTime">00:00</strong></span></div><div class="sudoku-complete" id="sudokuDone">✨ Selesai. Anggaran rapi, pikiran juga rapi.</div>
    </div>`;
    document.body.appendChild(el);
    document.getElementById('sudokuClose').onclick=close;
    document.getElementById('sudokuNew').onclick=newGame;
    document.getElementById('sudokuErase').onclick=()=>setValue(0);
    document.getElementById('sudokuMusic').onclick=toggleMusic;
    el.addEventListener('click',e=>{if(e.target===el)close()});
    const pad=document.getElementById('sudokuPad');
    for(let n=1;n<=9;n++){const b=document.createElement('button');b.className='sudoku-num';b.textContent=n;b.onclick=()=>setValue(n);pad.appendChild(b)}
    document.addEventListener('keydown',keyHandler);
  }

  function newGame(){
    puzzle=puzzles[Math.floor(Math.random()*puzzles.length)]; solution=solveSudoku(puzzle); values=puzzle.split('').map(Number); selected=-1; startedAt=Date.now(); document.getElementById('sudokuDone').style.display='none'; render();
    clearInterval(timerId); timerId=setInterval(updateTime,1000); updateTime();
  }
  function render(){
    const board=document.getElementById('sudokuBoard'); board.innerHTML='';
    const sr=selected>=0?Math.floor(selected/9):-1, sc=selected>=0?selected%9:-1, sv=selected>=0?values[selected]:0;
    values.forEach((v,i)=>{const r=Math.floor(i/9),c=i%9,b=document.createElement('button');b.className='sudoku-cell';b.dataset.row=r;b.dataset.col=c;b.textContent=v||'';if(puzzle[i]!=='0')b.classList.add('given');if(i===selected)b.classList.add('selected');else if(selected>=0&&(r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3))))b.classList.add('peer');if(sv&&v===sv&&i!==selected)b.classList.add('same');if(v&&puzzle[i]==='0'&&solution[i]!==String(v))b.classList.add('wrong');b.onclick=()=>{selected=i;render()};board.appendChild(b)});
  }
  function setValue(n){if(selected<0||puzzle[selected]!=='0')return;values[selected]=n;render();if(values.join('')===solution){document.getElementById('sudokuDone').style.display='block';clearInterval(timerId);softChime();}}
  function updateTime(){const s=Math.floor((Date.now()-startedAt)/1000),m=Math.floor(s/60);const el=document.getElementById('sudokuTime');if(el)el.textContent=`${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
  function keyHandler(e){const ov=document.getElementById('sudokuEggOverlay');if(!ov||!ov.classList.contains('open'))return;if(/^[1-9]$/.test(e.key))setValue(Number(e.key));if(e.key==='Backspace'||e.key==='Delete'||e.key==='0')setValue(0);if(e.key==='Escape')close();}

  function open(){build();const ov=document.getElementById('sudokuEggOverlay');ov.classList.add('open');ov.setAttribute('aria-hidden','false');newGame();startMusic();}
  function close(){const ov=document.getElementById('sudokuEggOverlay');if(!ov)return;ov.classList.remove('open');ov.setAttribute('aria-hidden','true');clearInterval(timerId);stopMusic();}

  // v25.4.4 — original procedural soundtrack: warmer/louder late-night hotel lobby.
  // Rhodes-style keys + soft bass + brushed percussion. No external/copyrighted audio file.
  const midiToHz = n => 440 * Math.pow(2, (n - 69) / 12);
  function remember(node){ activeNodes.push(node); node.addEventListener?.('ended',()=>{activeNodes=activeNodes.filter(x=>x!==node)}); }

  function ensureAudio(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    musicBus = audioCtx.createGain();
    compressor = audioCtx.createDynamicsCompressor();
    masterGain.gain.value = 0.82; // intentionally much louder than v25.4.3
    musicBus.gain.value = 0.78;
    compressor.threshold.value = -22;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.28;
    musicBus.connect(compressor).connect(masterGain).connect(audioCtx.destination);
  }

  function keyVoice(midi, when, dur=1.6, level=.15){
    if(!audioCtx||!musicBus)return;
    const o1=audioCtx.createOscillator(),o2=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();
    o1.type='sine'; o2.type='triangle'; o1.frequency.value=midiToHz(midi); o2.frequency.value=midiToHz(midi)*2.003;
    f.type='lowpass'; f.frequency.setValueAtTime(2300,when); f.Q.value=.45;
    g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(level,when+.025); g.gain.exponentialRampToValueAtTime(level*.38,when+.22); g.gain.exponentialRampToValueAtTime(.0001,when+dur);
    const shimmer=audioCtx.createGain(); shimmer.gain.value=.16;
    o1.connect(g); o2.connect(shimmer).connect(g); g.connect(f).connect(musicBus);
    o1.start(when);o2.start(when);o1.stop(when+dur+.05);o2.stop(when+dur+.05);remember(o1);remember(o2);
  }

  function padVoice(midis, when, dur=3.25, level=.038){
    if(!audioCtx||!musicBus)return;
    midis.forEach((m,i)=>{
      const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();
      o.type=i%2?'triangle':'sine'; o.frequency.value=midiToHz(m)*(i===0?0.999:1.0015);
      f.type='lowpass'; f.frequency.value=1100;
      g.gain.setValueAtTime(.0001,when);g.gain.linearRampToValueAtTime(level,when+.55);g.gain.setValueAtTime(level,when+dur-.6);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
      o.connect(f).connect(g).connect(musicBus);o.start(when);o.stop(when+dur+.08);remember(o);
    });
  }

  function bassVoice(midi, when, dur=.9, level=.17){
    if(!audioCtx||!musicBus)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();
    o.type='triangle';o.frequency.value=midiToHz(midi);f.type='lowpass';f.frequency.value=430;
    g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(level,when+.035);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
    o.connect(f).connect(g).connect(musicBus);o.start(when);o.stop(when+dur+.05);remember(o);
  }

  function brush(when, level=.055, dur=.09){
    if(!audioCtx||!musicBus)return;
    const len=Math.max(1,Math.floor(audioCtx.sampleRate*dur)),buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    const src=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain();src.buffer=buf;f.type='highpass';f.frequency.value=3400;g.gain.setValueAtTime(level,when);g.gain.exponentialRampToValueAtTime(.0001,when+dur);
    src.connect(f).connect(g).connect(musicBus);src.start(when);src.stop(when+dur+.02);remember(src);
  }

  function softKick(when, level=.12){
    if(!audioCtx||!musicBus)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(92,when);o.frequency.exponentialRampToValueAtTime(48,when+.18);g.gain.setValueAtTime(level,when);g.gain.exponentialRampToValueAtTime(.0001,when+.32);o.connect(g).connect(musicBus);o.start(when);o.stop(when+.35);remember(o);
  }

  function scheduleLoop(){
    if(!audioCtx||!musicOn)return;
    const beat=60/74, bar=beat*4, t=audioCtx.currentTime+.08;
    // Fmaj9 -> Em7 -> Dm9 -> Cmaj9. Calm, lounge-like and intentionally original.
    const chords=[
      {pad:[53,57,60,64,67],keys:[65,69,72,76],bass:41,mel:[76,74,72]},
      {pad:[52,55,59,62,67],keys:[64,67,71,74],bass:40,mel:[74,71,69]},
      {pad:[50,53,57,60,64],keys:[62,65,69,72],bass:38,mel:[72,69,67]},
      {pad:[48,52,55,59,62],keys:[60,64,67,71],bass:36,mel:[71,69,67]}
    ];
    chords.forEach((ch,b)=>{
      const bt=t+b*bar; padVoice(ch.pad,bt,bar+.55,.026);
      // Rhodes comping: two gentle stabs per bar.
      [0,.5,2,2.5].forEach((off,j)=>{
        const chordTone=ch.keys[j%ch.keys.length];
        keyVoice(chordTone,bt+off*beat,1.15,j===0?.115:.09);
        if(j===0||j===2) keyVoice(ch.keys[(j+2)%ch.keys.length],bt+off*beat+.018,1.05,.067);
      });
      bassVoice(ch.bass,bt+.02,beat*.92,.14); bassVoice(ch.bass+7,bt+2*beat,beat*.82,.105);
      softKick(bt+.01,.095); softKick(bt+2*beat,.065);
      for(let q=1;q<4;q++)brush(bt+q*beat+.01,q===2?.048:.036,.075);
      // sparse top melody so it sounds like actual music, not a drone
      if(b%2===0){ keyVoice(ch.mel[0],bt+1.5*beat,.72,.058); keyVoice(ch.mel[1],bt+3.25*beat,.62,.047); }
      else { keyVoice(ch.mel[2],bt+3.1*beat,.68,.045); }
    });
  }

  function startMusic(){
    musicOn=true;const btn=document.getElementById('sudokuMusic');if(btn){btn.classList.add('active');btn.textContent='♫ Midnight on'};
    try{
      ensureAudio();audioCtx.resume();if(masterGain)masterGain.gain.setTargetAtTime(.82,audioCtx.currentTime,.05);
      scheduleLoop();clearInterval(musicTimer);musicTimer=setInterval(scheduleLoop,Math.round((60/74)*4*4*1000));
    }catch(e){musicOn=false}
  }
  function stopMusic(){
    musicOn=false;clearInterval(musicTimer);musicTimer=null;
    activeNodes.forEach(n=>{try{n.stop()}catch(e){}});activeNodes=[];
    if(audioCtx){try{masterGain?.gain.setTargetAtTime(.0001,audioCtx.currentTime,.03);setTimeout(()=>{try{audioCtx.suspend()}catch(e){}},100)}catch(e){}}
  }
  function toggleMusic(){if(musicOn){stopMusic();const b=document.getElementById('sudokuMusic');if(b){b.classList.remove('active');b.textContent='♫ Midnight off'}}else{startMusic()}}
  function softChime(){if(!audioCtx||!musicOn)return;const t=audioCtx.currentTime;[72,76,79,84].forEach((m,i)=>keyVoice(m,t+i*.12,1.35,.09))}

  function installTrigger(){
    // Easter egg: tap tombol Settings 7x dalam 3 detik.
    const settings=[...document.querySelectorAll('.nav-item')].find(x=>x.getAttribute('aria-label')==='Pengaturan');if(!settings)return;
    let taps=[];settings.addEventListener('click',()=>{const now=Date.now();taps=taps.filter(t=>now-t<3000);taps.push(now);if(taps.length>=7){taps=[];setTimeout(open,120)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installTrigger);else installTrigger();
  window.openSudokuEasterEgg=open;
})();
