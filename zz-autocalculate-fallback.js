
/* Targeted auto-calculate fallback for calculator pages */
(function(){
  'use strict';
  function id(x){return document.getElementById(x)}
  function num(x){var el=id(x); if(!el) return NaN; var n=Number(String(el.value||'').replace(/,/g,'')); return Number.isFinite(n)?n:NaN;}
  function val(x){var el=id(x); return el?String(el.value||''):'';}
  function money(n){return 'RM ' + Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function fmt(n,dec){if(!Number.isFinite(n)) return '-'; return Number(n).toLocaleString('en-MY',{maximumFractionDigits:dec==null?2:dec, minimumFractionDigits:0});}
  function out(el, title, main, rows){
    if(!el) return;
    if(!rows) rows=[];
    el.classList.add('calc-auto-result-card');
    el.innerHTML='<div class="result-title">'+title+'</div><div class="result-main">'+main+'</div>'+
      (rows.length?'<div class="result-grid">'+rows.map(function(r){return '<div class="result-item"><span class="result-label">'+r[0]+'</span><span class="result-value">'+r[1]+'</span></div>';}).join('')+'</div>':'');
  }
  function blank(el){ if(!el) return; el.classList.add('calc-auto-result-card'); el.innerHTML='<div class="calc-side-placeholder"><strong>Result preview</strong><span>Enter values to see the calculation here.</span></div>'; }
  var page=(location.pathname.split('/').pop()||'').toLowerCase();
  function calc(){
    var el;
    if(page==='percentage-calculator.html'){
      var p=num('percent'), n=num('number'); el=id('percentageResult'); if(Number.isFinite(p)&&Number.isFinite(n)) out(el,'Percentage result',fmt(p/100*n),[['Percentage',fmt(p)+'%'],['Number',fmt(n)]]); else blank(el);
    } else if(page==='discount-calculator.html'){
      var price=num('price'), disc=num('discount'); el=id('discountResult'); if(Number.isFinite(price)&&Number.isFinite(disc)){var save=price*disc/100, final=price-save; out(el,'Discount result',money(final),[['You save',money(save)],['Discount',fmt(disc)+'%']]);} else blank(el);
    } else if(page==='loan-calculator.html' || page==='personal-loan-calculator.html' || page==='mortgage-calculator.html'){
      var amount=num('amount'), rate=num('interest'), years=num('years'); el=id(page==='personal-loan-calculator.html'?'personalLoanResult':'loanResult'); if(Number.isFinite(amount)&&Number.isFinite(rate)&&Number.isFinite(years)&&years>0){var m=rate/100/12, months=years*12, pay=m? amount*m*Math.pow(1+m,months)/(Math.pow(1+m,months)-1):amount/months; out(el,'Loan result',money(pay),[['Total payment',money(pay*months)],['Total interest',money(pay*months-amount)]]);} else blank(el);
    } else if(page==='bmi-calculator.html'){
      var w=num('weight'), h=num('height'); el=id('bmiResult'); if(Number.isFinite(w)&&Number.isFinite(h)&&h>0){var bmi=w/Math.pow(h/100,2); var cat=bmi<18.5?'Underweight':bmi<25?'Normal':bmi<30?'Overweight':'Obese'; out(el,'BMI result',fmt(bmi,1),[['Category',cat],['Height',fmt(h)+' cm']]);} else blank(el);
    } else if(page==='age-calculator.html'){
      el=id('result'); var b=val('birthdate'); if(b){var dob=new Date(b), now=new Date(); if(!isNaN(dob)){var age=now.getFullYear()-dob.getFullYear(); var m=now.getMonth()-dob.getMonth(); if(m<0||(m===0&&now.getDate()<dob.getDate())) age--; out(el,'Age result',age+' years', [['Birth date', dob.toLocaleDateString()], ['Today', now.toLocaleDateString()]]);}} else blank(el);
    } else if(page==='compound-interest-calculator.html'){
      var principal=num('principal'), r=num('rate'), y=num('years'), f=num('frequency')||1; el=id('compoundResult'); if(Number.isFinite(principal)&&Number.isFinite(r)&&Number.isFinite(y)&&y>=0){var total=principal*Math.pow(1+(r/100)/f,f*y); out(el,'Compound result',money(total),[['Interest earned',money(total-principal)],['Frequency',fmt(f)+' / year']]);} else blank(el);
    } else if(page==='salary-calculator.html'){
      el=id('extraCalcResult'); var gross=num('salaryGross'), epf=num('salaryEpfRate'); if(!Number.isFinite(epf)) epf=11; var soc=num('salarySocso')||0, tax=num('salaryTax')||0, other=num('salaryOther')||0; if(Number.isFinite(gross)){var epfAmt=gross*epf/100, net=gross-epfAmt-soc-tax-other; out(el,'Salary result',money(net),[['EPF',money(epfAmt)],['Yearly net',money(net*12)]]);} else blank(el);
    } else if(page==='gaji-penjawat-awam-calculator.html'){
      el=id('extraCalcResult'); var basic=num('gajiBasic'), fixed=num('gajiFixedAllowance')||0, cola=num('gajiCola')||0, otherA=num('gajiOtherAllowance')||0, ded=num('gajiDeductions')||0; if(Number.isFinite(basic)){var g=basic+fixed+cola+otherA, net=g-ded; out(el,'Gaji result',money(net),[['Gross',money(g)],['Deductions',money(ded)]]);} else blank(el);
    } else if(page==='tax-calculator.html'){
      el=id('extraCalcResult'); var inc=num('taxAnnualIncome'), relief=num('taxRelief')||0, tr=num('taxRate'); if(Number.isFinite(inc)&&Number.isFinite(tr)){var taxable=Math.max(0,inc-relief), tax=taxable*tr/100; out(el,'Tax result',money(tax),[['Taxable income',money(taxable)],['Monthly estimate',money(tax/12)]]);} else blank(el);
    } else if(page==='currency-converter.html'){
      el=id('extraCalcResult'); var amt=num('currencyAmount'), cr=num('currencyRate'); if(Number.isFinite(amt)&&Number.isFinite(cr)){out(el,'Currency result',fmt(amt*cr),[['Amount',fmt(amt)],['Rate',fmt(cr,4)]]);} else blank(el);
    } else if(page==='inflation-calculator.html'){
      el=id('extraCalcResult'); var ia=num('inflationAmount'), ir=num('inflationRate'), iy=num('inflationYears'); if(Number.isFinite(ia)&&Number.isFinite(ir)&&Number.isFinite(iy)){var fv=ia*Math.pow(1+ir/100,iy); out(el,'Inflation result',money(fv),[['Increase',money(fv-ia)],['Years',fmt(iy)]]);} else blank(el);
    } else if(page==='rental-yield-calculator.html'){
      el=id('extraCalcResult'); var pp=num('rentalPropertyPrice'), rent=num('rentalMonthlyRent'), exp=num('rentalAnnualExpenses')||0; if(Number.isFinite(pp)&&Number.isFinite(rent)&&pp>0){var annual=rent*12, netY=(annual-exp)/pp*100; out(el,'Rental yield',fmt(netY,2)+'%',[['Annual rent',money(annual)],['Net income',money(annual-exp)]]);} else blank(el);
    } else if(page==='fuel-cost-calculator.html'){
      el=id('extraCalcResult'); var dist=num('fuelDistance'), eff=num('fuelEfficiency'), fp=num('fuelPrice'), people=num('fuelPeople')||1; if(Number.isFinite(dist)&&Number.isFinite(eff)&&Number.isFinite(fp)){var cost=dist/100*eff*fp; out(el,'Fuel cost',money(cost),[['Fuel used',fmt(dist/100*eff,2)+' L'],['Per person',money(cost/people)]]);} else blank(el);
    } else if(page==='unit-converter-calculator.html'){
      el=id('extraCalcResult'); var uv=num('unitValue'), type=val('unitType'), from=val('unitFrom'), to=val('unitTo'); var result=NaN;
      var length={m:1,km:1000,cm:.01,mm:.001,mile:1609.344,ft:.3048,in:.0254}; var weight={kg:1,g:.001,lb:.45359237,oz:.0283495}; var volume={l:1,ml:.001,gal:3.78541};
      var map= type==='weight'?weight:type==='volume'?volume:length;
      if(type==='temperature'){ if(from===to) result=uv; else if(from==='c'&&to==='f') result=uv*9/5+32; else if(from==='f'&&to==='c') result=(uv-32)*5/9; }
      else if(map[from]&&map[to]) result=uv*map[from]/map[to];
      if(Number.isFinite(uv)&&Number.isFinite(result)) out(el,'Conversion result',fmt(result,4),[['From',from||'-'],['To',to||'-']]); else blank(el);
    } else if(page==='debt-payoff-calculator.html' || page==='credit-card-payoff-calculator.html' || page==='credit-card-interest-calculator.html' || page==='loan-comparison-calculator.html'){
      // Keep existing page formulas if present; show a preview box instead of empty space.
      el=id('extraCalcResult'); if(el && !el.textContent.trim()) blank(el);
    }
  }
  function install(){ document.addEventListener('input', function(e){ if(e.target && /INPUT|SELECT/.test(e.target.tagName)) setTimeout(calc, 20); }, true); document.addEventListener('change', function(e){ if(e.target && /INPUT|SELECT/.test(e.target.tagName)) setTimeout(calc, 20); }, true); setTimeout(calc,100); setTimeout(calc,600); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
