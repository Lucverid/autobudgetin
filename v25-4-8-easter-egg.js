(() => {
  'use strict';

  let audioCtx = null, musicOn = false, musicTimer = null, masterGain = null, musicBus = null, compressor = null;
  let rainSource = null, rainGain = null, rainFilter = null;
  let activeNodes = [];
  let wanderTimer = null, mouseTimer = null, rafId = null, timerId = null, idleTimer = null, purrTimer = null;
  let sceneEl = null, catEl = null, mouseEl = null, moodEl = null, timerEl = null, bubbleEl = null, volumeEl = null, rainEl = null;
  let startedAt = 0;
  let lastSceneWidth = 0, lastSceneHeight = 0;
  const state = {
    cat: { x: 70, y: 210, targetX: 70, targetY: 210, vx: 0, vy: 0, speed: 48, chaseSpeed: 112, pausedUntil: 0, lastTick: 0 },
    mouse: { visible: false, x: 240, y: 214 },
    volume: clamp(Number(localStorage.getItem('agis_cat_lobby_volume') || 118), 55, 180),
    rainOn: localStorage.getItem('agis_cat_lobby_rain') === '1',
    sleeping: false,
    lastInteraction: Date.now()
  };

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function rand(min, max){ return Math.random() * (max - min) + min; }
  function now(){ return Date.now(); }

  function build(){
    if (document.getElementById('catEggOverlay')) return;
    const el = document.createElement('div');
    el.id = 'catEggOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="cat-lounge" role="dialog" aria-modal="true" aria-label="Cat Lounge">
        <div class="cat-lounge-head">
          <div>
            <div class="cat-lounge-kicker">hidden lounge</div>
            <div class="cat-lounge-title">Cat After Hours</div>
            <div class="cat-lounge-sub">Meong sekarang pakai sprite animation frame-by-frame ala game 2D: jalan, lari, idle, tidur, dan pat-pat punya frame sendiri.</div>
          </div>
          <button class="cat-icon-btn" id="catClose" aria-label="Tutup">✕</button>
        </div>

        <div class="cat-toolbar">
          <button class="cat-tool active" id="catMusic">♫ Lobby on</button>
          <button class="cat-tool" id="catMouseBtn">🐭 Munculin tikus</button>
          <button class="cat-tool" id="catRainBtn">🌧 Hujan off</button>
          <button class="cat-tool" id="catCalmBtn">✨ Bikin santai</button>
          <label class="cat-volume-wrap" for="catVolume">🔊
            <input id="catVolume" type="range" min="55" max="180" step="1" />
          </label>
        </div>

        <div class="cat-scene" id="catScene">
          <div class="cat-lamp-glow"></div>
          <div class="cat-rain" id="catRain"></div>
          <div class="cat-window"></div>
          <div class="cat-couch"></div>
          <div class="cat-plant"></div>
          <div class="cat-rug"></div>
          <div class="cat-bubble" id="catBubble">purrr...</div>
          <button class="cat-avatar" id="catPet" aria-label="Pat pat kucing" title="Pat pat kucing">
            <span class="cat-sprite-img" aria-hidden="true"></span>
          </button>
          <button class="mouse-avatar hidden" id="catMouse" aria-label="Tikus kecil" title="Tikus kecil">
            <span class="mouse-sprite-img" aria-hidden="true"></span>
          </button>
        </div>

        <div class="cat-status">
          <span id="catMood">Meong lagi jalan santai di lobby malam.</span>
          <span>Waktu tenang <strong id="catTime">00:00</strong></span>
        </div>

        <div class="cat-tip">Tip: sekarang gerak kucing bukan CSS-limb lagi. Sprite-nya benar-benar berganti frame saat <strong>jalan, lari, idle, dipat-pat, dan tidur</strong>.</div>
      </div>`;
    document.body.appendChild(el);

    sceneEl = document.getElementById('catScene');
    catEl = document.getElementById('catPet');
    mouseEl = document.getElementById('catMouse');
    moodEl = document.getElementById('catMood');
    timerEl = document.getElementById('catTime');
    bubbleEl = document.getElementById('catBubble');
    volumeEl = document.getElementById('catVolume');
    rainEl = document.getElementById('catRain');
    volumeEl.value = String(state.volume);
    updateRainUi();

    document.getElementById('catClose').onclick = close;
    document.getElementById('catMusic').onclick = toggleMusic;
    document.getElementById('catMouseBtn').onclick = () => { registerInteraction(); wakeCat(); spawnMouse(true); };
    document.getElementById('catRainBtn').onclick = () => { registerInteraction(); toggleRain(); };
    document.getElementById('catCalmBtn').onclick = () => { registerInteraction(); wakeCat(); calmCat(); };
    catEl.onclick = () => { registerInteraction(); wakeCat(); petCat(); };
    mouseEl.onclick = () => {
      registerInteraction(); wakeCat();
      burst(mouseEl.offsetLeft + 10, mouseEl.offsetTop - 6, 'ciut!');
      setMood('Tikus lari kecil... si meong langsung fokus.');
      chaseMouse();
    };
    volumeEl.addEventListener('input', () => { registerInteraction(); applyVolumeFromUi(); });
    sceneEl.addEventListener('pointerdown', registerInteraction);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    window.addEventListener('resize', syncSceneBounds);
    document.addEventListener('keydown', keyHandler);
  }

  function keyHandler(e){
    const ov = document.getElementById('catEggOverlay');
    if(!ov || !ov.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key.toLowerCase() === 'm') toggleMusic();
    if(e.key.toLowerCase() === 'p') { registerInteraction(); wakeCat(); petCat(); }
    if(e.key.toLowerCase() === 'r') { registerInteraction(); toggleRain(); }
  }

  function open(){
    build();
    const ov = document.getElementById('catEggOverlay');
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    startScene();
    startMusic();
  }

  function close(){
    const ov = document.getElementById('catEggOverlay');
    if(!ov) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    stopScene();
    stopMusic();
    if(audioCtx){ try{ setRainAudio(false); setTimeout(()=>audioCtx.suspend(), 120); }catch(e){} }
  }

  function startScene(){
    build();
    startedAt = Date.now();
    state.lastInteraction = Date.now();
    state.sleeping = false;
    catEl?.classList.remove('sleeping');
    syncSceneBounds();
    hideMouse();
    setMood('Meong lagi jalan santai di lobby malam.');
    state.cat.pausedUntil = 0;
    state.cat.vx = 0; state.cat.vy = 0; state.cat.lastTick = 0;
    chooseWanderTarget(true);
    clearInterval(timerId);
    timerId = setInterval(updateTime, 1000);
    updateTime();
    clearInterval(wanderTimer);
    wanderTimer = setInterval(() => {
      if (state.mouse.visible) chaseMouse();
      else chooseWanderTarget(false);
    }, 2400);
    clearInterval(mouseTimer);
    mouseTimer = setInterval(() => {
      if (!state.sleeping && !state.mouse.visible && Math.random() < 0.42) spawnMouse(false);
    }, 5200);
    clearInterval(idleTimer);
    idleTimer = setInterval(checkIdleSleep, 1000);
    clearInterval(purrTimer);
    purrTimer = setInterval(() => {
      if(state.sleeping){ showBubble(Math.random()>.5 ? 'purrr...' : 'zzz...'); if(Math.random()>.58) purrTone(); }
    }, 4200);
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }

  function stopScene(){
    clearInterval(timerId); timerId = null;
    clearInterval(wanderTimer); wanderTimer = null;
    clearInterval(mouseTimer); mouseTimer = null;
    clearInterval(idleTimer); idleTimer = null;
    clearInterval(purrTimer); purrTimer = null;
    cancelAnimationFrame(rafId); rafId = null;
    hideBubble();
  }

  function registerInteraction(){
    state.lastInteraction = Date.now();
  }

  function checkIdleSleep(){
    if(state.sleeping || state.mouse.visible) return;
    if(Date.now() - state.lastInteraction >= 24000) sleepCat();
  }

  function sleepCat(){
    if(!catEl || state.mouse.visible) return;
    state.sleeping = true;
    state.cat.pausedUntil = Number.MAX_SAFE_INTEGER;
    catEl.classList.add('sleeping');
    showBubble('zzz... purrr...');
    setMood(state.rainOn ? 'Si meong ketiduran ditemenin suara hujan.' : 'Si meong ketiduran di karpet lobby.');
    if(Math.random() > .4) purrTone();
  }

  function wakeCat(){
    if(!state.sleeping) return;
    state.sleeping = false;
    state.cat.pausedUntil = 0;
    catEl?.classList.remove('sleeping');
    showBubble('meow~');
    setMood('Meong bangun pelan, terus stretching sebentar.');
    burst(state.cat.x + 32, state.cat.y - 12, 'stretch~');
    setTimeout(() => { if(state.mouse.visible) chaseMouse(); else chooseWanderTarget(false); }, 550);
  }

  function updateTime(){
    const s = Math.floor((Date.now() - startedAt) / 1000);
    const m = Math.floor(s / 60);
    if (timerEl) timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }

  function sceneBounds(){
    const w = sceneEl ? sceneEl.clientWidth : 0;
    const h = sceneEl ? sceneEl.clientHeight : 0;
    return { w, h, left: 14, right: Math.max(14, w - 104), floor: Math.max(120, h - 74) };
  }

  function syncSceneBounds(){
    if (!sceneEl) return;
    const b = sceneBounds();
    if (!b.w || !b.h) return;
    if (!lastSceneWidth) {
      state.cat.x = b.left + 30;
      state.cat.y = b.floor;
      state.cat.targetX = state.cat.x;
      state.cat.targetY = state.cat.y;
    } else {
      const scaleX = b.w / lastSceneWidth;
      const scaleY = b.h / lastSceneHeight;
      state.cat.x = clamp(state.cat.x * scaleX, b.left, b.right);
      state.cat.targetX = clamp(state.cat.targetX * scaleX, b.left, b.right);
      state.cat.y = clamp(state.cat.y * scaleY, b.floor - 12, b.floor + 8);
      state.cat.targetY = clamp(state.cat.targetY * scaleY, b.floor - 12, b.floor + 8);
      if (state.mouse.visible) {
        state.mouse.x = clamp(state.mouse.x * scaleX, b.left + 40, Math.max(b.left + 40, b.w - 52));
        state.mouse.y = clamp(state.mouse.y * scaleY, b.floor - 4, b.floor + 16);
      }
    }
    lastSceneWidth = b.w;
    lastSceneHeight = b.h;
    render();
  }

  function chooseWanderTarget(initial){
    if(state.sleeping) return;
    const b = sceneBounds();
    state.cat.targetX = rand(b.left + 6, b.right - 6);
    state.cat.targetY = rand(b.floor - 10, b.floor + 6);
    if (!initial) {
      const moods = [
        'Meong inspeksi karpet dulu.',
        'Dia muter pelan kayak jaga lobby.',
        'Langkahnya santai banget, nggak buru-buru.',
        'Si meong lagi cari spot paling adem.'
      ];
      setMood(moods[Math.floor(Math.random() * moods.length)]);
    }
  }

  function spawnMouse(manual){
    if(manual) wakeCat();
    if(state.sleeping && !manual) return;
    const b = sceneBounds();
    state.mouse.visible = true;
    state.mouse.x = rand(b.left + 45, Math.max(b.left + 46, b.w - 54));
    state.mouse.y = rand(b.floor - 2, b.floor + 10);
    mouseEl.classList.remove('hidden');
    if (manual) {
      setMood('Tikus kecil muncul. Si meong langsung siaga.');
      showBubble('eh ada tikus');
    } else {
      setMood('Ada tikus kecil nyelonong pelan di pojok lobby.');
    }
    chaseMouse();
    render();
  }

  function hideMouse(){
    state.mouse.visible = false;
    if (mouseEl) mouseEl.classList.add('hidden');
  }

  function chaseMouse(){
    if (!state.mouse.visible) return;
    state.cat.targetX = clamp(state.mouse.x - 4, sceneBounds().left, sceneBounds().right);
    state.cat.targetY = state.mouse.y;
    setMood('Meong lagi ngejar tikus kecil...');
  }

  function calmCat(){
    state.lastInteraction = Date.now();
    hideMouse();
    showBubble('purrr...');
    burst(state.cat.x + 28, state.cat.y - 8, '✨');
    state.cat.pausedUntil = now() + 1200;
    setMood('Lobby tenang lagi. Si meong diem sebentar sambil denger musik.');
    setTimeout(() => chooseWanderTarget(false), 700);
  }

  function petCat(){
    if (!catEl) return;
    state.lastInteraction = Date.now();
    state.cat.pausedUntil = now() + 950;
    catEl.classList.add('petted');
    showBubble('pat pat ❤');
    burst(state.cat.x + 22, state.cat.y - 8, 'pat pat');
    burst(state.cat.x + 46, state.cat.y - 18, '❤');
    burst(state.cat.x + 8, state.cat.y - 12, '❤');
    setMood('Purrr... si meong seneng dipat-pat.');
    purrTone();
    setTimeout(() => catEl && catEl.classList.remove('petted'), 500);
    setTimeout(() => {
      if (state.mouse.visible) chaseMouse();
      else chooseWanderTarget(false);
    }, 650);
  }

  function render(){
    if (!catEl || !sceneEl) return;
    const dx = state.cat.targetX - state.cat.x;
    const facing = Math.abs(state.cat.vx) > 2 ? (state.cat.vx >= 0 ? 1 : -1) : (dx >= 0 ? 1 : -1);
    const moving = Math.hypot(state.cat.vx, state.cat.vy) > 4;
    catEl.style.transform = `translate3d(${state.cat.x}px, ${state.cat.y}px, 0) scaleX(${facing})`;
    catEl.classList.toggle('walking', !state.sleeping && moving && now() > state.cat.pausedUntil);
    catEl.classList.toggle('chasing', !state.sleeping && state.mouse.visible && moving);
    if (mouseEl) mouseEl.style.transform = `translate3d(${state.mouse.x}px, ${state.mouse.y}px, 0)`;
  }

  function tick(ts){
    const b = sceneBounds();
    if (!b.w) { rafId = requestAnimationFrame(tick); return; }
    if (!state.cat.lastTick) state.cat.lastTick = ts;
    const dt = Math.min(0.04, Math.max(0.001, (ts - state.cat.lastTick) / 1000));
    state.cat.lastTick = ts;
    const paused = now() < state.cat.pausedUntil;

    if (!paused) {
      const dx = state.cat.targetX - state.cat.x;
      const dy = state.cat.targetY - state.cat.y;
      const dist = Math.hypot(dx, dy);
      const targetSpeed = state.mouse.visible ? state.cat.chaseSpeed : state.cat.speed;
      let desiredVx = 0, desiredVy = 0;
      if (dist > 1.5) {
        const slowRadius = state.mouse.visible ? 34 : 54;
        const ease = Math.min(1, dist / slowRadius);
        const desiredSpeed = Math.max(state.mouse.visible ? 35 : 10, targetSpeed * ease);
        desiredVx = dx / dist * desiredSpeed;
        desiredVy = dy / dist * desiredSpeed;
      }
      const response = state.mouse.visible ? 9.5 : 6.0;
      const blend = 1 - Math.exp(-response * dt);
      state.cat.vx += (desiredVx - state.cat.vx) * blend;
      state.cat.vy += (desiredVy - state.cat.vy) * blend;
      if (dist < 2.5) { state.cat.vx *= .72; state.cat.vy *= .72; }
      state.cat.x = clamp(state.cat.x + state.cat.vx * dt, b.left, b.right);
      state.cat.y = clamp(state.cat.y + state.cat.vy * dt, b.floor - 12, b.floor + 8);

      if (state.mouse.visible && Math.abs(state.cat.x - state.mouse.x) < 26 && Math.abs(state.cat.y - state.mouse.y) < 20) {
        hideMouse();
        state.cat.vx *= .35; state.cat.vy *= .35;
        showBubble('gotcha!');
        burst(state.cat.x + 32, state.cat.y - 12, 'gotcha!');
        setMood('Tikus ketangkap. Si meong balik santai lagi.');
        chime();
        setTimeout(() => chooseWanderTarget(false), 450);
      }
    } else {
      state.cat.vx *= .82; state.cat.vy *= .82;
    }
    render();
    rafId = requestAnimationFrame(tick);
  }

  function setMood(text){ if (moodEl) moodEl.textContent = text; }

  function showBubble(text){
    if (!bubbleEl) return;
    bubbleEl.textContent = text;
    bubbleEl.classList.add('show');
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(hideBubble, 1400);
  }
  function hideBubble(){ if (bubbleEl) bubbleEl.classList.remove('show'); }

  function burst(x, y, text){
    if (!sceneEl) return;
    const el = document.createElement('div');
    el.className = 'cat-float';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    sceneEl.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  const midiToHz = n => 440 * Math.pow(2, (n - 69) / 12);
  function remember(node){ activeNodes.push(node); node.addEventListener?.('ended', () => { activeNodes = activeNodes.filter(x => x !== node); }); }

  function ensureAudio(){
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    musicBus = audioCtx.createGain();
    compressor = audioCtx.createDynamicsCompressor();
    rainGain = audioCtx.createGain();
    rainFilter = audioCtx.createBiquadFilter();
    rainGain.gain.value = 0.0001;
    rainFilter.type = 'lowpass'; rainFilter.frequency.value = 4200;
    rainGain.connect(rainFilter).connect(musicBus);
    compressor.threshold.value = -23;
    compressor.knee.value = 22;
    compressor.ratio.value = 4.7;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.26;
    musicBus.gain.value = 1.18;
    masterGain.gain.value = 1.55;
    musicBus.connect(compressor).connect(masterGain).connect(audioCtx.destination);
    applyVolumeValue(state.volume);
  }

  function applyVolumeValue(v){
    state.volume = clamp(Number(v || 118), 55, 180);
    localStorage.setItem('agis_cat_lobby_volume', String(state.volume));
    if (masterGain) {
      const normalized = state.volume / 100;
      masterGain.gain.setTargetAtTime(1.55 * normalized, audioCtx ? audioCtx.currentTime : 0, 0.04);
    }
  }
  function applyVolumeFromUi(){ applyVolumeValue(volumeEl.value); }

  function keyVoice(midi, when, dur=1.45, level=.18){
    if(!audioCtx || !musicBus) return;
    const o1=audioCtx.createOscillator(), o2=audioCtx.createOscillator(), g=audioCtx.createGain(), f=audioCtx.createBiquadFilter();
    o1.type='sine'; o2.type='triangle';
    o1.frequency.value=midiToHz(midi); o2.frequency.value=midiToHz(midi) * 2.004;
    f.type='lowpass'; f.frequency.setValueAtTime(2400, when); f.Q.value=.5;
    g.gain.setValueAtTime(.0001, when);
    g.gain.exponentialRampToValueAtTime(level, when + .02);
    g.gain.exponentialRampToValueAtTime(level * .42, when + .24);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    const shimmer = audioCtx.createGain(); shimmer.gain.value = .18;
    o1.connect(g); o2.connect(shimmer).connect(g); g.connect(f).connect(musicBus);
    o1.start(when); o2.start(when); o1.stop(when + dur + .05); o2.stop(when + dur + .05); remember(o1); remember(o2);
  }

  function padVoice(midis, when, dur=3.4, level=.05){
    if(!audioCtx || !musicBus) return;
    midis.forEach((m, i) => {
      const o=audioCtx.createOscillator(), g=audioCtx.createGain(), f=audioCtx.createBiquadFilter();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = midiToHz(m) * (i === 0 ? 0.999 : 1.0015);
      f.type = 'lowpass'; f.frequency.value = 1180;
      g.gain.setValueAtTime(.0001, when);
      g.gain.linearRampToValueAtTime(level, when + .62);
      g.gain.setValueAtTime(level, when + dur - .62);
      g.gain.exponentialRampToValueAtTime(.0001, when + dur);
      o.connect(f).connect(g).connect(musicBus); o.start(when); o.stop(when + dur + .08); remember(o);
    });
  }

  function bassVoice(midi, when, dur=.92, level=.205){
    if(!audioCtx || !musicBus) return;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain(), f=audioCtx.createBiquadFilter();
    o.type='triangle'; o.frequency.value=midiToHz(midi); f.type='lowpass'; f.frequency.value=450;
    g.gain.setValueAtTime(.0001, when);
    g.gain.exponentialRampToValueAtTime(level, when + .032);
    g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.connect(f).connect(g).connect(musicBus); o.start(when); o.stop(when + dur + .05); remember(o);
  }

  function brush(when, level=.068, dur=.095){
    if(!audioCtx || !musicBus) return;
    const len = Math.max(1, Math.floor(audioCtx.sampleRate * dur)), buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate), d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audioCtx.createBufferSource(), f = audioCtx.createBiquadFilter(), g = audioCtx.createGain();
    src.buffer = buf; f.type='highpass'; f.frequency.value=3300;
    g.gain.setValueAtTime(level, when); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    src.connect(f).connect(g).connect(musicBus); src.start(when); src.stop(when + dur + .02); remember(src);
  }

  function softKick(when, level=.145){
    if(!audioCtx || !musicBus) return;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(90, when); o.frequency.exponentialRampToValueAtTime(46, when + .19);
    g.gain.setValueAtTime(level, when); g.gain.exponentialRampToValueAtTime(.0001, when + .34);
    o.connect(g).connect(musicBus); o.start(when); o.stop(when + .36); remember(o);
  }

  function bellTone(midi, when, dur=.8, level=.06){
    if(!audioCtx || !musicBus) return;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type='sine'; o.frequency.value = midiToHz(midi) * 2;
    g.gain.setValueAtTime(.0001, when); g.gain.exponentialRampToValueAtTime(level, when + .01); g.gain.exponentialRampToValueAtTime(.0001, when + dur);
    o.connect(g).connect(musicBus); o.start(when); o.stop(when + dur + .04); remember(o);
  }

  function scheduleLoop(){
    if(!audioCtx || !musicOn) return;
    const beat = 60 / 74, bar = beat * 4, t = audioCtx.currentTime + .08;
    const chords = [
      {pad:[53,57,60,64,67], keys:[65,69,72,76], bass:41, mel:[76,74,72]},
      {pad:[52,55,59,62,67], keys:[64,67,71,74], bass:40, mel:[74,71,69]},
      {pad:[50,53,57,60,64], keys:[62,65,69,72], bass:38, mel:[72,69,67]},
      {pad:[48,52,55,59,62], keys:[60,64,67,71], bass:36, mel:[71,69,67]}
    ];
    chords.forEach((ch, b) => {
      const bt = t + b * bar;
      padVoice(ch.pad, bt, bar + .62, .036);
      [0, .5, 2, 2.5].forEach((off, j) => {
        const tone = ch.keys[j % ch.keys.length];
        keyVoice(tone, bt + off * beat, 1.1, j === 0 ? .14 : .112);
        if (j === 0 || j === 2) keyVoice(ch.keys[(j + 2) % ch.keys.length], bt + off * beat + .018, 1.0, .078);
      });
      bassVoice(ch.bass, bt + .02, beat * .94, .165);
      bassVoice(ch.bass + 7, bt + 2 * beat, beat * .84, .12);
      softKick(bt + .01, .112); softKick(bt + 2 * beat, .076);
      for (let q=1; q<4; q++) brush(bt + q * beat + .01, q === 2 ? .058 : .044, .078);
      if (b % 2 === 0) {
        keyVoice(ch.mel[0], bt + 1.5 * beat, .72, .067);
        keyVoice(ch.mel[1], bt + 3.25 * beat, .63, .055);
        bellTone(ch.mel[2], bt + 3.48 * beat, .56, .03);
      } else {
        keyVoice(ch.mel[2], bt + 3.1 * beat, .68, .05);
      }
    });
  }

  function createRainSource(){
    if(!audioCtx || !rainGain || rainSource) return;
    const seconds = 2.8;
    const len = Math.floor(audioCtx.sampleRate * seconds);
    const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    let smooth = 0;
    for(let i=0;i<len;i++){
      const white = Math.random()*2-1;
      smooth = smooth*.84 + white*.16;
      data[i] = (white*.54 + smooth*.46) * .7;
    }
    rainSource = audioCtx.createBufferSource();
    rainSource.buffer = buf;
    rainSource.loop = true;
    rainSource.connect(rainGain);
    rainSource.start();
  }

  function updateRainUi(){
    const btn = document.getElementById('catRainBtn');
    if(btn){
      btn.classList.toggle('active', state.rainOn);
      btn.textContent = state.rainOn ? '🌧 Hujan on' : '🌧 Hujan off';
    }
    if(rainEl) rainEl.classList.toggle('on', state.rainOn);
  }

  function setRainAudio(active){
    if(!audioCtx || !rainGain) return;
    if(active){
      createRainSource();
      rainGain.gain.cancelScheduledValues(audioCtx.currentTime);
      rainGain.gain.setTargetAtTime(.12, audioCtx.currentTime, .15);
    } else {
      rainGain.gain.cancelScheduledValues(audioCtx.currentTime);
      rainGain.gain.setTargetAtTime(.0001, audioCtx.currentTime, .15);
    }
  }

  function toggleRain(){
    state.rainOn = !state.rainOn;
    localStorage.setItem('agis_cat_lobby_rain', state.rainOn ? '1' : '0');
    updateRainUi();
    try{
      ensureAudio();
      audioCtx.resume();
      setRainAudio(state.rainOn);
    }catch(e){}
    setMood(state.rainOn ? 'Hujan malam nyala. Lobby jadi makin adem.' : 'Hujan reda. Tinggal musik lobby dan langkah si meong.');
    showBubble(state.rainOn ? 'adem...' : 'hujan reda');
  }

  function startMusic(){
    musicOn = true;
    const btn = document.getElementById('catMusic');
    if (btn) { btn.classList.add('active'); btn.textContent = '♫ Lobby on'; }
    try {
      ensureAudio();
      audioCtx.resume();
      applyVolumeValue(state.volume);
      setRainAudio(state.rainOn);
      scheduleLoop();
      clearInterval(musicTimer);
      musicTimer = setInterval(scheduleLoop, Math.round((60 / 74) * 4 * 4 * 1000));
    } catch (e) { musicOn = false; }
  }

  function stopMusic(){
    musicOn = false;
    clearInterval(musicTimer); musicTimer = null;
    activeNodes.forEach(n => { try { n.stop(); } catch (e) {} }); activeNodes = [];
    if (audioCtx) {
      try {
        if(state.rainOn){
          masterGain?.gain.setTargetAtTime(1.55 * (state.volume/100), audioCtx.currentTime, .06);
          setRainAudio(true);
        } else {
          masterGain?.gain.setTargetAtTime(.0001, audioCtx.currentTime, .03);
          setTimeout(() => { try { audioCtx.suspend(); } catch (e) {} }, 110);
        }
      } catch (e) {}
    }
  }

  function toggleMusic(){
    const btn = document.getElementById('catMusic');
    if (musicOn) {
      stopMusic();
      if (btn) { btn.classList.remove('active'); btn.textContent = '♫ Lobby off'; }
    } else startMusic();
  }

  function chime(){ if(!audioCtx || !musicOn) return; const t=audioCtx.currentTime; [72,76,79].forEach((m,i)=> keyVoice(m, t + i * .12, 1.05, .095)); }
  function purrTone(){ if(!audioCtx || !musicOn) return; const t=audioCtx.currentTime; bassVoice(45, t, .42, .12); bassVoice(47, t + .17, .36, .08); }

  function installTrigger(){
    const settings = [...document.querySelectorAll('.nav-item')].find(x => x.getAttribute('aria-label') === 'Pengaturan');
    if (!settings) return;
    let taps = [];
    settings.addEventListener('click', () => {
      const stamp = Date.now();
      taps = taps.filter(t => stamp - t < 3000);
      taps.push(stamp);
      if (taps.length >= 7) {
        taps = [];
        setTimeout(open, 120);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installTrigger);
  else installTrigger();

  window.openSudokuEasterEgg = open;
  window.openCatEasterEgg = open;
})();
