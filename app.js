(() => {
  const $ = (id) => document.getElementById(id);
  const rand = (n) => Math.floor(Math.random() * n);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  let rec = store.get("arcade_rec", { snake: 0, mem: null, react: null, whale: 0 });
  let soundOn = store.get("arcade_sound", true);
  const saveRec = () => { store.set("arcade_rec", rec); renderRecords(); };

  function renderRecords() {
    $("rSnake").textContent = rec.snake;
    $("rMem").textContent = rec.mem === null ? "—" : rec.mem + " жүріс";
    $("rReact").textContent = rec.react === null ? "—" : rec.react + " мс";
    $("rWhale").textContent = rec.whale;
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  let actx;
  function beep(freq = 440, dur = 0.08, type = "square", vol = 0.04) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch {}
  }

  function updateSoundBtn() { $("soundBtn").textContent = soundOn ? "🔊 Дыбыс" : "🔇 Дыбыс"; }
  $("soundBtn").addEventListener("click", () => { soundOn = !soundOn; store.set("arcade_sound", soundOn); updateSoundBtn(); beep(660, 0.08); });
  updateSoundBtn();

  $("resetRecords").addEventListener("click", () => {
    rec = { snake: 0, mem: null, react: null, whale: 0 };
    saveRec();
    toast("Рекордтар тазаланды");
  });

  /* ================= SNAKE ================= */
  const sc = $("snakeCanvas"), sx = sc.getContext("2d");
  const N = 18, S = sc.width / N;
  let snake, dir, nextDir, food, sscore, sTimer = null, sState = "idle";

  function placeFood() {
    do { food = { x: rand(N), y: rand(N) }; }
    while (snake.some((s) => s.x === food.x && s.y === food.y));
  }

  function snakeReset() {
    clearTimeout(sTimer);
    sState = "idle";
    snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
    dir = { x: 1, y: 0 }; nextDir = dir; sscore = 0;
    $("snakeScore").textContent = 0;
    $("snakeBtn").textContent = "▶ Бастау";
    placeFood();
    snakeDraw();
  }

  function snakeDraw() {
    sx.fillStyle = "#0a1124";
    sx.fillRect(0, 0, sc.width, sc.height);
    sx.strokeStyle = "rgba(120,160,255,0.07)";
    for (let i = 1; i < N; i++) {
      sx.beginPath(); sx.moveTo(i * S, 0); sx.lineTo(i * S, sc.height); sx.stroke();
      sx.beginPath(); sx.moveTo(0, i * S); sx.lineTo(sc.width, i * S); sx.stroke();
    }
    sx.shadowColor = "#f472b6"; sx.shadowBlur = 14;
    sx.fillStyle = "#f472b6";
    sx.beginPath(); sx.arc(food.x * S + S / 2, food.y * S + S / 2, S / 2 - 3, 0, Math.PI * 2); sx.fill();
    sx.shadowColor = "#22d3ee";
    snake.forEach((s, i) => {
      sx.fillStyle = i === 0 ? "#a3e635" : "#22d3ee";
      sx.globalAlpha = Math.max(0.45, 1 - i * 0.03);
      sx.fillRect(s.x * S + 1.5, s.y * S + 1.5, S - 3, S - 3);
    });
    sx.globalAlpha = 1; sx.shadowBlur = 0;

    const msg = sState === "idle" ? "Бастау үшін басыңыз"
      : sState === "pause" ? "Үзіліс"
      : sState === "over" ? "Ойын бітті" : "";
    if (msg) {
      sx.fillStyle = "rgba(4,10,24,0.65)";
      sx.fillRect(0, sc.height / 2 - 34, sc.width, 68);
      sx.fillStyle = "#e6ecff";
      sx.font = "bold 22px Segoe UI, sans-serif";
      sx.textAlign = "center";
      sx.fillText(msg, sc.width / 2, sc.height / 2 + 8);
    }
  }

  function snakeOver() {
    sState = "over";
    clearTimeout(sTimer);
    $("snakeBtn").textContent = "↻ Қайта ойнау";
    beep(150, 0.4, "sawtooth", 0.06);
    if (sscore > rec.snake) { rec.snake = sscore; saveRec(); toast("🏆 Жаңа рекорд: " + sscore); }
    else toast("Ойын бітті. Ұпай: " + sscore);
    snakeDraw();
  }

  function snakeStep() {
    dir = nextDir;
    const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some((s) => s.x === h.x && s.y === h.y)) {
      snakeOver(); return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      sscore++;
      $("snakeScore").textContent = sscore;
      beep(780, 0.08, "triangle", 0.06);
      placeFood();
    } else {
      snake.pop();
    }
    snakeDraw();
  }

  function snakeLoop() {
    if (sState !== "run") return;
    snakeStep();
    if (sState === "run") sTimer = setTimeout(snakeLoop, Math.max(65, 140 - sscore * 4));
  }

  function snakeStart() {
    if (sState === "over") snakeReset();
    if (sState === "idle" || sState === "pause") {
      sState = "run";
      $("snakeBtn").textContent = "⏸ Тоқтату";
      snakeLoop();
    }
  }

  function snakePause() {
    if (sState !== "run") return;
    clearTimeout(sTimer);
    sState = "pause";
    $("snakeBtn").textContent = "▶ Жалғастыру";
    snakeDraw();
  }

  function setDir(dx, dy) {
    if (dx === -dir.x && dy === -dir.y) return;
    nextDir = { x: dx, y: dy };
  }

  $("snakeBtn").addEventListener("click", () => (sState === "run" ? snakePause() : snakeStart()));
  $("snakeRestart").addEventListener("click", snakeReset);

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  document.querySelectorAll(".dpad [data-dir]").forEach((b) =>
    b.addEventListener("click", () => {
      const v = DIRS[b.dataset.dir];
      setDir(v[0], v[1]);
      if (sState !== "run") snakeStart();
    })
  );

  let current = "snake";
  document.addEventListener("keydown", (e) => {
    if (current !== "snake") return;
    const map = {
      ArrowUp: DIRS.up, w: DIRS.up, ArrowDown: DIRS.down, s: DIRS.down,
      ArrowLeft: DIRS.left, a: DIRS.left, ArrowRight: DIRS.right, d: DIRS.right
    };
    const v = map[e.key] || map[e.key.toLowerCase()];
    if (v) {
      e.preventDefault();
      setDir(v[0], v[1]);
      if (sState !== "run") snakeStart();
    } else if (e.key === " ") {
      e.preventDefault();
      sState === "run" ? snakePause() : snakeStart();
    }
  });

  /* ================= MEMORY ================= */
  const emojis = ["🐳", "🐍", "🚀", "🐧", "⚙️", "📦", "🔥", "💎"];
  let deck = [], flipped = [], lockM = false, moves = 0, pairs = 0, mTime = 0, mTimer = null, mStarted = false;

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function memNew() {
    clearInterval(mTimer);
    mTimer = null; mStarted = false; mTime = 0; moves = 0; pairs = 0; flipped = []; lockM = false;
    $("memMoves").textContent = 0;
    $("memTime").textContent = "0с";
    deck = shuffle([...emojis, ...emojis]);
    const g = $("memGrid");
    g.innerHTML = "";
    deck.forEach((em, i) => {
      const b = document.createElement("button");
      b.className = "mcard";
      b.innerHTML = '<span class="face front">❓</span><span class="face back">' + em + "</span>";
      b.addEventListener("click", () => memFlip(i, b));
      g.appendChild(b);
    });
  }

  function memFlip(i, b) {
    if (lockM || b.classList.contains("flip") || b.classList.contains("done")) return;
    if (!mStarted) {
      mStarted = true;
      mTimer = setInterval(() => { mTime++; $("memTime").textContent = mTime + "с"; }, 1000);
    }
    b.classList.add("flip");
    beep(520, 0.05, "sine", 0.05);
    flipped.push({ i, b });
    if (flipped.length === 2) {
      moves++;
      $("memMoves").textContent = moves;
      const [x, y] = flipped;
      if (deck[x.i] === deck[y.i]) {
        x.b.classList.add("done"); y.b.classList.add("done");
        flipped = [];
        pairs++;
        beep(880, 0.12, "triangle", 0.06);
        if (pairs === emojis.length) memWin();
      } else {
        lockM = true;
        setTimeout(() => {
          x.b.classList.remove("flip"); y.b.classList.remove("flip");
          flipped = []; lockM = false;
        }, 750);
      }
    }
  }

  function memWin() {
    clearInterval(mTimer);
    beep(1040, 0.3, "triangle", 0.07);
    if (rec.mem === null || moves < rec.mem) { rec.mem = moves; saveRec(); toast("🏆 Жаңа рекорд: " + moves + " жүріс, " + mTime + "с"); }
    else toast("🎉 Жеңіс! " + moves + " жүріс, " + mTime + "с");
  }

  $("memNew").addEventListener("click", memNew);

  /* ================= REACTION ================= */
  const rb = $("reactBox");
  let rState = "idle", rTimeout = null, rStart = 0;

  function reactReset() {
    clearTimeout(rTimeout);
    rState = "idle";
    rb.className = "react-box";
    rb.innerHTML = "<b>Бастау үшін басыңыз</b><small>Жасыл түс шыққанда бірден басыңыз</small>";
  }

  function rate(ms) {
    return ms < 200 ? "🚀 Керемет!" : ms < 300 ? "👍 Жақсы" : ms < 450 ? "🙂 Орташа" : "🐢 Баяу";
  }

  rb.addEventListener("click", () => {
    if (rState === "idle" || rState === "result" || rState === "early") {
      rState = "wait";
      rb.className = "react-box wait";
      rb.innerHTML = "<b>Күтіңіз...</b><small>Түс жасыл болғанша баспаңыз</small>";
      rTimeout = setTimeout(() => {
        rState = "go";
        rb.className = "react-box go";
        rb.innerHTML = "<b>ҚАЗІР БАСЫҢЫЗ!</b>";
        rStart = performance.now();
        beep(900, 0.08, "square", 0.05);
      }, 1000 + Math.random() * 3000);
    } else if (rState === "wait") {
      clearTimeout(rTimeout);
      rState = "early";
      rb.className = "react-box early";
      rb.innerHTML = "<b>Тым ерте! 😅</b><small>Қайта бастау үшін басыңыз</small>";
      beep(180, 0.2, "sawtooth", 0.06);
    } else if (rState === "go") {
      const ms = Math.round(performance.now() - rStart);
      rState = "result";
      rb.className = "react-box result";
      rb.innerHTML = "<b>" + ms + " мс</b><small>" + rate(ms) + " · қайта басыңыз</small>";
      beep(700, 0.1, "triangle", 0.06);
      if (rec.react === null || ms < rec.react) { rec.react = ms; saveRec(); toast("🏆 Жаңа рекорд: " + ms + " мс"); }
    }
  });

  /* ================= WHALE ================= */
  const holesEl = $("holes");
  const holes = [];
  let wScore = 0, wLeft = 30, wTimer = null, wSpawn = null, wRunning = false, wLast = -1;

  for (let i = 0; i < 9; i++) {
    const b = document.createElement("button");
    b.className = "hole";
    b.innerHTML = '<span class="whale">🐳</span>';
    b.addEventListener("click", () => {
      if (!wRunning || !b.classList.contains("up")) return;
      wScore++;
      $("whaleScore").textContent = wScore;
      b.classList.remove("up");
      b.classList.add("hit");
      setTimeout(() => b.classList.remove("hit"), 200);
      beep(600 + Math.min(wScore, 20) * 25, 0.07, "triangle", 0.06);
      clearTimeout(wSpawn);
      wSpawn = setTimeout(whaleSpawn, 180);
    });
    holes.push(b);
    holesEl.appendChild(b);
  }

  function clearUp() { holes.forEach((h) => h.classList.remove("up")); }

  function whaleSpawn() {
    if (!wRunning) return;
    clearUp();
    let i;
    do { i = rand(9); } while (i === wLast);
    wLast = i;
    holes[i].classList.add("up");
    const stay = Math.max(430, 900 - wScore * 12);
    wSpawn = setTimeout(() => {
      clearUp();
      wSpawn = setTimeout(whaleSpawn, 150 + rand(250));
    }, stay);
  }

  function whaleStop() {
    clearInterval(wTimer);
    clearTimeout(wSpawn);
    wRunning = false;
    clearUp();
    $("whaleBtn").textContent = "▶ Бастау";
  }

  function whaleEnd() {
    const s = wScore;
    whaleStop();
    beep(300, 0.3, "sawtooth", 0.06);
    if (s > rec.whale) { rec.whale = s; saveRec(); toast("🏆 Жаңа рекорд: " + s + " кит"); }
    else toast("Уақыт бітті! Ұпай: " + s);
  }

  function whaleStart() {
    whaleStop();
    wScore = 0; wLeft = 30; wLast = -1; wRunning = true;
    $("whaleScore").textContent = 0;
    $("whaleTime").textContent = "30с";
    $("whaleBtn").textContent = "⏹ Тоқтату";
    wTimer = setInterval(() => {
      wLeft--;
      $("whaleTime").textContent = wLeft + "с";
      if (wLeft <= 0) whaleEnd();
    }, 1000);
    whaleSpawn();
  }

  $("whaleBtn").addEventListener("click", () => (wRunning ? whaleStop() : whaleStart()));

  /* ================= TABS ================= */
  function stopAll() {
    snakePause();
    whaleStop();
    reactReset();
    clearInterval(mTimer);
  }

  function show(name) {
    stopAll();
    current = name;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
    if (name === "memory") memNew();
    if (name === "react") reactReset();
    if (name === "snake") snakeDraw();
  }

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));

  renderRecords();
  snakeReset();
  memNew();
  reactReset();
  show("snake");
})();
