/* layout.js — shared behaviour for every page:
   header/footer, theme, mobile menu, scroll progress,
   link filling from config.js, scroll reveal, hero typing. */
(function () {
  var C = window.CONFIG, d = document, root = d.documentElement;
  root.classList.add("js");

  /* ---- Theme (remembered; falls back silently if storage is blocked) ---- */
  var saved = null; try { saved = localStorage.getItem("theme"); } catch (e) {}
  var theme = saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  root.dataset.theme = theme;

  /* ---- Header + footer ---- */
  var page = location.pathname.split("/").pop() || "index.html";
  var links = C.nav.map(function (n) {
    return '<a href="' + n[0] + '"' + (n[0] === page ? ' aria-current="page"' : "") + ">" + n[1] + "</a>";
  }).join("");

  var header = d.createElement("header");
  header.className = "site-header";
  header.innerHTML =
    '<div class="bar"><a class="logo" href="index.html" aria-label="Home">vaibhav<span>.dev</span></a>' +
    '<nav class="nav" id="nav" aria-label="Main">' + links + "</nav>" +
    '<div style="display:flex;gap:.5rem">' +
    '<button class="icon-btn" id="theme" aria-label="Toggle theme">' + (theme === "dark" ? "☀" : "☾") + "</button>" +
    '<button class="icon-btn menu-btn" id="menu" aria-label="Menu" aria-expanded="false">☰</button></div></div>' +
    '<div class="hud" id="hud" aria-hidden="true">' +
      '<span class="hud-i"><i class="led"></i><b id="h-q">0</b> queued</span>' +
      '<span class="hud-i"><i class="led run"></i><b id="h-r">0</b> running</span>' +
      '<span class="hud-i"><i class="led ok"></i><b id="h-d">0</b> shipped</span>' +
      '<span class="hud-i hud-mode" id="h-m">live</span></div>' +
    '<div class="progress" id="progress"></div>';
  d.body.prepend(header);

  var footer = d.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = "<span>© " + new Date().getFullYear() + " " + C.name + "</span>" +
    '<nav><a data-link="github" href="#">GitHub</a><a data-link="linkedin" href="#">LinkedIn</a><a data-link="email" href="#">Email</a></nav>';
  d.body.appendChild(footer);

  /* ---- Fill every data-link from config; hide when empty ---- */
  d.querySelectorAll("[data-link]").forEach(function (el) {
    var url = C.links[el.dataset.link];
    if (!url) { el.classList.add("hidden"); return; }
    el.href = url;
    if (/^https?:/.test(url) || /\.pdf$/.test(url)) { el.target = "_blank"; el.rel = "noopener"; }
  });
  d.querySelectorAll("[data-text]").forEach(function (el) { el.textContent = C[el.dataset.text]; });

  /* ---- Controls ---- */
  d.getElementById("theme").onclick = function () {
    theme = theme === "dark" ? "light" : "dark";
    root.dataset.theme = theme; this.textContent = theme === "dark" ? "☀" : "☾";
    try { localStorage.setItem("theme", theme); } catch (e) {}
  };
  var nav = d.getElementById("nav"), menu = d.getElementById("menu");
  menu.onclick = function () { menu.setAttribute("aria-expanded", nav.classList.toggle("open")); };

  /* ---- Scroll progress (one passive listener, transform only) ---- */
  var bar = d.getElementById("progress"), tick = false;
  addEventListener("scroll", function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      var h = root.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")"; tick = false;
    });
  }, { passive: true });

  /* ---- Scroll reveal ---- */
  var items = d.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12 });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  } else items.forEach(function (el) { el.classList.add("in"); });

  /* ---- Hero: API response appears line by line ---- */
  var out = d.getElementById("typed");
  if (out) {
    var lines = JSON.parse(out.dataset.lines), n = 0;
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paint = function (l) { return l
      .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
      .replace(/: ("[^"]*")/g, ': <span class="s">$1</span>')
      .replace(/(\[|, )("[^"]*")/g, '$1<span class="s">$2</span>'); };
    var step = function () {
      out.innerHTML = lines.slice(0, ++n).map(paint).join("\n") + (n < lines.length ? "" : ' <span class="cursor"></span>');
      if (n < lines.length) setTimeout(step, reduce ? 0 : 140);
    };
    step();
  }

  var reduceM = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Pipeline HUD: a tiny simulated job queue ---- */
  var Q = 2, R = 1, D = 128, hq = d.getElementById("h-q"), hr = d.getElementById("h-r"), hd = d.getElementById("h-d"), hm = d.getElementById("h-m");
  var batch = false;
  function bump(el, v) {
    if (el.textContent === String(v)) return;
    el.textContent = v; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  function draw() { bump(hq, Q); bump(hr, R); bump(hd, D); }
  function pipe() {
    if (Math.random() < (batch ? .9 : .55) && Q < 9) Q++;
    if (Q > 0 && R < (batch ? 6 : 3)) { Q--; R++; }
    if (R > 0 && Math.random() < .6) { R--; D++; }
    draw();
  }
  draw();
  if (!reduceM) setInterval(pipe, 900);

  /* ---- Scroll very fast and the HUD flips to batch mode ---- */
  var lastY = scrollY, lastT = performance.now(), calm;
  addEventListener("scroll", function () {
    var t = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(t - lastT, 1);
    lastY = scrollY; lastT = t;
    if (v > 2.2 && !batch) { batch = true; hm.textContent = "batch ×2"; hm.classList.add("hot"); }
    clearTimeout(calm);
    calm = setTimeout(function () { batch = false; hm.textContent = "live"; hm.classList.remove("hot"); }, 900);
  }, { passive: true });

  /* ---- Click a card to run it: queued → running → (maybe fail → retry) → done ---- */
  d.querySelectorAll(".card").forEach(function (card) {
    card.classList.add("runnable");
    card.tabIndex = 0;
    card.setAttribute("aria-label", "Run this card as a job");
    var tag = d.createElement("span"); tag.className = "run-tag code"; tag.textContent = "▶ run";
    var bar = d.createElement("i"); bar.className = "run-bar";
    card.append(tag, bar);
    var busy = false;
    function set(txt, cls, w, dur) {
      tag.textContent = txt; card.dataset.state = cls;
      bar.style.transition = "width " + (dur || 0) + "ms linear"; bar.style.width = w + "%";
    }
    function go() {
      if (busy) return; busy = true;
      var fail = Math.random() < .3, ms = reduceM ? 0 : 1;
      set("queued", "queued", 0);
      Q++; draw();
      setTimeout(function () {
        Q = Math.max(Q - 1, 0); R++; draw();
        set("running", "running", fail ? 62 : 100, 1300 * ms);
        setTimeout(function () {
          if (fail) {
            set("error · retrying", "error", 62);
            setTimeout(function () {
              set("running", "running", 100, 900 * ms);
              setTimeout(finish, 950 * ms);
            }, 1000 * ms);
          } else finish();
        }, 1350 * ms);
      }, 500 * ms);
      function finish() {
        R = Math.max(R - 1, 0); D++; draw();
        set("✓ done", "done", 100);
        setTimeout(function () { set("▶ run", "", 0); bar.style.transition = "none"; busy = false; }, 2200 * ms);
      }
    }
    card.addEventListener("click", function (e) { if (!e.target.closest("a")) go(); });
    card.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === card) { e.preventDefault(); go(); } });
  });

  /* ---- Stats count up when revealed ---- */
  d.querySelectorAll(".stat b").forEach(function (b) {
    var m = b.textContent.match(/^(\d+)(.*)$/); if (!m || reduceM) return;
    var end = +m[1], suf = m[2], started = false;
    b.textContent = "0" + suf;
    new IntersectionObserver(function (es, ob) {
      if (!es[0].isIntersecting || started) return; started = true; ob.disconnect();
      var t0 = performance.now();
      (function f(t) {
        var k = Math.min((t - t0) / 1100, 1), e = 1 - Math.pow(1 - k, 3);
        b.textContent = Math.round(end * e) + suf; if (k < 1) requestAnimationFrame(f);
      })(t0);
    }).observe(b);
  });

  /* ---- Timeline: the route line draws as you scroll, stops light up ---- */
  var tl = d.querySelector(".timeline");
  if (tl) {
    var jobs = tl.querySelectorAll(".job"), tt = false;
    var upd = function () {
      var r = tl.getBoundingClientRect(), mark = innerHeight * .6;
      tl.style.setProperty("--tl", Math.min(Math.max((mark - r.top) / r.height, 0), 1));
      jobs.forEach(function (j) { j.classList.toggle("on", j.getBoundingClientRect().top < mark); });
      tt = false;
    };
    addEventListener("scroll", function () { if (!tt) { tt = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener("resize", upd); upd();
  }

  /* ---- Pixel crew walking along the footer; click one to make it hop; they nap when idle ---- */
  var strip = d.createElement("div"); strip.className = "crew"; strip.setAttribute("aria-hidden", "true");
  var cols = [["#ff6b6b", "#8b7cff"], ["#ffb454", "#5fe3a1"], ["#5fe3a1", "#ffb454"]];
  var map = ["..hhh..", ".hhhhh.", "..sss..", ".bbbbb.", "bbbbbbb", ".bbbbb."];
  var walkers = cols.map(function (c, i) {
    var el = d.createElement("div"); el.className = "walker";
    var rects = "";
    map.forEach(function (row, y) { row.split("").forEach(function (ch, x) {
      if (ch === ".") return;
      var f = ch === "h" ? c[0] : ch === "b" ? c[1] : "#f3c9a0";
      rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + f + '"/>';
    }); });
    el.innerHTML = '<svg viewBox="0 0 7 8" width="28" height="32" shape-rendering="crispEdges">' + rects +
      '<rect class="lg a" x="1" y="6" width="2" height="2" fill="#555"/><rect class="lg b" x="4" y="6" width="2" height="2" fill="#555"/></svg><i class="z">z</i>';
    el.style.pointerEvents = "auto";
    el.onclick = function () { el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop"); };
    strip.appendChild(el);
    return { el: el, x: 40 + i * 90, dir: i % 2 ? -1 : 1, sp: .35 + i * .12 };
  });
  footer.before(strip);
  var idleT, asleep = false;
  function wake() { if (asleep) { asleep = false; strip.classList.remove("rest"); } clearTimeout(idleT); idleT = setTimeout(function () { asleep = true; strip.classList.add("rest"); }, 9000); }
  ["scroll", "pointermove", "keydown", "touchstart"].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  wake();
  if (!reduceM) (function loop() {
    var w = strip.clientWidth - 28;
    walkers.forEach(function (k) {
      if (!asleep) { k.x += k.dir * k.sp; if (k.x > w) { k.x = w; k.dir = -1; } if (k.x < 0) { k.x = 0; k.dir = 1; } }
      k.el.style.transform = "translateX(" + k.x + "px) scaleX(" + (k.dir < 0 ? -1 : 1) + ")";
    });
    requestAnimationFrame(loop);
  })();
  else walkers.forEach(function (k) { k.el.style.transform = "translateX(" + k.x + "px)"; });

  /* ======== MORE MOTION ======== */
  var fine = matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---- Headline decodes from random characters ---- */
  var h1 = d.querySelector("h1");
  if (h1 && !reduceM && !h1.children.length) {
    var target = h1.textContent, glyphs = "01{}[]<>/_=+*#", f = 0, total = 28;
    h1.setAttribute("aria-label", target);
    var dec = setInterval(function () {
      f++;
      h1.textContent = target.split("").map(function (ch, i) {
        return ch === " " || f > i * (total / target.length) + 6 ? ch : glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join("");
      if (f > total + 8) { clearInterval(dec); h1.textContent = target; }
    }, 45);
  }

  /* ---- Home page: skills ticker + data packets flowing through a pipeline ---- */
  var hero = d.querySelector(".hero");
  if (hero) {
    var tick = d.createElement("div"); tick.className = "ticker"; tick.setAttribute("aria-hidden", "true");
    var words = ["Python", "FastAPI", "SQL", "PostgreSQL", "MySQL", "Snowflake", "Pandas", "Docker", "Pydantic", "Git", "KPI dashboards", "REST APIs"];
    var row = words.map(function (w) { return "<span>" + w + "</span>"; }).join("");
    tick.innerHTML = '<div class="ticker-track">' + row + row + "</div>";
    hero.after(tick);

    var flow = d.createElement("div"); flow.className = "flow reveal"; flow.setAttribute("aria-hidden", "true");
    var stages = ["ingest", "validate", "transform", "report"];
    flow.innerHTML = '<div class="flow-line"></div>' + stages.map(function (n, i) {
      return '<span class="node" style="left:' + (i * 100 / 3) + '%"><i></i><em class="code">' + n + "</em></span>";
    }).join("");
    tick.after(flow);
    var nodes = flow.querySelectorAll(".node"), packs = [];
    for (var i = 0; i < 6; i++) { var pk = d.createElement("b"); pk.className = "packet"; flow.appendChild(pk); packs.push({ el: pk, x: -i * 18 - Math.random() * 6 }); }
    if (!reduceM) (function fl() {
      packs.forEach(function (p) {
        p.x += .22; if (p.x > 103) p.x = -Math.random() * 20;
        p.el.style.left = p.x + "%"; p.el.style.opacity = p.x < 0 || p.x > 100 ? 0 : 1;
        nodes.forEach(function (n, i) { if (Math.abs(p.x - i * 100 / 3) < .5) { n.classList.add("hit"); setTimeout(function () { n.classList.remove("hit"); }, 280); } });
      });
      requestAnimationFrame(fl);
    })();
  }

  /* ---- Cursor spotlight on cards, magnetic buttons, tilt on the hero panel ---- */
  if (fine && !reduceM) {
    d.querySelectorAll(".card, .contact-list a").forEach(function (c) {
      c.classList.add("spot");
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
    d.querySelectorAll(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .18) + "px," + ((e.clientY - r.top - r.height / 2) * .3 - 2) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    var pn = d.querySelector(".panel");
    if (pn) {
      pn.style.transition = "transform .15s ease-out";
      pn.addEventListener("pointermove", function (e) {
        var r = pn.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        pn.style.transform = "perspective(800px) rotateY(" + x * 8 + "deg) rotateX(" + -y * 8 + "deg)";
      });
      pn.addEventListener("pointerleave", function () { pn.style.transform = ""; });
    }
  }

  /* ---- Drifting background blobs with scroll parallax ---- */
  var bg = d.createElement("div"); bg.className = "blobs"; bg.setAttribute("aria-hidden", "true");
  bg.innerHTML = "<i></i><i></i><i></i>"; d.body.prepend(bg);
  var bi = bg.children, pt = false;
  if (!reduceM) addEventListener("scroll", function () {
    if (pt) return; pt = true;
    requestAnimationFrame(function () {
      for (var k = 0; k < bi.length; k++) bi[k].style.translate = "0 " + (-scrollY * (.05 + k * .04)) + "px";
      pt = false;
    });
  }, { passive: true });

  /* ---- Nav pill glides to the hovered link ---- */
  var pill = d.createElement("i"); pill.className = "nav-pill"; nav.prepend(pill);
  var cur = nav.querySelector('[aria-current="page"]');
  function movePill(a) {
    if (!a || getComputedStyle(nav).position === "absolute") { pill.style.opacity = 0; return; }
    pill.style.opacity = 1; pill.style.width = a.offsetWidth + "px"; pill.style.transform = "translateX(" + a.offsetLeft + "px)";
  }
  nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("pointerenter", function () { movePill(a); }); });
  nav.addEventListener("pointerleave", function () { movePill(cur); });
  addEventListener("load", function () { movePill(cur); });

  /* ---- Chips pop in one by one when their card/job is revealed ---- */
  d.querySelectorAll(".chips").forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--i", i); });
  });

  /* ---- Back-to-top button that fills as you scroll ---- */
  var up = d.createElement("button"); up.className = "to-top"; up.setAttribute("aria-label", "Back to top");
  up.innerHTML = '<svg viewBox="0 0 36 36"><circle class="ring" cx="18" cy="18" r="16"/></svg><span>↑</span>';
  d.body.appendChild(up);
  var ring = up.querySelector(".ring"), C2 = 2 * Math.PI * 16, ut = false;
  ring.style.strokeDasharray = C2;
  function updUp() {
    var h = root.scrollHeight - innerHeight, p = h > 0 ? scrollY / h : 0;
    ring.style.strokeDashoffset = C2 * (1 - p); up.classList.toggle("show", scrollY > 400); ut = false;
  }
  addEventListener("scroll", function () { if (!ut) { ut = true; requestAnimationFrame(updUp); } }, { passive: true });
  up.onclick = function () { scrollTo({ top: 0, behavior: reduceM ? "auto" : "smooth" }); };
  updUp();

  /* ---- Constant ambient motion: drifting, linked particles (phone + laptop) ---- */
  var cv = d.createElement("canvas"); cv.className = "ambient"; cv.setAttribute("aria-hidden", "true");
  d.body.prepend(cv);
  var cx = cv.getContext("2d"), W = 0, H = 0, dpr = 1, pts = [], boost = 0, ptr = { x: -999, y: -999 }, cols2 = ["#8b7cff", "#ffb454"], frame = 0;
  function readCols() {
    var cs = getComputedStyle(root);
    cols2 = [cs.getPropertyValue("--accent").trim() || "#8b7cff", cs.getPropertyValue("--accent-2").trim() || "#ffb454"];
  }
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(Math.max(W * H / 16000, 22), 80));
    while (pts.length < n) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, r: 1 + Math.random() * 1.6, c: Math.random() < .25 ? 1 : 0 });
    pts.length = n;
    pts.forEach(function (q) { q.x = Math.min(q.x, W); q.y = Math.min(q.y, H); });
  }
  function drawAmbient() {
    cx.clearRect(0, 0, W, H);
    var link = W < 700 ? 95 : 130, l2 = link * link;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], k = 1 + boost;
      if (!reduceM) {
        a.x += a.vx * k; a.y += a.vy * k;
        if (a.x < 0 || a.x > W) a.vx *= -1; if (a.y < 0 || a.y > H) a.vy *= -1;
        var dx = a.x - ptr.x, dy = a.y - ptr.y, dd = dx * dx + dy * dy;
        if (dd < 12000) { var f = (1 - dd / 12000) * .6; a.x += dx * f * .05; a.y += dy * f * .05; }
      }
      cx.globalAlpha = .55; cx.fillStyle = cols2[a.c]; cx.beginPath(); cx.arc(a.x, a.y, a.r, 0, 6.283); cx.fill();
      for (var j = i + 1; j < pts.length; j++) {
        var b = pts[j], ex = a.x - b.x, ey = a.y - b.y, e2 = ex * ex + ey * ey;
        if (e2 < l2) { cx.globalAlpha = (1 - e2 / l2) * .28; cx.strokeStyle = cols2[0]; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke(); }
      }
    }
    boost *= .94;
  }
  size(); readCols();
  addEventListener("resize", size);
  addEventListener("orientationchange", size);
  ["pointermove", "pointerdown"].forEach(function (ev) { addEventListener(ev, function (e) { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true }); });
  addEventListener("pointerup", function () { setTimeout(function () { ptr.x = ptr.y = -999; }, 600); }, { passive: true });
  addEventListener("scroll", function () { boost = Math.min(boost + .15, 3); }, { passive: true });
  if (reduceM) drawAmbient();
  else (function run() {
    if (!document.hidden) { if (++frame % 90 === 0) readCols(); drawAmbient(); }
    requestAnimationFrame(run);
  })();
})();
