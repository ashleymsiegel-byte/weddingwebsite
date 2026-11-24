# RSVP setup (one time, about 10 minutes)

RSVPs are saved to a Google Sheet, and guests get a confirmation email sent from your Gmail.
This folder starts with an underscore, so GitHub Pages does **not** publish it on the site.

## 1. Create the Sheet
1. Go to sheets.google.com and create a blank spreadsheet. Name it something like **Wedding RSVPs**.
2. In the Sheet, open **Extensions → Apps Script**.

## 2. Add the script
1. Delete the placeholder code in `Code.gs`, then paste in everything from `_rsvp-backend/Code.gs`.
2. Click **Save** (the disk icon).
3. In the function dropdown at the top, choose **`setup`** and click **Run**.
   - Google will ask for permission. Choose your account, then **Advanced → Go to (project name) → Allow**.
     It says "unsafe" only because you wrote the app yourself. It's asking to edit this Sheet and send email as you.
   - An **RSVPs** tab with column headers now appears in your Sheet.
4. Optional: choose **`sendTestEmail`** and click **Run** to see the confirmation email in your own inbox.

## 3. Deploy it as a web app
1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then copy the **Web app URL** (it ends in `/exec`).

## 4. Connect the website
In `js/rsvp.js`, edit the two lines at the top:

```js
var RSVP_STATUS = 'open';
var RSVP_ENDPOINT = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

Commit the change. The form goes live within a minute or two.

## Opening and closing RSVPs
In `js/rsvp.js`, change `RSVP_STATUS`:

| Value | What guests see |
|---|---|
| `'soon'` | The form is visible but locked: "RSVP will open later in the year…" |
| `'open'` | Guests can submit |
| `'closed'` | The form is locked: "RSVPs are now closed." |

To fully shut off submissions on the back end as well, set `ACCEPTING_RSVPS = false` in the Apps Script and redeploy (step 5).

## 5. If you ever edit the script
Changes don't go live until you redeploy:
**Deploy → Manage deployments → pencil icon → Version: New version → Deploy.**
Doing it this way keeps the same URL, so you don't need to update the website.

## Good to know
- **Email limit:** A personal Gmail account can send about 100 Apps Script emails per day.
  That's plenty for RSVPs. The last column of the Sheet shows whether each confirmation sent.
- **Duplicates:** If someone submits twice, both rows appear. Sort by name or email to spot them.
- **Totals:** Add a "Summary" tab with formulas like
  `=COUNTIF(RSVPs!E:E,"Attending")` to count attending *invitations* per event.
  Headcount comes from the names column, since there's one row per invitation.
