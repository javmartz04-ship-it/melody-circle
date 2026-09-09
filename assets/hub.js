/* =====================================================================
   MELODY CIRCLE - hub script: events, calendar, registration sheet.
   Data comes from assets/events.js (window.MELODY_EVENTS, window.MELODY_HUB).
   Nothing is sent anywhere: registrations are kept in localStorage and
   finished by text message, as the reference hub does. See NOTES.md.
   ===================================================================== */
(function () {
  "use strict";
  var doc = document, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EVENTS = (Array.isArray(window.MELODY_EVENTS) ? window.MELODY_EVENTS : []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var HUB = window.MELODY_HUB || {};
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var WORDS = ["No","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten"];
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function parse(iso) { var p = iso.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function mon3(d) { return MONTHS[d.getMonth()].slice(0, 3); }
  function price(ev) { return ev.price > 0 ? "$" + ev.price : "Complimentary"; }
  function isOpen(ev) { return ev.status === "open"; }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var upcoming = EVENTS.filter(function (e) { return parse(e.date) >= today; });
  var featured = upcoming.length ? upcoming : EVENTS;
  var nextOpen = EVENTS.filter(isOpen)[0] || null;
  var featMonth = featured.length ? parse(featured[0].date) : today;

  /* ---------- hero: next up + stage caption ---------- */
  var nextup = doc.querySelector("#nextup");
  if (nextup) {
    nextup.innerHTML = featured.slice(0, 2).map(function (ev) {
      var d = parse(ev.date);
      var chip = '<span class="chip"><b>' + d.getDate() + '</b><small>' + mon3(d) + '</small></span>';
      if (isOpen(ev)) {
        return '<a href="#circles" data-register="' + esc(ev.id) + '">' + chip + '<span><span class="t">Register for the next circle</span><span class="d">' + DAYS[d.getDay()] + ' at ' + esc(ev.start) + (ev.price > 0 ? ' · $' + ev.price + ' per child' : ' · Complimentary') + '</span></span><span class="go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h14M12 6l6 6-6 6"/></svg></span></a>';
      }
      return '<div class="nu">' + chip + '<span><span class="t">' + esc(ev.title) + '</span><span class="d">' + DAYS[d.getDay()] + ' at ' + esc(ev.start) + '</span></span><span class="closed">' + (ev.status === "soon" ? "Soon" : "Closed") + '</span></div>';
    }).join("");
  }
  var cap = doc.querySelector("#stage-cap");
  if (cap) {
    var n = EVENTS.filter(function (e) { var d = parse(e.date); return d.getMonth() === featMonth.getMonth() && d.getFullYear() === featMonth.getFullYear(); }).length;
    cap.textContent = (WORDS[n] || n) + " circle" + (n === 1 ? "" : "s") + " this " + MONTHS[featMonth.getMonth()];
  }
  doc.querySelectorAll("[data-month-title]").forEach(function (el) { el.textContent = MONTHS[featMonth.getMonth()] + " circles"; });
  doc.querySelectorAll("[data-insta]").forEach(function (el) { el.textContent = "@" + (HUB.instagram || "melodycircle"); });
  doc.querySelectorAll("[data-insta-href]").forEach(function (el) { el.setAttribute("href", "https://www.instagram.com/" + (HUB.instagram || "") + "/"); });

  /* ---------- event cards ---------- */
  var cards = doc.querySelector("#cards");
  var ICON = {
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10Z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    note: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="8.5" cy="17" rx="3.4" ry="2.4" transform="rotate(-15 8.5 17)"/><path d="M11.6 16.2V5c2.8 1 4.6 3 4.2 6.5"/></svg>'
  };
  if (cards) {
    cards.innerHTML = featured.slice(0, 2).map(function (ev, i) {
      var d = parse(ev.date), open = isOpen(ev);
      var act = open
        ? '<button class="btn lg" type="button" data-register="' + esc(ev.id) + '"><span>Join a Circle</span><span class="ico" aria-hidden="true"><svg><use href="#ic-arrow"/></svg></span></button><span class="per">' + (ev.price > 0 ? "$" + ev.price + " per child" : "Complimentary") + '</span>'
        : '<span class="pill">' + (ev.status === "soon" ? "Registration opens soon" : "Registration closed") + '</span>';
      return '<article class="card ' + (open ? "open" : "closed") + '" data-reveal style="--i:' + i + '"><div class="card-in">' +
        '<p class="lab">' + esc(ev.label) + '</p>' +
        '<div class="when"><span class="mon">' + mon3(d) + '</span><span class="day">' + d.getDate() + '</span></div>' +
        '<h3 class="h3">' + esc(ev.title) + '</h3>' +
        '<ul class="meta"><li>' + ICON.clock + esc(ev.start) + ' to ' + esc(ev.end) + '</li><li>' + ICON.pin + esc(ev.place) + '</li><li>' + ICON.note + esc(ev.ages) + '</li></ul>' +
        '<p class="note">' + esc(ev.note) + '</p>' +
        '<div class="act">' + act + '</div></div></article>';
    }).join("");
    /* injected after the page's reveal observer ran: observe them here, with a failsafe */
    var injected = [].slice.call(cards.querySelectorAll("[data-reveal]"));
    if (reduce || !("IntersectionObserver" in window)) injected.forEach(function (el) { el.classList.add("is-in"); });
    else { var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.1 }); injected.forEach(function (el) { io.observe(el); }); }
    setTimeout(function () { injected.forEach(function (el) { el.classList.add("is-in"); }); }, 3500);
  }

  /* ---------- calendar ---------- */
  var calGrid = doc.querySelector("#cal-grid"), calTitle = doc.querySelector("#cal-title"), calNote = doc.querySelector("#cal-note");
  var view = new Date(featMonth.getFullYear(), featMonth.getMonth(), 1);
  function byDate(iso) { return EVENTS.filter(function (e) { return e.date === iso; })[0]; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function renderCal() {
    if (!calGrid) return;
    calTitle.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
    var first = new Date(view.getFullYear(), view.getMonth(), 1), startDow = first.getDay();
    var start = new Date(first); start.setDate(1 - startDow);
    var html = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(function (w) { return '<div class="cal-wd">' + w + '</div>'; }).join("");
    for (var i = 0; i < 42; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var out = d.getMonth() !== view.getMonth(), ev = byDate(iso(d)), isToday = d.getTime() === today.getTime();
      var cls = "cal-day" + (out ? " out" : "") + (isToday ? " today" : "");
      if (ev) {
        cls += " ev " + (isOpen(ev) ? "open" : "closed");
        html += '<button type="button" class="' + cls + '" data-day="' + esc(ev.id) + '" aria-label="' + esc(ev.title) + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + '"><span class="dot" aria-hidden="true"></span><span class="in"><b>' + d.getDate() + '</b><small>' + esc(ev.short || "") + '</small></span></button>';
      } else {
        html += '<div class="' + cls + '"><span>' + d.getDate() + '</span></div>';
      }
    }
    calGrid.innerHTML = html;
    var monthEvents = EVENTS.filter(function (e) { var d = parse(e.date); return d.getMonth() === view.getMonth() && d.getFullYear() === view.getFullYear(); });
    var openEv = monthEvents.filter(isOpen)[0];
    if (calNote) {
      if (openEv) { var od = parse(openEv.date); calNote.innerHTML = '<i aria-hidden="true"></i><span>Tap ' + MONTHS[od.getMonth()] + ' ' + od.getDate() + ' to register your child and secure a spot.</span>'; }
      else if (monthEvents.length) calNote.innerHTML = '<i aria-hidden="true" style="background:var(--sage-soft)"></i><span>Registration for this month has closed. Check back for the next circle.</span>';
      else calNote.innerHTML = '<i aria-hidden="true" style="background:var(--sage-soft)"></i><span>No circles this month yet. Follow along for the next date.</span>';
    }
  }
  renderCal();
  var prev = doc.querySelector("#cal-prev"), next = doc.querySelector("#cal-next");
  if (prev) prev.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
  if (next) next.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });

  /* ---------- toast ---------- */
  var toast = doc.querySelector(".toast"), toastT;
  function say(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove("on"); }, 2400); }

  /* ---------- registration sheet ---------- */
  var sheet = doc.querySelector("#sheet"), veil = doc.querySelector("#veil");
  var form = sheet ? sheet.querySelector("form") : null, step1 = sheet ? sheet.querySelector("#step-1") : null, step2 = sheet ? sheet.querySelector("#step-2") : null;
  var current = null, lastFocus = null;
  var STORE = "melody_hub_registrations";
  function fillChip(ev) {
    var d = parse(ev.date);
    sheet.querySelectorAll("[data-ev-chip]").forEach(function (el) {
      el.innerHTML = '<span class="chip"><b>' + d.getDate() + '</b><small>' + mon3(d) + '</small></span><span><span class="t">' + esc(ev.title) + '</span><span class="d">' + DAYS[d.getDay()] + ', ' + esc(ev.start) + ' to ' + esc(ev.end) + ' · ' + price(ev) + (ev.price > 0 ? ' per child' : '') + '</span></span>';
    });
  }
  function openSheet(id) {
    var ev = EVENTS.filter(function (e) { return e.id === id; })[0] || nextOpen;
    if (!ev) { say("No circle is open for registration right now."); return; }
    if (!isOpen(ev)) { say(ev.status === "soon" ? "Registration for this circle opens soon." : "Registration for this circle has closed."); return; }
    current = ev; fillChip(ev);
    step1.classList.add("on"); step2.classList.remove("on");
    lastFocus = doc.activeElement;
    veil.classList.add("is-open"); sheet.classList.add("is-open"); sheet.setAttribute("aria-hidden", "false"); doc.body.classList.add("sheet-open");
    setTimeout(function () { var f = sheet.querySelector("input"); if (f) f.focus({ preventScroll: true }); }, reduce ? 0 : 420);
  }
  function closeSheet() {
    veil.classList.remove("is-open"); sheet.classList.remove("is-open"); sheet.setAttribute("aria-hidden", "true"); doc.body.classList.remove("sheet-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  doc.addEventListener("click", function (e) {
    var t = e.target.closest("[data-register]"); if (t) { e.preventDefault(); openSheet(t.getAttribute("data-register")); return; }
    var d = e.target.closest("[data-day]"); if (d) { openSheet(d.getAttribute("data-day")); return; }
    if (e.target.closest("[data-close]")) { e.preventDefault(); closeSheet(); }
  });
  if (veil) veil.addEventListener("click", closeSheet);
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && sheet && sheet.classList.contains("is-open")) closeSheet(); });
  /* deep link: ?circle=<id> or #register */
  var want = new URLSearchParams(location.search).get("circle");
  if (want && EVENTS.some(function (e) { return e.id === want && isOpen(e); })) setTimeout(function () { openSheet(want); }, 600);

  if (!form) return;
  var fields = [].slice.call(form.querySelectorAll("[data-field]"));
  var MSG = { parent: "Please tell us your name.", email: "That email does not look right yet.", child: "What should we call your little one?", age: "Pick your little one's age." };
  function val(f) { var i = f.querySelector("input, select, textarea"); return i ? i.value.trim() : ""; }
  function check(f) {
    var k = f.getAttribute("data-field"), v = val(f);
    if (k === "notes") return "";
    if (!v) return "required";
    if (k === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "email";
    return "";
  }
  fields.forEach(function (f) { f.querySelectorAll("input, select, textarea").forEach(function (i) { i.addEventListener("input", function () { if (!check(f)) f.classList.remove("bad"); }); i.addEventListener("change", function () { if (!check(f)) f.classList.remove("bad"); }); }); });
  function summary() {
    var g = function (k) { var f = form.querySelector('[data-field="' + k + '"]'); return f ? val(f) : ""; };
    var d = parse(current.date);
    return { parent: g("parent"), email: g("email"), child: g("child"), age: g("age"), notes: g("notes"), eventId: current.id, event: current.title, when: DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + " at " + current.start, place: current.place, price: price(current), submittedAt: new Date().toISOString(), source: "melody-circle-hub" };
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = null;
    fields.forEach(function (f) { var c = check(f); if (c) { var err = f.querySelector(".err"); if (err) err.textContent = MSG[f.getAttribute("data-field")] || "Please complete this field."; f.classList.add("bad"); if (!bad) bad = f; } else f.classList.remove("bad"); });
    if (bad) { var i = bad.querySelector("input, select"); if (i) i.focus(); return; }
    var s = summary();
    try { var all = JSON.parse(localStorage.getItem(STORE) || "[]"); all.push(s); localStorage.setItem(STORE, JSON.stringify(all)); } catch (x) {}
    var sum = step2.querySelector(".sum");
    sum.innerHTML = "<b>Circle</b><span>" + esc(s.event) + ", " + esc(s.when) + "</span><b>Little one</b><span>" + esc(s.child) + ", " + esc(s.age) + "</span><b>Grown-up</b><span>" + esc(s.parent) + "</span><b>Email</b><span>" + esc(s.email) + "</span><b>Price</b><span>" + esc(s.price) + (current.price > 0 ? " per child" : "") + "</span>";
    var body = "Hi " + (HUB.host || "") + ", I'd like to register " + s.child + " (" + s.age + ") for the " + s.event + " on " + s.when + ". Grown-up: " + s.parent + ", " + s.email + "." + (s.notes ? " Note: " + s.notes : "");
    var sms = step2.querySelector("[data-sms]"); if (sms) sms.setAttribute("href", "sms:" + (HUB.phone || "").replace(/\D/g, "") + "?&body=" + encodeURIComponent(body));
    step2.querySelectorAll("[data-phone]").forEach(function (el) { el.textContent = HUB.phone || ""; });
    step2.querySelectorAll("[data-host]").forEach(function (el) { el.textContent = HUB.host || "us"; });
    step1.classList.remove("on"); step2.classList.add("on");
    sheet.querySelector(".sheet-in").scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    var h = step2.querySelector(".h3"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
  });
  var copyBtn = sheet.querySelector("[data-copy]");
  if (copyBtn) copyBtn.addEventListener("click", function () {
    var num = HUB.phone || "";
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(num).then(function () { say("Number copied: " + num); }, function () { say(num); });
    else say(num);
  });
})();
