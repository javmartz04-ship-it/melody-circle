/* =====================================================================
   MELODY CIRCLE - shared page script
   - font-gated entrance (fonts.ready + 1.2s failsafe)
   - reveal-on-scroll (IntersectionObserver + 3.5s failsafe)
   - island nav state, burger + overlay
   - FAQ accordion
   - schedule render from window.MELODY_CIRCLES (index)
   - reservation form (reserve): validation, phone mask, age hint,
     progress, inline success, safe preview mode
   ===================================================================== */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. entrance, gated on fonts ---------- */
  function fontsIn() { root.classList.add("fonts-in"); }
  if (doc.fonts && doc.fonts.ready) { doc.fonts.ready.then(fontsIn); }
  setTimeout(fontsIn, 1200);

  /* ---------- 2. reveal on scroll ---------- */
  var revealEls = [].slice.call(doc.querySelectorAll("[data-reveal]"));
  function showAll() { revealEls.forEach(function (el) { el.classList.add("is-in"); }); }
  if (reduce || !("IntersectionObserver" in window)) { showAll(); }
  else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
    setTimeout(showAll, 3500); /* failsafe: never leave the page blank */
  }

  /* ---------- 3. nav ---------- */
  var nav = doc.querySelector(".nav");
  var sentinel = doc.querySelector("#nav-sentinel");
  if (nav && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      nav.classList.toggle("is-scrolled", !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }
  var burger = doc.querySelector(".burger"), menu = doc.querySelector(".menu");
  function closeMenu() {
    if (!menu) return;
    doc.body.classList.remove("menu-open"); menu.classList.remove("is-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
    setTimeout(function () { if (!menu.classList.contains("is-open")) menu.style.display = ""; }, 500);
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = !menu.classList.contains("is-open");
      if (open) {
        menu.style.display = "flex";
        requestAnimationFrame(function () { menu.classList.add("is-open"); doc.body.classList.add("menu-open"); });
        burger.setAttribute("aria-expanded", "true");
      } else { closeMenu(); }
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---------- 4. FAQ ---------- */
  doc.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q"), a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      a.hidden = false;
    });
  });

  /* ---------- 5. circles data helpers ---------- */
  var MONTHS = { january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7, september:8, october:9, november:10, december:11 };
  function parseDay(s) {
    if (!s) return null;
    var m = String(s).trim().toLowerCase().match(/^([a-z]+)\.?\s+(\d{1,2})/);
    if (!m || !(m[1] in MONTHS) && !Object.keys(MONTHS).some(function (k) { return k.indexOf(m[1]) === 0; })) return null;
    var key = m[1] in MONTHS ? m[1] : Object.keys(MONTHS).filter(function (k) { return k.indexOf(m[1]) === 0; })[0];
    var y = new Date().getFullYear();
    return new Date(y, MONTHS[key], parseInt(m[2], 10));
  }
  function sessionCount(c) {
    var a = parseDay(c.start), b = parseDay(c.end);
    if (!a || !b) return null;
    if (b < a) b.setFullYear(b.getFullYear() + 1);
    var weeks = Math.round((b - a) / (7 * 864e5)) + 1;
    return weeks > 0 && weeks < 60 ? weeks : null;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var circles = Array.isArray(window.MELODY_CIRCLES) ? window.MELODY_CIRCLES : [];
  /* "Six weekly sessions" is derived from the first circle's dates, never typed */
  var WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  var firstCount = circles.length ? sessionCount(circles[0]) : null;
  doc.querySelectorAll("[data-sessions]").forEach(function (el) {
    el.textContent = firstCount ? (WORDS[firstCount] || firstCount) + " weekly" : "Weekly";
  });

  /* ---------- 6. schedule (index) ---------- */
  var rowsEl = doc.querySelector("#schedule-rows");
  if (rowsEl) {
    var reserveHref = rowsEl.getAttribute("data-reserve") || "reserve.html";
    var html = circles.map(function (c, i) {
      var n = sessionCount(c);
      var act = c.full
        ? '<span class="full">Full</span>'
        : '<a class="btn sm" href="' + esc(reserveHref) + '?circle=' + encodeURIComponent(c.id) + '"><span>Reserve Your Spot</span><span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h14M12 6l6 6-6 6"/></svg></span></a>';
      return '<div class="row" data-reveal style="--i:' + i + '">' +
        '<div class="day">' + esc(c.day) + '</div>' +
        '<div class="time">' + esc(c.time) + '</div>' +
        '<div class="dates">' + esc(c.start) + ' to ' + esc(c.end) + (n ? '<small>' + n + ' weekly sessions</small>' : '') + '</div>' +
        '<div class="venue">' + esc(c.venue) + '</div>' +
        '<div class="act">' + act + '</div></div>';
    }).join("");
    rowsEl.innerHTML = html;
    /* rows were added after the observer ran: observe them now */
    rowsEl.querySelectorAll("[data-reveal]").forEach(function (el) {
      revealEls.push(el);
      if (reduce || !("IntersectionObserver" in window)) el.classList.add("is-in");
      else new IntersectionObserver(function (en, o) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); o.unobserve(e.target); } }); }, { threshold: 0.1 }).observe(el);
    });
    setTimeout(function () { rowsEl.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); }); }, 3500);
  }

  /* ---------- 7. reservation form (reserve) ---------- */
  var form = doc.querySelector("form.rsv");
  if (!form) return;

  /* Where submissions go. EMPTY = safe preview mode: validates, shows
     success, stores in localStorage, sends nothing. Options:
     - a Formspree endpoint       https://formspree.io/f/xxxx
     - a Google Apps Script URL   https://script.google.com/macros/s/.../exec
     - a GoHighLevel inbound webhook (POST application/json; read the
       response body, GHL returns 200 even when it rejects a payload) */
  var CONFIG = { endpoint: "", storageKey: "melody_reservations" };

  var opts = doc.querySelector("#circle-options");
  if (opts) {
    var pre = new URLSearchParams(location.search).get("circle");
    opts.innerHTML = circles.map(function (c, i) {
      var n = sessionCount(c);
      var checked = (!c.full && (pre ? c.id === pre : false)) ? " checked" : "";
      return '<label class="opt' + (c.full ? ' is-full' : '') + '">' +
        '<input type="radio" name="circle" value="' + esc(c.id) + '"' + checked + (c.full ? ' disabled' : '') + ' required>' +
        '<span class="dot" aria-hidden="true"></span>' +
        '<span><span class="od">' + esc(c.day) + ' · ' + esc(c.time) + '</span>' +
        '<span class="ot">' + esc(c.start) + ' to ' + esc(c.end) + (n ? ', ' + n + ' weekly sessions' : '') + '</span>' +
        '<span class="ov">' + esc(c.venue) + (c.full ? ' · Full' : '') + '</span></span></label>';
    }).join("");
  }

  var fields = [].slice.call(form.querySelectorAll("[data-field]"));
  var progress = doc.querySelector(".progress i"), countEl = doc.querySelector(".form-head .count");
  var total = fields.length;

  function fieldValue(f) {
    var inp = f.querySelector("input, select");
    if (!inp) return "";
    if (inp.type === "radio") { var ch = form.querySelector('input[name="' + inp.name + '"]:checked'); return ch ? ch.value : ""; }
    return inp.value.trim();
  }
  function validators(f) {
    var kind = f.getAttribute("data-field"), v = fieldValue(f);
    if (!v) return "required";
    if (kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "email";
    if (kind === "phone") { var d = v.replace(/\D/g, ""); if (d.length !== 10 && !(d.length === 11 && d[0] === "1")) return "phone:" + d.length; }
    if (kind === "age") { var a = parseInt(v, 10); if (isNaN(a) || a < 0 || a > 60) return "age"; }
    return "";
  }
  var MSG = {
    name: "Please tell us your name.", email: "That email does not look right yet.", phone: "A US number needs 10 digits.",
    baby: "What should we call your little one?", age: "Enter their age in months (a number).", circle: "Pick the circle that suits you."
  };
  function showErr(f, code) {
    var err = f.querySelector(".err"), kind = f.getAttribute("data-field");
    var text = MSG[kind] || "Please complete this field.";
    if (code && code.indexOf("phone:") === 0) { var n = code.split(":")[1]; text = "That's " + n + " digit" + (n === "1" ? "" : "s") + ", a US number needs 10."; }
    if (err) err.textContent = text;
    f.classList.add("bad");
    var inp = f.querySelector("input, select"); if (inp) inp.setAttribute("aria-invalid", "true");
  }
  function clearErr(f) {
    f.classList.remove("bad");
    f.querySelectorAll("input, select").forEach(function (i) { i.removeAttribute("aria-invalid"); });
  }
  function updateProgress() {
    var done = fields.filter(function (f) { return validators(f) === ""; }).length;
    if (progress) progress.style.transform = "scaleX(" + (done / total) + ")";
    if (countEl) countEl.textContent = done + " of " + total + " complete";
  }

  /* phone mask: (305) 555-0142 while typing */
  var phone = form.querySelector('[data-field="phone"] input');
  if (phone) phone.addEventListener("input", function () {
    var d = phone.value.replace(/\D/g, "").slice(0, 10), out = d;
    if (d.length > 6) out = "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
    else if (d.length > 3) out = "(" + d.slice(0, 3) + ") " + d.slice(3);
    else if (d.length > 0) out = "(" + d;
    phone.value = out;
  });

  /* age hint: answers the question the parent cannot ask */
  var age = form.querySelector('[data-field="age"] input'), hint = form.querySelector('[data-field="age"] .hint');
  if (age && hint) age.addEventListener("input", function () {
    age.value = age.value.replace(/\D/g, "").slice(0, 2);
    var a = parseInt(age.value, 10);
    if (isNaN(a)) { hint.classList.remove("on"); return; }
    var t;
    if (a < 6) t = "A little early. Circles are built for 6 to 18 months, when babies sit, reach and bounce to the songs. Reserve anyway and we'll suggest the best start.";
    else if (a <= 18) t = "Right in the circle's age range. " + (a < 10 ? "Expect lots of lap songs, scarves and shakers." : a < 14 ? "Expect shakers, movement and the first attempts at clapping along." : "Expect movement songs, shakers and plenty of joining in.");
    else t = "A little past the range this circle is built for. Reserve anyway and we'll let you know if a better fit is coming.";
    hint.textContent = t; hint.classList.add("on");
  });

  fields.forEach(function (f) {
    f.querySelectorAll("input, select").forEach(function (inp) {
      inp.addEventListener("input", function () { if (validators(f) === "") clearErr(f); updateProgress(); });
      inp.addEventListener("change", function () { if (validators(f) === "") clearErr(f); updateProgress(); });
      inp.addEventListener("blur", function () { var c = validators(f); if (c && fieldValue(f)) showErr(f, c); });
    });
  });
  updateProgress();

  var btn = form.querySelector('button[type="submit"]'), btnLabel = btn ? btn.querySelector("span") : null;
  var submitted = false;

  function payload() {
    var get = function (k) { var f = form.querySelector('[data-field="' + k + '"]'); return f ? fieldValue(f) : ""; };
    var name = get("name"), parts = name.split(/\s+/), c = circles.filter(function (x) { return x.id === get("circle"); })[0] || {};
    var digits = get("phone").replace(/\D/g, ""); if (digits.length === 10) digits = "1" + digits;
    var circleText = c.day ? c.day + " " + c.time + ", " + c.start + " to " + c.end + ", " + c.venue : get("circle");
    return {
      first_name: parts[0] || "", last_name: parts.slice(1).join(" "), full_name: name, email: get("email"), phone: digits ? "+" + digits : "",
      parentName: name, parentEmail: get("email"), parentPhone: get("phone"), babyName: get("baby"), babyAgeMonths: get("age"),
      circleId: get("circle"), circle: circleText,
      summary: name + " (" + get("email") + ", " + get("phone") + ") reserved a spot for " + get("baby") + ", " + get("age") + " months, in the " + circleText + " circle.",
      submittedAt: new Date().toISOString(), source: "melody-circle-reserve", pageUrl: location.href
    };
  }
  function store(p) {
    try { var all = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]"); all.push(p); localStorage.setItem(CONFIG.storageKey, JSON.stringify(all)); } catch (e) {}
  }
  function showDone(p) {
    var done = doc.querySelector(".done");
    form.hidden = true; doc.querySelector(".form-head").hidden = true;
    var pr = doc.querySelector(".progress"); if (pr) pr.hidden = true;
    done.querySelector(".done-h").innerHTML = "Welcome to the circle, <em>" + esc(p.babyName) + ".</em>";
    var sum = done.querySelector(".sum");
    sum.innerHTML = "<b>Circle</b><span>" + esc(p.circle) + "</span><b>Little one</b><span>" + esc(p.babyName) + ", " + esc(p.babyAgeMonths) + " months</span><b>Grown-up</b><span>" + esc(p.parentName) + "</span><b>Email</b><span>" + esc(p.parentEmail) + "</span>";
    done.classList.add("on");
    done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    var h = done.querySelector(".done-h"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
  }
  function fail(msg) {
    if (btn) { btn.disabled = false; if (btnLabel) btnLabel.textContent = "Try again"; }
    var e = doc.querySelector(".form-err"); if (e) { e.hidden = false; e.textContent = msg; }
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (submitted) return;
    var firstBad = null;
    fields.forEach(function (f) { var c = validators(f); if (c) { showErr(f, c); if (!firstBad) firstBad = f; } else clearErr(f); });
    if (firstBad) { var inp = firstBad.querySelector("input, select"); if (inp) inp.focus(); firstBad.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); return; }
    var p = payload();
    if (btn) { btn.disabled = true; if (btnLabel) btnLabel.textContent = "Reserving"; }
    if (!CONFIG.endpoint) { /* safe preview mode */
      store(p); submitted = true;
      setTimeout(function () { showDone(p); }, 500);
      return;
    }
    fetch(CONFIG.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) })
      .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, text: t }; }); })
      .then(function (r) {
        if (!r.ok || /error/i.test(r.text)) throw new Error(r.text || ("HTTP " + r.status));
        store(p); submitted = true; showDone(p);
      })
      .catch(function () { store(p); fail("Something went wrong sending your reservation. Your answers are saved on this device. Please try again in a moment."); });
  });
})();
