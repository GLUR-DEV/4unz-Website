// Show / hide the chainsaw sharpener setup video.
(function () {
  var button = document.getElementById('videoToggle');
  var panel = document.getElementById('videoPanel');
  if (!button || !panel) return;

  button.addEventListener('click', function () {
    var opening = panel.hidden;
    panel.hidden = !opening;
    button.setAttribute('aria-expanded', String(opening));

    var video = panel.querySelector('video');
    if (!opening && video) video.pause();
    if (opening) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
