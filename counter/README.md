# Melody Circle spot counter

The hub shows "7 of 15 spots taken, 8 left" on the open circle and closes it at
15. The number comes from one Google Sheet that GoHighLevel writes to when a
registration is marked paid. Tiffany can also open the sheet and see who paid.

## 1. Make the sheet and the web app (about five minutes)

1. Go to https://sheets.new and name the sheet "Melody Circle paid".
2. Extensions > Apps Script. Delete what is there, paste all of `Code.gs`, save.
3. Run the `setup` function once (Run button) and allow the permissions it asks
   for. A "Paid" tab appears in the sheet.
4. Deploy > New deployment > type "Web app". Execute as: **Me**. Who has access:
   **Anyone**. Deploy, then copy the Web app URL (ends in `/exec`).
5. Paste that URL into `assets/events.js` as `counter: "https://script.google.com/.../exec"`,
   push, and the hub starts reading it. Rebuild the GHL embed if the hub lives in GHL.

## 2. Tell GoHighLevel to post a paid registration

Every registration already reaches GHL through the webhook in `assets/hub.js`
with these fields: `event_id`, `full_name`, `email`, `phone`, `child_count`,
`children`, `total`. Save `event_id` (and `child_count`) as custom fields on the
contact in the inbound workflow so they can be sent back later.

Then make a workflow that fires when Tiffany marks someone paid (a tag like
`paid`, or a pipeline stage), with one **Webhook** action:

- Method: POST
- URL: the Web app URL from step 4 (add `?key=YOURWORD` if you set `SECRET` in Code.gs)
- Body (JSON): `event_id` = the contact's saved event id, plus `full_name`,
  `email`, `phone`, `child_count`, `total` from the contact.

The sheet gets one row per paid family, duplicates (same circle and email) are
ignored, and the hub updates within 90 seconds, or instantly on reload.

## 3. Test without GHL

```bash
curl -L -X POST "https://script.google.com/macros/s/XXXX/exec" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"sep24","full_name":"Test Parent","email":"test@example.com","phone":"3055550142","child_count":2,"total":50}'
```

Then open the URL in a browser: `{"ok":true,"counts":{"sep24":1}}`. Delete the
test row in the sheet afterwards; the count follows the sheet.

## Counting rule

`COUNT = "registrations"` counts one spot per paid family (what Josh described:
"20 register, 10 paid, 10 of 15 taken"). Change it to `"children"` to count one
spot per child instead. Rows whose Status column is not "paid" are ignored, so
Tiffany can type "refunded" in that column to give a spot back.
