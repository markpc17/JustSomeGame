'use strict';
// The game loop and everything the player can do.

const TALKS_PER_DAY = 2;
const MIN_PER_SEC = 6; // one real second = six ship minutes

const Game = {
  mode: 'title', paused: false, canvas: null, ctx: null, W: 0, H: 0, last: 0,
  keys: {}, pressed: {}, mapSel: null, mapAtHelm: false, cruise: null,

  init() {
    this.canvas = $('game');
    this.ctx = this.canvas.getContext('2d');
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.W = window.innerWidth; this.H = window.innerHeight;
      this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
      this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resize); resize();
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.setupTouch();
    this.titleScreen();
    requestAnimationFrame((t) => this.loop(t));
  },

  // ---------- input ----------
  onKey(e, down) {
    const k = e.key;
    if (down && document.activeElement && document.activeElement.tagName === 'INPUT') { if (k === 'Enter') $('btnNew').click(); return; }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(k)) e.preventDefault();
    if (down && !this.keys[k]) this.pressed[k] = true;
    this.keys[k] = down;
    if (!down) return;
    if (UI.active) { UI.key(k); return; }
    if (this.mode === 'title' || this.mode === 'ending') return;
    if (k === 'Escape') { if (UI.journalOpen()) UI.closeJournal(); else if (this.mode === 'map') this.closeMap(); else UI.journal('help'); return; }
    if (k === 'j' || k === 'J') { if (UI.journalOpen()) UI.closeJournal(); else UI.journal('crew'); return; }
    if (k === 'n' || k === 'N') { UI.toast(Audio2.toggle() ? 'Sound off' : 'Sound on'); return; }
    if ((k === 'm' || k === 'M') && (this.mode === 'ship' || this.mode === 'map')) { if (this.mode === 'map') this.closeMap(); else this.openMap(false); }
  },
  axis() {
    const k = this.keys;
    return {
      x: (k.ArrowRight || k.d || k.D ? 1 : 0) - (k.ArrowLeft || k.a || k.A ? 1 : 0),
      y: (k.ArrowDown || k.s || k.S ? 1 : 0) - (k.ArrowUp || k.w || k.W ? 1 : 0),
    };
  },
  consumeInteract() {
    const p = this.pressed;
    const hit = p.e || p.E || p[' '] || p.Enter;
    this.pressed = {};
    return hit;
  },
  setupTouch() {
    if (!('ontouchstart' in window) && !(navigator.maxTouchPoints > 0)) return;
    $('touch').classList.remove('hidden');
    document.querySelectorAll('#touch [data-k]').forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { e.preventDefault(); if (!this.keys[k]) this.pressed[k] = true; this.keys[k] = true; if (UI.active && k === 'e') UI.key('e'); };
      const off = (e) => { e.preventDefault(); this.keys[k] = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
    $('tJ').onclick = () => (UI.journalOpen() ? UI.closeJournal() : UI.journal('crew'));
    $('tM').onclick = () => { if (this.mode === 'map') this.closeMap(); else if (this.mode === 'ship') this.openMap(false); };
  },
  setPaused(p) { this.paused = p; },
  onModalsClosed() {
    const f = checkFailure();
    if (f && this.mode !== 'ending') this.ending(f);
  },

  // ---------- title & intro ----------
  titleScreen() {
    this.mode = 'title';
    $('title').classList.remove('hidden');
    $('btnContinue').classList.toggle('hidden', !hasSave());
    $('btnNew').onclick = () => {
      const name = ($('pname').value || '').trim() || 'Rook';
      Audio2.start();
      newGame(name);
      $('title').classList.add('hidden');
      this.intro();
    };
    $('btnContinue').onclick = () => {
      Audio2.start();
      if (!loadGame()) { UI.toast('Could not load the save.'); return; }
      $('title').classList.add('hidden');
      this.enterShip('quarters');
      UI.toast(`Welcome back, ${U.esc(S.playerName)}. Day ${S.day}.`);
    };
  },
  intro() {
    const timeline = LORE.map((l) => `<div class="tl"><b>${l.year}</b> <span>${l.title}.</span> ${l.text}</div>`).join('');
    this.enterShip('dome');
    UI.modal({
      title: 'After Tranquility',
      body: `<div class="timeline">${timeline}</div>`,
      choices: [{ label: 'Begin the voyage', raw: () => this.showEvent('last_look') }],
    });
    UI.modal({
      title: 'You',
      body: `You are <b>${U.esc(S.playerName)}</b>, twenty-five, elected Crew Liaison of the ISV Collins by the other ten volunteers. You aren\'t the pilot, the engineer or the doctor. Your job is harder: keep eleven young people sane, together and moving forward for as long as it takes to find a new home.<br><br>They are the brightest people Earth had left. They want to see everything. They want to have the time of their lives. They know they will never go back.<br><br><span class="dim">Walk with <b>WASD</b>. Talk and interact with <b>E</b>. Open your journal with <b>J</b> (the How to Play tab explains everything).</span>`,
      choices: [{ label: 'Continue', raw: () => {} }],
    });
  },

  // ---------- modes ----------
  enterShip(room) {
    this.mode = 'ship';
    if (!Ship.grid) Ship.build();
    Ship.spawnCrew();
    Ship.placePlayer(room);
    UI.hud(true);
  },

  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0);
    this.last = t;
    try { this.update(dt); this.draw(); } catch (e) { console.error(e); }
    requestAnimationFrame((tt) => this.loop(tt));
  },

  update(dt) {
    if (this.mode === 'title' || this.mode === 'ending') return;
    if (this.mode === 'cruise') { Ship.update(dt); this.updateCruise(dt); UI.hud(); return; }
    if (UI.active || this.paused) { this.pressed = {}; UI.prompt(null); return; }
    if (this.mode === 'ship') {
      const a = this.axis();
      Ship.movePlayer(a.x, a.y, dt);
      Ship.update(dt);
      this.advanceClock(dt * MIN_PER_SEC);
      const near = Ship.nearest();
      UI.prompt(near ? near.label : null);
      if (this.consumeInteract() && near) this.useShip(near);
      if (S.pendingEvents.length && !UI.active) this.showEvent(rollEvent());
    } else if (this.mode === 'planet') {
      Planet.update(dt, this.axis());
      if (this.mode !== 'planet') return;
      this.advanceClock(dt * MIN_PER_SEC * 0.5);
      const near = Planet.nearest();
      UI.prompt(near ? near.label : null);
      if (this.consumeInteract() && near) Planet.use(near);
    } else if (this.mode === 'map') {
      UI.prompt(null);
      this.pressed = {};
    }
    UI.hud();
  },

  advanceClock(mins) {
    const before = S.minute;
    S.minute += mins;
    for (const h of [10, 15]) if (before < h * 60 && S.minute >= h * 60 && this.mode === 'ship' && U.chance(0.5)) { const id = rollEvent(); if (id) this.showEvent(id); }
    if (S.minute >= 24 * 60) { S.minute -= 24 * 60; this.newDay(); }
  },

  newDay() {
    S.day++;
    dayTick(false);
    this.announceArcs();
    saveGame();
    const f = checkFailure();
    if (f) this.ending(f);
  },

  announceArcs() {
    const ready = aliveIds().filter((id) => arcReady(id) && !C(id).announced);
    ready.forEach((id) => (C(id).announced = true));
    if (ready.length) UI.toast(`💬 ${ready.map(N).join(', ')} ${ready.length > 1 ? 'want' : 'wants'} to talk to you. Look for the speech bubbles.`, EMO.love.color);
  },

  draw() {
    const ctx = this.ctx, W = this.W, H = this.H;
    if (this.mode === 'title' || this.mode === 'ending') { this.drawBackdrop(ctx, W, H); return; }
    if (this.mode === 'planet') Planet.draw(ctx, W, H);
    else if (this.mode === 'map') this.drawMap(ctx, W, H);
    else Ship.draw(ctx, W, H);
    if (this.mode === 'ship' || this.mode === 'cruise') this.drawArcMarkers(ctx, W, H);
  },

  drawBackdrop(ctx, W, H) {
    ctx.fillStyle = '#04050a'; ctx.fillRect(0, 0, W, H);
    const t = performance.now() / 1000;
    if (!this._bgStars) this._bgStars = Array.from({ length: 300 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() }));
    for (const s of this._bgStars) { ctx.fillStyle = `rgba(255,255,255,${0.2 + s.z * 0.8})`; ctx.fillRect(((s.x - t * 0.004 * s.z) % 1 + 1) % 1 * W, s.y * H, 1 + s.z, 1 + s.z); }
    // Earth, far away and getting smaller
    const r = Math.min(W, H) * 0.09;
    const g = ctx.createRadialGradient(W * 0.78 - r * 0.3, H * 0.3 - r * 0.3, r * 0.1, W * 0.78, H * 0.3, r);
    g.addColorStop(0, '#9fd3ff'); g.addColorStop(0.6, '#2c6fb0'); g.addColorStop(1, '#0a1c38');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.3, r, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(200,170,120,0.5)'; ctx.beginPath(); ctx.ellipse(W * 0.78 + r * 0.2, H * 0.3 + r * 0.1, r * 0.35, r * 0.2, 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#bbb'; ctx.beginPath(); ctx.arc(W * 0.78 - r * 1.8, H * 0.3 + r * 1.2, r * 0.25, 0, 7); ctx.fill();
  },

  drawArcMarkers(ctx, W, H) {
    // speech bubbles over people with a story to share are drawn in screen space for clarity
    const zoom = Ship.zoom(W, H);
    const vw = W / zoom, vh = H / zoom, p = Ship.player;
    if (!p) return;
    const cx = U.clamp(p.x - vw / 2, -T * 2, MAP_W * T - vw + T * 2), cy = U.clamp(p.y - vh / 2, -T * 2, MAP_H * T - vh + T * 2);
    for (const e of Ship.ents) {
      if (!arcReady(e.id)) continue;
      const sx = (e.x - cx) * zoom, sy = (e.y - cy) * zoom - 36 * zoom;
      ctx.font = `${14 * zoom}px sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('💬', sx, sy + Math.sin(performance.now() / 300) * 3);
    }
  },

  // ---------- events ----------
  showEvent(id) {
    const ev = eventById(id);
    if (!ev) return;
    const ctx = ev.setup ? ev.setup() : {};
    if (!ctx) return;
    markEvent(id);
    const res = (v) => (typeof v === 'function' ? v(ctx) : v);
    UI.modal({
      title: res(ev.title), body: res(ev.text),
      portrait: ctx.who || ctx.a || ctx.j || null,
      choices: res(ev.choices),
    });
  },

  // ---------- ship interactions ----------
  useShip(near) {
    if (near.kind === 'crew') this.talk(near.id);
    else if (near.kind === 'cat') { const inRoom = Ship.ents.filter((e) => U.dist(e.x, e.y, Ship.player.x, Ship.player.y) < 120); inRoom.forEach((e) => emo(e.id, { joy: 1 })); UI.toast(U.pick(['Buzz purrs like a fold engine.', 'Buzz headbutts your hand. You are chosen.', 'Buzz looks at you with enormous contempt, then purrs.', 'Buzz rolls over. It is a trap. You fall for it.'])); heart('love'); }
    else near.it.act();
  },

  talk(id) {
    if (!alive(id)) return;
    const c = C(id), d = crewDef(id);
    if (c.talkDay !== S.day) { c.talkDay = S.day; c.talks = 0; }
    const dom = dominant(id);
    const left = TALKS_PER_DAY - c.talks;
    const p = partnerOf(id);
    const line = left > 0 ? d.lines[dom] : U.pick(['Catch you tomorrow? I\'ve got to get back to it.', 'I\'m all talked out today. Tomorrow, yeah?', 'You\'re sweet. I need some time to myself, though.']);
    const status = `<div class="talkStatus"><span>${d.role} · ${d.from}</span><span>♥ ${Math.round(c.aff)}${p ? ` · with ${N(p)}` : ''}${S.flags.playerPartner === id ? ' · <b style="color:#ff8fcf">your partner</b>' : ''}</span></div>` +
      `<div class="dim small">Feeling <b style="color:${EMO[dom].color}">${EMO[dom].verb}</b> · Heartfelt moments left today: ${Math.max(0, left)}</div>` + UI.emoBars(id);
    const ch = [];
    if (arcReady(id)) ch.push({ label: `<b>Heart to heart: “${d.arc[c.arc].title}”</b>`, raw: () => this.heartToHeart(id) });
    if (left > 0) {
      ch.push({ label: 'Comfort them', tag: 'love', raw: () => this.act(id, 'comfort') });
      ch.push({ label: 'Make them laugh', tag: 'joy', raw: () => this.act(id, 'laugh') });
      ch.push({ label: 'Dream about the new world', tag: 'hope', raw: () => this.act(id, 'future') });
      ch.push({ label: 'Remember Earth together', tag: 'sorrow', raw: () => this.act(id, 'earth') });
      ch.push({ label: 'Call them out on something', tag: 'anger', raw: () => this.act(id, 'callout') });
      ch.push({ label: 'Show them something beautiful', tag: 'wonder', raw: () => this.act(id, 'wonder') });
      if (d.romance) ch.push({ label: 'Flirt', tag: 'love', raw: () => this.act(id, 'flirt') });
    }
    if (S.inv.length) ch.push({ label: 'Give a gift…', tag: 'love', raw: () => this.giftMenu(id) });
    ch.push({ label: 'Goodbye', raw: () => {} });
    UI.modal({ title: d.name, portrait: id, body: `<p class="quote">“${line}”</p>`, extra: status, choices: ch });
  },

  act(id, kind) {
    const c = C(id), e = c.e, d = crewDef(id);
    c.talks++;
    let out = '';
    const before = snapshot();
    if (kind === 'comfort') {
      if (e.sorrow > 40 || e.fear > 40) { emo(id, { sorrow: -12, fear: -10, love: 6 }); aff(id, 5); out = `${N(id)} leans into it. “Thanks. I needed that more than I knew.”`; }
      else { emo(id, { love: 3 }); aff(id, 2); out = `${N(id)} looks puzzled. “I\'m okay, honestly. But... that\'s nice. Thank you.”`; }
    } else if (kind === 'laugh') {
      if (e.sorrow > 65 || e.anger > 65) { emo(id, { anger: 4 }); aff(id, -2); out = `${N(id)} stares at you. “Not now. Seriously. Not now.”`; }
      else { emo(id, { joy: 12, sorrow: -5, anger: -4 }); aff(id, 4); out = `${N(id)} snorts, then properly laughs. ${U.pick(['“You\'re an idiot.” It is clearly a compliment.', '“Stop, stop, I\'ll pull something.”', '“Okay, that was actually funny.”'])}`; }
    } else if (kind === 'future') {
      emo(id, { hope: 12, fear: -4 }); aff(id, 3);
      out = dominant(id) === 'greed' ? `${N(id)} gets animated. “And who gets the best land? I\'m just asking. Hypothetically.”` : `${N(id)} gets a faraway look. “${U.pick(['A house with a real window. That\'s all I want.', 'Rain. I want to stand in rain.', 'A garden. Kids. A dog. Is that boring? I don\'t care.', 'A beach. And nobody asking me to fix anything.'])}”`;
    } else if (kind === 'earth') {
      if (e.sorrow > 55) { emo(id, { sorrow: -12, love: 8 }); out = `You talk about home. ${N(id)} cries a little, then laughs, then cries. “I think I needed to say it all out loud.”`; }
      else { emo(id, { sorrow: 6, love: 6 }); out = `You swap stories about home. ${N(id)} goes quiet at the end. “I miss it more than I thought I would.”`; }
      aff(id, 4);
    } else if (kind === 'callout') {
      if (e.anger > 50 || e.greed > 50) {
        if (c.aff > 30) { emo(id, { anger: -15, greed: -12, sorrow: 4 }); aff(id, 3); out = `${N(id)} bristles, then deflates. “Yeah. Yeah, you\'re right. I\'ve been... a lot, lately.”`; }
        else { emo(id, { anger: 10 }); aff(id, -6); out = `“Who do you think you are?” ${N(id)} storms off. You don\'t have the trust for that yet.`; }
      } else { emo(id, { sorrow: 5 }); aff(id, -3); out = `${N(id)} looks hurt. “What did I even do?”`; }
    } else if (kind === 'wonder') {
      const dome = Ship.playerRoom() === 'dome';
      emo(id, { wonder: dome ? 18 : 9, joy: 3, fear: -3 }); aff(id, 3);
      out = dome ? `You point out a nebula through the dome glass. ${N(id)} goes completely silent for a long time. “I\'ll never get used to this,” they whisper.` : `You show ${N(id)} a photo from the last planet. They zoom in on every detail. (It works even better in the Observation Dome.)`;
    } else if (kind === 'flirt') {
      const p = partnerOf(id);
      S.flirts = S.flirts || {}; S.flirts[id] = (S.flirts[id] || 0) + 1;
      if (S.flags.playerPartner === id) { emo(id, { love: 8, joy: 8 }); aff(id, 3); out = `${N(id)} rolls their eyes and kisses you anyway.`; }
      else if (p) { emo(id, { joy: 2 }); emo(p, { anger: 6 }); out = `${N(id)} laughs. “You do know I\'m with ${N(p)}, right?” ${N(p)} has definitely heard about this.`; }
      else if (S.flags.playerPartner) { emo(id, { joy: 3 }); emo(S.flags.playerPartner, { anger: 8, sorrow: 5 }); aff(S.flags.playerPartner, -4); out = `${N(id)} raises an eyebrow. “Aren\'t you with ${N(S.flags.playerPartner)}?” Word gets around fast on a ship.`; }
      else if (c.aff < 25) { emo(id, { joy: 2 }); aff(id, -1); out = `${N(id)} gives you a very confused smile. It\'s a bit early for that.`; }
      else if (c.aff >= 55 && e.love >= 45 && S.flirts[id] >= 2) {
        S.flags.playerPartner = id; emo(id, { love: 20, joy: 15 }); aff(id, 8);
        logEv(`${S.playerName} and ${N(id)} got together.`, 'love');
        out = `${N(id)} goes quiet, then takes your hand. “I was hoping you\'d keep doing that. I\'ve wanted to say something for weeks.” Something new begins, between the stars.`;
      } else { emo(id, { love: 6, joy: 5 }); aff(id, 3); out = `${N(id)} ${U.pick(['blushes and pretends not to.', 'grins and shoves you, gently.', 'flirts back, badly. It\'s adorable.'])}`; }
    }
    heart({ comfort: 'love', laugh: 'joy', future: 'hope', earth: 'sorrow', callout: 'anger', wonder: 'wonder', flirt: 'love' }[kind]);
    this.announceArcs();
    const diff = diffSummary(before);
    UI.modal({ title: d.name, portrait: id, body: `<p class="result">${out}</p>`, extra: diff ? `<div class="diff">${diff}</div>` : '', choices: [{ label: 'Continue', raw: () => this.talk(id) }] });
  },

  giftMenu(id) {
    const d = crewDef(id);
    const counts = {};
    S.inv.forEach((i) => (counts[i] = (counts[i] || 0) + 1));
    const ch = Object.keys(counts).map((it) => ({
      label: `${ITEMS[it].name}${counts[it] > 1 ? ' ×' + counts[it] : ''} <span class="dim">(${ITEMS[it].tags.join(', ')})</span>`, tag: 'love',
      fx: () => {
        takeItem(it);
        const loved = ITEMS[it].tags.some((t) => d.likes.includes(t));
        if (it === 'golden_record' && id === 'yasmin') { emo(id, { joy: 20, love: 15, anger: -15 }); aff(id, 15); return 'Yasmin holds the record like a newborn. “You brought it for the archive. Of course you did.” She is crying. She is not upset.'; }
        if (it === 'ash_journal' && id === 'yasmin') { emo(id, { wonder: 20, sorrow: 10, love: 10 }); aff(id, 15); flag('ashfall_translated'); return 'Yasmin works on the Ashfall journal for nine days straight. When she\'s done, she reads the last page to the whole crew: “Be less busy than us.” Nobody forgets it.'; }
        if (loved) { emo(id, { joy: 12, love: 10 }); aff(id, 10); return `${N(id)} lights up. “For me? Really?” They turn it over and over in their hands. It\'s exactly the kind of thing they love.`; }
        emo(id, { joy: 4 }); aff(id, 3); return `${N(id)} smiles politely. “That\'s... thank you.” It\'s the thought that counts. Mostly.`;
      },
    }));
    ch.push({ label: 'Never mind', raw: () => this.talk(id) });
    UI.modal({ title: `A gift for ${N(id)}`, portrait: id, body: `${N(id)} loves things that are <b>${d.likes.join('</b>, <b>')}</b>.`, choices: ch, onDone: () => this.talk(id) });
  },

  heartToHeart(id) {
    const c = C(id), d = crewDef(id), sc = d.arc[c.arc];
    UI.modal({
      title: `${d.name}: ${sc.title}`, portrait: id,
      body: typeof sc.text === 'function' ? sc.text() : sc.text,
      extra: `<div class="dim small">Part ${c.arc + 1} of 3</div>`,
      choices: sc.choices,
      onPick: () => { c.arc++; c.arcDay = S.day; c.announced = false; logEv(`${N(id)} shared “${sc.title}”.`, 'love'); },
      onDone: () => this.announceArcs(),
    });
  },

  listenEarth() {
    if (hasFlag('earth_silent')) {
      UI.modal({ title: 'Comms', body: hasFlag('keep_broadcasting') ? 'Static from Earth. Just static. On the log beside the desk, in Cal\'s handwriting: every day\'s broadcast time, back to the day of the silence. He has never missed one.' : 'Static. Just static. You listen for a long time anyway.', choices: [{ label: 'Keep listening', tag: 'sorrow', fx: () => { emoAll({ sorrow: 1 }); return ''; } }, { label: 'Switch it off', raw: () => {} }] });
      return;
    }
    const clips = [
      'A news anchor, months out of date: “...the Collins, now beyond the orbit of Pluto, carries the hopes of—” The signal breaks up.',
      'A children\'s choir in Nairobi, singing a song written for the launch. They are slightly out of tune. It\'s perfect.',
      'A weather report. Record heat in Rome, again. Evacuations in Dhaka. The newsreader sounds so tired.',
      'A late-night talk show. The host is making jokes about the Collins crew. The audience is laughing. It feels like being remembered.',
      'Football. Someone has scored in extra time. Thousands of people are screaming with joy. You close your eyes and let it wash over you.',
      'A message from Tranquility Yards: “Collins, this is the Moon. We\'re still here. We\'re still waving.”',
    ];
    UI.modal({ title: 'Signals from Earth', body: U.pick(clips), choices: [{ label: 'Listen a while longer', tag: 'love', fx: () => '' }, { label: 'Switch it off', raw: () => {} }] });
  },

  crewInRoom(room) { return Ship.ents.filter((e) => Ship.roomOfEnt(e) === room).map((e) => e.id); },

  tendGarden() {
    if (S.tendedDay === S.day) { UI.toast('The garden is already tended today.'); return; }
    S.tendedDay = S.day;
    const here = this.crewInRoom('hydro');
    here.forEach((id) => { emo(id, { hope: 5, joy: 3 }); aff(id, 1); });
    heart('hope');
    this.advanceClock(60);
    UI.toast(`You tend the grow racks for an hour. Tonight\'s harvest will be bigger.${here.length ? ' ' + here.map(N).join(', ') + ' helped.' : ''}`, EMO.hope.color);
  },
  playMusic() {
    if (S.musicDay === S.day) { UI.toast('Someone has already requested the same song four times today.'); return; }
    S.musicDay = S.day;
    const here = this.crewInRoom('lounge');
    here.forEach((id) => emo(id, { joy: 10, love: 3, sorrow: -4 }));
    emoAll({ joy: 2 });
    heart('joy');
    UI.toast(here.length ? `${here.map(N).join(', ')} ${here.length > 1 ? 'start' : 'starts'} dancing.` : 'You dance alone to 1970s disco. Nobody saw. Probably.', EMO.joy.color);
  },
  bar() {
    const here = this.crewInRoom('lounge');
    UI.modal({
      title: 'The Bar', body: `A counter made from a spare hull plate, and a still Luka swears is legal.${here.length ? ` ${here.map(N).join(', ')} ${here.length > 1 ? 'are' : 'is'} here.` : ' The lounge is empty.'}`,
      choices: [
        { label: 'Pour a round for everyone here', tag: 'joy', req: () => here.length > 0 && S.res.food >= 2, fx: () => { res({ food: -2 }); here.forEach((id) => { emo(id, { joy: 6, love: 3 }); aff(id, 2); }); return 'Glasses clink. Someone proposes a toast “to the Collins, may she never fall apart.” Somebody knocks on the wall for luck.'; } },
        { label: 'Have a quiet drink alone', tag: 'sorrow', fx: () => 'It tastes like petrol and oranges. You drink it anyway, looking at the stars.' },
        { label: 'Leave', raw: () => {} },
      ],
    });
  },
  sleep() {
    const h = S.minute / 60;
    UI.modal({
      title: 'Your Bunk', body: h >= 18 || h < 5 ? 'The ship hums around you. It\'s late.' : 'It\'s the middle of the day. Sleep anyway, until tomorrow morning?',
      choices: [
        { label: 'Sleep until morning (saves the game)', raw: () => {
          S.minute = 7 * 60; this.newDay(); if (this.mode === 'ending') return;
          Ship.spawnCrew();
          UI.toast(`Day ${S.day}. ${morale() > 60 ? 'You wake to the smell of coffee and somebody singing.' : morale() > 30 ? 'You wake to the hum of the ship.' : 'You wake to raised voices somewhere down the corridor.'}`);
          if (U.chance(0.5)) { const id = rollEvent(); if (id) this.showEvent(id); }
        } },
        { label: 'Not yet', raw: () => {} },
      ],
    });
  },
  readLore() {
    const l = LORE[S.loreRead % LORE.length];
    S.loreRead++;
    const extra = hasFlag('ashfall_translated') && S.loreRead % LORE.length === 0 ? '<br><br><i>Filed beside Earth\'s history, in Yasmin\'s hand: the translated Ashfall journal. The last line reads, “Be less busy than us.”</i>' : '';
    UI.modal({ title: `${l.year}: ${l.title}`, body: l.text + extra, extra: `<div class="dim small">Earth Archive · entry ${((S.loreRead - 1) % LORE.length) + 1} of ${LORE.length}</div>`, choices: [{ label: 'Read the next entry', raw: () => this.readLore() }, { label: 'Close', raw: () => {} }] });
  },
  memorial() {
    if (!S.dead.length) { UI.modal({ title: 'The Memorial Wall', body: 'A long wall of brushed steel, left blank on purpose. Yasmin polishes it every week. “I hope it stays empty,” she says. “I\'m polishing it so it knows it\'s wanted anyway.”', choices: [{ label: 'Leave', raw: () => {} }] }); return; }
    const names = S.dead.map((d) => `<div class="tl"><b>${crewDef(d.id).name}</b> <span class="dim">Day ${d.day}: ${d.cause}</span></div>`).join('');
    UI.modal({ title: 'The Memorial Wall', body: names, choices: [{ label: 'Light a candle', tag: 'sorrow', fx: () => { emoAll({ sorrow: -3, love: 3 }); return 'Your candle joins the others. Someone always keeps one burning.'; } }, { label: 'Leave', raw: () => {} }] });
  },
  gaze() {
    const sys = Galaxy.sys(S.loc);
    const txt = S.travel ? 'In fold, the stars smear into long streaks of blue and gold, like looking through rain on a window at night. Somewhere ahead is a star nobody has ever named.'
      : `${sys.name}${sys.special === 'sol' ? ', home,' : ''} burns ${sys.star.k.toLowerCase()}-bright below the dome. ${sys.planets.length} worlds turn around it.${sys.special === 'sol' ? ' Earth is out there, a blue dot you can just about find.' : ' No human eyes have ever seen this before yours.'}`;
    const here = this.crewInRoom('dome');
    UI.modal({ title: 'The Observation Dome', body: txt + (here.length ? `<br><br>${here.map(N).join(' and ')} ${here.length > 1 ? 'are' : 'is'} here with you.` : ''), choices: [{ label: 'Stay a while', tag: 'wonder', fx: () => { here.forEach((id) => emo(id, { wonder: 4, love: 2 })); this.advanceClock(45); return 'You lose track of time. That\'s the point.'; } }, { label: 'Leave', raw: () => {} }] });
  },
  repair() {
    UI.modal({
      title: 'Repair Station', body: `Hull integrity: <b>${S.res.hull}%</b>. Spare parts: <b>${S.res.parts}</b>.${alive('sofia') ? ' Sofia hands you a welding mask without looking up.' : ''}`,
      choices: [
        { label: 'Patch the hull (4 parts → +12% hull, 2 hours)', tag: 'hope', req: () => S.res.parts >= 4 && S.res.hull < 100, fx: () => { res({ parts: -4, hull: 12 }); this.advanceClock(120); if (alive('sofia')) { aff('sofia', 2); emo('sofia', { joy: 4 }); } return 'Two hours of sparks and swearing. The ship sounds a little less tired.'; } },
        { label: 'Leave', raw: () => {} },
      ],
    });
  },
  reactor() {
    UI.modal({ title: 'The Fold Reactor', body: `A column of blue light that bends space around it. It is the most powerful thing humans have ever built, and it is held together by Sofia, cable ties, and optimism.<br><br>Fuel: <b>${S.res.fuel}</b>. Each fold jump burns fuel in proportion to distance. Ice from frozen worlds and gas skimmed from giants can be refined into more.`, choices: [{ label: 'Leave', raw: () => {} }] });
  },
  stores() {
    const r = S.res;
    const body = `Food ${Math.floor(r.food)} (the crew eats ${aliveIds().length + 1}/day; the garden grows about ${Math.round(hydroYield())}) · Fuel ${r.fuel} · Parts ${r.parts} · Meds ${r.meds}<br><br>${S.inv.length ? 'Items: ' + S.inv.map((i) => ITEMS[i].name).join(', ') : 'No items in the hold.'}`;
    const ch = [];
    if (hasFlag('luka_market') && S.inv.length) ch.push({ label: 'Trade at Luka\'s Exchange…', tag: 'greed', raw: () => this.exchange() });
    ch.push({ label: 'Leave', raw: () => {} });
    UI.modal({ title: 'Ship Stores', body: body + (hasFlag('luka_market') ? '' : '<br><br><span class="dim">Luka keeps talking about opening an exchange down here...</span>'), choices: ch });
  },
  exchange() {
    const uniq = [...new Set(S.inv)];
    UI.modal({
      title: 'Luka\'s Exchange', portrait: alive('luka') ? 'luka' : null, body: '“Everything has a price, my friend.” Luka offers supplies for your finds.',
      choices: uniq.map((it) => ({ label: `Trade ${ITEMS[it].name} → +10 fuel, +5 parts, +20 food`, tag: 'greed', fx: () => { takeItem(it); res({ fuel: 10, parts: 5, food: 20 }); if (alive('luka')) emo('luka', { joy: 8, greed: 3 }); return `Luka examines the ${ITEMS[it].name} with a jeweller\'s loupe, sighs happily, and hands over the supplies.`; } })).concat([{ label: 'Leave', raw: () => {} }]),
    });
  },
  synthMeds() {
    UI.modal({ title: 'Medbay Synthesiser', body: `Medical supplies: <b>${S.res.meds}</b>.${alive('priya') ? ' Priya watches you like a hawk in case you touch something sterile.' : ''}`, choices: [
      { label: 'Synthesise medicine (3 parts → +1 meds)', tag: 'fear', req: () => S.res.parts >= 3, fx: () => { res({ parts: -3, meds: 1 }); return 'The synthesiser clunks and produces a very small, very expensive box of antivirals.'; } },
      { label: 'Leave', raw: () => {} },
    ] });
  },
  spar() {
    if (S.sparDay === S.day) { UI.toast('Everyone\'s too bruised for another round today.'); return; }
    const here = this.crewInRoom('gym');
    S.sparDay = S.day;
    heart('anger');
    if (!here.length) { UI.toast('Nobody\'s here. You punch the bag until your arms ache. It helps.'); return; }
    here.forEach((id) => { emo(id, { anger: -14, joy: 6 }); aff(id, 2); });
    for (let i = 0; i < here.length; i++) for (let j = i + 1; j < here.length; j++) rel(here[i], here[j], 4);
    UI.toast(`${here.map(N).join(', ')} ${here.length > 1 ? 'spar until they\'re laughing' : 'spars with you until they\'re laughing'}. The anger goes somewhere useful.`, EMO.anger.color);
  },

  // ---------- star map ----------
  openMap(atHelm) {
    if (S.travel) { UI.toast('The ship is in fold.'); return; }
    this.mode = 'map'; this.mapAtHelm = atHelm; this.mapSel = S.loc;
    $('mapPanel').classList.remove('hidden');
    this.renderMapPanel();
  },
  closeMap() { $('mapPanel').classList.add('hidden'); this.mode = 'ship'; },
  mapXform() {
    const pw = this.W > 760 ? 360 : 0;
    const w = this.W - pw - 40, h = this.H - (pw ? 110 : 300);
    const s = Math.min(w / 100, h / 60);
    return { s, ox: 20 + (w - 100 * s) / 2, oy: 80 + (h - 60 * s) / 2 };
  },
  onClick(e) {
    if (this.mode !== 'map') return;
    const { s, ox, oy } = this.mapXform();
    const gx = (e.clientX - ox) / s, gy = (e.clientY - oy) / s;
    let best = null, bd = 4;
    for (const sy of Galaxy.get().systems) { const d = U.dist(sy.x, sy.y, gx, gy); if (d < bd) { bd = d; best = sy.id; } }
    if (best !== null) { this.mapSel = best; this.renderMapPanel(); Audio2.blip(800, 0.04); }
  },
  drawMap(ctx, W, H) {
    ctx.fillStyle = '#03040a'; ctx.fillRect(0, 0, W, H);
    this.drawBackdropStars(ctx, W, H);
    const { s, ox, oy } = this.mapXform();
    const g = Galaxy.get(), cur = g.systems[S.loc];
    const X = (x) => ox + x * s, Y = (y) => oy + y * s;
    // jump range
    ctx.strokeStyle = 'rgba(120,200,255,0.25)'; ctx.setLineDash([4, 6]);
    ctx.beginPath(); ctx.arc(X(cur.x), Y(cur.y), JUMP_RANGE * s, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    for (const sy of g.systems) if (sy.id !== cur.id && Galaxy.dist(cur.id, sy.id) <= JUMP_RANGE) { ctx.strokeStyle = 'rgba(120,200,255,0.12)'; ctx.beginPath(); ctx.moveTo(X(cur.x), Y(cur.y)); ctx.lineTo(X(sy.x), Y(sy.y)); ctx.stroke(); }
    if (this.mapSel !== null && this.mapSel !== cur.id) { const t = g.systems[this.mapSel]; ctx.strokeStyle = Galaxy.dist(cur.id, t.id) <= JUMP_RANGE ? '#ffd26a' : '#ff6a6a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(cur.x), Y(cur.y)); ctx.lineTo(X(t.x), Y(t.y)); ctx.stroke(); ctx.lineWidth = 1; }
    const tt = performance.now() / 1000;
    for (const sy of g.systems) {
      const x = X(sy.x), y = Y(sy.y), r = sy.star.r * (s / 9);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
      glow.addColorStop(0, U.hexA(sy.star.col, 0.9)); glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 7); ctx.fill();
      ctx.fillStyle = sy.star.col; ctx.beginPath(); ctx.arc(x, y, Math.max(2, r * 0.6), 0, 7); ctx.fill();
      if (S.visited[sy.id]) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 7); ctx.stroke(); }
      if (S.revealed[sy.id] && !S.visited[sy.id]) { ctx.strokeStyle = `rgba(255,210,106,${0.5 + 0.5 * Math.sin(tt * 3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 9, 0, 7); ctx.stroke(); ctx.lineWidth = 1; }
      if (sy.id === this.mapSel) { ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r + 12, 0, 7); ctx.stroke(); }
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = S.visited[sy.id] || S.revealed[sy.id] || sy.id === this.mapSel ? '#dde' : 'rgba(200,200,220,0.45)';
      ctx.fillText(S.visited[sy.id] || S.revealed[sy.id] || Galaxy.dist(cur.id, sy.id) <= JUMP_RANGE ? sy.name : '·', x, y + r + 16);
    }
    // the Collins
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(X(cur.x) + 8, Y(cur.y) - 14); ctx.lineTo(X(cur.x) - 6, Y(cur.y) - 10); ctx.lineTo(X(cur.x) - 6, Y(cur.y) - 18); ctx.fill();
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#cde';
    ctx.fillText('STAR MAP', 20, 88 - 30);
    ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(200,210,230,0.6)';
    ctx.fillText('Click a star. Dashed circle = jump range. Gold rings = signals. M or Esc to close.', 20, 88 - 12);
  },
  drawBackdropStars(ctx, W, H) {
    if (!this._mapStars) this._mapStars = Array.from({ length: 200 }, () => [Math.random(), Math.random(), Math.random()]);
    for (const [x, y, z] of this._mapStars) { ctx.fillStyle = `rgba(255,255,255,${z * 0.4})`; ctx.fillRect(x * W, y * H, 1, 1); }
  },

  renderMapPanel() {
    const sy = Galaxy.sys(this.mapSel), here = sy.id === S.loc;
    const d = Galaxy.dist(S.loc, sy.id), cost = Galaxy.fuelCost(S.loc, sy.id), days = Galaxy.travelDays(S.loc, sy.id);
    let html = `<h2>${sy.name}</h2><div class="dim">${sy.star.k}${S.visited[sy.id] ? ' · visited' : ''}${S.revealed[sy.id] && !S.visited[sy.id] ? ' · <b style="color:#ffd26a">anomalous signal</b>' : ''}</div>`;
    if (!here) {
      html += `<p>Distance ${d.toFixed(1)} ly · ${cost} fuel · ${days} days in fold</p>`;
      if (d > JUMP_RANGE) html += '<p class="warn">Out of jump range. Hop through nearer stars.</p>';
      else if (cost > S.res.fuel) html += '<p class="warn">Not enough fuel.</p>';
      else if (!this.mapAtHelm) html += '<p class="dim">Set course from the Helm on the Bridge.</p>';
      else html += `<button class="big" id="btnJump">Set course for ${sy.name}</button>`;
      html += S.visited[sy.id] ? this.planetList(sy, false) : `<p class="dim">${sy.planets.length} planet${sy.planets.length > 1 ? 's' : ''} detected at long range.</p>`;
    } else {
      html += '<p><b>You are here.</b></p>' + this.planetList(sy, true);
      if (!this.mapAtHelm) html += '<p class="dim">Go to the Helm on the Bridge to scan and land.</p>';
    }
    html += '<button id="btnMapClose">Close map</button>';
    $('mapPanel').innerHTML = html;
    const j = $('btnJump'); if (j) j.onclick = () => this.jump(sy.id);
    $('btnMapClose').onclick = () => this.closeMap();
    $('mapPanel').querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => this.planetAction(b.dataset.act, b.dataset.pid)));
  },
  planetList(sy, here) {
    return sy.planets.map((p) => {
      const scanned = S.scanned[p.id] || S.visited[sy.id] && p.type === 'gas', surveyed = S.surveyed[p.id];
      const info = Galaxy.describe(p);
      const col = PLANET_TYPES[p.type].col;
      let body = `<div class="planet"><div class="pball" style="background:radial-gradient(circle at 35% 35%, ${U.shade(col, 50)}, ${col} 50%, ${U.shade(col, -60)})"></div><div class="pinfo"><b>${p.name}</b>`;
      if (!scanned && !surveyed) body += `<div class="dim">Unscanned</div>`;
      else {
        body += `<div class="dim">${info.typeName} · ${info.temp} · ${info.grav}</div><div class="dim">${info.atmo} · ${info.water}${surveyed || p.type === 'gas' ? ' · ' + info.life : ''}</div>`;
        if (p.type !== 'gas') body += `<div>Habitability <b style="color:${p.hab >= 70 ? '#8f8' : p.hab >= 50 ? '#fd6' : '#f88'}">${p.hab}</b>${surveyed ? ' · surveyed' : ''}</div>`;
      }
      if (here && this.mapAtHelm) {
        body += '<div class="pbtns">';
        if (!scanned && !surveyed) body += `<button data-act="scan" data-pid="${p.id}">Scan</button>`;
        if (p.type === 'gas') body += (S.planetState[p.id] && S.planetState[p.id].skimmed) ? '<span class="dim">Skimmed</span>' : `<button data-act="skim" data-pid="${p.id}">Skim for fuel</button>`;
        else body += `<button data-act="land" data-pid="${p.id}">Land (3 fuel)</button>`;
        if (surveyed && Galaxy.isCandidate(p)) body += `<button class="home" data-act="settle" data-pid="${p.id}">Call the Assembly</button>`;
        body += '</div>';
      }
      return body + '</div></div>';
    }).join('');
  },
  planetAction(act, pid) {
    const p = Galaxy.planet(pid);
    if (act === 'scan') { S.scanned[pid] = true; this.advanceClock(30); if (alive('mateo')) emo('mateo', { wonder: 3 }); Audio2.blip(900, 0.1); this.renderMapPanel(); }
    if (act === 'skim') {
      S.planetState[pid] = S.planetState[pid] || { taken: {} };
      S.planetState[pid].skimmed = true;
      const f = U.rint(10, 16); res({ fuel: f, hull: -4 });
      UI.toast(`Kenji dives through the upper atmosphere. +${f} fuel, some hull buffeting.`); this.renderMapPanel();
    }
    if (act === 'land') { if (S.res.fuel < 3) { UI.toast('Not enough fuel to land.'); return; } this.chooseCompanion(pid); }
    if (act === 'settle') this.assembly(pid);
  },

  // ---------- travel ----------
  jump(to) {
    const cost = Galaxy.fuelCost(S.loc, to), days = Galaxy.travelDays(S.loc, to);
    res({ fuel: -cost });
    S.travel = { from: S.loc, to, days, left: days };
    $('mapPanel').classList.add('hidden');
    this.mode = 'cruise';
    this.cruise = { t: 0, lines: [] };
    $('cruise').classList.remove('hidden');
    this.cruiseLine(`Fold engaged. Destination: ${Galaxy.sys(to).name}. ${days} days.`, 'wonder');
    Audio2.blip(200, 0.6);
  },
  cruiseLine(text, k) {
    const el = document.createElement('div');
    el.className = 'cl';
    el.innerHTML = `<span class="dim">Day ${S.day}</span> <span style="color:${EMO[k] ? EMO[k].color : '#fff'}">${EMO[k] ? EMO[k].glyph : '•'}</span> ${text}`;
    $('cruiseLog').prepend(el);
    while ($('cruiseLog').children.length > 9) $('cruiseLog').lastChild.remove();
  },
  updateCruise(dt) {
    if (UI.active || this.paused) return;
    const tr = S.travel;
    this.cruise.t += dt;
    $('cruiseBar').style.width = `${((tr.days - tr.left) / tr.days) * 100}%`;
    $('cruiseTitle').textContent = `In fold → ${Galaxy.sys(tr.to).name} · ${tr.left} day${tr.left === 1 ? '' : 's'} remaining`;
    if (this.cruise.t < 0.8) return;
    this.cruise.t = 0;
    S.day++; tr.left--;
    const amb = dayTick(true);
    if (amb) this.cruiseLine(amb.text, amb.emo);
    const f = checkFailure();
    if (f) { $('cruise').classList.add('hidden'); this.ending(f); return; }
    if (S.pendingEvents.length || U.chance(0.4)) { const id = rollEvent(); if (id) { this.cruiseLine(`<i>${typeof eventById(id).title === 'string' ? eventById(id).title : 'Something happened.'}</i>`, 'hope'); this.showEvent(id); } }
    if (tr.left <= 0) this.arrive();
  },
  arrive() {
    const to = S.travel.to;
    S.loc = to; S.travel = null; S.jumps++;
    const first = !S.visited[to];
    S.visited[to] = true;
    $('cruise').classList.add('hidden');
    const sy = Galaxy.sys(to);
    logEv(`Arrived at ${sy.name}.`, 'wonder');
    if (first) emoAll({ wonder: 6, hope: 3 });
    this.enterShip('bridge');
    this.announceArcs();
    saveGame();
    UI.toast(`Arrived at ${sy.name}. ${sy.planets.length} worlds. Use the Helm to scan and land.`, EMO.wonder.color);
    if (sy.special && sy.special !== 'sol' && first) {
      const txt = { ashfall: 'The long-range scanners catch something on the fourth planet: straight lines. Roads. Cities. All of them dark. Someone lived here once.', thalassa: 'One of the worlds here is almost entirely ocean, blue and white and alive. The crew crowd the dome in silence. Amara is crying.', eden: 'The signal source. A green-gold world wrapped in cloud, and on its night side, lights. Not cities. Something softer. Something alive, and aware.' }[sy.special];
      UI.modal({ title: sy.name, body: txt, choices: [{ label: 'Continue', tag: 'wonder', fx: () => { emoAll({ wonder: 10 }); return ''; } }] });
    }
  },

  // ---------- landing ----------
  chooseCompanion(pid) {
    const p = Galaxy.planet(pid);
    const ids = aliveIds();
    UI.modal({
      title: `Landing on ${p.name}`,
      body: `The shuttle holds two. Who comes with you? Their feelings will colour the trip, and the trip will colour their feelings.${p.hazard >= 3 ? '<br><br><b class="warn">This world is dangerous.</b>' : ''}`,
      choices: ids.map((id) => ({ label: `${crewDef(id).name} <span class="dim">(${crewDef(id).role}, feeling ${EMO[dominant(id)].verb})</span>`, tag: dominant(id), raw: () => this.land(pid, id) })).concat([{ label: 'Go alone', raw: () => this.land(pid, null) }, { label: 'Cancel', raw: () => {} }]),
    });
  },
  land(pid, comp) {
    res({ fuel: -3 });
    $('mapPanel').classList.add('hidden');
    Planet.land(pid, comp);
    this.mode = 'planet';
    UI.toast('Collect resources, investigate the ? markers, and get back to the shuttle before your O₂ runs out.');
  },
  leavePlanet(forced) {
    const h = Planet.haul, p = Planet.p, comp = Planet.comp && Planet.comp.id;
    let lost = '';
    if (forced) {
      const keep = (v) => Math.floor(v * 0.6);
      lost = `<br><br><b class="warn">${Planet.o2 <= 0 ? 'Your oxygen ran out.' : 'Your suit failed.'}</b> ${comp ? `${N(comp)} dragged you back to the shuttle, shouting your name the whole way.` : 'You barely crawled back to the shuttle.'} Some of the haul was dropped.`;
      h.food = keep(h.food); h.fuel = keep(h.fuel); h.parts = keep(h.parts);
      if (comp) emo(comp, { fear: 12, love: 6 });
    }
    res({ food: h.food, fuel: h.fuel, parts: h.parts });
    h.items.forEach(giveItem);
    S.surveyed[p.id] = true;
    if (comp) { aff(comp, 4); emo(comp, { joy: 3 }); }
    this.advanceClock(240);
    logEv(`Walked on ${p.name}.`, 'wonder');
    this.enterShip('bridge');
    const hab = Galaxy.isCandidate(p) ? `<br><br><b style="color:#8f8">${p.name} could be a home.</b> Habitability ${p.hab}. You can call the Assembly from the Helm.` : '';
    UI.modal({
      title: `Back aboard from ${p.name}`,
      body: `The shuttle docks with a clunk.${lost}<br><br>Brought back: 🌱 ${h.food} food · ⛽ ${h.fuel} fuel · ⚙ ${h.parts} parts${h.items.length ? ' · ' + h.items.map((i) => ITEMS[i].name).join(', ') : ''}.${hab}`,
      choices: [{ label: 'Continue', raw: () => {} }],
    });
    saveGame();
  },

  // ---------- the Assembly: choosing a home ----------
  assembly(pid) {
    const p = Galaxy.planet(pid);
    if (S.day - S.assemblyFailDay < 5) { UI.toast('The crew needs time before another Assembly.'); return; }
    $('mapPanel').classList.add('hidden');
    this.mode = 'ship';
    const info = Galaxy.describe(p);
    const notes = [];
    if (p.special === 'eden') notes.push(hasFlag('lumen_harmed') ? 'The Lumen have withdrawn from the landing site. They remember what you did.' : hasFlag('lumen_friend') ? 'The Lumen seem to welcome you. It is their world. Would you share it?' : 'This world already belongs to someone.');
    if (p.special === 'ashfall') notes.push('You would be building among the graves of a people who destroyed themselves.');
    if (p.special === 'thalassa') notes.push('Ocean from pole to pole; small islands, huge storms, and the singing of creatures larger than the ship.');
    if (p.hazard >= 2) notes.push('The surface is dangerous.');
    if (p.hab < 65) notes.push('Life here would be hard.');
    const appeals = [
      ['hope', 'Speak of hope: “This is where our future starts.”'],
      ['fear', 'Speak of fear: “We may never find better. We can\'t keep running.”'],
      ['love', 'Speak of love: “Wherever we are together is home.”'],
      ['wonder', 'Speak of wonder: “Look at this world. We could spend lifetimes learning it.”'],
      ['greed', 'Speak of plenty: “Everything we need is down there.”'],
      ['anger', 'Speak of defiance: “We will not make the old mistakes. Not here.”'],
    ];
    UI.modal({
      title: `The Assembly: ${p.name}`,
      body: `Everyone crowds into the Mess. On the screen: ${p.name}, ${info.typeName.toLowerCase()}, ${info.temp}, ${info.atmo.toLowerCase()}, ${info.life.toLowerCase()}. Habitability <b>${p.hab}</b>.<br><br>${notes.join(' ')}<br><br>This is the vote that ends the voyage, or doesn\'t. Every crew member will vote with their heart. You get one speech.`,
      choices: appeals.map(([k, l]) => ({ label: l, tag: k, raw: () => { heart(k, 2); this.runVote(p, k); } })).concat([{ label: 'Not yet. Call it off.', raw: () => {} }]),
    });
  },
  vote(id, p, appeal) {
    const e = C(id).e, c = C(id);
    const special = !!p.special;
    let s = (p.hab - 58) * 0.9;
    s += (e.fear - 40) * 0.35;
    s -= (e.wonder - 50) * 0.25 * (special ? -0.4 : 1);
    s += (e.greed - 30) * 0.25 * (p.rich.ore + p.rich.bio - 0.8);
    s += (c.aff - 25) * 0.35;
    s += (e.sorrow - 40) * 0.12;
    s += (S.day - 50) * 0.22;
    s += (e[appeal] - 35) * 0.45;
    s += (morale() - 50) * 0.2;
    s -= p.hazard * 4;
    if (p.special === 'eden') {
      if (hasFlag('lumen_harmed')) s -= 12;
      if (hasFlag('lumen_friend')) s += 8;
      if (id === 'zhao') s += appeal === 'love' || hasFlag('zhao_resolved') ? 8 : -18;
      if (id === 'luka' || id === 'jonah') s += 10;
    }
    if (p.special === 'ashfall' && e.sorrow > 50) s += appeal === 'hope' ? 8 : -10;
    if (S.flags.playerPartner === id) s += 12;
    s += (Math.random() - 0.5) * 12;
    return s;
  },
  runVote(p, appeal) {
    const ids = aliveIds();
    const scores = Object.fromEntries(ids.map((id) => [id, this.vote(id, p, appeal)]));
    // partners tend to vote together
    for (const b of S.bonds) if (b.type === 'partners' && alive(b.a) && alive(b.b)) { const m = (scores[b.a] + scores[b.b]) / 2; scores[b.a] = (scores[b.a] + m) / 2; scores[b.b] = (scores[b.b] + m) / 2; }
    let yes = 1; // you
    const lines = ids.map((id) => {
      const y = scores[id] > 0; if (y) yes++;
      const dom = dominant(id);
      const opts = y ? VOTE_YES[dom] : VOTE_NO[dom];
      const q = opts[U.hashStr(id + p.id) % opts.length];
      return `<div class="vote ${y ? 'yes' : 'no'}"><b>${N(id)}</b> <span style="color:${EMO[dom].color}">${EMO[dom].glyph}</span> ${y ? 'YES' : 'NO'} <span class="dim">“${q}”</span></div>`;
    });
    const total = ids.length + 1, pass = yes * 2 > total;
    UI.modal({
      title: pass ? 'The Vote Carries' : 'The Vote Fails',
      body: `<div class="votes">${lines.join('')}<div class="vote yes"><b>${U.esc(S.playerName)}</b> YES</div></div><p><b>${yes} of ${total}</b> in favour.</p>`,
      choices: [{ label: pass ? `Take the Collins down to ${p.name}` : 'We keep flying.', raw: () => {
        if (pass) this.ending('settled', p);
        else { S.assemblyFailDay = S.day; emoAll({ sorrow: 4, anger: 4, hope: -3 }); logEv(`The Assembly voted against settling ${p.name}.`, 'anger'); }
      } }],
    });
  },

  // ---------- endings ----------
  ending(kind, p) {
    if (this.mode === 'ending') return;
    this.mode = 'ending';
    S.ended = kind;
    document.body.classList.add('ended');
    UI.queue = []; UI.active = false; $('modal').classList.add('hidden');
    $('cruise').classList.add('hidden'); $('mapPanel').classList.add('hidden'); UI.prompt(null);
    clearSave();
    const m = morale(), dom = heartDominant();
    let title, world;
    if (kind === 'settled') {
      title = p.name;
      world = worldEnding(p);
      const fam = m >= 65 ? 'They arrived as a family: loud, bruised, in love with each other in a hundred different ways.' : m >= 35 ? 'They arrived tired and scarred, but together. That turned out to be enough.' : 'They arrived fractured. The first years were hard, not because of the world, but because of each other. Slowly, painfully, they learned.';
      world += `<p>${fam}</p>`;
    } else {
      title = { mutiny: 'The Long Way Back', starved: 'Hunger', destroyed: 'Silence', alone: 'Alone' }[kind];
      world = {
        mutiny: '<p>It happened at breakfast. Nobody raised a weapon. They just stopped listening. By evening, the council had voted to turn the Collins around and head back towards a dying Earth. You didn\'t fight it. You couldn\'t. The ship had become a place where nobody could feel anything good any more.</p><p>The Collins is still out there, going the long way home.</p>',
        starved: '<p>The garden failed first, then the stores, then the hope. In the end the crew drifted in the dark, too weak to run the fold drive, writing letters to people who would never read them.</p><p>Yasmin made sure the archive survived. Someone, someday, might find it.</p>',
        destroyed: '<p>The hull gave way somewhere in the long dark between stars. It was quick. The last thing the Collins broadcast was Cal\'s song, on a loop, towards a Sun too far away to hear it.</p>',
        alone: '<p>In the end there was only you, and the cat, and the hum of the ship. You kept flying. What else was there to do?</p>',
      }[kind];
    }
    const fates = CREW.map((d) => {
      if (!alive(d.id)) return `<div class="fate dead"><b>${d.name}</b> · Remembered. ${S.dead.find((x) => x.id === d.id) ? S.dead.find((x) => x.id === d.id).cause : ''}.</div>`;
      if (kind !== 'settled') return `<div class="fate"><b>${d.name}</b> · Feeling ${EMO[dominant(d.id)].verb} to the end.</div>`;
      const pp = S.flags.playerPartner === d.id ? ` They built a life with you.` : partnerOf(d.id) ? ` They grew old beside ${N(partnerOf(d.id))}.` : '';
      return `<div class="fate" style="border-color:${EMO[dominant(d.id)].color}"><b>${d.name}</b> · ${d.epilogue()}${pp}</div>`;
    }).join('');
    const worlds = Object.keys(S.surveyed).length;
    const html = `<div class="endInner"><div class="kicker">${kind === 'settled' ? 'A new home' : 'The end of the voyage'}</div><h1>${title}</h1>${world}
      <h2>The crew</h2>${fates}
      <h2 style="color:${EMO[dom].color}">${HEART_TEXT[dom].title}</h2><p>${kind === 'settled' ? HEART_TEXT[dom].end : HEART_TEXT[dom].now}</p>
      <div class="stats">Day ${S.day} · ${S.jumps} jumps · ${worlds} worlds walked · ${aliveIds().length} of ${CREW.length} crew survived · Morale ${m}</div>
      <button class="big" id="btnAgain">Begin a new voyage</button></div>`;
    $('ending').innerHTML = html;
    $('ending').classList.remove('hidden');
    $('btnAgain').onclick = () => location.reload();
  },
};

function arcReady(id) {
  const c = C(id);
  return alive(id) && c.arc < 3 && c.aff >= ARC_AFF[c.arc] && S.day - (c.arcDay === undefined ? -99 : c.arcDay) >= 2;
}

function worldEnding(p) {
  if (p.special === 'eden') {
    if (hasFlag('lumen_harmed')) return '<p>You settled on Eden\'s Echo. The Lumen retreated to the far continents and never came back. The forests went dark where you built. Your children grow up in the most beautiful place humans have ever lived, and they grow up knowing it was someone else\'s. Some of them are trying to make amends. It will take generations.</p>';
    if (hasFlag('lumen_friend')) return '<p>You settled on Eden\'s Echo, and you were not alone. The Lumen came down from the trees on the first night and drifted between the tents, humming. It took six years to learn to speak to them, and the first thing they said, in Cal\'s borrowed melody, was <i>welcome</i>. Humans and Lumen share the valley now. The children of both are learning each other\'s songs.</p>';
    return '<p>You settled on Eden\'s Echo, carefully, at the edge of the Lumen forests. For years the two peoples watched each other across a river. Then, one spring, a Lumen crossed it, carrying a petal of light, and a human child walked out to meet it.</p>';
  }
  if (p.special === 'ashfall') return `<p>You settled on Ashfall, among the leaning spires of a people who burned their world and never left it. You built with their stones and farmed their soil, and you read their warnings every day. ${hasFlag('ashfall_translated') ? 'Their last words are carved over the colony gate: BE LESS BUSY THAN US.' : 'Nobody could read their words. Everybody understood them.'} Slowly, green returned to the ashes. You like to think they would be glad.</p>`;
  if (p.special === 'thalassa') return '<p>You settled on Thalassa, a world of ocean and storm. The first settlement clung to a volcanic island; the second floated. The sea never became safe, and it never became boring. Children here learn to swim before they walk, and to sing back to the vast creatures that pass offshore. The creatures, it turns out, sing back.</p>';
  const t = PLANET_TYPES[p.type].name.toLowerCase();
  if (p.hab >= 75) return `<p>You settled on ${p.name}, a ${t} so gentle it felt like forgiveness. The first harvest came in a single season. Nobody had to be told to be careful with it. Everyone had seen what happens when you aren\'t.</p>`;
  if (p.hab >= 60) return `<p>You settled on ${p.name}, a ${t} that gave nothing for free. The first winter killed half the crops, and the second nearly killed the colony. But the third was better, and the fourth was good, and by the tenth, the settlement had a school, a library and a festival.</p>`;
  return `<p>You settled on ${p.name}, a hard ${t} at the edge of what humans can bear. Life here is domes and airlocks and careful rationing. But it is life, and it is yours, and every year it is a little easier.</p>`;
}

const VOTE_YES = {
  joy: ['Let\'s go build a party planet!', 'Yes! Yes yes yes!', 'I\'m already picturing the beach bar.'],
  sorrow: ['I\'m so tired. Let\'s stop.', 'Somewhere to bury our dead. Yes.', 'It\'s not Earth. Nothing will be. Yes.'],
  anger: ['Fine. But we do it right this time.', 'Yes, and nobody owns the water.', 'Better than rotting in a tin can.'],
  fear: ['Please. I can\'t do another jump.', 'Solid ground. Please. Yes.', 'Before something else goes wrong. Yes.'],
  love: ['Anywhere, as long as it\'s with you lot.', 'Home is us. Let\'s put it somewhere.', 'Yes. For the kids we\'ll have.'],
  greed: ['Look at those resources. Yes.', 'First pick of the land. Yes.', 'We could be rich here. Well. Comfortable.'],
  hope: ['This is it. I can feel it.', 'Yes. A thousand times yes.', 'We\'ll make it better than it looks.'],
  wonder: ['A whole world to learn. Yes!', 'Lifetimes of discovery. Yes.', 'I want to name every beetle.'],
};
const VOTE_NO = {
  joy: ['We\'re having too much fun out here!', 'Why stop now? The party\'s just started.', 'Nah. Next one\'ll be better.'],
  sorrow: ['It doesn\'t feel like home. Not yet.', 'I can\'t. Not here.', 'It\'s too sad a place.'],
  anger: ['No. We can do better than this.', 'I didn\'t come all this way to settle.', 'Absolutely not.'],
  fear: ['It\'s not safe enough. Not for children.', 'Something here will kill us. I know it.', 'I\'m scared of what we\'ll find down there.'],
  love: ['Not everyone\'s ready. I won\'t leave anyone behind.', 'Not until we all want it.', 'I love you all. No.'],
  greed: ['We deserve better than this.', 'Too poor. Keep looking.', 'There\'s richer out there.'],
  hope: ['There\'s something better out there. I know it.', 'Not this one. The next one.', 'We haven\'t found it yet.'],
  wonder: ['There\'s so much more to see!', 'Stop? We\'ve barely started!', 'One more star. Just one.'],
};

window.addEventListener('load', () => Game.init());
