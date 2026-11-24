/* =========================================================
   RSVP SETTINGS — the only two lines you should need to edit
   ---------------------------------------------------------
   RSVP_STATUS:
     'soon'   → form is shown but locked ("RSVP will open later…")
     'open'   → guests can submit
     'closed' → form is locked ("RSVPs are now closed")
   RSVP_ENDPOINT: the Web App URL from Google Apps Script
   (see _rsvp-backend/SETUP.md)
   ========================================================= */
var RSVP_STATUS = 'soon';
var RSVP_ENDPOINT = '';

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('rsvp-form');
  if (!form) return;

  var fieldset = form.querySelector('.rsvp-fieldset');
  var overlay = document.querySelector('[data-rsvp-overlay]');
  var overlayText = document.querySelector('[data-rsvp-overlay-text]');
  var banner = document.querySelector('[data-rsvp-banner]');
  var submitBtn = form.querySelector('.rsvp-submit');
  var errorBox = document.querySelector('[data-rsvp-error]');
  var thanks = document.querySelector('[data-rsvp-thanks]');
  var thanksEmail = document.querySelector('[data-rsvp-thanks-email]');

  if (RSVP_STATUS === 'closed') {
    banner.textContent = 'Thank you to everyone who shared their plans with us. We can’t wait to celebrate together!';
    overlayText.textContent = 'RSVPs are now closed. If you have questions, please reach out to us directly.';
    submitBtn.textContent = 'RSVPs Closed';
    return;
  }
  if (RSVP_STATUS !== 'open' || !RSVP_ENDPOINT) return;

  // Open the form
  overlay.hidden = true;
  fieldset.disabled = false;
  submitBtn.disabled = false;
  submitBtn.textContent = 'Send RSVP';
  banner.textContent = 'Please RSVP for each event of the weekend below. Each invitation only needs to submit one RSVP.';

  function showError(msg, field) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
    if (field) field.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var data = {
      names: form.names.value.trim(),
      email: form.email.value.trim(),
      welcome: (form.querySelector('input[name="welcome"]:checked') || {}).value || '',
      wedding: (form.querySelector('input[name="wedding"]:checked') || {}).value || '',
      sendoff: (form.querySelector('input[name="sendoff"]:checked') || {}).value || '',
      dietary: form.dietary.value.trim(),
      accessibility: form.accessibility.value.trim(),
      note: form.note.value.trim(),
      website: form.website.value
    };

    if (!data.names) return showError('Please tell us who in your party will be attending.', form.names);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return showError('Please enter a valid email address so we can send your confirmation.', form.email);
    if (!data.welcome) return showError('Please let us know if you’ll join us for The Welcome on Thursday.', form.querySelector('input[name="welcome"]'));
    if (!data.wedding) return showError('Please let us know if you’ll join us for The Wedding on Friday.', form.querySelector('input[name="wedding"]'));
    if (!data.sendoff) return showError('Please let us know if you’ll join us for The Send Off on Saturday.', form.querySelector('input[name="sendoff"]'));

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    // text/plain avoids a CORS preflight, which Apps Script doesn't support
    fetch(RSVP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (!result || !result.ok) throw new Error((result && result.error) || 'Unknown error');
        form.hidden = true;
        banner.hidden = true;
        thanksEmail.textContent = data.email;
        thanks.hidden = false;
        thanks.focus();
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send RSVP';
        showError('Something went wrong sending your RSVP. Please try again in a moment. If it keeps happening, reach out to us directly.');
      });
  });
});
