/* =====================================================================
   MELODY CIRCLE HUB - EVENTS (client-editable)
   =====================================================================
   HOW TO UPDATE
   - Each block between { } is one circle date. Copy a block to add one,
     delete a block to remove one. Keep the comma between blocks.
   - id:      short unique word, letters and digits only
   - date:    YYYY-MM-DD (the calendar and the weekday come from this)
   - start / end: written like "11:00 AM"
   - title:   the circle's name
   - label:   the small caps line above the date, e.g. "Registration open"
   - place:   venue as it should read
   - ages:    who it is for, as it should read
   - price:   a number, 0 for complimentary
   - status:  "open" (people can register), "closed" (past or full),
              or "soon" (listed, registration not open yet)
   - note:    one sentence shown on the card
   - short:   the tiny word shown inside the calendar day, e.g. "$35"
   The two dates below are the ones from the reference hub. Placeholders.
   ===================================================================== */
window.MELODY_EVENTS = [
  { id: "sep10", date: "2026-09-10", start: "11:00 AM", end: "12:00 PM",
    title: "Complimentary Launch Circle", label: "Complimentary launch",
    place: "The Collective Studio, Miami", ages: "Birth through age four", price: 0, status: "closed",
    note: "Original songs, gentle movement, instruments and time for moms to connect.", short: "Launch" },
  { id: "sep24", date: "2026-09-24", start: "11:00 AM", end: "12:00 PM",
    title: "September Circle", label: "Registration open",
    place: "The Collective Studio, Miami", ages: "Birth through age four", price: 35, status: "open",
    note: "Register your little one, then text us to secure your space.", short: "$35" }
];

/* Studio details used across the hub */
window.MELODY_HUB = {
  instagram: "melodycirclemiami",          /* handle, without the @ */
  phone: "786-619-6060",                   /* where registrations are texted */
  host: "Tiffany",                         /* who reads the registrations */
  tagline: "Mommy + Me Music + Movement · Miami"
};
