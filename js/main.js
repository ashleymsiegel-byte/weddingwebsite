document.addEventListener('DOMContentLoaded', function () {
  var navToggle = document.querySelector('.nav-toggle');
  var siteNav = document.querySelector('.site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = siteNav.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) {
        siteNav.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    var icon = item.querySelector('.faq-icon');
    question.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      icon.textContent = isOpen ? '−' : '+';
      question.setAttribute('aria-expanded', isOpen);
    });
  });

  var lightbox = document.querySelector('.gallery-lightbox');
  if (lightbox) {
    var lightboxImg = lightbox.querySelector('.lightbox-img');
    var lightboxClose = lightbox.querySelector('.lightbox-close');
    var lightboxPrev = lightbox.querySelector('.lightbox-prev');
    var lightboxNext = lightbox.querySelector('.lightbox-next');
    var lightboxCounter = lightbox.querySelector('.lightbox-counter');
    var lightboxStatus = lightbox.querySelector('.lightbox-status');
    var focusOrder = [lightboxPrev, lightboxNext, lightboxClose];
    var lastTrigger = null;
    var currentIndex = 0;

    var galleryItems = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
    var photos = galleryItems.map(function (item) {
      var img = item.querySelector('img');
      return { src: img.src, alt: img.alt };
    });

    function showPhoto(index, announce) {
      currentIndex = index;
      var photo = photos[currentIndex];
      lightboxImg.src = photo.src;
      lightboxImg.alt = photo.alt;
      lightboxCounter.textContent = (currentIndex + 1) + ' / ' + photos.length;
      if (announce) {
        lightboxStatus.textContent = 'Photo ' + (currentIndex + 1) + ' of ' + photos.length + ': ' + photo.alt;
      }
    }

    function openLightbox(index, trigger) {
      showPhoto(index, false);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lastTrigger = trigger || null;
      lightboxClose.focus();
    }
    function closeLightbox() {
      lightbox.hidden = true;
      lightboxImg.src = '';
      lightboxStatus.textContent = '';
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    }
    function showPrev() {
      showPhoto((currentIndex - 1 + photos.length) % photos.length, true);
    }
    function showNext() {
      showPhoto((currentIndex + 1) % photos.length, true);
    }

    galleryItems.forEach(function (item, index) {
      item.addEventListener('click', function () {
        openLightbox(index, item);
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrev);
    lightboxNext.addEventListener('click', showNext);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'Tab') {
        e.preventDefault();
        var current = focusOrder.indexOf(document.activeElement);
        var nextIndex;
        if (e.shiftKey) {
          nextIndex = current <= 0 ? focusOrder.length - 1 : current - 1;
        } else {
          nextIndex = current === focusOrder.length - 1 ? 0 : current + 1;
        }
        focusOrder[nextIndex].focus();
      }
    });
  }
});
