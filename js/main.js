// Swap the hero chainsaw sharpener image and the setup video with a fade, scale and slide.
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
