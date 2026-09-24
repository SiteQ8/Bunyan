// Runs before the first paint: sets the language, direction, and theme, so the
// page never flashes the wrong way round. A separate file, because the content
// security policy allows no inline script.
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
  var theme = read('bunyan-theme');
  if (theme === 'light' || theme === 'dark') d.setAttribute('data-theme', theme);
})();
