/* =====================================================================
   MELODY CIRCLE - UPCOMING CIRCLES (client-editable)
   =====================================================================
   HOW TO UPDATE
   - Each block between { } is one circle. Copy a whole block to add one,
     delete a block to remove one. Keep the comma between blocks.
   - id:     short unique word, letters only (used in the reserve link)
   - day:    shown exactly as written, e.g. "Tuesdays"
   - time:   shown exactly as written, e.g. "10:00 AM"
   - start / end: first and last session, written like "May 6"
              (the page counts the weekly sessions from these two dates)
   - venue:  shown exactly as written
   - full:   true hides the reserve button and shows "Full" instead
   The three circles below are the ones from the approved mockup.
   ===================================================================== */
window.MELODY_CIRCLES = [
  { id: "tuesday",   day: "Tuesdays",   time: "10:00 AM", start: "May 6",  end: "June 10", venue: "Oakleaf Studio", full: false },
  { id: "wednesday", day: "Wednesdays", time: "9:30 AM",  start: "May 7",  end: "June 11", venue: "Oakleaf Studio", full: false },
  { id: "saturday",  day: "Saturdays",  time: "10:30 AM", start: "May 10", end: "June 14", venue: "Oakleaf Studio", full: false }
];
