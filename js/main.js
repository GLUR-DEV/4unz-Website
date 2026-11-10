// 1. Hero: swap the chainsaw sharpener image and the setup video with a fade, scale and slide.
// 2. Header: slide the contact bar and header down (with a shadow) when they stick to the top.
// 3. Ranges: pop the spec chips and fade the Enquire links in every time they scroll into view.
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
    if (caption) caption.textContent = text;
    if (showVideo) playVideo(); else video.pause();
  }

  function swapAnimated(showVideo, text) {
    var incoming = showVideo ? video : image;
    var outgoing = showVideo ? image : video;

    // Measure the card before and after the swap, with the outgoing item lifted out of flow.
    // The video's 16:9 size is set in the page, so its height is known before it loads.
    var startHeight = stage.offsetHeight;
    outgoing.classList.add('is-leaving');
    outgoing.inert = true;
    incoming.hidden = false;
    var endHeight = stage.offsetHeight;

    stage.style.overflow = 'hidden';
    var timing = { duration: DURATION, easing: EASING };
    var animations = [
      outgoing.animate(FRAMES_OUT, { duration: DURATION, easing: EASING, fill: 'forwards' }),
      incoming.animate(FRAMES_IN, timing),
      stage.animate([{ height: startHeight + 'px' }, { height: endHeight + 'px' }], timing)
    ];

    // Caption fades out, changes text at the midpoint, then fades back in.
    if (caption) {
      caption.animate([{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }], { duration: DURATION });
      setTimeout(function () { caption.textContent = text; }, DURATION / 2);
    }

    if (showVideo) playVideo(); else video.pause();

    function finish() {
      outgoing.hidden = true;
      outgoing.classList.remove('is-leaving');
      outgoing.inert = false;
      animations.forEach(function (a) { a.cancel(); });
      stage.style.overflow = '';
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
// is no visible change). Desktop only (wider than 820px): on phones the bar stays static.
(function () {
  var bar = document.querySelector('.site-top');
  if (!bar) return;

  var root = document.documentElement;
  var desktop = window.matchMedia('(min-width: 821px)');
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
    if (!desktop.matches) {                  // phones: leave the bar alone
      stuck = false;
      stopSlide();
      bar.classList.remove('is-stuck');
      unfix();
      return;
    }
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

// Spec chips and Enquire links animate in every time they scroll into view, from either direction.
// They are reset once completely off screen, so the animation can play again on the next visit.
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

  // Chips use the CSS .pop animation (theme-final.css); links fade up here and draw their underline in CSS.
  function reveal(target) {
    if (target.classList.contains('chips')) {
      Array.prototype.forEach.call(target.children, function (chip, i) {
        chip.style.setProperty('--i', i);    // stagger
        chip.classList.remove('pre-reveal');
        chip.classList.add('pop');
      });
    } else {
      target.classList.remove('pre-reveal');
      target.animate(FRAMES_LINK, { duration: LINK_DURATION, easing: EASING, fill: 'backwards' });
    }
  }

  function hide(target) {
    if (target.classList.contains('chips')) {
      Array.prototype.forEach.call(target.children, function (chip) {
        chip.classList.remove('pop');
        chip.classList.add('pre-reveal');
      });
    } else {
      target.classList.add('pre-reveal');
    }
  }

  // Reveal a little before the element is fully on screen (10% up from the bottom edge) ...
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

  Array.prototype.forEach.call(document.querySelectorAll('.chips, .more'), function (target) {
    hide(target);
    revealObserver.observe(target);
    resetObserver.observe(target);
  });
})();
