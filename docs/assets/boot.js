// Runs before the first paint: sets the language, direction, and theme, so the
// page never flashes the wrong way round. A separate file, because the content
// security policy allows no inline script. The theme is always written to the
// page, from the reader's choice or else from the system, so the stylesheet
// states each theme once.
(function () {
  var d = document.documentElement;
  var read = function (key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };
  var asked = new URLSearchParams(location.search).get('lang');
  var saved = read('bunyan-lang');
  var lang =
    asked === 'ar' || asked === 'en'
      ? asked
      : saved === 'ar' || saved === 'en'
        ? saved
        : (navigator.language || '').toLowerCase().indexOf('ar') === 0
          ? 'ar'
          : 'en';
  d.lang = lang;
  d.dir = lang === 'ar' ? 'rtl' : 'ltr';
  var dark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var apply = function () {
    var theme = read('bunyan-theme');
    if (theme !== 'light' && theme !== 'dark') theme = dark && dark.matches ? 'dark' : 'light';
    d.setAttribute('data-theme', theme);
  };
  apply();
  if (dark && dark.addEventListener) dark.addEventListener('change', apply);
})();
