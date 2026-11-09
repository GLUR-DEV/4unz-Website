// Swap the hero chainsaw sharpener image for the setup video, and back again.
(function () {
  var button = document.getElementById('videoToggle');
  var image = document.getElementById('heroImage');
  var video = document.getElementById('heroVideo');
  var caption = document.getElementById('heroCaption');
  if (!button || !image || !video) return;

  var label = button.querySelector('.btn__label');
  var labelShow = label ? label.textContent : '';
  var labelHide = 'Hide setup video';

  button.addEventListener('click', function () {
    var showVideo = video.hidden;

    video.hidden = !showVideo;
    image.hidden = showVideo;
    button.setAttribute('aria-expanded', String(showVideo));
    if (label) label.textContent = showVideo ? labelHide : labelShow;
    if (caption) {
      caption.textContent = showVideo ? caption.dataset.videoText : caption.dataset.imageText;
    }

    if (showVideo) {
      // Started from a click, so browsers allow playback with sound.
      var started = video.play();
      if (started && started.catch) started.catch(function () {});
    } else {
      video.pause();
    }
  });
})();
