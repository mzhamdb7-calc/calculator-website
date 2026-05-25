Auto-count cleanup update

What was changed:
1. Removed calculate buttons from every calculator page except basic-calculator.html.
2. Removed old inline Percentage and Compound calculator scripts that overwrote the newer shared script.js functions.
3. Removed the older AUTO CALCULATE overlay block from script.js.
4. Added one final auto-calculate controller for all non-basic calculators.
5. Added fallback setup so Compound additional-money fields and Loan early-settlement fields still work without calculate buttons.
6. Added small PC/phone CSS safeguards to hide any calculate buttons dynamically added later.

How to use:
- Replace your current site files with this folder's files.
- Refresh the browser with Ctrl + F5.
- Basic calculator still uses the = button.
- Age, BMI, mortgage/personal loan, discount, percentage, and compound interest now calculate automatically when inputs change.
