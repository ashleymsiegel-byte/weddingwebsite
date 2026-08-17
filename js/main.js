document.addEventListener('DOMContentLoaded', function () {
  var navToggle = document.querySelector('.nav-toggle');
  var siteNav = document.querySelector('.site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = siteNav.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });
  }

  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    var icon = item.querySelector('.faq-icon');
    question.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      icon.textContent = isOpen ? '−' : '+';
    });
  });

  var rsvpForm = document.querySelector('.rsvp-form');
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      rsvpForm.hidden = true;
      var thankYou = document.querySelector('.rsvp-thankyou');
      if (thankYou) thankYou.hidden = false;
    });
  }
});
