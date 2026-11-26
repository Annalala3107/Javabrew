(function () {
  try {
    var t = localStorage.getItem('javabrew:theme');
    var root = document.documentElement;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      if (meta) meta.setAttribute('content', '#faf8f5');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      if (meta) meta.setAttribute('content', '#121110');
    }
  } catch (e) {}
})();
