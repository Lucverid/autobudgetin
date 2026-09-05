
(() => {
  'use strict';

  const PET_KEY = 'agis_cat_after_hours_v25_5_0';
  const MAX_HEARTS = 5;
  const MAX_HUNGER = 4;
  const HALF_DAY_MS = 12 * 60 * 60 * 1000;

  let audioCtx = null, musicOn = false, musicTimer = null, masterGain = null, musicBus = null, compressor = null;
  let rainSource = null, rainGain = null, rainFilter = null;
  let activeNodes = [];
  let rafId = null, timerId = null, wanderTimer = null, idleTimer = null, mouseTimer = null;
  let sceneEl = null, catEl = null, mouseEl = null, bubbleEl = null, moodEl = null, timerEl = null, volumeEl = null;
  let heartsEl = null, moodBarEl = null, moodNumEl = null, foodEl = null, hungerEl = null, dailyEl = null, rainEl = null, toyEl = null, dailyChipEl = null;
  let feedBtn = null, reviveBtn = null, musicBtn = null, rainBtn = null, toyBtn = null, mouseBtn = null;
  let startedAt = 0, lastSceneWidth = 0, lastSceneHeight = 0;

  const state = {
    volume: clamp(Number(localStorage.getItem('agis_cat_lobby_volume') || 138), 70, 210),
    rainOn: localStorage.getItem('agis_cat_lobby_rain') === '1',
    toyMode: false,
    lastInteraction: Date.now(),
    cat: {
      x: 88, y: 248, targetX: 88, targetY: 248, speed: 46, chaseSpeed: 108,
      facingLeft: true, mode: 'idle', seatUntil: 0, pauseUntil: 0, goal: 'wander', lastTick: 0,
      vx: 0, vy: 0, bob: 0
    },
    mouse: { visible: false, x: 260, y: 248, vx: 16, phase: 0, spawnAt: 0 },
    toy: { visible: false, x: 230, y: 222, bounce: 0 },
    pet: loadPet(),
    dailyFinanceStatus: 'AMAN'
  };

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function rand(min, max){ return Math.random() * (max - min) + min; }
  function chance(n){ return Math.random() < n; }
  function todayKey(){
    if (typeof localDateKey === 'function') return localDateKey();
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function fmtRp(n){
    const num = Math.round(Number(n)||0);
    if (typeof fmt === 'function') return fmt(num);
    return `Rp ${num.toLocaleString('id-ID')}`;
  }

  function defaultPet(){
    return {
      hearts: 3,
      mood: 76,
      food: 0,
      hunger: 2,
      alive: true,
      lastDecayAt: Date.now(),
      lastFoodGrantDate: '',
      lastSpendEvalDate: '',
      lastSpendNote: 'Belum ada evaluasi harian.',
      thanksCounter: 0
    };
  }
  function loadPet(){ try{ return Object.assign(defaultPet(), JSON.parse(localStorage.getItem(PET_KEY)||'{}')); }catch{ return defaultPet(); } }
  function savePet(){ localStorage.setItem(PET_KEY, JSON.stringify(state.pet)); }

  function readTransactions(){ try{ return Array.isArray(window.store?.trans) ? window.store.trans : []; }catch{ return []; } }
  function expenseForDate(dateKey){ return readTransactions().filter(x=>String(x.tanggal||'').startsWith(dateKey) && x.kategori !== 'Penyesuaian Saldo').reduce((s,x)=>s+(Number(x.nominal)||0),0); }
  function txCountForDate(dateKey){ return readTransactions().filter(x=>String(x.tanggal||'').startsWith(dateKey) && x.kategori !== 'Penyesuaian Saldo').length; }

  function financeStatusByAmount(total){
    if (total === 0 || total <= 10000) return 'AMAN';
    if (total <= 20000) return 'CUKUP';
    if (total <= 40000) return 'KRITIS';
    return 'END';
  }

  function syncFoodReward(){
    const today = todayKey();
    const txCount = txCountForDate(today);
    if (txCount > 0 && state.pet.lastFoodGrantDate !== today) {
      state.pet.food += 2;
      state.pet.lastFoodGrantDate = today;
      state.pet.lastSpendNote = `Hari ini kamu catat transaksi, jadi dapat +2 pakan. Stok pakan ${state.pet.food}.`;
      savePet();
      if (document.getElementById('catEggOverlay')?.classList.contains('open')) {
        showBubble('+2 pakan');
        burst(state.cat.x + 34, state.cat.y - 6, '+2 food');
      }
    }
  }

  function evaluateSpendProgress(){
    const today = todayKey();
    if (state.pet.lastSpendEvalDate === today) return;
    const total = expenseForDate(today);
    const status = financeStatusByAmount(total);
    state.dailyFinanceStatus = status;
    let note = `Pengeluaran hari ini ${fmtRp(total)} · status ${status}.`;

    if (total === 0) {
      state.pet.hearts = MAX_HEARTS;
      state.pet.mood = 100;
      note = 'No-spend hari ini: hati full, mood si meong super bahagia.';
      showBubbleSafe('full hati!');
    } else if (total < 10000) {
      state.pet.hearts = clamp(state.pet.hearts + 2, 0, MAX_HEARTS);
      state.pet.mood = clamp(state.pet.mood + 18, 0, 100);
      note = `Pengeluaran ${fmtRp(total)} · status AMAN, bonus +2 hati.`;
      showBubbleSafe('+2 hati');
    } else if (total < 20000) {
      state.pet.hearts = clamp(state.pet.hearts + 1, 0, MAX_HEARTS);
      state.pet.mood = clamp(state.pet.mood + 10, 0, 100);
      note = `Pengeluaran ${fmtRp(total)} · status CUKUP, bonus +1 hati.`;
      showBubbleSafe('+1 hati');
    } else if (status === 'KRITIS') {
      state.pet.mood = clamp(state.pet.mood - 18, 0, 100);
      note = `Pengeluaran ${fmtRp(total)} · status KRITIS, si meong jadi bad mood.`;
    } else if (status === 'END') {
      state.pet.mood = clamp(state.pet.mood - 28, 0, 100);
      note = `Pengeluaran ${fmtRp(total)} · status END, si meong lesu banget.`;
    }

    state.pet.lastSpendEvalDate = today;
    state.pet.lastSpendNote = note;
    savePet();
  }

  function refreshDailyFinanceStatus(){
    const total = expenseForDate(todayKey());
    state.dailyFinanceStatus = financeStatusByAmount(total);
  }

  function effectiveMood(){
    const delta = state.dailyFinanceStatus === 'AMAN' ? 10 : state.dailyFinanceStatus === 'CUKUP' ? 0 : state.dailyFinanceStatus === 'KRITIS' ? -24 : -42;
    return clamp((Number(state.pet.mood)||0) + delta, 0, 100);
  }

  function showBubbleSafe(text){ if (document.getElementById('catEggOverlay')) showBubble(text); }

  function advancePetClock(){
    const elapsed = Math.max(0, Date.now() - Number(state.pet.lastDecayAt || Date.now()));
    const steps = Math.floor(elapsed / HALF_DAY_MS);
    if (steps <= 0) return;
    for (let i=0;i<steps;i++) {
      if (state.pet.alive) {
        if (state.pet.hunger > 0) {
          state.pet.hunger = clamp(state.pet.hunger - 1, 0, MAX_HUNGER);
          state.pet.mood = clamp(state.pet.mood - 8, 0, 100);
        } else {
          state.pet.hearts = clamp(state.pet.hearts - 1, 0, MAX_HEARTS);
          state.pet.mood = clamp(state.pet.mood - 14, 0, 100);
          if (state.pet.hearts <= 0) {
            state.pet.alive = false;
            state.pet.hearts = 0;
            state.pet.lastSpendNote = 'Si meong tumbang karena kelaparan. Bantu hidupkan lagi pakai hati + 2 pakan.';
          }
        }
      }
    }
    state.pet.lastDecayAt = Date.now();
    savePet();
  }

  function heartsMarkup(count){
    let out = '';
    for (let i=0;i<MAX_HEARTS;i++) out += `<i class="cat-heart ${i < count ? 'full' : ''}">♥</i>`;
    return out;
  }

  function build(){
    if (document.getElementById('catEggOverlay')) return;
    const el = document.createElement('div');
    el.id = 'catEggOverlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="cat-lounge" role="dialog" aria-modal="true" aria-label="Cat After Hours">
        <div class="cat-lounge-head">
          <div>
            <div class="cat-lounge-kicker">hidden lounge</div>
            <div class="cat-lounge-title">Cat After Hours</div>
            <div class="cat-lounge-sub">Ruang malam kecil buat nemenin kamu: lebih lega, lebih tenang, dan si meong tetap bereaksi ke kebiasaan finansial harianmu.</div>
          </div>
          <button class="cat-icon-btn" id="catClose" aria-label="Tutup">✕</button>
        </div>

        <div class="cat-toolbar">
          <button class="cat-tool active" id="catMusic">♫ Lobby on</button>
          <button class="cat-tool" id="catRainBtn">🌧 Hujan off</button>
          <button class="cat-tool" id="catToyBtn">🧶 Mainan off</button>
          <button class="cat-tool" id="catMouseBtn">🐭 Tikus</button>
          <label class="cat-volume-wrap" for="catVolume">🔊 <input id="catVolume" type="range" min="70" max="210" step="1"></label>
        </div>

        <div class="cat-scene" id="catScene">
          <div class="cat-scene-hud">
            <div class="scene-hud-pill scene-hearts" id="catHearts"></div>
            <div class="scene-hud-pill scene-mood"><span>Mood</span><div class="cat-meter"><span id="catMoodBar"></span></div><b id="catMoodNum">0%</b></div>
            <div class="scene-hud-pill scene-food"><span>Pakan</span><b id="catFood">0</b></div>
            <div class="scene-hud-pill scene-hunger"><span>Perut</span><b id="catHunger">0/4</b></div>
            <div class="scene-hud-pill scene-daily" id="catDailyChip">AMAN</div>
          </div>

          <div class="cat-city-glow"></div>
          <div class="cat-rain" id="catRain"><span class="rain-layer a"></span><span class="rain-layer b"></span><span class="rain-splashes"></span></div>
          <div class="cat-window"><i></i><i></i><i></i><i></i><em></em><u></u></div>
          <div class="cat-wall-frame"></div>
          <div class="cat-lamp"></div>
          <div class="cat-couch"></div>
          <div class="cat-table"></div>
          <div class="cat-plant"></div>
          <div class="cat-rug"></div>
          <div class="cat-reflection"></div>
          <div class="cat-bubble" id="catBubble">purrr...</div>
          <button class="toy-avatar hidden" id="catToy" aria-label="Mainan kucing"><span>🧶</span></button>
          <button class="mouse-avatar hidden" id="catMouse" aria-label="Tikus kecil"><span class="mouse-sprite-img" aria-hidden="true"></span></button>
          <button class="cat-avatar" id="catPet" aria-label="Pat pat kucing">
            <span class="cat-sprite-img" aria-hidden="true"></span>
            <span class="cat-eye left" aria-hidden="true"></span>
            <span class="cat-eye right" aria-hidden="true"></span>
            <span class="cat-wet-shine" aria-hidden="true"></span>
          </button>
        </div>

        <div class="cat-actions-row">
          <button class="cat-action-primary" id="catFeedBtn">🍗 Feed</button>
          <button class="cat-action-secondary" id="catReviveBtn">💖 Revive</button>
          <div class="cat-daily-note" id="catDaily">Belum ada evaluasi harian.</div>
        </div>

        <div class="cat-status">
          <span id="catMood">Meong lagi jalan santai di lobby malam.</span>
          <span>Waktu tenang <strong id="catTime">00:00</strong></span>
        </div>
      </div>`;
    document.body.appendChild(el);

    sceneEl = document.getElementById('catScene');
    catEl = document.getElementById('catPet');
    mouseEl = document.getElementById('catMouse');
    toyEl = document.getElementById('catToy');
    bubbleEl = document.getElementById('catBubble');
    moodEl = document.getElementById('catMood');
    timerEl = document.getElementById('catTime');
    volumeEl = document.getElementById('catVolume');
    heartsEl = document.getElementById('catHearts');
    moodBarEl = document.getElementById('catMoodBar');
    moodNumEl = document.getElementById('catMoodNum');
    foodEl = document.getElementById('catFood');
    hungerEl = document.getElementById('catHunger');
    dailyEl = document.getElementById('catDaily');
    dailyChipEl = document.getElementById('catDailyChip');
    rainEl = document.getElementById('catRain');
    feedBtn = document.getElementById('catFeedBtn');
    reviveBtn = document.getElementById('catReviveBtn');
    musicBtn = document.getElementById('catMusic');
    rainBtn = document.getElementById('catRainBtn');
    toyBtn = document.getElementById('catToyBtn');
    mouseBtn = document.getElementById('catMouseBtn');
    volumeEl.value = String(state.volume);

    document.getElementById('catClose').onclick = close;
    musicBtn.onclick = () => { registerInteraction(); toggleMusic(); };
    rainBtn.onclick = () => { registerInteraction(); toggleRain(); };
    toyBtn.onclick = () => { registerInteraction(); toggleToyMode(); };
    mouseBtn.onclick = () => { registerInteraction(); spawnMouse(true); };
    feedBtn.onclick = () => { registerInteraction(); feedCat(); };
    reviveBtn.onclick = () => { registerInteraction(); reviveCat(); };
    catEl.onclick = () => { registerInteraction(); petCat(); };
    mouseEl.onclick = () => { registerInteraction(); scareMouse(); };
    volumeEl.addEventListener('input', () => { registerInteraction(); applyVolumeValue(volumeEl.value); });
    sceneEl.addEventListener('pointerdown', onScenePointerDown);
    sceneEl.addEventListener('pointermove', onScenePointerMove);
    el.addEventListener('click', e => { if (e.target === el) close(); });
    window.addEventListener('resize', syncSceneBounds);
    document.addEventListener('keydown', keyHandler);

    renderHud();
    updateRainUi();
  }

  function onScenePointerDown(e){ registerInteraction(); if (state.pet.alive && state.toyMode) placeToyAtEvent(e, true); }
  function onScenePointerMove(e){ if (state.pet.alive && state.toyMode && state.toy.visible) placeToyAtEvent(e, false); }
  function placeToyAtEvent(e, bursty){
    const rect = sceneEl.getBoundingClientRect();
    const b = sceneBounds();
    state.toy.visible = true;
    state.toy.x = clamp(e.clientX - rect.left - 16, b.left + 20, b.right + 14);
    state.toy.y = clamp(e.clientY - rect.top - 16, b.floor - 90, b.floor + 4);
    state.toy.bounce = 1;
    toyEl.classList.remove('hidden');
    hideMouse(false);
    state.cat.goal = 'toy';
    state.cat.mode = 'play';
    if (bursty) showBubble('main dong~');
    setMood('Mainan digeser. Si meong ngikutin dengan gaya lucu.');
  }

  function keyHandler(e){
    const ov = document.getElementById('catEggOverlay');
    if (!ov || !ov.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key.toLowerCase() === 'm') toggleMusic();
    if (e.key.toLowerCase() === 'r') toggleRain();
    if (e.key.toLowerCase() === 't') toggleToyMode();
    if (e.key.toLowerCase() === 'f') feedCat();
  }

  function open(){
    build();
    advancePetClock();
    syncFoodReward();
    evaluateSpendProgress();
    refreshDailyFinanceStatus();
    const ov = document.getElementById('catEggOverlay');
    ov.classList.add('open');
    ov.setAttribute('aria-hidden', 'false');
    startScene();
    startMusic();
  }
  function close(){
    const ov = document.getElementById('catEggOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    ov.setAttribute('aria-hidden', 'true');
    stopScene();
    stopMusic();
    if (audioCtx) { try{ setRainAudio(false); setTimeout(()=>audioCtx.suspend(), 120); }catch{} }
  }

  function startScene(){
    build();
    startedAt = Date.now();
    state.lastInteraction = Date.now();
    syncSceneBounds();
    state.cat.lastTick = 0;
    state.cat.mode = state.pet.alive ? 'idle' : 'dead';
    state.cat.goal = 'wander';
    chooseWanderTarget(true);
    clearInterval(timerId); timerId = setInterval(updateTime, 1000); updateTime();
    clearInterval(wanderTimer); wanderTimer = setInterval(sceneDecisionLoop, 2400);
    clearInterval(mouseTimer); mouseTimer = setInterval(()=>{ if(state.pet.alive && !state.toy.visible && !state.mouse.visible && chance(0.28)) spawnMouse(false); }, 5600);
    clearInterval(idleTimer); idleTimer = setInterval(checkIdleScene, 1800);
    cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick);
    renderHud(); renderSceneClasses(); renderActors();
  }
  function stopScene(){
    clearInterval(timerId); clearInterval(wanderTimer); clearInterval(mouseTimer); clearInterval(idleTimer);
    timerId = wanderTimer = mouseTimer = idleTimer = null;
    cancelAnimationFrame(rafId); rafId = null;
    hideBubble();
  }

  function registerInteraction(){ state.lastInteraction = Date.now(); if (state.cat.mode === 'sleep') state.cat.mode = 'idle'; }
  function updateTime(){ const s=Math.floor((Date.now()-startedAt)/1000), m=Math.floor(s/60); if(timerEl) timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
  function sceneBounds(){
    const w=sceneEl?sceneEl.clientWidth:0, h=sceneEl?sceneEl.clientHeight:0;
    return { w, h, left:18, right:Math.max(18, w-104), floor:Math.max(150, h-82), couchX:Math.max(28, w-170), couchY:Math.max(138, h-205) };
  }
  function syncSceneBounds(){
    if(!sceneEl) return;
    const b=sceneBounds();
    if(!b.w || !b.h) return;
    if(!lastSceneWidth){
      state.cat.x = b.left + 36; state.cat.y = b.floor;
      state.cat.targetX = state.cat.x; state.cat.targetY = state.cat.y;
      state.mouse.x = b.w * .56; state.mouse.y = b.floor;
      state.toy.x = b.w * .42; state.toy.y = b.floor - 20;
    } else {
      const sx=b.w/lastSceneWidth, sy=b.h/lastSceneHeight;
      state.cat.x = clamp(state.cat.x*sx, b.left, b.right); state.cat.targetX = clamp(state.cat.targetX*sx, b.left, b.right);
      state.cat.y = clamp(state.cat.y*sy, b.floor-84, b.floor+10); state.cat.targetY = clamp(state.cat.targetY*sy, b.floor-84, b.floor+10);
      state.mouse.x = clamp(state.mouse.x*sx, b.left+20, b.w-48); state.mouse.y = clamp(state.mouse.y*sy, b.floor-8, b.floor+6);
      state.toy.x = clamp(state.toy.x*sx, b.left+12, b.right+12); state.toy.y = clamp(state.toy.y*sy, b.floor-90, b.floor+8);
    }
    lastSceneWidth=b.w; lastSceneHeight=b.h;
    renderActors();
  }

  function setCouchTarget(){
    const b = sceneBounds();
    state.cat.goal = 'couch';
    state.cat.targetX = b.couchX;
    state.cat.targetY = b.couchY;
    state.cat.seatUntil = Date.now() + 5600;
    state.cat.pauseUntil = 0;
    setMood('Si meong naik ke sofa, duduk santai sebentar kayak bos lobby.');
  }
  function chooseWanderTarget(initial){
    if(!state.pet.alive) return;
    const b=sceneBounds();
    state.cat.goal = 'wander';
    state.cat.pauseUntil = 0;
    const span = Math.max(48, (b.right - b.left) * 0.24);
    const center = clamp(state.cat.x || (b.left + 40), b.left + 20, b.right - 20);
    state.cat.targetX = clamp(center + rand(-span, span), b.left + 8, b.right - 8);
    state.cat.targetY = rand(b.floor-4, b.floor+1);
    if(!initial){
      const moods=[
        'Dia muter pelan kayak satpam lobby versi imut.',
        'Si meong jalan santai sambil nguping suara hujan.',
        'Langkahnya lebih natural sekarang, nggak kaku lagi.',
        'Meong lagi inspeksi karpet dan sudut lobby.'
      ];
      setMood(moods[Math.floor(Math.random()*moods.length)]);
    }
  }

  function sceneDecisionLoop(){
    refreshDailyFinanceStatus();
    renderHud();
    if (!state.pet.alive) return;
    if (state.toy.visible || state.mouse.visible) return;
    if (Date.now() < state.cat.seatUntil && state.cat.goal === 'couch') return;
    if (Date.now() < state.cat.pauseUntil) return;
    state.cat.pauseUntil = 0;
    if (chance(0.18)) setCouchTarget();
    else chooseWanderTarget(false);
  }

  function checkIdleScene(){
    if(!state.pet.alive) return;
    if (Date.now() - state.lastInteraction > 18000 && !state.toy.visible && !state.mouse.visible && state.cat.goal !== 'couch') {
      state.cat.mode = 'sleep';
      setMood(state.rainOn ? 'Si meong ketiduran ditemenin hujan malam.' : 'Si meong ketiduran pelan di lobby.');
      showBubble(Math.random()>.5 ? 'zzz...' : 'purrr...');
    }
  }

  function spawnMouse(manual){
    if(!state.pet.alive) return;
    const b=sceneBounds();
    state.mouse.visible = true;
    state.mouse.x = rand(b.left+60, b.w-54);
    state.mouse.y = rand(b.floor-3, b.floor+2);
    state.mouse.vx = Math.random()>.5 ? 14 : -14;
    state.mouse.phase = 0;
    state.mouse.spawnAt = Date.now();
    mouseEl.classList.remove('hidden');
    hideToy();
    state.cat.goal = 'mouse';
    state.cat.mode = 'run';
    if (manual) showBubble('aku kejar!');
    setMood(manual ? 'Tikus muncul. Si meong lincah dan jauh lebih cepat ngejar.' : 'Ada tikus kecil lewat. Meong langsung fokus.');
  }

  function hideMouse(pickNew = true){
    state.mouse.visible = false;
    state.mouse.spawnAt = 0;
    mouseEl?.classList.add('hidden');
    if (state.cat.goal === 'mouse') {
      state.cat.goal = 'wander';
      state.cat.mode = 'idle';
      state.cat.vx *= 0.35;
      state.cat.vy *= 0.35;
      if (pickNew) chooseWanderTarget(false);
    }
  }
  function hideToy(){ state.toy.visible = false; toyEl?.classList.add('hidden'); if (state.cat.goal === 'toy') chooseWanderTarget(false); }

  function toggleToyMode(){
    state.toyMode = !state.toyMode;
    toyBtn.classList.toggle('active', state.toyMode);
    toyBtn.textContent = state.toyMode ? '🧶 Mainan on' : '🧶 Mainan off';
    if(!state.toyMode) hideToy();
    setMood(state.toyMode ? 'Klik / geser di scene untuk ngarahin mainan. Si meong bakal ngikutin.' : 'Mainannya disimpan dulu.');
  }
  function scareMouse(){ if(!state.mouse.visible) return; state.mouse.vx *= -1; showBubble('ciit!'); setMood('Tikus panik, si meong jadi makin semangat.'); }

  function feedCat(){
    if(!state.pet.alive){ showBubble('butuh revive'); setMood('Dia belum bisa makan. Hidupkan dulu.'); return; }
    if(state.pet.food <= 0){ showBubble('pakan habis'); setMood('Catat transaksi hari ini biar dapat +2 pakan.'); return; }
    state.pet.food -= 1;
    state.pet.hunger = clamp(state.pet.hunger + 1, 0, MAX_HUNGER);
    state.pet.mood = clamp(state.pet.mood + 12, 0, 100);
    state.pet.lastDecayAt = Date.now();
    state.pet.thanksCounter += 1;
    savePet();
    renderHud();
    showBubble('nyam nyam~');
    burst(state.cat.x + 36, state.cat.y - 12, 'makasih!');
    setMood(['Dia makan lucu banget lalu noleh berterima kasih.', 'Si meong kenyang dan manja.', 'Habis makan dia kelihatan lebih happy.'][Math.floor(Math.random()*3)]);
    chime();
  }

  function reviveCat(){
    if(state.pet.alive){ showBubble('masih hidup'); setMood('Dia masih hidup, tinggal dijaga aja.'); return; }
    if(state.pet.hearts <= 0){ showBubble('butuh hati'); setMood('Belum ada hati cukup untuk balikin dia.'); return; }
    if(state.pet.food < 2){ showBubble('2 pakan dulu'); setMood('Siapkan minimal 2 pakan dulu buat revive.'); return; }
    state.pet.food -= 2;
    state.pet.hunger = 2;
    state.pet.alive = true;
    state.pet.mood = clamp(Math.max(state.pet.mood, 60), 0, 100);
    state.pet.lastDecayAt = Date.now();
    savePet();
    catEl.classList.add('reviving');
    showBubble('meow... hidup lagi!');
    burst(state.cat.x+36, state.cat.y-14, '❤ hidup!');
    setMood('Si meong bangun lagi, terus kayak bilang makasih.');
    renderHud(); renderSceneClasses(); chooseWanderTarget(false); chime();
    setTimeout(()=>catEl?.classList.remove('reviving'), 900);
  }

  function petCat(){
    if(!state.pet.alive){ showBubble('...'); setMood('Dia lemas. Coba revive dia.'); return; }
    state.pet.mood = clamp(state.pet.mood + 6, 0, 100);
    savePet(); renderHud();
    catEl.classList.remove('petted'); void catEl.offsetWidth; catEl.classList.add('petted');
    showBubble(Math.random()>.5 ? 'pat pat ❤' : 'purrr~');
    burst(state.cat.x+16, state.cat.y-16, '❤');
    setMood(['Purrr... dia seneng dipat-pat.', 'Si meong manja banget sekarang.', 'Dia ngeliat kamu kayak bilang makasih.'][Math.floor(Math.random()*3)]);
    purrTone();
    setTimeout(()=>catEl?.classList.remove('petted'), 650);
  }

  function updateMouse(dt){
    if(!state.mouse.visible) return;
    const b=sceneBounds();
    state.mouse.phase += dt * 0.0042;
    state.mouse.x += state.mouse.vx * dt * 0.001;
    state.mouse.y = b.floor + Math.sin(state.mouse.phase * 5.2) * 2.1;
    if (state.mouse.x < b.left + 14 || state.mouse.x > b.w - 52) state.mouse.vx *= -1;
    if (state.mouse.spawnAt && Date.now() - state.mouse.spawnAt > 8000) hideMouse(true);
  }
  function updateToy(dt){ if(state.toy.visible) state.toy.bounce = Math.max(0, state.toy.bounce - dt * 0.0033); }

  function tick(ts){
    if(!sceneEl){ rafId=requestAnimationFrame(tick); return; }
    const b = sceneBounds();
    const last = state.cat.lastTick || ts;
    const dt = clamp(ts - last, 16, 40);
    state.cat.lastTick = ts;
    state.cat.bob += dt * (state.cat.mode === 'run' ? 0.021 : state.cat.mode === 'walk' ? 0.014 : 0.008);
    updateMouse(dt); updateToy(dt);

    if (state.pet.alive) {
      if (state.mouse.visible) {
        state.cat.goal = 'mouse';
        state.cat.targetX = clamp(state.mouse.x - 10, b.left, b.right);
        state.cat.targetY = state.mouse.y;
      } else if (state.toy.visible) {
        state.cat.goal = 'toy';
        state.cat.targetX = clamp(state.toy.x - 10, b.left, b.right);
        state.cat.targetY = clamp(state.toy.y + 18, b.floor - 10, b.floor + 4);
      }

      const dx = state.cat.targetX - state.cat.x;
      const dy = state.cat.targetY - state.cat.y;
      const dist = Math.hypot(dx, dy);
      const sleeping = state.cat.mode === 'sleep' && !state.mouse.visible && !state.toy.visible && state.cat.goal !== 'couch';
      const speed = state.cat.goal === 'mouse' ? state.cat.chaseSpeed : state.cat.goal === 'toy' ? state.cat.chaseSpeed * 0.88 : state.cat.speed;

      if (!sleeping) {
        if (dist > 0.9) {
          const desiredVx = dx / Math.max(dist, 1) * speed;
          const desiredVy = dy / Math.max(dist, 1) * speed;
          const smoothing = state.cat.goal === 'mouse' ? 0.13 : state.cat.goal === 'toy' ? 0.12 : 0.085;
          state.cat.vx += (desiredVx - state.cat.vx) * smoothing;
          state.cat.vy += (desiredVy - state.cat.vy) * smoothing;
          state.cat.x += state.cat.vx * dt * 0.001;
          state.cat.y += state.cat.vy * dt * 0.001;
          if (Math.abs(state.cat.vx) > 1.2) state.cat.facingLeft = state.cat.vx < 0;
          if (state.cat.goal === 'mouse') state.cat.mode = 'run';
          else if (state.cat.goal === 'toy') state.cat.mode = 'play';
          else state.cat.mode = 'walk';
        } else {
          state.cat.vx *= 0.82;
          state.cat.vy *= 0.82;
          if (state.cat.goal === 'mouse' && state.mouse.visible) {
            if (Math.abs(state.cat.x - state.mouse.x) < 28) {
              showBubble('gotcha!');
              burst(state.cat.x + 30, state.cat.y - 8, 'tap!');
              hideMouse(true);
              setMood('Tikus ketangkep. Si meong langsung sok keren.');
              chime();
            }
          } else if (state.cat.goal === 'toy' && state.toy.visible) {
            state.cat.mode = 'play';
            if (Math.abs(state.cat.x - state.toy.x) < 16) {
              burst(state.cat.x + 30, state.cat.y - 8, 'hehe!');
              state.toy.bounce = 1;
            }
          } else if (state.cat.goal === 'couch') {
            state.cat.mode = 'sit';
            if (Date.now() > state.cat.seatUntil) chooseWanderTarget(false);
          } else if (state.cat.mode !== 'sleep') {
            state.cat.mode = 'idle';
            if (state.cat.goal === 'wander' && !state.cat.pauseUntil) {
              state.cat.pauseUntil = Date.now() + rand(900, 1900);
            }
          }
        }
      }
    } else {
      state.cat.mode = 'dead';
      state.cat.vx *= 0.6; state.cat.vy *= 0.6;
    }

    renderActors(); renderSceneClasses();
    rafId=requestAnimationFrame(tick);
  }

  function renderActors(){
    if (catEl) {
      const flip = state.cat.facingLeft ? 1 : -1; // sprite default hadap kiri.
      const bobY = (state.cat.mode === 'walk' || state.cat.mode === 'run' || state.cat.mode === 'play') ? Math.sin(state.cat.bob) * 1.5 : 0;
      catEl.style.transform = `translate(${state.cat.x}px, ${state.cat.y + bobY}px) scaleX(${flip})`;
      const focusX = state.toy.visible ? state.toy.x : state.mouse.visible ? state.mouse.x : state.cat.targetX;
      const focusY = state.toy.visible ? state.toy.y : state.mouse.visible ? state.mouse.y : state.cat.targetY;
      const screenGX = clamp((focusX - state.cat.x) / 110, -1, 1) * 0.8;
      const screenGY = clamp((focusY - state.cat.y) / 88, -1, 1) * 0.6;
      catEl.style.setProperty('--gaze-x', `${screenGX * flip}px`);
      catEl.style.setProperty('--gaze-y', `${screenGY}px`);
    }
    if (mouseEl) mouseEl.style.transform = `translate(${state.mouse.x}px, ${state.mouse.y}px) scaleX(${state.mouse.vx < 0 ? -1 : 1})`;
    if (toyEl) toyEl.style.transform = `translate(${state.toy.x}px, ${state.toy.y - Math.sin((1-state.toy.bounce)*8) * state.toy.bounce * 8}px)`;
  }

  function renderSceneClasses(){
    if (!catEl || !sceneEl) return;
    catEl.classList.toggle('walking', state.cat.mode === 'walk');
    catEl.classList.toggle('chasing', state.cat.mode === 'run');
    catEl.classList.toggle('playful', state.cat.mode === 'play');
    catEl.classList.toggle('sleeping', state.cat.mode === 'sleep');
    catEl.classList.toggle('sitting', state.cat.mode === 'sit');
    catEl.classList.toggle('dead', !state.pet.alive);
    catEl.classList.toggle('wet', state.rainOn && state.pet.alive);
    catEl.classList.toggle('aman', state.dailyFinanceStatus === 'AMAN');
    catEl.classList.toggle('cukup', state.dailyFinanceStatus === 'CUKUP');
    catEl.classList.toggle('kritis', state.dailyFinanceStatus === 'KRITIS');
    catEl.classList.toggle('end', state.dailyFinanceStatus === 'END');
    sceneEl.classList.toggle('rain-on', state.rainOn);
    toyEl?.classList.toggle('hidden', !state.toy.visible);
  }

  function renderHud(){
    if (!heartsEl) return;
    heartsEl.innerHTML = heartsMarkup(state.pet.hearts);
    foodEl.textContent = String(state.pet.food);
    hungerEl.textContent = `${state.pet.hunger}/${MAX_HUNGER}`;
    const moodNow = effectiveMood();
    moodBarEl.style.width = `${moodNow}%`;
    moodNumEl.textContent = `${moodNow}%`;
    dailyEl.textContent = state.pet.lastSpendNote || 'Belum ada evaluasi harian.';
    dailyChipEl.textContent = state.dailyFinanceStatus;
    dailyChipEl.className = `scene-hud-pill scene-daily ${String(state.dailyFinanceStatus).toLowerCase()}`;
    feedBtn.disabled = !state.pet.alive;
    reviveBtn.disabled = state.pet.alive;
  }

  function setMood(text){ if(moodEl) moodEl.textContent = text; }
  function showBubble(text){
    if (!bubbleEl) return;
    bubbleEl.textContent = text;
    bubbleEl.classList.add('show');
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(hideBubble, 1400);
  }
  function hideBubble(){ bubbleEl?.classList.remove('show'); }
  function burst(x, y, text){
    if(!sceneEl) return;
    const el = document.createElement('div');
    el.className = 'cat-float'; el.textContent = text; el.style.left = `${x}px`; el.style.top = `${y}px`;
    sceneEl.appendChild(el);
    setTimeout(()=>el.remove(), 1100);
  }

  // audio
  const midiToHz = n => 440 * Math.pow(2, (n - 69) / 12);
  function remember(node){ activeNodes.push(node); node.addEventListener?.('ended',()=>{ activeNodes = activeNodes.filter(x=>x!==node); }); }
  function ensureAudio(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    musicBus = audioCtx.createGain();
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -22; compressor.knee.value = 22; compressor.ratio.value = 4.8; compressor.attack.value = 0.01; compressor.release.value = 0.28;
    musicBus.gain.value = 1.28; masterGain.gain.value = 1.8;
    musicBus.connect(compressor).connect(masterGain).connect(audioCtx.destination);
    rainGain = audioCtx.createGain(); rainGain.gain.value = 0.0001;
    rainFilter = audioCtx.createBiquadFilter(); rainFilter.type = 'highpass'; rainFilter.frequency.value = 220;
    rainGain.connect(rainFilter).connect(masterGain);
    applyVolumeValue(state.volume);
  }
  function applyVolumeValue(v){
    state.volume = clamp(Number(v || 138), 70, 210);
    localStorage.setItem('agis_cat_lobby_volume', String(state.volume));
    if(volumeEl) volumeEl.value = String(state.volume);
    if(masterGain && audioCtx){ masterGain.gain.setTargetAtTime(1.8 * (state.volume/100), audioCtx.currentTime, 0.04); }
  }
  function keyVoice(midi, when, dur=1.5, level=.19){ if(!audioCtx||!musicBus)return; const o1=audioCtx.createOscillator(),o2=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter(); o1.type='sine'; o2.type='triangle'; o1.frequency.value=midiToHz(midi); o2.frequency.value=midiToHz(midi)*2.004; f.type='lowpass'; f.frequency.setValueAtTime(2500,when); f.Q.value=.55; g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(level,when+.02); g.gain.exponentialRampToValueAtTime(level*.42,when+.24); g.gain.exponentialRampToValueAtTime(.0001,when+dur); const shimmer=audioCtx.createGain(); shimmer.gain.value=.18; o1.connect(g); o2.connect(shimmer).connect(g); g.connect(f).connect(musicBus); o1.start(when); o2.start(when); o1.stop(when+dur+.05); o2.stop(when+dur+.05); remember(o1); remember(o2); }
  function padVoice(midis, when, dur=3.4, level=.052){ if(!audioCtx||!musicBus)return; midis.forEach((m,i)=>{ const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter(); o.type=i%2?'triangle':'sine'; o.frequency.value=midiToHz(m)*(i===0?0.999:1.0015); f.type='lowpass'; f.frequency.value=1180; g.gain.setValueAtTime(.0001,when); g.gain.linearRampToValueAtTime(level,when+.62); g.gain.setValueAtTime(level,when+dur-.62); g.gain.exponentialRampToValueAtTime(.0001,when+dur); o.connect(f).connect(g).connect(musicBus); o.start(when); o.stop(when+dur+.08); remember(o); }); }
  function bassVoice(midi, when, dur=.92, level=.21){ if(!audioCtx||!musicBus)return; const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter(); o.type='triangle'; o.frequency.value=midiToHz(midi); f.type='lowpass'; f.frequency.value=450; g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(level,when+.032); g.gain.exponentialRampToValueAtTime(.0001,when+dur); o.connect(f).connect(g).connect(musicBus); o.start(when); o.stop(when+dur+.05); remember(o); }
  function brush(when, level=.072, dur=.095){ if(!audioCtx||!musicBus)return; const len=Math.max(1,Math.floor(audioCtx.sampleRate*dur)),buf=audioCtx.createBuffer(1,len,audioCtx.sampleRate),d=buf.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len); const src=audioCtx.createBufferSource(),f=audioCtx.createBiquadFilter(),g=audioCtx.createGain(); src.buffer=buf; f.type='highpass'; f.frequency.value=3300; g.gain.setValueAtTime(level,when); g.gain.exponentialRampToValueAtTime(.0001,when+dur); src.connect(f).connect(g).connect(musicBus); src.start(when); src.stop(when+dur+.02); remember(src); }
  function softKick(when, level=.15){ if(!audioCtx||!musicBus)return; const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type='sine'; o.frequency.setValueAtTime(90,when); o.frequency.exponentialRampToValueAtTime(46,when+.19); g.gain.setValueAtTime(level,when); g.gain.exponentialRampToValueAtTime(.0001,when+.34); o.connect(g).connect(musicBus); o.start(when); o.stop(when+.36); remember(o); }
  function bellTone(midi, when, dur=.8, level=.062){ if(!audioCtx||!musicBus)return; const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type='sine'; o.frequency.value=midiToHz(midi)*2; g.gain.setValueAtTime(.0001,when); g.gain.exponentialRampToValueAtTime(level,when+.01); g.gain.exponentialRampToValueAtTime(.0001,when+dur); o.connect(g).connect(musicBus); o.start(when); o.stop(when+dur+.04); remember(o); }
  function scheduleLoop(){
    if(!audioCtx||!musicOn) return;
    const beat=60/74, bar=beat*4, t=audioCtx.currentTime+.08;
    const chords=[
      {pad:[53,57,60,64,67], keys:[65,69,72,76], bass:41, mel:[76,74,72]},
      {pad:[52,55,59,62,67], keys:[64,67,71,74], bass:40, mel:[74,71,69]},
      {pad:[50,53,57,60,64], keys:[62,65,69,72], bass:38, mel:[72,69,67]},
      {pad:[48,52,55,59,62], keys:[60,64,67,71], bass:36, mel:[71,69,67]}
    ];
    chords.forEach((ch,b)=>{ const bt=t+b*bar; padVoice(ch.pad,bt,bar+.62,.038); [0,.5,2,2.5].forEach((off,j)=>{ const tone=ch.keys[j%ch.keys.length]; keyVoice(tone,bt+off*beat,1.1,j===0?.145:.116); if(j===0||j===2) keyVoice(ch.keys[(j+2)%ch.keys.length],bt+off*beat+.018,1.0,.082); }); bassVoice(ch.bass,bt+.02,beat*.94,.168); bassVoice(ch.bass+7,bt+2*beat,beat*.84,.124); softKick(bt+.01,.118); softKick(bt+2*beat,.082); for(let q=1;q<4;q++) brush(bt+q*beat+.01,q===2?.06:.046,.078); if(b%2===0){ keyVoice(ch.mel[0],bt+1.5*beat,.72,.069); keyVoice(ch.mel[1],bt+3.25*beat,.63,.056); bellTone(ch.mel[2],bt+3.48*beat,.56,.034); } else { keyVoice(ch.mel[2],bt+3.1*beat,.68,.052); } });
  }
  function startMusic(){ musicOn=true; if(musicBtn){ musicBtn.classList.add('active'); musicBtn.textContent='♫ Lobby on'; } try{ ensureAudio(); audioCtx.resume(); applyVolumeValue(state.volume); scheduleLoop(); clearInterval(musicTimer); musicTimer=setInterval(scheduleLoop, Math.round((60/74)*4*4*1000)); setRainAudio(state.rainOn); }catch{ musicOn=false; } }
  function stopMusic(){ musicOn=false; clearInterval(musicTimer); musicTimer=null; activeNodes.forEach(n=>{ try{n.stop()}catch{}}); activeNodes=[]; if(audioCtx){ try{ masterGain?.gain.setTargetAtTime(.0001,audioCtx.currentTime,.03); setTimeout(()=>{ try{ audioCtx.suspend(); }catch{} },110); }catch{} } }
  function toggleMusic(){ if(musicOn){ stopMusic(); if(musicBtn){ musicBtn.classList.remove('active'); musicBtn.textContent='♫ Lobby off'; } } else startMusic(); }
  function purrTone(){ if(!audioCtx||!musicOn)return; const t=audioCtx.currentTime; bassVoice(45,t,.42,.13); bassVoice(47,t+.17,.36,.09); }
  function chime(){ if(!audioCtx||!musicOn)return; const t=audioCtx.currentTime; [72,76,79].forEach((m,i)=>keyVoice(m,t+i*.12,1.05,.1)); }
  function createRainNoise(){ if(!audioCtx || rainSource) return; const buffer=audioCtx.createBuffer(1, audioCtx.sampleRate*2, audioCtx.sampleRate), data=buffer.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*.55; rainSource=audioCtx.createBufferSource(); rainSource.buffer=buffer; rainSource.loop=true; rainSource.connect(rainGain); rainSource.start(); }
  function setRainAudio(on){ if(!audioCtx) return; createRainNoise(); rainGain.gain.setTargetAtTime(on ? .12 : .0001, audioCtx.currentTime, .2); }
  function updateRainUi(){ if(rainBtn) rainBtn.textContent = state.rainOn ? '🌧 Hujan on' : '🌧 Hujan off'; rainBtn?.classList.toggle('active', state.rainOn); sceneEl?.classList.toggle('rain-on', state.rainOn); }
  function toggleRain(){ state.rainOn = !state.rainOn; localStorage.setItem('agis_cat_lobby_rain', state.rainOn ? '1' : '0'); updateRainUi(); renderSceneClasses(); setRainAudio(state.rainOn); setMood(state.rainOn ? 'Hujan lebih real sekarang, meong juga kelihatan agak basah.' : 'Hujan dimatikan. Lobby jadi lebih hangat.'); showBubble(state.rainOn ? 'gerimis...' : 'adem'); }

  function installTrigger(){
    const settings = [...document.querySelectorAll('.nav-item')].find(x => x.getAttribute('aria-label') === 'Pengaturan');
    if(!settings) return;
    let taps=[];
    settings.addEventListener('click',()=>{ const stamp=Date.now(); taps=taps.filter(t=>stamp-t<3000); taps.push(stamp); if(taps.length>=7){ taps=[]; setTimeout(open,120); } });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', installTrigger); else installTrigger();
  window.openSudokuEasterEgg = open;
  window.openCatEasterEgg = open;
})();
