from pathlib import Path
root=Path('/mnt/data/fix_links')
script=root/'script.js'
pc=root/'pc.css'
phone=root/'phone.css'
js=script.read_text()
block=r'''

/* =====================================================
   INDEX: Fix Health/Finance card dropdown links
   - Forces dropdown items to navigate when clicked
   - Keeps ctrl/cmd/middle-click behavior for new tabs
===================================================== */
(function () {
  "use strict";

  function isIndexDropdownLink(target) {
    return target && target.closest && target.closest("body.index-page .calculator-box .group-card .group-links a");
  }

  document.addEventListener(
    "click",
    function (event) {
      const link = isIndexDropdownLink(event.target);
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      /* Allow normal browser new-tab shortcuts. */
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      window.location.href = href;
    },
    true
  );
})();
'''
if 'INDEX: Fix Health/Finance card dropdown links' not in js:
    script.write_text(js+block)

css_patch=r'''

/* =====================================================
   INDEX: Make Health/Finance dropdown links clickable
===================================================== */
body.index-page .calculator-box .group-card,
body.index-page .calculator-box .group-card > .group-links,
body.index-page .calculator-box .group-card > .group-links *,
body.index-page .calculator-box .group-links.index-card-dropdown-enhanced,
body.index-page .calculator-box .group-links.index-card-dropdown-enhanced *,
body.index-page .calculator-box .group-links.index-card-dropdown-enhanced a {
  pointer-events: auto !important;
}

body.index-page .calculator-box .group-links.index-card-dropdown-enhanced {
  z-index: 999999 !important;
}

body.index-page .calculator-box .group-links.index-card-dropdown-enhanced a {
  cursor: pointer !important;
  position: relative !important;
  z-index: 1000000 !important;
}
'''
for f in [pc, phone]:
    txt=f.read_text()
    if 'INDEX: Make Health/Finance dropdown links clickable' not in txt:
        f.write_text(txt+css_patch)
