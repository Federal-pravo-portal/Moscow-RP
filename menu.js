document.addEventListener('DOMContentLoaded', function () {
  var current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var links = document.querySelectorAll('.site-header__menu .site-header__link');

  var matched = null;
  for (var i = 0; i < links.length; i++) {
    var href = (links[i].getAttribute('href') || '').split('/').pop().toLowerCase();
    if (href === current) {
      matched = links[i];
      break;
    }
  }

  if (matched) {
    for (var j = 0; j < links.length; j++) {
      links[j].classList.remove('is-current');
    }
    matched.classList.add('is-current');
  }
});