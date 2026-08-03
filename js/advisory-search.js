// Practice advisories page:
//  1. Filters the advisory list by title as the user types.
//  2. Sizes the cards so full rows fill the width edge-to-edge (flush),
//     while an incomplete last row (e.g. the final 2 of 8) centers.
//  3. Equalizes every card's title bar to the tallest so they all match.
// Everything recalculates on load, on resize, and after each search so
// it stays correct at any width and never interferes with filtering.
(function () {
  var input = document.getElementById('advisory-search');
  var list = document.getElementById('advisory-list');
  var items = document.querySelectorAll('#advisory-list > li');
  var noResults = document.getElementById('advisory-no-results');
  if (!list) return;

  var MIN_CARD = 300; // px: minimum card width before the grid adds a column

  function visibleItems() {
    var v = [];
    items.forEach(function (it) { if (!it.hidden) v.push(it); });
    return v;
  }

  // Size every card so a full row exactly fills the container (flush
  // edges). The container's justify-content:center then only affects a
  // short last row, centering it under the full rows above.
  function layoutCards() {
    var width = list.clientWidth;
    if (!width) return;
    var gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    var cols = Math.max(1, Math.floor((width + gap) / (MIN_CARD + gap)));
    var cardW = Math.floor((width - (cols - 1) * gap) / cols);
    items.forEach(function (it) { it.style.flex = '0 0 ' + cardW + 'px'; });
  }

  // Measure the tallest visible title bar and set them all to it.
  function equalizeTitles() {
    var titles = [];
    visibleItems().forEach(function (it) {
      var h3 = it.querySelector('h3');
      if (h3) titles.push(h3);
    });
    if (!titles.length) return;
    titles.forEach(function (h3) { h3.style.height = 'auto'; });
    var max = 0;
    titles.forEach(function (h3) {
      if (h3.offsetHeight > max) max = h3.offsetHeight;
    });
    titles.forEach(function (h3) { h3.style.height = max + 'px'; });
  }

  // Card width must be set before measuring title heights (width drives
  // how the titles wrap).
  function refresh() { layoutCards(); equalizeTitles(); }

  refresh();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(refresh);
  }
  window.addEventListener('load', refresh);

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 150);
  });

  // --- Search filter ---
  if (input) {
    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      var visibleCount = 0;

      items.forEach(function (item) {
        // Match the summary as well as the title, so an advisory stays
        // findable by terms its title no longer contains (e.g. "domestic").
        var summaryEl = item.querySelector('.summary');
        var text = item.querySelector('h3').textContent.toLowerCase() +
                   ' ' + (summaryEl ? summaryEl.textContent.toLowerCase() : '');
        var matches = text.indexOf(query) !== -1;
        item.hidden = !matches;
        if (matches) visibleCount++;
      });

      if (noResults) noResults.hidden = visibleCount !== 0;
      equalizeTitles();
    });
  }
})();
