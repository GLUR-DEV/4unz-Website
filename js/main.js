// 1. Hero: swap the chainsaw sharpener image and the setup video with a fade, scale and slide.
// 2. Header: slide the contact bar and header down (with a shadow) when they stick to the top.
// 3. Ranges: slide each product row in (image, then text, then chips and Enquire link) every time it scrolls into view.
(function () {
  var button = document.getElementById('videoToggle');
  var stage = document.getElementById('heroStage');
  var image = document.getElementById('heroImage');
  var video = document.getElementById('heroVideo');
  var caption = document.getElementById('heroCaption');
  if (!button || !stage || !image || !video) return;

  var label = button.querySelector('.btn__label');
  var labelShow = label ? label.textContent : '';
  var labelHide = 'Hide setup video';

  var DURATION = 400;                        // ms, length of the whole transition
  var EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  // The incoming item fades in while rising and growing slightly;
  // the outgoing item fades out while easing back and down.
  var FRAMES_IN = [
    { opacity: 0, transform: 'translateY(12px) scale(0.96)' },
    { opacity: 1, transform: 'translateY(0) scale(1)' }
  ];
  var FRAMES_OUT = [
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 0, transform: 'translateY(8px) scale(0.98)' }
  ];

  var busy = false;                          // ignore clicks while a transition runs
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function playVideo() {
    var started = video.play();            // allowed: it follows a click
    if (started && started.catch) started.catch(function () {});
  }

  // No animation: reduced-motion visitors, or browsers without the Web Animations API.
  function swapInstantly(showVideo, text) {
    video.hidden = !showVideo;
    image.hidden = showVideo;
    if (caption) {
      caption.textContent = text;
      caption.classList.toggle('is-playing', showVideo);
    }
    if (showVideo) playVideo(); else video.pause();
  }

  function swapAnimated(showVideo, text) {
    var incoming = showVideo ? video : image;
    var outgoing = showVideo ? image : video;

    // The stage has a fixed shape (set in CSS), so both items just cross-fade in place.
    outgoing.classList.add('is-leaving');
    outgoing.inert = true;
    incoming.hidden = false;

    var timing = { duration: DURATION, easing: EASING };
    var animations = [
      outgoing.animate(FRAMES_OUT, { duration: DURATION, easing: EASING, fill: 'forwards' }),
      incoming.animate(FRAMES_IN, timing)
    ];

    // Caption fades out, changes text at the midpoint, then fades back in.
    if (caption) {
      caption.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: DURATION });
      setTimeout(function () {
        caption.textContent = text;
        caption.classList.toggle('is-playing', showVideo);
      }, DURATION / 2);
    }

    if (showVideo) playVideo(); else video.pause();

    function finish() {
      outgoing.hidden = true;
      outgoing.classList.remove('is-leaving');
      outgoing.inert = false;
      animations.forEach(function (a) { a.cancel(); });
      busy = false;
    }
    Promise.all(animations.map(function (a) { return a.finished; })).then(finish, finish);
  }

  button.addEventListener('click', function () {
    if (busy) return;

    var showVideo = video.hidden;
    var text = caption ? (showVideo ? caption.dataset.videoText : caption.dataset.imageText) : '';

    button.setAttribute('aria-expanded', String(showVideo));
    if (label) label.textContent = showVideo ? labelHide : labelShow;

    if (!video.animate || reduceMotion.matches) {
      swapInstantly(showVideo, text);
      return;
    }

    busy = true;
    try {
      swapAnimated(showVideo, text);
    } catch (err) {
      swapInstantly(showVideo, text);
      busy = false;
    }
  });
})();

// Sticky bar. The contact bar and header scroll away with the page. Once the page has scrolled past
// the bar's own height it is fixed to the top and slides down. It then stays fixed until the page is
// back at the very top, where it rejoins the page flow (it is already in exactly that spot, so there
// is no visible change). Works at every screen size, phones included.
(function () {
  var bar = document.querySelector('.site-top');
  if (!bar) return;

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var DURATION = 800;                        // ms, length of the slide down
  var EASING = 'cubic-bezier(0.3, 0.3, 0.2, 1)';    // moves straight away, then a long soft landing
  // The extra 40px keeps the shadow out of sight while the bar is parked above the screen.
  var FRAMES = [
    { transform: 'translateY(calc(-100% - 40px))' },
    { transform: 'translateY(0)' }
  ];

  var stuck = false;                         // is the bar fixed to the top?
  var slide = null;                          // the slide-down animation while it is running

  function fix() {                           // take the bar out of the page flow (see layout.css)
    bar.classList.add('is-fixed');
    root.classList.add('has-fixed-bar');
  }
  function unfix() {
    bar.classList.remove('is-fixed');
    root.classList.remove('has-fixed-bar');
  }
  function stopSlide() {
    if (slide) { slide.cancel(); slide = null; }
  }

  function setStuck(next, animate) {
    if (next === stuck) return;
    stuck = next;
    bar.classList.toggle('is-stuck', next);  // fades the shadow in and out

    stopSlide();
    if (!next) {                             // back at the very top: rejoin the flow
      unfix();
      return;
    }

    fix();
    if (animate && !reduceMotion.matches && bar.animate) {
      slide = bar.animate(FRAMES, { duration: DURATION, easing: EASING });
      slide.onfinish = function () { slide = null; };
    }
  }

  function update(animate) {
    var height = bar.offsetHeight;
    root.style.setProperty('--site-top-height', height + 'px');
    // Sticks once past the bar's own height, and stays stuck until the page is back at the very top.
    setStuck(stuck ? window.scrollY > 0 : window.scrollY > height, animate);
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; update(true); });
  }, { passive: true });
  window.addEventListener('resize', function () { update(false); });

  root.classList.add('bar-js');
  update(false);                             // page may load already scrolled (refresh, back button)
})();

// The intro above the first row fades up line by line every time it scrolls into view.
// Each product row plays this sequence every time it scrolls into view, from either direction:
//   1. the image slides in from the side it sits on (the sliding itself is CSS, see .slide-pre in theme-final.css),
//   2. the heading, intro and bullet points fade up one after another,
//   3. the spec chips pop,
//   4. the Enquire link fades in and draws its underline.
// A row is reset once completely off screen, so the sequence can play again on the next visit.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Leave everything visible and static for reduced-motion visitors and older browsers.
  if (reduceMotion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  var EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
  var LINK_DURATION = 500;                   // ms
  var FRAMES_LINK = [
    { opacity: 0, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ];

  // Timing (ms). TEXT_DURATION and CHIP_STEP must match the transition and .pop lengths in theme-final.css.
  var TEXT_START = 250;                      // first text line starts this long after the row is revealed
  var TEXT_STEP = 80;                        // gap between text lines
  var TEXT_DURATION = 450;                   // length of each line's fade up
  var CHIP_OVERLAP = 140;                    // chips start this long before the last text line finishes
  var CHIP_STEP = 70;                        // gap between chips
  var LINK_GAP = 60;                         // link starts this long after the last chip starts

  function toArray(list) { return Array.prototype.slice.call(list); }

  // The intro above the first row ("What we supply") just fades its lines up one after another.
  function revealIntro(intro) {
    toArray(intro.children).forEach(function (line, i) {
      line.style.setProperty('--sd', (i * TEXT_STEP) + 'ms');
    });
    intro.classList.remove('slide-pre');
  }

  function hideIntro(intro) {
    intro.classList.add('slide-nt', 'slide-pre');
    void intro.offsetWidth;                  // let the browser apply the hidden state first
    intro.classList.remove('slide-nt');
  }

  function reveal(row) {
    if (row.classList.contains('ranges__intro')) { revealIntro(row); return; }
    var lines =toArray(row.querySelectorAll(':scope > .range__text > h3, :scope > .range__text > p, :scope > .range__text > .feature-list > li'));
    var chips = toArray(row.querySelectorAll('.chips > li'));
    var link = row.querySelector('.more');

    // Text lines: CSS transition, each with its own delay.
    lines.forEach(function (line, i) {
      line.style.setProperty('--sd', (TEXT_START + i * TEXT_STEP) + 'ms');
    });
    var lastLineStart = TEXT_START + Math.max(lines.length - 1, 0) * TEXT_STEP;
    var chipsStart = lastLineStart + TEXT_DURATION - CHIP_OVERLAP;
    var linkStart = chipsStart + (chips.length ? (chips.length - 1) * CHIP_STEP : 0) + LINK_GAP;

    // The image and text start moving as soon as .slide-pre is removed.
    row.classList.remove('slide-pre');

    // Chips: CSS .pop animation, held back by --d0 until the text has filled in.
    chips.forEach(function (chip, i) {
      chip.style.setProperty('--i', i);      // stagger
      chip.style.setProperty('--d0', chipsStart + 'ms');
      chip.classList.remove('pre-reveal');
      chip.classList.add('pop');
    });

    // Link: waits, then fades up here and draws its underline in CSS.
    if (link) {
      row.linkTimer = setTimeout(function () {
        link.classList.remove('pre-reveal');
        link.animate(FRAMES_LINK, { duration: LINK_DURATION, easing: EASING, fill: 'backwards' });
      }, linkStart);
    }
  }

  function hide(row) {
    if (row.classList.contains('ranges__intro')) { hideIntro(row); return; }
    clearTimeout(row.linkTimer);
    // .slide-nt switches transitions off for a moment so the reset doesn't animate backwards.
    row.classList.add('slide-nt', 'slide-pre');
    void row.offsetWidth;                    // let the browser apply the hidden state first
    row.classList.remove('slide-nt');
    toArray(row.querySelectorAll('.chips > li')).forEach(function (chip) {
      chip.classList.remove('pop');
      chip.classList.add('pre-reveal');
    });
    var link = row.querySelector('.more');
    if (link) link.classList.add('pre-reveal');
  }

  // Reveal a little before the row is fully on screen (10% up from the bottom edge) ...
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !entry.target.dataset.shown) {
        entry.target.dataset.shown = '1';
        reveal(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  // ... but only reset once not a single pixel of it is on screen.
  var resetObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting && entry.target.dataset.shown) {
        delete entry.target.dataset.shown;
        hide(entry.target);
      }
    });
  });

  toArray(document.querySelectorAll('.ranges__intro, .range')).forEach(function (row) {
    hide(row);
    revealObserver.observe(row);
    resetObserver.observe(row);
  });
})();