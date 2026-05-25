Clean auto-calculate site update

Requested changes completed:
1. All calculators auto-calculate when input/select values are entered, except Basic Calculator.
2. Calculate buttons were removed from every calculator page except Basic Calculator.
3. History boxes were removed from every calculator page except Basic Calculator.
4. Old inline calculator scripts and old PC age-history observer blocks were removed.
5. No MutationObserver is used in the shared calculator script.
6. No CSS hidden-button/history-box system was added. Removed items are removed from HTML/DOM, not hidden.

Files changed:
- script.js was rebuilt as a clean shared script.
- Non-basic HTML pages had history boxes and calculate buttons removed.
- percentage-calculator.html and compound-interest-calculator.html had old inline calculator scripts removed.
- pc.js had old age-history observer/overlay blocks removed.
- style.css, pc.css, and phone.css received layout rules for pages without history boxes.

Basic Calculator:
- Basic Calculator keeps its history box.
- Basic Calculator keeps manual = calculation.

After upload:
- Replace your website files with the files inside this zip.
- Hard refresh with Ctrl + F5.
