/* =====================================================================
   MELODY CIRCLE - spot counter (Google Apps Script web app)
   ---------------------------------------------------------------------
   One Google Sheet is the record of paid registrations. GoHighLevel posts
   here when a registration is marked paid; the hub page reads the count.

   POST  (from the GHL workflow "Webhook" action, JSON or form fields)
         event_id     the circle id from the registration (e.g. sep24)  REQUIRED
         full_name, email, phone, child_count, total, children   optional
         -> appends one row to the "Paid" tab, skips a duplicate
            (same event_id + email), answers {ok:true, counts:{sep24:7}}
   GET   -> {ok:true, counts:{sep24:7, ...}}   read by the hub every 90 s

   SETUP is in counter/README.md. Deploy as Web app, execute as Me,
   access: Anyone. Put the web app URL in assets/events.js -> counter.
   ===================================================================== */

var SHEET_NAME = "Paid";
var COUNT = "registrations";   /* "registrations" = one spot per family paid
                                  "children"      = one spot per child paid */
var SECRET = "";               /* optional: set a word here and add ?key=THATWORD
                                  to the webhook URL in GHL. Blank = no check. */

function doGet(e) {
  return respond({ ok: true, counts: counts() });
}

function doPost(e) {
  var body = parseBody(e);
  if (SECRET && String((e && e.parameter && e.parameter.key) || body.key || "") !== SECRET) return respond({ ok: false, error: "bad key" });
  var eventId = String(body.event_id || body.eventId || body.circle || "").trim();
  if (!eventId) return respond({ ok: false, error: "event_id missing", received: body });
  var email = String(body.email || "").trim().toLowerCase();
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = sheet(), rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][1]) === eventId && email && String(rows[i][4]).trim().toLowerCase() === email) return respond({ ok: true, duplicate: true, counts: counts() });
    }
    sh.appendRow([new Date(), eventId, String(body.full_name || body.name || ""), String(body.phone || ""), String(body.email || ""), Number(body.child_count) || 1, body.total !== undefined ? Number(body.total) || "" : "", String(body.children || ""), "paid", JSON.stringify(body)]);
    return respond({ ok: true, counts: counts() });
  } finally { lock.releaseLock(); }
}

/* counts per event id: rows whose Status column is "paid" */
function counts() {
  var sh = sheet(), rows = sh.getDataRange().getValues(), out = {};
  for (var i = 1; i < rows.length; i++) {
    var id = String(rows[i][1]).trim(), status = String(rows[i][8]).trim().toLowerCase();
    if (!id || (status && status !== "paid")) continue;
    var n = COUNT === "children" ? (Number(rows[i][5]) || 1) : 1;
    out[id] = (out[id] || 0) + n;
  }
  return out;
}

function sheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(["Paid at", "Circle id", "Parent", "Phone", "Email", "Children", "Total", "Children (names)", "Status", "Raw"]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function parseBody(e) {
  var body = {};
  try { if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents); } catch (x) {}
  if (e && e.parameter) Object.keys(e.parameter).forEach(function (k) { if (body[k] === undefined) body[k] = e.parameter[k]; });
  return body || {};
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Run once from the editor to create the tab and check permissions. */
function setup() { sheet(); Logger.log(counts()); }
