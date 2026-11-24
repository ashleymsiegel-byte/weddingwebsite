/**
 * Ashley & Eli — RSVP back end (Google Apps Script)
 *
 * Paste this whole file into Extensions → Apps Script on your RSVP Google Sheet.
 * Setup steps: see SETUP.md in this folder.
 *
 * Every RSVP is added as a new row on the "RSVPs" tab, and the guest gets a
 * confirmation email sent from the Google account that deploys this script.
 */

// ---- Settings ---------------------------------------------------------------
var SHEET_NAME = 'RSVPs';
var EMAIL_FROM_NAME = 'Ashley & Eli';
var EMAIL_SUBJECT = 'Your RSVP for Ashley & Eli’s wedding weekend';
var WEBSITE_URL = 'https://eliandashley.com';
var ACCEPTING_RSVPS = true; // set to false to reject any new submissions server-side

var EVENTS = [
  { key: 'welcome', name: 'The Welcome', date: 'Thursday, May 20, 2027' },
  { key: 'wedding', name: 'The Wedding', date: 'Friday, May 21, 2027' },
  { key: 'sendoff', name: 'The Send Off', date: 'Saturday, May 22, 2027' }
];

var HEADERS = ['Submitted', 'Guest name(s)', 'Email', 'Welcome (Thu 5/20)', 'Wedding (Fri 5/21)',
  'Send Off (Sat 5/22)', 'Dietary restrictions', 'Accessibility needs', 'Note to the couple', 'Email sent?'];
// -----------------------------------------------------------------------------

function doPost(e) {
  try {
    if (!ACCEPTING_RSVPS) return json_({ ok: false, error: 'closed' });

    var data = JSON.parse(e.postData.contents);

    // Honeypot: real guests never fill this hidden field; bots do.
    if (data.website) return json_({ ok: true });

    var names = clean_(data.names, 500);
    var email = clean_(data.email, 200);
    var answers = EVENTS.map(function (ev) {
      var v = data[ev.key];
      return v === 'Attending' || v === 'Not attending' ? v : '';
    });

    if (!names || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || answers.indexOf('') !== -1) {
      return json_({ ok: false, error: 'missing fields' });
    }

    var dietary = clean_(data.dietary, 1000);
    var accessibility = clean_(data.accessibility, 1000);
    var note = clean_(data.note, 2000);

    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    var sheet, row;
    try {
      sheet = getSheet_();
      sheet.appendRow([new Date(), names, email].concat(answers, [dietary, accessibility, note, '']));
      row = sheet.getLastRow();
    } finally {
      lock.releaseLock();
    }

    var emailStatus = 'Yes';
    try {
      sendConfirmation_(email, names, answers, dietary, accessibility, note);
    } catch (mailErr) {
      emailStatus = 'FAILED: ' + mailErr.message;
    }
    sheet.getRange(row, HEADERS.length).setValue(emailStatus);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Lets you open the Web App URL in a browser to confirm it's live.
function doGet() {
  return ContentService.createTextOutput('Ashley & Eli RSVP endpoint is running.');
}

function sendConfirmation_(to, names, answers, dietary, accessibility, note) {
  var rows = EVENTS.map(function (ev, i) {
    var yes = answers[i] === 'Attending';
    return '<tr>' +
      '<td style="padding:10px 0;border-bottom:1px solid #DCC9A0;">' +
        '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6B4F3A;">' + ev.date + '</div>' +
        '<div style="font-family:Georgia,serif;font-size:20px;color:#445A45;">' + ev.name + '</div></td>' +
      '<td style="padding:10px 0;border-bottom:1px solid #DCC9A0;text-align:right;color:' + (yes ? '#445A45' : '#6B4F3A') + ';">' +
        (yes ? 'Joyfully attending' : 'Sadly can’t make it') + '</td></tr>';
  }).join('');

  var extras = '';
  if (dietary) extras += para_('Dietary restrictions / allergies', dietary);
  if (accessibility) extras += para_('Accessibility needs', accessibility);
  if (note) extras += para_('Your note to us', note);

  var html =
    '<div style="background:#FCF6E4;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;color:#6B4F3A;">' +
    '<div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #DCC9A0;padding:36px 32px;">' +
      '<div style="text-align:center;font-family:Georgia,serif;font-size:30px;color:#445A45;">Ashley &amp; Eli</div>' +
      '<div style="text-align:center;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:6px 0 28px;">Sonoma, California &middot; May 2027</div>' +
      '<p style="font-size:15px;line-height:1.7;">Hi ' + esc_(names) + ',</p>' +
      '<p style="font-size:15px;line-height:1.7;">Thank you for your RSVP! Here’s what we received:</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 20px;">' + rows + '</table>' +
      extras +
      '<p style="font-size:15px;line-height:1.7;">You can find all of the weekend details, travel tips and hotel information at ' +
        '<a href="' + WEBSITE_URL + '" style="color:#445A45;">' + WEBSITE_URL.replace('https://', '') + '</a>.</p>' +
      '<p style="font-size:15px;line-height:1.7;">We can’t wait to celebrate with you!</p>' +
      '<p style="font-family:Georgia,serif;font-size:20px;color:#445A45;margin-top:24px;">With love,<br>Ashley &amp; Eli</p>' +
    '</div></div>';

  var plain = 'Hi ' + names + ',\n\nThank you for your RSVP! Here’s what we received:\n\n' +
    EVENTS.map(function (ev, i) { return ev.name + ' (' + ev.date + '): ' + answers[i]; }).join('\n') +
    (dietary ? '\n\nDietary restrictions / allergies: ' + dietary : '') +
    (accessibility ? '\nAccessibility needs: ' + accessibility : '') +
    (note ? '\nYour note to us: ' + note : '') +
    '\n\nAll the weekend details are at ' + WEBSITE_URL + '.\n\nWith love,\nAshley & Eli';

  MailApp.sendEmail({
    to: to,
    subject: EMAIL_SUBJECT,
    name: EMAIL_FROM_NAME,
    body: plain,
    htmlBody: html
  });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#F1E8CE');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Run this once from the Apps Script editor: creates the tab + headers and
 *  triggers Google's permission prompt (Sheets + send email). */
function setup() {
  getSheet_();
  Logger.log('RSVP sheet is ready. Email quota remaining today: ' + MailApp.getRemainingDailyQuota());
}

/** Optional: run from the editor to send yourself a sample confirmation email. */
function sendTestEmail() {
  var me = Session.getActiveUser().getEmail();
  sendConfirmation_(me, 'Test Guest', ['Attending', 'Attending', 'Not attending'], 'No shellfish', '', 'So excited!');
  Logger.log('Test email sent to ' + me);
}

function para_(label, text) {
  return '<p style="font-size:14px;line-height:1.6;margin:0 0 14px;"><strong style="color:#445A45;">' + label +
    ':</strong><br>' + esc_(text).replace(/\n/g, '<br>') + '</p>';
}

function clean_(v, max) {
  v = String(v == null ? '' : v).trim().slice(0, max);
  // Stop spreadsheet formula injection (values starting with = + - @)
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
