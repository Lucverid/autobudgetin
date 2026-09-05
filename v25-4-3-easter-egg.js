(() => {
  'use strict';
  const puzzles = [
    '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
    '000260701680070090190004500820100040004602900050003028009300074040050036703018000',
    '300000000005009000200504000020000700160000058704310600000890100000067080000005437',
    '000000907000420180000705026100904000050000040000507009920108000034059000507000000'
  ];
  let solution = '', puzzle = '', values = [], selected = -1, startedAt = 0, timerId = null;
  let audioCtx = null, musicOn = false, musicNodes = [], musicTimer = null;

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
      <div class="sudoku-toolbar"><button class="sudoku-tool" id="sudokuNew">↻ Game baru</button><button class="sudoku-tool active" id="sudokuMusic">♫ Lounge on</button><button class="sudoku-tool" id="sudokuErase">⌫ Hapus</button></div>
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

  // Original procedural ambient sound: warm apartment-lobby / late-night lounge feel.
  function tone(freq,when,dur,gain=0.018,type='sine'){
    if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();o.type=type;o.frequency.value=freq;f.type='lowpass';f.frequency.value=1200;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(gain,when+.25);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(f).connect(g).connect(audioCtx.destination);o.start(when);o.stop(when+dur+.1);musicNodes.push(o);
  }
  function schedulePhrase(){if(!audioCtx||!musicOn)return;const t=audioCtx.currentTime+.05;const chords=[[196,246.94,293.66],[174.61,220,261.63],[146.83,196,246.94],[164.81,207.65,246.94]];const ch=chords[Math.floor(Date.now()/8000)%chords.length];ch.forEach((f,i)=>tone(f,t+i*.06,5.8,.011,'sine'));tone(ch[0]/2,t,6,.008,'triangle');tone(ch[1]*2,t+2.6,2.4,.005,'sine');}
  function startMusic(){musicOn=true;const btn=document.getElementById('sudokuMusic');if(btn){btn.classList.add('active');btn.textContent='♫ Lounge on'};try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();schedulePhrase();clearInterval(musicTimer);musicTimer=setInterval(schedulePhrase,6000);}catch(e){musicOn=false}}
  function stopMusic(){musicOn=false;clearInterval(musicTimer);musicTimer=null;musicNodes.forEach(n=>{try{n.stop()}catch(e){}});musicNodes=[];if(audioCtx){try{audioCtx.suspend()}catch(e){}}}
  function toggleMusic(){if(musicOn){stopMusic();const b=document.getElementById('sudokuMusic');if(b){b.classList.remove('active');b.textContent='♫ Lounge off'}}else{startMusic()}}
  function softChime(){if(!audioCtx||!musicOn)return;const t=audioCtx.currentTime;[523.25,659.25,783.99].forEach((f,i)=>tone(f,t+i*.13,1.8,.012,'sine'))}

  function installTrigger(){
    // Easter egg: tap tombol Settings 7x dalam 3 detik.
    const settings=[...document.querySelectorAll('.nav-item')].find(x=>x.getAttribute('aria-label')==='Pengaturan');if(!settings)return;
    let taps=[];settings.addEventListener('click',()=>{const now=Date.now();taps=taps.filter(t=>now-t<3000);taps.push(now);if(taps.length>=7){taps=[];setTimeout(open,120)}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installTrigger);else installTrigger();
  window.openSudokuEasterEgg=open;
})();
