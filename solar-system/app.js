(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const TILT = 0.5; // sploštenost ravni orbita (pogled iz perspektive)
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.getElementById("space");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ------------------------------------------------------------------ */
  /*  Podaci                                                             */
  /* ------------------------------------------------------------------ */

  function rng(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const scatter = (seed, n, make) => {
    const r = rng(seed);
    return Array.from({ length: n }, () => make(r));
  };

  const SUN = {
    id: "sun",
    kind: "star",
    name: "Sunce",
    type: "Zvezda · žuti patuljak",
    size: 34,
    color: "#ffb454",
    glow: "rgba(255,170,60,.55)",
    desc: "Sunce sadrži 99,86% mase celog Sunčevog sistema. Svetlost sa njegove površine do Zemlje putuje oko 8 minuta i 20 sekundi.",
    stats: [
      ["Prečnik", "1.392.700 km"],
      ["Masa", "333.000 × Zemlja"],
      ["Temperatura površine", "≈ 5.500 °C"],
      ["Temperatura jezgra", "≈ 15 miliona °C"],
      ["Starost", "≈ 4,6 milijardi god."],
    ],
    fun: "U unutrašnjost Sunca bi moglo da stane oko 1,3 miliona Zemalja.",
    features: [
      ...scatter(11, 60, (r) => ({ u: r(), v: r() * 1.7 - 0.85, s: 0.03 + r() * 0.05, c: "#fff7c2", a: 0.22, k: 1 })),
      ...scatter(12, 40, (r) => ({ u: r(), v: r() * 1.7 - 0.85, s: 0.03 + r() * 0.05, c: "#d4560a", a: 0.2, k: 1 })),
      { u: 0.1, v: 0.3, s: 0.045, c: "#5a1c00", a: 0.65, k: 1 },
      { u: 0.16, v: 0.34, s: 0.03, c: "#5a1c00", a: 0.65, k: 1 },
      { u: 0.62, v: -0.25, s: 0.04, c: "#5a1c00", a: 0.65, k: 1 },
    ],
  };

  const PLANETS = [
    {
      id: "mercury",
      name: "Merkur",
      type: "Kamena planeta",
      r: 62,
      size: 3.6,
      phase: 0.6,
      period: 88,
      spin: 0.03,
      c: ["#d6d0c8", "#9a938b", "#3c3935"],
      color: "#b5aea6",
      glow: null,
      desc: "Najmanja planeta i najbliža Suncu. Nema prave atmosfere, pa se temperature između dana i noći razlikuju za više od 600 °C.",
      stats: [
        ["Prečnik", "4.879 km"],
        ["Udaljenost od Sunca", "57,9 mil. km"],
        ["Godina", "88 zemaljskih dana"],
        ["Dan (rotacija)", "59 zemaljskih dana"],
        ["Temperatura", "−180 do 430 °C"],
        ["Satelita", "0"],
      ],
      fun: "Iako je najbliži Suncu, Merkur nije najtoplija planeta — to je Venera.",
      features: scatter(21, 12, (r) => ({ u: r(), v: r() * 1.6 - 0.8, s: 0.08 + r() * 0.1, c: "#4a4540", a: 0.5 })),
      moons: [],
    },
    {
      id: "venus",
      name: "Venera",
      type: "Kamena planeta",
      r: 92,
      size: 6.4,
      phase: 2.4,
      period: 225,
      spin: -0.02,
      c: ["#fbe9c0", "#e2b66d", "#7d5524"],
      color: "#e8c27a",
      glow: "rgba(255,210,130,.55)",
      desc: "Gusta atmosfera od ugljen-dioksida stvara ekstremni efekat staklene bašte. Rotira unazad, pa Sunce na njoj izlazi na zapadu.",
      stats: [
        ["Prečnik", "12.104 km"],
        ["Udaljenost od Sunca", "108,2 mil. km"],
        ["Godina", "225 zemaljskih dana"],
        ["Dan (rotacija)", "243 zemaljska dana"],
        ["Temperatura", "≈ 465 °C"],
        ["Satelita", "0"],
      ],
      fun: "Jedan dan na Veneri traje duže od njene godine.",
      features: scatter(22, 14, (r) => ({ u: r(), v: r() * 1.7 - 0.85, s: 0.2 + r() * 0.2, w: 1.8, h: 0.35, c: r() > 0.5 ? "#fff3d6" : "#b7822f", a: 0.3 })),
      moons: [],
    },
    {
      id: "earth",
      name: "Zemlja",
      type: "Kamena planeta · dom života",
      r: 126,
      size: 6.8,
      phase: 4.1,
      period: 365.25,
      spin: 0.15,
      c: ["#8cc8ff", "#2b72d6", "#0a2760"],
      color: "#4a90e2",
      glow: "rgba(110,175,255,.6)",
      desc: "Jedina poznata planeta sa životom i tečnom vodom na površini. Oko 71% površine prekriveno je okeanima.",
      stats: [
        ["Prečnik", "12.742 km"],
        ["Udaljenost od Sunca", "149,6 mil. km"],
        ["Godina", "365,25 dana"],
        ["Dan (rotacija)", "24 h"],
        ["Prosečna temperatura", "≈ 15 °C"],
        ["Satelita", "1 (Mesec)"],
      ],
      fun: "Mesec se svake godine udalji od Zemlje za oko 3,8 centimetara.",
      features: [
        { u: 0.05, v: 0.35, s: 0.3, w: 1.1, h: 1.2, c: "#4f9d56", a: 0.95 },
        { u: 0.12, v: -0.25, s: 0.2, w: 0.8, h: 1.5, c: "#5da562", a: 0.95 },
        { u: 0.33, v: 0.45, s: 0.34, w: 1.5, h: 0.8, c: "#6aa65a", a: 0.95 },
        { u: 0.4, v: -0.1, s: 0.22, w: 0.9, h: 1.2, c: "#c9b26a", a: 0.9 },
        { u: 0.65, v: 0.3, s: 0.2, w: 1.2, h: 0.8, c: "#4f9d56", a: 0.95 },
        { u: 0.82, v: -0.5, s: 0.22, w: 1.3, h: 0.7, c: "#6aa65a", a: 0.95 },
        { u: 0, v: 0.97, s: 0.36, w: 3, h: 0.25, c: "#ffffff", a: 0.95 },
        { u: 0, v: -0.97, s: 0.4, w: 3, h: 0.25, c: "#ffffff", a: 0.95 },
        ...scatter(23, 10, (r) => ({ u: r(), v: r() * 1.5 - 0.75, s: 0.12 + r() * 0.1, w: 2.2, h: 0.22, c: "#ffffff", a: 0.38, k: 1.35 })),
      ],
      moons: [{ name: "Mesec", d: 2.7, s: 0.27, T: 3.4, ph: 1, c: "#c9c6c0" }],
    },
    {
      id: "mars",
      name: "Mars",
      type: "Kamena planeta",
      r: 162,
      size: 4.8,
      phase: 5.5,
      period: 687,
      spin: 0.14,
      c: ["#f6b186", "#c4562c", "#4b1d0e"],
      color: "#d9693a",
      glow: "rgba(255,130,80,.4)",
      desc: "Crvena boja potiče od gvožđe-oksida (rđe) u tlu. Na Marsu se nalazi Olimp, najviši vulkan u Sunčevom sistemu.",
      stats: [
        ["Prečnik", "6.779 km"],
        ["Udaljenost od Sunca", "227,9 mil. km"],
        ["Godina", "687 zemaljskih dana"],
        ["Dan (rotacija)", "24 h 37 min"],
        ["Prosečna temperatura", "≈ −63 °C"],
        ["Satelita", "2 (Fobos, Dejmos)"],
      ],
      fun: "Vulkan Olimp je visok oko 22 km — otprilike 2,5 puta viši od Mont Everesta.",
      features: [
        ...scatter(24, 9, (r) => ({ u: r(), v: r() * 1.4 - 0.7, s: 0.16 + r() * 0.16, w: 1.4, h: 0.8, c: "#6e2f1c", a: 0.5 })),
        { u: 0, v: 0.97, s: 0.35, w: 2.5, h: 0.25, c: "#ffffff", a: 0.9 },
        { u: 0, v: -0.97, s: 0.3, w: 2.5, h: 0.2, c: "#ffffff", a: 0.8 },
      ],
      moons: [
        { name: "Fobos", d: 1.9, s: 0.09, T: 1.5, ph: 0, c: "#9b8878" },
        { name: "Dejmos", d: 2.8, s: 0.07, T: 4.6, ph: 2, c: "#a89a8c" },
      ],
    },
    {
      id: "jupiter",
      name: "Jupiter",
      type: "Gasoviti džin",
      r: 292,
      size: 17,
      phase: 1.3,
      period: 4333,
      spin: 0.25,
      c: ["#f4e1c1", "#c99a6b", "#5c3b27"],
      color: "#d3a27a",
      glow: "rgba(255,210,160,.3)",
      bands: [
        [-0.95, -0.72, "#b58a64"],
        [-0.72, -0.52, "#ecd5b0"],
        [-0.52, -0.32, "#a8744e"],
        [-0.32, -0.12, "#f2dfc0"],
        [-0.12, 0.1, "#c18b5e"],
        [0.1, 0.3, "#efd9b6"],
        [0.3, 0.5, "#a97a55"],
        [0.5, 0.7, "#e6cba6"],
        [0.7, 0.95, "#b88c68"],
      ],
      desc: "Najveća planeta — veća od svih ostalih planeta zajedno. Velika crvena pega je oluja koja besni već stotinama godina.",
      stats: [
        ["Prečnik", "139.820 km"],
        ["Udaljenost od Sunca", "778,5 mil. km"],
        ["Godina", "11,9 zemaljskih god."],
        ["Dan (rotacija)", "9 h 56 min"],
        ["Temperatura oblaka", "≈ −110 °C"],
        ["Satelita", "95+"],
      ],
      fun: "U Jupiter bi stalo više od 1.300 Zemalja.",
      features: [{ u: 0.3, v: 0.3, s: 0.2, w: 1.5, h: 0.9, c: "#b5482e", a: 0.9 }],
      moons: [
        { name: "Io", d: 1.9, s: 0.1, T: 2.2, ph: 0.5, c: "#e8d27a" },
        { name: "Evropa", d: 2.4, s: 0.09, T: 4.3, ph: 2.5, c: "#e2d8c4" },
        { name: "Ganimed", d: 3.1, s: 0.13, T: 8.6, ph: 4.4, c: "#a99b8c" },
        { name: "Kalisto", d: 3.9, s: 0.12, T: 20, ph: 1.7, c: "#6f6358" },
      ],
    },
    {
      id: "saturn",
      name: "Saturn",
      type: "Gasoviti džin",
      r: 358,
      size: 14,
      phase: 3.3,
      period: 10759,
      spin: 0.22,
      ring: true,
      c: ["#fbebbd", "#d6b36e", "#6b5530"],
      color: "#e3c68a",
      glow: "rgba(255,225,160,.3)",
      bands: [
        [-0.95, -0.6, "#cfae6c"],
        [-0.6, -0.35, "#f1dca3"],
        [-0.35, -0.1, "#d7b777"],
        [-0.1, 0.15, "#f6e5b4"],
        [0.15, 0.4, "#d2b274"],
        [0.4, 0.65, "#ecd49a"],
        [0.65, 0.95, "#c3a566"],
      ],
      desc: "Poznat po sjajnim prstenovima od leda i stena. Gustina mu je manja od vode — kad bi postojao dovoljno veliki okean, Saturn bi plutao.",
      stats: [
        ["Prečnik", "116.460 km"],
        ["Udaljenost od Sunca", "1,43 mlrd. km"],
        ["Godina", "29,4 zemaljske god."],
        ["Dan (rotacija)", "10 h 33 min"],
        ["Temperatura oblaka", "≈ −140 °C"],
        ["Satelita", "140+"],
      ],
      fun: "Prstenovi su široki stotine hiljada kilometara, a uglavnom debeli tek desetak metara.",
      features: [],
      moons: [
        { name: "Enkelad", d: 2.55, s: 0.05, T: 4, ph: 3, c: "#ffffff" },
        { name: "Titan", d: 3.7, s: 0.12, T: 9.5, ph: 0.8, c: "#d9a34a" },
      ],
    },
    {
      id: "uranus",
      name: "Uran",
      type: "Ledeni džin",
      r: 418,
      size: 10,
      phase: 0.2,
      period: 30687,
      spin: -0.16,
      c: ["#e2fbfc", "#8fd3dc", "#2c6672"],
      color: "#8fd8e0",
      glow: "rgba(150,230,240,.45)",
      bands: [
        [-0.95, -0.4, "#86ccd6"],
        [-0.4, 0.2, "#a2e0e8"],
        [0.2, 0.95, "#86ccd6"],
      ],
      desc: "Leži „na boku“ — osa rotacije nagnuta je za oko 98°. Boju mu daje metan u atmosferi.",
      stats: [
        ["Prečnik", "50.724 km"],
        ["Udaljenost od Sunca", "2,87 mlrd. km"],
        ["Godina", "84 zemaljske god."],
        ["Dan (rotacija)", "17 h 14 min"],
        ["Temperatura", "≈ −195 °C"],
        ["Satelita", "28"],
      ],
      fun: "Jedno godišnje doba na Uranu traje oko 21 zemaljsku godinu.",
      features: [],
      moons: [
        { name: "Titanija", d: 2.3, s: 0.07, T: 5, ph: 0, c: "#b8b2aa" },
        { name: "Oberon", d: 3, s: 0.07, T: 9, ph: 2, c: "#a39d96" },
        { name: "Umbrijel", d: 1.85, s: 0.05, T: 3, ph: 4, c: "#7d7872" },
      ],
    },
    {
      id: "neptune",
      name: "Neptun",
      type: "Ledeni džin",
      r: 472,
      size: 9.8,
      phase: 5.0,
      period: 60190,
      spin: 0.17,
      c: ["#a7c2ff", "#3f66e6", "#14206a"],
      color: "#4f78f0",
      glow: "rgba(100,140,255,.5)",
      bands: [
        [-0.95, -0.5, "#3c60dc"],
        [-0.5, 0.0, "#4c74ee"],
        [0.0, 0.5, "#3f66e2"],
        [0.5, 0.95, "#3558cc"],
      ],
      desc: "Najudaljenija planeta, sa najbržim vetrovima u sistemu — do oko 2.000 km/h. Otkrivena je matematičkim proračunom pre nego što je viđena.",
      stats: [
        ["Prečnik", "49.244 km"],
        ["Udaljenost od Sunca", "4,5 mlrd. km"],
        ["Godina", "164,8 zemaljskih god."],
        ["Dan (rotacija)", "16 h 6 min"],
        ["Temperatura", "≈ −200 °C"],
        ["Satelita", "16"],
      ],
      fun: "Od otkrića 1846. Neptun je tek 2011. završio svoj prvi pun krug oko Sunca.",
      features: [
        { u: 0.4, v: 0.2, s: 0.2, w: 1.5, h: 0.8, c: "#10246e", a: 0.8 },
        ...scatter(25, 4, (r) => ({ u: r(), v: r() * 1.2 - 0.6, s: 0.2, w: 2.6, h: 0.18, c: "#ffffff", a: 0.55, k: 1.3 })),
      ],
      moons: [{ name: "Triton", d: 2.7, s: 0.1, T: -6, ph: 1, c: "#d8c9c0" }],
    },
  ];

  const COMET = {
    id: "comet",
    kind: "comet",
    name: "Kometa",
    type: "Kometa · stilizovana",
    a: 285,
    e: 0.74,
    omega: 0.9,
    T: 84,
    m0: 3.2,
    size: 2.6,
    color: "#9fd6ff",
    glow: "rgba(140,200,255,.6)",
    desc: "Komete su ledena tela koja se približavanjem Suncu zagrevaju i razvijaju sjajni rep. Rep uvek pokazuje od Sunca, bez obzira na pravac kretanja komete.",
    stats: [
      ["Jezgro", "nekoliko kilometara"],
      ["Orbita", "izdužena elipsa"],
      ["Period (kao Halejeva)", "≈ 76 god."],
      ["Dužina repa", "do miliona km"],
      ["Satelita", "0"],
    ],
    fun: "Rep komete oblikuju Sunčev vetar i zračenje — zato je pred Suncem on uvek duži.",
  };

  const BODIES = [SUN, ...PLANETS, COMET];
  const byId = Object.fromEntries(BODIES.map((b) => [b.id, b]));

  // Stilizovano vreme: 1 zemaljska godina = 24 s pri brzini 1×; spoljne planete su ubrzane.
  const EARTH_T = 24;
  for (const p of PLANETS) p.kind = "planet";
  for (const p of PLANETS) p.T = EARTH_T * Math.pow(p.period / 365.25, 0.6);
  PLANETS.forEach((p) => (p.cache = null));

  const MARS = byId.mars;
  const JUP = byId.jupiter;
  const BELT_IN = 196;
  const BELT_OUT = 238;
  const belt = scatter(7, 950, (r) => {
    const radius = BELT_IN + Math.pow(r(), 0.9) * (BELT_OUT - BELT_IN);
    return {
      a: r() * TAU,
      r: radius,
      T: MARS.T + ((radius - MARS.r) / (JUP.r - MARS.r)) * (JUP.T - MARS.T),
      s: 0.7 + r() * 1.1,
      bright: r() > 0.55,
    };
  });
  const beltPos = belt.map(() => ({ x: 0, y: 0, front: false }));

  /* ------------------------------------------------------------------ */
  /*  Stanje                                                             */
  /* ------------------------------------------------------------------ */

  let W = 0;
  let H = 0;
  let DPR = 1;
  let fit = 1;
  let bgCanvas = document.createElement("canvas");
  let stars = [];
  let shooting = [];
  let nextShoot = 3;

  let simT = 0;
  let realT = 0;
  let speed = reduceMotion ? 0.5 : 1;
  let paused = false;
  let showOrbits = true;
  let showLabels = true;
  let intro = true;
  let userZoom = false;

  const cam = { x: 0, z: 0, zoom: 1 };
  const target = { x: 0, z: 0, zoom: 1 };
  const off = { x: 0, z: 0 };
  const view = { cx: 0, cy: 0 };
  let focus = null;
  let selected = null;
  let hover = null;
  let hits = [];

  const sc = () => Math.pow(cam.zoom, 0.75);

  /* ------------------------------------------------------------------ */
  /*  Pomoćne funkcije: pozicije                                         */
  /* ------------------------------------------------------------------ */

  function cometPos(c) {
    const M = (TAU * simT) / c.T + c.m0;
    let E = M;
    for (let i = 0; i < 7; i++) E -= (E - c.e * Math.sin(E) - M) / (1 - c.e * Math.cos(E));
    const b = c.a * Math.sqrt(1 - c.e * c.e);
    const px = c.a * (Math.cos(E) - c.e);
    const pz = b * Math.sin(E);
    const co = Math.cos(c.omega);
    const si = Math.sin(c.omega);
    return { x: px * co - pz * si, z: px * si + pz * co };
  }

  function worldPos(b) {
    if (b.kind === "star") return { x: 0, z: 0 };
    if (b.kind === "comet") return cometPos(b);
    const a = b.phase + (TAU * simT) / b.T;
    return { x: Math.cos(a) * b.r, z: Math.sin(a) * b.r };
  }

  const toScreenX = (x) => (x - cam.x) * cam.zoom + view.cx;
  const toScreenY = (z) => (z - cam.z) * cam.zoom * TILT + view.cy;

  /* ------------------------------------------------------------------ */
  /*  Veličina / pozadina / zvezde                                       */
  /* ------------------------------------------------------------------ */

  function computeFit() {
    const R = 520;
    const topPad = W <= 900 ? 120 : 90;
    const botPad = W <= 900 ? 110 : 100;
    return Math.min(W / (2 * R * 1.06), (H - topPad - botPad) / (2 * R * TILT * 1.06));
  }

  function introZoom() {
    const sr = Math.min(W, H) * 0.17;
    return Math.pow(sr / SUN.size, 1 / 0.75);
  }

  function buildBackground() {
    bgCanvas.width = Math.round(W * DPR);
    bgCanvas.height = Math.round(H * DPR);
    const g = bgCanvas.getContext("2d");
    g.scale(DPR, DPR);
    const base = g.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.8);
    base.addColorStop(0, "#0c1230");
    base.addColorStop(0.55, "#070a1d");
    base.addColorStop(1, "#03040b");
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);
    const blobs = [
      [0.15, 0.25, 0.5, "rgba(110,60,190,0.20)"],
      [0.85, 0.7, 0.55, "rgba(30,110,190,0.17)"],
      [0.6, 0.12, 0.35, "rgba(190,60,110,0.10)"],
      [0.3, 0.85, 0.4, "rgba(40,150,170,0.10)"],
    ];
    for (const [x, y, rr, col] of blobs) {
      const R = Math.max(W, H) * rr;
      const bg = g.createRadialGradient(W * x, H * y, 0, W * x, H * y, R);
      bg.addColorStop(0, col);
      bg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = bg;
      g.fillRect(0, 0, W, H);
    }
  }

  function buildStars() {
    const r = rng(99);
    const n = clamp(Math.round((W * H) / 4200), 160, 560);
    const tints = ["#ffffff", "#cfe0ff", "#ffe9cf", "#bcd0ff", "#fff4dd"];
    stars = Array.from({ length: n }, () => {
      const d = 0.05 + Math.pow(r(), 2) * 0.5;
      return {
        x: r(),
        y: r(),
        d,
        s: 0.6 + d * 2.2 + (r() > 0.97 ? 1 : 0),
        a: 0.35 + r() * 0.65,
        f: 0.6 + r() * 2.4,
        p: r() * TAU,
        c: tints[(r() * tints.length) | 0],
      };
    });
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    fit = computeFit();
    buildBackground();
    buildStars();
    if (!focus && !intro && !userZoom) target.zoom = fit;
    if (intro) {
      target.zoom = cam.zoom = introZoom();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Crtanje: pozadina                                                  */
  /* ------------------------------------------------------------------ */

  function drawStars() {
    const t = realT;
    for (const s of stars) {
      let x = (s.x * W - cam.x * s.d * 0.7 + t * s.d * 2.5) % W;
      let y = (s.y * H - cam.z * s.d * 0.35) % H;
      if (x < 0) x += W;
      if (y < 0) y += H;
      ctx.globalAlpha = s.a * (0.62 + 0.38 * Math.sin(t * s.f + s.p));
      ctx.fillStyle = s.c;
      if (s.s > 2) {
        ctx.beginPath();
        ctx.arc(x, y, s.s * 0.5, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, s.s, s.s);
      }
    }
    ctx.globalAlpha = 1;
  }

  function updateShooting(dt) {
    if (reduceMotion) return;
    nextShoot -= dt;
    if (nextShoot <= 0) {
      nextShoot = 3 + Math.random() * 6;
      shooting.push({
        x: Math.random() * W * 0.9,
        y: Math.random() * H * 0.45,
        vx: 650 + Math.random() * 500,
        vy: 250 + Math.random() * 250,
        t: 0,
        max: 0.8 + Math.random() * 0.5,
      });
    }
    for (const s of shooting) {
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    shooting = shooting.filter((s) => s.t < s.max);
  }

  function drawShooting() {
    ctx.globalCompositeOperation = "lighter";
    for (const s of shooting) {
      const life = 1 - s.t / s.max;
      const tx = s.x - s.vx * 0.14;
      const ty = s.y - s.vy * 0.14;
      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * life})`);
      g.addColorStop(1, "rgba(150,190,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  /* ------------------------------------------------------------------ */
  /*  Crtanje: orbite i pojas asteroida                                  */
  /* ------------------------------------------------------------------ */

  function drawOrbits() {
    if (!showOrbits) return;
    const z = cam.zoom;
    const cx = toScreenX(0);
    const cy = toScreenY(0);
    ctx.lineWidth = 1;
    for (const p of PLANETS) {
      const rx = p.r * z;
      if (rx > 40000) continue;
      const active = selected === p;
      ctx.strokeStyle = active ? "rgba(255,190,100,0.35)" : "rgba(160,185,255,0.13)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, rx * TILT, 0, 0, TAU);
      ctx.stroke();
    }
    // orbita komete
    const c = COMET;
    const b = c.a * Math.sqrt(1 - c.e * c.e);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(z, z * TILT);
    ctx.rotate(c.omega);
    ctx.lineWidth = 1 / z;
    ctx.setLineDash([6 / z, 7 / z]);
    ctx.strokeStyle = selected === c ? "rgba(159,214,255,0.6)" : "rgba(159,214,255,0.14)";
    ctx.beginPath();
    ctx.ellipse(-c.a * c.e, 0, c.a, b, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function updateBelt() {
    for (let i = 0; i < belt.length; i++) {
      const p = belt[i];
      const a = p.a + (TAU * simT) / p.T;
      const wx = Math.cos(a) * p.r;
      const wz = Math.sin(a) * p.r;
      const q = beltPos[i];
      q.x = toScreenX(wx);
      q.y = toScreenY(wz);
      q.front = wz >= 0;
    }
  }

  function drawBelt(front) {
    const k = Math.min(Math.pow(cam.zoom, 0.4), 2.6);
    for (const bright of [false, true]) {
      ctx.fillStyle = bright ? "rgba(214,202,190,0.85)" : "rgba(150,140,135,0.6)";
      for (let i = 0; i < belt.length; i++) {
        const p = belt[i];
        const q = beltPos[i];
        if (p.bright !== bright || q.front !== front) continue;
        if (q.x < -10 || q.x > W + 10 || q.y < -10 || q.y > H + 10) continue;
        const s = p.s * k;
        ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Crtanje: Sunce                                                     */
  /* ------------------------------------------------------------------ */

  function drawFeatures(x, y, r, feats, rot) {
    for (const f of feats) {
      const lon = TAU * (f.u + rot * (f.k || 1));
      const cl = Math.cos(lon);
      if (cl < -0.15) continue;
      const fx = x + r * Math.sqrt(Math.max(0, 1 - f.v * f.v)) * Math.sin(lon);
      const fy = y + r * f.v;
      const rx = r * f.s * (f.w || 1) * Math.max(cl, 0.1);
      const ry = r * f.s * (f.h || 1);
      ctx.globalAlpha = (f.a ?? 1) * clamp((cl + 0.15) * 3, 0, 1);
      ctx.fillStyle = f.c;
      ctx.beginPath();
      ctx.ellipse(fx, fy, rx, ry, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(it) {
    const { sx: x, sy: y, sr: r } = it;
    const t = realT;
    ctx.globalCompositeOperation = "lighter";
    let g = ctx.createRadialGradient(x, y, r * 0.7, x, y, r * 5.5);
    g.addColorStop(0, "rgba(255,175,70,0.42)");
    g.addColorStop(0.25, "rgba(255,130,40,0.16)");
    g.addColorStop(1, "rgba(255,100,20,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 5.5, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(t * 0.05);
    const rays = 22;
    for (let i = 0; i < rays; i++) {
      const len = r * (0.32 + 0.22 * Math.sin(t * 1.3 + i * 2.1) + 0.1 * Math.sin(t * 2.9 + i * 0.7));
      const ang = (i * TAU) / rays;
      const half = 0.1 + 0.03 * Math.sin(t + i);
      ctx.fillStyle = i % 2 ? "rgba(255,190,90,0.16)" : "rgba(255,150,50,0.13)";
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang - half) * r * 0.92, Math.sin(ang - half) * r * 0.92);
      ctx.lineTo(Math.cos(ang) * (r + len), Math.sin(ang) * (r + len));
      ctx.lineTo(Math.cos(ang + half) * r * 0.92, Math.sin(ang + half) * r * 0.92);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";

    g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.05, x, y, r);
    g.addColorStop(0, "#fffbe3");
    g.addColorStop(0.35, "#ffd85f");
    g.addColorStop(0.78, "#ff9b2d");
    g.addColorStop(1, "#e45a0c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.clip();
    drawFeatures(x, y, r, SUN.features, t * 0.012);
    const rim = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
    rim.addColorStop(0, "rgba(120,30,0,0)");
    rim.addColorStop(1, "rgba(120,30,0,0.45)");
    ctx.fillStyle = rim;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /*  Crtanje: planete                                                   */
  /* ------------------------------------------------------------------ */

  function drawMoon(x, y, r, m, lx, ly) {
    const g = ctx.createRadialGradient(x + lx * r * 0.4, y + ly * r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, m.c);
    g.addColorStop(1, "#2a2a30");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  function moonStates(p, x, y, r) {
    return p.moons.map((m) => {
      const ang = m.ph + (TAU * simT) / m.T;
      const mr = Math.max(m.s * r, 1.3);
      return {
        m,
        x: x + Math.cos(ang) * m.d * r,
        y: y + Math.sin(ang) * m.d * r * TILT,
        r: mr,
        front: Math.sin(ang) >= 0,
      };
    });
  }

  function ringHalf(x, y, r, front, inner, outer, fill) {
    const k = 0.34;
    const rot = -0.2;
    const s = front ? 0 : Math.PI;
    const e = front ? Math.PI : TAU;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, r * outer, r * outer * k, rot, s, e);
    ctx.ellipse(x, y, r * inner, r * inner * k, rot, e, s, true);
    ctx.closePath();
    ctx.fill();
  }

  function drawRings(x, y, r, front) {
    ringHalf(x, y, r, front, 1.22, 1.5, "rgba(160,138,100,0.55)");
    ringHalf(x, y, r, front, 1.52, 1.92, "rgba(232,212,168,0.82)");
    ringHalf(x, y, r, front, 1.96, 2.2, "rgba(190,170,132,0.55)");
  }

  function drawPlanet(it) {
    const { b: p, sx: x, sy: y, sr: r } = it;
    let lx = -it.wx;
    let ly = -it.wz * TILT;
    const ll = Math.hypot(lx, ly) || 1;
    lx /= ll;
    ly /= ll;

    const moons = r >= 5 ? moonStates(p, x, y, r) : [];

    // putanje meseca (kad je dovoljno blizu)
    if (moons.length && r >= 16 && showOrbits) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (const m of p.moons) {
        ctx.beginPath();
        ctx.ellipse(x, y, m.d * r, m.d * r * TILT, 0, 0, TAU);
        ctx.stroke();
      }
    }

    for (const m of moons) if (!m.front) drawMoon(m.x, m.y, m.r, m.m, lx, ly);

    if (p.glow) {
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(x, y, r * 0.96, x, y, r * 1.24);
      g.addColorStop(0, p.glow.replace(/[\d.]+\)$/, "0.32)"));
      g.addColorStop(1, p.glow.replace(/[\d.]+\)$/, "0)"));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.24, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }

    if (p.ring) drawRings(x, y, r, false);

    // sfera
    const g = ctx.createRadialGradient(x + lx * r * 0.45, y + ly * r * 0.45, r * 0.08, x, y, r);
    g.addColorStop(0, p.c[0]);
    g.addColorStop(0.55, p.c[1]);
    g.addColorStop(1, p.c[2]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();

    if (r >= 4) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.clip();
      if (p.bands) {
        ctx.globalAlpha = 0.6;
        for (const [v0, v1, col] of p.bands) {
          ctx.fillStyle = col;
          ctx.fillRect(x - r, y + v0 * r, r * 2, (v1 - v0) * r + 0.6);
        }
        ctx.globalAlpha = 1;
      }
      if (p.features.length) drawFeatures(x, y, r, p.features, simT * p.spin);

      // senka noćne strane
      const sh = ctx.createLinearGradient(x - lx * r, y - ly * r, x + lx * r, y + ly * r);
      sh.addColorStop(0, "rgba(0,0,12,0.88)");
      sh.addColorStop(0.5, "rgba(0,0,12,0.38)");
      sh.addColorStop(0.85, "rgba(0,0,12,0)");
      ctx.fillStyle = sh;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      const limb = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
      limb.addColorStop(0, "rgba(0,0,0,0)");
      limb.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = limb;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    }

    if (p.ring) drawRings(x, y, r, true);

    for (const m of moons) if (m.front) drawMoon(m.x, m.y, m.r, m.m, lx, ly);
  }

  /* ------------------------------------------------------------------ */
  /*  Crtanje: kometa                                                    */
  /* ------------------------------------------------------------------ */

  function drawComet(it) {
    const { sx: x, sy: y, wx, wz } = it;
    const dist = Math.hypot(wx, wz);
    let dx = wx;
    let dy = wz * TILT;
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    const len = clamp(14000 / dist, 30, 200) * sc() * 0.7;
    const w = Math.max(3, len * 0.07);
    ctx.globalCompositeOperation = "lighter";

    // jonski rep (prav)
    let g = ctx.createLinearGradient(x, y, x + dx * len, y + dy * len);
    g.addColorStop(0, "rgba(150,210,255,0.6)");
    g.addColorStop(1, "rgba(100,160,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - dy * w, y + dx * w);
    ctx.lineTo(x + dx * len, y + dy * len);
    ctx.lineTo(x + dy * w, y - dx * w);
    ctx.closePath();
    ctx.fill();

    // prašinasti rep (zakrivljen)
    const bend = len * 0.28;
    const ex = x + dx * len * 0.9 - dy * bend;
    const ey = y + dy * len * 0.9 + dx * bend;
    g = ctx.createLinearGradient(x, y, ex, ey);
    g.addColorStop(0, "rgba(255,232,190,0.5)");
    g.addColorStop(1, "rgba(255,200,140,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - dy * w * 1.6, y + dx * w * 1.6);
    ctx.quadraticCurveTo(x + dx * len * 0.5 - dy * bend * 0.15, y + dy * len * 0.5 + dx * bend * 0.15, ex, ey);
    ctx.quadraticCurveTo(x + dx * len * 0.5 - dy * bend * 0.8, y + dy * len * 0.5 + dx * bend * 0.8, x + dy * w * 1.6, y - dx * w * 1.6);
    ctx.closePath();
    ctx.fill();

    const cr = Math.max(2.2, it.sr);
    g = ctx.createRadialGradient(x, y, 0, x, y, cr * 6);
    g.addColorStop(0, "rgba(200,230,255,0.75)");
    g.addColorStop(1, "rgba(120,180,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, cr * 6, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#f4faff";
    ctx.beginPath();
    ctx.arc(x, y, cr, 0, TAU);
    ctx.fill();
  }

  /* ------------------------------------------------------------------ */
  /*  Glavno crtanje                                                     */
  /* ------------------------------------------------------------------ */

  function drawFrame() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.drawImage(bgCanvas, 0, 0, W, H);
    drawStars();
    drawShooting();
    drawOrbits();

    const k = sc();
    const minPx = 2.2;
    const items = [];
    for (const b of BODIES) {
      const pos = worldPos(b);
      let sr;
      if (b.kind === "star") sr = SUN.size * k * (1 + 0.015 * Math.sin(realT * 1.6));
      else sr = Math.max(b.size * k, minPx);
      items.push({ b, wx: pos.x, wz: pos.z, sx: toScreenX(pos.x), sy: toScreenY(pos.z), sr });
    }
    items.sort((a, c) => a.wz - c.wz);

    updateBelt();
    drawBelt(false);
    hits = [];
    for (const it of items) {
      if (it.b.kind === "star") drawSun(it);
      else if (it.b.kind === "comet") drawComet(it);
      else drawPlanet(it);
      hits.push({
        b: it.b,
        x: it.sx,
        y: it.sy,
        r: Math.max(it.sr * (it.b.ring ? 2 : 1), 13),
        sr: it.sr,
        item: it,
      });
    }
    drawBelt(true);

    // oznaka izabranog tela
    if (selected) {
      const h = hits.find((q) => q.b === selected);
      if (h) {
        const R = Math.max(h.sr * (selected.ring ? 2.45 : selected.kind === "star" ? 1.25 : 1.5) + 8, 18);
        ctx.save();
        ctx.setLineDash([5, 7]);
        ctx.lineDashOffset = -realT * 18;
        ctx.strokeStyle = "rgba(255,190,100,0.85)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(h.x, h.y, R, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }

    // nazivi
    if (showLabels || hover) {
      ctx.font = "500 12.5px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 5;
      for (const h of hits) {
        const active = h.b === hover || h.b === selected;
        if (!showLabels && !active) continue;
        if (h.x < -40 || h.x > W + 40 || h.y < -40 || h.y > H + 40) continue;
        const dy =
          h.b.kind === "star"
            ? h.sr * 1.25 + 18
            : Math.max(h.sr * (h.b.ring ? 1.2 : 1) + 17, 20);
        ctx.fillStyle = active ? "#ffd9a0" : "rgba(220,228,255,0.68)";
        ctx.fillText(h.b.name, h.x, h.y + dy);
      }
      ctx.shadowBlur = 0;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Kamera i izbor                                                     */
  /* ------------------------------------------------------------------ */

  function focusZoom(b) {
    const base = clamp(Math.min(W, H) / 800, 0.65, 1.3);
    const want = (b.kind === "star" ? 90 : b.kind === "comet" ? 30 : 62) * base;
    const size = b.kind === "comet" ? b.size * 2 : b.size;
    return clamp(Math.pow(want / size, 1 / 0.75), fit, 22);
  }

  function panelOpen() {
    return !!selected;
  }

  function select(b) {
    if (!b) return reset();
    selected = b;
    focus = b;
    const p = worldPos(b);
    off.x = cam.x - p.x;
    off.z = cam.z - p.z;
    target.zoom = focusZoom(b);
    userZoom = true;
    renderPanel(b);
    updateChips();
  }

  function reset() {
    selected = null;
    focus = null;
    userZoom = false;
    target.x = 0;
    target.z = 0;
    target.zoom = fit;
    closePanel();
    updateChips();
  }

  function release() {
    if (focus) {
      focus = null;
      target.x = cam.x;
      target.z = cam.z;
    }
  }

  function updateCamera(dt) {
    const kPos = 1 - Math.exp(-dt * 2.6);
    const kZoom = 1 - Math.exp(-dt * 3.2);
    cam.zoom = Math.exp(Math.log(cam.zoom) + (Math.log(target.zoom) - Math.log(cam.zoom)) * kZoom);
    if (focus) {
      const p = worldPos(focus);
      const d = Math.exp(-dt * 3);
      off.x *= d;
      off.z *= d;
      cam.x = p.x + off.x;
      cam.z = p.z + off.z;
      target.x = cam.x;
      target.z = cam.z;
    } else {
      cam.x += (target.x - cam.x) * kPos;
      cam.z += (target.z - cam.z) * kPos;
    }
    // pomeranje centra pogleda zbog panela / intro ekrana
    let tcx = W / 2;
    let tcy = H / 2;
    if (intro) tcy = H * 0.36;
    else if (panelOpen()) {
      if (W > 900) tcx = (W - 380) / 2 + 20;
      else tcy = H * 0.34;
    }
    view.cx += (tcx - view.cx) * kPos;
    view.cy += (tcy - view.cy) * kPos;
  }

  /* ------------------------------------------------------------------ */
  /*  UI                                                                 */
  /* ------------------------------------------------------------------ */

  const chipsEl = $("chips");
  const panel = $("info");

  for (const b of BODIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.id = b.id;
    btn.style.setProperty("--c", b.color);
    btn.innerHTML = `<i></i>${b.name}`;
    btn.addEventListener("click", () => (selected === b ? reset() : select(b)));
    chipsEl.appendChild(btn);
  }

  function updateChips() {
    for (const el of chipsEl.children) {
      el.setAttribute("aria-current", selected && el.dataset.id === selected.id ? "true" : "false");
    }
    const cur = chipsEl.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function renderPanel(b) {
    $("info-kicker").textContent = b.type;
    $("info-name").textContent = b.name;
    $("info-desc").textContent = b.desc;
    $("info-fun").textContent = b.fun;
    $("info-stats").innerHTML = b.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    const orb = $("info-orb");
    const c = b.c || [b.color, b.color, b.color];
    orb.style.setProperty("--orb", `radial-gradient(circle at 32% 30%, ${c[0]}, ${c[1]} 55%, ${c[2]})`);
    orb.style.setProperty("--glow", b.glow || "rgba(255,255,255,0.25)");
    if (b.kind === "star") orb.style.setProperty("--orb", "radial-gradient(circle at 32% 30%, #fffbe3, #ffd85f 40%, #ff8a1f)");
    // ponovo pokreni animaciju ulaska
    panel.classList.remove("open");
    void panel.offsetWidth;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    panel.scrollTop = 0;
  }

  function closePanel() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  $("info-close").addEventListener("click", reset);
  $("btn-reset").addEventListener("click", reset);

  const playBtn = $("btn-play");
  function setPaused(v) {
    paused = v;
    playBtn.setAttribute("aria-pressed", String(paused));
    playBtn.setAttribute("aria-label", paused ? "Nastavi" : "Pauziraj");
  }
  playBtn.addEventListener("click", () => setPaused(!paused));

  const speedEl = $("speed");
  const speedOut = $("speed-out");
  function setSpeed(v) {
    speed = v;
    speedOut.textContent = `${v}×`;
    speedEl.style.setProperty("--fill", `${(v / 8) * 100}%`);
  }
  speedEl.addEventListener("input", () => setSpeed(parseFloat(speedEl.value)));
  speedEl.value = String(speed);
  setSpeed(speed);

  function bindToggle(id, get, set) {
    const el = $(id);
    el.addEventListener("click", () => {
      set(!get());
      el.setAttribute("aria-pressed", String(get()));
    });
  }
  bindToggle("btn-orbits", () => showOrbits, (v) => (showOrbits = v));
  bindToggle("btn-labels", () => showLabels, (v) => (showLabels = v));

  $("start").addEventListener("click", () => {
    intro = false;
    document.body.classList.add("ready");
    target.zoom = fit;
    userZoom = false;
    $("start").blur();
  });

  /* ---- pokazivač: povlačenje, štipanje, klik ---- */

  const pointers = new Map();
  let dragMoved = false;
  let downPos = null;
  let pinchDist = 0;

  function pick(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const h of hits) {
      const d = Math.hypot(h.x - x, h.y - y);
      if (d <= h.r + 4 && d / h.r < bestD) {
        best = h.b;
        bestD = d / h.r;
      }
    }
    return best;
  }

  function setZoomBy(f) {
    const z = clamp(target.zoom * f, fit * 0.6, 24);
    target.zoom = z;
    userZoom = true;
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (intro) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downPos = { x: e.clientX, y: e.clientY };
    dragMoved = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) {
      if (intro) return;
      const h = pick(e.clientX, e.clientY);
      hover = h;
      canvas.classList.toggle("over", !!h);
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) {
        const f = d / pinchDist;
        cam.zoom = clamp(cam.zoom * f, fit * 0.6, 24);
        setZoomBy(1);
        target.zoom = cam.zoom;
      }
      pinchDist = d;
      dragMoved = true;
      return;
    }

    if (!dragMoved && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) {
      dragMoved = true;
      canvas.classList.add("dragging");
      release();
    }
    if (dragMoved) {
      cam.x -= dx / cam.zoom;
      cam.z -= dy / (cam.zoom * TILT);
      target.x = cam.x;
      target.z = cam.z;
      userZoom = true;
    }
  });

  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    pinchDist = 0;
    canvas.classList.remove("dragging");
    if (!dragMoved && pointers.size === 0) {
      const b = pick(e.clientX, e.clientY);
      if (b) select(b);
      else if (selected) reset();
    }
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", (e) => {
    dragMoved = true;
    endPointer(e);
  });
  canvas.addEventListener("pointerleave", () => {
    hover = null;
    canvas.classList.remove("over");
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (intro) return;
      e.preventDefault();
      setZoomBy(Math.exp(-e.deltaY * 0.0015));
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "Escape") {
      if (!intro) reset();
    } else if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      if (!intro) setPaused(!paused);
    } else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && !intro) {
      const i = selected ? BODIES.indexOf(selected) : -1;
      const n = BODIES.length;
      const next = e.key === "ArrowRight" ? (i + 1) % n : (i - 1 + n) % n;
      select(BODIES[i === -1 && e.key === "ArrowLeft" ? n - 1 : next]);
    }
  });

  window.addEventListener("resize", resize);

  /* ------------------------------------------------------------------ */
  /*  Petlja                                                             */
  /* ------------------------------------------------------------------ */

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    realT += dt;
    if (!paused) simT += dt * speed;
    updateShooting(dt);
    updateCamera(dt);
    drawFrame();
    requestAnimationFrame(frame);
  }

  resize();
  cam.x = 0;
  cam.z = 0;
  view.cx = W / 2;
  view.cy = H * 0.36;
  simT = 8;
  requestAnimationFrame(frame);

  // pomoćni hook za testiranje
  window.__solar = { select: (id) => select(byId[id]), reset, setPaused };
})();
