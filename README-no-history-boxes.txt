No-history calculator update

What changed:
- Basic Calculator history box stays.
- Age, BMI, Mortgage / Personal Loan, Discount, Percentage, and Compound Interest history boxes were removed from the HTML.
- Added a JavaScript safety fallback that removes any non-basic history box from the DOM if an older page still contains one.
- No CSS display:none hiding is used for these history boxes.
- Added layout fixes so the calculator/result area does not keep an empty history column.

Use:
1. Back up your current website folder.
2. Replace your files with the files in this zip.
3. Refresh with Ctrl + F5.

Important:
- Existing saved history in localStorage is not deleted automatically, but the boxes no longer exist on non-basic calculator pages.
- Basic Calculator history remains unchanged.
