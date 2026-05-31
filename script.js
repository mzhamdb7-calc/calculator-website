<<<<<<< HEAD
!function(){"use strict";const REPORT_TYPES=["age","bmi","loan","personalLoan","discount","percentage","compound"];let autoTimer=null,autoRunning=!1;function $(selector,root){return(root||document).querySelector(selector)}function $$(selector,root){return Array.from((root||document).querySelectorAll(selector))}function byId(id){return document.getElementById(id)}function has(id){return!!byId(id)}function cleanText(value){return String(value||"").replace(/\s+/g," ").trim()}function lower(value){return cleanText(value).toLowerCase()}function pathText(){return lower(window.location.pathname)}function safeGet(key,fallback){try{const value=localStorage.getItem(key);return null===value?fallback:value}catch{return fallback}}function safeSet(key,value){try{localStorage.setItem(key,value)}catch{}}function safeRemove(key){try{localStorage.removeItem(key)}catch{}}function loadArray(key){try{const value=JSON.parse(safeGet(key,"[]"));return Array.isArray(value)?value:[]}catch{return[]}}function saveArray(key,value){safeSet(key,JSON.stringify(value.slice(-50)))}function numberFromString(value){const number=Number(String(value||"").replace(/,/g,"").trim());return Number.isFinite(number)?number:NaN}function numberValue(id){const input=byId(id);return input?numberFromString(input.value):NaN}function stringValue(id){const input=byId(id);return input?String(input.value||"").trim():""}function firstInput(ids){for(const id of ids){const input=byId(id);if(input)return input}return null}function firstValue(ids){for(const id of ids){const value=stringValue(id);if(value)return value}return""}function firstNumber(ids){for(const id of ids){const value=numberValue(id);if(Number.isFinite(value))return value}return NaN}function money(value){return Number(value).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}function moneyRM(value){const number=numberFromString(value);return Number.isFinite(number)?"RM "+money(number):value||"-"}function escapeHtml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}function getPageType(){const title=function(){const h1=$("h1");return lower(h1?h1.textContent:"")}(),path=pathText();return has("display")||$(".basic-grid")||$(".scientific-grid")||path.includes("basic-calculator")||/^basic\b/.test(title)?"basic":path.includes("bmi")||has("bmiHistoryList")||/\bbmi\b/.test(title)?"bmi":path.includes("personal-loan")||has("personalLoanHistoryList")||has("personalLoanResult")||/\bpersonal\s+loan\b/.test(title)?"personalLoan":path.includes("loan")||path.includes("mortgage")||has("loanHistoryList")||has("loanResult")||/\bmortgage\b|\bloan\b/.test(title)?"loan":path.includes("discount")||has("discountHistoryList")||/\bdiscount\b/.test(title)?"discount":path.includes("percentage")||has("percentageHistoryList")||/\bpercentage\b/.test(title)?"percentage":path.includes("compound")||has("compoundHistoryList")||/\bcompound\b/.test(title)?"compound":path.includes("age-calculator")||has("birthdate")||has("ageHistoryList")||/^age\b|\bage calculator\b/.test(title)?"age":""}function isReportType(type){return REPORT_TYPES.includes(type)}let basicHistory=loadArray("basicEquationHistory"),basicCalculationHistory=loadArray("basicCalculationHistory"),lastAnswer=Number(safeGet("lastAnswer","0"))||0,lastBasicEquation="";function getDisplay(){return byId("display")}function clearError(display){display&&"Error"===display.value&&(display.value="")}function add(value){const display=getDisplay();if(!display)return;clearError(display);const operators=["+","-","*","/"],lastChar=display.value.slice(-1);"Ans"!==value?"%"!==value?!operators.includes(value)||!operators.includes(lastChar)||"-"===value&&"-"!==lastChar?display.value+=value:display.value=display.value.slice(0,-1)+value:display.value+="/100":display.value+=String(lastAnswer)}function clearDisplay(){const display=getDisplay();display&&(display.value="")}function removeLast(){const display=getDisplay();display&&("Error"!==display.value?display.value=display.value.slice(0,-1):display.value="")}const functionMap={sin:"Math.sin(",cos:"Math.cos(",tan:"Math.tan(",log:"Math.log10(",ln:"Math.log(",sqrt:"√("};function addFunction(func){const display=getDisplay();if(!display)return;clearError(display);const functionText=functionMap[func];functionText&&(/[0-9.)]$/.test(display.value)?display.value+="*"+functionText:display.value+=functionText)}function addPower(){const display=getDisplay();display&&(clearError(display),display.value+="**")}function closeOpenBrackets(expression){const open=(expression.match(/\(/g)||[]).length,close=(expression.match(/\)/g)||[]).length;return open>close?expression+")".repeat(open-close):expression}function removeBasicExternalResultBox(){const panel=byId("universalLoanStyleOutput");panel&&(panel.hidden=!0,panel.innerHTML="",panel.style.setProperty("display","none","important"),panel.setAttribute("aria-hidden","true"))}function renderBasicInlineResult(expression,answer){if("basic"!==getPageType())return;const box=function(){if("basic"!==getPageType())return null;let box=byId("basicInlineResult");if(box)return box;const calculator=getMainCalculator();if(!calculator)return null;const displayRow=$(".display-row",calculator);return box=document.createElement("div"),box.id="basicInlineResult",box.className="basic-inline-result",box.setAttribute("aria-live","polite"),displayRow?displayRow.insertAdjacentElement("beforebegin",box):calculator.appendChild(box),box}();if(!box)return;basicCalculationHistory=loadArray("basicCalculationHistory");const latest=expression&&answer?{expression:expression,result:answer}:basicCalculationHistory[basicCalculationHistory.length-1]||null;if(!latest||!cleanText(latest.expression)||!cleanText(latest.result))return box.innerHTML='<div class="basic-inline-kicker">Previous calculation</div><div class="basic-inline-empty">Your previous input and answer will appear here after you press =.</div>',box.classList.remove("has-basic-inline-result"),void removeBasicExternalResultBox();box.classList.add("has-basic-inline-result"),box.innerHTML='<div class="basic-inline-header"><span class="basic-inline-kicker">Previous calculation</span></div><div class="basic-inline-grid"><div class="basic-inline-item basic-inline-input-item"><span class="basic-inline-label">Input</span><strong class="basic-inline-expression">'+escapeHtml(latest.expression)+'</strong></div><div class="basic-inline-item basic-inline-output-item"><span class="basic-inline-label">Output</span><strong class="basic-inline-answer">'+escapeHtml(latest.result)+"</strong></div></div>",removeBasicExternalResultBox()}function calculate(){const display=getDisplay();if(display)try{let displayExpression=cleanText(display.value).replace(/Math\.sqrt\s*\(/gi,"√(").replace(/\bsqrt\s*\(/gi,"√(");if(!displayExpression||"Error"===displayExpression)return;display.value!==displayExpression&&(display.value=displayExpression),lastBasicEquation=displayExpression;let expression=displayExpression.replace(/√\s*\(/g,"Math.sqrt(").replace(/(\d)(Math\.)/g,"$1*$2").replace(/\)(Math\.)/g,")*$1");if(expression=closeOpenBrackets(expression),!function(expression){if(!/^[0-9+\-*/().,\sA-Za-z]+$/.test(expression))return!1;const words=expression.match(/[A-Za-z]+/g)||[],allowedWords=new Set(["Math","sin","cos","tan","log","log10","sqrt","PI","E"]);return words.every(function(word){return allowedWords.has(word)})}(expression))return void(display.value="Error");const result=Function('"use strict"; return ('+expression+")")();if("number"!=typeof result||!Number.isFinite(result))return void(display.value="Error");const cleanResult=Number.isInteger(result)?result:Number(result.toPrecision(12));display.value=String(cleanResult),lastAnswer=cleanResult,safeSet("lastAnswer",String(lastAnswer)),function(equation,answer){const value=cleanText(equation),resultValue=cleanText(answer);if(value&&"Error"!==value){if(basicHistory[basicHistory.length-1]!==value&&(basicHistory.push(value),basicHistory=basicHistory.slice(-50),saveArray("basicEquationHistory",basicHistory)),resultValue&&"Error"!==resultValue){const latest=basicCalculationHistory[basicCalculationHistory.length-1]||{};latest.expression===value&&latest.result===resultValue||(basicCalculationHistory.push({expression:value,result:resultValue,createdAt:(new Date).toISOString()}),basicCalculationHistory=basicCalculationHistory.slice(-50),saveArray("basicCalculationHistory",basicCalculationHistory))}renderBasicInlineResult(value,resultValue),showHistory()}}(lastBasicEquation,cleanResult),function(){if("basic"!==getPageType())return;const display=getDisplay(),answer=display?cleanText(display.value):"";if(!answer||"Error"===answer)return void removeBasicExternalResultBox();renderBasicInlineResult(lastBasicEquation,answer),removeBasicExternalResultBox()}()}catch{display.value="Error"}}function showHistory(){const list=byId("historyList");if(!list)return;const title=$(".history h3");title&&(title.textContent="History"),basicHistory=loadArray("basicEquationHistory"),list.innerHTML="",basicHistory.slice().reverse().forEach(function(equation){const li=document.createElement("li");li.className="history-item basic-equation-history-item";const text=document.createElement("span");text.className="history-text",text.textContent="Eq: "+equation;const copyBtn=document.createElement("button");copyBtn.type="button",copyBtn.className="history-copy-btn",copyBtn.textContent="copy",copyBtn.addEventListener("click",function(event){event.stopPropagation(),copyText(equation,copyBtn)}),li.appendChild(text),li.appendChild(copyBtn),list.appendChild(li)})}function flashButton(buttonText){const wanted=String(buttonText).trim().toUpperCase();$$(".buttons button, .ans-btn").forEach(function(button){button.textContent.trim().toUpperCase()===wanted&&(button.classList.add("keyboard-active"),setTimeout(function(){button.classList.remove("keyboard-active")},150))})}function getOutputPanelId(type){return"basic"===type?"universalLoanStyleOutput":"loan"===type?"loanExternalOutput":"personalLoan"===type?"personalLoanExternalOutput":type+"ReportOutput"}function getMainCalculator(){const main=$("main.pc-calculator-layout")||$("main");return main?$(".calculator",main):null}function getOrCreateOutputPanel(type){const calculator=getMainCalculator();if(!calculator)return null;const id=getOutputPanelId(type);let panel=byId(id);return panel||(panel=document.createElement("section"),panel.id=id,panel.className="loan-style-output-panel calculator-clean-result",panel.setAttribute("aria-label","Calculator result"),calculator.insertAdjacentElement("afterend",panel)),panel}function makeAgeResultGroups(rows){rows=Array.isArray(rows)?rows:[];const used=new Set;function rowLabel(row){return String((Array.isArray(row)?row[0]:row.label)||"")}function makeGroup(group,groupRows){return groupRows.length?'<section class="age-result-group-box age-result-group-'+group.key+'"><h3>'+escapeHtml(group.title)+'</h3><ul class="age-point-result-list">'+groupRows.map(function(row){return"<li><strong>"+escapeHtml(rowLabel(row))+":</strong> <span>"+escapeHtml(function(row){return String((Array.isArray(row)?row[1]:row.value)||"")}(row))+"</span></li>"}).join("")+"</ul></section>":""}let html=[{key:"birth",title:"Birth & calendar",match:/name|date range|day of week born|born date in islamic|born date in chinese/i},{key:"age",title:"Current age",match:/exact age|normal age|asian age|age in .* year|months old|weeks old|days old|seconds old/i},{key:"milestone",title:"Birthday & milestones",match:/next birthday countdown|next age live countdown|seconds to next age|retirement|legal age|leap year age/i},{key:"life",title:"Life summary",match:/days spent alive|estimated sleep time|breaths taken|heartbeats lived/i},{key:"zodiac",title:"Zodiac",match:/western zodiac|chinese zodiac/i},{key:"history",title:"Famous birthdays & historical event",match:/famous person|famous celebrity|famous sports star|famous historical figure|historical event/i},{key:"space",title:"Space & moon",match:/age on other planets|moon cycles experienced/i}].map(function(group){const groupRows=rows.filter(function(row,index){return!(!row||used.has(index))&&(!!group.match.test(rowLabel(row))&&(used.add(index),!0))});return makeGroup(group,groupRows)}).join("");const otherRows=rows.filter(function(row,index){return row&&!used.has(index)});return otherRows.length&&(html+=makeGroup({key:"other",title:"Other details"},otherRows)),'<div class="age-result-group-grid">'+html+"</div>"}function rowsToPlainText(rows){return rows.map(function(row){return row[0]+": "+row[1]}).join("\n")}function hideNativeResultElements(type){["result","ageResult","bmiResult","loanResult","personalLoanResult","discountResult","percentageResult","compoundResult"].forEach(function(id){const element=byId(id);element&&(element.style.display="none")})}function downloadTextFile(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download=filename,document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},500)}function dateFileStamp(){const now=new Date;return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")}function renderResultPanel(type,rows,extraTopHtml){if(document.body.classList.contains("calculator-report-view"))return null;const panel=getOrCreateOutputPanel(type);if(!panel)return null;const isAgeResult="age"===type,isBmiResult="bmi"===type,resultHtml=isAgeResult?function(rows){return'<div class="age-point-result-box">'+makeAgeResultGroups(rows)+"</div>"}(rows):isBmiResult?function(rows){function rowLabel(row){return String((Array.isArray(row)?row[0]:row.label)||"")}function rowValue(row){return String((Array.isArray(row)?row[1]:row.value)||"")}function findRow(pattern){return rows.find(function(row){return pattern.test(rowLabel(row))})}rows=Array.isArray(rows)?rows:[];const bmiRow=findRow(/^BMI$/i),categoryRow=findRow(/^BMI category$/i),differenceRow=findRow(/^Difference to healthy range$/i);function makeSummaryCard(row,fallbackLabel,className){return row?'<section class="bmi-summary-card '+className+'"><div class="bmi-summary-card-label">'+escapeHtml(fallbackLabel||rowLabel(row))+'</div><div class="bmi-summary-card-value">'+escapeHtml(rowValue(row))+"</div></section>":""}const bmiValue=bmiRow?rowValue(bmiRow):"",categoryValue=categoryRow?rowValue(categoryRow):"",mainResultText=bmiValue?'<div class="bmi-main-result-text"><span class="bmi-main-result-label">Your BMI result</span><strong>'+escapeHtml(bmiValue)+"</strong>"+(categoryValue?"<small>"+escapeHtml(categoryValue)+"</small>":"")+"</div>":"",summaryHtml='<div class="bmi-summary-card-grid" aria-label="BMI result summary">'+makeSummaryCard(bmiRow,"BMI","bmi-summary-bmi")+makeSummaryCard(categoryRow,"BMI Category","bmi-summary-category")+makeSummaryCard(differenceRow,"Difference to healthy range","bmi-summary-difference")+"</div>",highlightPatterns=[/^BMI$/i,/^BMI category$/i,/^Difference to healthy range$/i],groups=[{key:"health",title:"Health overview",match:/Healthy weight range|Health risk|Waist-to-height ratio|Waist-to-height status|Neck circumference|Wrist size|Shoulder width|Hip circumference/i},{key:"calorie",title:"Calories & body fat",match:/Calories\/day|Body fat estimate|Body type comment|Frame size|Fat distribution|Body shape|Somatotype tendency|Suggested exercise|Suggested foods|Physique \/ body type/i},{key:"goal",title:"Goal timeline",match:/Goal timeline|Healthy\?|Best|Target weight|Time goal/i},{key:"profile",title:"Profile used",match:/Unit|Name|Age range|Gender|Activity level/i}],used=new Set;function makeGroup(group,groupRows){return groupRows.length?'<section class="bmi-result-group-box bmi-result-group-'+group.key+'"><h3>'+escapeHtml(group.title)+'</h3><ul class="bmi-point-result-list">'+groupRows.map(function(row){return"<li><strong>"+escapeHtml(rowLabel(row))+":</strong> <span>"+escapeHtml(rowValue(row))+"</span></li>"}).join("")+"</ul></section>":""}const groupHtml=groups.map(function(group){const groupRows=rows.filter(function(row,index){return!(!row||used.has(index))&&(!highlightPatterns.some(function(pattern){return pattern.test(rowLabel(row))})&&(!!group.match.test(rowLabel(row))&&(used.add(index),!0)))});return makeGroup(group,groupRows)}).join(""),otherRows=rows.filter(function(row,index){return!(!row||used.has(index))&&!highlightPatterns.some(function(pattern){return pattern.test(rowLabel(row))})}),otherHtml=otherRows.length?makeGroup({key:"other",title:"Other details"},otherRows):"";return'<div class="bmi-result-box bmi-result-box-card-form">'+mainResultText+summaryHtml+'<div class="bmi-result-group-grid">'+groupHtml+otherHtml+"</div></div>"}(rows):function(rows){return'<div class="loan-result-table-scroll"><table class="loan-result-table universal-loan-result-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>'+rows.map(function(row){return"<tr><td>"+escapeHtml(row[0])+"</td><td>"+escapeHtml(row[1])+"</td></tr>"}).join("")+"</tbody></table></div>"}(rows);if(panel.className="loan-style-output-panel calculator-clean-result "+type+"-clean-result"+(isAgeResult?" age-point-output":"")+(isBmiResult?" bmi-box-output":""),panel.innerHTML=isAgeResult?'<div class="loan-output-top age-result-shell"><div class="loan-result-panel age-result-main-box">'+(extraTopHtml||"")+'<div class="loan-result-body age-result-body">'+resultHtml+'</div><div class="age-result-actions"><button type="button" class="age-result-action-btn age-copy-btn">Copy</button><button type="button" class="age-result-action-btn age-save-btn">Save</button><button type="button" class="age-result-action-btn age-share-btn">Share</button><button type="button" class="age-result-action-btn age-report-btn">Report</button></div></div></div>':isBmiResult?'<div class="loan-output-top bmi-result-shell"><div class="loan-result-panel bmi-result-main-box"><div class="loan-result-body bmi-result-body">'+resultHtml+'</div><div class="bmi-result-actions"><button type="button" class="bmi-result-action-btn bmi-copy-btn">Copy</button><button type="button" class="bmi-result-action-btn bmi-save-btn">Save</button><button type="button" class="bmi-result-action-btn bmi-share-btn">Share</button><button type="button" class="bmi-result-action-btn bmi-report-btn">Report</button></div></div></div>':'<div class="loan-output-top universal-result-shell"><div class="loan-result-panel universal-result-main-box">'+(extraTopHtml?'<div class="universal-result-summary-wrap">'+extraTopHtml+"</div>":"")+'<div class="loan-result-body">'+resultHtml+'</div><div class="universal-result-actions"><button type="button" class="universal-result-action-btn loan-copy-btn">Copy</button><button type="button" class="universal-result-action-btn loan-save-btn">Save</button><button type="button" class="universal-result-action-btn loan-share-btn">Share</button><button type="button" class="universal-result-action-btn loan-report-btn">Report</button></div></div></div>',panel.hidden=!1,panel.style.setProperty("display","block","important"),panel.style.setProperty("visibility","visible","important"),isAgeResult){const ageText=rowsToPlainText(rows),copyBtn=panel.querySelector(".age-copy-btn"),saveBtn=panel.querySelector(".age-save-btn"),shareBtn=panel.querySelector(".age-share-btn"),reportBtn=panel.querySelector(".age-report-btn");copyBtn&&(copyBtn.onclick=function(){copyText(ageText,copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile("age-result-"+dateFileStamp()+".txt","Age Calculator Result\n\n"+ageText),setButtonState(saveBtn,"Saved!")}),shareBtn&&(shareBtn.onclick=function(){const shareData={title:"Age Calculator Result",text:ageText};navigator.share?navigator.share(shareData).catch(function(){copyText(ageText,shareBtn)}):copyText(ageText,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport("age",reportBtn)})}else if(isBmiResult){const bmiText=rowsToPlainText(rows),copyBtn=panel.querySelector(".bmi-copy-btn"),saveBtn=panel.querySelector(".bmi-save-btn"),shareBtn=panel.querySelector(".bmi-share-btn"),reportBtn=panel.querySelector(".bmi-report-btn");copyBtn&&(copyBtn.onclick=function(){copyText(bmiText,copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile("bmi-result-"+dateFileStamp()+".txt","BMI Calculator Result\n\n"+bmiText),setButtonState(saveBtn,"Saved!")}),shareBtn&&(shareBtn.onclick=function(){const shareData={title:"BMI Calculator Result",text:bmiText};navigator.share?navigator.share(shareData).catch(function(){copyText(bmiText,shareBtn)}):copyText(bmiText,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport("bmi",reportBtn)})}else{const resultText=rowsToPlainText(rows),copyBtn=panel.querySelector(".loan-copy-btn"),saveBtn=panel.querySelector(".loan-save-btn"),shareBtn=panel.querySelector(".loan-share-btn"),reportBtn=panel.querySelector(".loan-report-btn");copyBtn&&(copyBtn.onclick=function(){!function(table,button){if(!table)return;copyText(Array.from(table.querySelectorAll("tr")).map(function(row){return Array.from(row.querySelectorAll("th, td")).map(function(cell){return cleanText(cell.textContent)}).join("\t")}).join("\n"),button)}(panel.querySelector("table"),copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile(type+"-result-"+dateFileStamp()+".txt",resultText),setButtonState(saveBtn,"Saved!")}),shareBtn&&(shareBtn.onclick=function(){const shareData={title:"Calculator Result",text:resultText};navigator.share?navigator.share(shareData).catch(function(){copyText(resultText,shareBtn)}):copyText(resultText,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport(type,reportBtn)})}return hideNativeResultElements(),panel}function getInputLabel(input){if(!input)return"Input";if(input.id){const label=$('label[for="'+input.id+'"]');if(label)return cleanText(label.textContent.replace(/[:：]/g,""))}const previous=input.previousElementSibling;return previous&&"label"===lower(previous.tagName)?cleanText(previous.textContent.replace(/[:：]/g,"")):cleanText(input.getAttribute("aria-label")||input.placeholder||input.name||input.id||"Input")}function getFilledInputs(){const lines=[],used=new Set;return $$(".calculator input, .calculator select, .calculator textarea, .optional-mortgage-costs input, .optional-mortgage-costs select, .early-settlement-box input, .early-settlement-box select, .bmi-input-groups input, .bmi-input-groups select").forEach(function(input){if(!input)return;if(["hidden","button","submit","reset"].includes(input.type))return;if("display"===input.id)return;const key=input.id||input.name||getInputLabel(input);if(used.has(key))return;used.add(key);const value=function(input){if(!input)return"";if("select"===lower(input.tagName)){const option=input.options[input.selectedIndex];return cleanText(option?option.textContent:input.value)}return cleanText(input.value)}(input);value&&lines.push({label:getInputLabel(input),value:value})}),lines}function reportKey(type){return"calculatorReports_v5_"+type}function loadReports(type){return loadArray(reportKey(type))}function saveReports(type,reports){saveArray(reportKey(type),reports)}function shortReportLabel(type,report){const lines=report.inputLines||[];function find(pattern){const line=lines.find(function(item){return pattern.test(item.label||"")});return line?line.value:""}return"age"===type?"Birthdate: "+(find(/birth/i)||"-"):"bmi"===type?"BMI: "+(report.metrics&&report.metrics.bmi||"report"):"loan"===type?"Mortgage amount: "+moneyRM(find(/loan amount|purchase price|amount/i)):"personalLoan"===type?"Loan amount: "+moneyRM(find(/loan amount|amount/i)):"discount"===type?"Price: "+moneyRM(find(/price|amount/i)):"percentage"===type?(find(/percentage|percent/i)||"-")+" of "+(find(/number|amount|value/i)||"-"):"compound"===type?"Principal: "+moneyRM(find(/principal|amount/i)):"Report"}function reportSignature(report){return JSON.stringify({inputs:report.inputLines,result:report.resultText})}function saveCurrentReport(type,metrics){if(!isReportType(type))return;metrics=metrics||{};const resultHtml=function(type){const panel=byId(getOutputPanelId(type));if(!panel||panel.hidden)return"";const clone=panel.cloneNode(!0);return clone.querySelectorAll("script, iframe, object, embed, link, meta, button, a, .loan-copy-side, .loan-graph-copy-side, .calculator-report-actions").forEach(function(element){element.remove()}),clone.innerHTML||clone.outerHTML||""}(type),resultText=function(type){const panel=byId(getOutputPanelId(type));return panel&&!panel.hidden?cleanText(panel.innerText||panel.textContent||""):""}(type);if(!resultHtml||!resultText)return;const report={type:type,id:type+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),createdAt:(new Date).toLocaleString(),inputLines:getFilledInputs(),resultLines:Array.isArray(metrics.resultRows)?metrics.resultRows:[],resultHtml:resultHtml,resultText:resultText,metrics:metrics||{}};report.label=shortReportLabel(type,report);const reports=loadReports(type),last=reports[reports.length-1];if(last&&JSON.stringify(last.inputLines||[])===JSON.stringify(report.inputLines||[]))return reports[reports.length-1]=report,saveReports(type,reports),void renderReportHistory(type);last&&reportSignature(last)===reportSignature(report)||(reports.push(report),saveReports(type,reports)),renderReportHistory(type)}function reportHref(report){return window.location.href.split("#")[0]+"#calc-report="+function(text){const bytes=(new TextEncoder).encode(text);let binary="";return bytes.forEach(function(byte){binary+=String.fromCharCode(byte)}),btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}(JSON.stringify(report))}function renderReportHistory(type){if(!isReportType(type))return;const list=function(type){return byId({age:"ageHistoryList",bmi:"bmiHistoryList",loan:"loanHistoryList",personalLoan:"personalLoanHistoryList",discount:"discountHistoryList",percentage:"percentageHistoryList",compound:"compoundHistoryList"}[type])}(type);if(!list)return;const box=list.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box"),title=box?$("h3",box):null;title&&(title.textContent="History"),list.innerHTML="",loadReports(type).slice().reverse().forEach(function(report){const li=document.createElement("li");li.className="history-item calculator-report-history-item";const text=document.createElement("span");text.className="history-text calculator-report-history-label",text.textContent=report.label||shortReportLabel(type,report);const link=document.createElement("a");link.className="calculator-report-open-link mortgage-fast-open-link",link.textContent="open report",link.href=reportHref(report),link.target="_self",link.rel="",li.appendChild(text),li.appendChild(link),list.appendChild(li)})}function clearReports(type){safeRemove(reportKey(type)),renderReportHistory(type);const panel=byId(getOutputPanelId(type));panel&&(panel.hidden=!0)}function todayValueISO(){const today=new Date;return today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0")}function formatDateDMY(value){const parts=String(value||"").split("-");return 3===parts.length?parts[2]+"/"+parts[1]+"/"+parts[0]:value||""}function parseDateInput(value,endOfToday){if(!value)return null;const parts=String(value).split("-").map(Number);if(3!==parts.length||parts.some(function(part){return!Number.isFinite(part)}))return null;const date=new Date(parts[0],parts[1]-1,parts[2],0,0,0,0);if(endOfToday&&value===todayValueISO()){const now=new Date;date.setHours(now.getHours(),now.getMinutes(),now.getSeconds(),now.getMilliseconds())}return date}function ensureAgeNameInput(){const birthdateInput=byId("birthdate");if(!birthdateInput||byId("ageName"))return;const label=document.createElement("label");label.setAttribute("for","ageName"),label.textContent="Name (optional):";const input=document.createElement("input");input.type="text",input.id="ageName",input.placeholder="Optional",input.setAttribute("autocomplete","name"),birthdateInput.insertAdjacentElement("beforebegin",input),input.insertAdjacentElement("beforebegin",label)}function ensureAgeTargetDateInput(){const birthdateInput=byId("birthdate");if(!birthdateInput)return null;let targetInput=byId("dateToCalculate");if(!targetInput){const label=document.createElement("label");label.setAttribute("for","dateToCalculate"),label.textContent="Calculation date:",targetInput=document.createElement("input"),targetInput.type="date",targetInput.id="dateToCalculate",targetInput.setAttribute("aria-label","Calculation date"),birthdateInput.insertAdjacentElement("afterend",targetInput),targetInput.insertAdjacentElement("beforebegin",label)}return targetInput.value||(targetInput.value=todayValueISO()),targetInput}function calendarAgeBreakdown(birthDate,targetDate){if(!birthDate||!targetDate||birthDate>targetDate)return null;let years=targetDate.getFullYear()-birthDate.getFullYear(),months=targetDate.getMonth()-birthDate.getMonth(),days=targetDate.getDate()-birthDate.getDate(),hours=targetDate.getHours()-birthDate.getHours(),minutes=targetDate.getMinutes()-birthDate.getMinutes();if(minutes<0&&(minutes+=60,hours-=1),hours<0&&(hours+=24,days-=1),days<0){days+=new Date(targetDate.getFullYear(),targetDate.getMonth(),0).getDate(),months-=1}return months<0&&(months+=12,years-=1),{years:years,months:months,days:days,hours:hours,minutes:minutes}}function nextBirthdayCountdown(birthDate){if(!birthDate)return"-";const now=new Date;let next=new Date(now.getFullYear(),birthDate.getMonth(),birthDate.getDate(),0,0,0,0);1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(next.getFullYear())||(next=new Date(now.getFullYear(),2,1,0,0,0,0)),next<now&&(next=new Date(now.getFullYear()+1,birthDate.getMonth(),birthDate.getDate(),0,0,0,0),1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(next.getFullYear())||(next=new Date(now.getFullYear()+1,2,1,0,0,0,0)));const diffMs=Math.max(0,next-now),totalMinutes=Math.floor(diffMs/6e4);return Math.floor(totalMinutes/1440)+" days, "+Math.floor(totalMinutes%1440/60)+" hours, "+totalMinutes%60+" minutes"}function isLeapYear(year){return year%4==0&&year%100!=0||year%400==0}function westernZodiac(month,day){const signs=[["Capricorn",1,19],["Aquarius",2,18],["Pisces",3,20],["Aries",4,19],["Taurus",5,20],["Gemini",6,20],["Cancer",7,22],["Leo",8,22],["Virgo",9,22],["Libra",10,22],["Scorpio",11,21],["Sagittarius",12,21]];for(const item of signs)if(month<item[1]||month===item[1]&&day<=item[2])return item[0];return"Capricorn"}function compactDuration(parts){if(!parts)return"-";return[[parts.years,"year"],[parts.months,"month"],[parts.days,"day"]].filter(function(item){return Number(item[0])>0}).map(function(item){return item[0]+" "+item[1]+(1===item[0]?"":"s")}).join(", ")||"0 days"}function countdownToAge(birthDate,targetDate,ageYears,label){if(!birthDate||!targetDate)return"-";const milestoneDate=new Date(birthDate.getFullYear()+ageYears,birthDate.getMonth(),birthDate.getDate(),birthDate.getHours(),birthDate.getMinutes(),birthDate.getSeconds(),birthDate.getMilliseconds());return 1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(milestoneDate.getFullYear())||milestoneDate.setMonth(2,1),targetDate<milestoneDate?compactDuration(calendarAgeBreakdown(targetDate,milestoneDate))+" before "+label+" (age "+ageYears+")":label+" reached "+compactDuration(calendarAgeBreakdown(milestoneDate,targetDate))+" ago"}function estimatedSleepText(totalDays){const sleepDays=Math.floor(totalDays/3),years=Math.floor(sleepDays/365.2425);return years+" years, "+Math.floor(sleepDays-365.2425*years)+" days (estimated 8 hours/day)"}function moonCycleText(totalDays){return(totalDays/29.530588853).toFixed(1)+" lunar cycles"}function formatLargeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.round(number).toLocaleString("en-US"):"-"}function estimatedHeartbeatsText(totalSeconds){return formatLargeNumber(totalSeconds/60*70)+" heartbeats (estimated 70 bpm)"}function birthdayForYear(birthDate,year){let birthday=new Date(year,birthDate.getMonth(),birthDate.getDate(),birthDate.getHours(),birthDate.getMinutes(),birthDate.getSeconds(),birthDate.getMilliseconds());return 1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(year)||(birthday=new Date(year,2,1,birthDate.getHours(),birthDate.getMinutes(),birthDate.getSeconds(),birthDate.getMilliseconds())),birthday}function nextAgeCountdownData(birthDate){if(!birthDate)return null;const now=new Date;let upcomingAge=now.getFullYear()-birthDate.getFullYear(),next=birthdayForYear(birthDate,birthDate.getFullYear()+upcomingAge);next<=now&&(upcomingAge+=1,next=birthdayForYear(birthDate,birthDate.getFullYear()+upcomingAge));return{upcomingAge:upcomingAge,seconds:Math.max(0,Math.floor((next.getTime()-now.getTime())/1e3)),nextDate:next}}function ageLiveCountdownHtml(birthdateValue){return'<div class="age-live-countdown" data-birthdate="'+escapeHtml(String(birthdateValue||""))+'"><span class="age-live-countdown-line"><strong data-age-countdown-line>-- second to -- years old</strong></span></div>'}let ageLiveCountdownTimer=null;function updateAgeLiveCountdowns(){$$(".age-live-countdown[data-birthdate]").forEach(function(box){const data=nextAgeCountdownData(parseDateInput(box.getAttribute("data-birthdate"),!1));if(!data)return;const lineEl=box.querySelector("[data-age-countdown-line]");lineEl&&(lineEl.textContent=formatLargeNumber(data.seconds)+" second to "+data.upcomingAge+" years old")})}function startAgeLiveCountdown(){updateAgeLiveCountdowns(),ageLiveCountdownTimer||(ageLiveCountdownTimer=setInterval(updateAgeLiveCountdowns,1e3))}function extractBirthPersonName(item){if(!item)return"";if(Array.isArray(item.pages)&&item.pages.length){const page=item.pages[0];if(page.normalizedtitle)return page.normalizedtitle;if(page.title)return String(page.title).replace(/_/g," ")}return String(item.text||"").split(",")[0].replace(/^\d+\s*[–-]\s*/,"").trim()}function famousDescription(item){return String(item&&item.text||"").toLowerCase()}function pickFamousBirthdayPeople(items){items=Array.isArray(items)?items:[];const blockedReligionPattern=/hindu|hinduism|buddhist|buddhism|sikh|sikhism|jain|jainism|shinto|taoist|taoism|zoroastrian|zoroastrianism|bah[aā]'?i|baha'i|bahai|pagan|polytheist|judaism|jewish|rabbi|kabbalah/i,muslimPattern=/muslim|islam|islamic|caliph|sultan|imam|qadi|sheikh|shaykh|muhaddith|mufassir|faqih|sufi|ottoman|abbasid|umayyad|ayyubid|mamluk|mughal|al-andalus|andalusian|ibn|al-|bint|abu|abd|salahuddin|saladin|khwarizmi|biruni|sina|rushd|ghazali|farabi|khaldun|rumi|iqbal|jinnah|tariq ibn ziyad|fatima al-fihri|malala/i,christianPattern=/christian|christianity|catholic|orthodox|protestant|anglican|lutheran|calvinist|methodist|baptist|pope|saint|st\.|apostle|bishop|priest|pastor|monk|nun|missionary|church|theologian|martyr|reformer|archbishop|cardinal|evangelist/i;function pickByPattern(pattern,used){const found=items.find(function(item){const name=extractBirthPersonName(item),desc=famousDescription(item);return!(!name||used.has(name))&&(!function(item){const desc=famousDescription(item);return blockedReligionPattern.test(desc)}(item)&&pattern.test(desc))});if(!found)return"";const name=extractBirthPersonName(found);return used.add(name),name}const used=new Set,picked=[pickByPattern(muslimPattern,used),pickByPattern(muslimPattern,used),pickByPattern(muslimPattern,used)];for(let i=0;i<picked.length;i+=1)picked[i]||(picked[i]=pickByPattern(christianPattern,used));return{celebrity:picked[0]||"Not found",sports:picked[1]||"Not found",historical:picked[2]||"Not found"}}function famousBirthdayRows(month,day){const fallback=function(month,day){const key=String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");return{"01-01":["Ibn Khaldun","Muhammad Ali Jinnah","Omar Khayyam"],"01-08":["Abd al-Rahman al-Sufi","Ibn al-Haytham","Malala Yousafzai"],"01-15":["Nasser al-Din Shah Qajar","Ibn Battuta","Al-Farabi"],"02-12":["Nur ad-Din Zengi","Ibn Sina","Fatima al-Fihri"],"03-14":["Harun al-Rashid","Al-Biruni","Ibn Rushd"],"04-15":["Süleyman the Magnificent","Mimar Sinan","Ibn Arabi"],"05-05":["Salahuddin al-Ayyubi","Muhammad Iqbal","Al-Khwarizmi"],"06-01":["Abu Bakr al-Siddiq","Umar ibn al-Khattab","Uthman ibn Affan"],"07-24":["Mehmed II","Tipu Sultan","Al-Ghazali"],"08-04":["Rumi","Ibn Taymiyyah","Aisha bint Abi Bakr"],"09-04":["Al-Masudi","Ibn Hazm","Averroes"],"10-28":["Shah Waliullah Dehlawi","Tariq ibn Ziyad","Abd al-Qadir al-Jazairi"],"11-30":["Anwar Sadat","Ibn Jubayr","Ahmad Sirhindi"],"12-25":["Muhammad Ali","Muhammad Asad","Al-Idrisi"]}[key]||{"01-01":["Basil of Caesarea","Fulgentius of Ruspe","Zygmunt Gorazdowski"],"01-08":["Lawrence Giustiniani","Severinus of Noricum","Apollinaris Claudius"],"01-15":["Arnold Janssen","Paul of Thebes","Maurus"],"02-12":["Charles Lwanga","Benedict Biscop","Ethelwald of Lindisfarne"],"03-14":["Matilda of Ringelheim","Pauline of Thuringia","Leobinus"],"04-15":["Damien of Molokai","Paternus of Avranches","Hunna of Alsace"],"05-05":["Augustine of Canterbury","Nunzio Sulprizio","Avertinus"],"06-01":["Justin Martyr","Simeon of Trier","Wistan"],"07-24":["Christina the Astonishing","Declan of Ardmore","Charbel Makhlouf"],"08-04":["John Vianney","Aristarchus of Thessalonica","Euphronius of Tours"],"09-04":["Rosalia","Cuthbert of Lindisfarne","Marinus"],"10-28":["Simon the Zealot","Jude the Apostle","Alfred the Great"],"11-30":["Andrew the Apostle","Tugdual","Joseph Marchand"],"12-25":["Anastasia of Sirmium","Eugenia of Rome","Peter Nolasco"]}[key]||["Ibn Sina","Al-Khwarizmi","Salahuddin al-Ayyubi"]}(month,day);return[["Famous person",fallback[0]],["Famous person",fallback[1]],["Famous person",fallback[2]]]}function historicalEventFallback(month,day){return{"01-01":"630 - The Conquest of Makkah occurred around the 8th year after Hijrah, a major event in Islamic history.","01-08":"1198 - Ibn Rushd, a major Muslim philosopher and scholar, died in Marrakesh.","02-10":"1258 - The Siege of Baghdad ended, marking a major turning point in Islamic civilization.","03-03":"1924 - The Ottoman Caliphate was abolished, ending a major institution in modern Islamic history.","03-11":"1917 - British forces entered Baghdad during World War I, affecting the modern Muslim world.","04-02":"1453 - Ottoman Sultan Mehmed II began the final campaign that led to the conquest of Constantinople.","04-29":"711 - Muslim forces entered Iberia, beginning centuries of Islamic rule in Al-Andalus.","05-29":"1453 - Constantinople was conquered by the Ottoman Empire under Sultan Mehmed II.","06-08":"632 - Prophet Muhammad passed away in Madinah according to widely cited historical tradition.","07-02":"1187 - The Battle of Hattin began, leading to Salahuddin's recovery of Jerusalem.","07-04":"1187 - Salahuddin defeated the Crusader army at the Battle of Hattin.","07-15":"1099 - Jerusalem fell to the First Crusade, a major event in Islamic and Crusader history.","09-23":"622 - The Hijrah to Madinah marks the beginning of the Islamic calendar era.","10-02":"1187 - Salahuddin recovered Jerusalem after the Battle of Hattin.","10-29":"1923 - The Republic of Turkey was proclaimed after the Ottoman era.","12-17":"1273 - Jalal al-Din Rumi, the famous Muslim poet and scholar, died in Konya."}[String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0")]||"No matching Islamic historical event found for this date yet."}function isRelevantAgeHistoricalEvent(item){const text=String(item&&item.text||"").toLowerCase();Number(item&&item.year);return!!text&&/islam|islamic|muslim|muhammad|prophet|quran|qur'an|caliph|caliphate|umayyad|abbasid|fatimid|ayyubid|mamluk|ottoman|seljuk|sultan|sultanate|emir|emirate|hijra|hijrah|mecca|makkah|medina|madinah|baghdad|damascus|cairo|cordoba|al-andalus|andalus|jerusalem|salahuddin|saladin|rumi|ibn|al-|imam|mosque|kaaba|ka'aba|hajj|ramadan|sharia|madrasa/i.test(text)}function updateHistoricalEventOnline(month,day,rows,metricsBuilder){if(!window.fetch)return;fetch("https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/"+month+"/"+day).then(function(response){if(!response.ok)throw new Error("Historical event API unavailable");return response.json()}).then(function(data){const eventText=function(item){if(!item)return"";const year=item.year?String(item.year)+" - ":"",text=String(item.text||"").trim();return text?year+text:""}((Array.isArray(data.events)?data.events:[]).find(isRelevantAgeHistoricalEvent));if(!eventText)return;rows.forEach(function(row){"Historical event on this day"===row[0]&&(row[1]=eventText)});const metrics="function"==typeof metricsBuilder?metricsBuilder(rows):{resultRows:rows.map(function(row){return{label:row[0],value:row[1]}})};renderResultPanel("age",rows,ageLiveCountdownHtml(metrics.birthdate||"")),startAgeLiveCountdown(),saveCurrentReport("age",metrics)}).catch(function(){})}function formatIntlDate(date,locale){try{return new Intl.DateTimeFormat(locale,{dateStyle:"full"}).format(date)}catch{return"Not available"}}function leapBirthdayInfo(birthDate,targetDate){if(!birthDate)return"-";const birthYear=birthDate.getFullYear(),targetYear=targetDate?targetDate.getFullYear():(new Date).getFullYear(),bornInLeapYear=isLeapYear(birthYear)?"Yes":"No";if(1!==birthDate.getMonth()||29!==birthDate.getDate())return"Born in leap year: "+bornInLeapYear;let leapBirthdays=0;for(let year=birthYear+1;year<=targetYear;year+=1)isLeapYear(year)&&(leapBirthdays+=1);return"Leap day birthday; actual Feb 29 birthdays passed: "+leapBirthdays}function calculateAge(){ensureAgeNameInput();const name=firstValue(["ageName","name","personName"]),birthdate=firstValue(["birthdate","birthDate","dob"]),targetInput=ensureAgeTargetDateInput(),targetValue=targetInput?targetInput.value:todayValueISO();if(!birthdate||!targetValue)return;const birthDate=parseDateInput(birthdate,!1),targetDate=parseDateInput(targetValue,!0);if(!birthDate||!targetDate||birthDate>targetDate)return;const exact=calendarAgeBreakdown(birthDate,targetDate);if(!exact)return;const asianAge=function(birthdateValue,targetDateValue){const birthYear=Number(String(birthdateValue||"").split("-")[0]),targetYear=Number(String(targetDateValue||"").split("-")[0]);return!birthYear||!targetYear||birthYear>targetYear?"":targetYear-birthYear+1}(birthdate,targetValue),weekday=birthDate.toLocaleDateString("en-US",{weekday:"long"}),month=birthDate.getMonth()+1,day=birthDate.getDate(),year=birthDate.getFullYear(),exactText=exact.years+" years, "+exact.months+" months, "+exact.days+" days, "+exact.hours+" hours, "+exact.minutes+" minutes",totalAliveDays=(endDate=targetDate,!(startDate=birthDate)||!endDate||endDate<startDate?0:Math.floor((endDate.getTime()-startDate.getTime())/864e5));var startDate,endDate;const totalAliveSeconds=function(startDate,endDate){return!startDate||!endDate||endDate<startDate?0:Math.floor((endDate.getTime()-startDate.getTime())/1e3)}(birthDate,targetDate),chineseAnimal=function(year){return["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"][(year-1900)%12<0?(year-1900)%12+12:(year-1900)%12]}(year),nextAgeData=nextAgeCountdownData(birthDate),secondsToNextAge=nextAgeData?formatLargeNumber(nextAgeData.seconds)+" second to "+nextAgeData.upcomingAge+" years old":"-",rows=[["Name",name||"-"],["Date range",formatDateDMY(birthdate)+" to "+formatDateDMY(targetValue)],["Day of week born",weekday],["Born date in Islamic calendar",formatIntlDate(birthDate,"en-GB-u-ca-islamic")],["Born date in Chinese calendar",formatIntlDate(birthDate,"en-GB-u-ca-chinese")],["Exact age",exactText],["Normal age",exact.years+" years old"],["Asian age",asianAge+" years old"],["Age in "+chineseAnimal+" year",String(exact.years)],["Months old",(exact.years*12+exact.months).toLocaleString()],["Weeks old",Math.floor(totalAliveDays/7).toLocaleString()],["Days old",totalAliveDays.toLocaleString()],["Seconds old",formatLargeNumber(totalAliveSeconds)],["Next birthday countdown",nextBirthdayCountdown(birthDate)],["Next age live countdown",secondsToNextAge],["Retirement",countdownToAge(birthDate,targetDate,60,"retirement")],["Legal age",countdownToAge(birthDate,targetDate,18,"legal adult age")],["Leap year age",leapBirthdayInfo(birthDate,targetDate)],["Estimated sleep time",estimatedSleepText(totalAliveDays)],["Breaths taken",(totalSeconds=totalAliveSeconds,formatLargeNumber(totalSeconds/60*16)+" breaths (estimated 16 breaths/minute)")],["Heartbeats lived",estimatedHeartbeatsText(totalAliveSeconds)],["Days spent alive",totalAliveDays.toLocaleString()],["Western zodiac",westernZodiac(month,day)],["Chinese zodiac",chineseAnimal]].concat(famousBirthdayRows(month,day)).concat([["Historical event on this day",historicalEventFallback(month,day)],["Age on other planets",(totalDays=totalAliveDays,[["Mercury",87.969],["Venus",224.701],["Mars",686.98],["Jupiter",4332.59],["Saturn",10759.22]].map(function(item){const age=totalDays/item[1];return item[0]+": "+age.toFixed(2)}).join(" | "))],["Moon cycles experienced",moonCycleText(totalAliveDays)]]);var totalDays,totalSeconds;function ageMetrics(currentRows){return{birthdate:birthdate,name:name,exactAge:exactText,normalAge:exact.years,asianAge:asianAge,resultRows:currentRows.map(function(row){return{label:row[0],value:row[1]}})}}renderResultPanel("age",rows,ageLiveCountdownHtml(birthdate)),startAgeLiveCountdown(),saveCurrentReport("age",ageMetrics(rows)),function(month,day,rows,metricsBuilder){if(!window.fetch)return;fetch("https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/"+month+"/"+day).then(function(response){if(!response.ok)throw new Error("Birthday API unavailable");return response.json()}).then(function(data){const picked=pickFamousBirthdayPeople(data.births||[]),famousPeople=[picked.celebrity,picked.sports,picked.historical].filter(function(name){return name&&"Not found"!==name});let famousIndex=0;rows.forEach(function(row){"Famous person"===row[0]&&famousPeople[famousIndex]&&(row[1]=famousPeople[famousIndex],famousIndex+=1)});const metrics="function"==typeof metricsBuilder?metricsBuilder(rows):{resultRows:rows.map(function(row){return{label:row[0],value:row[1]}})};renderResultPanel("age",rows,ageLiveCountdownHtml(metrics.birthdate||"")),startAgeLiveCountdown(),saveCurrentReport("age",metrics)}).catch(function(){})}(month,day,rows,ageMetrics),updateHistoricalEventOnline(month,day,rows,ageMetrics)}function ensureBMIProfileAndGroups(){if("bmi"!==getPageType())return;const calculator=$(".calculator");if(!calculator)return;const weight=byId("weight"),height=byId("height");byId("waist");if(!weight||!height)return;function makeLabel(id,forId,text){let label=byId(id);return label||(label=document.createElement("label"),label.id=id),label.setAttribute("for",forId),label.textContent=text,label}function makeNumberInput(id,placeholder){let input=byId(id);return input||(input=document.createElement("input"),input.type="number",input.id=id,input.placeholder=placeholder,input.inputMode="decimal"),input}function makeSelect(id,html,defaultValue){let select=byId(id);const previousValue=select?String(select.value||""):"";if(select&&select.tagName&&"select"!==select.tagName.toLowerCase()){const old=select;select=document.createElement("select"),select.id=id,old.replaceWith(select)}select||(select=document.createElement("select"),select.id=id),select.innerHTML=html;const values=Array.from(select.options).map(function(option){return option.value});return previousValue&&values.includes(previousValue)?select.value=previousValue:defaultValue&&values.includes(defaultValue)&&(select.value=defaultValue),select}const nameLabel=makeLabel("bmiNameLabel","bmiName","Name:"),name=function(id,placeholder){let input=byId(id);return input||(input=document.createElement("input"),input.type="text",input.id=id,input.placeholder=placeholder,input.autocomplete="name"),input}("bmiName","Optional"),ageLabel=makeLabel("bmiAgeLabel","bmiAge","Age:"),age=makeNumberInput("bmiAge","Optional, example: 30"),genderLabel=makeLabel("bmiGenderLabel","bmiGender","Gender:"),gender=makeSelect("bmiGender",'<option value="male">Male</option><option value="female">Female</option>',"male"),activityLabel=makeLabel("bmiActivityLabel","bmiActivityLevel","Activity level:"),activity=makeSelect("bmiActivityLevel",'<option value="sedentary">Sedentary</option><option value="light">Light activity</option><option value="moderate">Moderate activity</option><option value="active">Active</option><option value="veryActive">Very active</option>',"moderate"),timeGoalLabel=makeLabel("bmiTimeGoalLabel","bmiTimeGoalAmount","Time goal:"),timeGoalAmount=makeNumberInput("bmiTimeGoalAmount","Example: 12");timeGoalAmount.min="1",timeGoalAmount.step="1";[nameLabel,name,ageLabel,age,genderLabel,gender,activityLabel,activity,timeGoalLabel,timeGoalAmount,makeSelect("bmiTimeGoal",'<option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>',"weekly"),makeLabel("bmiTargetWeightLabel","bmiTargetWeight","Target weight:"),makeNumberInput("bmiTargetWeight","Optional"),makeLabel("bmiNeckLabel","bmiNeck","Neck circumference:"),makeNumberInput("bmiNeck","Optional"),makeLabel("bmiWristLabel","bmiWrist","Wrist size:"),makeNumberInput("bmiWrist","Optional"),makeLabel("bmiShoulderLabel","bmiShoulder","Shoulder width:"),makeNumberInput("bmiShoulder","Optional"),makeLabel("bmiHipLabel","bmiHip","Hip circumference:"),makeNumberInput("bmiHip","Optional")].forEach(function(el){el.parentElement||calculator.insertBefore(el,weight)});let row=$(".bmi-input-groups");if(!row){row=document.createElement("div"),row.className="bmi-input-groups";const titleRow=$(".bmi-title-row");titleRow?titleRow.insertAdjacentElement("afterend",row):calculator.insertAdjacentElement("afterbegin",row)}let bodyBox=$(".bmi-body-box");bodyBox||(bodyBox=document.createElement("div"),bodyBox.className="bmi-body-box bmi-input-group-box",bodyBox.innerHTML='<div class="bmi-extra-title">Body details</div>');let goalBox=$(".bmi-goal-box");goalBox||(goalBox=document.createElement("div"),goalBox.className="bmi-goal-box bmi-input-group-box",goalBox.innerHTML='<div class="bmi-extra-title">Activity & goal</div>');let optionalBox=$(".bmi-optional-box");optionalBox||(optionalBox=document.createElement("div"),optionalBox.className="bmi-optional-box bmi-input-group-box",optionalBox.innerHTML='<div class="bmi-extra-title">Optional target</div>'),row.contains(bodyBox)||row.appendChild(bodyBox),row.contains(goalBox)||row.appendChild(goalBox),row.contains(optionalBox)||row.appendChild(optionalBox),["bmiNameLabel","bmiName","heightLabel","height","weightLabel","weight","bmiAgeLabel","bmiAge","bmiGenderLabel","bmiGender"].forEach(function(id){const element=byId(id);element&&bodyBox.appendChild(element)}),["bmiActivityLabel","bmiActivityLevel","bmiTimeGoalLabel"].forEach(function(id){const element=byId(id);element&&goalBox.appendChild(element)});let timeGoalWrap=byId("bmiTimeGoalWrapper");timeGoalWrap||(timeGoalWrap=document.createElement("div"),timeGoalWrap.id="bmiTimeGoalWrapper",timeGoalWrap.className="bmi-time-goal-row"),goalBox.contains(timeGoalWrap)||goalBox.appendChild(timeGoalWrap),["bmiTimeGoalAmount","bmiTimeGoal"].forEach(function(id){const element=byId(id);element&&timeGoalWrap.appendChild(element)}),["bmiTargetWeightLabel","bmiTargetWeight","waistLabel","waist","bmiNeckLabel","bmiNeck","bmiWristLabel","bmiWrist","bmiShoulderLabel","bmiShoulder","bmiHipLabel","bmiHip"].forEach(function(id){const element=byId(id);element&&optionalBox.appendChild(element)}),["bmiFrameLabel",""].forEach(function(id){const element=byId(id);element&&element.remove()})}function setBMIUnit(unit){const normalized="us"===unit?"us":"si";document.body.dataset.bmiUnit=normalized;const button=byId("unitToggleBtn");button&&(button.dataset.currentUnit=normalized,button.textContent="si"===normalized?"SI":"US");const weightLabel=byId("weightLabel"),heightLabel=byId("heightLabel"),waistLabel=byId("waistLabel"),neckLabel=byId("bmiNeckLabel"),wristLabel=byId("bmiWristLabel"),shoulderLabel=byId("bmiShoulderLabel"),hipLabel=byId("bmiHipLabel"),targetWeightLabel=byId("bmiTargetWeightLabel"),weight=byId("weight"),height=byId("height"),waist=byId("waist"),neck=byId("bmiNeck"),wrist=byId("bmiWrist"),shoulder=byId("bmiShoulder"),hip=byId("bmiHip"),targetWeight=byId("bmiTargetWeight");"si"===normalized?(weightLabel&&(weightLabel.textContent="Weight in kg:"),heightLabel&&(heightLabel.textContent="Height in cm:"),waistLabel&&(waistLabel.textContent="Waist circumference in cm:"),neckLabel&&(neckLabel.textContent="Neck circumference in cm:"),wristLabel&&(wristLabel.textContent="Wrist size in cm:"),shoulderLabel&&(shoulderLabel.textContent="Shoulder width in cm:"),hipLabel&&(hipLabel.textContent="Hip circumference in cm:"),targetWeightLabel&&(targetWeightLabel.textContent="Target weight in kg:"),weight&&(weight.placeholder="Example: 70"),height&&(height.placeholder="Example: 170"),waist&&(waist.placeholder="Optional, Example: 80"),neck&&(neck.placeholder="Optional, Example: 38"),wrist&&(wrist.placeholder="Optional, Example: 16"),shoulder&&(shoulder.placeholder="Optional, Example: 46"),hip&&(hip.placeholder="Optional, Example: 95"),targetWeight&&(targetWeight.placeholder="Optional, Example: 65")):(weightLabel&&(weightLabel.textContent="Weight in lb:"),heightLabel&&(heightLabel.textContent="Height in inch:"),waistLabel&&(waistLabel.textContent="Waist circumference in inch:"),neckLabel&&(neckLabel.textContent="Neck circumference in inch:"),wristLabel&&(wristLabel.textContent="Wrist size in inch:"),shoulderLabel&&(shoulderLabel.textContent="Shoulder width in inch:"),hipLabel&&(hipLabel.textContent="Hip circumference in inch:"),targetWeightLabel&&(targetWeightLabel.textContent="Target weight in lb:"),weight&&(weight.placeholder="Example: 154"),height&&(height.placeholder="Example: 67"),waist&&(waist.placeholder="Optional, Example: 32"),neck&&(neck.placeholder="Optional, Example: 15"),wrist&&(wrist.placeholder="Optional, Example: 6.3"),shoulder&&(shoulder.placeholder="Optional, Example: 18"),hip&&(hip.placeholder="Optional, Example: 38"),targetWeight&&(targetWeight.placeholder="Optional, Example: 143"))}function ageRangeLabel(age){return!Number.isFinite(age)||age<=0?"Not provided":age<18?"Under 18":age<65?"Adult 18–64":"Senior 65+"}function calculateBMI(){ensureBMIProfileAndGroups();const name=firstValue(["bmiName"]),weight=firstNumber(["weight","bmiWeight"]),height=firstNumber(["height","bmiHeight"]),waist=firstNumber(["waist","bmiWaist"]),neck=firstNumber(["bmiNeck"]),wrist=firstNumber(["bmiWrist"]),shoulder=firstNumber(["bmiShoulder"]),hip=firstNumber(["bmiHip"]),age=firstNumber(["bmiAge"]),gender=firstValue(["bmiGender"])||"male",activity=firstValue(["bmiActivityLevel"])||"moderate",timeGoalAmount=firstNumber(["bmiTimeGoalAmount"]),timeGoal=firstValue(["bmiTimeGoal"])||"weekly",targetWeight=firstNumber(["bmiTargetWeight"]);if(!Number.isFinite(weight)||!Number.isFinite(height)||weight<=0||height<=0)return;const button=byId("unitToggleBtn"),unit=(button?button.dataset.currentUnit:document.body.dataset.bmiUnit)||"si";let bmi,weightKg,heightCm,displayUnit,ratio=NaN;if("us"===unit)bmi=703*weight/(height*height),Number.isFinite(waist)&&waist>0&&(ratio=waist/height),weightKg=.45359237*weight,heightCm=2.54*height,displayUnit="lb";else{const heightM=height/100;bmi=weight/(heightM*heightM),Number.isFinite(waist)&&waist>0&&(ratio=waist/height),weightKg=weight,heightCm=height,displayUnit="kg"}let category="Normal";function displayWeightFromKg(kg){return("us"===unit?kg/.45359237:kg).toFixed(1)+" "+displayUnit}bmi<18.5?category="Underweight":bmi>=25&&bmi<30?category="Overweight":bmi>=30&&(category="Obese");const heightM=heightCm/100,healthyMinKg=18.5*heightM*heightM,healthyMaxKg=24.9*heightM*heightM,healthyRange=displayWeightFromKg(healthyMinKg)+" – "+displayWeightFromKg(healthyMaxKg);let differenceText="Inside healthy range";weightKg<healthyMinKg?differenceText="Gain about "+displayWeightFromKg(healthyMinKg-weightKg)+" to enter healthy range":weightKg>healthyMaxKg&&(differenceText="Lose about "+displayWeightFromKg(weightKg-healthyMaxKg)+" to enter healthy range");const activityFactors={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9};let caloriesMaintainText="Enter age to estimate calories/day",caloriesGainText="Enter age to estimate calories/day",caloriesLossText="Enter age to estimate calories/day";if(Number.isFinite(age)&&age>0){const maleBmr=10*weightKg+6.25*heightCm-5*age+5,femaleBmr=10*weightKg+6.25*heightCm-5*age-161;let bmr=(maleBmr+femaleBmr)/2;"male"===gender&&(bmr=maleBmr),"female"===gender&&(bmr=femaleBmr);const maintenanceCalories=Math.round(bmr*(activityFactors[activity]||activityFactors.moderate)),gainCalories=maintenanceCalories+500,lossCalories=Math.max(1200,maintenanceCalories-500);caloriesMaintainText=maintenanceCalories.toLocaleString("en-US")+" calories/day to maintain weight",caloriesGainText=gainCalories.toLocaleString("en-US")+" calories/day to add weight",caloriesLossText=lossCalories.toLocaleString("en-US")+" calories/day to lose weight"}function measurementDisplay(value){return!Number.isFinite(value)||value<=0?"Not provided":value+("us"===unit?" inch":" cm")}function toCm(value){return!Number.isFinite(value)||value<=0?NaN:"us"===unit?2.54*value:value}const waistCm=toCm(waist),wristCm=(toCm(neck),toCm(wrist)),shoulderCm=toCm(shoulder),hipCm=toCm(hip),calculatedFrameSize=function(wristCm,heightCmValue){if(!Number.isFinite(wristCm)||wristCm<=0)return"Not provided";const wristHeightRatio=wristCm/heightCmValue;return"female"===gender?wristHeightRatio<.086?"Small frame":wristHeightRatio<=.094?"Medium frame":"Large frame":wristHeightRatio<.095?"Small frame":wristHeightRatio<=.104?"Medium frame":"Large frame"}(wristCm,heightCm);let bodyFatNumber=NaN,bodyFatText="Enter age and gender to estimate body fat";const waistForNavy="us"===unit?waist:waist/2.54,neckForNavy="us"===unit?neck:neck/2.54,heightForNavy="us"===unit?height:height/2.54;if(Number.isFinite(waistForNavy)&&Number.isFinite(neckForNavy)&&Number.isFinite(heightForNavy)&&waistForNavy>neckForNavy&&neckForNavy>0&&heightForNavy>0&&("male"===gender?(bodyFatNumber=86.01*Math.log10(waistForNavy-neckForNavy)-70.041*Math.log10(heightForNavy)+36.76,bodyFatText=Math.max(0,bodyFatNumber).toFixed(1)+"% estimated body fat using waist + neck"):bodyFatText="For female Navy body-fat estimate, hip circumference is normally needed; showing BMI-age estimate instead"),!Number.isFinite(bodyFatNumber)&&Number.isFinite(age)&&age>0&&gender){bodyFatNumber=1.2*bmi+.23*age-10.8*("male"===gender?1:"female"===gender?0:.5)-5.4,bodyFatText=Math.max(0,bodyFatNumber).toFixed(1)+"% estimated body fat"}const fatDistribution=function(waistCm,hipCm,ratioValue){const waistHipRatio=Number.isFinite(waistCm)&&Number.isFinite(hipCm)&&hipCm>0?waistCm/hipCm:NaN;if(Number.isFinite(waistHipRatio)){return(("male"===gender?waistHipRatio>=.9:waistHipRatio>=.85)?"Central / abdominal fat pattern":"Lower central-fat pattern")+" (waist-to-hip ratio "+waistHipRatio.toFixed(2)+")"}return Number.isFinite(ratioValue)?ratioValue>=.5?"Central-body-fat risk pattern from waist-to-height ratio":"Lower central-fat pattern from waist-to-height ratio":"Add waist and hip to estimate fat distribution"}(waistCm,hipCm,ratio),bodyShape=function(shoulderCm,waistCm,hipCm){return!Number.isFinite(shoulderCm)||!Number.isFinite(waistCm)||!Number.isFinite(hipCm)||waistCm<=0||hipCm<=0?"Add shoulder, waist, and hip to estimate body shape":shoulderCm>=1.08*hipCm&&waistCm<=.78*shoulderCm?"Inverted triangle / V-shape":hipCm>=1.08*shoulderCm&&waistCm<=.78*hipCm?"Pear / lower-body dominant shape":Math.abs(shoulderCm-hipCm)<=Math.max(4,.06*hipCm)&&waistCm<=.78*Math.min(shoulderCm,hipCm)?"Hourglass / balanced shape":waistCm>=.9*Math.min(shoulderCm,hipCm)?"Apple / midsection-dominant shape":"Rectangle / straight balanced shape"}(shoulderCm,waistCm,hipCm),somatotypeTendency=function(bmiValue,bodyFatValue,frameSize,shoulderCm,hipCm){const broadShoulders=Number.isFinite(shoulderCm)&&Number.isFinite(hipCm)&&shoulderCm>1.05*hipCm;return bmiValue<18.5&&("Small frame"===frameSize||"Not provided"===frameSize)?"Ectomorph tendency":Number.isFinite(bodyFatValue)&&bodyFatValue>=("male"===gender?25:32)?"Endomorph tendency":bmiValue>=25&&broadShoulders&&"Small frame"!==frameSize||"Large frame"===frameSize&&broadShoulders?"Mesomorph tendency":bmiValue>=25?"Endomorph tendency":"Balanced mixed tendency"}(bmi,bodyFatNumber,calculatedFrameSize,shoulderCm,hipCm),bodyTypeComment=function(frameSize,shapeText,somatotypeText,bodyFatValue){let base="Not provided"!==frameSize?frameSize.replace(" frame","")+" frame":"Frame size not fully known";if(/ectomorph/i.test(somatotypeText)&&(base="Lean frame"),/mesomorph/i.test(somatotypeText)&&(base="Athletic / solid frame"),/endomorph/i.test(somatotypeText)&&(base="Softer / higher-storage frame"),Number.isFinite(bodyFatValue)){if(bodyFatValue<("male"===gender?14:22))return base+" with lean body-fat estimate";if(bodyFatValue>=("male"===gender?25:32))return base+" with higher body-fat estimate"}return/central|apple/i.test(shapeText)?base+" with more midsection focus":base}(calculatedFrameSize,bodyShape,somatotypeTendency,bodyFatNumber),suggestedExercise=function(somatotypeText,shapeText,fatText,categoryText){const central=/central|abdominal|apple|midsection/i.test(String(fatText)+" "+String(shapeText));return/ectomorph/i.test(somatotypeText)?"Strength training 3–4 days/week, progressive overload, compound lifts, light cardio, and enough rest for muscle gain.":/mesomorph/i.test(somatotypeText)?"Balanced plan: strength training 3 days/week, cardio 2 days/week, mobility work, and sports or circuits for conditioning.":/endomorph/i.test(somatotypeText)||central||/overweight|obese/i.test(categoryText)?"Low-impact cardio 3–5 days/week, full-body resistance training 2–3 days/week, daily walking, and core stability work.":"General fitness: full-body strength 2–3 days/week, brisk walking or cycling, stretching, and gradual weekly progression."}(somatotypeTendency,bodyShape,fatDistribution,category),suggestedFoods=function(somatotypeText,shapeText,fatText,categoryText){const central=/central|abdominal|apple|midsection/i.test(String(fatText)+" "+String(shapeText));return/ectomorph/i.test(somatotypeText)?"Focus on calorie-dense healthy foods: rice/oats/potatoes, eggs/fish/chicken/tempeh, milk/yogurt, nuts, olive oil, and regular protein meals.":/mesomorph/i.test(somatotypeText)?"Use balanced plates: lean protein, rice/potato/whole grains, vegetables, fruit, healthy fats, and limit sugary drinks.":/endomorph/i.test(somatotypeText)||central||/overweight|obese/i.test(categoryText)?"Prioritize high-protein and high-fiber meals: fish/chicken/eggs/tofu, vegetables, beans, fruit, water, and reduce fried food, sweets, and sweet drinks.":"Choose simple balanced meals: protein each meal, vegetables, whole carbohydrates, fruit, water, and controlled snack portions."}(somatotypeTendency,bodyShape,fatDistribution,category),physiqueText=bodyTypeComment,timeGoalLabels={daily:"Daily",weekly:"Weekly",monthly:"Monthly"};function goalUnitText(amount,unitValue){const cleanAmount=Number.isFinite(amount)&&amount>0?Math.round(amount):"";if(!cleanAmount)return timeGoalLabels[unitValue]||"Weekly";return cleanAmount+" "+("daily"===unitValue?"day":"monthly"===unitValue?"month":"week")+(1===cleanAmount?"":"s")}function weeklyGoalHealthText(perWeekKg,targetKg,diffKg){if(!Number.isFinite(perWeekKg)||perWeekKg<=0)return"Enter target weight and time goal to check if the weekly change is healthy";const weeklyText=displayWeightFromKg(perWeekKg)+" per week",isSafePace=perWeekKg<=1,targetInHealthyRange=Number.isFinite(targetKg)&&targetKg>=healthyMinKg&&targetKg<=healthyMaxKg,isReduction=diffKg<0;return isSafePace?isReduction&&targetInHealthyRange?weeklyText+" is healthy and the target weight lands in the healthy BMI range":isReduction&&!targetInHealthyRange&&Number.isFinite(targetKg)&&targetKg>healthyMaxKg?weeklyText+" is a safe pace, but the target is still above the healthy BMI range":Number.isFinite(targetKg)&&targetKg<healthyMinKg?weeklyText+" may not be healthy because the target is below the healthy BMI range":weeklyText+" is within a safer pace":weeklyText+" is not healthy"}let goalTimeline="Enter target weight and time goal to estimate goal timeline",goalHealthyText="Enter target weight and time goal to check if it is healthy",goalBestText="Enter target weight to see easy, ideal, and hardest safe options";if(Number.isFinite(targetWeight)&&targetWeight>0){const targetKg="us"===unit?.45359237*targetWeight:targetWeight,diffKg=targetKg-weightKg,direction=diffKg<0?"lose":"gain",diffAbsKg=Math.abs(diffKg),availableWeeks=(amount=timeGoalAmount,unitValue=timeGoal,!Number.isFinite(amount)||amount<=0?NaN:"daily"===unitValue?amount/7:"monthly"===unitValue?4.345*amount:amount);if(goalBestText=function(diffKg){if(!Number.isFinite(diffKg)||Math.abs(diffKg)<.05)return"Already at target weight";const action=diffKg<0?"loss":"gain";return"Easy: "+displayWeightFromKg(.25)+"/week "+action+", Ideal: "+displayWeightFromKg(.5)+"/week "+action+", Hardest safe: "+displayWeightFromKg(1)+"/week "+action}(diffKg),diffAbsKg<.05)goalTimeline="Already at target weight",goalHealthyText="Already at target weight";else if(Number.isFinite(availableWeeks)&&availableWeeks>0){const perWeekKg=diffAbsKg/availableWeeks;goalTimeline="To "+direction+" "+displayWeightFromKg(diffAbsKg)+" in "+goalUnitText(timeGoalAmount,timeGoal)+", aim for about "+displayWeightFromKg(perWeekKg)+" per week.",goalHealthyText=weeklyGoalHealthText(perWeekKg,targetKg,diffKg)}else{const recommendedWeeks=Math.max(1,Math.ceil(diffAbsKg/.5)),perWeekText=displayWeightFromKg(.5);goalTimeline="daily"===timeGoal?"About "+7*recommendedWeeks+" days to "+direction+" "+displayWeightFromKg(diffAbsKg)+" at ~"+perWeekText+"/week.":"monthly"===timeGoal?"About "+Math.max(1,Math.ceil(recommendedWeeks/4.345))+" months to "+direction+" "+displayWeightFromKg(diffAbsKg)+" at ~"+perWeekText+"/week.":"About "+recommendedWeeks+" weeks to "+direction+" "+displayWeightFromKg(diffAbsKg)+" at ~"+perWeekText+"/week.",goalHealthyText=weeklyGoalHealthText(.5,targetKg,diffKg)}}var amount,unitValue;let waistStatus="Enter waist to check";Number.isFinite(ratio)&&(waistStatus=ratio<.5?"Healthy":"Higher risk");let healthRisk="Average risk — use BMI with waist-to-height ratio for a better view";"Normal"===category&&(!Number.isFinite(ratio)||ratio<.5)&&(healthRisk="Lower risk range"),"Underweight"===category&&(healthRisk="Possible risks: low energy, nutrient deficiency, weaker immunity, and bone health concerns"),"Overweight"===category&&(healthRisk="Possible risks: higher blood pressure, insulin resistance, fatty liver, joint strain, and higher cholesterol"),"Obese"===category&&(healthRisk="Possible risks: type 2 diabetes, high blood pressure, heart disease, sleep apnea, fatty liver, and joint problems"),Number.isFinite(ratio)&&ratio>=.5&&(healthRisk+="; waist-to-height ratio suggests higher central-body-fat risk"),"Large frame"!==calculatedFrameSize||"Overweight"!==category&&"Obese"!==category||(healthRisk+="; larger frame may explain some weight, but health risk still depends on waist and body-fat pattern");const rows=[["BMI",bmi.toFixed(2)],["BMI category",category],["Healthy weight range",healthyRange],["Difference to healthy range",differenceText],["Calories/day to maintain",caloriesMaintainText],["Calories/day to add weight",caloriesGainText],["Calories/day to lose weight",caloriesLossText],["Body fat estimate",bodyFatText],["Body type comment",bodyTypeComment],["Frame size",calculatedFrameSize],["Fat distribution",fatDistribution],["Body shape",bodyShape],["Somatotype tendency",somatotypeTendency],["Suggested exercise",suggestedExercise],["Suggested foods",suggestedFoods],["Goal timeline",goalTimeline],["Healthy?",goalHealthyText],["Best",goalBestText],["Waist-to-height ratio",Number.isFinite(ratio)?ratio.toFixed(2):"Not provided"],["Waist-to-height status",waistStatus],["Neck circumference",measurementDisplay(neck)],["Wrist size",measurementDisplay(wrist)],["Shoulder width",measurementDisplay(shoulder)],["Hip circumference",measurementDisplay(hip)],["Health risk",healthRisk],["Unit","us"===unit?"US":"SI"],["Name",name||"Not provided"],["Age range",ageRangeLabel(age)],["Gender",(value=gender,value?String(value).charAt(0).toUpperCase()+String(value).slice(1):"Not provided")],["Activity level",{sedentary:"Sedentary",light:"Light activity",moderate:"Moderate activity",active:"Active",veryActive:"Very active"}[activity]||"Moderate activity"],["Target weight",Number.isFinite(targetWeight)&&targetWeight>0?targetWeight+" "+displayUnit:"Not provided"],["Time goal",goalUnitText(timeGoalAmount,timeGoal)]];var value;const metrics={bmi:bmi.toFixed(2),category:category,healthyRange:healthyRange,healthRisk:healthRisk,calories:caloriesMaintainText,caloriesMaintain:caloriesMaintainText,caloriesGain:caloriesGainText,caloriesLoss:caloriesLossText,bodyFat:bodyFatText,physique:physiqueText,frameSize:calculatedFrameSize,fatDistribution:fatDistribution,bodyShape:bodyShape,somatotypeTendency:somatotypeTendency,bodyTypeComment:bodyTypeComment,suggestedExercise:suggestedExercise,suggestedFoods:suggestedFoods,goalTimeline:goalTimeline,name:name||"",resultRows:rows.map(function(row){return{label:row[0],value:row[1]}})};renderResultPanel("bmi",rows),saveCurrentReport("bmi",metrics)}function calculateDiscount(){const price=firstNumber(["price","originalPrice","amount"]),discount=firstNumber(["discount","discountRate"]);if(!Number.isFinite(price)||!Number.isFinite(discount)||price<=0||discount<0||discount>100)return;const savings=price*discount/100,finalPrice=price-savings;renderResultPanel("discount",[["Original price",moneyRM(price)],["Discount",discount+"%"],["Savings",moneyRM(savings)],["Final price",moneyRM(finalPrice)]]),saveCurrentReport("discount",{finalPrice:moneyRM(finalPrice)})}function calculatePercentage(){const percentage=firstNumber(["percentage","percent"]),number=firstNumber(["number","amount","value"]);if(!Number.isFinite(percentage)||!Number.isFinite(number))return;const answer=percentage/100*number;renderResultPanel("percentage",[["Percentage",percentage+"%"],["Number",String(number)],["Answer",money(answer)]]),saveCurrentReport("percentage",{result:money(answer)})}function calculateCompound(){const principal=firstNumber(["principal","compoundPrincipal","amount"]),rate=firstNumber(["rate","compoundRate","interest","interestRate"]),years=firstNumber(["years","compoundYears","time"]),frequency=Number(firstValue(["frequency","compoundFrequency"]))||1;if(!Number.isFinite(principal)||!Number.isFinite(rate)||!Number.isFinite(years)||principal<=0||rate<0||years<=0||frequency<=0)return;const futureValue=principal*Math.pow(1+rate/100/frequency,frequency*years),compoundInterest=futureValue-principal;renderResultPanel("compound",[["Principal",moneyRM(principal)],["Annual interest rate",rate+"%"],["Years",String(years)],["Compounding frequency",String(frequency)],["Future value",moneyRM(futureValue)],["Compound interest",moneyRM(compoundInterest)]]),saveCurrentReport("compound",{futureValue:moneyRM(futureValue)})}function localTodayIsoDate(){const now=new Date;return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")}function calculateLoanPayment(principal,annualRate,months){const monthlyRate=annualRate/100/12;return 0===monthlyRate?principal/months:principal*monthlyRate*Math.pow(1+monthlyRate,months)/(Math.pow(1+monthlyRate,months)-1)}function remainingBalance(principal,annualRate,months,paidMonths,extraMonthly){const monthlyRate=annualRate/100/12,payment=calculateLoanPayment(principal,annualRate,months)+(Number(extraMonthly)||0);return 0===monthlyRate?Math.max(0,principal-payment*paidMonths):Math.max(0,principal*Math.pow(1+monthlyRate,paidMonths)-payment*((Math.pow(1+monthlyRate,paidMonths)-1)/monthlyRate))}function ensureMortgageOptionalSections(){if("loan"!==getPageType())return;const calculator=$(".calculator");if(!calculator)return;let row=$(".loan-optional-row");if(!row){row=document.createElement("div"),row.className="loan-optional-row";const calculateButton=$(".main-btn",calculator)||Array.from($$("button",calculator)).find(function(button){return lower(button.textContent).includes("calculate")});calculateButton?calculateButton.insertAdjacentElement("beforebegin",row):calculator.appendChild(row)}let optional=$(".optional-mortgage-costs");optional||(optional=document.createElement("div"),optional.className="optional-mortgage-costs",optional.innerHTML='<button type="button" class="optional-mortgage-toggle" aria-expanded="true">Optional costs</button><div class="optional-mortgage-content"><label for="propertyTaxYearly">Property tax per year:</label><input type="number" id="propertyTaxYearly" placeholder="Optional"><label for="homeInsuranceYearly">Home insurance per year:</label><input type="number" id="homeInsuranceYearly" placeholder="Optional"><label for="otherMonthlyFees">Other monthly fees:</label><input type="number" id="otherMonthlyFees" placeholder="Optional"></div>');let early=$(".early-settlement-box");early||(early=document.createElement("div"),early.className="early-settlement-box",early.innerHTML='<button type="button" class="early-settlement-toggle" aria-expanded="true">Optional early settlement</button><div class="early-settlement-content"><label for="earlySettlementMonth">Settle after month:</label><input type="number" id="earlySettlementMonth" placeholder="Optional"><label for="extraMonthlyPayment">Extra monthly payment:</label><input type="number" id="extraMonthlyPayment" placeholder="Optional"></div>');const mortgageLayout=document.querySelector(".mortgage-two-column-input-layout"),mortgageLeftColumn=mortgageLayout?mortgageLayout.querySelector(".mortgage-left-input-column"):null,mortgageRightColumn=mortgageLayout?mortgageLayout.querySelector(".mortgage-right-input-column"):null;mortgageLeftColumn&&mortgageRightColumn?(optional.parentElement!==mortgageLeftColumn&&mortgageLeftColumn.appendChild(optional),early.parentElement!==mortgageRightColumn&&mortgageRightColumn.appendChild(early)):(row.contains(optional)||row.appendChild(optional),row.contains(early)||row.appendChild(early));const hoa=byId("hoaMonthly"),other=byId("otherMonthlyFees");if(hoa&&other){!other.value&&hoa.value&&(other.value=hoa.value);const label=$('label[for="hoaMonthly"]');label&&label.remove(),hoa.remove()}}function mortgagePayoffSchedule(principal,annualRate,months,extraMonthly){const monthlyRate=annualRate/100/12,basePayment=calculateLoanPayment(principal,annualRate,months),payment=basePayment+Math.max(0,Number(extraMonthly)||0);let balance=principal,totalInterest=0,payoffMonths=0,yearPrincipal=0,yearInterest=0;const yearly=[];for(let month=1;month<=months&&balance>.005;month+=1){const interestPaid=0===monthlyRate?0:balance*monthlyRate;let principalPaid=payment-interestPaid;principalPaid<=0&&(principalPaid=0),principalPaid>balance&&(principalPaid=balance),balance=Math.max(0,balance-principalPaid),totalInterest+=interestPaid,yearPrincipal+=principalPaid,yearInterest+=interestPaid,payoffMonths=month,(month%12==0||balance<=.005||month===months)&&(yearly.push({year:Math.ceil(month/12),principal:yearPrincipal,interest:yearInterest,balance:balance}),yearPrincipal=0,yearInterest=0)}return{basePayment:basePayment,paymentWithExtra:payment,totalInterest:totalInterest,totalPaid:principal+totalInterest,payoffMonths:payoffMonths,yearly:yearly}}function mortgageSimpleBarChart(items,valueKey){const values=(items=Array.isArray(items)?items:[]).map(function(item){return Number(item[valueKey])||0}),max=Math.max.apply(Math,values.concat([1])),min=Math.min.apply(Math,values.concat([0])),range=Math.max(1,max-min);function xAt(index){return items.length<=1?275:54+index/(items.length-1)*442}function yAt(value){return 174-(value-min)/range*150}return'<div class="mortgage-line-chart-wrap"><svg class="mortgage-line-chart" viewBox="0 0 520 220" role="img" aria-label="Mortgage line graph"><line class="mortgage-line-axis" x1="54" y1="174" x2="496" y2="174"></line><line class="mortgage-line-axis" x1="54" y1="24" x2="54" y2="174"></line><polyline class="mortgage-line-path" points="'+values.map(function(value,index){return xAt(index).toFixed(2)+","+yAt(value).toFixed(2)}).join(" ")+'"></polyline>'+items.map(function(item,index){const value=values[index],x=xAt(index),y=yAt(value);return'<g class="mortgage-line-point"><circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="5"></circle><text x="'+x.toFixed(2)+'" y="202" text-anchor="middle">'+escapeHtml(item.label||"")+'</text><text x="'+x.toFixed(2)+'" y="'+Math.max(12,y-10).toFixed(2)+'" text-anchor="middle">'+escapeHtml(item.display||moneyRM(value))+"</text></g>"}).join("")+"</svg></div>"}function mortgageTable(headers,rows,className){return'<div class="mortgage-advanced-table-scroll"><table class="mortgage-advanced-table '+(className||"")+'"><thead><tr>'+headers.map(function(header){return"<th>"+escapeHtml(header)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(row){return"<tr>"+row.map(function(cell){return"<td>"+escapeHtml(cell)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>"}function calculateLoan(){ensureMortgageOptionalSections();const homeNameInput=byId("homeName"),homeName=homeNameInput?String(homeNameInput.value||"").trim():"",homePrice=firstNumber(["amount","loanAmount","loanPrincipal"]),downPayment=Math.max(0,firstNumber(["downPayment"])||0),principal=Number.isFinite(homePrice)?Math.max(0,homePrice-downPayment):NaN,annualRate=firstNumber(["interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["years","loanYears","loanTerm","term"]),rawTerm=termInput?numberFromString(termInput.value):NaN;if(!Number.isFinite(homePrice)||!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||homePrice<=0||principal<=0||annualRate<0||rawTerm<=0)return;const label=termInput?getInputLabel(termInput):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm);if(!Number.isFinite(months)||months<=0)return;const startDateInput=byId("startDate");startDateInput&&!startDateInput.value&&(startDateInput.value=localTodayIsoDate());const startDate=startDateInput&&startDateInput.value?startDateInput.value:localTodayIsoDate(),taxMonthly=(firstNumber(["propertyTaxYearly"])||0)/12,insuranceMonthly=(firstNumber(["homeInsuranceYearly"])||0)/12,otherMonthly=firstNumber(["otherMonthlyFees","hoaMonthly"])||0,extraMonthly=firstNumber(["extraMonthlyPayment"])||0,incomeMonthly=firstNumber(["incomeMonthly","monthlyIncome","income"])||0,baseMonthly=calculateLoanPayment(principal,annualRate,months),principalInterestValue=baseMonthly*months,baseTotalInterest=principalInterestValue-principal,totalMonthly=baseMonthly+taxMonthly+insuranceMonthly+otherMonthly+extraMonthly,requiredIncome=totalMonthly/.28,affordability=incomeMonthly>0?totalMonthly<=.28*incomeMonthly?"Yes, based on 28% of monthly income":"No, estimated payment is above 28% of income":"Add monthly income to check affordability",schedule=mortgagePayoffSchedule(principal,annualRate,months,extraMonthly),noExtraSchedule=mortgagePayoffSchedule(principal,annualRate,months,0),extraPaidApprox=Math.max(0,extraMonthly)*Math.max(0,schedule.payoffMonths),interestSaved=Math.max(0,noExtraSchedule.totalInterest-schedule.totalInterest),noDownMonthly=calculateLoanPayment(homePrice,annualRate,months),monthlySavingsFromDownPayment=Math.max(0,noDownMonthly-baseMonthly),breakEvenMonths=downPayment>0&&monthlySavingsFromDownPayment>0?Math.ceil(downPayment/monthlySavingsFromDownPayment):null,breakEvenText=breakEvenMonths?breakEvenMonths+" months (about "+(breakEvenMonths/12).toFixed(1)+" years)":"Not available without down payment savings",yearlyRows=schedule.yearly.map(function(row){return["Year "+row.year,moneyRM(row.principal),moneyRM(row.interest),moneyRM(row.balance)]}),interestChartItems=[-2,-1,0,1,2].map(function(change){const rate=Math.max(0,annualRate+change),monthly=calculateLoanPayment(principal,rate,months);return{label:(value=rate,Number.isFinite(value)?(Math.round(100*value)/100).toFixed(2)+"%":"-"),monthly:monthly,display:moneyRM(monthly)+"/mo"};var value}),yearCompareItems=[15,20,25,30].filter(function(year,index,arr){return arr.indexOf(year)===index}).map(function(year){const monthly=calculateLoanPayment(principal,annualRate,12*year);return{label:year+" years",monthly:monthly,display:moneyRM(monthly)+"/mo"}}),rows=(function(homePrice,annualRate,months,currentDownPayment){const percents=[0,10,20,30];if(currentDownPayment>0&&homePrice>0){const currentPercent=Math.round(currentDownPayment/homePrice*1e3)/10;percents.includes(currentPercent)||percents.push(currentPercent)}percents.filter(function(percent,index,arr){return arr.indexOf(percent)===index}).sort(function(a,b){return a-b}).map(function(percent){const dp=homePrice*percent/100,principal=Math.max(0,homePrice-dp),monthly=principal>0?calculateLoanPayment(principal,annualRate,months):0,totalInterest=principal>0?monthly*months-principal:0;return[percent+"%",moneyRM(dp),moneyRM(principal),moneyRM(monthly),moneyRM(totalInterest)]})}(homePrice,annualRate,months,downPayment),[["Home name",homeName||"Not provided"],["Home price",moneyRM(homePrice)],["Down payment",moneyRM(downPayment)],["Mortgage principal",moneyRM(principal)],["Annual interest rate",annualRate.toFixed(2)+"%"],["Loan term",months+" months ("+(months/12).toFixed(1)+" years)"],["Start date",startDate],["Principal + interest value",moneyRM(principalInterestValue)],["Monthly principal + interest",moneyRM(baseMonthly)],["Total interest",moneyRM(baseTotalInterest)],["Property tax monthly",moneyRM(taxMonthly)],["Insurance monthly",moneyRM(insuranceMonthly)],["Other monthly fee",moneyRM(otherMonthly)],["Extra monthly payment",moneyRM(extraMonthly)],["Estimated total monthly payment",moneyRM(totalMonthly)],["Is this house affordable?",affordability],["Income needed to afford this",moneyRM(requiredIncome)+"/month"],["How much I am paying extra",moneyRM(extraPaidApprox)+" over estimated payoff"],["Interest saved with extra payment",moneyRM(interestSaved)],["Estimated payoff time with extra",schedule.payoffMonths+" months"],["Break even time",breakEvenText]]),settleMonth=firstNumber(["earlySettlementMonth"]);if(Number.isFinite(settleMonth)&&settleMonth>0){const paidMonths=Math.min(Math.round(settleMonth),months);rows.push(["Estimated balance after month "+paidMonths,moneyRM(remainingBalance(principal,annualRate,months,paidMonths,extraMonthly))])}const normalPayoffYears=(noExtraSchedule.payoffMonths/12).toFixed(1),extraPayoffYears=(schedule.payoffMonths/12).toFixed(1),monthsSaved=Math.max(0,noExtraSchedule.payoffMonths-schedule.payoffMonths),yearlyPaymentTotal=12*totalMonthly,loanToValue=homePrice>0?principal/homePrice*100:0,downPaymentPercent=homePrice>0?downPayment/homePrice*100:0,costToIncomePercent=incomeMonthly>0?totalMonthly/incomeMonthly*100:0,yearsFloat=months/12,inflationAdjustedTotal=principalInterestValue/Math.pow(1.03,yearsFloat),assumedRent=Number.isFinite(currentMonthlyRent)?currentMonthlyRent:.75*totalMonthly,rentSourceText=Number.isFinite(currentMonthlyRent)?"Entered current rent":"Assumed comparable rent at 75% of buy monthly cost",buyVsRentGap=totalMonthly-assumedRent,flexiSuggestedExtra=extraMonthly>0?extraMonthly:Math.min(500,Math.max(100,.05*baseMonthly)),flexiScenario=mortgagePayoffSchedule(principal,annualRate,months,flexiSuggestedExtra),islamicMonthly=baseMonthly,islamicTotalProfit=Math.max(0,islamicMonthly*months-principal),islamicTotalSalePrice=principal+islamicTotalProfit,conventionalTotalRepayment=baseMonthly*months,islamicDifferenceAmount=(Math.max(0,conventionalTotalRepayment-principal),islamicTotalSalePrice-conventionalTotalRepayment),comparisonRows=(Math.abs(islamicDifferenceAmount)<1||(islamicDifferenceAmount>0?moneyRM(islamicDifferenceAmount):moneyRM(Math.abs(islamicDifferenceAmount))),[["Current loan",annualRate.toFixed(2)+"%",months+" months",moneyRM(baseMonthly),moneyRM(baseTotalInterest)],["Rate +1%",(annualRate+1).toFixed(2)+"%",months+" months",moneyRM(calculateLoanPayment(principal,annualRate+1,months)),moneyRM(calculateLoanPayment(principal,annualRate+1,months)*months-principal)],["Rate -1%",Math.max(0,annualRate-1).toFixed(2)+"%",months+" months",moneyRM(calculateLoanPayment(principal,Math.max(0,annualRate-1),months)),moneyRM(calculateLoanPayment(principal,Math.max(0,annualRate-1),months)*months-principal)]]),loanYearRows=yearCompareItems.map(function(item){const compareMonths=12*(Number(String(item.label).replace(/[^\d.]/g,""))||0),monthly=calculateLoanPayment(principal,annualRate,compareMonths);return[item.label,moneyRM(monthly),moneyRM(monthly*compareMonths-principal),moneyRM(monthly*compareMonths)]});!function(resultHtml){const panel=getOrCreateOutputPanel("loan");if(!panel)return null;panel.className="loan-style-output-panel calculator-clean-result loan-clean-result mortgage-modern-result-panel",panel.innerHTML='<div class="mortgage-modern-result-shell">'+(resultHtml||"")+'<div class="mortgage-result-actions mortgage-result-actions-final" aria-label="Mortgage result actions"><button type="button" class="mortgage-result-action-btn mortgage-result-copy-btn">Copy</button><button type="button" class="mortgage-result-action-btn mortgage-result-save-btn">Save</button><button type="button" class="mortgage-result-action-btn mortgage-result-share-btn">Share</button><button type="button" class="mortgage-result-action-btn mortgage-result-report-btn">Report</button></div></div>';const copyBtn=panel.querySelector(".mortgage-result-copy-btn"),saveBtn=panel.querySelector(".mortgage-result-save-btn"),shareBtn=panel.querySelector(".mortgage-result-share-btn"),reportBtn=panel.querySelector(".mortgage-result-report-btn");copyBtn&&(copyBtn.onclick=function(){copyText(cleanText(panel.innerText),copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile("mortgage-result-"+dateFileStamp()+".txt",cleanText(panel.innerText))}),shareBtn&&(shareBtn.onclick=function(){const text=cleanText(panel.innerText);navigator.share?navigator.share({title:"Mortgage result",text:text}).catch(function(){copyText(text,shareBtn)}):copyText(text,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport("loan",reportBtn)}),panel.hidden=!1,panel.style.setProperty("display","block","important"),panel.style.setProperty("visibility","visible","important"),hideNativeResultElements()}('<div class="mortgage-modern-output"><section class="mortgage-modern-section mortgage-breakdown-section"><h3>Monthly payment breakdown</h3>'+mortgageTable(["Payment part","Monthly value"],[["Principal + interest",moneyRM(baseMonthly)],["Property tax",moneyRM(taxMonthly)],["Insurance",moneyRM(insuranceMonthly)],["Other monthly fee",moneyRM(otherMonthly)],["Extra monthly payment",moneyRM(extraMonthly)],["Estimated total monthly payment",moneyRM(totalMonthly)]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-affordability-section"><h3>Affordability analysis</h3>'+mortgageTable(["Check","Result"],[["Is this house affordable?",affordability],["Monthly income entered",incomeMonthly>0?moneyRM(incomeMonthly):"Not provided"],["Income needed to afford this",moneyRM(requiredIncome)+"/month"],["Payment to income ratio",incomeMonthly>0?costToIncomePercent.toFixed(1)+"%":"Add income to calculate"],["Rule used","Payment should stay around 28% of monthly income"]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-insights-section"><h3>Loan insights</h3>'+mortgageTable(["Insight","Value"],[["Home price",moneyRM(homePrice)],["Down payment",moneyRM(downPayment)+" ("+downPaymentPercent.toFixed(1)+"%)"],["Loan principal",moneyRM(principal)],["Loan-to-value",loanToValue.toFixed(1)+"%"],["Principal + interest value",moneyRM(principalInterestValue)],["Total interest",moneyRM(baseTotalInterest)],["Yearly payment estimate",moneyRM(yearlyPaymentTotal)]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-extra-section"><h3>Extra payment analysis</h3>'+mortgageTable(["Extra payment item","Result"],[["Extra monthly payment",moneyRM(extraMonthly)],["Approx extra paid",moneyRM(extraPaidApprox)],["Interest saved",moneyRM(interestSaved)],["Normal payoff time",noExtraSchedule.payoffMonths+" months ("+normalPayoffYears+" years)"],["Payoff time with extra",schedule.payoffMonths+" months ("+extraPayoffYears+" years)"],["Time saved",monthsSaved+" months"]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-comparison-section"><h3>Comparison scenario</h3>'+mortgageTable(["Scenario","Rate","Term","Monthly P+I","Total interest"],comparisonRows,"mortgage-modern-table")+mortgageTable(["Loan term","Monthly P+I","Total interest","Total P+I"],loanYearRows,"mortgage-modern-table mortgage-loan-years-table")+'</section><section class="mortgage-modern-section mortgage-visual-section"><h3>Graph and visualizations</h3><div class="mortgage-modern-graph-grid"><div><h4>Different interest rates</h4>'+mortgageSimpleBarChart(interestChartItems,"monthly")+"</div><div><h4>Different loan years</h4>"+mortgageSimpleBarChart(yearCompareItems,"monthly")+"</div><div><h4>Amortization balance</h4>"+function(yearly){const items=(yearly=Array.isArray(yearly)?yearly:[]).slice(0,40).map(function(row){return{label:"Y"+row.year,balance:Number(row.balance)||0,display:moneyRM(row.balance)}});return items.length?mortgageSimpleBarChart(items,"balance"):'<p class="mortgage-chart-empty">Enter loan details to see amortization line graph.</p>'}(schedule.yearly)+'</div></div></section><section class="mortgage-modern-section mortgage-amortization-section"><h3>Amortization schedule</h3>'+mortgageTable(["Year","Principal paid","Interest paid","Remaining balance"],yearlyRows,"mortgage-modern-table mortgage-year-table")+'</section><section class="mortgage-modern-section mortgage-smart-section"><h3>Smart insight</h3>'+mortgageTable(["Smart insight","Meaning"],[["Break-even time",breakEvenText],["Best quick improvement",extraMonthly>0?"Your extra payment is reducing interest and payoff time.":"Try adding a small extra monthly payment to reduce interest."],["Main cost driver",baseTotalInterest>.5*principal?"Interest is a major part of total cost.":"Principal is the main part of total cost."],["Affordability note",affordability]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-inflation-section"><h3>Inflation adjusted analysis</h3>'+mortgageTable(["Inflation item","Estimate"],[["Assumed inflation",3..toFixed(1)+"% per year"],["Years assumed",yearsFloat.toFixed(1)+" years"],["Nominal principal + interest",moneyRM(principalInterestValue)],["Inflation-adjusted equivalent",moneyRM(inflationAdjustedTotal)],["Long-term effect","Future payments may feel cheaper if income rises with inflation."]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-rentbuy-section"><h3>Rent buy analysis</h3>'+mortgageTable(["Rent vs buy item","Estimate"],[["Estimated buy monthly cost",moneyRM(totalMonthly)],["Rent used in analysis",moneyRM(assumedRent)+"/month"],["Rent source",rentSourceText],["Buy minus rent difference",moneyRM(buyVsRentGap)+"/month"],["Simple guidance",buyVsRentGap<=0?"Buying is cheaper than rent used in the analysis.":"Buying costs more monthly than rent, but may build ownership equity."]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-flexi-section"><h3>Flexi loan analysis</h3>'+mortgageTable(["Flexi loan item","Estimate"],[["Flexible extra payment tested",moneyRM(flexiSuggestedExtra)+"/month"],["Estimated payoff time",flexiScenario.payoffMonths+" months"],["Estimated interest saved",moneyRM(Math.max(0,noExtraSchedule.totalInterest-flexiScenario.totalInterest))],["Flexi loan note","A flexi loan can help if extra deposits reduce principal or interest calculation."]],"mortgage-modern-table")+"</section></div>"),saveCurrentReport("loan",{monthlyPayment:moneyRM(baseMonthly),totalInterest:moneyRM(baseTotalInterest),totalPayment:moneyRM(principalInterestValue),affordability:affordability,incomeNeeded:moneyRM(requiredIncome),breakEvenTime:breakEvenText})}function calculatePersonalLoan(){const amount=firstNumber(["amount","loanAmount","loanPrincipal"]),annualRate=firstNumber(["interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["years","loanYears","loanTerm","term"]),rawTerm=termInput?numberFromString(termInput.value):NaN;if(!Number.isFinite(amount)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||amount<=0||annualRate<0||rawTerm<=0)return;const label=termInput?getInputLabel(termInput):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm);if(!Number.isFinite(months)||months<=0)return;const monthlyPayment=calculateLoanPayment(amount,annualRate,months),totalPayment=monthlyPayment*months,totalInterest=totalPayment-amount;renderResultPanel("personalLoan",[["Loan amount",moneyRM(amount)],["Annual interest rate",annualRate.toFixed(2)+"%"],["Loan term",months+" months"],["Monthly payment",moneyRM(monthlyPayment)],["Total interest",moneyRM(totalInterest)],["Total payment",moneyRM(totalPayment)]],'<div class="calculator-report-summary-boxes personal-loan-result-summary"><div class="calculator-report-summary-card calculator-report-monthly-card"><div class="calculator-report-summary-label">Monthly payment</div><div class="calculator-report-summary-value">'+moneyRM(monthlyPayment)+'</div></div><div class="calculator-report-summary-card calculator-report-total-card"><div class="calculator-report-summary-label">Total payment</div><div class="calculator-report-summary-value">'+moneyRM(totalPayment)+'</div></div><div class="calculator-report-summary-card calculator-report-interest-card"><div class="calculator-report-summary-label">Total interest</div><div class="calculator-report-summary-value">'+moneyRM(totalInterest)+"</div></div></div>"),saveCurrentReport("personalLoan",{monthlyPayment:moneyRM(monthlyPayment),totalInterest:moneyRM(totalInterest),totalPayment:moneyRM(totalPayment)})}function tableRows(lines){return(lines||[]).map(function(line){return"<tr><td>"+escapeHtml(line.label)+"</td><td>"+escapeHtml(line.value)+"</td></tr>"}).join("")}function cleanResultHtml(html){const template=document.createElement("template");return template.innerHTML=html||"",template.content.querySelectorAll("script, iframe, object, embed, link, meta, button, a").forEach(function(element){element.remove()}),template.content.querySelectorAll("*").forEach(function(element){Array.from(element.attributes).forEach(function(attribute){const name=attribute.name.toLowerCase(),value=String(attribute.value||"").trim().toLowerCase();(name.startsWith("on")||value.startsWith("javascript:"))&&element.removeAttribute(attribute.name)})}),template.innerHTML}function ageReportFlowHtml(rows){rows=Array.isArray(rows)?rows:[];const groups=[{title:"Birth & calendar",note:"Where the age calculation starts.",match:/name|date range|day of week born|born date in islamic|born date in chinese/i},{title:"Current age",note:"Main age values for the selected date.",match:/exact age|normal age|asian age|age in .* year|days old|seconds old/i},{title:"Birthday & milestones",note:"Upcoming birthday and important age milestones.",match:/next birthday countdown|next age live countdown|seconds to next age|retirement|legal age|leap year age/i},{title:"Life summary",note:"Estimated time already lived, slept, breathed, and heartbeats.",match:/days spent alive|estimated sleep time|breaths taken|heartbeats lived/i},{title:"Zodiac",note:"Western and Chinese zodiac details.",match:/western zodiac|chinese zodiac/i},{title:"Famous birthdays & historical event",note:"People and events connected to the same month and day.",match:/famous person|famous celebrity|famous sports star|famous historical figure|historical event/i},{title:"Space & moon view",note:"Age translated into planet years and moon cycles.",match:/age on other planets|moon cycles experienced/i}],used=new Set;function makeStep(group,groupRows,index){return groupRows.length?'<section class="age-report-flow-step"><div class="age-report-flow-number">'+(index+1)+'</div><div class="age-report-flow-content"><h3>'+escapeHtml(group.title)+"</h3><p>"+escapeHtml(group.note)+'</p><div class="calculator-report-table-scroll"><table class="age-report-flow-table"><tbody>'+tableRows(groupRows)+"</tbody></table></div></div></section>":""}let html=groups.map(function(group,index){return makeStep(group,function(group){return rows.filter(function(row,index){if(!row||used.has(index))return!1;const label=String(row.label||"");return!!group.match.test(label)&&(used.add(index),!0)})}(group),index)}).join("");const remaining=rows.filter(function(row,index){return row&&!used.has(index)});return remaining.length&&(html+=makeStep({title:"Other details",note:"Additional age information.",match:/.*/},remaining,groups.length)),'<div class="age-report-flow">'+html+"</div>"}function bmiReportFlowHtml(rows){function label(row){return String((Array.isArray(row)?row[0]:row.label)||"")}function tableRowsFor(groupRows){return groupRows.map(function(row){return"<tr><th>"+escapeHtml(label(row))+"</th><td>"+escapeHtml(function(row){return String((Array.isArray(row)?row[1]:row.value)||"")}(row))+"</td></tr>"}).join("")}rows=Array.isArray(rows)?rows:[];const used=new Set;function makeStep(group,groupRows){return groupRows.length?'<section class="bmi-report-flow-step"><div class="bmi-report-flow-head"><h3>'+escapeHtml(group.title)+"</h3><p>"+escapeHtml(group.note)+'</p></div><div class="calculator-report-table-scroll"><table class="bmi-report-flow-table"><tbody>'+tableRowsFor(groupRows)+"</tbody></table></div></section>":""}let html=[{title:"1. BMI summary",note:"Main BMI reading and category.",match:/^BMI$|^BMI category$|^Difference to healthy range$/i},{title:"2. Health overview",note:"Healthy range, waist check, and risk summary.",match:/Healthy weight range|Health risk|Waist-to-height ratio|Waist-to-height status|Neck circumference|Wrist size|Shoulder width|Hip circumference/i},{title:"3. Calories & body composition",note:"Daily calorie estimate and body fat estimate.",match:/Calories\/day|Body fat estimate|Body type comment|Frame size|Fat distribution|Body shape|Somatotype tendency|Suggested exercise|Suggested foods|Physique \/ body type/i},{title:"4. Goal planning",note:"Target weight and estimated timeline.",match:/Goal timeline|Healthy\?|Best|Target weight|Time goal/i},{title:"5. Input profile",note:"Profile details used for the calculation.",match:/Unit|Name|Age range|Gender|Activity level/i}].map(function(group){return makeStep(group,function(group){return rows.filter(function(row,index){return!(!row||used.has(index)||!group.match.test(label(row))||(used.add(index),0))})}(group))}).join("");const remaining=rows.filter(function(row,index){return row&&!used.has(index)});return remaining.length&&(html+=makeStep({title:"6. Other details",note:"Additional BMI information.",match:/.*/},remaining)),'<div class="bmi-report-flow">'+html+"</div>"}function reportResultHtml(report){if(report&&"loan"===report.type)return function(report){const template=document.createElement("template");template.innerHTML=cleanResultHtml(report?report.resultHtml:""),template.content.querySelectorAll(".mortgage-modern-result-title, .loan-panel-title").forEach(function(title){/^result$/i.test(cleanText(title.textContent))&&title.remove()});const shell=template.content.querySelector(".mortgage-modern-result-shell");return shell?shell.innerHTML:template.innerHTML}(report);if(report&&"age"===report.type){if(Array.isArray(report.resultLines)&&report.resultLines.length)return ageReportFlowHtml(report.resultLines);if(report.metrics&&Array.isArray(report.metrics.resultRows)&&report.metrics.resultRows.length)return ageReportFlowHtml(report.metrics.resultRows)}if(report&&"bmi"===report.type){if(Array.isArray(report.resultLines)&&report.resultLines.length)return bmiReportFlowHtml(report.resultLines);if(report.metrics&&Array.isArray(report.metrics.resultRows)&&report.metrics.resultRows.length)return bmiReportFlowHtml(report.metrics.resultRows)}return cleanResultHtml(report?report.resultHtml:"")}function renderReportPage(report){document.body.classList.add("calculator-report-view","mortgage-report-clean-view"),$$(".calculator, .history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box, .instruction-box, .pc-what-slot, .instruction-what-box, #pcHelpQuestionButton, #pcQuestionOverlayButton, #universalLoanStyleOutput, #loanExternalOutput, #personalLoanExternalOutput, .calculator-clean-result, .age-clean-result, .age-point-output, #ageResult").forEach(function(element){element.style.setProperty("display","none","important")});const old=byId("calculatorReportPage");old&&old.remove();const section=document.createElement("section");section.id="calculatorReportPage",section.className="calculator-report-page mortgage-fast-report-page",section.innerHTML="<h1>"+escapeHtml({age:"Age Report",bmi:"BMI Report",loan:"Mortgage Report",personalLoan:"Personal Loan Report",discount:"Discount Report",percentage:"Percentage Report",compound:"Compound Interest Report"}[report.type]||"Calculator Report")+'</h1><p class="calculator-report-date"><strong>Generated:</strong> '+escapeHtml(report.createdAt||"")+"</p>"+function(report){return["loan","personalLoan"].includes(report.type)&&report.metrics?'<div class="calculator-report-summary-boxes"><div class="calculator-report-summary-card calculator-report-monthly-card"><div class="calculator-report-summary-label">Monthly payment</div><div class="calculator-report-summary-value">'+escapeHtml(report.metrics.monthlyPayment||"-")+'</div></div><div class="calculator-report-summary-card calculator-report-interest-card"><div class="calculator-report-summary-label">Total interest</div><div class="calculator-report-summary-value">'+escapeHtml(report.metrics.totalInterest||"-")+'</div></div><div class="calculator-report-summary-card calculator-report-total-card"><div class="calculator-report-summary-label">Total payment</div><div class="calculator-report-summary-value">'+escapeHtml(report.metrics.totalPayment||"-")+"</div></div></div>":""}(report)+'<div class="calculator-report-card"><h2>Inputs</h2><div class="calculator-report-table-scroll"><table><tbody>'+tableRows(report.inputLines)+'</tbody></table></div></div><div class="calculator-report-card"><div class="calculator-report-result">'+reportResultHtml(report)+'</div></div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn calculator-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn calculator-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn calculator-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn calculator-report-share-btn">Share report</button></div>';($("main")||document.body).insertAdjacentElement("afterbegin",section);const backButton=$(".calculator-report-back-btn",section);backButton&&(backButton.onclick=function(){window.location.href=window.location.href.split("#")[0]});const copyButton=$(".calculator-report-copy-btn",section);copyButton&&(copyButton.onclick=function(){copyText(cleanText(section.innerText),copyButton)});const saveButton=$(".calculator-report-save-btn",section);saveButton&&(saveButton.onclick=function(){!function(section,button){const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calculator Report</title><style>body{margin:0;background:#f6f8f4;font-family:Inter,Segoe UI,Arial,sans-serif;padding:24px;color:#24342d}.report{box-sizing:border-box;max-width:1100px;margin:0 auto;padding:28px;background:#fff;border:1px solid #d8e4dc;border-radius:22px;box-shadow:0 18px 44px rgba(35,49,41,.10)}h1{margin:0 0 8px;color:#143b32;font-size:32px;line-height:1.12}h2{margin:22px 0 12px;color:#143b32;font-size:22px}.calculator-report-card{margin-top:18px;padding:20px;background:#fbfcfa;border:1px solid #dce7df;border-radius:18px}.calculator-report-result{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.calculator-report-table-scroll{width:100%;overflow-x:auto;border:1px solid #dce7df;border-radius:14px;background:#fff}table{width:100%;min-width:520px;border-collapse:collapse;background:#fff}td,th{border-bottom:1px solid #e3ece6;padding:12px 14px;text-align:left;vertical-align:top;line-height:1.45}th,tr:first-child td:first-child{background:#eef6f2;color:#143b32;font-weight:850}.calculator-report-summary-boxes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:18px 0}.calculator-report-summary-card{padding:16px;background:#f4faf6;border:1px solid #d4e5db;border-radius:16px}.calculator-report-summary-label{color:#64796f;font-weight:760}.calculator-report-summary-value{color:#123c34;font-size:24px;font-weight:900}.age-report-flow,.bmi-report-flow{display:grid;gap:14px}.age-report-flow-step,.bmi-report-flow-step{display:grid;grid-template-columns:48px 1fr;gap:14px;padding:16px;background:#fff;border:1px solid #dce7df;border-radius:16px}.age-report-flow-number{display:grid;place-items:center;width:42px;height:42px;color:#fff;background:#2c6a5b;border-radius:12px;font-weight:900}.bmi-report-flow-step{grid-template-columns:1fr}.calculator-report-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}.calculator-report-action-btn{min-height:48px;color:#fff;background:#2c6a5b;border:1px solid #2c6a5b;border-radius:12px;font-weight:850}@media(max-width:700px){body{padding:12px}.report{padding:16px;border-radius:16px}.calculator-report-summary-boxes,.calculator-report-actions{grid-template-columns:1fr}.age-report-flow-step{grid-template-columns:1fr}table{min-width:420px}}</style></head><body><div class="report">'+section.innerHTML+"</div></body></html>",blob=new Blob([html],{type:"text/html;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download="calculator-report.html",document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},500),setButtonState(button,"Saved!")}(section,saveButton)});const shareButton=$(".calculator-report-share-btn",section);shareButton&&(shareButton.onclick=function(){!function(section,button){const url=window.location.href;navigator.share?navigator.share({title:"Calculator Report",text:cleanText(section.innerText).slice(0,500),url:url}).catch(function(){copyText(url,button)}):copyText(url,button)}(section,shareButton)})}function openReportFromHash(){if(!window.location.hash.startsWith("#calc-report="))return!1;try{return renderReportPage(JSON.parse(function(text){const normal=String(text||"").replace(/-/g,"+").replace(/_/g,"/"),padded=normal+"===".slice((normal.length+3)%4),binary=atob(padded),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return(new TextDecoder).decode(bytes)}(window.location.hash.replace("#calc-report=","")))),!0}catch(error){return console.error("Could not open report",error),!1}}const PAGE_DATA={basic:{what:"Use this for quick everyday maths such as addition, subtraction, multiplication, division, powers, and square root.",how:"Type or tap the numbers, choose the operator, then press =. Use AC to clear and ← to delete one character.",formula:"It follows the normal order of operations: brackets and powers first, then multiplication/division, then addition/subtraction.",example:"8 + 2 × 3 = 14 because multiplication is calculated before addition.",references:[["Order of operations","Standard arithmetic uses a fixed order so calculations are consistent.","https://www.purplemath.com/modules/orderops.htm"],["General note","For important money, school, or work calculations, recheck the result with your own records."]]},scientific:{what:"Use this for advanced maths such as powers, roots, trigonometry, logarithms, brackets, and scientific notation.",how:"Enter the expression carefully, check brackets, then calculate. Use the clear/delete buttons if you make a mistake.",formula:"Scientific functions follow standard calculator conventions. Trigonometry uses the selected angle mode when available.",example:"sqrt(144) gives 12. sin(30°) gives 0.5 when degree mode is used.",references:[["Scientific calculator functions","Use standard math references for trigonometry, logarithms, roots, and powers.","https://en.wikipedia.org/wiki/Scientific_calculator"],["General note","Make sure you use the correct angle mode for trigonometry questions."]]},percentage:{what:"Use this to find a percentage of a number, such as discounts, marks, commissions, and simple ratios.",how:"Enter the percentage and the number. The result updates automatically when enough information is entered.",formula:"Result = percentage ÷ 100 × number.",example:"20% of 150 = 30.",references:[["Percentage meaning","A percentage means a value expressed out of 100.","https://en.wikipedia.org/wiki/Percentage"],["General note","For taxes, fees, and financial decisions, confirm the exact percentage rule with the official provider."]]},unitConverter:{what:"Use this to convert common units such as length, weight, temperature, area, volume, and speed.",how:"Choose the unit type, enter the value, choose the starting unit and target unit, then read the converted result.",formula:"The calculator uses fixed conversion factors between supported units. Temperature conversions also include an offset.",example:"1 kilometre = 1000 metres. 1 inch = 2.54 centimetres.",references:[["Unit conversion","NIST provides reference information for SI units and conversion factors.","https://www.nist.gov/pml/owm/metric-si/si-units"],["General note","For medical, engineering, or legal measurements, always confirm the required unit standard."]]},age:{what:"Use this to calculate age from a birth date, including years, months, days, birthday countdown, and related age details.",how:"Enter the birth date. Add a target date if you want age on a specific day instead of today.",formula:"Age is calculated by comparing the birth date with the target date and counting completed years, months, and days.",example:"A person born on 15 January 2000 can see exact age, next birthday countdown, and days lived.",references:[["Age calculation","Age is commonly calculated by comparing a date of birth with the current or target date.","https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"],["General note","Legal age rules can differ by country, state, or institution. Confirm with the relevant authority."]]},bmi:{what:"Use this to estimate Body Mass Index and waist-to-height ratio from your height, weight, and optional body details.",how:"Choose SI or US units, enter weight and height, then optionally add waist, age, gender, activity level, and target weight.",formula:"SI BMI = weight kg ÷ height m². US BMI = weight lb ÷ height in² × 703. Waist-to-height ratio = waist ÷ height.",example:"70 kg and 170 cm gives a BMI of about 24.2.",references:[["BMI formula","CDC lists metric and US BMI formulas and explains BMI as a screening measure.","https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"],["Health note","BMI is only a screening estimate and is not a medical diagnosis. Speak with a health professional for personal advice."]]},salary:{what:"Use this to estimate gross salary, deductions, net monthly salary, and estimated yearly take-home income.",how:"Enter gross salary and optional deductions such as EPF, SOCSO, tax, or other monthly deductions.",formula:"Net salary = gross salary − total deductions.",example:"If gross salary is RM 5,000 and deductions are RM 800, estimated net salary is RM 4,200.",references:[["Salary estimate","Use your payslip, employment contract, and official deduction rates for accurate salary information."],["General note","This calculator is an estimate only and may not include every allowance, deduction, tax rule, or employer policy."]]},gajiPenjawatAwam:{what:"Use this to estimate Malaysian public-sector salary based on basic pay and common allowance/deduction inputs.",how:"Enter basic salary, allowances, and deductions. Review the estimated gross and net salary output.",formula:"Estimated net salary = basic salary + allowances − deductions.",example:"If salary plus allowances is RM 4,000 and deductions are RM 500, estimated net salary is RM 3,500.",references:[["Official salary information","Refer to official government circulars, JPA information, payslips, and department rules for accurate values.","https://www.jpa.gov.my/"],["General note","This calculator is only an estimate and does not replace official salary statements."]]},tax:{what:"Use this to estimate tax from income and deduction inputs.",how:"Enter annual income and any supported deduction or relief fields. Review the estimated taxable amount and tax output.",formula:"Estimated tax is calculated from taxable income after supported deductions, using the calculator’s included rate assumptions.",example:"If income is RM 60,000 and deductions are RM 10,000, the calculator estimates tax from RM 50,000 taxable income.",references:[["Official tax rules","Always confirm current tax rates, reliefs, and filing rules with LHDN or your local tax authority.","https://www.hasil.gov.my/"],["General note","Tax rules change over time. This calculator is for planning only, not official tax advice."]]},currencyConverter:{what:"Use this to convert an amount from one currency to another using the exchange rate entered in the form.",how:"Enter the amount, choose the from/to currencies, and enter or confirm the exchange rate.",formula:"Converted amount = original amount × exchange rate.",example:"If RM 100 is converted at a rate of 0.21, the result is 21 in the target currency.",references:[["Exchange rates","Exchange rates change often. Confirm live rates with your bank, payment provider, or central bank.","https://www.bnm.gov.my/exchange-rates"],["General note","Real conversions may include spread, fees, transfer charges, or card provider rates."]]},discount:{what:"Use this to calculate the final price after a discount and the amount you save.",how:"Enter the original price and discount percentage. The result updates automatically.",formula:"Savings = original price × discount ÷ 100. Final price = original price − savings.",example:"If the price is 100 and the discount is 20%, savings are 20 and final price is 80.",references:[["Discount formula","A percentage discount removes a percentage of the original price.","https://www.calculator.net/"],["General note","For shopping, check whether tax, shipping, service fee, or voucher conditions apply."]]},inflation:{what:"Use this to estimate how inflation changes buying power or future cost over time.",how:"Enter the starting amount, inflation rate, and number of years.",formula:"Future value = present value × (1 + inflation rate) ^ years.",example:"RM 1,000 at 3% inflation for 5 years becomes about RM 1,159.",references:[["Inflation estimate","Inflation is usually measured with price indexes and can vary by country and time period.","https://www.bnm.gov.my/"],["General note","This is a simplified estimate. Real inflation differs by item, location, and year."]]},compound:{what:"Use this to estimate how money grows when interest is added repeatedly over time.",how:"Enter principal, annual rate, time, and compounding frequency. Then calculate the future value and interest earned.",formula:"A = P(1 + r/n)^(nt). Compound interest = A − P.",example:"P = 1000, r = 5%, t = 10 years, n = monthly gives a future value of about 1647.01.",references:[["Compound interest","The standard compound interest formula uses principal, rate, time, and compounding frequency.","https://www.investopedia.com/terms/c/compoundinterest.asp"],["General note","Actual investment returns, fees, taxes, and bank rules can change the final result."]]},loan:{what:"Use this to estimate home loan monthly payment, total interest, total payment, and optional home ownership costs.",how:"Enter property/loan amount, interest rate, term, and any optional taxes, insurance, fees, extra payment, or settlement details.",formula:"Monthly payment = P × r × (1+r)^n ÷ ((1+r)^n − 1), where r is monthly interest rate and n is number of monthly payments.",example:"A RM 300,000 mortgage at 4% yearly for 360 months gives an estimated monthly payment using the amortization formula.",references:[["Mortgage formula","Mortgage estimates normally use loan amount, interest rate, and loan term.","https://www.investopedia.com/mortgage-calculator-5084794"],["General note","Real mortgage offers depend on bank approval, fees, insurance, legal cost, and property rules."]]},personalLoan:{what:"Use this to estimate personal loan monthly instalment, total interest, and total repayment.",how:"Enter loan amount, annual interest rate, and loan term in months.",formula:"Monthly payment = P × r × (1+r)^n ÷ ((1+r)^n − 1), where r is monthly interest rate and n is number of payments.",example:"A RM 10,000 loan at 5% yearly for 60 months gives an estimated monthly payment using the amortization formula.",references:[["Amortized loan","Many fixed-payment loans are estimated with an amortization formula.","https://www.investopedia.com/terms/a/amortized_loan.asp"],["General note","The bank’s actual repayment may include fees, insurance, stamp duty, or different rate rules."]]},loanComparison:{what:"Use this to compare two loan options side by side and see which one may cost less overall.",how:"Enter the shared loan amount, then enter rate and term details for option A and option B.",formula:"Each loan option uses the amortized payment formula, then compares monthly payment and total interest.",example:"Compare a 5-year loan at 6% with a 7-year loan at 5.5% to see the payment and interest difference.",references:[["Loan comparison","Loan cost depends on rate, term, principal, fees, and payment schedule."],["General note","Always compare effective interest rate, fees, penalties, insurance, and total repayment from the lender."]]},debtPayoff:{what:"Use this to estimate how long it may take to pay off a debt and how much interest may be paid.",how:"Enter debt balance, interest rate, and monthly payment.",formula:"The calculator estimates repayment by applying interest and subtracting your monthly payment until the balance reaches zero.",example:"If your balance is RM 5,000 and you pay RM 500 monthly, the calculator estimates payoff time and interest.",references:[["Debt repayment","Debt payoff depends on balance, rate, payment amount, and fees."],["General note","Minimum payments can extend payoff time. Confirm exact repayment details with your lender or card issuer."]]},creditCardPayoff:{what:"Use this to estimate how long it may take to pay off a credit-card balance.",how:"Enter card balance, APR, and planned monthly payment.",formula:"The calculator applies monthly interest from APR, subtracts your payment, and estimates the months to payoff.",example:"A RM 3,000 balance at 18% APR with RM 300 monthly payment estimates payoff time and interest.",references:[["Credit card payoff","APR, balance, fees, and payment amount affect credit-card payoff time."],["General note","Actual card interest can differ because of billing cycles, late fees, cash advances, and minimum payment rules."]]},creditCardInterest:{what:"Use this to estimate credit-card interest for a balance over a selected number of days.",how:"Enter card balance, APR, and the number of days interest is charged.",formula:"Estimated interest = balance × APR ÷ 100 × days ÷ 365.",example:"RM 2,000 at 18% APR for 30 days gives about RM 29.59 interest.",references:[["Credit card interest","Card interest can use daily periodic rates and billing-cycle rules."],["General note","Check your card statement or issuer terms for the exact interest method, grace period, and fees."]]},rentalYield:{what:"Use this to estimate rental yield from property price and rent.",how:"Enter property price, monthly rent, and optional annual costs if available.",formula:"Gross rental yield = yearly rent ÷ property price × 100. Net yield also subtracts supported costs.",example:"RM 2,000 monthly rent is RM 24,000 yearly. If property price is RM 500,000, gross yield is 4.8%.",references:[["Rental yield","Rental yield compares annual rent with property price."],["General note","Real returns may include vacancy, maintenance, assessment, management fee, tax, insurance, and financing cost."]]},fuelCost:{what:"Use this to estimate trip fuel cost from distance, vehicle fuel efficiency, and fuel price.",how:"Enter trip distance, fuel consumption/efficiency, and fuel price.",formula:"Fuel used = distance ÷ efficiency. Fuel cost = fuel used × fuel price. The exact formula depends on the selected efficiency unit.",example:"A 200 km trip at 10 km/L uses about 20 L. If fuel is RM 2.05/L, cost is about RM 41.",references:[["Fuel cost estimate","Fuel cost depends on distance, vehicle efficiency, traffic, driving style, and fuel price."],["General note","Actual cost may change with route, tyre pressure, load, road conditions, and fuel-price changes."]]}};function makeInfoBox(className,title,text){const box=document.createElement("div");return box.className=className,box.innerHTML="<h3>"+escapeHtml(title)+"</h3><p>"+escapeHtml(text)+"</p>",box}function buildInstructionLayout(){const type=function(){const path=pathText(),bodyPage=document.body&&document.body.dataset?String(document.body.dataset.page||"").toLowerCase():"";return path.includes("credit-card-interest-calculator")||"creditcardinterest"===bodyPage?"creditCardInterest":path.includes("credit-card-payoff-calculator")||"creditcardpayoff"===bodyPage?"creditCardPayoff":path.includes("loan-comparison-calculator")||"loancomparison"===bodyPage?"loanComparison":path.includes("debt-payoff-calculator")||"debtpayoff"===bodyPage?"debtPayoff":path.includes("personal-loan-calculator")||"personal-loan"===bodyPage?"personalLoan":path.includes("gaji-penjawat-awam-calculator")||"gajipenjawatawam"===bodyPage?"gajiPenjawatAwam":path.includes("currency-converter")||"currencyconverter"===bodyPage?"currencyConverter":path.includes("unit-converter-calculator")||"unitconverter"===bodyPage?"unitConverter":path.includes("rental-yield-calculator")||"rentalyield"===bodyPage?"rentalYield":path.includes("fuel-cost-calculator")||"fuelcost"===bodyPage?"fuelCost":path.includes("salary-calculator")||"salary"===bodyPage?"salary":path.includes("scientific-calculator")||"scientific"===bodyPage?"scientific":path.includes("tax-calculator")||"tax"===bodyPage?"tax":path.includes("inflation-calculator")||"inflation"===bodyPage?"inflation":getPageType()}(),data=PAGE_DATA[type],main=$("main");if(!main||!data||!$(".calculator",main)||main.classList.contains("calculator-box"))return;if($$(":scope > .universal-help-panel",main).length)return;main.classList.add("has-instructions"),$$(":scope > .instruction-box, :scope > .pc-what-slot, :scope > .extra-help-question-button",main).forEach(function(element){element.remove()});const box=document.createElement("aside");box.className="instruction-box universal-help-panel",box.setAttribute("aria-label","Instructions and references"),box.appendChild(makeInfoBox("instruction-section instruction-what-box","What does this calculator do?",data.what));const title=document.createElement("h2");title.className="instruction-main-title",title.textContent="Instructions",box.appendChild(title),box.appendChild(makeInfoBox("instruction-section instruction-how-box","How to use it",data.how)),box.appendChild(makeInfoBox("instruction-section instruction-formula-box","Formula used",data.formula)),box.appendChild(makeInfoBox("instruction-section instruction-example-box","Example calculation",data.example)),box.appendChild(function(type){const items=function(type){return{basic:[["Can I paste numbers into the display?","Yes. You can paste a number or expression into the display, then press Enter or = to calculate."],["Does it follow normal math order?","Yes. Brackets and powers are handled before multiplication, division, addition, and subtraction."],["Can I use square root?","Yes. Use the square root button or paste a square-root expression supported by the calculator."]],age:[["Why is exact age different from normal age?","Exact age breaks your age into years, months, days, hours, and minutes. Normal age usually counts full completed years only."],["What does next birthday countdown mean?","It shows how much time is left until your next birthday or upcoming age."],["Are famous birthdays and historical events exact?","They are helpful reference items based on the selected date, but they should be treated as general information."]],bmi:[["Is BMI a diagnosis?","No. BMI is a screening estimate. It does not replace advice from a doctor or health professional."],["Why add waist-to-height ratio?","Waist-to-height ratio gives extra context about body fat distribution and possible health risk."],["What does goal timeline mean?","It estimates how fast you may need to lose or gain weight based on your target weight and selected time goal."]],loan:[["Is this a mortgage approval result?","No. It is an estimate only. Banks may use credit score, debt commitments, income proof, property type, and other rules."],["What is included in monthly payment?","The calculator can include principal, interest, property tax, insurance, other monthly fees, and extra payments when provided."],["Why do results change when I add extra payment?","Extra payment can reduce remaining principal faster, which may reduce total interest and shorten the payoff time."]],personalLoan:[["Is this the bank’s final monthly payment?","No. It is an estimate. The real payment may include bank fees, insurance, taxes, or different interest rules."],["What loan details are needed?","Loan amount, interest rate, and loan term are the main inputs needed for the estimate."],["What does total interest mean?","It is the estimated interest paid over the full loan term if payments follow the schedule."]],discount:[["What is final price?","Final price is the original price minus the discount amount."],["What is savings?","Savings is the amount removed from the original price by the discount."],["Can I use this for sale items?","Yes. Enter the original price and discount percentage to estimate the sale price."]],percentage:[["What does percentage of a number mean?","It means finding a part of a number based on a value out of 100."],["Example: what is 20% of 150?","20% of 150 is 30 because 20 ÷ 100 × 150 = 30."],["Can I use decimals?","Yes. Decimal percentages and decimal numbers can be used."]],compound:[["What is compound interest?","Compound interest means interest is added to the balance, then future interest is calculated on the new larger balance."],["What does compounding frequency mean?","It means how often interest is added, such as yearly, monthly, or daily."],["Why is compound interest different from simple interest?","Simple interest is calculated only on the original principal. Compound interest grows on both principal and accumulated interest."]]}[type]||[]}(type),box=document.createElement("section");if(box.className="instruction-section instruction-faq-box",box.innerHTML="<h3>FAQs</h3>",!items.length)return box.innerHTML+="<p>No FAQs available for this calculator yet.</p>",box;const list=document.createElement("div");return list.className="calculator-faq-list",items.forEach(function(item,index){const details=document.createElement("details");details.className="calculator-faq-item",0===index&&(details.open=!0);const summary=document.createElement("summary");summary.textContent=item[0];const answer=document.createElement("p");answer.textContent=item[1],details.appendChild(summary),details.appendChild(answer),list.appendChild(details)}),box.appendChild(list),box}(type));const referenceBox=document.createElement("section");referenceBox.className="reference-box",referenceBox.innerHTML='<h2 class="reference-main-title">References</h2><div class="reference-scroll"></div>';const scroll=$(".reference-scroll",referenceBox);data.references.forEach(function(item){const card=document.createElement("div");card.className="reference-card",card.innerHTML="<h3>"+escapeHtml(item[0])+"</h3><p>"+escapeHtml(item[1])+'</p><a href="'+escapeHtml(item[2])+'" target="_blank" rel="noopener noreferrer">Open source</a>',scroll.appendChild(card)}),box.appendChild(referenceBox),main.appendChild(box)}function readyToCalculate(type){return"age"===type?!!firstValue(["birthdate"]):"bmi"===type?!!firstValue(["weight","bmiWeight"])&&!!firstValue(["height","bmiHeight"]):"loan"===type||"personalLoan"===type?!!firstValue(["amount","loanAmount","loanPrincipal"])&&!!firstValue(["interest","loanRate","interestRate","annualRate"])&&!!firstValue(["years","loanYears","loanTerm","term"]):"discount"===type?!!firstValue(["price","originalPrice","amount"])&&!!firstValue(["discount","discountRate"]):"percentage"===type?!!firstValue(["percentage","percent"])&&!!firstValue(["number","amount","value"]):"compound"===type&&(!!firstValue(["principal","compoundPrincipal","amount"])&&!!firstValue(["rate","compoundRate","interest","interestRate"])&&!!firstValue(["years","compoundYears","time"]))}function scheduleAutoCalculate(){const type=getPageType();isReportType(type)&&(clearTimeout(autoTimer),autoTimer=setTimeout(function(){if(readyToCalculate(type)&&!autoRunning){autoRunning=!0;try{!function(type){"age"===type?calculateAge():"bmi"===type?calculateBMI():"loan"===type?calculateLoan():"personalLoan"===type?calculatePersonalLoan():"discount"===type?calculateDiscount():"percentage"===type?calculatePercentage():"compound"===type&&calculateCompound()}(type)}finally{setTimeout(function(){autoRunning=!1},120)}}},2e3))}function hideCalculateButtons(){isReportType(getPageType())&&$$(".calculator button, main button").forEach(function(button){(function(button){if(!button)return!1;if(button.closest("#navbar"))return!1;if(button.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box"))return!1;if(button.closest(".calculator-report-actions"))return!1;const text=lower(button.textContent),id=lower(button.id||""),onclick=lower(button.getAttribute("onclick")||"");return"unittogglebtn"!==id&&!/clear|copy|save|share|back|optional|settlement/.test(text)&&(text.includes("calculate")||id.includes("calculate")||onclick.includes("calculate"))})(button)&&(button.style.setProperty("display","none","important"),button.setAttribute("aria-hidden","true"),button.tabIndex=-1)})}function fallbackCopy(text){const textarea=document.createElement("textarea");textarea.value=text,textarea.style.position="fixed",textarea.style.left="-9999px",textarea.style.top="-9999px",document.body.appendChild(textarea),textarea.focus(),textarea.select(),document.execCommand("copy"),textarea.remove()}async function copyText(text,button){const value=String(text||"").trim();if(value)try{navigator.clipboard&&window.isSecureContext?await navigator.clipboard.writeText(value):fallbackCopy(value),setButtonState(button,"Copied!")}catch{try{fallbackCopy(value),setButtonState(button,"Copied!")}catch{setButtonState(button,"Failed")}}}function setButtonState(button,text){if(!button)return;const old=button.dataset.originalText||button.textContent||"Copy";button.dataset.originalText=old,button.textContent=text,setTimeout(function(){button.textContent=old},1100)}function init(){if(function(){const type=getPageType();type&&(["basic-page","age-page","bmi-page","loan-page","personal-loan-page","discount-page","percentage-page","compound-page"].forEach(function(className){document.body.classList.remove(className)}),document.body.classList.add("personalLoan"===type?"personal-loan-page":type+"-page"),document.body.dataset.page="personalLoan"===type?"personal-loan":type)}(),openReportFromHash())return;buildInstructionLayout(),$$("input[type='number']").forEach(function(input){input.setAttribute("inputmode","decimal"),input.dataset.numberOnlyReady||(input.dataset.numberOnlyReady="true",input.addEventListener("keydown",function(event){["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"].includes(event.key)||event.ctrlKey||event.metaKey||/^[0-9]$/.test(event.key)||("."!==event.key||input.value.includes("."))&&event.preventDefault()}),input.addEventListener("input",function(){let value=input.value.replace(/[^0-9.]/g,"");const parts=value.split(".");parts.length>2&&(value=parts[0]+"."+parts.slice(1).join("")),input.value=value}))}),document.addEventListener("keydown",function(event){if("basic"!==getPageType())return;if(!getDisplay())return;const target=event.target;if(target&&target.closest&&target.closest(".site-search"))return;if(target&&"display"!==target.id&&(target.matches&&target.matches("input, textarea, select")||target.isContentEditable))return;const key=event.key,lowerKey=key.toLowerCase();return/^[0-9]$/.test(key)?(add(key),void flashButton(key)):"."===key?(add("."),void flashButton(".")):["+","-"].includes(key)?(add(key),void flashButton(key)):"*"===key||"x"===lowerKey?(add("*"),void flashButton("*")):"/"===key?(event.preventDefault(),add("/"),void flashButton("/")):"Enter"===key||"="===key?(event.preventDefault(),calculate(),void flashButton("=")):"Backspace"===key?(event.preventDefault(),removeLast(),void flashButton("←")):"Delete"===key||"Escape"===key?(event.preventDefault(),clearDisplay(),void flashButton("AC")):"^"===key?(addPower(),void flashButton("xʸ")):"r"===lowerKey?(addFunction("sqrt"),void flashButton("√")):void("a"===lowerKey&&(add("Ans"),flashButton("ANS")))}),document.addEventListener("input",function(event){!event.target.matches||!event.target.matches("input, select, textarea")||"display"===event.target.id||event.target.closest&&event.target.closest("#navbar, .site-search, .clean-nav-search")||scheduleAutoCalculate()},!0),document.addEventListener("change",function(event){!event.target.matches||!event.target.matches("input, select, textarea")||"display"===event.target.id||event.target.closest&&event.target.closest("#navbar, .site-search, .clean-nav-search")||scheduleAutoCalculate()},!0),document.addEventListener("click",function(event){const link=event.target.closest("a");if(link&&link.href&&link.href.includes("#calc-report="))link.target="_self";else if(event.target.closest("button.clear-btn, #clearCompoundHistoryBtn")){const type=getPageType();isReportType(type)&&setTimeout(function(){clearReports(type)},0)}},!0),function(){const scrollButton=byId("scrollTopBtn");scrollButton&&window.addEventListener("scroll",function(){scrollButton.style.display=window.scrollY>200?"flex":"none"},{passive:!0})}();const type=getPageType();"age"===type&&(ensureAgeNameInput(),ensureAgeTargetDateInput()),"bmi"===type&&(ensureBMIProfileAndGroups(),setBMIUnit("si")),"loan"===type&&ensureMortgageOptionalSections(),"basic"===type&&(showHistory(),renderBasicInlineResult(),removeBasicExternalResultBox()),isReportType(type)&&(hideCalculateButtons(),renderReportHistory(type),setTimeout(hideCalculateButtons,100),readyToCalculate(type)&&setTimeout(scheduleAutoCalculate,250))}function openLatestCalculatorReport(type,button){if(!isReportType(type))return!1;const reports=loadReports(type),report=reports&&reports.length?reports[reports.length-1]:null;return report?(window.location.href=reportHref(report),!0):(button&&setButtonState(button,"Calculate first"),!1)}window.addEventListener("hashchange",function(){window.location.hash.startsWith("#calc-report=")?openReportFromHash():document.body.classList.contains("calculator-report-view")&&(window.location.href=window.location.href.split("#")[0])}),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",init):init(),window.add=add,window.clearDisplay=clearDisplay,window.removeLast=removeLast,window.addFunction=addFunction,window.addPower=addPower,window.closeOpenBrackets=closeOpenBrackets,window.calculate=calculate,window.showHistory=showHistory,window.clearHistory=function(){basicHistory=[],safeRemove("basicEquationHistory"),showHistory()},window.copyHistoryItem=function(text,button){copyText(text,button)},window.copyText=copyText,window.scrollToTop=function(){window.scrollTo({top:0,behavior:"smooth"})},window.toggleMenu=function(){const navbar=byId("navbar");navbar&&navbar.classList.toggle("open")},window.flashButton=flashButton,window.openLatestCalculatorReport=openLatestCalculatorReport,window.calculateAge=calculateAge,window.calculateBMI=calculateBMI,window.calculateBmi=calculateBMI,window.toggleBMIUnit=function(){const button=byId("unitToggleBtn");setBMIUnit("si"===(button?button.dataset.currentUnit||document.body.dataset.bmiUnit||"si":document.body.dataset.bmiUnit||"si")?"us":"si"),scheduleAutoCalculate()},window.calculateLoan=calculateLoan,window.calculatePersonalLoan=calculatePersonalLoan,window.calculateDiscount=calculateDiscount,window.calculatePercentage=calculatePercentage,window.calculateCompound=calculateCompound,window.calculateCompoundInterest=calculateCompound,window.clearInputHistory=function(type){clearReports(type||getPageType())},window.clearAgeHistory=function(){clearReports("age")},window.clearBMIHistory=function(){clearReports("bmi")},window.clearLoanHistory=function(){clearReports("loan")},window.clearPersonalLoanHistory=function(){clearReports("personalLoan")},window.clearDiscountHistory=function(){clearReports("discount")},window.clearPercentageHistory=function(){clearReports("percentage")},window.clearCompoundHistory=function(){clearReports("compound")}}(),function(){"use strict";const CALCULATORS=[{title:"Basic Calculator",label:"basic",url:"basic-calculator.html",keywords:"basic calculator math arithmetic add subtract multiply divide"},{title:"Percentage Calculator",label:"percentage",url:"percentage-calculator.html",keywords:"percentage percent increase decrease difference discount salary increment"},{title:"Unit Converter",label:"unit converter",url:"unit-converter-calculator.html",keywords:"unit converter length weight temperature area volume speed"},{title:"Age Calculator",label:"age",url:"age-calculator.html",keywords:"age birthday birthdate years months days"},{title:"BMI Calculator",label:"bmi",url:"bmi-calculator.html",keywords:"bmi body mass index weight height health"},{title:"Pointer Grade Calculator",label:"grade",url:"grade.html",keywords:"grade pointer gpa cgpa credit hour education"},{title:"Salary Calculator",label:"salary",url:"salary-calculator.html",keywords:"salary take home pay epf socso eis monthly yearly income"},{title:"Gaji Penjawat Awam",label:"gaji penjawat awam",url:"gaji-penjawat-awam-calculator.html",keywords:"gaji penjawat awam kerajaan elaun potongan"},{title:"Tax Calculator",label:"tax",url:"tax-calculator.html",keywords:"tax income tax relief deduction rate"},{title:"Inflation Calculator",label:"inflation",url:"inflation-calculator.html",keywords:"inflation future cost buying power"},{title:"Compound Interest Calculator",label:"compound interest",url:"compound-interest-calculator.html",keywords:"compound interest investment savings future value principal rate"},{title:"Loan Calculator",label:"loan",url:"loan-calculator.html",keywords:"loan payment interest repayment finance"},{title:"Mortgage Calculator",label:"mortgage",url:"mortgage-calculator.html",keywords:"mortgage home housing loan monthly payment interest property"},{title:"Personal Loan Calculator",label:"personal loan",url:"personal-loan-calculator.html",keywords:"personal loan monthly payment interest borrowing repayment"},{title:"Loan Comparison",label:"loan comparison",url:"loan-comparison-calculator.html",keywords:"loan comparison compare interest monthly payment"},{title:"Debt Payoff",label:"debt payoff",url:"debt-payoff-calculator.html",keywords:"debt payoff repayment balance interest"},{title:"Credit Card Payoff",label:"credit card payoff",url:"credit-card-payoff-calculator.html",keywords:"credit card payoff debt payment interest"},{title:"Credit Card Interest",label:"credit card interest",url:"credit-card-interest-calculator.html",keywords:"credit card interest finance charge"},{title:"Rental Yield",label:"rental yield",url:"rental-yield-calculator.html",keywords:"rental yield property rent investment"},{title:"Fuel Cost",label:"fuel cost",url:"fuel-cost-calculator.html",keywords:"fuel cost petrol distance efficiency travel"}];let activeIndex=-1,currentMatches=[];function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}function getScore(item,query){const q=normalize(query);if(!q)return 0;const label=normalize(item.label),title=normalize(item.title),haystack=title+" "+label+" "+normalize(item.keywords);if(label===q)return 100;if(title===q)return 95;if(label.startsWith(q))return 90;if(title.startsWith(q))return 85;if(haystack.includes(q))return 70;const words=q.split(/\s+/).filter(Boolean);return words.length&&words.every(function(word){return haystack.includes(word)})?55:0}function findMatches(query){return CALCULATORS.map(function(item){return{item:item,score:getScore(item,query)}}).filter(function(entry){return entry.score>0}).sort(function(a,b){return b.score-a.score||a.item.title.localeCompare(b.item.title)}).map(function(entry){return entry.item})}function goToCalculator(item){item&&item.url&&(window.location.href=item.url)}function closeResults(form){const results=form?form.querySelector(".site-search-results"):null;results&&(results.hidden=!0,results.innerHTML=""),activeIndex=-1,currentMatches=[]}function setActiveResult(form){Array.from(form.querySelectorAll(".site-search-result-btn")).forEach(function(button,index){const active=index===activeIndex;button.classList.toggle("is-active",active),button.setAttribute("aria-selected",active?"true":"false")})}function renderResults(form,query){const results=form.querySelector(".site-search-results");if(results)if(currentMatches=findMatches(query),activeIndex=currentMatches.length?0:-1,normalize(query)){if(!currentMatches.length)return results.hidden=!1,void(results.innerHTML='<li class="site-search-empty">No calculator found</li>');results.hidden=!1,results.innerHTML=currentMatches.slice(0,8).map(function(item,index){return'<li><button type="button" class="site-search-result-btn" data-search-index="'+index+'" role="option">'+item.title+"</button></li>"}).join(""),setActiveResult(form)}else closeResults(form)}function installCalculatorSearch(){const navbar=document.getElementById("navbar");if(!navbar)return;if(navbar.querySelector(".site-search"))return;const form=function(){const form=document.createElement("form");return form.className="site-search",form.setAttribute("role","search"),form.setAttribute("autocomplete","off"),form.innerHTML='<label class="site-search-label" for="calculatorSearchInput">Search tools</label><div class="site-search-inner"><input id="calculatorSearchInput" class="site-search-input" type="search" placeholder="Search tools" aria-label="Search tools" aria-autocomplete="list" aria-controls="calculatorSearchResults"><button type="submit" class="site-search-submit" aria-label="Open calculator search result">🔍</button></div><ul id="calculatorSearchResults" class="site-search-results" role="listbox" hidden></ul>',form}(),infoDropdown=navbar.querySelector(".about-dropdown");let chatLink=navbar.querySelector(".nav-chat-link");chatLink||(chatLink=document.createElement("a"),chatLink.href="review.html",chatLink.className="nav-chat-link",chatLink.textContent="Review");let inlineWrap=navbar.querySelector(".nav-chat-search-inline");inlineWrap||(inlineWrap=document.createElement("div"),inlineWrap.className="nav-chat-search-inline",infoDropdown?infoDropdown.insertAdjacentElement("afterend",inlineWrap):navbar.appendChild(inlineWrap)),inlineWrap.appendChild(chatLink),inlineWrap.appendChild(form),function(form){const input=form.querySelector(".site-search-input"),results=form.querySelector(".site-search-results");input&&results&&(input.addEventListener("keydown",function(event){event.stopPropagation()},!0),input.addEventListener("keyup",function(event){event.stopPropagation()},!0),input.addEventListener("input",function(event){event.stopPropagation(),renderResults(form,input.value)}),input.addEventListener("focus",function(){normalize(input.value)&&renderResults(form,input.value)}),input.addEventListener("keydown",function(event){currentMatches.length&&("ArrowDown"===event.key&&(event.preventDefault(),activeIndex=Math.min(activeIndex+1,Math.min(currentMatches.length,8)-1),setActiveResult(form)),"ArrowUp"===event.key&&(event.preventDefault(),activeIndex=Math.max(activeIndex-1,0),setActiveResult(form)),"Escape"===event.key&&closeResults(form))}),form.addEventListener("submit",function(event){event.preventDefault();const selected=(currentMatches.length?currentMatches:findMatches(input.value))[activeIndex>=0?activeIndex:0];selected&&goToCalculator(selected)}),results.addEventListener("click",function(event){const button=event.target.closest(".site-search-result-btn");if(!button)return;const index=Number(button.dataset.searchIndex);goToCalculator(currentMatches[index])}),document.addEventListener("click",function(event){form.contains(event.target)||closeResults(form)}))}(form)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",installCalculatorSearch):installCalculatorSearch()}(),function(){"use strict";function sanitizeExpression(value){return String(value||"").replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/gi,"Math.PI").replace(/Math\.sqrt\s*\(/gi,"√(").replace(/\bsqrt\s*\(/gi,"√(").replace(/[^0-9+\-*/().,%\sA-Za-z√]/g,"").replace(/\bpi\b/gi,"Math.PI").replace(/\bans\b/gi,function(){return String(window.lastAnswer||"0")})}function setupBasicDisplayPaste(){if(!(document.body.classList.contains("basic-page")||"basic"===document.body.dataset.page||document.getElementById("display")||document.querySelector(".basic-grid")||document.querySelector(".scientific-grid")))return;const display=document.getElementById("display");display&&(display.removeAttribute("readonly"),display.readOnly=!1,display.setAttribute("inputmode","decimal"),display.setAttribute("autocomplete","off"),display.setAttribute("spellcheck","false"),"true"!==display.dataset.pasteReady&&(display.dataset.pasteReady="true",display.addEventListener("paste",function(event){event.preventDefault();const clipboard=event.clipboardData||window.clipboardData,clean=sanitizeExpression(clipboard?clipboard.getData("text"):"");clean&&function(input,text){const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length,before=input.value.slice(0,start),after=input.value.slice(end);input.value=before+text+after;const next=start+text.length;input.setSelectionRange(next,next)}(display,clean)}),display.addEventListener("input",function(){const clean=sanitizeExpression(display.value);if(display.value!==clean){const end=clean.length;display.value=clean,display.setSelectionRange(end,end)}}),document.addEventListener("keydown",function(event){if(document.activeElement===display)return"Enter"===event.key||"="===event.key?(event.preventDefault(),event.stopImmediatePropagation(),void("function"==typeof window.calculate&&window.calculate())):(function(event){if(event.ctrlKey||event.metaKey)return!0;const key=event.key;return"Backspace"===key||"Delete"===key||"ArrowLeft"===key||"ArrowRight"===key||"ArrowUp"===key||"ArrowDown"===key||"Tab"===key||"Home"===key||"End"===key||/^[0-9+\-*/().,%]$/.test(key)}(event)||event.preventDefault(),void event.stopImmediatePropagation())},!0)))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",setupBasicDisplayPaste):setupBasicDisplayPaste()}(),function(){"use strict";let digits=new Array(7).fill(0),pointerDown=!1;function updateValueText(){const text=document.getElementById("liveAbacusValueText");text&&(text.textContent=function(){const raw=digits.join("").replace(/^0+(?=\d)/,""),number=Number(raw||"0");return Number.isFinite(number)?number.toLocaleString("en-MY"):raw||"0"}())}function setRodDigit(rod,digit){const number=Math.max(0,Math.min(9,Number(digit)||0)),rodIndex=Number(rod.dataset.rodIndex||"0");digits[rodIndex]=number;const topActive=number>=5,lowerCount=number%5,top=rod.querySelector(".abacus-top-bead");top&&(top.style.top=(topActive?72:38)+"px",top.classList.toggle("is-active",topActive),top.setAttribute("aria-pressed",topActive?"true":"false")),rod.querySelectorAll(".abacus-lower-bead").forEach(function(bead){const index=Number(bead.dataset.index||"0"),active=index<lowerCount;bead.style.top=(active?124+28*index:162+28*index)+"px",bead.classList.toggle("is-active",active),bead.setAttribute("aria-pressed",active?"true":"false")});const digitLabel=rod.querySelector(".abacus-digit");digitLabel&&(digitLabel.textContent=String(number));const numberLabel=rod.querySelector(".abacus-rod-number");numberLabel&&(numberLabel.textContent=String(number)),updateValueText()}function rodPlaceLabel(index){return["M","100K","10K","1K","100","10","1"][index]||"1"}function buildRod(index){const rod=document.createElement("div");rod.className="abacus-rod",rod.dataset.rodIndex=String(index);const numberLabel=document.createElement("span");numberLabel.className="abacus-rod-number",numberLabel.textContent="0",rod.appendChild(numberLabel);const separator=document.createElement("div");separator.className="abacus-separator",rod.appendChild(separator);const top=document.createElement("button");top.type="button",top.className="abacus-bead abacus-top-bead",top.dataset.kind="top",top.setAttribute("aria-label","Toggle top bead for "+rodPlaceLabel(index)),rod.appendChild(top);for(let i=0;i<4;i+=1){const bead=document.createElement("button");bead.type="button",bead.className="abacus-bead abacus-lower-bead",bead.dataset.kind="lower",bead.dataset.index=String(i),bead.setAttribute("aria-label","Set lower beads to "+(i+1)+" for "+rodPlaceLabel(index)),rod.appendChild(bead)}const label=document.createElement("span");return label.className="abacus-label",label.innerHTML='<span class="abacus-place-label">'+rodPlaceLabel(index)+'</span><span class="abacus-digit">0</span>',rod.appendChild(label),setRodDigit(rod,0),rod}function handleBeadAction(bead){const rod=bead.closest(".abacus-rod");if(!rod)return;const current=digits[Number(rod.dataset.rodIndex||"0")]||0,hasTop=current>=5,lower=current%5;if("top"===bead.dataset.kind)return void setRodDigit(rod,(hasTop?0:5)+lower);const wanted=Number(bead.dataset.index||"0")+1;setRodDigit(rod,(hasTop?5:0)+(lower===wanted?Math.max(0,wanted-1):wanted))}function startInteractiveAbacus(){(document.body.classList.contains("index-page")||"index"===document.body.dataset.page||document.getElementById("liveAbacus"))&&function(){const abacus=document.getElementById("liveAbacus");if(!abacus||"true"===abacus.dataset.interactiveReady)return;abacus.dataset.interactiveReady="true",abacus.innerHTML="";for(let i=0;i<7;i+=1)abacus.appendChild(buildRod(i));abacus.addEventListener("pointerdown",function(event){const bead=event.target.closest(".abacus-bead");bead&&(pointerDown=!0,event.preventDefault(),handleBeadAction(bead))}),abacus.addEventListener("pointerover",function(event){if(!pointerDown)return;const bead=event.target.closest(".abacus-bead");bead&&handleBeadAction(bead)}),document.addEventListener("pointerup",function(){pointerDown=!1}),abacus.addEventListener("click",function(event){event.target.closest(".abacus-bead")&&event.preventDefault()});const reset=document.getElementById("liveAbacusReset");reset&&reset.addEventListener("click",function(){digits=new Array(7).fill(0),document.querySelectorAll("#liveAbacus .abacus-rod").forEach(function(rod){setRodDigit(rod,0)})}),updateValueText()}()}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startInteractiveAbacus):startInteractiveAbacus()}(),function(){"use strict";function stopCalculatorKeys(event){var el;(el=event.target)&&el.closest&&el.closest(".site-search, .site-search-input, .site-search-results")&&event.stopPropagation()}function protectSearchBars(){document.querySelectorAll(".site-search, .site-search-input, .site-search-results").forEach(function(el){"true"!==el.dataset.searchKeyboardProtected&&(el.dataset.searchKeyboardProtected="true",["keydown","keypress","keyup"].forEach(function(type){el.addEventListener(type,stopCalculatorKeys,!0),el.addEventListener(type,stopCalculatorKeys,!1)}))})}function start(){protectSearchBars(),setTimeout(protectSearchBars,300),setTimeout(protectSearchBars,1e3),document.addEventListener("focusin",protectSearchBars,!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";["keydown","keypress","keyup"].forEach(function(eventName){document.addEventListener(eventName,function(event){var target;(target=event.target)&&target.closest&&target.closest(".site-search, .site-search-input, .site-search-box, .navbar-search, .search-bar, input[type='search']")&&event.stopPropagation()},!0)}),document.addEventListener("click",function(event){var link=event.target&&event.target.closest&&event.target.closest("body.index-page .index-dropdown-card .group-links a");if(link){var href=link.getAttribute("href");href&&"#"!==href&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||1===event.button||(event.preventDefault(),window.location.assign(href)))}},!0)}(),function(){"use strict";function installFinalAgeBmiStyle(){}"loading"===document.readyState&&document.addEventListener("DOMContentLoaded",installFinalAgeBmiStyle)}(),function(){"use strict";function installBmiCartoonResultStyle(){}"loading"===document.readyState&&document.addEventListener("DOMContentLoaded",installBmiCartoonResultStyle)}(),function(){"use strict";function installBmiFinalLayoutCleanup(){}"loading"===document.readyState&&document.addEventListener("DOMContentLoaded",installBmiFinalLayoutCleanup)}(),function(){"use strict";let bmiTypingTimer=null,bmiComposing=!1;function isBmiPage(){return document.body.classList.contains("bmi-page")||"bmi"===document.body.dataset.page||!!document.getElementById("bmiResult")||!!document.getElementById("weight")&&!!document.getElementById("height")}function isBmiInput(el){return!(!el||!isBmiPage())&&["bmiName","name","weight","height","waist","bmiAge","age","gender","sex","activityLevel","bmiActivityLevel","timeGoal","timeGoalValue","timeGoalUnit","targetWeight","targetWaist","bmiNeck","bmiWrist","bmiShoulder","bmiHip"].includes(el.id)}function valueOf(id){const el=document.getElementById(id);return el?String(el.value||"").trim():""}function runBmiAfterTyping(){if(!isBmiPage())return;if(""===valueOf("weight")||""===valueOf("height"))return;if(bmiComposing)return;const focusState=function(){const el=document.activeElement;return isBmiInput(el)?{id:el.id,start:"number"==typeof el.selectionStart?el.selectionStart:null,end:"number"==typeof el.selectionEnd?el.selectionEnd:null}:null}();try{"function"==typeof window.calculateBMI?window.calculateBMI():"function"==typeof window.calculateBmi&&window.calculateBmi()}catch(error){console.error("BMI delayed auto calculate error:",error)}setTimeout(function(){!function(state){if(!state||!state.id)return;const el=document.getElementById(state.id);if(el&&(document.activeElement!==el&&el.focus({preventScroll:!0}),null!==state.start&&null!==state.end&&"function"==typeof el.setSelectionRange))try{el.setSelectionRange(state.start,state.end)}catch{}}(focusState)},0)}function scheduleBmiAfterTyping(event){isBmiInput(event.target)&&(clearTimeout(bmiTypingTimer),bmiTypingTimer=setTimeout(runBmiAfterTyping,2e3))}function startBmiTypingFix(){isBmiPage()&&(document.addEventListener("compositionstart",function(event){isBmiInput(event.target)&&(bmiComposing=!0)},!0),document.addEventListener("compositionend",function(event){isBmiInput(event.target)&&(bmiComposing=!1,scheduleBmiAfterTyping(event))},!0),document.addEventListener("input",scheduleBmiAfterTyping,!0),document.addEventListener("change",scheduleBmiAfterTyping,!0))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startBmiTypingFix):startBmiTypingFix()}(),function(){"use strict";function text(el){return String(el&&el.textContent||"").replace(/\s+/g," ").trim().toLowerCase()}function wrapDropdownContent(box,toggle,contentClass){let content=box.querySelector(":scope > ."+contentClass);return content||(content=document.createElement("div"),content.className=contentClass,function(box,toggle){return Array.from(box.children).filter(function(child){return child!==toggle})}(box,toggle).forEach(function(child){content.appendChild(child)}),box.appendChild(content)),content}function setDropdownState(box,toggle,content,open){box.classList.toggle("mortgage-dropdown-open",open),box.classList.toggle("mortgage-dropdown-closed",!open),toggle.setAttribute("aria-expanded",open?"true":"false"),content.hidden=!open}function setupDropdown(box,options){if(!box)return;const titleText=options.title,toggleClass=options.toggleClass,contentClass=options.contentClass;let toggle=box.querySelector(":scope > ."+toggleClass);toggle?(toggle.classList.add("mortgage-dropdown-toggle"),text(toggle).replace(/[▼▲]/g,"").trim()||(toggle.textContent=titleText)):(toggle=document.createElement("button"),toggle.type="button",toggle.className=toggleClass+" mortgage-dropdown-toggle",toggle.textContent=titleText,box.insertAdjacentElement("afterbegin",toggle));const content=wrapDropdownContent(box,toggle,contentClass),contentId=(prefix=contentClass,(el=content).id||(el.id=prefix+"-"+Math.random().toString(36).slice(2,8)),el.id);var el,prefix;toggle.setAttribute("aria-controls",contentId),box.dataset.mortgageDropdownReady||(box.dataset.mortgageDropdownReady="yes",setDropdownState(box,toggle,content,!1),toggle.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation();const isOpen="true"===toggle.getAttribute("aria-expanded");setDropdownState(box,toggle,content,!isOpen)}))}function setupMortgageDropdowns(){(function(){const title=text(document.querySelector("h1")),path=window.location.pathname.toLowerCase();return path.includes("mortgage")||path.includes("loan-calculator")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanHistoryList")||!!document.getElementById("otherMonthlyFees")||!!document.getElementById("downPayment")||!!document.getElementById("propertyTaxYearly")||!!document.querySelector(".optional-mortgage-costs")||!!document.querySelector(".early-settlement-box")})()&&(document.body.classList.add("loan-page"),setupDropdown(document.querySelector(".optional-mortgage-costs"),{title:"Optional costs",toggleClass:"optional-mortgage-toggle",contentClass:"optional-mortgage-content"}),setupDropdown(document.querySelector(".early-settlement-box"),{title:"Optional early settlement",toggleClass:"early-settlement-toggle",contentClass:"early-settlement-content"}))}function start(){setupMortgageDropdowns(),setTimeout(setupMortgageDropdowns,300),setTimeout(setupMortgageDropdowns,900),setTimeout(setupMortgageDropdowns,1600)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function text(el){return String(el&&el.textContent||"").replace(/\s+/g," ").trim().toLowerCase()}function findBoxByTitle(patterns){return Array.from(document.querySelectorAll(".mortgage-input-box, .mortgage-home-box, .mortgage-loan-box, .optional-mortgage-costs, .early-settlement-box, .loan-optional-row > *")).find(function(box){const title=text(box.querySelector(".bmi-extra-title, .mortgage-box-title, h2, h3, button, .optional-mortgage-toggle, .early-settlement-toggle")||box);return patterns.some(function(pattern){return pattern.test(title)})})||null}function moveTo(parent,child){parent&&child&&child.parentElement!==parent&&parent.appendChild(child)}function organizeMortgageInputs(){if(!function(){const title=text(document.querySelector("h1"));return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.querySelector(".mortgage-home-box")||!!document.querySelector(".mortgage-loan-box")||!!document.querySelector(".optional-mortgage-costs")||!!document.querySelector(".early-settlement-box")}())return;const calculator=document.querySelector(".calculator");if(!calculator)return;const homeBox=document.querySelector(".mortgage-home-box")||document.querySelector(".mortgage-home-details-box")||findBoxByTitle([/home details/,/property details/,/home info/]),loanBox=document.querySelector(".mortgage-loan-box")||document.querySelector(".mortgage-loan-details-box")||findBoxByTitle([/loan details/,/financing details/,/loan info/]),optionalCostBox=document.querySelector(".optional-mortgage-costs")||findBoxByTitle([/optional costs/,/property tax/,/insurance/,/monthly fee/]),extraSettlementBox=document.querySelector(".early-settlement-box")||document.querySelector(".mortgage-extra-payment-box")||findBoxByTitle([/extra payment/,/early settlement/,/settlement/]);if(!(homeBox||loanBox||optionalCostBox||extraSettlementBox))return;let layout=document.querySelector(".mortgage-two-column-input-layout");if(!layout){layout=document.createElement("div"),layout.className="mortgage-two-column-input-layout";const firstBox=homeBox||loanBox||optionalCostBox||extraSettlementBox;firstBox&&firstBox.parentElement?firstBox.parentElement.insertBefore(layout,firstBox):calculator.appendChild(layout)}let leftCol=layout.querySelector(".mortgage-left-input-column"),rightCol=layout.querySelector(".mortgage-right-input-column");leftCol||(leftCol=document.createElement("div"),leftCol.className="mortgage-left-input-column",layout.appendChild(leftCol)),rightCol||(rightCol=document.createElement("div"),rightCol.className="mortgage-right-input-column",layout.appendChild(rightCol)),moveTo(leftCol,homeBox),moveTo(leftCol,optionalCostBox),moveTo(rightCol,loanBox),moveTo(rightCol,extraSettlementBox),optionalCostBox&&optionalCostBox.classList.add("mortgage-box-under-home"),extraSettlementBox&&extraSettlementBox.classList.add("mortgage-box-under-loan")}function start(){organizeMortgageInputs(),setTimeout(organizeMortgageInputs,200),setTimeout(organizeMortgageInputs,700),setTimeout(organizeMortgageInputs,1400),setTimeout(organizeMortgageInputs,2400)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function text(el){return String(el&&el.textContent||"").replace(/\s+/g," ").trim().toLowerCase()}function removeOldMortgageResultBox(){(function(){const title=text(document.querySelector("h1"));return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanExternalOutput")||!!document.querySelector(".mortgage-output-panel")})()&&([document.getElementById("loanResult"),document.getElementById("loanExternalOutput"),document.getElementById("universalLoanStyleOutput")].forEach(function(box){if(box)return box.classList.contains("mortgage-modern-result-panel")||box.querySelector(".mortgage-modern-output")?(box.hidden=!1,box.style.setProperty("display","block","important"),box.style.setProperty("visibility","visible","important"),void box.removeAttribute("aria-hidden")):void(function(el){if(!el)return!1;const hasTable=!!el.querySelector("table"),content=text(el);return!!hasTable&&(content.includes("monthly payment")||content.includes("principal")||content.includes("interest")||content.includes("remaining balance")||content.includes("total payment"))}(box)&&(box.innerHTML="",box.style.setProperty("display","none","important"),box.setAttribute("aria-hidden","true")))}),document.querySelectorAll(".loan-copy-side, .mortgage-old-copy-button, #loanResultCopyButton, #copyLoanResult, #loanCopyButton").forEach(function(button){button.remove()}),document.querySelectorAll("button").forEach(function(button){const btnText=text(button);if("copy"!==btnText&&"copy result"!==btnText)return;const parent=button.parentElement;parent&&(parent.querySelector("#loanResult")||parent.querySelector("#loanExternalOutput")||parent.className.toString().toLowerCase().includes("loan-result")||parent.className.toString().toLowerCase().includes("mortgage-result"))&&button.remove()}))}function start(){removeOldMortgageResultBox(),setTimeout(removeOldMortgageResultBox,200),setTimeout(removeOldMortgageResultBox,700),setTimeout(removeOldMortgageResultBox,1400),document.addEventListener("input",function(){setTimeout(removeOldMortgageResultBox,350),setTimeout(removeOldMortgageResultBox,900)},!0),document.addEventListener("change",function(){setTimeout(removeOldMortgageResultBox,350),setTimeout(removeOldMortgageResultBox,900)},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function markMortgagePage(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanHistoryList")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;document.body.classList.add("mortgage-page"),document.body.classList.add("loan-page");const layout=document.querySelector(".mortgage-two-column-input-layout");layout&&(layout.style.width="100%",layout.style.maxWidth="100%",layout.style.boxSizing="border-box"),document.querySelectorAll(".mortgage-left-input-column, .mortgage-right-input-column, .mortgage-input-box, .mortgage-home-box, .mortgage-loan-box, .optional-mortgage-costs, .early-settlement-box").forEach(function(el){el.style.width="100%",el.style.maxWidth="100%",el.style.boxSizing="border-box"})}function start(){markMortgagePage(),setTimeout(markMortgagePage,200),setTimeout(markMortgagePage,700),setTimeout(markMortgagePage,1500)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function cleanMortgageWidths(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanHistoryList")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;document.body.classList.add("mortgage-page"),document.body.classList.add("loan-page");const selector=[".mortgage-two-column-input-layout",".mortgage-left-input-column",".mortgage-right-input-column",".mortgage-input-box",".mortgage-home-box",".mortgage-loan-box",".mortgage-home-details-box",".mortgage-loan-details-box",".optional-mortgage-costs",".early-settlement-box",".optional-mortgage-toggle",".early-settlement-toggle",".optional-mortgage-content",".early-settlement-content"].join(",");document.querySelectorAll(selector).forEach(function(el){el.style.setProperty("width","100%","important"),el.style.setProperty("max-width","none","important"),el.style.setProperty("min-width","0","important"),el.style.setProperty("box-sizing","border-box","important")}),document.querySelectorAll(".mortgage-input-box input, .mortgage-input-box select, .mortgage-home-box input, .mortgage-home-box select, .mortgage-loan-box input, .mortgage-loan-box select, .mortgage-home-details-box input, .mortgage-home-details-box select, .mortgage-loan-details-box input, .mortgage-loan-details-box select, .optional-mortgage-content input, .optional-mortgage-content select, .early-settlement-content input, .early-settlement-content select").forEach(function(el){el.style.setProperty("width","100%","important"),el.style.setProperty("max-width","100%","important"),el.style.setProperty("min-width","0","important"),el.style.setProperty("box-sizing","border-box","important")})}function start(){cleanMortgageWidths(),setTimeout(cleanMortgageWidths,100),setTimeout(cleanMortgageWidths,400),setTimeout(cleanMortgageWidths,900),setTimeout(cleanMortgageWidths,1800)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function fixMortgageGridWrapper(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.querySelector(".mortgage-input-grid")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;document.body.classList.add("mortgage-page","loan-page");const layout=document.querySelector(".mortgage-two-column-input-layout"),oldGrid=document.querySelector(".mortgage-input-grid"),calculator=document.querySelector(".calculator");layout&&oldGrid&&calculator&&(oldGrid.contains(layout)&&oldGrid.insertAdjacentElement("beforebegin",layout),oldGrid.querySelector(".mortgage-input-box")||(oldGrid.style.setProperty("display","none","important"),oldGrid.setAttribute("aria-hidden","true")),layout.style.setProperty("width","100%","important"),layout.style.setProperty("max-width","100%","important"),layout.style.setProperty("box-sizing","border-box","important"),document.querySelectorAll(".mortgage-left-input-column, .mortgage-right-input-column, .mortgage-left-input-column > *, .mortgage-right-input-column > *").forEach(function(el){el.style.setProperty("width","100%","important"),el.style.setProperty("max-width","100%","important"),el.style.setProperty("min-width","0","important"),el.style.setProperty("box-sizing","border-box","important")}))}function start(){fixMortgageGridWrapper(),setTimeout(fixMortgageGridWrapper,250),setTimeout(fixMortgageGridWrapper,800),setTimeout(fixMortgageGridWrapper,1600),setTimeout(fixMortgageGridWrapper,2600)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function keepMortgageOptionalVisible(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;const layout=document.querySelector(".mortgage-two-column-input-layout"),left=layout?layout.querySelector(".mortgage-left-input-column"):null,right=layout?layout.querySelector(".mortgage-right-input-column"):null,optional=document.querySelector(".optional-mortgage-costs"),early=document.querySelector(".early-settlement-box");left&&optional&&optional.parentElement!==left&&left.appendChild(optional),right&&early&&early.parentElement!==right&&right.appendChild(early),[optional,early].forEach(function(box){box&&(box.style.setProperty("display","block","important"),box.style.setProperty("visibility","visible","important"),box.style.setProperty("opacity","1","important"))})}function start(){keepMortgageOptionalVisible(),setTimeout(keepMortgageOptionalVisible,150),setTimeout(keepMortgageOptionalVisible,600),setTimeout(keepMortgageOptionalVisible,1200),document.addEventListener("input",function(){setTimeout(keepMortgageOptionalVisible,50),setTimeout(keepMortgageOptionalVisible,350)},!0),document.addEventListener("change",function(){setTimeout(keepMortgageOptionalVisible,50),setTimeout(keepMortgageOptionalVisible,350)},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function revealMortgageModernResult(){const panel=document.getElementById("loanExternalOutput");panel&&panel.classList.contains("mortgage-modern-result-panel")&&(panel.hidden=!1,panel.style.setProperty("display","block","important"),panel.style.setProperty("visibility","visible","important"),panel.style.setProperty("opacity","1","important"),panel.removeAttribute("aria-hidden"))}function start(){revealMortgageModernResult(),setTimeout(revealMortgageModernResult,100),setTimeout(revealMortgageModernResult,500),setTimeout(revealMortgageModernResult,1100),document.addEventListener("input",function(){setTimeout(revealMortgageModernResult,400),setTimeout(revealMortgageModernResult,900)},!0),document.addEventListener("change",function(){setTimeout(revealMortgageModernResult,400),setTimeout(revealMortgageModernResult,900)},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function hideAgeLiveResultDuringReport(){document.body.classList.contains("calculator-report-view")&&document.querySelectorAll(".age-clean-result, .age-point-output, #ageResult").forEach(function(el){el.closest("#calculatorReportPage")||(el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true"))})}function start(){hideAgeLiveResultDuringReport(),setTimeout(hideAgeLiveResultDuringReport,100),setTimeout(hideAgeLiveResultDuringReport,500),setTimeout(hideAgeLiveResultDuringReport,1200),setTimeout(hideAgeLiveResultDuringReport,2200),window.addEventListener("hashchange",function(){setTimeout(hideAgeLiveResultDuringReport,100),setTimeout(hideAgeLiveResultDuringReport,700)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function fillStartDate(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("startDate")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;const input=document.getElementById("startDate");input&&!input.value&&(input.value=function(){const now=new Date;return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")}())}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",fillStartDate):fillStartDate(),setTimeout(fillStartDate,300),setTimeout(fillStartDate,1e3)}(),function(){"use strict";const calculators=[{title:"Basic Calculator",url:"basic-calculator.html"},{title:"Percentage Calculator",url:"percentage-calculator.html"},{title:"unit converter",url:"unit-converter-calculator.html"},{title:"Age Calculator",url:"age-calculator.html"},{title:"BMI Calculator",url:"bmi-calculator.html"},{title:"Salary Calculator",url:"salary-calculator.html"},{title:"gaji penjawat awam",url:"gaji-penjawat-awam-calculator.html"},{title:"Tax Calculator",url:"tax-calculator.html"},{title:"Discount Calculator",url:""},{title:"Inflation Calculator",url:"inflation-calculator.html"},{title:"compound interest",url:"compound-interest-calculator.html"},{title:"Mortgage Calculator",url:"mortgage-calculator.html"},{title:"Personal Loan",url:"personal-loan-calculator.html"},{title:"Loan Comparison",url:"loan-comparison-calculator.html"},{title:"Debt Payoff",url:"debt-payoff-calculator.html"},{title:"credit card payoff",url:"credit-card-payoff-calculator.html"},{title:"credit card interest",url:"credit-card-interest-calculator.html"},{title:"Rental Yield",url:"rental-yield-calculator.html"},{title:"Fuel Cost",url:"fuel-cost-calculator.html"}];function normalize(text){return String(text||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}function rebuildNav(){const nav=document.getElementById("navbar");nav&&"true"!==nav.dataset.cleanRebuilt&&(nav.dataset.cleanRebuilt="true",nav.className="clean-navbar",nav.innerHTML='<div class="clean-nav-inner"><a class="clean-nav-link" href="index.html">Home</a><div class="clean-nav-dropdown clean-calculator-dropdown"><button type="button" class="clean-nav-link clean-nav-button" aria-expanded="false">Tools <span aria-hidden="true">▼</span></button><div class="clean-nav-dropdown-panel clean-calculator-panel"><div class="clean-nav-submenu clean-general-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">General <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="basic-calculator.html">Basic Calculator</a><a href="percentage-calculator.html">Percentage Calculator</a><a href="unit-converter-calculator.html">Unit Converter</a></div></div><div class="clean-nav-submenu clean-health-age-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Health & Age <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="age-calculator.html">Age Calculator</a><a href="bmi-calculator.html">BMI Calculator</a></div></div><div class="clean-nav-submenu clean-education-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Education <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="grade.html">Pointer Grade Calculator</a></div></div><div class="clean-nav-submenu clean-income-tax-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Income & Tax <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="salary-calculator.html">Salary Calculator</a><a href="gaji-penjawat-awam-calculator.html">Gaji Penjawat Awam</a><a href="tax-calculator.html">Tax Calculator</a></div></div><div class="clean-nav-submenu clean-finance-growth-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Finance & Growth <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="inflation-calculator.html">Inflation Calculator</a><a href="compound-interest-calculator.html">Compound Interest</a></div></div><div class="clean-nav-submenu clean-loans-debt-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Loans & Debt <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="loan-calculator.html">Loan Calculator</a><a href="mortgage-calculator.html">Mortgage Calculator</a><a href="personal-loan-calculator.html">Personal Loan</a><a href="loan-comparison-calculator.html">Loan Comparison</a><a href="debt-payoff-calculator.html">Debt Payoff</a><a href="credit-card-payoff-calculator.html">Credit Card Payoff</a><a href="credit-card-interest-calculator.html">Credit Card Interest</a></div></div><div class="clean-nav-submenu clean-property-travel-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Property & Travel <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="rental-yield-calculator.html">Rental Yield</a><a href="fuel-cost-calculator.html">Fuel Cost</a></div></div></div></div><div class="clean-nav-dropdown clean-info-dropdown"><button type="button" class="clean-nav-link clean-nav-button" aria-expanded="false">Resources <span aria-hidden="true">▼</span></button><div class="clean-nav-dropdown-panel clean-info-panel"><a href="about.html">About</a><a href="FAQS.html">FAQs</a><a href="privacy-policy.html">Privacy Policy</a><a href="contact.html">Contact</a></div></div><a class="clean-nav-link clean-chat-link" href="review.html">Review</a><a class="clean-nav-link clean-wall-link" href="Wall.html">Wall</a><form class="clean-nav-search" role="search" autocomplete="off"><label class="clean-nav-search-label" for="cleanCalculatorSearchInput">Search tools</label><input id="cleanCalculatorSearchInput" class="clean-nav-search-input" type="search" placeholder="Search tools" aria-label="Search tools"><button type="submit" class="clean-nav-search-button" aria-label="Search">🔍</button><ul class="clean-nav-search-results" hidden></ul></form></div>',function(nav){const dropdowns=Array.from(nav.querySelectorAll(".clean-nav-dropdown")),submenus=Array.from(nav.querySelectorAll(".clean-nav-submenu"));let closeTimer=null;function clearCloseTimer(){closeTimer&&(clearTimeout(closeTimer),closeTimer=null)}function setDropdownOpen(dropdown,open){const button=dropdown.querySelector(".clean-nav-button");dropdown.classList.toggle("is-open",!!open),button&&button.setAttribute("aria-expanded",open?"true":"false"),open||dropdown.querySelectorAll(".clean-nav-submenu.is-open").forEach(function(submenu){submenu.classList.remove("is-open")})}function closeAllDropdownsExcept(except){dropdowns.forEach(function(dropdown){dropdown!==except&&setDropdownOpen(dropdown,!1)})}function closeSubmenusExcept(submenu){const parentPanel=submenu?submenu.closest(".clean-nav-dropdown-panel"):null;submenus.forEach(function(item){item!==submenu&&(parentPanel&&item.closest(".clean-nav-dropdown-panel")!==parentPanel||item.classList.remove("is-open"))})}function openDropdown(dropdown){clearCloseTimer(),closeAllDropdownsExcept(dropdown),setDropdownOpen(dropdown,!0)}function closeEverything(){dropdowns.forEach(function(dropdown){setDropdownOpen(dropdown,!1)}),submenus.forEach(function(submenu){submenu.classList.remove("is-open")})}dropdowns.forEach(function(dropdown){const button=dropdown.querySelector(".clean-nav-button");button&&(button.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation();const isOpen=dropdown.classList.contains("is-open");closeAllDropdownsExcept(dropdown),setDropdownOpen(dropdown,!isOpen)}),dropdown.addEventListener("mouseenter",function(){openDropdown(dropdown)}),dropdown.addEventListener("focusin",function(){openDropdown(dropdown)}))}),submenus.forEach(function(submenu){const button=submenu.querySelector(".clean-nav-submenu-button");button&&(button.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation();const isOpen=submenu.classList.contains("is-open");closeSubmenusExcept(submenu),submenu.classList.toggle("is-open",!isOpen)}),submenu.addEventListener("mouseenter",function(){clearCloseTimer(),closeSubmenusExcept(submenu),submenu.classList.add("is-open")}),submenu.addEventListener("focusin",function(){clearCloseTimer(),closeSubmenusExcept(submenu),submenu.classList.add("is-open")}))}),nav.addEventListener("mouseenter",clearCloseTimer),nav.addEventListener("mouseleave",function(){clearCloseTimer(),closeTimer=setTimeout(function(){nav.matches(":hover")||nav.contains(document.activeElement)||closeEverything()},450)}),document.addEventListener("click",function(event){nav.contains(event.target)||closeEverything()}),document.addEventListener("keydown",function(event){"Escape"===event.key&&closeEverything()})}(nav),function(nav){const form=nav.querySelector(".clean-nav-search"),input=nav.querySelector(".clean-nav-search-input"),results=nav.querySelector(".clean-nav-search-results");function hideResults(){results.hidden=!0,results.innerHTML=""}function matchesFor(query){const q=normalize(query);return q?calculators.filter(function(item){return normalize(item.title).includes(q)}):[]}function renderResults(){const matches=matchesFor(input.value);normalize(input.value)?(results.hidden=!1,matches.length?results.innerHTML=matches.slice(0,8).map(function(item){return'<li><button type="button" class="clean-nav-search-result" data-url="'+item.url+'">'+item.title+"</button></li>"}).join(""):results.innerHTML='<li class="clean-nav-search-empty">No calculator found</li>'):hideResults()}form&&input&&results&&(input.addEventListener("keydown",function(event){event.stopPropagation(),"Escape"===event.key&&hideResults()},!0),input.addEventListener("keyup",function(event){event.stopPropagation()},!0),input.addEventListener("input",function(event){event.stopPropagation(),renderResults()}),input.addEventListener("focus",function(){renderResults()}),form.addEventListener("submit",function(event){event.preventDefault();const matches=matchesFor(input.value);matches.length&&(window.location.href=matches[0].url)}),results.addEventListener("click",function(event){const button=event.target.closest(".clean-nav-search-result");if(!button)return;const url=button.getAttribute("data-url");url&&(window.location.href=url)}),document.addEventListener("click",function(event){form.contains(event.target)||hideResults()}))}(nav))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",rebuildNav):rebuildNav()}(),function(){"use strict";function dedupeAgeResults(){const panels=Array.from(document.querySelectorAll(".age-clean-result, .age-point-output, #ageResult")).filter(function(el){return function(el){return!(!el||!el.classList.contains("age-clean-result")&&!el.classList.contains("age-point-output")&&"ageResult"!==el.id)}(el)&&!el.closest("#calculatorReportPage")});if(document.body.classList.contains("calculator-report-view"))return void panels.forEach(function(el){el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true")});if(panels.length<=1)return;const main=panels.find(function(el){return"ageExternalOutput"===el.id})||panels[0];panels.forEach(function(el){el!==main&&el.remove()}),main.style.removeProperty("display"),main.style.removeProperty("visibility"),main.removeAttribute("aria-hidden")}function start(){dedupeAgeResults(),setTimeout(dedupeAgeResults,80),setTimeout(dedupeAgeResults,300),setTimeout(dedupeAgeResults,900),setTimeout(dedupeAgeResults,1800),document.addEventListener("input",function(){setTimeout(dedupeAgeResults,300),setTimeout(dedupeAgeResults,900)},!0),document.addEventListener("change",function(){setTimeout(dedupeAgeResults,300),setTimeout(dedupeAgeResults,900)},!0),window.addEventListener("hashchange",function(){setTimeout(dedupeAgeResults,120),setTimeout(dedupeAgeResults,700)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";const resultGroups=[{key:"age",keepId:"ageReportOutput",selector:"#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"},{key:"bmi",keepId:"bmiReportOutput",selector:"#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"},{key:"loan",keepId:"loanExternalOutput",selector:"#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"},{key:"personalLoan",keepId:"personalLoanExternalOutput",selector:"#personalLoanExternalOutput, .personalLoan-clean-result, #personalLoanResult"},{key:"discount",keepId:"discountReportOutput",selector:"#discountReportOutput, .discount-clean-result, #discountResult"},{key:"percentage",keepId:"percentageReportOutput",selector:"#percentageReportOutput, .percentage-clean-result, #percentageResult"},{key:"compound",keepId:"compoundReportOutput",selector:"#compoundReportOutput, .compound-clean-result, #compoundResult"}];function isReportView(){return document.body.classList.contains("calculator-report-view")||!!document.getElementById("calculatorReportPage")}function cleanupGroup(group){let panels=Array.from(document.querySelectorAll(group.selector)).filter(function(panel){return panel&&!panel.closest("#calculatorReportPage")});if(!panels.length)return;const preferred=document.getElementById(group.keepId),keep=preferred&&panels.includes(preferred)?preferred:panels[panels.length-1];panels.forEach(function(panel){panel!==keep&&(panel.id&&panel.id!==group.keepId?(panel.style.setProperty("display","none","important"),panel.style.setProperty("visibility","hidden","important"),panel.setAttribute("aria-hidden","true")):panel.remove())}),isReportView()||(keep.style.removeProperty("display"),keep.style.removeProperty("visibility"),keep.removeAttribute("aria-hidden"))}function cleanupResults(){isReportView()&&document.querySelectorAll(".calculator-clean-result, .loan-style-output-panel, .mortgage-modern-result-panel").forEach(function(panel){panel.closest("#calculatorReportPage")||(panel.style.setProperty("display","none","important"),panel.style.setProperty("visibility","hidden","important"),panel.setAttribute("aria-hidden","true"))}),isReportView()||resultGroups.forEach(cleanupGroup)}function start(){cleanupResults(),setTimeout(cleanupResults,100),setTimeout(cleanupResults,500),setTimeout(cleanupResults,1200),setTimeout(cleanupResults,2400),document.addEventListener("input",function(){setTimeout(cleanupResults,2100),setTimeout(cleanupResults,2600)},!0),document.addEventListener("change",function(){setTimeout(cleanupResults,2100),setTimeout(cleanupResults,2600)},!0),window.addEventListener("hashchange",function(){setTimeout(cleanupResults,100),setTimeout(cleanupResults,800)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";const pageResultSelectors=[["ageReportOutput","#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"],["bmiReportOutput","#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"],["loanExternalOutput","#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"],["personalLoanExternalOutput","#personalLoanExternalOutput, .personalLoan-clean-result, #personalLoanResult"],["discountReportOutput","#discountReportOutput, .discount-clean-result, #discountResult"],["percentageReportOutput","#percentageReportOutput, .percentage-clean-result, #percentageResult"],["compoundReportOutput","#compoundReportOutput, .compound-clean-result, #compoundResult"]];function cleanupOne(keepId,selector){const panels=Array.from(document.querySelectorAll(selector)).filter(function(el){return el&&!el.closest("#calculatorReportPage")});if(!panels.length)return;if(document.body.classList.contains("calculator-report-view")||document.getElementById("calculatorReportPage"))return void panels.forEach(function(el){el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true")});const preferred=document.getElementById(keepId),keep=preferred&&panels.includes(preferred)?preferred:panels[panels.length-1];panels.forEach(function(el){el!==keep&&(el.id&&el.id!==keepId?(el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true")):el.remove())}),keep.style.removeProperty("display"),keep.style.removeProperty("visibility"),keep.removeAttribute("aria-hidden")}function cleanupAllResults(){pageResultSelectors.forEach(function(pair){cleanupOne(pair[0],pair[1])})}function start(){cleanupAllResults(),[100,500,1200,2200,3200].forEach(function(delay){setTimeout(cleanupAllResults,delay)}),document.addEventListener("input",function(){setTimeout(cleanupAllResults,2200),setTimeout(cleanupAllResults,3e3)},!0),document.addEventListener("change",function(){setTimeout(cleanupAllResults,2200),setTimeout(cleanupAllResults,3e3)},!0),window.addEventListener("hashchange",function(){setTimeout(cleanupAllResults,100),setTimeout(cleanupAllResults,800)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function $(id){return document.getElementById(id)}function n(id){const el=$(id);if(!el)return NaN;const value=String(el.value||"").replace(/,/g,"").trim();return""===value?NaN:Number(value)}function val(id){const el=$(id);return el?String(el.value||"").trim():""}function money(value,prefix){const p=prefix||"RM";return Number.isFinite(value)?p+" "+value.toLocaleString("en-US",{maximumFractionDigits:2}):"Not available"}function num(value,digits){return Number.isFinite(value)?value.toLocaleString("en-US",{maximumFractionDigits:null==digits?2:digits}):"Not available"}function extraVisibleTitle(title){return String(title||"").replace(/\s+calculator\s+result\s*$/i," calculator").replace(/\s+result\s*$/i,"").trim()||"Answer"}function extraVisibleLabel(label){const text=String(null==label?"":label);return/^\s*result\s*$/i.test(text)?"Answer":text}function extraPlainText(title,rows,note){const lines=[extraVisibleTitle(title)];return(rows||[]).forEach(function(row){lines.push(extraVisibleLabel(row[0])+": "+row[1])}),note&&lines.push("Note: "+note),lines.join("\n")}function extraDownloadTextFile(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download=filename,document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},0)}function extraDateStamp(){const d=new Date;return[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0"),String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join("-")}function extraSetButton(button,text){if(!button)return;const oldText=button.textContent;button.textContent=text,setTimeout(function(){button.textContent=oldText},1200)}function extraCopyText(text,button){navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text).then(function(){extraSetButton(button,"Copied!")}).catch(function(){extraFallbackCopy(text,button)}):extraFallbackCopy(text,button)}function extraFallbackCopy(text,button){const area=document.createElement("textarea");area.value=text,area.setAttribute("readonly",""),area.style.position="fixed",area.style.left="-9999px",document.body.appendChild(area),area.select();try{document.execCommand("copy"),extraSetButton(button,"Copied!")}catch(error){extraSetButton(button,"Copy failed")}area.remove()}function extraFieldLabel(input){if(!input)return"Input";let label=null;var value;return input.id&&(label=document.querySelector('label[for="'+(value=input.id,String(value||"").replace(/[^a-zA-Z0-9_-]/g,"\\$&")+'"]'))),!label&&input.closest&&(label=input.closest("label")),label?cleanText(label.textContent).replace(/[:*]+$/g,"")||input.name||input.id||"Input":input.getAttribute("aria-label")||input.placeholder||input.name||input.id||"Input"}function extraReportTable(title,rows){return'<div class="calculator-report-table-scroll extra-report-table-scroll"><table class="calculator-report-data-table extra-report-data-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>'+function(rows){return(rows||[]).map(function(row){return"<tr><th>"+escapeHtml(extraVisibleLabel(row[0]))+"</th><td>"+escapeHtml(row[1])+"</td></tr>"}).join("")}(rows||[])+"</tbody></table></div>"}function extraOpenReport(title,rows,note){const old=document.getElementById("extraCalculatorReportPage");old&&old.remove(),document.body.classList.add("calculator-report-view"),document.querySelectorAll("main, .calculator, .extra-calculator-layout, #extraCalcResult").forEach(function(element){element.style.setProperty("display","none","important")});const section=document.createElement("section");section.id="extraCalculatorReportPage",section.className="calculator-report-page mortgage-fast-report-page extra-calculator-report-page table-report-page";const inputRows=function(){const root=document.querySelector(".extra-calculator-box")||document.querySelector(".calculator")||document,used=new Set;return Array.from(root.querySelectorAll("input, select, textarea")).filter(function(input){const type=String(input.type||"").toLowerCase();if(["button","submit","reset","hidden"].includes(type))return!1;if(input.disabled)return!1;if(null===input.offsetParent&&"radio"!==type&&"checkbox"!==type)return!1;const key=input.id||input.name;return(!key||!used.has(key))&&(key&&used.add(key),"checkbox"===type||"radio"===type?input.checked:""!==String(input.value||"").trim()||"SELECT"===input.tagName)}).map(function(input){const type=String(input.type||"").toLowerCase();let value="";return value="SELECT"===input.tagName?input.options&&input.selectedIndex>=0?input.options[input.selectedIndex].text:input.value:"checkbox"===type||"radio"===type?input.checked?input.value||"Selected":"Not selected":input.value,[extraFieldLabel(input),value||"-"]})}();section.innerHTML="<h1>"+escapeHtml(extraVisibleTitle(title))+'</h1><p class="calculator-report-date"><strong>Generated:</strong> '+escapeHtml((new Date).toLocaleString())+'</p><div class="calculator-report-card extra-report-input-card"><h2>Inputs</h2>'+extraReportTable(0,inputRows.length?inputRows:[["Input","No input saved"]])+'</div><div class="calculator-report-card extra-report-result-card"><h2>Results</h2>'+extraReportTable(0,rows)+(note?'<p class="extra-result-note">'+escapeHtml(note)+"</p>":"")+'</div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn extra-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn extra-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn extra-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn extra-report-share-btn">Share report</button></div>',document.body.appendChild(section);const text=extraPlainText(title,inputRows.concat(rows||[]),note),back=section.querySelector(".extra-report-back-btn"),copy=section.querySelector(".extra-report-copy-btn"),save=section.querySelector(".extra-report-save-btn"),share=section.querySelector(".extra-report-share-btn");back&&(back.onclick=function(){section.remove(),document.body.classList.remove("calculator-report-view"),document.querySelectorAll("main, .calculator, .extra-calculator-layout, #extraCalcResult").forEach(function(element){element.style.removeProperty("display")})}),copy&&(copy.onclick=function(){extraCopyText(text,copy)}),save&&(save.onclick=function(){extraDownloadTextFile("calculator-report-"+extraDateStamp()+".txt",text),extraSetButton(save,"Saved!")}),share&&(share.onclick=function(){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){extraCopyText(text,share)}):extraCopyText(text,share)}),section.scrollIntoView({behavior:"smooth",block:"start"})}function show(title,rows,note){const box=$("extraCalcResult");box&&(box.innerHTML=function(title,rows){return'<div class="extra-result-card"><h2>'+extraVisibleTitle(title)+'</h2><table class="extra-result-table"><tbody>'+rows.map(function(row){return"<tr><th>"+extraVisibleLabel(row[0])+"</th><td>"+row[1]+"</td></tr>"}).join("")+"</tbody></table></div>"}(title,rows)+(note?'<p class="extra-result-note">'+note+"</p>":"")+'<div class="extra-result-actions"><button type="button" class="extra-result-action-btn extra-result-copy-btn">Copy</button><button type="button" class="extra-result-action-btn extra-result-save-btn">Save</button><button type="button" class="extra-result-action-btn extra-result-share-btn">Share</button><button type="button" class="extra-result-action-btn extra-result-report-btn">Report</button></div>',box.hidden=!1,function(box,title,rows,note){const text=extraPlainText(title,rows,note),copy=box.querySelector(".extra-result-copy-btn"),save=box.querySelector(".extra-result-save-btn"),share=box.querySelector(".extra-result-share-btn"),report=box.querySelector(".extra-result-report-btn");copy&&(copy.onclick=function(){extraCopyText(text,copy)}),save&&(save.onclick=function(){extraDownloadTextFile("calculator-result-"+extraDateStamp()+".txt",text),extraSetButton(save,"Saved!")}),share&&(share.onclick=function(){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){extraCopyText(text,share)}):extraCopyText(text,share)}),report&&(report.onclick=function(){extraOpenReport(title,rows,note)})}(box,title,rows,note))}function loanPayment(principal,annualRate,months){if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(months)||principal<=0||months<=0)return NaN;const r=annualRate/100/12;return 0===r?principal/months:principal*r/(1-Math.pow(1+r,-months))}window.calculateSalaryExtra=function(){const gross=n("salaryGross"),epfRate=n("salaryEpfRate"),socso=n("salarySocso"),tax=n("salaryTax"),other=n("salaryOther");if(!Number.isFinite(gross)||gross<=0)return;const epf=gross*((Number.isFinite(epfRate)?epfRate:11)/100),totalDeduct=epf+(Number.isFinite(socso)?socso:0)+(Number.isFinite(tax)?tax:0)+(Number.isFinite(other)?other:0),net=gross-totalDeduct;show("Salary result",[["Gross monthly salary",money(gross)],["EPF deduction",money(epf)],["Other deductions",money(totalDeduct-epf)],["Net monthly salary",money(net)],["Estimated net yearly",money(12*net)]])},window.calculateCreditCardPayoffExtra=function(){const balance=n("ccBalance"),apr=n("ccApr"),payment=n("ccPayment");if(!Number.isFinite(balance)||!Number.isFinite(apr)||!Number.isFinite(payment)||balance<=0||payment<=0)return;let bal=balance,totalInterest=0,months=0;const monthlyRate=apr/100/12;for(;bal>.01&&months<1200;){const interest=bal*monthlyRate;if(totalInterest+=interest,bal+=interest,payment<=interest&&monthlyRate>0)return void show("Credit card payoff result",[["Balance",money(balance)],["Monthly interest",money(interest)],["Monthly payment",money(payment)],["Status","Payment is too low to reduce the balance"]],"Increase the monthly payment to pay off the card.");bal-=payment,months+=1}show("Credit card payoff result",[["Months to pay off",months+" months"],["Years to pay off",(months/12).toFixed(1)+" years"],["Total interest",money(totalInterest)],["Total paid",money(balance+totalInterest)]])},window.calculateLoanComparisonExtra=function(){const amount=n("loanCompareAmount"),rateA=n("loanCompareRateA"),termA=n("loanCompareTermA"),rateB=n("loanCompareRateB"),termB=n("loanCompareTermB");if(![amount,rateA,termA,rateB,termB].every(Number.isFinite))return;const monthsA=12*termA,monthsB=12*termB,payA=loanPayment(amount,rateA,monthsA),payB=loanPayment(amount,rateB,monthsB),totalA=payA*monthsA,totalB=payB*monthsB;show("Loan comparison result",[["Loan A monthly payment",money(payA)],["Loan A total interest",money(totalA-amount)],["Loan A total paid",money(totalA)],["Loan B monthly payment",money(payB)],["Loan B total interest",money(totalB-amount)],["Loan B total paid",money(totalB)],["Lower total cost",totalA<=totalB?"Loan A":"Loan B"],["Difference",money(Math.abs(totalA-totalB))]])},window.calculateDebtPayoffExtra=function(){const debt=n("debtTotal"),apr=n("debtApr"),payment=n("debtPayment"),extra=n("debtExtra");if(![debt,apr,payment].every(Number.isFinite)||debt<=0||payment<=0)return;const monthlyPayment=payment+(Number.isFinite(extra)?extra:0);let bal=debt,totalInterest=0,months=0;const rate=apr/100/12;for(;bal>.01&&months<1200;){const interest=bal*rate;if(totalInterest+=interest,bal+=interest,monthlyPayment<=interest&&rate>0)return void show("Debt payoff result",[["Monthly interest",money(interest)],["Monthly payment",money(monthlyPayment)],["Status","Payment is too low to reduce debt"]]);bal-=monthlyPayment,months+=1}show("Debt payoff result",[["Total debt",money(debt)],["Monthly payment used",money(monthlyPayment)],["Months to debt free",months+" months"],["Years to debt free",(months/12).toFixed(1)+" years"],["Total interest",money(totalInterest)]])},window.calculateTaxExtra=function(){const income=n("taxAnnualIncome"),relief=n("taxRelief"),rate=n("taxRate");if(!Number.isFinite(income)||income<=0)return;const taxable=Math.max(0,income-(Number.isFinite(relief)?relief:0)),tax=taxable*((Number.isFinite(rate)?rate:10)/100);show("Tax estimator result",[["Annual income",money(income)],["Relief / deduction",money(Number.isFinite(relief)?relief:0)],["Estimated taxable income",money(taxable)],["Tax rate used",(Number.isFinite(rate)?rate:10).toFixed(2)+"%"],["Estimated tax",money(tax)],["Estimated monthly tax",money(tax/12)]],"This is a simple estimator using your entered rate. It is not official tax advice.")},window.calculateGajiPenjawatAwamExtra=function(){const basic=n("gajiBasic"),fixed=n("gajiFixedAllowance"),cola=n("gajiCola"),other=n("gajiOtherAllowance"),deductions=n("gajiDeductions");if(!Number.isFinite(basic)||basic<=0)return;const allowance=(Number.isFinite(fixed)?fixed:0)+(Number.isFinite(cola)?cola:0)+(Number.isFinite(other)?other:0),gross=basic+allowance,net=gross-(Number.isFinite(deductions)?deductions:0);show("Gaji penjawat awam result",[["Gaji pokok",money(basic)],["Jumlah elaun",money(allowance)],["Gaji kasar",money(gross)],["Potongan",money(Number.isFinite(deductions)?deductions:0)],["Anggaran gaji bersih",money(net)]],"Masukkan nilai elaun dan potongan sendiri mengikut slip gaji anda.")},window.calculateInflationExtra=function(){const amount=n("inflationAmount"),rate=n("inflationRate"),years=n("inflationYears");if(![amount,rate,years].every(Number.isFinite))return;const future=amount*Math.pow(1+rate/100,years),loss=amount/Math.pow(1+rate/100,years);show("Inflation result",[["Today amount",money(amount)],["Inflation rate",rate.toFixed(2)+"%"],["Years",years],["Future cost estimate",money(future)],["Today buying power after period",money(loss)]])},window.calculateRentalYieldExtra=function(){const price=n("rentalPropertyPrice"),rent=n("rentalMonthlyRent"),expenses=n("rentalAnnualExpenses");if(!Number.isFinite(price)||!Number.isFinite(rent)||price<=0)return;const annualRent=12*rent,grossYield=annualRent/price*100,netYield=(annualRent-(Number.isFinite(expenses)?expenses:0))/price*100;show("Rental yield result",[["Property price",money(price)],["Annual rent",money(annualRent)],["Annual expenses",money(Number.isFinite(expenses)?expenses:0)],["Gross rental yield",grossYield.toFixed(2)+"%"],["Net rental yield",netYield.toFixed(2)+"%"]])},window.calculateFuelCostExtra=function(){const distance=n("fuelDistance"),efficiency=n("fuelEfficiency"),price=n("fuelPrice"),people=n("fuelPeople");if(![distance,efficiency,price].every(Number.isFinite)||efficiency<=0)return;const liters=distance/100*efficiency,total=liters*price,perPerson=total/(Number.isFinite(people)&&people>0?people:1);show("Fuel cost result",[["Distance",num(distance)+" km"],["Fuel needed",num(liters)+" L"],["Total fuel cost",money(total)],["Cost per person",money(perPerson)]])},window.calculateCreditCardInterestExtra=function(){const balance=n("ccInterestBalance"),apr=n("ccInterestApr"),days=n("ccInterestDays"),payment=n("ccInterestPayment");if(![balance,apr,days].every(Number.isFinite))return;const afterPayment=Math.max(0,balance-(Number.isFinite(payment)?payment:0)),interest=afterPayment*(apr/100)*(days/365);show("Credit card interest result",[["Starting balance",money(balance)],["Payment",money(Number.isFinite(payment)?payment:0)],["Balance used",money(afterPayment)],["APR",apr.toFixed(2)+"%"],["Days",days],["Estimated interest",money(interest)]])},window.calculateScientificExtra=function(){const input=document.getElementById("scientificExpression");input&&input.dispatchEvent(new Event("input",{bubbles:!0}));document.querySelectorAll("#extraCalcResult,#universalLoanStyleOutput,.extra-result-box,.calculator-result,.result-box").forEach(function(box){box.hidden=!0;box.innerHTML="";box.style.setProperty("display","none","important")})};const unitFactors={length:{m:1,km:1e3,cm:.01,mm:.001,mile:1609.344,yard:.9144,foot:.3048,inch:.0254},weight:{kg:1,g:.001,lb:.45359237,oz:.0283495},volume:{liter:1,ml:.001,gallon:3.78541,cup:.236588}};window.calculateUnitConverterExtra=function(){const type=val("unitType"),value=n("unitValue"),from=val("unitFrom"),to=val("unitTo");if(!(Number.isFinite(value)&&type&&from&&to))return;let result;if("temperature"===type)result=function(value,from,to){let c=value;return"f"===from&&(c=5*(value-32)/9),"k"===from&&(c=value-273.15),"f"===to?9*c/5+32:"k"===to?c+273.15:c}(value,from,to);else{const factors=unitFactors[type]||{};result=value*factors[from]/factors[to]}show("Unit converter result",[["Value",num(value)+" "+from],["Converted",num(result,6)+" "+to]])},window.calculateCurrencyConverterExtra=function(){const amount=n("currencyAmount"),from=val("currencyFrom").toUpperCase()||"FROM",to=val("currencyTo").toUpperCase()||"TO",rate=n("currencyRate");Number.isFinite(amount)&&Number.isFinite(rate)&&show("Currency converter result",[["Amount",num(amount)+" "+from],["Exchange rate used","1 "+from+" = "+num(rate,6)+" "+to],["Converted amount",num(amount*rate,2)+" "+to]],"This static GitHub Pages converter uses the exchange rate you enter manually.")};const pageMap={salary:window.calculateSalaryExtra,creditCardPayoff:window.calculateCreditCardPayoffExtra,loanComparison:window.calculateLoanComparisonExtra,debtPayoff:window.calculateDebtPayoffExtra,tax:window.calculateTaxExtra,gajiPenjawatAwam:window.calculateGajiPenjawatAwamExtra,inflation:window.calculateInflationExtra,rentalYield:window.calculateRentalYieldExtra,fuelCost:window.calculateFuelCostExtra,creditCardInterest:window.calculateCreditCardInterestExtra,scientific:window.calculateScientificExtra,unitConverter:window.calculateUnitConverterExtra,currencyConverter:window.calculateCurrencyConverterExtra};function start(){const fn=pageMap[document.body?document.body.dataset.page:""];if(!fn)return;let timer=null;document.addEventListener("input",function(event){event.target.closest(".extra-calculator-box")&&(clearTimeout(timer),timer=setTimeout(fn,2e3))},!0),document.addEventListener("change",function(event){event.target.closest(".extra-calculator-box")&&(clearTimeout(timer),timer=setTimeout(fn,2e3))},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function setupExtraHelpButton(){const button=document.querySelector(".extra-help-question-button"),panel=document.querySelector(".extra-help-panel");function setOpen(open){panel.hidden=!open,document.body.classList.toggle("extra-help-open",open),button.setAttribute("aria-expanded",open?"true":"false")}button&&panel&&"true"!==button.dataset.ready&&(button.dataset.ready="true",panel.hidden=!0,button.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation(),setOpen(panel.hidden)}),document.addEventListener("keydown",function(event){"Escape"===event.key&&setOpen(!1)}),document.addEventListener("click",function(event){panel.hidden||panel.contains(event.target)||button.contains(event.target)||setOpen(!1)}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",setupExtraHelpButton):setupExtraHelpButton()}(),function(){"use strict";function keepFirst(selector){Array.prototype.slice.call(document.querySelectorAll(selector)).slice(1).forEach(function(node){node.remove()})}function cleanOnce(){const menu=document.getElementById("menuIcon");menu&&menu.remove(),document.body.classList.remove("menu-scrolled"),document.documentElement.classList.remove("menu-scrolled");const nav=document.getElementById("navbar");nav&&(nav.classList.remove("open"),nav.classList.add("clean-navbar")),keepFirst("#navbar"),keepFirst("main.grouped-calculator-home"),keepFirst("#liveAbacus"),keepFirst("#liveAbacusValueText"),keepFirst("#liveAbacusReset")}function val(id){const el=document.getElementById(id);return el?String(el.value||"").trim():""}function has(ids){return ids.some(function(id){return""!==val(id)})}function all(ids){return ids.every(function(id){return""!==val(id)})}function pageType(){const path=(location.pathname||"").toLowerCase();return path.includes("age-calculator")?"age":path.includes("bmi-calculator")?"bmi":path.includes("mortgage-calculator")?"loan":path.includes("personal-loan-calculator")?"personalLoan":path.includes("discount-calculator")?"discount":path.includes("percentage-calculator")?"percentage":path.includes("compound-interest-calculator")?"compound":path.includes("salary-calculator")?"salary":path.includes("credit-card-payoff-calculator")?"creditCardPayoff":path.includes("loan-comparison-calculator")?"loanComparison":path.includes("debt-payoff-calculator")?"debtPayoff":path.includes("tax-calculator")?"tax":path.includes("gaji-penjawat-awam-calculator")?"gajiPenjawatAwam":path.includes("inflation-calculator")?"inflation":path.includes("rental-yield-calculator")?"rentalYield":path.includes("fuel-cost-calculator")?"fuelCost":path.includes("credit-card-interest-calculator")?"creditCardInterest":path.includes("scientific-calculator")?"scientific":path.includes("unit-converter-calculator")?"unitConverter":path.includes("currency-converter")?"currencyConverter":""}function canCalc(type){if("age"===type)return has(["birthdate"]);if("bmi"===type)return has(["weight","bmiWeight"])&&has(["height","bmiHeight"]);if("loan"===type)return all(["amount","interest","years"]);if("personalLoan"===type)return has(["personalLoanAmount","loanAmount","amount"]);if("discount"===type)return all(["price","discount"]);if("percentage"===type)return has(["percentage","percent"])&&has(["number","amount","value"]);if("compound"===type)return all(["principal","rate","years"]);const required={salary:["salaryGross"],creditCardPayoff:["ccBalance","ccApr","ccPayment"],loanComparison:["loanCompareAmount","loanCompareRateA","loanCompareTermA","loanCompareRateB","loanCompareTermB"],debtPayoff:["debtTotal","debtApr","debtPayment"],tax:["taxAnnualIncome"],gajiPenjawatAwam:["gajiBasic"],inflation:["inflationAmount","inflationRate","inflationYears"],rentalYield:["rentalPropertyPrice","rentalMonthlyRent"],fuelCost:["fuelDistance","fuelEfficiency","fuelPrice"],creditCardInterest:["ccInterestBalance","ccInterestApr","ccInterestDays"],scientific:["scientificExpression"],unitConverter:["unitType","unitValue","unitFrom","unitTo"],currencyConverter:["currencyAmount","currencyFrom","currencyTo","currencyRate"]};return!!required[type]&&all(required[type])}function callCalc(type){const fn={age:"calculateAge",bmi:"calculateBMI",loan:"calculateLoan",personalLoan:"calculatePersonalLoan",discount:"calculateDiscount",percentage:"calculatePercentage",compound:"calculateCompound",salary:"calculateSalaryExtra",creditCardPayoff:"calculateCreditCardPayoffExtra",loanComparison:"calculateLoanComparisonExtra",debtPayoff:"calculateDebtPayoffExtra",tax:"calculateTaxExtra",gajiPenjawatAwam:"calculateGajiPenjawatAwamExtra",inflation:"calculateInflationExtra",rentalYield:"calculateRentalYieldExtra",fuelCost:"calculateFuelCostExtra",creditCardInterest:"calculateCreditCardInterestExtra",scientific:"calculateScientificExtra",unitConverter:"calculateUnitConverterExtra",currencyConverter:"calculateCurrencyConverterExtra"}[type];fn&&"function"==typeof window[fn]&&window[fn]()}var fn;fn=function(){cleanOnce(),function(){let timer=null;document.addEventListener("input",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;if(target.closest("#navbar, #scrollTopBtn, .clean-nav-search"))return;const type=pageType();type&&(clearTimeout(timer),timer=setTimeout(function(){canCalc(type)&&callCalc(type)},2e3))},!0),document.addEventListener("change",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;if(target.closest("#navbar, #scrollTopBtn, .clean-nav-search"))return;const type=pageType();type&&(clearTimeout(timer),timer=setTimeout(function(){canCalc(type)&&callCalc(type)},2e3))},!0)}()},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",fn):fn(),window.toggleMenu=function(){return cleanOnce(),!1}}(),function(){"use strict";function setupFinalTopMenuHoverClick(){const nav=document.querySelector("#navbar.clean-navbar");function topDropdowns(){return Array.from(nav.querySelectorAll(".clean-nav-dropdown"))}function submenus(){return Array.from(nav.querySelectorAll(".clean-nav-submenu"))}function directButton(parent,selector){return parent?parent.querySelector(":scope > "+selector):null}function setTopExpanded(dropdown,open){const button=directButton(dropdown,".clean-nav-button");button&&button.setAttribute("aria-expanded",open?"true":"false")}function setSubExpanded(submenu,open){const button=directButton(submenu,".clean-nav-submenu-button");button&&button.setAttribute("aria-expanded",open?"true":"false")}function closeTopDropdown(dropdown){dropdown&&(dropdown.classList.remove("is-open"),setTopExpanded(dropdown,!1),function(dropdown){dropdown&&dropdown.querySelectorAll(".clean-nav-submenu.is-open").forEach(function(submenu){submenu.classList.remove("is-open"),setSubExpanded(submenu,!1)})}(dropdown))}function closeEverything(){topDropdowns().forEach(closeTopDropdown)}function openTopDropdown(dropdown){dropdown&&(topDropdowns().forEach(function(item){item!==dropdown&&closeTopDropdown(item)}),dropdown.classList.add("is-open"),setTopExpanded(dropdown,!0))}function openSubmenu(submenu){if(!submenu)return;const topDropdown=submenu.closest(".clean-nav-dropdown");topDropdown&&openTopDropdown(topDropdown),function(currentSubmenu){const parentPanel=currentSubmenu?currentSubmenu.closest(".clean-nav-dropdown-panel"):null;submenus().forEach(function(submenu){submenu!==currentSubmenu&&(parentPanel&&submenu.closest(".clean-nav-dropdown-panel")!==parentPanel||(submenu.classList.remove("is-open"),setSubExpanded(submenu,!1)))})}(submenu),submenu.classList.add("is-open"),setSubExpanded(submenu,!0)}nav&&"true"!==nav.dataset.finalTopMenuHoverClick&&(nav.dataset.finalTopMenuHoverClick="true",submenus().forEach(function(submenu){const button=directButton(submenu,".clean-nav-submenu-button");button&&!button.hasAttribute("aria-expanded")&&button.setAttribute("aria-expanded",submenu.classList.contains("is-open")?"true":"false")}),nav.addEventListener("mouseover",function(event){const submenu=event.target.closest(".clean-nav-submenu");if(submenu&&nav.contains(submenu))return void openSubmenu(submenu);const dropdown=event.target.closest(".clean-nav-dropdown");dropdown&&nav.contains(dropdown)?openTopDropdown(dropdown):event.target.closest(".clean-nav-link, .clean-nav-search")&&closeEverything()},!0),nav.addEventListener("click",function(event){const submenuButton=event.target.closest(".clean-nav-submenu-button");if(submenuButton&&nav.contains(submenuButton)){const submenu=submenuButton.closest(".clean-nav-submenu");if(submenu)return event.preventDefault(),event.stopImmediatePropagation(),void openSubmenu(submenu)}const topButton=event.target.closest(".clean-nav-button");if(topButton&&nav.contains(topButton)){const dropdown=topButton.closest(".clean-nav-dropdown");if(dropdown)return event.preventDefault(),event.stopImmediatePropagation(),void openTopDropdown(dropdown)}event.target.closest(".clean-nav-link, .clean-nav-search-input")&&closeEverything()},!0),nav.addEventListener("focusin",function(event){const submenu=event.target.closest(".clean-nav-submenu");if(submenu&&nav.contains(submenu))return void openSubmenu(submenu);const dropdown=event.target.closest(".clean-nav-dropdown");dropdown&&nav.contains(dropdown)?openTopDropdown(dropdown):event.target.closest(".clean-nav-link, .clean-nav-search")&&closeEverything()},!0),document.addEventListener("click",function(event){nav.contains(event.target)||closeEverything()}),document.addEventListener("keydown",function(event){"Escape"===event.key&&closeEverything()}),nav.addEventListener("mouseleave",function(){window.setTimeout(function(){nav.matches(":hover")||nav.contains(document.activeElement)||closeEverything()},250)}))}function startFinalTopMenuHoverClick(){setupFinalTopMenuHoverClick(),window.setTimeout(setupFinalTopMenuHoverClick,250),window.setTimeout(setupFinalTopMenuHoverClick,800)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startFinalTopMenuHoverClick):startFinalTopMenuHoverClick()}(),function(){"use strict";const ACTION_ROW_SELECTOR=[".age-result-actions",".bmi-result-actions",".universal-result-actions",".mortgage-result-actions",".mortgage-result-actions-final",".extra-result-actions",".global-result-actions",".calculator-report-actions"].join(", ");function forceImportant(element,property,value){element&&element.style&&element.style.setProperty(property,value,"important")}function fixActionRows(root){const scope=root&&root.querySelectorAll?root:document,rows=[];scope.matches&&scope.matches(ACTION_ROW_SELECTOR)&&rows.push(scope),scope.querySelectorAll(ACTION_ROW_SELECTOR).forEach(function(row){rows.push(row)}),rows.forEach(function(row){const buttons=Array.from(row.children).filter(function(child){return child&&child.matches&&child.matches("button, a")});buttons.length&&(row.classList.add("calculator-action-row-fixed"),row.setAttribute("data-result-actions-fixed","true"),forceImportant(row,"width","100%"),forceImportant(row,"max-width","100%"),forceImportant(row,"display","grid"),forceImportant(row,"grid-template-columns","repeat("+buttons.length+", minmax(0, 1fr))"),forceImportant(row,"gap",window.matchMedia("(max-width: 850px)").matches?"5px":"8px"),forceImportant(row,"align-items","stretch"),forceImportant(row,"justify-content","stretch"),forceImportant(row,"box-sizing","border-box"),buttons.forEach(function(button){button.classList.add("calculator-action-button-fixed"),forceImportant(button,"width","100%"),forceImportant(button,"min-width","0"),forceImportant(button,"max-width","100%"),forceImportant(button,"height",window.matchMedia("(max-width: 850px)").matches?"36px":"40px"),forceImportant(button,"min-height",window.matchMedia("(max-width: 850px)").matches?"36px":"40px"),forceImportant(button,"margin","0"),forceImportant(button,"padding",window.matchMedia("(max-width: 850px)").matches?"5px 2px":"6px 4px"),forceImportant(button,"display","inline-flex"),forceImportant(button,"align-items","center"),forceImportant(button,"justify-content","center"),forceImportant(button,"box-sizing","border-box"),forceImportant(button,"text-align","center"),forceImportant(button,"line-height","1"),forceImportant(button,"white-space","nowrap"),forceImportant(button,"overflow","hidden"),forceImportant(button,"text-overflow","ellipsis")}))})}function startResultActionRowFix(){fixActionRows(document),[100,300,700,1200].forEach(function(delay){setTimeout(function(){fixActionRows(document)},delay)}),document.body&&!document.body.dataset.resultActionRowObserverReady&&(document.body.dataset.resultActionRowObserverReady="true",new MutationObserver(function(mutations){mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){node&&1===node.nodeType&&fixActionRows(node)})})}).observe(document.body,{childList:!0,subtree:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startResultActionRowFix):startResultActionRowFix()}(),function(){"use strict";const NATIVE_RESULT_IDS=["result","ageResult","bmiResult","loanResult","personalLoanResult","discountResult","percentageResult","compoundResult"],RESULT_GROUPS=[{name:"basic",preferredIds:["universalLoanStyleOutput"],selector:"#universalLoanStyleOutput, .basic-equal-output-panel"},{name:"age",preferredIds:["ageReportOutput"],selector:"#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"},{name:"bmi",preferredIds:["bmiReportOutput"],selector:"#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"},{name:"loanMortgage",preferredIds:["loanExternalOutput"],selector:"#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"},{name:"personalLoan",preferredIds:["personalLoanExternalOutput"],selector:"#personalLoanExternalOutput, .personalLoan-clean-result, .personal-loan-clean-result, #personalLoanResult"},{name:"discount",preferredIds:["discountReportOutput"],selector:"#discountReportOutput, .discount-clean-result, #discountResult"},{name:"percentage",preferredIds:["percentageReportOutput"],selector:"#percentageReportOutput, .percentage-clean-result, #percentageResult"},{name:"compound",preferredIds:["compoundReportOutput"],selector:"#compoundReportOutput, .compound-clean-result, #compoundResult"},{name:"extra",preferredIds:["extraCalcResult"],selector:"#extraCalcResult, .extra-result-box"}];function isElement(node){return!(!node||1!==node.nodeType)}function hideElement(el){isElement(el)&&(el.hidden=!0,el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.style.setProperty("opacity","0","important"),el.setAttribute("aria-hidden","true"))}function isNativeResultPlaceholder(el){return!(!isElement(el)||!el.id||-1===NATIVE_RESULT_IDS.indexOf(el.id))}function collectPanels(selector){return function(list){const seen=new Set;return list.filter(function(el){return!(!isElement(el)||seen.has(el)||(seen.add(el),0))})}(Array.from(document.querySelectorAll(selector))).filter(function(el){return!el.closest("#calculatorReportPage")})}function cleanupGroup(group){const panels=collectPanels(group.selector);if(!panels.length)return;if(document.body&&(document.body.classList.contains("calculator-report-view")||document.getElementById("calculatorReportPage")||0===String(window.location.hash||"").indexOf("#calc-report=")))return void panels.forEach(hideElement);const keep=function(group,panels){for(let i=0;i<group.preferredIds.length;i+=1){const el=document.getElementById(group.preferredIds[i]);if(el&&-1!==panels.indexOf(el))return el}const visiblePanels=panels.filter(function(el){if(isNativeResultPlaceholder(el))return!1;const style=window.getComputedStyle?window.getComputedStyle(el):null;return!style||"none"!==style.display&&"hidden"!==style.visibility});return visiblePanels[visiblePanels.length-1]||panels[panels.length-1]||null}(group,panels);var el;panels.forEach(function(panel){panel!==keep&&(isNativeResultPlaceholder(panel)||panel.id&&-1===group.preferredIds.indexOf(panel.id)?hideElement(panel):panel.remove())}),keep&&!isNativeResultPlaceholder(keep)&&isElement(el=keep)&&(el.hidden=!1,el.style.setProperty("display","block","important"),el.style.setProperty("visibility","visible","important"),el.style.setProperty("opacity","1","important"),el.removeAttribute("aria-hidden"))}function cleanupDuplicateResults(){NATIVE_RESULT_IDS.forEach(function(id){const el=document.getElementById(id);el&&!el.closest("#calculatorReportPage")&&hideElement(el)}),RESULT_GROUPS.forEach(function(group){cleanupGroup(group)})}function scheduleCleanup(){cleanupDuplicateResults(),[50,150,350,750,1400,2600].forEach(function(delay){window.setTimeout(cleanupDuplicateResults,delay)})}function start(){document.body&&"true"!==document.body.dataset.finalDoubleRenderGuardReady&&(document.body.dataset.finalDoubleRenderGuardReady="true",scheduleCleanup(),document.addEventListener("input",function(event){event.target&&event.target.closest&&event.target.closest("#navbar, .clean-nav-search, .site-search")||scheduleCleanup()},!0),document.addEventListener("change",function(event){event.target&&event.target.closest&&event.target.closest("#navbar, .clean-nav-search, .site-search")||scheduleCleanup()},!0),window.addEventListener("hashchange",scheduleCleanup),window.addEventListener("pageshow",scheduleCleanup),new MutationObserver(function(mutations){let shouldCleanup=!1;mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){isElement(node)&&(node.matches&&(node.matches(".calculator-clean-result, .loan-style-output-panel, .extra-result-box")||node.matches(NATIVE_RESULT_IDS.map(function(id){return"#"+id}).join(", ")))&&(shouldCleanup=!0),node.querySelector&&node.querySelector(".calculator-clean-result, .loan-style-output-panel, .extra-result-box, "+NATIVE_RESULT_IDS.map(function(id){return"#"+id}).join(", "))&&(shouldCleanup=!0))})}),shouldCleanup&&(window.clearTimeout(window.__finalResultDedupeTimer),window.__finalResultDedupeTimer=window.setTimeout(cleanupDuplicateResults,30))}).observe(document.body,{childList:!0,subtree:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function setupIndexDropdownOverlay(){var grid=document.querySelector("body.index-page .index-category-dropdown-grid");if(grid&&"true"!==grid.dataset.indexDropdownOverlayReady){var cards=Array.prototype.slice.call(grid.querySelectorAll("details.index-category-dropdown"));cards.length&&(grid.dataset.indexDropdownOverlayReady="true",cards.forEach(function(card){var summary=card.querySelector(":scope > summary");card.addEventListener("toggle",function(){card.open?(card.classList.add("is-index-dropdown-open"),closeOthers(card),clampPanel(card)):card.classList.remove("is-index-dropdown-open")}),summary&&summary.addEventListener("click",function(){window.setTimeout(function(){card.open&&(closeOthers(card),clampPanel(card))},0)}),card.addEventListener("mouseenter",function(){window.matchMedia("(hover: hover)").matches&&function(card){closeOthers(card),card.open=!0,card.classList.add("is-index-dropdown-open"),clampPanel(card)}(card)}),card.addEventListener("mouseleave",function(){window.matchMedia("(hover: hover)").matches&&window.setTimeout(function(){card.matches(":hover")||card.contains(document.activeElement)||closeCard(card)},180)})}),document.addEventListener("click",function(event){grid.contains(event.target)||closeAll()}),document.addEventListener("keydown",function(event){"Escape"===event.key&&closeAll()}),window.addEventListener("resize",function(){cards.forEach(function(card){card.open&&clampPanel(card)})}))}function closeCard(card){card&&(card.open=!1,card.classList.remove("is-index-dropdown-open"))}function closeOthers(activeCard){cards.forEach(function(card){card!==activeCard&&closeCard(card)})}function closeAll(){cards.forEach(closeCard)}function clampPanel(card){var panel=function(card){return card?card.querySelector(":scope > .index-category-dropdown-panel"):null}(card);panel&&card.open&&(panel.style.maxHeight="",panel.style.left="",panel.style.right="",panel.style.transform="",window.requestAnimationFrame(function(){if(card.open){var rect=panel.getBoundingClientRect();rect.right>window.innerWidth-14&&(panel.style.left="auto",panel.style.right="0",panel.style.transform="none"),(rect=panel.getBoundingClientRect()).left<14&&(panel.style.left="0",panel.style.right="auto",panel.style.transform="none"),rect=panel.getBoundingClientRect();var availableHeight=Math.max(180,window.innerHeight-rect.top-14);panel.style.maxHeight=Math.min(availableHeight,520)+"px"}}))}}function start(){setupIndexDropdownOverlay(),window.setTimeout(setupIndexDropdownOverlay,250),window.setTimeout(setupIndexDropdownOverlay,800)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function isResultPanel(el){return!(!el||1!==el.nodeType||!(el.classList.contains("calculator-clean-result")||el.classList.contains("loan-style-output-panel")||el.classList.contains("extra-result-box")||/ReportOutput$/.test(el.id||"")||-1!==["universalLoanStyleOutput","loanExternalOutput","personalLoanExternalOutput","ageReportOutput","bmiReportOutput"].indexOf(el.id)))}function fixResultPlacement(){Array.from(document.querySelectorAll(".calculator-clean-result, .loan-style-output-panel, .extra-result-box, #universalLoanStyleOutput, #loanExternalOutput, #personalLoanExternalOutput, #ageReportOutput, #bmiReportOutput, [id$='ReportOutput']")).filter(isResultPanel).forEach(function(panel){if(panel.closest("#calculatorReportPage"))return;var el;((el=panel)?el.closest(".tool-layout, .old-calculator-layout, .calculator-container, .age-calculator-container, .bmi-calculator-container, .loan-calculator-container, .percentage-calculator-container, .discount-calculator-container, .compound-calculator-container"):null)&&(panel.classList.add("full-width-result-section"),panel.style.setProperty("grid-column","1 / -1","important"),panel.style.setProperty("width","100%","important"),panel.style.setProperty("max-width","100%","important"))})}function start(){fixResultPlacement(),[80,200,500,1e3,1800].forEach(function(delay){window.setTimeout(fixResultPlacement,delay)}),document.body&&!document.body.dataset.fullWidthResultLayoutReady&&(document.body.dataset.fullWidthResultLayoutReady="true",new MutationObserver(function(mutations){let shouldFix=!1;mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){node&&1===node.nodeType&&(isResultPanel(node)||node.querySelector&&node.querySelector(".calculator-clean-result, .loan-style-output-panel, .extra-result-box"))&&(shouldFix=!0)})}),shouldFix&&window.setTimeout(fixResultPlacement,20)}).observe(document.body,{childList:!0,subtree:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";const RESULT_SELECTOR=[".calculator-clean-result",".loan-style-output-panel",".extra-result-box","#universalLoanStyleOutput","#loanExternalOutput","#personalLoanExternalOutput","#ageReportOutput","#bmiReportOutput","[id$='ReportOutput']"].join(", "),IGNORE_ACTION_SELECTOR=["#calculatorReportPage",".age-result-actions",".bmi-result-actions",".universal-result-actions",".mortgage-result-actions",".loan-result-actions",".report-actions",".saved-report-actions"].join(", ");let lastInputAt=0,actionSequence=0,lastScrolledSequence=-1,pendingTimer=null,pendingPanel=null;function now(){return Date.now?Date.now():(new Date).getTime()}function markUserInput(event){if(!document.querySelector(".calculator, main.pc-calculator-layout, .tool-layout, .old-calculator-layout, .age-calculator-container, .bmi-calculator-container, .loan-calculator-container"))return;const target=event&&event.target;if(!target||!target.closest)return;if(target.closest(IGNORE_ACTION_SELECTOR))return;const control=target.closest("input, select, textarea, button, .calculator button, .calc-button, .btn, [role='button']");if(!control)return;control.closest(".calculator, main.pc-calculator-layout, .tool-layout, form, .main-content, body")&&(lastInputAt=now(),actionSequence+=1)}function isUsableResultPanel(panel){if(!panel||1!==panel.nodeType)return!1;if(panel.closest("#calculatorReportPage"))return!1;if(panel.hidden)return!1;const style=window.getComputedStyle(panel);if("none"===style.display||"hidden"===style.visibility||0===Number(style.opacity))return!1;const rect=panel.getBoundingClientRect();if(rect.width<40||rect.height<40)return!1;return(panel.textContent||"").replace(/\s+/g," ").trim().length>8}function getBestPanel(fromNode){if(fromNode&&1===fromNode.nodeType){if(fromNode.matches&&fromNode.matches(RESULT_SELECTOR)&&isUsableResultPanel(fromNode))return fromNode;const nested=fromNode.querySelector&&fromNode.querySelector(RESULT_SELECTOR);if(nested&&isUsableResultPanel(nested))return nested}const panels=Array.from(document.querySelectorAll(RESULT_SELECTOR)).filter(isUsableResultPanel);return panels.length?(panels.sort(function(a,b){const ar=a.getBoundingClientRect();return b.getBoundingClientRect().top-ar.top}),panels[0]):null}function scrollToPanel(panel){if(!isUsableResultPanel(panel))return;if(lastScrolledSequence===actionSequence)return;const elapsed=now()-lastInputAt;if(!lastInputAt||elapsed>9e3)return;if(function(panel){const rect=panel.getBoundingClientRect(),bottomSafe=window.innerHeight-90;return rect.top>=90&&rect.top<=bottomSafe&&rect.height>0}(panel))return void(lastScrolledSequence=actionSequence);lastScrolledSequence=actionSequence;const rect=panel.getBoundingClientRect(),offset=window.innerWidth<=850?76:96,targetTop=Math.max(0,window.pageYOffset+rect.top-offset),smooth=!window.matchMedia||!window.matchMedia("(prefers-reduced-motion: reduce)").matches;try{window.scrollTo({top:targetTop,behavior:smooth?"smooth":"auto"})}catch(error){window.scrollTo(0,targetTop)}}function watchResults(){document.body&&"true"!==document.body.dataset.autoScrollResultReady&&(document.body.dataset.autoScrollResultReady="true",document.addEventListener("input",markUserInput,!0),document.addEventListener("change",markUserInput,!0),document.addEventListener("click",markUserInput,!0),new MutationObserver(function(mutations){let panel=null;mutations.forEach(function(mutation){if(!panel){if(mutation.target&&1===mutation.target.nodeType){const targetPanel=mutation.target.closest&&mutation.target.closest(RESULT_SELECTOR);if(targetPanel&&isUsableResultPanel(targetPanel))return void(panel=targetPanel)}mutation.addedNodes.forEach(function(node){if(panel||!node||1!==node.nodeType)return;const candidate=getBestPanel(node);candidate&&(panel=candidate)})}}),panel&&function(panel){const bestPanel=getBestPanel(panel);bestPanel&&(!lastInputAt||now()-lastInputAt>9e3||(pendingPanel=bestPanel,pendingTimer&&window.clearTimeout(pendingTimer),pendingTimer=window.setTimeout(function waitUntilTypingStops(){const elapsed=now()-lastInputAt;elapsed<2e3?pendingTimer=window.setTimeout(waitUntilTypingStops,2e3-elapsed+40):(pendingTimer=null,scrollToPanel(pendingPanel),pendingPanel=null)},260)))}(panel)}).observe(document.body,{childList:!0,subtree:!0,characterData:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",watchResults):watchResults()}(),function(){"use strict";const RESULT_BOX_ID_BY_PAGE={loan:"loanExternalOutput",personalLoan:"personalLoanExternalOutput",discount:"discountReportOutput",loanComparison:"extraCalcResult",debtPayoff:"extraCalcResult",creditCardPayoff:"extraCalcResult",creditCardInterest:"extraCalcResult",rentalYield:"extraCalcResult",fuelCost:"extraCalcResult",salary:"extraCalcResult",gajiPenjawatAwam:"extraCalcResult",tax:"extraCalcResult",currencyConverter:"extraCalcResult",inflation:"extraCalcResult",scientific:"extraCalcResult",unitConverter:"extraCalcResult"};function $(id){return document.getElementById(id)}function pageType(){const path=String(location.pathname||"").toLowerCase(),bodyPage=document.body?String(document.body.dataset.page||"").toLowerCase():"";return path.includes("mortgage-calculator")||"loan"===bodyPage?"loan":path.includes("personal-loan-calculator")||"personal-loan"===bodyPage?"personalLoan":path.includes("loan-comparison-calculator")||"loancomparison"===bodyPage?"loanComparison":path.includes("debt-payoff-calculator")||"debtpayoff"===bodyPage?"debtPayoff":path.includes("credit-card-payoff-calculator")||"creditcardpayoff"===bodyPage?"creditCardPayoff":path.includes("credit-card-interest-calculator")||"creditcardinterest"===bodyPage?"creditCardInterest":path.includes("rental-yield-calculator")||"rentalyield"===bodyPage?"rentalYield":path.includes("fuel-cost-calculator")||"fuelcost"===bodyPage?"fuelCost":path.includes("salary-calculator")||"salary"===bodyPage?"salary":path.includes("gaji-penjawat-awam-calculator")||"gajipenjawatawam"===bodyPage?"gajiPenjawatAwam":path.includes("tax-calculator")||"tax"===bodyPage?"tax":path.includes("currency-converter")||"currencyconverter"===bodyPage?"currencyConverter":path.includes("scientific-calculator")||"scientific"===bodyPage?"scientific":path.includes("unit-converter-calculator")||"unitconverter"===bodyPage?"unitConverter":path.includes("discount-calculator")||"discount"===bodyPage?"discount":path.includes("inflation-calculator")||"inflation"===bodyPage?"inflation":""}function numberFromInput(id){const input=$(id);if(!input)return NaN;const raw=String(input.value||"").replace(/,/g,"").trim();return""===raw?NaN:Number(raw)}function valueFromInput(id){const input=$(id);return input?String(input.value||"").trim():""}function firstNumber(ids){for(const id of ids){const n=numberFromInput(id);if(Number.isFinite(n))return n}return NaN}function firstInput(ids){for(const id of ids){const input=$(id);if(input)return input}return null}function escapeHtml(value){return String(null==value?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}function money(value,prefix){return Number.isFinite(value)?(prefix||"RM")+" "+value.toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2}):"-"}function numberText(value,digits){return Number.isFinite(value)?value.toLocaleString("en-MY",{maximumFractionDigits:null==digits?2:digits}):"-"}function loanPayment(principal,annualRate,months){if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(months)||principal<=0||months<=0)return NaN;const monthlyRate=annualRate/100/12;return 0===monthlyRate?principal/months:principal*monthlyRate/(1-Math.pow(1+monthlyRate,-months))}function visibleResultTitle(title){return String(title||"").replace(/\s+calculator\s+result\s*$/i," calculator").replace(/\s+result\s*$/i,"").trim()||"Answer"}function visibleResultLabel(label){const text=String(null==label?"":label);return/^\s*result\s*$/i.test(text)?"Answer":text}function plainText(title,rows,note){const lines=[visibleResultTitle(title)];return(rows||[]).forEach(function(row){lines.push(visibleResultLabel(row[0])+": "+String(row[1]))}),note&&lines.push("Note: "+note),lines.join("\n")}function setButtonTemp(button,text){if(!button)return;const old=button.textContent;button.textContent=text,setTimeout(function(){button.textContent=old},1300)}function copyText(text,button){navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text).then(function(){setButtonTemp(button,"Copied")}).catch(function(){fallbackCopy(text,button)}):fallbackCopy(text,button)}function fallbackCopy(text,button){const area=document.createElement("textarea");area.value=text,area.setAttribute("readonly",""),area.style.position="fixed",area.style.left="-9999px",document.body.appendChild(area),area.select();try{document.execCommand("copy"),setButtonTemp(button,"Copied")}catch(error){setButtonTemp(button,"Copy failed")}area.remove()}function downloadText(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download=filename,document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},0)}function fieldLabel(input){if(!input)return"Input";let label=null;if(input.id)try{label=document.querySelector('label[for="'+input.id.replace(/[^a-zA-Z0-9_-]/g,"\\$&")+'"]')}catch(error){label=null}return!label&&input.closest&&(label=input.closest("label")),label?String(label.textContent||"").replace(/\s+/g," ").replace(/[:*]+$/g,"").trim()||input.name||input.id||"Input":input.getAttribute("aria-label")||input.placeholder||input.name||input.id||"Input"}function reportTable(rows,emptyMessage){return'<div class="calculator-report-table-scroll finance-report-table-scroll"><table class="calculator-report-data-table finance-report-data-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>'+function(rows){return(rows||[]).map(function(row){return"<tr><th>"+escapeHtml(visibleResultLabel(row[0]))+"</th><td>"+escapeHtml(row[1])+"</td></tr>"}).join("")}(rows&&rows.length?rows:[["Details",emptyMessage||"No data available"]])+"</tbody></table></div>"}function openReport(title,rows,note,graphHtml){const old=$("financeUpgradeReportPage");old&&old.remove(),document.body.classList.add("calculator-report-view"),document.querySelectorAll("main, .finance-upgrade-result-box").forEach(function(el){el.style.setProperty("display","none","important")});const inputRows=function(){const root=document.querySelector("main .calculator")||document.querySelector(".calculator")||document.querySelector(".extra-calculator-box")||document,used=new Set;return Array.from(root.querySelectorAll("input, select, textarea")).filter(function(input){const type=String(input.type||"").toLowerCase();if(["button","submit","reset","hidden"].includes(type))return!1;if(input.disabled)return!1;if("display"===input.id)return!1;const key=input.id||input.name;return(!key||!used.has(key))&&(key&&used.add(key),"checkbox"===type||"radio"===type?input.checked:"SELECT"===input.tagName||""!==String(input.value||"").trim())}).map(function(input){const type=String(input.type||"").toLowerCase();let value="";return value="SELECT"===input.tagName?input.options&&input.selectedIndex>=0?input.options[input.selectedIndex].text:input.value:"checkbox"===type||"radio"===type?input.checked?input.value||"Selected":"Not selected":input.value,[fieldLabel(input),value||"-"]})}(),section=document.createElement("section");section.id="financeUpgradeReportPage",section.className="calculator-report-page finance-upgrade-report-page table-report-page",section.innerHTML="<h1>"+escapeHtml(visibleResultTitle(title))+'</h1><p class="calculator-report-date"><strong>Generated:</strong> '+escapeHtml((new Date).toLocaleString())+'</p><div class="calculator-report-card finance-report-card finance-report-input-card"><h2>Inputs</h2>'+reportTable(inputRows,"No input saved")+'</div><div class="calculator-report-card finance-report-card finance-report-result-card"><h2>Results</h2>'+reportTable(rows,"No result available")+(graphHtml?'<div class="finance-report-graph-wrap">'+graphHtml+"</div>":"")+(note?'<p class="finance-result-note">'+escapeHtml(note)+"</p>":"")+'</div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn finance-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn finance-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn finance-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn finance-report-share-btn">Share report</button></div>',document.body.appendChild(section);const text="Inputs\n"+plainText("Inputs",inputRows,"")+"\n\nResults\n"+plainText(title,rows,note);section.querySelector(".finance-report-back-btn").onclick=function(){section.remove(),document.body.classList.remove("calculator-report-view"),document.querySelectorAll("main, .finance-upgrade-result-box").forEach(function(el){el.style.removeProperty("display")})},section.querySelector(".finance-report-copy-btn").onclick=function(event){copyText(text,event.currentTarget)},section.querySelector(".finance-report-save-btn").onclick=function(event){downloadText("calculator-report.txt",text),setButtonTemp(event.currentTarget,"Saved")},section.querySelector(".finance-report-share-btn").onclick=function(event){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){copyText(text,event.currentTarget)}):copyText(text,event.currentTarget)},section.scrollIntoView({behavior:"smooth",block:"start"})}function lineGraph(title,series){if(!(series=(series||[]).filter(function(item){return item&&Array.isArray(item.points)&&item.points.length})).length)return"";const pad_left=70,pad_right=26,pad_top=28,chartWidth=760-pad_left-pad_right,chartHeight=300-pad_top-54,allValues=[];let maxLen=0;series.forEach(function(line){maxLen=Math.max(maxLen,line.points.length),line.points.forEach(function(point){allValues.push(Number(point.value)||0)})});const max=Math.max.apply(Math,allValues.concat([1])),min=Math.min.apply(Math,allValues.concat([0])),range=Math.max(1,max-min);function xAt(index){return maxLen<=1?pad_left+chartWidth/2:pad_left+index/(maxLen-1)*chartWidth}function yAt(value){return pad_top+chartHeight-(value-min)/range*chartHeight}const lines=series.map(function(line,index){return'<polyline class="finance-chart-line finance-chart-line-'+index+'" points="'+line.points.map(function(point,i){return xAt(i).toFixed(1)+","+yAt(Number(point.value)||0).toFixed(1)}).join(" ")+'"></polyline>'}).join(""),endLabels=series.map(function(line,index){const last=line.points[line.points.length-1],x=xAt(line.points.length-1),y=yAt(Number(last.value)||0);return'<text class="finance-chart-end-label finance-chart-end-label-'+index+'" x="'+Math.min(760-pad_right,x+8).toFixed(1)+'" y="'+Math.max(16,y-4).toFixed(1)+'">'+escapeHtml(line.name)+"</text>"}).join(""),legend=series.map(function(line,index){return'<span class="finance-chart-legend-item finance-chart-legend-'+index+'"><i></i>'+escapeHtml(line.name)+"</span>"}).join("");return'<section class="finance-result-graph-card"><div class="finance-result-graph-header"><h3>'+escapeHtml(title)+'</h3><div class="finance-chart-legend">'+legend+'</div></div><div class="finance-chart-scroll"><svg class="finance-line-chart" viewBox="0 0 760 300" role="img" aria-label="'+escapeHtml(title)+'"><line class="finance-chart-axis" x1="'+pad_left+'" y1="'+(pad_top+chartHeight)+'" x2="'+(pad_left+chartWidth)+'" y2="'+(pad_top+chartHeight)+'"></line><line class="finance-chart-axis" x1="'+pad_left+'" y1="'+pad_top+'" x2="'+pad_left+'" y2="'+(pad_top+chartHeight)+'"></line><text class="finance-chart-y-label" x="'+(pad_left-8)+'" y="'+(pad_top+12)+'" text-anchor="end">'+escapeHtml(money(max))+'</text><text class="finance-chart-y-label" x="'+(pad_left-8)+'" y="'+(pad_top+chartHeight)+'" text-anchor="end">'+escapeHtml(money(min))+'</text><text class="finance-chart-x-label" x="'+pad_left+'" y="282">Start</text><text class="finance-chart-x-label" x="'+(pad_left+chartWidth)+'" y="282" text-anchor="end">End</text>'+lines+endLabels+"</svg></div></section>"}function amortizationPoints(principal,annualRate,months,monthlyPayment,maxPoints){const rate=annualRate/100/12;let balance=principal;const raw=[{value:balance}];for(let month=1;month<=months&&balance>.01&&month<1200;month+=1){const interest=balance*rate;if(monthlyPayment<=interest&&rate>0)break;balance=Math.max(0,balance+interest-monthlyPayment),raw.push({value:balance})}if(maxPoints=maxPoints||36,raw.length<=maxPoints)return raw;const sampled=[];for(let i=0;i<maxPoints;i+=1){const index=Math.round(i/(maxPoints-1)*(raw.length-1));sampled.push(raw[index])}return sampled}function showResult(type,title,rows,options){options=options||{};const box=function(type){const id=RESULT_BOX_ID_BY_PAGE[type]||"extraCalcResult";let box=$(id);const calculator=document.querySelector("main .calculator")||document.querySelector(".calculator");return box||(box=document.createElement("section"),box.id=id,box.hidden=!0,calculator?calculator.insertAdjacentElement("afterend",box):document.body.appendChild(box)),calculator&&calculator.contains(box)&&calculator.insertAdjacentElement("afterend",box),box.className="extra-result-box finance-upgrade-result-box finance-result-own-box "+type+"-finance-result",box.setAttribute("aria-label","Calculator result"),box.hidden=!1,box.style.setProperty("display","block","important"),box.style.setProperty("visibility","visible","important"),box.style.setProperty("opacity","1","important"),box}(type),text=plainText(title,rows,options.note);!function(type){["result","loanResult","personalLoanResult","discountResult","extraCalculatorReportPage"].forEach(function(id){const el=$(id);el&&el.id!==RESULT_BOX_ID_BY_PAGE[type]&&el.style.setProperty("display","none","important")}),document.querySelectorAll(".calculator-report-summary-boxes:not(.finance-result-summary-grid)").forEach(function(el){el.closest(".finance-upgrade-result-box")||el.style.setProperty("display","none","important")})}(type),box.innerHTML='<article class="finance-result-shell"><header class="finance-result-header"><h2>'+escapeHtml(visibleResultTitle(title))+"</h2></header>"+function(rows){return'<div class="finance-result-summary-grid">'+(rows||[]).map(function(row){return'<article class="finance-result-metric-card"><div class="finance-result-metric-label">'+escapeHtml(visibleResultLabel(row[0]))+'</div><div class="finance-result-metric-value">'+escapeHtml(row[1])+"</div></article>"}).join("")+"</div>"}(rows)+(options.graphHtml||"")+(options.note?'<p class="finance-result-note">'+escapeHtml(options.note)+"</p>":"")+'<div class="finance-result-actions"><button type="button" class="finance-result-action-btn finance-copy-btn">Copy</button><button type="button" class="finance-result-action-btn finance-save-btn">Save</button><button type="button" class="finance-result-action-btn finance-share-btn">Share</button><button type="button" class="finance-result-action-btn finance-report-btn">Report</button></div></article>',box.querySelector(".finance-copy-btn").onclick=function(event){copyText(text,event.currentTarget)},box.querySelector(".finance-save-btn").onclick=function(event){downloadText("calculator-result.txt",text),setButtonTemp(event.currentTarget,"Saved")},box.querySelector(".finance-share-btn").onclick=function(event){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){copyText(text,event.currentTarget)}):copyText(text,event.currentTarget)},box.querySelector(".finance-report-btn").onclick=function(){openReport(visibleResultTitle(title),rows,options.note,options.graphHtml||"")},!1!==options.scroll&&setTimeout(function(){box.scrollIntoView({behavior:"smooth",block:"start"})},80)}function calculateMortgage(){const homePrice=firstNumber(["amount","loanAmount","loanPrincipal"]),downPayment=Math.max(0,firstNumber(["downPayment"])||0),principal=Number.isFinite(homePrice)?Math.max(0,homePrice-downPayment):NaN,annualRate=firstNumber(["interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["years","loanYears","loanTerm","term"]),rawTerm=termInput?Number(String(termInput.value||"").replace(/,/g,"")):NaN;if(!Number.isFinite(homePrice)||!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||homePrice<=0||principal<=0||annualRate<0||rawTerm<=0)return;const label=termInput?String((document.querySelector('label[for="'+termInput.id+'"]')||{}).textContent||""):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm),principalInterest=loanPayment(principal,annualRate,months),propertyTax=(numberFromInput("propertyTaxYearly")||0)/12,insurance=(numberFromInput("homeInsuranceYearly")||0)/12,otherFees=numberFromInput("otherMonthlyFees")||0,extra=numberFromInput("extraMonthlyPayment")||0,totalMonthly=principalInterest+propertyTax+insurance+otherFees+extra,totalPrincipalInterest=principalInterest*months,totalInterest=totalPrincipalInterest-principal,downPercent=homePrice>0?downPayment/homePrice*100:0,income=numberFromInput("incomeMonthly"),incomeRatio=Number.isFinite(income)&&income>0?totalMonthly/income*100:NaN;showResult("loan","Mortgage result",[["Estimated monthly payment",money(totalMonthly)],["Principal + interest",money(principalInterest)],["Loan amount",money(principal)],["Home price",money(homePrice)],["Down payment",money(downPayment)+" ("+downPercent.toFixed(1)+"%)"],["Total interest",money(totalInterest)],["Total principal + interest",money(totalPrincipalInterest)],["Loan term",months+" months"],["Payment / income",Number.isFinite(incomeRatio)?incomeRatio.toFixed(1)+"%":"Add income to calculate"]],{graphHtml:lineGraph("Mortgage balance over time",[{name:"Balance",points:amortizationPoints(principal,annualRate,months,principalInterest+extra,40)}])})}function calculatePersonalLoanOverride(){const amount=firstNumber(["personalLoanAmount","amount","loanAmount","loanPrincipal"]),annualRate=firstNumber(["personalLoanRate","interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["personalLoanYears","years","loanYears","loanTerm","term"]),rawTerm=termInput?Number(String(termInput.value||"").replace(/,/g,"")):NaN;if(!Number.isFinite(amount)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||amount<=0||annualRate<0||rawTerm<=0)return;const label=termInput?String((document.querySelector('label[for="'+termInput.id+'"]')||{}).textContent||""):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm),monthlyPayment=loanPayment(amount,annualRate,months),totalPayment=monthlyPayment*months,totalInterest=totalPayment-amount;showResult("personalLoan","Personal loan result",[["Monthly payment",money(monthlyPayment)],["Total payment",money(totalPayment)],["Total interest",money(totalInterest)],["Loan amount",money(amount)],["Annual interest rate",annualRate.toFixed(2)+"%"],["Loan term",months+" months"]])}function calculateLoanComparisonOverride(){const amount=numberFromInput("loanCompareAmount"),rateA=numberFromInput("loanCompareRateA"),termA=numberFromInput("loanCompareTermA"),rateB=numberFromInput("loanCompareRateB"),termB=numberFromInput("loanCompareTermB");if(![amount,rateA,termA,rateB,termB].every(Number.isFinite)||amount<=0||termA<=0||termB<=0)return;const monthsA=Math.round(12*termA),monthsB=Math.round(12*termB),payA=loanPayment(amount,rateA,monthsA),payB=loanPayment(amount,rateB,monthsB),totalA=payA*monthsA,totalB=payB*monthsB,graph=lineGraph("Loan balance comparison",[{name:"Loan A",points:amortizationPoints(amount,rateA,monthsA,payA,42)},{name:"Loan B",points:amortizationPoints(amount,rateB,monthsB,payB,42)}]);showResult("loanComparison","Loan comparison result",[["Loan A monthly payment",money(payA)],["Loan A total interest",money(totalA-amount)],["Loan A total paid",money(totalA)],["Loan B monthly payment",money(payB)],["Loan B total interest",money(totalB-amount)],["Loan B total paid",money(totalB)],["Lower total cost",totalA<=totalB?"Loan A":"Loan B"],["Difference",money(Math.abs(totalA-totalB))]],{graphHtml:graph})}function calculateDebtPayoffOverride(){const debt=numberFromInput("debtTotal"),apr=numberFromInput("debtApr"),payment=numberFromInput("debtPayment"),extra=Number.isFinite(numberFromInput("debtExtra"))?numberFromInput("debtExtra"):0;if(![debt,apr,payment].every(Number.isFinite)||debt<=0||payment<=0)return;function simulate(pay){let balance=debt,interestTotal=0,months=0;const rate=apr/100/12,points=[{value:balance}];for(;balance>.01&&months<1200;){const interest=balance*rate;if(pay<=interest&&rate>0)return{stuck:!0,interest:interest,months:months,totalInterest:interestTotal,points:points};interestTotal+=interest,balance=Math.max(0,balance+interest-pay),months+=1,points.push({value:balance})}return{stuck:!1,months:months,totalInterest:interestTotal,points:points}}const normal=simulate(payment),faster=simulate(payment+extra);if(normal.stuck&&faster.stuck)return void showResult("debtPayoff","Debt payoff result",[["Monthly interest",money(normal.interest)],["Normal payment",money(payment)],["With extra payment",money(payment+extra)],["Status","Payment is too low to reduce debt"]]);const graph=lineGraph("Debt balance comparison",[{name:"Normal payment",points:samplePoints(normal.points,42)},{name:extra>0?"With extra payment":"Same payment",points:samplePoints(faster.points,42)}]);showResult("debtPayoff","Debt payoff result",[["Total debt",money(debt)],["Normal monthly payment",money(payment)],["Extra monthly payment",money(extra)],["Payment used",money(payment+extra)],["Months to debt free",faster.stuck?"Payment too low":faster.months+" months"],["Years to debt free",faster.stuck?"Payment too low":(faster.months/12).toFixed(1)+" years"],["Total interest",faster.stuck?"Payment too low":money(faster.totalInterest)],["Time saved",normal.stuck||faster.stuck?"Add extra payment to compare":Math.max(0,normal.months-faster.months)+" months"]],{graphHtml:graph})}function samplePoints(points,maxPoints){if((points=Array.isArray(points)?points:[]).length<=maxPoints)return points;const sampled=[];for(let i=0;i<maxPoints;i+=1)sampled.push(points[Math.round(i/(maxPoints-1)*(points.length-1))]);return sampled}function calculateCreditCardPayoffOverride(){const balance=numberFromInput("ccBalance"),apr=numberFromInput("ccApr"),payment=numberFromInput("ccPayment");if(![balance,apr,payment].every(Number.isFinite)||balance<=0||payment<=0)return;let bal=balance,totalInterest=0,months=0;const monthlyRate=apr/100/12;for(;bal>.01&&months<1200;){const interest=bal*monthlyRate;if(payment<=interest&&monthlyRate>0)return void showResult("creditCardPayoff","Credit card payoff result",[["Balance",money(balance)],["Monthly interest",money(interest)],["Monthly payment",money(payment)],["Status","Payment is too low to reduce the balance"]],{note:"Increase the monthly payment to pay off the card."});totalInterest+=interest,bal=Math.max(0,bal+interest-payment),months+=1}showResult("creditCardPayoff","Credit card payoff result",[["Months to pay off",months+" months"],["Years to pay off",(months/12).toFixed(1)+" years"],["Total interest",money(totalInterest)],["Total paid",money(balance+totalInterest)]])}function calculateCreditCardInterestOverride(){const balance=numberFromInput("ccInterestBalance"),apr=numberFromInput("ccInterestApr"),days=numberFromInput("ccInterestDays"),payment=Number.isFinite(numberFromInput("ccInterestPayment"))?numberFromInput("ccInterestPayment"):0;if(![balance,apr,days].every(Number.isFinite))return;const afterPayment=Math.max(0,balance-payment),interest=afterPayment*(apr/100)*(days/365);showResult("creditCardInterest","Credit card interest result",[["Starting balance",money(balance)],["Payment",money(payment)],["Balance used",money(afterPayment)],["APR",apr.toFixed(2)+"%"],["Days",numberText(days,0)],["Estimated interest",money(interest)]])}function calculateRentalYieldOverride(){const price=numberFromInput("rentalPropertyPrice"),rent=numberFromInput("rentalMonthlyRent"),expenses=Number.isFinite(numberFromInput("rentalAnnualExpenses"))?numberFromInput("rentalAnnualExpenses"):0;if(!Number.isFinite(price)||!Number.isFinite(rent)||price<=0)return;const annualRent=12*rent,grossYield=annualRent/price*100,netYield=(annualRent-expenses)/price*100;showResult("rentalYield","Rental yield result",[["Property price",money(price)],["Monthly rent",money(rent)],["Annual rent",money(annualRent)],["Annual expenses",money(expenses)],["Gross rental yield",grossYield.toFixed(2)+"%"],["Net rental yield",netYield.toFixed(2)+"%"]])}function calculateFuelCostOverride(){const distance=numberFromInput("fuelDistance"),efficiency=numberFromInput("fuelEfficiency"),price=numberFromInput("fuelPrice"),people=Number.isFinite(numberFromInput("fuelPeople"))&&numberFromInput("fuelPeople")>0?numberFromInput("fuelPeople"):1;if(![distance,efficiency,price].every(Number.isFinite)||efficiency<=0)return;const liters=distance/100*efficiency,total=liters*price;showResult("fuelCost","Fuel cost result",[["Distance",numberText(distance)+" km"],["Fuel needed",numberText(liters)+" L"],["Fuel price",money(price)+" / L"],["Total fuel cost",money(total)],["Cost per person",money(total/people)]])}function calculateSalaryOverride(){const gross=numberFromInput("salaryGross"),epfRate=Number.isFinite(numberFromInput("salaryEpfRate"))?numberFromInput("salaryEpfRate"):11,socso=Number.isFinite(numberFromInput("salarySocso"))?numberFromInput("salarySocso"):0,tax=Number.isFinite(numberFromInput("salaryTax"))?numberFromInput("salaryTax"):0,other=Number.isFinite(numberFromInput("salaryOther"))?numberFromInput("salaryOther"):0;if(!Number.isFinite(gross)||gross<=0)return;const epf=gross*epfRate/100,totalDeduct=epf+socso+tax+other,net=gross-totalDeduct;showResult("salary","Salary result",[["Gross monthly salary",money(gross)],["EPF deduction",money(epf)],["Other deductions",money(totalDeduct-epf)],["Total deductions",money(totalDeduct)],["Net monthly salary",money(net)],["Estimated net yearly",money(12*net)]])}function calculateGajiOverride(){const basic=numberFromInput("gajiBasic"),fixed=Number.isFinite(numberFromInput("gajiFixedAllowance"))?numberFromInput("gajiFixedAllowance"):0,cola=Number.isFinite(numberFromInput("gajiCola"))?numberFromInput("gajiCola"):0,other=Number.isFinite(numberFromInput("gajiOtherAllowance"))?numberFromInput("gajiOtherAllowance"):0,deductions=Number.isFinite(numberFromInput("gajiDeductions"))?numberFromInput("gajiDeductions"):0;if(!Number.isFinite(basic)||basic<=0)return;const allowance=fixed+cola+other,gross=basic+allowance,net=gross-deductions;showResult("gajiPenjawatAwam","Gaji penjawat awam result",[["Gaji pokok",money(basic)],["Jumlah elaun",money(allowance)],["Gaji kasar",money(gross)],["Potongan",money(deductions)],["Anggaran gaji bersih",money(net)]],{note:"Masukkan nilai elaun dan potongan sendiri mengikut slip gaji anda."})}function calculateTaxOverride(){const income=numberFromInput("taxAnnualIncome"),relief=Number.isFinite(numberFromInput("taxRelief"))?numberFromInput("taxRelief"):0,rate=Number.isFinite(numberFromInput("taxRate"))?numberFromInput("taxRate"):10;if(!Number.isFinite(income)||income<=0)return;const taxable=Math.max(0,income-relief),tax=taxable*rate/100;showResult("tax","Tax estimator result",[["Annual income",money(income)],["Relief / deduction",money(relief)],["Estimated taxable income",money(taxable)],["Tax rate used",rate.toFixed(2)+"%"],["Estimated tax",money(tax)],["Estimated monthly tax",money(tax/12)]],{note:"This is a simple estimator using your entered rate. It is not official tax advice."})}function calculateCurrencyOverride(){const amount=numberFromInput("currencyAmount"),from=valueFromInput("currencyFrom").toUpperCase()||"FROM",to=valueFromInput("currencyTo").toUpperCase()||"TO",rate=numberFromInput("currencyRate");Number.isFinite(amount)&&Number.isFinite(rate)&&showResult("currencyConverter","Currency converter result",[["Amount",numberText(amount)+" "+from],["Exchange rate","1 "+from+" = "+numberText(rate,6)+" "+to],["Converted amount",numberText(amount*rate,2)+" "+to]],{note:"This static GitHub Pages converter uses the exchange rate you enter manually."})}function calculateDiscountOverride(){const price=numberFromInput("price"),discount=numberFromInput("discount");if(![price,discount].every(Number.isFinite)||price<0||discount<0)return;const savings=price*discount/100,finalPrice=price-savings;showResult("discount","Discount result",[["Original price",money(price)],["Discount",discount.toFixed(2)+"%"],["Savings",money(savings)],["Final price",money(finalPrice)]])}function calculateInflationOverride(){const amount=numberFromInput("inflationAmount"),rate=numberFromInput("inflationRate"),years=numberFromInput("inflationYears");if(![amount,rate,years].every(Number.isFinite))return;const future=amount*Math.pow(1+rate/100,years),buyingPower=amount/Math.pow(1+rate/100,years);showResult("inflation","Inflation result",[["Today amount",money(amount)],["Inflation rate",rate.toFixed(2)+"%"],["Years",numberText(years)],["Future cost estimate",money(future)],["Today buying power after period",money(buyingPower)]])}const unitConversionFactorsUpgrade={length:{m:1,meter:1,metre:1,km:1e3,kilometer:1e3,kilometre:1e3,cm:.01,centimeter:.01,centimetre:.01,mm:.001,millimeter:.001,millimetre:.001,mile:1609.344,mi:1609.344,yard:.9144,yd:.9144,foot:.3048,feet:.3048,ft:.3048,inch:.0254,inches:.0254,in:.0254},weight:{kg:1,kilogram:1,g:.001,gram:.001,lb:.45359237,lbs:.45359237,pound:.45359237,oz:.028349523125,ounce:.028349523125},volume:{liter:1,litre:1,l:1,ml:.001,milliliter:.001,millilitre:.001,gallon:3.785411784,gal:3.785411784,cup:.2365882365}};function normalUnitKey(value){return String(value||"").trim().toLowerCase().replace(/\./g,"")}function calculateScientificOverride(){const expression=valueFromInput("scientificExpression");if(!expression)return;const originalExpression=expression,safeExpression=expression.replace(/\^/g,"**").replace(/\bsin\s*\(/gi,"Math.sin(").replace(/\bcos\s*\(/gi,"Math.cos(").replace(/\btan\s*\(/gi,"Math.tan(").replace(/\bsqrt\s*\(/gi,"Math.sqrt(").replace(/\blog\s*\(/gi,"Math.log10(").replace(/\bln\s*\(/gi,"Math.log(").replace(/\babs\s*\(/gi,"Math.abs(").replace(/\bpi\b/gi,"Math.PI").replace(/\be\b/g,"Math.E");if(/^[0-9+\-*/%().,\s*MatPIEhlgocinsqrtab]+$/i.test(safeExpression))try{const result=Function('"use strict"; return ('+safeExpression+");")();if(!Number.isFinite(Number(result)))throw new Error("Result is not finite");showResult("scientific","Scientific result",[["Input",originalExpression],["Answer",numberText(Number(result),10)]],{note:"Trigonometric functions use radians in this calculator."})}catch(error){showResult("scientific","Scientific result",[["Input",originalExpression],["Answer","Cannot calculate this expression"]],{note:"Check brackets, symbols, and supported function names."})}else showResult("scientific","Scientific result",[["Input",originalExpression],["Answer","Unsupported expression"]],{note:"Use numbers, +, -, ×, ÷, brackets, powers, sqrt(), sin(), cos(), tan(), log(), ln(), abs(), pi, and e."})}function calculateUnitConverterOverride(){const type=valueFromInput("unitType")||"length",value=numberFromInput("unitValue"),fromRaw=valueFromInput("unitFrom"),toRaw=valueFromInput("unitTo"),from=normalUnitKey(fromRaw),to=normalUnitKey(toRaw);if(!(Number.isFinite(value)&&type&&from&&to))return;let result=NaN;if("temperature"===type)result=function(value,from,to){from=normalUnitKey(from),to=normalUnitKey(to);let c=value;if("f"===from||"fahrenheit"===from)c=5*(value-32)/9;else if("k"===from||"kelvin"===from)c=value-273.15;else if("c"!==from&&"celsius"!==from)return NaN;return"f"===to||"fahrenheit"===to?9*c/5+32:"k"===to||"kelvin"===to?c+273.15:"c"===to||"celsius"===to?c:NaN}(value,from,to);else{const factors=unitConversionFactorsUpgrade[type]||{};Number.isFinite(factors[from])&&Number.isFinite(factors[to])&&0!==factors[to]&&(result=value*factors[from]/factors[to])}return}function installOverrides(){window.calculateLoan=calculateMortgage,window.calculateMortgage=calculateMortgage,window.calculatePersonalLoan=calculatePersonalLoanOverride,window.calculateLoanComparisonExtra=calculateLoanComparisonOverride,window.calculateDebtPayoffExtra=calculateDebtPayoffOverride,window.calculateCreditCardPayoffExtra=calculateCreditCardPayoffOverride,window.calculateCreditCardInterestExtra=calculateCreditCardInterestOverride,window.calculateRentalYieldExtra=calculateRentalYieldOverride,window.calculateFuelCostExtra=calculateFuelCostOverride,window.calculateSalaryExtra=calculateSalaryOverride,window.calculateGajiPenjawatAwamExtra=calculateGajiOverride,window.calculateTaxExtra=calculateTaxOverride,window.calculateCurrencyConverterExtra=calculateCurrencyOverride,window.calculateScientificExtra=calculateScientificOverride,window.calculateUnitConverterExtra=calculateUnitConverterOverride,window.calculateDiscount=calculateDiscountOverride,window.calculateInflationExtra=calculateInflationOverride;const fuelPrice=$("fuelPrice");fuelPrice&&(fuelPrice.setAttribute("step","0.01"),fuelPrice.setAttribute("inputmode","decimal"),fuelPrice.style.setProperty("width","100%","important"),fuelPrice.style.setProperty("min-width","0","important"));const type=pageType();RESULT_BOX_ID_BY_PAGE[type]&&setTimeout(function(){const box=$(RESULT_BOX_ID_BY_PAGE[type]),calculator=document.querySelector("main .calculator")||document.querySelector(".calculator");box&&calculator&&calculator.contains(box)&&calculator.insertAdjacentElement("afterend",box)},100)}function runCurrentCalculator(){const type=pageType(),map={loan:calculateMortgage,personalLoan:calculatePersonalLoanOverride,loanComparison:calculateLoanComparisonOverride,debtPayoff:calculateDebtPayoffOverride,creditCardPayoff:calculateCreditCardPayoffOverride,creditCardInterest:calculateCreditCardInterestOverride,rentalYield:calculateRentalYieldOverride,fuelCost:calculateFuelCostOverride,salary:calculateSalaryOverride,gajiPenjawatAwam:calculateGajiOverride,tax:calculateTaxOverride,currencyConverter:calculateCurrencyOverride,scientific:calculateScientificOverride,unitConverter:calculateUnitConverterOverride,discount:calculateDiscountOverride,inflation:calculateInflationOverride};map[type]&&map[type]()}function start(){installOverrides(),setTimeout(installOverrides,300),setTimeout(installOverrides,1e3);let timer=null;document.addEventListener("input",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;if(target.closest("#navbar, .clean-nav-search, .site-search"))return;const type=pageType();RESULT_BOX_ID_BY_PAGE[type]&&(clearTimeout(timer),timer=setTimeout(runCurrentCalculator,2050))},!0),document.addEventListener("change",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;const type=pageType();RESULT_BOX_ID_BY_PAGE[type]&&(clearTimeout(timer),timer=setTimeout(runCurrentCalculator,2050))},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function cleanupExtraResultText(root){(root=root||document).querySelectorAll(".finance-result-eyebrow").forEach(function(el){/^\s*result\s*$/i.test(el.textContent||"")&&el.remove()}),root.querySelectorAll("h1, h2, h3, p, div, span, th").forEach(function(el){if(!function(el){return!(!el||!el.closest(".calculator-clean-result, .loan-style-output-panel, .finance-upgrade-result-box, .extra-result-box, .calculator-report-card, .calculator-report-result, #extraCalcResult, #financeUpgradeReportPage, #extraCalculatorReportPage, #calculatorReportPage"))}(el))return;const text=(el.textContent||"").trim();if(/^result$/i.test(text)&&0===el.children.length)el.matches("th, .finance-result-metric-label")?el.textContent="Answer":el.remove();else if(/\s+result$/i.test(text)&&0===el.children.length&&el.matches("h1, h2, h3")){const cleaned=function(text){return String(text||"").replace(/\s+calculator\s+result\s*$/i," calculator").replace(/\s+result\s*$/i,"").trim()}(text);cleaned&&(el.textContent=cleaned)}})}function startCleanup(){cleanupExtraResultText(document),[100,350,900,1800].forEach(function(delay){setTimeout(function(){cleanupExtraResultText(document)},delay)}),window.MutationObserver&&new MutationObserver(function(mutations){mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){node&&1===node.nodeType&&cleanupExtraResultText(node)})})}).observe(document.body,{childList:!0,subtree:!0})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startCleanup):startCleanup()}(),function(){"use strict";function fixReviewWallNav(){document.querySelectorAll("a.clean-chat-link, a.nav-chat-link").forEach(function(link){link.textContent="Review",link.setAttribute("href","review.html")}),document.querySelectorAll(".clean-nav-inner").forEach(function(inner){if(!inner.querySelector(".clean-wall-link")){var reviewLink=inner.querySelector(".clean-chat-link");if(reviewLink){var wallLink=document.createElement("a");wallLink.className="clean-nav-link clean-wall-link",wallLink.href="Wall.html",wallLink.textContent="Wall",reviewLink.insertAdjacentElement("afterend",wallLink)}}})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",fixReviewWallNav):fixReviewWallNav(),setTimeout(fixReviewWallNav,300)}(),
function(){
  "use strict";
  if (window.__calcStudioScientificGraphCleanInstalled) return;
  window.__calcStudioScientificGraphCleanInstalled = true;

  function isScientificPage(){
    return document.body && (document.body.dataset.page === "scientific" || location.pathname.indexOf("scientific-calculator") !== -1);
  }
  function byId(id){ return document.getElementById(id); }
  function finite(n){ return typeof n === "number" && Number.isFinite(n); }
  function fact(n){
    n = Number(n);
    if(!finite(n) || n < 0 || Math.floor(n) !== n || n > 170) return NaN;
    var r = 1;
    for(var i=2;i<=n;i++) r *= i;
    return r;
  }
  function nthRoot(a,n){
    a = Number(a); n = Number(n);
    if(!finite(a) || !finite(n) || n === 0) return NaN;
    if(a < 0 && Math.round(n) % 2 === 1) return -Math.pow(-a, 1/n);
    return Math.pow(a, 1/n);
  }
  function splitTopLevel(str){
    var out=[], start=0, depth=0, s=String(str||"");
    for(var i=0;i<s.length;i++){
      var ch=s[i];
      if(ch === "(") depth++;
      else if(ch === ")") depth = Math.max(0, depth-1);
      else if((ch === ";" || ch === "\n") && depth === 0){
        var part=s.slice(start,i).trim();
        if(part) out.push(part);
        start=i+1;
      }
    }
    var last=s.slice(start).trim();
    if(last) out.push(last);
    return out;
  }
  function normalize(expr){
    var s = String(expr || "").trim();
    s = s.replace(/[−–—]/g,"-").replace(/×/g,"*").replace(/÷/g,"/").replace(/π/g,"pi").replace(/√/g,"sqrt");
    s = s.replace(/\s+/g,"");
    s = s.replace(/(\d+|\)|pi|e|tau|phi)(?=(x|t|theta|pi|tau|phi|e|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|sqrt|cbrt|log|ln|exp|abs|floor|ceil|round|min|max|root|pow|sign|\())/gi,"$1*");
    s = s.replace(/(x|t|theta|pi|tau|phi|e|\))(?=(\d+))/gi,"$1*");
    s = s.replace(/\^/g,"**");
    s = s.replace(/(\d+(?:\.\d+)?|\([^()]*\)|[a-zA-Z_][a-zA-Z0-9_]*)(!)/g,"fact($1)");
    return s;
  }
  function jsExpression(expr, variableName){
    var s = normalize(expr);
    if(!/^[0-9a-zA-Z_+\-*/%.(),=<>!|&?:*\s]+$/.test(s)) throw new Error("Unsupported character");
    s = s.replace(/\broot\s*\(/gi,"nthRoot(");
    var fn = {
      sin:"Math.sin", cos:"Math.cos", tan:"Math.tan", asin:"Math.asin", acos:"Math.acos", atan:"Math.atan",
      sinh:"Math.sinh", cosh:"Math.cosh", tanh:"Math.tanh", sqrt:"Math.sqrt", cbrt:"Math.cbrt",
      log:"Math.log10", ln:"Math.log", exp:"Math.exp", abs:"Math.abs", floor:"Math.floor", ceil:"Math.ceil",
      round:"Math.round", min:"Math.min", max:"Math.max", pow:"Math.pow", sign:"Math.sign"
    };
    Object.keys(fn).forEach(function(name){ s = s.replace(new RegExp("\\b"+name+"\\s*\\(","gi"), fn[name]+"("); });
    s = s.replace(/\bpi\b/gi,"Math.PI").replace(/\btau\b/gi,"(2*Math.PI)").replace(/\bphi\b/gi,"((1+Math.sqrt(5))/2)");
    s = s.replace(/\bln2\b/gi,"Math.LN2").replace(/\bln10\b/gi,"Math.LN10").replace(/\be\b/g,"Math.E");
    if(variableName === "t") s = s.replace(/\btheta\b/gi,"t").replace(/\bx\b/g,"t");
    else s = s.replace(/\btheta\b/gi,"x").replace(/\bt\b/g,"x");
    return s;
  }
  function makeFunction(expr, variableName){
    var body = jsExpression(expr, variableName || "x");
    return new Function(variableName || "x", "fact", "nthRoot", "var y = " + body + "; return Number.isFinite(y) ? y : NaN;");
  }
  function getInput(){ return byId("scientificExpression"); }
  function trigger(){ scheduleDraw(); }
  window.focusScientificInput = function(){
    var input = getInput(); if(!input) return;
    input.focus();
    var len=input.value.length;
    try{ input.setSelectionRange(len,len); }catch(e){}
    trigger();
  };
  window.appendScientific = function(value){
    var input = getInput(); if(!input) return;
    input.focus();
    var start = input.selectionStart == null ? input.value.length : input.selectionStart;
    var end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
    input.value = input.value.slice(0,start) + value + input.value.slice(end);
    var next = start + String(value).length;
    try{ input.setSelectionRange(next,next); }catch(e){}
    trigger();
  };
  window.clearScientificInput = function(){
    var input = getInput(); if(!input) return;
    input.value = "";
    input.focus();
    trigger();
  };

  function setupCanvas(canvas){
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(360, Math.floor(rect.width || 720));
    var h = Math.max(280, Math.floor(w * 0.52));
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx:ctx,w:w,h:h};
  }
  function getRange(){
    var min = Number((byId("graphXMin") || {}).value);
    var max = Number((byId("graphXMax") || {}).value);
    if(!finite(min)) min = -10;
    if(!finite(max)) max = 10;
    if(min === max){ min -= 10; max += 10; }
    if(min > max){ var t=min; min=max; max=t; }
    return {min:min,max:max};
  }
  function drawGrid(ctx,w,h,xMin,xMax,yMin,yMax){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0,0,w,h);
    function sx(x){ return (x-xMin)/(xMax-xMin)*w; }
    function sy(y){ return h-(y-yMin)/(yMax-yMin)*h; }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e5e7eb";
    for(var i=0;i<=10;i++){
      var x=i*w/10, y=i*h/10;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.25;
    if(xMin <= 0 && xMax >= 0){ var zx=sx(0); ctx.beginPath(); ctx.moveTo(zx,0); ctx.lineTo(zx,h); ctx.stroke(); }
    if(yMin <= 0 && yMax >= 0){ var zy=sy(0); ctx.beginPath(); ctx.moveTo(0,zy); ctx.lineTo(w,zy); ctx.stroke(); }
    return {sx:sx,sy:sy};
  }
  function sampleCartesian(fn,xMin,xMax){
    var pts=[], steps=900;
    for(var i=0;i<=steps;i++){
      var x=xMin+(xMax-xMin)*i/steps, y=fn(x,fact,nthRoot);
      pts.push({x:x,y:y,ok:finite(y)&&Math.abs(y)<1e6});
    }
    return pts;
  }
  function sampleParametric(fx,fy,tMin,tMax){
    var pts=[], steps=1000;
    for(var i=0;i<=steps;i++){
      var t=tMin+(tMax-tMin)*i/steps, x=fx(t,fact,nthRoot), y=fy(t,fact,nthRoot);
      pts.push({x:x,y:y,ok:finite(x)&&finite(y)&&Math.abs(x)<1e6&&Math.abs(y)<1e6});
    }
    return pts;
  }
  function yRangeFromPoints(series){
    var ys=[];
    series.forEach(function(pts){ pts.forEach(function(p){ if(p.ok) ys.push(p.y); }); });
    if(!ys.length) return {min:-10,max:10};
    ys.sort(function(a,b){ return a-b; });
    var lo=ys[Math.floor(ys.length*0.03)], hi=ys[Math.floor(ys.length*0.97)];
    if(!finite(lo)||!finite(hi)||lo===hi){ lo=-10; hi=10; }
    var pad=(hi-lo)*0.15 || 5;
    return {min:lo-pad,max:hi+pad};
  }
  function drawSeries(ctx,map,pts,color){
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    var drawing=false, last=null;
    pts.forEach(function(p){
      if(!p.ok){ drawing=false; last=null; return; }
      var px=map.sx(p.x), py=map.sy(p.y);
      if(last && Math.abs(py-last.y)>260) drawing=false;
      if(!drawing){ ctx.moveTo(px,py); drawing=true; } else ctx.lineTo(px,py);
      last={x:px,y:py};
    });
    ctx.stroke();
  }
  function parseInput(raw){
    var parts=splitTopLevel(raw), res={series:[],type:"cartesian"};
    if(!parts.length) return res;
    var xPart=null,yPart=null;
    parts.forEach(function(p){ if(/^x\s*=/.test(p)) xPart=p.replace(/^x\s*=/,""); if(/^y\s*=/.test(p)) yPart=p.replace(/^y\s*=/,""); });
    if(xPart && yPart){
      res.type="parametric";
      res.fx=makeFunction(xPart,"t");
      res.fy=makeFunction(yPart,"t");
      return res;
    }
    parts.forEach(function(p){
      p=p.trim();
      if(/^r\s*=/.test(p)) res.series.push({kind:"polar",expr:p.replace(/^r\s*=/,"")});
      else if(/^x\s*=/.test(p)) res.series.push({kind:"vertical",x:Number(p.replace(/^x\s*=/,""))});
      else res.series.push({kind:"cartesian",expr:p.replace(/^y\s*=/,"")});
    });
    return res;
  }
  function drawScientificGraph(){
    if(!isScientificPage()) return;
    var canvas=byId("scientificGraphCanvas"), input=byId("scientificExpression"), status=byId("scientificGraphStatus");
    if(!canvas || !input) return;
    var setup=setupCanvas(canvas), ctx=setup.ctx, w=setup.w, h=setup.h;
    var range=getRange(), xMin=range.min, xMax=range.max;
    var raw=String(input.value||"").trim();
    if(!raw){
      drawGrid(ctx,w,h,xMin,xMax,-10,10);
      ctx.fillStyle="#64748b"; ctx.font="15px system-ui, sans-serif"; ctx.textAlign="center";
      ctx.fillText("Enter an expression to draw the graph", w/2, h/2);
      if(status) status.textContent="Enter an expression to draw the graph.";
      return;
    }
    try{
      var parsed=parseInput(raw), series=[];
      if(parsed.type === "parametric") series.push(sampleParametric(parsed.fx,parsed.fy,0,2*Math.PI));
      else parsed.series.forEach(function(s){
        if(s.kind === "cartesian") series.push(sampleCartesian(makeFunction(s.expr,"x"),xMin,xMax));
        else if(s.kind === "polar"){
          var fr=makeFunction(s.expr,"t");
          series.push(sampleParametric(function(t){ var r=fr(t,fact,nthRoot); return r*Math.cos(t); }, function(t){ var r=fr(t,fact,nthRoot); return r*Math.sin(t); }, 0, 2*Math.PI));
        } else if(s.kind === "vertical" && finite(s.x)) series.push([{x:s.x,y:-1e3,ok:true},{x:s.x,y:1e3,ok:true}]);
      });
      var yr=yRangeFromPoints(series), map=drawGrid(ctx,w,h,xMin,xMax,yr.min,yr.max);
      ["#0f766e","#2563eb","#c2410c","#7c3aed","#be123c","#15803d"].forEach(function(color,i){ if(series[i]) drawSeries(ctx,map,series[i],color); });
      if(status) status.textContent="Graph updated.";
    }catch(e){
      drawGrid(ctx,w,h,xMin,xMax,-10,10);
      ctx.fillStyle="#b42318"; ctx.font="14px system-ui, sans-serif"; ctx.textAlign="center";
      ctx.fillText("Cannot draw this expression. Check syntax.", w/2, h/2);
      if(status) status.textContent="Try sin(x), y=x^2, x=2, r=2sin(3t), or x=cos(t); y=sin(t).";
    }
  }
  var raf=0;
  function scheduleDraw(){
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){ raf=0; drawScientificGraph(); });
  }
  window.drawScientificGraph = drawScientificGraph;
  window.calculateScientificExtra = scheduleDraw;

  function addHint(){
    var card=document.querySelector(".scientific-expression-card");
    if(!card || byId("scientificGraphTypeHint")) return;
    var hint=document.createElement("p");
    hint.id="scientificGraphTypeHint";
    hint.className="graph-type-hint";
    hint.innerHTML="Graph types: <code>sin(x)</code>, <code>y=x^2</code>, <code>x=2</code>, multiple with <code>;</code>, polar <code>r=2sin(3t)</code>, parametric <code>x=cos(t); y=sin(t)</code>.";
    card.appendChild(hint);
  }
  function install(){
    if(!isScientificPage()) return;
    addHint();
    var input=byId("scientificExpression"), min=byId("graphXMin"), max=byId("graphXMax");
    if(input && !input.dataset.cleanGraphReady){ input.dataset.cleanGraphReady="1"; input.addEventListener("input", scheduleDraw); input.addEventListener("change", scheduleDraw); }
    if(min && !min.dataset.cleanGraphReady){ min.dataset.cleanGraphReady="1"; min.addEventListener("input", scheduleDraw); min.addEventListener("change", scheduleDraw); }
    if(max && !max.dataset.cleanGraphReady){ max.dataset.cleanGraphReady="1"; max.addEventListener("input", scheduleDraw); max.addEventListener("change", scheduleDraw); }
    scheduleDraw();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install); else install();
  window.addEventListener("resize", function(){ clearTimeout(window.__sciCleanResize); window.__sciCleanResize=setTimeout(scheduleDraw,120); });
}();

(function () {
  "use strict";
  if (window.__calcStudioHideNavbarOnScrollInstalled) return;
  window.__calcStudioHideNavbarOnScrollInstalled = true;

  function initHideNavbarOnScroll() {
    var nav = document.getElementById("navbar") || document.querySelector(".clean-navbar");
    if (!nav) return;

    var lastY = window.scrollY || 0;
    var ticking = false;
    var minMove = 8;

    function isMenuOpen() {
      return !!document.querySelector(".clean-nav-dropdown:hover, .clean-nav-dropdown:focus-within, .clean-nav-dropdown.is-open");
    }

    function update() {
      var currentY = window.scrollY || 0;
      var diff = currentY - lastY;

      if (Math.abs(diff) >= minMove) {
        if (currentY > 90 && diff > 0 && !isMenuOpen()) {
          nav.classList.add("nav-hidden-on-scroll");
        } else if (diff < 0 || currentY <= 90) {
          nav.classList.remove("nav-hidden-on-scroll");
        }
        lastY = currentY;
      }
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    nav.addEventListener("mouseenter", function () {
      nav.classList.remove("nav-hidden-on-scroll");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHideNavbarOnScroll);
  } else {
    initHideNavbarOnScroll();
  }
}());

/* ===== Page isolation helpers ===== */
(function(){
  "use strict";
  window.CalcStudioPage = (document.body && document.body.dataset && document.body.dataset.page) || "";
})();

/* ===== Desktop behavior formerly from pc.js ===== */
!function(){"use strict";function syncModeClass(){document.body.classList.toggle("desktop-layout",window.matchMedia("(min-width: 851px)").matches)}function start(){!function(){const menuIcon=document.getElementById("menuIcon");menuIcon&&menuIcon.remove(),document.body.classList.remove("menu-scrolled"),document.documentElement.classList.remove("menu-scrolled");const nav=document.getElementById("navbar");nav&&(nav.classList.remove("open","scrolled"),nav.classList.add("clean-navbar"))}(),syncModeClass(),window.addEventListener("resize",syncModeClass,{passive:!0})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}();

/* ===== Mobile behavior formerly from phone.js ===== */
!function(){"use strict";function syncModeClass(){document.body.classList.toggle("mobile-layout",window.matchMedia("(max-width: 850px)").matches)}function start(){!function(){const menuIcon=document.getElementById("menuIcon");menuIcon&&menuIcon.remove(),document.body.classList.remove("menu-scrolled"),document.documentElement.classList.remove("menu-scrolled");const nav=document.getElementById("navbar");nav&&(nav.classList.remove("open","scrolled"),nav.classList.add("clean-navbar"))}(),syncModeClass(),window.addEventListener("resize",syncModeClass,{passive:!0})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}();

/* ===== Extracted page-specific scripts from HTML files ===== */

/* ===== Page-specific JS: Wall.html (wall) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'wall') return;
(function () {
      "use strict";

      const storageKey = "calculatorUserReviewsV1";
      const wall = document.getElementById("reviewWallGrid");
      const canvas = document.getElementById("signatureWallCanvas");

      function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
      }

      function stars(value) {
        const rating = Math.max(1, Math.min(5, Number(value) || 5));
        return "★".repeat(rating) + "☆".repeat(5 - rating);
      }

      function getReviews() {
        try {
          const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
          return Array.isArray(list) ? list : [];
        } catch {
          return [];
        }
      }

      function layoutFor(index, count) {
        const wide = window.matchMedia("(min-width: 1120px)").matches;
        const tablet = window.matchMedia("(min-width: 760px)").matches;
        const columns = wide ? 4 : (tablet ? 3 : 1);
        const row = Math.floor(index / columns);
        const col = index % columns;
        const jitterX = ((index * 37) % 9) - 4;
        const jitterY = ((index * 29) % 34) - 8;
        const rotate = (((index * 17) % 13) - 6) + "deg";
        const width = (wide ? 230 : 210) + ((index * 19) % 44);
        const left = columns === 1 ? 0 : (4 + col * (92 / columns) + jitterX);
        const top = 38 + (row * 210) + jitterY;
        return {
          left: left + "%",
          top: top + "px",
          rotate: rotate,
          width: width + "px",
          minHeight: Math.max(620, 140 + (Math.ceil(count / columns) * 220)) + "px"
        };
      }

      function renderWall() {
        const reviews = getReviews();
        if (!wall || !canvas) return;

        if (!reviews.length) {
          wall.innerHTML = "";
          canvas.classList.add("is-empty");
          canvas.style.minHeight = "calc(100vh - 128px)";
          return;
        }

        canvas.classList.remove("is-empty");
        canvas.style.minHeight = layoutFor(0, reviews.length).minHeight;
        wall.innerHTML = reviews.map(function (review, index) {
          const pos = layoutFor(index, reviews.length);
          return '<article class="signature-wall-note" style="--note-left:' + pos.left + '; --note-top:' + pos.top + '; --note-rotate:' + pos.rotate + '; --note-width:' + pos.width + ';">' +
            '<div class="signature-wall-rating" aria-label="' + escapeText(review.rating || 5) + ' out of 5 stars">' + stars(review.rating) + '</div>' +
            '<p class="signature-wall-message">“' + escapeText(review.message || review.title || "Helpful calculator website") + '”</p>' +
            '<p class="signature-wall-signed">— ' + escapeText(review.name || "Guest") + '</p>' +
            '<time class="signature-wall-time">' + escapeText(review.time || "") + '</time>' +
          '</article>';
        }).join("");
      }

      window.addEventListener("resize", renderWall);
      window.addEventListener("storage", function (event) { if (event.key === storageKey) renderWall(); });
      renderWall();
      setInterval(renderWall, 5000);
    })();
})();

/* ===== Page-specific JS: basic-calculator.html (basic) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'basic') return;
document.addEventListener('DOMContentLoaded', function () {
  const removePreviousInputBox = () => {
    const box = document.getElementById('basicInlineResult');
    if (box) box.remove();
    document.querySelectorAll('.basic-inline-result').forEach(function (el) { el.remove(); });
  };
  removePreviousInputBox();
  new MutationObserver(removePreviousInputBox).observe(document.body, { childList: true, subtree: true });
});
})();

/* ===== Page-specific JS: basic-calculator.html (basic) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'basic') return;
document.addEventListener('DOMContentLoaded', function () {
  const display = document.getElementById('display');
  const previousLine = document.getElementById('basicPreviousLine');
  if (!display || !previousLine) return;

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function setPrevious(text) {
    const value = clean(text);
    previousLine.textContent = value || 'Previous calculation';
    previousLine.title = previousLine.textContent;
  }

  function loadLatestPrevious() {
    try {
      const history = JSON.parse(localStorage.getItem('basicCalculationHistory') || '[]');
      const latest = Array.isArray(history) ? history[history.length - 1] : null;
      if (latest && latest.expression) {
        setPrevious(latest.expression + ' = ' + latest.result);
      }
    } catch (error) {}
  }

  loadLatestPrevious();

  const oldCalculate = window.calculate;
  if (typeof oldCalculate === 'function') {
    window.calculate = function () {
      const expressionBefore = clean(display.value);
      oldCalculate.apply(this, arguments);
      setTimeout(function () {
        const answerAfter = clean(display.value);
        if (expressionBefore && expressionBefore !== 'Error' && answerAfter && answerAfter !== 'Error') {
          setPrevious(expressionBefore + ' = ' + answerAfter);
        }
      }, 0);
    };
  }

  const oldClearDisplay = window.clearDisplay;
  if (typeof oldClearDisplay === 'function') {
    window.clearDisplay = function () {
      oldClearDisplay.apply(this, arguments);
      setPrevious('Previous calculation');
    };
  }
});
})();

/* ===== Page-specific JS: basic-calculator.html (basic) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'basic') return;
document.addEventListener('DOMContentLoaded', function () {
  const display = document.getElementById('display');
  if (!display) return;

  const maxDesktop = 46;
  const maxMobile = 34;
  const minSize = 14;

  const measurer = document.createElement('span');
  measurer.setAttribute('aria-hidden', 'true');
  Object.assign(measurer.style, {
    position: 'fixed',
    left: '-99999px',
    top: '-99999px',
    visibility: 'hidden',
    whiteSpace: 'pre',
    pointerEvents: 'none'
  });
  document.body.appendChild(measurer);

  function syncMeasureStyle(size) {
    const style = window.getComputedStyle(display);
    measurer.style.fontFamily = style.fontFamily;
    measurer.style.fontWeight = style.fontWeight;
    measurer.style.letterSpacing = style.letterSpacing;
    measurer.style.fontSize = size + 'px';
  }

  function shrinkDisplayText() {
    const text = String(display.value || display.placeholder || '0');
    const available = Math.max(80, display.clientWidth - 20);
    let size = window.innerWidth < 700 ? maxMobile : maxDesktop;

    measurer.textContent = text;
    syncMeasureStyle(size);

    while (size > minSize && measurer.offsetWidth > available) {
      size -= 1;
      syncMeasureStyle(size);
    }

    /* setProperty with important is required because older page CSS also uses !important */
    display.style.setProperty('font-size', size + 'px', 'important');
    display.style.setProperty('line-height', '1.05', 'important');
  }

  function queueShrink() {
    requestAnimationFrame(shrinkDisplayText);
    setTimeout(shrinkDisplayText, 40);
  }

  display.addEventListener('input', queueShrink);
  display.addEventListener('change', queueShrink);
  window.addEventListener('resize', queueShrink);

  ['add', 'addFunction', 'addPower', 'removeLast', 'clearDisplay', 'calculate'].forEach(function (fnName) {
    const original = window[fnName];
    if (typeof original === 'function' && !original.__basicShrinkWrappedV2) {
      const wrapped = function () {
        const result = original.apply(this, arguments);
        queueShrink();
        return result;
      };
      wrapped.__basicShrinkWrappedV2 = true;
      window[fnName] = wrapped;
    }
  });

  queueShrink();
});
})();

/* ===== Page-specific JS: chatting.html (review) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'review') return;
(function () {
      "use strict";

      const storageKey = "calculatorUserReviewsV1";
      const oldStorageKey = "cartoonCalculatorLocalChatMessages";
      const form = document.getElementById("reviewForm");
      const preview = document.getElementById("latestReviewPreview");
      const status = document.getElementById("reviewStatus");
      const clearBtn = document.getElementById("clearReviewsBtn");

      function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
      }

      function stars(value) {
        const rating = Math.max(1, Math.min(5, Number(value) || 5));
        return "★".repeat(rating) + "☆".repeat(5 - rating);
      }

      function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
      }

      function getReviews() {
        const reviews = readJson(storageKey);
        if (reviews.length) return reviews;

        const oldMessages = readJson(oldStorageKey)
          .filter(function (item) { return item && String(item.type || "").toLowerCase() === "review"; })
          .map(function (item) {
            return {
              name: item.name || "Guest",
              rating: 5,
              title: "Review",
              message: item.message || "",
              time: item.time || ""
            };
          });

        if (oldMessages.length) localStorage.setItem(storageKey, JSON.stringify(oldMessages.slice(0, 100)));
        return oldMessages;
      }

      function saveReviews(reviews) {
        localStorage.setItem(storageKey, JSON.stringify(reviews.slice(0, 100)));
      }

      function renderPreview() {
        const reviews = getReviews();
        if (!preview) return;
        if (!reviews.length) {
          preview.innerHTML = '<p class="review-empty-state">No reviews yet. Be the first to post one.</p>';
          return;
        }

        preview.innerHTML = reviews.slice(0, 3).map(function (review) {
          return '<article class="review-preview-item">' +
            '<div class="review-stars" aria-label="' + escapeText(review.rating || 5) + ' out of 5 stars">' + stars(review.rating) + '</div>' +
            '<h3>' + escapeText(review.title || "Review") + '</h3>' +
            '<p>' + escapeText(review.message || "") + '</p>' +
            '<small>By ' + escapeText(review.name || "Guest") + ' · ' + escapeText(review.time || "") + '</small>' +
          '</article>';
        }).join("");
      }

      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          const name = document.getElementById("reviewName").value.trim() || "Guest";
          const rating = document.getElementById("reviewRating").value || "5";
          const title = document.getElementById("reviewTitle").value.trim() || "Helpful calculator website";
          const message = document.getElementById("reviewMessage").value.trim();
          if (!message) return;

          const reviews = getReviews();
          reviews.unshift({
            name: name,
            rating: Number(rating),
            title: title,
            message: message,
            time: new Date().toLocaleString()
          });
          saveReviews(reviews);
          form.reset();
          renderPreview();
          if (status) status.textContent = "Review posted. It is now shown on the Wall page.";
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (!confirm("Clear reviews saved in this browser?")) return;
          localStorage.removeItem(storageKey);
          renderPreview();
          if (status) status.textContent = "Saved reviews cleared from this browser.";
        });
      }

      renderPreview();
    })();
})();

/* ===== Page-specific JS: compound-interest-calculator.html (compound) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'compound') return;
if (window.location.pathname.endsWith("/calculator/")) {
      window.location.replace(
        window.location.pathname + "index.html" + window.location.search + window.location.hash
      );
    }
})();

/* ===== Page-specific JS: grade.html (grade) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'grade') return;

window.pointerRowHtml = function pointerRowHtml(index) {
  return '<tr>' +
    '<td><input type="text" class="pg-subject" placeholder="Subject ' + index + '"></td>' +
    '<td><input type="number" class="pg-credit" min="0" step="0.5" placeholder="3"></td>' +
    '<td><input type="number" class="pg-pointer" min="0" max="4" step="0.01" placeholder="4.00"></td>' +
    '<td><button type="button" class="pg-remove" onclick="removePointerRow(this)" aria-label="Remove row">×</button></td>' +
  '</tr>';
}

window.addPointerRow = function addPointerRow() {
  var body = document.getElementById('pointerGradeRows');
  body.insertAdjacentHTML('beforeend', pointerRowHtml(body.children.length + 1));
}

window.removePointerRow = function removePointerRow(button) {
  var body = document.getElementById('pointerGradeRows');
  if (body.children.length <= 1) return;
  button.closest('tr').remove();
  calculatePointerGrade();
}

window.calculatePointerGrade = function calculatePointerGrade() {
  var rows = Array.from(document.querySelectorAll('#pointerGradeRows tr'));
  var totalCredits = 0;
  var totalQuality = 0;
  var validRows = [];

  rows.forEach(function(row, i) {
    var subject = row.querySelector('.pg-subject').value.trim() || ('Subject ' + (i + 1));
    var credit = Number(row.querySelector('.pg-credit').value);
    var pointer = Number(row.querySelector('.pg-pointer').value);
    if (Number.isFinite(credit) && Number.isFinite(pointer) && credit > 0 && pointer >= 0) {
      if (pointer > 4) pointer = 4;
      var quality = credit * pointer;
      totalCredits += credit;
      totalQuality += quality;
      validRows.push({ subject: subject, credit: credit, pointer: pointer, quality: quality });
    }
  });

  var result = document.getElementById('gradeResult');
  if (!validRows.length || totalCredits <= 0) {
    result.innerHTML = '<article class="finance-result-shell"><header class="finance-result-header"><h2>Pointer result</h2><p>Add at least one subject with credit hour and pointer.</p></header></article>';
    return;
  }

  var gpa = totalQuality / totalCredits;
  var standing = gpa >= 3.67 ? 'Excellent' : gpa >= 3.00 ? 'Good' : gpa >= 2.00 ? 'Pass' : 'Needs improvement';
  var tableRows = validRows.map(function(item) {
    return '<tr><td>' + item.subject + '</td><td>' + item.credit.toFixed(1).replace('.0','') + '</td><td>' + item.pointer.toFixed(2) + '</td><td>' + item.quality.toFixed(2) + '</td></tr>';
  }).join('');

  result.innerHTML = '<article class="finance-result-shell">' +
    '<header class="finance-result-header"><h2>Pointer result</h2><p>Your weighted pointer based on credit hours.</p></header>' +
    '<div class="finance-result-summary-grid">' +
    '<article class="finance-result-metric-card"><div class="finance-result-metric-label">GPA / Pointer</div><div class="finance-result-metric-value">' + gpa.toFixed(2) + '</div></article>' +
    '<article class="finance-result-metric-card"><div class="finance-result-metric-label">Total credit hours</div><div class="finance-result-metric-value">' + totalCredits.toFixed(1).replace('.0','') + '</div></article>' +
    '<article class="finance-result-metric-card"><div class="finance-result-metric-label">Standing</div><div class="finance-result-metric-value">' + standing + '</div></article>' +
    '</div>' +
    '<table class="pointer-grade-mini-table"><thead><tr><th>Subject</th><th>Credit</th><th>Pointer</th><th>Quality points</th></tr></thead><tbody>' + tableRows + '</tbody></table>' +
    '</article>';
}

document.addEventListener('input', function(e) {
  if (e.target && (e.target.classList.contains('pg-credit') || e.target.classList.contains('pg-pointer') || e.target.classList.contains('pg-subject'))) {
    clearTimeout(window.gradeAutoTimer);
    window.gradeAutoTimer = setTimeout(calculatePointerGrade, 250);
  }
});

document.addEventListener('DOMContentLoaded', calculatePointerGrade);

})();

/* ===== Page-specific JS: percentage-calculator.html (percentage) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'percentage') return;
(function () {
  'use strict';

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function byId(id) { return document.getElementById(id); }

  var modes = {
    of: { a: 'Input A: Percentage (%)', b: 'Input B: Number', pa: 'Example: 20', pb: 'Example: 150', help: 'Find A% of B.' },
    iswhat: { a: 'Input A: Part value', b: 'Input B: Total value', pa: 'Example: 30', pb: 'Example: 150', help: 'Find what percentage A is of B.' },
    increase: { a: 'Input A: Original value', b: 'Input B: New value', pa: 'Example: 100', pb: 'Example: 125', help: 'Find percentage increase from A to B.' },
    decrease: { a: 'Input A: Original value', b: 'Input B: New value', pa: 'Example: 100', pb: 'Example: 80', help: 'Find percentage decrease from A to B.' },
    difference: { a: 'Input A: First value', b: 'Input B: Second value', pa: 'Example: 80', pb: 'Example: 100', help: 'Find percentage difference between A and B.' },
    discount: { a: 'Input A: Original price', b: 'Input B: Discount (%)', pa: 'Example: 100', pb: 'Example: 20', help: 'Find the final price after discount.' },
    salary: { a: 'Input A: Current salary', b: 'Input B: Increment (%)', pa: 'Example: 3000', pb: 'Example: 5', help: 'Find the new salary after increment.' },
    reverse: { a: 'Input A: Known value', b: 'Input B: Percentage (%)', pa: 'Example: 50', pb: 'Example: 25', help: 'Find the original value when A is B%.' },
    profitmargin: { a: 'Input A: Selling price', b: 'Input B: Cost price', pa: 'Example: 150', pb: 'Example: 100', help: 'Find the profit margin percentage.' },
    markup: { a: 'Input A: Cost price', b: 'Input B: Markup (%)', pa: 'Example: 100', pb: 'Example: 30', help: 'Find the selling price after markup.' },
    gstsst: { a: 'Input A: Amount before tax', b: 'Input B: GST/SST (%)', pa: 'Example: 100', pb: 'Example: 6', help: 'Find the total amount after GST/SST.' },
    commission: { a: 'Input A: Sales amount', b: 'Input B: Commission (%)', pa: 'Example: 5000', pb: 'Example: 5', help: 'Find the commission amount.' }
  };

  var state = { type: 'of' };

  function numberFromInput(input) {
    var raw = String((input && input.value) || '').replace(/,/g, '').trim();
    if (!raw) return NaN;
    var value = Number(raw);
    return Number.isFinite(value) ? value : NaN;
  }

  function fmt(value, decimals) {
    if (!Number.isFinite(value)) return '-';
    var fixed = Number(value.toFixed(decimals == null ? 8 : decimals));
    return fixed.toLocaleString('en-MY', { maximumFractionDigits: decimals == null ? 8 : decimals, minimumFractionDigits: 0 });
  }

  function money(value) {
    if (!Number.isFinite(value)) return '-';
    return 'RM ' + Number(value.toFixed(2)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function resultText(a, b) {
    var answer;
    switch (state.type) {
      case 'of':
        return fmt((a / 100) * b);
      case 'iswhat':
        return b === 0 ? 'Cannot divide by zero' : fmt((a / b) * 100) + '%';
      case 'increase':
        return a === 0 ? 'Cannot divide by zero' : fmt(((b - a) / a) * 100) + '%';
      case 'decrease':
        return a === 0 ? 'Cannot divide by zero' : fmt(((a - b) / a) * 100) + '%';
      case 'difference':
        var avg = (Math.abs(a) + Math.abs(b)) / 2;
        return avg === 0 ? 'Cannot calculate difference' : fmt((Math.abs(a - b) / avg) * 100) + '%';
      case 'discount':
        return fmt(a - ((a * b) / 100));
      case 'salary':
        return money(a + ((a * b) / 100));
      case 'reverse':
        return b === 0 ? 'Cannot divide by zero' : fmt(a / (b / 100));
      case 'profitmargin':
        return a === 0 ? 'Cannot divide by zero' : fmt(((a - b) / a) * 100) + '%';
      case 'markup':
        answer = a + ((a * b) / 100);
        return fmt(answer);
      case 'gstsst':
        answer = a + ((a * b) / 100);
        return fmt(answer);
      case 'commission':
        return fmt((a * b) / 100);
      default:
        return 'Select a type';
    }
  }

  function calculate() {
    var inputA = byId('percentageInputA');
    var inputB = byId('percentageInputB');
    var result = byId('percentageLiveResult');
    var resultBox = byId('percentageLiveResultBox');
    var legacy = byId('percentageReportOutput');
    var oldResult = byId('percentageResult');
    if (legacy) legacy.remove();
    if (oldResult) oldResult.style.setProperty('display', 'none', 'important');
    if (!inputA || !inputB || !result || !resultBox) return;
    var a = numberFromInput(inputA);
    var b = numberFromInput(inputB);
    resultBox.hidden = false;
    resultBox.style.setProperty('display', 'block', 'important');
    resultBox.style.setProperty('visibility', 'visible', 'important');
    resultBox.style.setProperty('opacity', '1', 'important');
    result.textContent = (Number.isFinite(a) && Number.isFinite(b)) ? resultText(a, b) : 'Enter values';
  }

  function setMode(type) {
    if (!modes[type]) type = 'of';
    state.type = type;
    var mode = modes[type];
    var labelA = byId('percentageLabelA');
    var labelB = byId('percentageLabelB');
    var inputA = byId('percentageInputA');
    var inputB = byId('percentageInputB');
    var helper = byId('percentageHelper');
    if (labelA) labelA.textContent = mode.a;
    if (labelB) labelB.textContent = mode.b;
    if (inputA) inputA.placeholder = mode.pa;
    if (inputB) inputB.placeholder = mode.pb;
    if (helper) helper.textContent = mode.help;
    $all('.percentage-type-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-type') === type;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.type = 'button';
    });
    calculate();
  }

  function init() {
    var inputA = byId('percentageInputA');
    var inputB = byId('percentageInputB');
    var form = $('.clean-nav-search');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

    $all('.percentage-type-btn').forEach(function (btn) {
      btn.type = 'button';
      btn.style.pointerEvents = 'auto';
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setMode(btn.getAttribute('data-type'));
      });
    });
    if (inputA) {
      inputA.addEventListener('input', calculate);
      inputA.addEventListener('change', calculate);
    }
    if (inputB) {
      inputB.addEventListener('input', calculate);
      inputB.addEventListener('change', calculate);
    }
    var copyBtn = byId('percentageCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var result = byId('percentageLiveResult');
        var text = result ? String(result.textContent || '').trim() : '';
        if (!text || text === 'Enter values') return;
        function done() {
          var oldText = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          setTimeout(function () { copyBtn.textContent = oldText; }, 1200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            var temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            temp.remove();
            done();
          });
        } else {
          var temp = document.createElement('textarea');
          temp.value = text;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          done();
        }
      });
    }
    window.calculatePercentage = calculate;
    window.calculatePercentageTypeButtons = calculate;
    window.__percentageSetMode = setMode;
    window.scrollToTop = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    setMode(($('.percentage-type-btn.active') || $('.percentage-type-btn') || {}).getAttribute ? (($('.percentage-type-btn.active') || $('.percentage-type-btn')).getAttribute('data-type')) : 'of');
    [50, 250, 700].forEach(function (delay) { setTimeout(calculate, delay); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
})();

/* ===== Page-specific JS: review.html (review) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'review') return;
(function () {
      "use strict";

      const storageKey = "calculatorUserReviewsV1";
      const oldStorageKey = "cartoonCalculatorLocalChatMessages";
      const form = document.getElementById("reviewForm");
      const preview = document.getElementById("latestReviewPreview");
      const status = document.getElementById("reviewStatus");
      const clearBtn = document.getElementById("clearReviewsBtn");

      function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
      }

      function stars(value) {
        const rating = Math.max(1, Math.min(5, Number(value) || 5));
        return "★".repeat(rating) + "☆".repeat(5 - rating);
      }

      function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
      }

      function getReviews() {
        const reviews = readJson(storageKey);
        if (reviews.length) return reviews;

        const oldMessages = readJson(oldStorageKey)
          .filter(function (item) { return item && String(item.type || "").toLowerCase() === "review"; })
          .map(function (item) {
            return {
              name: item.name || "Guest",
              rating: 5,
              title: "Review",
              message: item.message || "",
              time: item.time || ""
            };
          });

        if (oldMessages.length) localStorage.setItem(storageKey, JSON.stringify(oldMessages.slice(0, 100)));
        return oldMessages;
      }

      function saveReviews(reviews) {
        localStorage.setItem(storageKey, JSON.stringify(reviews.slice(0, 100)));
      }

      function renderPreview() {
        const reviews = getReviews();
        if (!preview) return;
        if (!reviews.length) {
          preview.innerHTML = '<p class="review-empty-state">No signatures yet. Be the first to sign the wall.</p>';
          return;
        }

        preview.innerHTML = reviews.slice(0, 3).map(function (review) {
          return '<article class="review-preview-item">' +
            '<div class="review-stars" aria-label="' + escapeText(review.rating || 5) + ' out of 5 stars">' + stars(review.rating) + '</div>' +
            '<h3>' + escapeText(review.title || "Review") + '</h3>' +
            '<p>' + escapeText(review.message || "") + '</p>' +
            '<small>By ' + escapeText(review.name || "Guest") + ' · ' + escapeText(review.time || "") + '</small>' +
          '</article>';
        }).join("");
      }

      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          const name = document.getElementById("reviewName").value.trim() || "Guest";
          const rating = document.getElementById("reviewRating").value || "5";
          const title = document.getElementById("reviewTitle").value.trim() || "Helpful calculator website";
          const message = document.getElementById("reviewMessage").value.trim();
          if (!message) return;

          const reviews = getReviews();
          reviews.unshift({
            name: name,
            rating: Number(rating),
            title: title,
            message: message,
            time: new Date().toLocaleString()
          });
          saveReviews(reviews);
          form.reset();
          renderPreview();
          if (status) status.textContent = "Signature added. It is now shown on the Wall page.";
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (!confirm("Clear signatures saved in this browser?")) return;
          localStorage.removeItem(storageKey);
          renderPreview();
          if (status) status.textContent = "Saved signatures cleared from this browser.";
        });
      }

      renderPreview();
    })();
})();

/* ===== Page-specific JS: unit-converter-calculator.html (unitConverter) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;
(function(){
  'use strict';
  if(!/unit-converter-calculator\.html?$/i.test(location.pathname)) return;

  const unitSets = {
    length: [
      ['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'],
      ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']
    ],
    weight: [
      ['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'],
      ['oz','Ounce'], ['tonne','Tonne']
    ],
    temperature: [
      ['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']
    ],
    area: [
      ['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'],
      ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']
    ],
    volume: [
      ['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'],
      ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']
    ],
    speed: [
      ['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'],
      ['knot','Knot'], ['fps','Foot/sec']
    ]
  };

  const factors = {
    length: {m:1,km:1000,cm:0.01,mm:0.001,mile:1609.344,yard:0.9144,ft:0.3048,inch:0.0254},
    weight: {kg:1,g:0.001,mg:0.000001,lb:0.45359237,oz:0.028349523125,tonne:1000},
    area: {m2:1,km2:1000000,cm2:0.0001,ft2:0.09290304,in2:0.00064516,acre:4046.8564224,hectare:10000},
    volume: {l:1,ml:0.001,m3:1000,cm3:0.001,gallon:3.785411784,cup:0.2365882365,pint:0.473176473},
    speed: {mps:1,kmh:0.2777777778,mph:0.44704,knot:0.5144444444,fps:0.3048}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'],
    area:['m2','ft2'], volume:['l','gallon'], speed:['kmh','mph']
  };

  function id(name){ return document.getElementById(name); }
  function activeType(){ return id('unitType') ? id('unitType').value || 'length' : 'length'; }
  function labelFor(type, key){
    const found = (unitSets[type] || []).find(item => item[0] === key);
    return found ? found[1] : key;
  }
  function format(value){
    if(!Number.isFinite(value)) return '-';
    return Number(value.toPrecision(12)).toLocaleString('en-MY', {maximumFractionDigits:8});
  }
  function convertTemp(value, from, to){
    let c;
    if(from === 'c') c = value;
    else if(from === 'f') c = (value - 32) * 5 / 9;
    else if(from === 'k') c = value - 273.15;
    else return NaN;
    if(to === 'c') return c;
    if(to === 'f') return c * 9 / 5 + 32;
    if(to === 'k') return c + 273.15;
    return NaN;
  }
  function renderResult(value, result, type, from, to){ return; }
  function renderEmptyResult(message){ return; }
  function calculate(){
    const type = activeType();
    const valueInput = id('unitValue');
    const value = Number(String(valueInput && valueInput.value || '').replace(/,/g,'').trim());
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';
    if(!Number.isFinite(value)) { renderEmptyResult('Enter value'); return; }
    let result = NaN;
    if(type === 'temperature') result = convertTemp(value, from, to);
    else if(factors[type] && Number.isFinite(factors[type][from]) && Number.isFinite(factors[type][to])) {
      result = value * factors[type][from] / factors[type][to];
    }
    if(Number.isFinite(result)) renderResult(value, result, type, from, to);
    else renderEmptyResult('Unsupported unit');
  }
  function renderUnitButtons(which){
    const type = activeType();
    const holder = id(which === 'from' ? 'unitFromButtons' : 'unitToButtons');
    const input = id(which === 'from' ? 'unitFrom' : 'unitTo');
    if(!holder || !input) return;
    holder.innerHTML = '';
    (unitSets[type] || []).forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.unitValue = key;
      if(input.value === key) btn.classList.add('is-active');
      btn.addEventListener('click', () => {
        input.value = key;
        holder.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        input.dispatchEvent(new Event('change', {bubbles:true}));
        calculate();
      });
      holder.appendChild(btn);
    });
  }
  function setType(type){
    if(!unitSets[type]) return;
    id('unitType').value = type;
    const pair = defaults[type];
    id('unitFrom').value = pair[0];
    id('unitTo').value = pair[1];
    document.querySelectorAll('.unit-type-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.unitType === type));
    renderUnitButtons('from');
    renderUnitButtons('to');
    id('unitType').dispatchEvent(new Event('change', {bubbles:true}));
    calculate();
  }
  function init(){
    document.querySelectorAll('.unit-type-btn').forEach(btn => btn.addEventListener('click', () => setType(btn.dataset.unitType)));
    const valueInput = id('unitValue');
    if(valueInput){
      valueInput.addEventListener('input', calculate);
      valueInput.addEventListener('change', calculate);
    }
    window.calculateUnitConverterExtra = calculate;
    setType(activeType());
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(function(){ window.calculateUnitConverterExtra = calculate; }, 400);
})();
})();

/* ===== Unit Converter dropdown units override ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']]
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'],
    area:['m2','ft2'], volume:['l','gallon'], speed:['kmh','mph']
  };

  function id(name){ return document.getElementById(name); }

  function fillSelect(select, items, selected){
    if (!select) return;
    select.innerHTML = '';
    items.forEach(function(item){
      const opt = document.createElement('option');
      opt.value = item[0];
      opt.textContent = item[1];
      if (item[0] === selected) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function updateDropdowns(type){
    type = unitSets[type] ? type : 'length';
    const pair = defaults[type] || defaults.length;
    if (id('unitType')) id('unitType').value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
    document.querySelectorAll('.unit-type-btn').forEach(function(btn){
      btn.classList.toggle('is-active', btn.dataset.unitType === type);
    });
    if (typeof window.calculateUnitConverterExtra === 'function') {
      window.calculateUnitConverterExtra();
    }
  }

  function initUnitDropdowns(){
    document.querySelectorAll('.unit-type-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setTimeout(function(){ updateDropdowns(btn.dataset.unitType); }, 0);
      });
    });
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (el) {
        el.addEventListener('change', function(){
          if (typeof window.calculateUnitConverterExtra === 'function') window.calculateUnitConverterExtra();
        });
        el.addEventListener('input', function(){
          if (typeof window.calculateUnitConverterExtra === 'function') window.calculateUnitConverterExtra();
        });
      }
    });
    updateDropdowns((id('unitType') && id('unitType').value) || 'length');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUnitDropdowns);
  else initUnitDropdowns();
})();

/* ===== Unit Converter type dropdown + expanded units override ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']],
    currency: [['usd','USD'], ['myr','MYR'], ['sgd','SGD'], ['eur','EUR'], ['gbp','GBP'], ['jpy','JPY'], ['aud','AUD']],
    data: [['b','Byte'], ['kb','Kilobyte'], ['mb','Megabyte'], ['gb','Gigabyte'], ['tb','Terabyte'], ['kib','Kibibyte'], ['mib','Mebibyte'], ['gib','Gibibyte']],
    time: [['s','Second'], ['min','Minute'], ['h','Hour'], ['day','Day'], ['week','Week'], ['month','Month'], ['year','Year']],
    energyPower: [['j','Joule'], ['kj','Kilojoule'], ['cal','Calorie'], ['kcal','Kilocalorie'], ['wh','Watt-hour'], ['kwh','Kilowatt-hour'], ['w','Watt'], ['kw','Kilowatt'], ['hp','Horsepower']]
  };

  const factors = {
    length: {m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254},
    weight: {kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, tonne:1000},
    area: {m2:1, km2:1000000, cm2:0.0001, ft2:0.09290304, in2:0.00064516, acre:4046.8564224, hectare:10000},
    volume: {l:1, ml:0.001, m3:1000, cm3:0.001, gallon:3.785411784, cup:0.2365882365, pint:0.473176473},
    speed: {mps:1, kmh:0.2777777778, mph:0.44704, knot:0.5144444444, fps:0.3048},
    currency: {usd:1, myr:0.213, sgd:0.74, eur:1.08, gbp:1.27, jpy:0.0064, aud:0.66},
    data: {b:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824},
    time: {s:1, min:60, h:3600, day:86400, week:604800, month:2629746, year:31556952},
    energyPower: {j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, w:1, kw:1000, hp:745.699872}
  };

  const dimension = {
    energyPower: {j:'energy', kj:'energy', cal:'energy', kcal:'energy', wh:'energy', kwh:'energy', w:'power', kw:'power', hp:'power'}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'], area:['m2','ft2'], volume:['l','gallon'], speed:['kmh','mph'],
    currency:['usd','myr'], data:['mb','gb'], time:['h','min'], energyPower:['j','kj']
  };

  function id(name){ return document.getElementById(name); }

  function fillSelect(select, items, selected){
    if (!select) return;
    select.innerHTML = '';
    items.forEach(function(item){
      const opt = document.createElement('option');
      opt.value = item[0];
      opt.textContent = item[1];
      if (item[0] === selected) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function convertTemp(value, from, to){
    let c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else if (from === 'k') c = value - 273.15;
    else return NaN;
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    if (to === 'k') return c + 273.15;
    return NaN;
  }

  function calculate(){
    const type = (id('unitType') && id('unitType').value) || 'length';
    const value = Number(String(id('unitValue') && id('unitValue').value || '').replace(/,/g,'').trim());
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';
    if (!Number.isFinite(value)) return;
    if (type === 'temperature') return convertTemp(value, from, to);
    if (dimension[type] && dimension[type][from] && dimension[type][to] && dimension[type][from] !== dimension[type][to]) return NaN;
    const set = factors[type] || {};
    if (Number.isFinite(set[from]) && Number.isFinite(set[to]) && set[to] !== 0) return value * set[from] / set[to];
    return NaN;
  }

  function setType(type){
    type = unitSets[type] ? type : 'length';
    const pair = defaults[type] || defaults.length;
    if (id('unitType')) id('unitType').value = type;
    if (id('unitTypeSelect')) id('unitTypeSelect').value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
  }

  function init(){
    const typeSelect = id('unitTypeSelect');
    if (typeSelect) {
      typeSelect.addEventListener('change', function(){ setType(typeSelect.value); });
    }
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });
    setType((id('unitType') && id('unitType').value) || 'length');
    window.calculateUnitConverterExtra = calculate;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* ===== Unit Converter final standalone auto-calculate fix ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']],
    currency: [['usd','USD'], ['myr','MYR'], ['sgd','SGD'], ['eur','EUR'], ['gbp','GBP'], ['jpy','JPY'], ['aud','AUD']],
    data: [['b','Byte'], ['kb','Kilobyte'], ['mb','Megabyte'], ['gb','Gigabyte'], ['tb','Terabyte'], ['kib','Kibibyte'], ['mib','Mebibyte'], ['gib','Gibibyte']],
    time: [['s','Second'], ['min','Minute'], ['h','Hour'], ['day','Day'], ['week','Week'], ['month','Month'], ['year','Year']],
    energyPower: [['j','Joule'], ['kj','Kilojoule'], ['cal','Calorie'], ['kcal','Kilocalorie'], ['wh','Watt-hour'], ['kwh','Kilowatt-hour'], ['w','Watt'], ['kw','Kilowatt'], ['hp','Horsepower']]
  };

  const factors = {
    length: {m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254},
    weight: {kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, tonne:1000},
    area: {m2:1, km2:1000000, cm2:0.0001, ft2:0.09290304, in2:0.00064516, acre:4046.8564224, hectare:10000},
    volume: {l:1, ml:0.001, m3:1000, cm3:0.001, gallon:3.785411784, cup:0.2365882365, pint:0.473176473},
    speed: {mps:1, kmh:0.2777777778, mph:0.44704, knot:0.5144444444, fps:0.3048},
    /* Static approximate USD-based rates. For live rates, keep using your separate Currency Converter page. */
    currency: {usd:1, myr:0.213, sgd:0.74, eur:1.08, gbp:1.27, jpy:0.0064, aud:0.66},
    data: {b:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824},
    time: {s:1, min:60, h:3600, day:86400, week:604800, month:2629746, year:31556952},
    energyPower: {j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, w:1, kw:1000, hp:745.699872}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'], area:['m2','ft2'],
    volume:['l','gallon'], speed:['kmh','mph'], currency:['usd','myr'],
    data:['mb','gb'], time:['h','min'], energyPower:['j','kj']
  };

  const dimension = {
    energyPower: {j:'energy', kj:'energy', cal:'energy', kcal:'energy', wh:'energy', kwh:'energy', w:'power', kw:'power', hp:'power'}
  };

  function id(name){ return document.getElementById(name); }
  function labelFor(type, value){
    const found = (unitSets[type] || []).find(function(item){ return item[0] === value; });
    return found ? found[1] : value;
  }
  function fillSelect(select, items, selected){
    if (!select) return;
    const current = selected || select.value;
    select.innerHTML = '';
    items.forEach(function(item){
      const option = document.createElement('option');
      option.value = item[0];
      option.textContent = item[1];
      if (item[0] === current) option.selected = true;
      select.appendChild(option);
    });
  }
  function formatNumber(value){
    if (!Number.isFinite(value)) return '-';
    const clean = Math.abs(value) >= 100000000 || Math.abs(value) < 0.000001 && value !== 0
      ? Number(value).toExponential(6)
      : Number(value.toPrecision(12)).toLocaleString('en-MY', { maximumFractionDigits: 8 });
    return clean;
  }
  function setOutput(main, detail){
    const result = id('unitInlineResult');
    const detailEl = id('unitInlineDetail');
    if (result) result.textContent = main || 'Enter value';
    if (detailEl) detailEl.textContent = detail || '';
  }
  function convertTemp(value, from, to){
    let c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else if (from === 'k') c = value - 273.15;
    else return NaN;
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    if (to === 'k') return c + 273.15;
    return NaN;
  }
  function activeType(){
    const typeSelect = id('unitTypeSelect');
    const hidden = id('unitType');
    return (typeSelect && typeSelect.value) || (hidden && hidden.value) || 'length';
  }
  function calculate(){
    const type = activeType();
    const valueInput = id('unitValue');
    const raw = valueInput ? String(valueInput.value || '').replace(/,/g,'').trim() : '';
    const value = Number(raw);
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';

    if (!raw || !Number.isFinite(value)) {
      setOutput('Enter value', '');
      return NaN;
    }

    let result = NaN;
    if (type === 'temperature') {
      result = convertTemp(value, from, to);
    } else {
      if (dimension[type] && dimension[type][from] && dimension[type][to] && dimension[type][from] !== dimension[type][to]) {
        setOutput('Choose matching units', 'Energy and power cannot be directly converted.');
        return NaN;
      }
      const set = factors[type] || {};
      if (Number.isFinite(set[from]) && Number.isFinite(set[to]) && set[to] !== 0) {
        result = value * set[from] / set[to];
      }
    }

    if (!Number.isFinite(result)) {
      setOutput('Unsupported unit', '');
      return NaN;
    }

    setOutput(formatNumber(result) + ' ' + labelFor(type, to), formatNumber(value) + ' ' + labelFor(type, from) + ' → ' + labelFor(type, to));
    return result;
  }
  function setType(type){
    type = unitSets[type] ? type : 'length';
    const hidden = id('unitType');
    const typeSelect = id('unitTypeSelect');
    const pair = defaults[type] || defaults.length;

    if (hidden) hidden.value = type;
    if (typeSelect) typeSelect.value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
    calculate();
  }
  function init(){
    const typeSelect = id('unitTypeSelect');
    if (typeSelect) {
      typeSelect.addEventListener('change', function(){ setType(typeSelect.value); });
    }
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (!el) return;
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
      el.addEventListener('keyup', calculate);
    });

    window.calculateUnitConverterExtra = calculate;
    setType(activeType());
    calculate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ===== Unit Converter live currency rate override ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']],
    currency: [['USD','USD'], ['MYR','MYR'], ['SGD','SGD'], ['EUR','EUR'], ['GBP','GBP'], ['JPY','JPY'], ['AUD','AUD'], ['CAD','CAD'], ['CHF','CHF'], ['CNY','CNY'], ['THB','THB'], ['IDR','IDR']],
    data: [['b','Byte'], ['kb','Kilobyte'], ['mb','Megabyte'], ['gb','Gigabyte'], ['tb','Terabyte'], ['kib','Kibibyte'], ['mib','Mebibyte'], ['gib','Gibibyte']],
    time: [['s','Second'], ['min','Minute'], ['h','Hour'], ['day','Day'], ['week','Week'], ['month','Month'], ['year','Year']],
    energyPower: [['j','Joule'], ['kj','Kilojoule'], ['cal','Calorie'], ['kcal','Kilocalorie'], ['wh','Watt-hour'], ['kwh','Kilowatt-hour'], ['w','Watt'], ['kw','Kilowatt'], ['hp','Horsepower']]
  };

  const factors = {
    length: {m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254},
    weight: {kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, tonne:1000},
    area: {m2:1, km2:1000000, cm2:0.0001, ft2:0.09290304, in2:0.00064516, acre:4046.8564224, hectare:10000},
    volume: {l:1, ml:0.001, m3:1000, cm3:0.001, gallon:3.785411784, cup:0.2365882365, pint:0.473176473},
    speed: {mps:1, kmh:0.2777777778, mph:0.44704, knot:0.5144444444, fps:0.3048},
    data: {b:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824},
    time: {s:1, min:60, h:3600, day:86400, week:604800, month:2629746, year:31556952},
    energyPower: {j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, w:1, kw:1000, hp:745.699872}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'], area:['m2','ft2'],
    volume:['l','gallon'], speed:['kmh','mph'], currency:['USD','MYR'],
    data:['mb','gb'], time:['h','min'], energyPower:['j','kj']
  };

  const dimension = {
    energyPower: {j:'energy', kj:'energy', cal:'energy', kcal:'energy', wh:'energy', kwh:'energy', w:'power', kw:'power', hp:'power'}
  };

  const rateCache = new Map();
  let currencyRequestToken = 0;

  function id(name){ return document.getElementById(name); }
  function labelFor(type, value){
    const found = (unitSets[type] || []).find(function(item){ return item[0] === value; });
    return found ? found[1] : value;
  }
  function fillSelect(select, items, selected){
    if (!select) return;
    select.innerHTML = '';
    items.forEach(function(item){
      const option = document.createElement('option');
      option.value = item[0];
      option.textContent = item[1];
      if (item[0] === selected) option.selected = true;
      select.appendChild(option);
    });
  }
  function formatNumber(value){
    if (!Number.isFinite(value)) return '-';
    if ((Math.abs(value) >= 100000000 || (Math.abs(value) < 0.000001 && value !== 0))) return Number(value).toExponential(6);
    return Number(value.toPrecision(12)).toLocaleString('en-MY', { maximumFractionDigits: 8 });
  }
  function setOutput(main, detail){
    const result = id('unitInlineResult');
    const detailEl = id('unitInlineDetail');
    if (result) result.textContent = main || 'Enter value';
    if (detailEl) detailEl.textContent = detail || '';
  }
  function convertTemp(value, from, to){
    let c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else if (from === 'k') c = value - 273.15;
    else return NaN;
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    if (to === 'k') return c + 273.15;
    return NaN;
  }
  function activeType(){
    const typeSelect = id('unitTypeSelect');
    const hidden = id('unitType');
    return (typeSelect && typeSelect.value) || (hidden && hidden.value) || 'length';
  }
  function getValue(){
    const valueInput = id('unitValue');
    const raw = valueInput ? String(valueInput.value || '').replace(/,/g,'').trim() : '';
    return { raw: raw, value: Number(raw) };
  }
  function getCurrencyCacheKey(from, to){ return String(from).toUpperCase() + '_' + String(to).toUpperCase(); }
  async function getLiveRate(from, to){
    from = String(from || '').toUpperCase();
    to = String(to || '').toUpperCase();
    if (from === to) return { rate: 1, date: 'same currency' };

    const key = getCurrencyCacheKey(from, to);
    const cached = rateCache.get(key);
    if (cached && Date.now() - cached.savedAt < 30 * 60 * 1000) return cached;

    const storedRaw = sessionStorage.getItem('unitCurrencyRate_' + key);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        if (stored && Date.now() - stored.savedAt < 30 * 60 * 1000) {
          rateCache.set(key, stored);
          return stored;
        }
      } catch (e) {}
    }

    const url = 'https://api.frankfurter.dev/v1/latest?base=' + encodeURIComponent(from) + '&symbols=' + encodeURIComponent(to);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Exchange rate request failed');
    const data = await response.json();
    const rate = data && data.rates ? Number(data.rates[to]) : NaN;
    if (!Number.isFinite(rate)) throw new Error('Exchange rate unavailable');

    const payload = { rate: rate, date: data.date || 'latest', savedAt: Date.now() };
    rateCache.set(key, payload);
    try { sessionStorage.setItem('unitCurrencyRate_' + key, JSON.stringify(payload)); } catch (e) {}
    return payload;
  }
  function calculateNormal(type, value, from, to){
    if (type === 'temperature') return convertTemp(value, from, to);
    if (dimension[type] && dimension[type][from] && dimension[type][to] && dimension[type][from] !== dimension[type][to]) {
      setOutput('Choose matching units', 'Energy and power cannot be directly converted.');
      return NaN;
    }
    const set = factors[type] || {};
    if (Number.isFinite(set[from]) && Number.isFinite(set[to]) && set[to] !== 0) return value * set[from] / set[to];
    return NaN;
  }
  async function calculate(){
    const type = activeType();
    const val = getValue();
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';
    if (!val.raw || !Number.isFinite(val.value)) {
      setOutput('Enter value', '');
      return NaN;
    }

    if (type === 'currency') {
      const token = ++currencyRequestToken;
      setOutput('Loading live rate...', String(from).toUpperCase() + ' → ' + String(to).toUpperCase());
      try {
        const live = await getLiveRate(from, to);
        if (token !== currencyRequestToken) return NaN;
        const result = val.value * live.rate;
        setOutput(formatNumber(result) + ' ' + String(to).toUpperCase(), 'Live rate: 1 ' + String(from).toUpperCase() + ' = ' + formatNumber(live.rate) + ' ' + String(to).toUpperCase() + ' · ' + live.date);
        return result;
      } catch (error) {
        if (token !== currencyRequestToken) return NaN;
        setOutput('Live rate unavailable', 'Check your internet connection or choose another currency.');
        return NaN;
      }
    }

    currencyRequestToken++;
    const result = calculateNormal(type, val.value, from, to);
    if (!Number.isFinite(result)) {
      if (type !== 'energyPower') setOutput('Unsupported unit', '');
      return NaN;
    }
    setOutput(formatNumber(result) + ' ' + labelFor(type, to), formatNumber(val.value) + ' ' + labelFor(type, from) + ' → ' + labelFor(type, to));
    return result;
  }
  function setType(type){
    type = unitSets[type] ? type : 'length';
    const hidden = id('unitType');
    const typeSelect = id('unitTypeSelect');
    const pair = defaults[type] || defaults.length;
    if (hidden) hidden.value = type;
    if (typeSelect) typeSelect.value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
    calculate();
  }
  function init(){
    const typeSelect = id('unitTypeSelect');
    if (typeSelect) typeSelect.addEventListener('change', function(){ setType(typeSelect.value); });
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (!el) return;
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
      el.addEventListener('keyup', calculate);
    });
    window.calculateUnitConverterExtra = calculate;
    window.setUnitConverterType = setType;
    setType(activeType());
    calculate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* Unit Converter copy result button */
(function(){
  'use strict';
  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function(){
    if (!document.body || document.body.dataset.page !== 'unitConverter') return;
    var btn = document.getElementById('unitCopyResultBtn');
    var result = document.getElementById('unitInlineResult');
    var detail = document.getElementById('unitInlineDetail');
    if (!btn || !result) return;

    function getText(){
      var main = (result.textContent || '').trim();
      var sub = detail ? (detail.textContent || '').trim() : '';
      if (!main || /^enter value$/i.test(main) || /^-$/i.test(main)) return '';
      return sub ? main + ' — ' + sub : main;
    }

    function syncButton(){
      btn.disabled = !getText();
    }

    btn.addEventListener('click', function(){
      var text = getText();
      if (!text) return;
      function done(){
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function(){ btn.textContent = old || 'Copy result'; }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function(){
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.left = '-9999px';
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); done(); } catch(e) {}
          area.remove();
        });
      } else {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); done(); } catch(e) {}
        area.remove();
      }
    });

    syncButton();
    if (window.MutationObserver) {
      new MutationObserver(syncButton).observe(result, {childList:true, characterData:true, subtree:true});
      if (detail) new MutationObserver(syncButton).observe(detail, {childList:true, characterData:true, subtree:true});
    }
    document.addEventListener('input', syncButton, true);
    document.addEventListener('change', syncButton, true);
    setTimeout(syncButton, 500);
  });
})();


/* Basic Calculator copy result button */
(function(){
  'use strict';
  function initBasicCopyButton(){
    if (!document.body || document.body.dataset.page !== 'basic') return;
    var btn = document.getElementById('basicCopyBtn');
    var display = document.getElementById('display');
    if (!btn || !display || btn.dataset.copyReady === '1') return;
    btn.dataset.copyReady = '1';
    btn.addEventListener('click', function(){
      var text = String(display.value || '').trim();
      if (!text || text === 'Error') return;
      function done(){
        var oldText = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function(){ btn.textContent = oldText || 'Copy result'; }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function(){
          var temp = document.createElement('textarea');
          temp.value = text;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          done();
        });
      } else {
        var temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
        done();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBasicCopyButton);
  else initBasicCopyButton();
})();

/* Sync Unit Converter instruction box width to calculator box */
(function(){
  'use strict';
  function syncUnitInstructionWidth(){
    if (!document.body || document.body.dataset.page !== 'unitConverter') return;
    var main = document.querySelector('main');
    var calc = main && main.querySelector(':scope > .calculator.extra-calculator-box');
    var instruction = main && main.querySelector(':scope > .instruction-box.universal-help-panel');
    if (!calc || !instruction) return;
    if (window.innerWidth < 851) {
      instruction.style.width = '';
      instruction.style.maxWidth = '';
      return;
    }
    var width = Math.round(calc.getBoundingClientRect().width);
    if (width > 0) {
      instruction.style.width = width + 'px';
      instruction.style.maxWidth = width + 'px';
      instruction.style.justifySelf = 'start';
      instruction.style.boxSizing = 'border-box';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncUnitInstructionWidth);
  else syncUnitInstructionWidth();
  window.addEventListener('resize', syncUnitInstructionWidth);
  setTimeout(syncUnitInstructionWidth, 100);
  setTimeout(syncUnitInstructionWidth, 500);
  setTimeout(syncUnitInstructionWidth, 1200);
})();


/* Unit Converter: exact-match instruction box width to calculator box */
(function () {
  'use strict';

  function syncUnitConverterInstructionWidth() {
    if (!document.body || document.body.dataset.page !== 'unitConverter') return;

    var main = document.querySelector('main.loan-calculator-container.extra-calculator-container.extra-calculator-layout.extra-help-layout.tool-layout');
    var calculator = main && main.querySelector(':scope > .calculator.extra-calculator-box');
    var instruction = main && main.querySelector(':scope > .instruction-box.universal-help-panel');

    if (!main || !calculator || !instruction) return;

    var width = Math.round(calculator.getBoundingClientRect().width);
    if (width > 0) {
      document.documentElement.style.setProperty('--unit-converter-box-width', width + 'px');
      instruction.style.setProperty('width', width + 'px', 'important');
      instruction.style.setProperty('max-width', width + 'px', 'important');
      instruction.style.setProperty('min-width', '0', 'important');
      instruction.style.setProperty('box-sizing', 'border-box', 'important');

      instruction.querySelectorAll('.instruction-section, .instruction-what-box, .reference-box, .reference-scroll').forEach(function (el) {
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('max-width', '100%', 'important');
        el.style.setProperty('box-sizing', 'border-box', 'important');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncUnitConverterInstructionWidth);
  } else {
    syncUnitConverterInstructionWidth();
  }

  window.addEventListener('resize', syncUnitConverterInstructionWidth);
  setTimeout(syncUnitConverterInstructionWidth, 100);
  setTimeout(syncUnitConverterInstructionWidth, 500);
})();



/* ===== Age Calculator single clean script: no duplicate render ===== */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'age') return;

  function $(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
    });
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(value, endOfDay) {
    if (!value) return null;
    var parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (n) { return !Number.isFinite(n); })) return null;
    return new Date(parts[0], parts[1] - 1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  }
  function formatDMY(value) {
    var p = String(value || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : value;
  }
  function breakdown(start, end) {
    if (!start || !end || end < start) return null;
    var y = end.getFullYear() - start.getFullYear();
    var m = end.getMonth() - start.getMonth();
    var d = end.getDate() - start.getDate();
    if (d < 0) {
      m -= 1;
      d += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y -= 1;
      m += 12;
    }
    return { years: y, months: m, days: d };
  }
  function zodiac(month, day) {
    var signs = [['Capricorn',1,19],['Aquarius',2,18],['Pisces',3,20],['Aries',4,19],['Taurus',5,20],['Gemini',6,20],['Cancer',7,22],['Leo',8,22],['Virgo',9,22],['Libra',10,22],['Scorpio',11,21],['Sagittarius',12,21]];
    for (var i = 0; i < signs.length; i++) {
      if (month < signs[i][1] || (month === signs[i][1] && day <= signs[i][2])) return signs[i][0];
    }
    return 'Capricorn';
  }
  function chinese(year) {
    var animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
    var index = (year - 1900) % 12;
    if (index < 0) index += 12;
    return animals[index];
  }
  function nextBirthdayDays(birth, target) {
    var base = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    var next = new Date(base.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < base) next = new Date(base.getFullYear() + 1, birth.getMonth(), birth.getDate());
    return Math.max(0, Math.ceil((next.getTime() - base.getTime()) / 86400000));
  }
  function row(label, value) {
    return '<li class="age-final-result-row"><strong>' + esc(label) + '</strong><span>' + esc(value) + '</span></li>';
  }
  function group(title, rows) {
    return '<section class="age-final-group-box"><h3>' + esc(title) + '</h3><ul class="age-final-result-list">' + rows.join('') + '</ul></section>';
  }
  function removeDuplicateAgePanels() {
    var main = document.querySelector('main.age-calculator-container');
    var calc = main && main.querySelector(':scope > .calculator');
    if (!main || !calc) return null;
    var panels = Array.from(document.querySelectorAll('#ageReportOutput'));
    var keeper = panels.find(function (panel) { return panel.parentElement === main; }) || panels[0] || null;
    if (!keeper) {
      keeper = document.createElement('section');
      keeper.id = 'ageReportOutput';
      keeper.className = 'age-clean-result age-point-output age-final-output';
      keeper.setAttribute('aria-label', 'Age Calculator result');
      keeper.hidden = true;
    }
    panels.forEach(function (panel) {
      if (panel !== keeper) panel.remove();
    });
    if (keeper.parentElement !== main) calc.insertAdjacentElement('afterend', keeper);
    else if (keeper.previousElementSibling !== calc) calc.insertAdjacentElement('afterend', keeper);
    keeper.className = 'age-clean-result age-point-output age-final-output';
    keeper.setAttribute('aria-label', 'Age Calculator result');
    return keeper;
  }
  function hidePanel() {
    var panel = removeDuplicateAgePanels();
    if (!panel) return;
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = '';
  }
  function showPanel(html) {
    var panel = removeDuplicateAgePanels();
    if (!panel) return;
    panel.innerHTML = html;
    panel.hidden = false;
    panel.removeAttribute('aria-hidden');
  }
  function calculateAgeClean() {
    removeDuplicateAgePanels();
    var nameInput = $('ageName');
    var birthInput = $('birthdate');
    var targetInput = $('dateToCalculate');
    if (targetInput && !targetInput.value) targetInput.value = todayISO();
    if (!birthInput || !birthInput.value) { hidePanel(); return; }

    var targetValue = targetInput && targetInput.value ? targetInput.value : todayISO();
    var birth = parseISO(birthInput.value, false);
    var target = parseISO(targetValue, true);
    if (!birth || !target || birth > target) {
      showPanel('<div class="age-final-error">Please choose a valid birth date before the calculation date.</div>');
      return;
    }

    var exact = breakdown(birth, target);
    if (!exact) { hidePanel(); return; }
    var totalDays = Math.floor((target.getTime() - birth.getTime()) / 86400000);
    var totalSeconds = Math.floor((target.getTime() - birth.getTime()) / 1000);
    var totalMonths = exact.years * 12 + exact.months;
    var totalWeeks = Math.floor(totalDays / 7);
    var birthdayDays = nextBirthdayDays(birth, target);
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '-';
    var asianAge = target.getFullYear() - birth.getFullYear() + 1;

    var html = '<div class="age-final-result-shell"><div class="age-final-result-grid">' +
      group('Birth & calendar', [
        row('Name', name),
        row('Date range', formatDMY(birthInput.value) + ' to ' + formatDMY(targetValue)),
        row('Day of week born', birth.toLocaleDateString('en-US', { weekday: 'long' }))
      ]) +
      group('Current age', [
        row('Exact age', exact.years + ' years, ' + exact.months + ' months, ' + exact.days + ' days'),
        row('Normal age', exact.years + ' years old'),
        row('Asian age', asianAge + ' years old')
      ]) +
      group('Total time lived', [
        row('Months old', totalMonths.toLocaleString()),
        row('Weeks old', totalWeeks.toLocaleString()),
        row('Days old', totalDays.toLocaleString()),
        row('Seconds old', totalSeconds.toLocaleString())
      ]) +
      group('Birthday & milestones', [
        row('Next birthday countdown', birthdayDays + ' day' + (birthdayDays === 1 ? '' : 's')),
        row('Legal age', exact.years >= 18 ? 'Legal adult age reached' : (18 - exact.years) + ' years before legal adult age'),
        row('Retirement', exact.years >= 60 ? 'Retirement age reached' : (60 - exact.years) + ' years before retirement')
      ]) +
      group('Life summary', [
        row('Estimated sleep time', Math.floor(totalDays / 3).toLocaleString() + ' days'),
        row('Estimated breaths', Math.round(totalSeconds / 60 * 16).toLocaleString()),
        row('Estimated heartbeats', Math.round(totalSeconds / 60 * 70).toLocaleString())
      ]) +
      group('Zodiac', [
        row('Western zodiac', zodiac(birth.getMonth() + 1, birth.getDate())),
        row('Chinese zodiac', chinese(birth.getFullYear()))
      ]) +
      '</div></div>';
    showPanel(html);
  }
  function cleanAgeInputs() {
    var main = document.querySelector('main.age-calculator-container');
    var calc = main && main.querySelector(':scope > .calculator');
    if (!calc) return;

    Array.from(calc.querySelectorAll('.age-input-layout')).forEach(function (box, index) {
      if (index > 0) box.remove();
    });
    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (inputId) {
      var matches = Array.from(document.querySelectorAll('#' + inputId));
      matches.forEach(function (el, index) {
        if (index > 0) el.closest('.age-field, .age-input-box') ? el.closest('.age-field, .age-input-box').remove() : el.remove();
      });
    });
    removeDuplicateAgePanels();
  }
  function bind() {
    cleanAgeInputs();
    var target = $('dateToCalculate');
    if (target && !target.value) target.value = todayISO();
    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (inputId) {
      var el = $(inputId);
      if (!el) return;
      el.addEventListener('input', calculateAgeClean);
      el.addEventListener('change', calculateAgeClean);
    });
    var button = $('ageCalculateBtn');
    if (button) button.addEventListener('click', function (ev) { ev.preventDefault(); calculateAgeClean(); });
    window.calculateAge = calculateAgeClean;
    window.calculateAgeStandalone = calculateAgeClean;
    calculateAgeClean();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

<<<<<<< HEAD

/* ===== AGE CALCULATOR SIZE-ONLY WIDTH SYNC 20260531-C ===== */
(function () {
  'use strict';

  function setImportant(el, prop, value) {
    if (el && el.style) el.style.setProperty(prop, value, 'important');
  }

  function syncAgeWidthOnly() {
    if (!document.body || document.body.dataset.page !== 'age') return;
=======
/* ===== AGE CALCULATOR FINAL WIDTH + GROUP CARD FIX 20260531-B ===== */
(function () {
  'use strict';

  function isAgePage() {
    return !!document.body && document.body.dataset.page === 'age';
  }

  function important(el, prop, value) {
    if (el && el.style) el.style.setProperty(prop, value, 'important');
  }

  function applyGroupCardStyles(result) {
    if (!result) return;

    result.querySelectorAll('.age-result-group-grid, .age-final-result-grid, .age-result-clean-box').forEach(function (grid) {
      important(grid, 'display', 'grid');
      important(grid, 'grid-template-columns', window.innerWidth <= 1050 ? '1fr' : 'repeat(2, minmax(0, 1fr))');
      important(grid, 'gap', '18px');
      important(grid, 'width', '100%');
      important(grid, 'max-width', '100%');
      important(grid, 'min-width', '0');
      important(grid, 'box-sizing', 'border-box');
    });

    result.querySelectorAll('.age-point-result-box, .age-final-result-shell, .age-result-clean-box').forEach(function (shell) {
      important(shell, 'width', '100%');
      important(shell, 'max-width', '100%');
      important(shell, 'min-width', '0');
      important(shell, 'margin', '0');
      important(shell, 'padding', '0');
      important(shell, 'border', '0');
      important(shell, 'background', 'transparent');
      important(shell, 'box-shadow', 'none');
      important(shell, 'box-sizing', 'border-box');
    });

    result.querySelectorAll('.age-result-group-box, .age-final-group-box, .age-result-clean-section').forEach(function (box) {
      important(box, 'display', 'block');
      important(box, 'min-width', '0');
      important(box, 'height', 'auto');
      important(box, 'padding', '18px');
      important(box, 'border', '1px solid #d8e8e0');
      important(box, 'border-radius', '20px');
      important(box, 'background', '#ffffff');
      important(box, 'box-shadow', '0 8px 20px rgba(38, 58, 51, .065)');
      important(box, 'box-sizing', 'border-box');
      important(box, 'overflow', 'hidden');
    });

    result.querySelectorAll('.age-point-result-list li, .age-final-result-row, .age-result-clean-section li').forEach(function (row) {
      important(row, 'display', 'grid');
      important(row, 'grid-template-columns', window.innerWidth <= 850 ? '1fr' : 'minmax(135px, .42fr) minmax(0, 1fr)');
      important(row, 'gap', window.innerWidth <= 850 ? '4px' : '12px');
      important(row, 'align-items', 'start');
      important(row, 'padding', '10px 0');
      important(row, 'border', '0');
      important(row, 'border-bottom', '1px solid #edf4f1');
      important(row, 'border-radius', '0');
      important(row, 'background', 'transparent');
      important(row, 'box-shadow', 'none');
      important(row, 'box-sizing', 'border-box');
    });
  }

  function syncAgeResultWidth() {
    if (!isAgePage()) return;
>>>>>>> 123113dfc3e81f966cc77132ba18a29f0148c488

    var main = document.querySelector('main.age-calculator-container');
    var calculator = main && main.querySelector(':scope > .calculator');
    var result = document.getElementById('ageReportOutput');
<<<<<<< HEAD
    if (!main || !calculator || !result) return;

    var calcRect = calculator.getBoundingClientRect();
    var width = Math.round(calcRect.width || calculator.offsetWidth || 0);

    if (window.innerWidth > 850 && width > 0) {
      document.documentElement.style.setProperty('--age-calculator-real-width', width + 'px');
      setImportant(result, 'width', width + 'px');
      setImportant(result, 'max-width', width + 'px');
      setImportant(result, 'justify-self', 'start');
    } else {
      document.documentElement.style.setProperty('--age-calculator-real-width', '100%');
      setImportant(result, 'width', '100%');
      setImportant(result, 'max-width', '100%');
      setImportant(result, 'justify-self', 'stretch');
    }

    setImportant(result, 'min-width', '0');
    setImportant(result, 'box-sizing', 'border-box');

    if (result.parentElement === main) {
      var calcStyle = window.getComputedStyle(calculator);
      var start = calcStyle.gridColumnStart;
      var end = calcStyle.gridColumnEnd;
      if (start && start !== 'auto') setImportant(result, 'grid-column-start', start);
      if (end && end !== 'auto') setImportant(result, 'grid-column-end', end);
      setImportant(result, 'grid-row', window.innerWidth > 850 ? '2' : 'auto');
    }

    result.querySelectorAll('.age-result-group-grid, .age-final-result-grid, .age-result-clean-box').forEach(function (grid) {
      setImportant(grid, 'display', 'grid');
      setImportant(grid, 'grid-template-columns', window.innerWidth <= 1050 ? '1fr' : 'repeat(2, minmax(0, 1fr))');
      setImportant(grid, 'gap', '18px');
      setImportant(grid, 'width', '100%');
      setImportant(grid, 'max-width', '100%');
      setImportant(grid, 'box-sizing', 'border-box');
    });

    result.querySelectorAll('.age-result-group-box, .age-final-group-box, .age-result-clean-section').forEach(function (box) {
      setImportant(box, 'display', 'block');
      setImportant(box, 'padding', '18px');
      setImportant(box, 'border', '1.5px solid #c9ded5');
      setImportant(box, 'border-radius', '20px');
      setImportant(box, 'background', '#fbfefd');
      setImportant(box, 'box-shadow', '0 8px 22px rgba(38, 58, 51, .085)');
      setImportant(box, 'box-sizing', 'border-box');
      setImportant(box, 'overflow', 'hidden');
    });

    result.querySelectorAll('.age-point-result-list li, .age-final-result-row, .age-result-clean-section li').forEach(function (row) {
      setImportant(row, 'display', 'grid');
      setImportant(row, 'grid-template-columns', window.innerWidth <= 850 ? '1fr' : 'minmax(135px, .42fr) minmax(0, 1fr)');
      setImportant(row, 'gap', window.innerWidth <= 850 ? '4px' : '12px');
      setImportant(row, 'padding', '10px 0');
      setImportant(row, 'border', '0');
      setImportant(row, 'border-bottom', '1px solid #edf4f1');
      setImportant(row, 'border-radius', '0');
      setImportant(row, 'background', 'transparent');
      setImportant(row, 'box-shadow', 'none');
      setImportant(row, 'box-sizing', 'border-box');
    });
  }

  function queueAgeWidthOnly() {
    syncAgeWidthOnly();
    if (window.requestAnimationFrame) window.requestAnimationFrame(syncAgeWidthOnly);
    [80, 220, 500, 1000, 2000, 3500].forEach(function (delay) {
      setTimeout(syncAgeWidthOnly, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queueAgeWidthOnly);
  } else {
    queueAgeWidthOnly();
  }

  window.addEventListener('load', queueAgeWidthOnly);
  window.addEventListener('resize', queueAgeWidthOnly);

  ['input', 'change', 'click'].forEach(function (name) {
    document.addEventListener(name, function (event) {
      var target = event.target;
      if (!target) return;
      if (target.closest && (target.closest('main.age-calculator-container') || target.closest('#ageReportOutput'))) {
        queueAgeWidthOnly();
      }
    }, true);
  });

  if (window.MutationObserver && document.body) {
    new MutationObserver(function (mutations) {
      var shouldSync = false;
      mutations.forEach(function (mutation) {
        if (shouldSync) return;
        if (mutation.target && (mutation.target.id === 'ageReportOutput' || mutation.target.closest && mutation.target.closest('#ageReportOutput'))) shouldSync = true;
        Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
          if (node && node.nodeType === 1 && (node.id === 'ageReportOutput' || node.querySelector && node.querySelector('#ageReportOutput, .age-result-group-box, .age-final-group-box, .age-result-clean-section'))) {
            shouldSync = true;
          }
        });
      });
      if (shouldSync) queueAgeWidthOnly();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  }
})();
=======
    var instruction = main && main.querySelector(':scope > .instruction-box, :scope > .universal-help-panel');

    if (!main || !calculator || !result) return;

    if (result.parentElement !== main || result.previousElementSibling !== calculator) {
      calculator.insertAdjacentElement('afterend', result);
    }
    if (instruction && instruction.previousElementSibling !== result) {
      result.insertAdjacentElement('afterend', instruction);
    }

    result.classList.add('age-clean-result', 'age-point-output', 'age-final-output');
    result.setAttribute('aria-label', 'Age Calculator result');

    important(calculator, 'grid-column', window.innerWidth <= 850 ? '1' : '2');
    important(calculator, 'grid-row', window.innerWidth <= 850 ? 'auto' : '1');
    important(calculator, 'justify-self', window.innerWidth <= 850 ? 'stretch' : 'start');
    important(calculator, 'box-sizing', 'border-box');

    var width = Math.round(calculator.getBoundingClientRect().width);
    if (!width || width < 260) {
      width = Math.round((calculator.offsetWidth || 0));
    }

    if (window.innerWidth > 850 && width > 0) {
      document.documentElement.style.setProperty('--age-final-calc-width', width + 'px');
      important(result, 'width', width + 'px');
      important(result, 'max-width', width + 'px');
      important(result, 'justify-self', 'start');
      if (instruction) {
        important(instruction, 'width', width + 'px');
        important(instruction, 'max-width', width + 'px');
        important(instruction, 'justify-self', 'start');
      }
    } else {
      document.documentElement.style.setProperty('--age-final-calc-width', '100%');
      important(result, 'width', '100%');
      important(result, 'max-width', '100%');
      important(result, 'justify-self', 'stretch');
      if (instruction) {
        important(instruction, 'width', '100%');
        important(instruction, 'max-width', '100%');
        important(instruction, 'justify-self', 'stretch');
      }
    }

    important(result, 'grid-column', window.innerWidth <= 850 ? '1' : '2');
    important(result, 'grid-row', window.innerWidth <= 850 ? 'auto' : '2');
    important(result, 'min-width', '0');
    important(result, 'box-sizing', 'border-box');
    important(result, 'overflow', 'visible');

    if (!result.hidden && result.innerHTML.trim()) {
      important(result, 'display', 'block');
      important(result, 'visibility', 'visible');
      important(result, 'opacity', '1');
      important(result, 'height', 'auto');
      important(result, 'max-height', 'none');
      important(result, 'margin', '22px 0 0');
      important(result, 'padding', 'clamp(18px, 2.2vw, 28px)');
      important(result, 'border', '1px solid #d7e6df');
      important(result, 'border-radius', '22px');
      important(result, 'background', '#ffffff');
      important(result, 'box-shadow', '0 12px 28px rgba(38, 58, 51, .07)');
    }

    if (instruction) {
      important(instruction, 'grid-column', window.innerWidth <= 850 ? '1' : '2');
      important(instruction, 'grid-row', window.innerWidth <= 850 ? 'auto' : '3');
      important(instruction, 'box-sizing', 'border-box');
    }

    applyGroupCardStyles(result);
  }

  function queueAgeResultFix() {
    syncAgeResultWidth();
    if (window.requestAnimationFrame) requestAnimationFrame(syncAgeResultWidth);
    [60, 160, 350, 800, 1500, 2600, 4200].forEach(function (delay) {
      setTimeout(syncAgeResultWidth, delay);
    });
  }

  function startAgeResultFinalFix() {
    queueAgeResultFix();

    ['input', 'change', 'click'].forEach(function (eventName) {
      document.addEventListener(eventName, function (event) {
        var target = event.target;
        if (!target) return;
        if (target.id === 'ageName' || target.id === 'birthdate' || target.id === 'dateToCalculate' || target.id === 'ageCalculateBtn' || target.closest && target.closest('#ageReportOutput')) {
          queueAgeResultFix();
        }
      }, true);
    });

    window.addEventListener('resize', queueAgeResultFix);
    window.addEventListener('load', queueAgeResultFix);

    if (window.MutationObserver && document.body) {
      new MutationObserver(function (mutations) {
        var shouldRun = false;
        mutations.forEach(function (mutation) {
          if (shouldRun) return;
          if (mutation.target && mutation.target.id === 'ageReportOutput') shouldRun = true;
          Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
            if (node && node.nodeType === 1 && (node.id === 'ageReportOutput' || (node.matches && node.matches('.age-result-group-box, .age-final-group-box, .age-point-result-box, .age-final-result-shell')) || (node.querySelector && node.querySelector('#ageReportOutput, .age-result-group-box, .age-final-group-box')))) {
              shouldRun = true;
            }
          });
        });
        if (shouldRun) queueAgeResultFix();
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAgeResultFinalFix);
  } else {
    startAgeResultFinalFix();
  }
})();

=======
!function(){"use strict";const REPORT_TYPES=["age","bmi","loan","personalLoan","discount","percentage","compound"];let autoTimer=null,autoRunning=!1;function $(selector,root){return(root||document).querySelector(selector)}function $$(selector,root){return Array.from((root||document).querySelectorAll(selector))}function byId(id){return document.getElementById(id)}function has(id){return!!byId(id)}function cleanText(value){return String(value||"").replace(/\s+/g," ").trim()}function lower(value){return cleanText(value).toLowerCase()}function pathText(){return lower(window.location.pathname)}function safeGet(key,fallback){try{const value=localStorage.getItem(key);return null===value?fallback:value}catch{return fallback}}function safeSet(key,value){try{localStorage.setItem(key,value)}catch{}}function safeRemove(key){try{localStorage.removeItem(key)}catch{}}function loadArray(key){try{const value=JSON.parse(safeGet(key,"[]"));return Array.isArray(value)?value:[]}catch{return[]}}function saveArray(key,value){safeSet(key,JSON.stringify(value.slice(-50)))}function numberFromString(value){const number=Number(String(value||"").replace(/,/g,"").trim());return Number.isFinite(number)?number:NaN}function numberValue(id){const input=byId(id);return input?numberFromString(input.value):NaN}function stringValue(id){const input=byId(id);return input?String(input.value||"").trim():""}function firstInput(ids){for(const id of ids){const input=byId(id);if(input)return input}return null}function firstValue(ids){for(const id of ids){const value=stringValue(id);if(value)return value}return""}function firstNumber(ids){for(const id of ids){const value=numberValue(id);if(Number.isFinite(value))return value}return NaN}function money(value){return Number(value).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}function moneyRM(value){const number=numberFromString(value);return Number.isFinite(number)?"RM "+money(number):value||"-"}function escapeHtml(value){return String(value||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}function getPageType(){const title=function(){const h1=$("h1");return lower(h1?h1.textContent:"")}(),path=pathText();return has("display")||$(".basic-grid")||$(".scientific-grid")||path.includes("basic-calculator")||/^basic\b/.test(title)?"basic":path.includes("bmi")||has("bmiHistoryList")||/\bbmi\b/.test(title)?"bmi":path.includes("personal-loan")||has("personalLoanHistoryList")||has("personalLoanResult")||/\bpersonal\s+loan\b/.test(title)?"personalLoan":path.includes("loan")||path.includes("mortgage")||has("loanHistoryList")||has("loanResult")||/\bmortgage\b|\bloan\b/.test(title)?"loan":path.includes("discount")||has("discountHistoryList")||/\bdiscount\b/.test(title)?"discount":path.includes("percentage")||has("percentageHistoryList")||/\bpercentage\b/.test(title)?"percentage":path.includes("compound")||has("compoundHistoryList")||/\bcompound\b/.test(title)?"compound":path.includes("age-calculator")||has("birthdate")||has("ageHistoryList")||/^age\b|\bage calculator\b/.test(title)?"age":""}function isReportType(type){return REPORT_TYPES.includes(type)}let basicHistory=loadArray("basicEquationHistory"),basicCalculationHistory=loadArray("basicCalculationHistory"),lastAnswer=Number(safeGet("lastAnswer","0"))||0,lastBasicEquation="";function getDisplay(){return byId("display")}function clearError(display){display&&"Error"===display.value&&(display.value="")}function add(value){const display=getDisplay();if(!display)return;clearError(display);const operators=["+","-","*","/"],lastChar=display.value.slice(-1);"Ans"!==value?"%"!==value?!operators.includes(value)||!operators.includes(lastChar)||"-"===value&&"-"!==lastChar?display.value+=value:display.value=display.value.slice(0,-1)+value:display.value+="/100":display.value+=String(lastAnswer)}function clearDisplay(){const display=getDisplay();display&&(display.value="")}function removeLast(){const display=getDisplay();display&&("Error"!==display.value?display.value=display.value.slice(0,-1):display.value="")}const functionMap={sin:"Math.sin(",cos:"Math.cos(",tan:"Math.tan(",log:"Math.log10(",ln:"Math.log(",sqrt:"√("};function addFunction(func){const display=getDisplay();if(!display)return;clearError(display);const functionText=functionMap[func];functionText&&(/[0-9.)]$/.test(display.value)?display.value+="*"+functionText:display.value+=functionText)}function addPower(){const display=getDisplay();display&&(clearError(display),display.value+="**")}function closeOpenBrackets(expression){const open=(expression.match(/\(/g)||[]).length,close=(expression.match(/\)/g)||[]).length;return open>close?expression+")".repeat(open-close):expression}function removeBasicExternalResultBox(){const panel=byId("universalLoanStyleOutput");panel&&(panel.hidden=!0,panel.innerHTML="",panel.style.setProperty("display","none","important"),panel.setAttribute("aria-hidden","true"))}function renderBasicInlineResult(expression,answer){if("basic"!==getPageType())return;const box=function(){if("basic"!==getPageType())return null;let box=byId("basicInlineResult");if(box)return box;const calculator=getMainCalculator();if(!calculator)return null;const displayRow=$(".display-row",calculator);return box=document.createElement("div"),box.id="basicInlineResult",box.className="basic-inline-result",box.setAttribute("aria-live","polite"),displayRow?displayRow.insertAdjacentElement("beforebegin",box):calculator.appendChild(box),box}();if(!box)return;basicCalculationHistory=loadArray("basicCalculationHistory");const latest=expression&&answer?{expression:expression,result:answer}:basicCalculationHistory[basicCalculationHistory.length-1]||null;if(!latest||!cleanText(latest.expression)||!cleanText(latest.result))return box.innerHTML='<div class="basic-inline-kicker">Previous calculation</div><div class="basic-inline-empty">Your previous input and answer will appear here after you press =.</div>',box.classList.remove("has-basic-inline-result"),void removeBasicExternalResultBox();box.classList.add("has-basic-inline-result"),box.innerHTML='<div class="basic-inline-header"><span class="basic-inline-kicker">Previous calculation</span></div><div class="basic-inline-grid"><div class="basic-inline-item basic-inline-input-item"><span class="basic-inline-label">Input</span><strong class="basic-inline-expression">'+escapeHtml(latest.expression)+'</strong></div><div class="basic-inline-item basic-inline-output-item"><span class="basic-inline-label">Output</span><strong class="basic-inline-answer">'+escapeHtml(latest.result)+"</strong></div></div>",removeBasicExternalResultBox()}function calculate(){const display=getDisplay();if(display)try{let displayExpression=cleanText(display.value).replace(/Math\.sqrt\s*\(/gi,"√(").replace(/\bsqrt\s*\(/gi,"√(");if(!displayExpression||"Error"===displayExpression)return;display.value!==displayExpression&&(display.value=displayExpression),lastBasicEquation=displayExpression;let expression=displayExpression.replace(/√\s*\(/g,"Math.sqrt(").replace(/(\d)(Math\.)/g,"$1*$2").replace(/\)(Math\.)/g,")*$1");if(expression=closeOpenBrackets(expression),!function(expression){if(!/^[0-9+\-*/().,\sA-Za-z]+$/.test(expression))return!1;const words=expression.match(/[A-Za-z]+/g)||[],allowedWords=new Set(["Math","sin","cos","tan","log","log10","sqrt","PI","E"]);return words.every(function(word){return allowedWords.has(word)})}(expression))return void(display.value="Error");const result=Function('"use strict"; return ('+expression+")")();if("number"!=typeof result||!Number.isFinite(result))return void(display.value="Error");const cleanResult=Number.isInteger(result)?result:Number(result.toPrecision(12));display.value=String(cleanResult),lastAnswer=cleanResult,safeSet("lastAnswer",String(lastAnswer)),function(equation,answer){const value=cleanText(equation),resultValue=cleanText(answer);if(value&&"Error"!==value){if(basicHistory[basicHistory.length-1]!==value&&(basicHistory.push(value),basicHistory=basicHistory.slice(-50),saveArray("basicEquationHistory",basicHistory)),resultValue&&"Error"!==resultValue){const latest=basicCalculationHistory[basicCalculationHistory.length-1]||{};latest.expression===value&&latest.result===resultValue||(basicCalculationHistory.push({expression:value,result:resultValue,createdAt:(new Date).toISOString()}),basicCalculationHistory=basicCalculationHistory.slice(-50),saveArray("basicCalculationHistory",basicCalculationHistory))}renderBasicInlineResult(value,resultValue),showHistory()}}(lastBasicEquation,cleanResult),function(){if("basic"!==getPageType())return;const display=getDisplay(),answer=display?cleanText(display.value):"";if(!answer||"Error"===answer)return void removeBasicExternalResultBox();renderBasicInlineResult(lastBasicEquation,answer),removeBasicExternalResultBox()}()}catch{display.value="Error"}}function showHistory(){const list=byId("historyList");if(!list)return;const title=$(".history h3");title&&(title.textContent="History"),basicHistory=loadArray("basicEquationHistory"),list.innerHTML="",basicHistory.slice().reverse().forEach(function(equation){const li=document.createElement("li");li.className="history-item basic-equation-history-item";const text=document.createElement("span");text.className="history-text",text.textContent="Eq: "+equation;const copyBtn=document.createElement("button");copyBtn.type="button",copyBtn.className="history-copy-btn",copyBtn.textContent="copy",copyBtn.addEventListener("click",function(event){event.stopPropagation(),copyText(equation,copyBtn)}),li.appendChild(text),li.appendChild(copyBtn),list.appendChild(li)})}function flashButton(buttonText){const wanted=String(buttonText).trim().toUpperCase();$$(".buttons button, .ans-btn").forEach(function(button){button.textContent.trim().toUpperCase()===wanted&&(button.classList.add("keyboard-active"),setTimeout(function(){button.classList.remove("keyboard-active")},150))})}function getOutputPanelId(type){return"basic"===type?"universalLoanStyleOutput":"loan"===type?"loanExternalOutput":"personalLoan"===type?"personalLoanExternalOutput":type+"ReportOutput"}function getMainCalculator(){const main=$("main.pc-calculator-layout")||$("main");return main?$(".calculator",main):null}function getOrCreateOutputPanel(type){const calculator=getMainCalculator();if(!calculator)return null;const id=getOutputPanelId(type);let panel=byId(id);return panel||(panel=document.createElement("section"),panel.id=id,panel.className="loan-style-output-panel calculator-clean-result",panel.setAttribute("aria-label","Calculator result"),calculator.insertAdjacentElement("afterend",panel)),panel}function makeAgeResultGroups(rows){rows=Array.isArray(rows)?rows:[];const used=new Set;function rowLabel(row){return String((Array.isArray(row)?row[0]:row.label)||"")}function makeGroup(group,groupRows){return groupRows.length?'<section class="age-result-group-box age-result-group-'+group.key+'"><h3>'+escapeHtml(group.title)+'</h3><ul class="age-point-result-list">'+groupRows.map(function(row){return"<li><strong>"+escapeHtml(rowLabel(row))+":</strong> <span>"+escapeHtml(function(row){return String((Array.isArray(row)?row[1]:row.value)||"")}(row))+"</span></li>"}).join("")+"</ul></section>":""}let html=[{key:"birth",title:"Birth & calendar",match:/name|date range|day of week born|born date in islamic|born date in chinese/i},{key:"age",title:"Current age",match:/exact age|normal age|asian age|age in .* year|months old|weeks old|days old|seconds old/i},{key:"milestone",title:"Birthday & milestones",match:/next birthday countdown|next age live countdown|seconds to next age|retirement|legal age|leap year age/i},{key:"life",title:"Life summary",match:/days spent alive|estimated sleep time|breaths taken|heartbeats lived/i},{key:"zodiac",title:"Zodiac",match:/western zodiac|chinese zodiac/i},{key:"history",title:"Famous birthdays & historical event",match:/famous person|famous celebrity|famous sports star|famous historical figure|historical event/i},{key:"space",title:"Space & moon",match:/age on other planets|moon cycles experienced/i}].map(function(group){const groupRows=rows.filter(function(row,index){return!(!row||used.has(index))&&(!!group.match.test(rowLabel(row))&&(used.add(index),!0))});return makeGroup(group,groupRows)}).join("");const otherRows=rows.filter(function(row,index){return row&&!used.has(index)});return otherRows.length&&(html+=makeGroup({key:"other",title:"Other details"},otherRows)),'<div class="age-result-group-grid">'+html+"</div>"}function rowsToPlainText(rows){return rows.map(function(row){return row[0]+": "+row[1]}).join("\n")}function hideNativeResultElements(type){["result","ageResult","bmiResult","loanResult","personalLoanResult","discountResult","percentageResult","compoundResult"].forEach(function(id){const element=byId(id);element&&(element.style.display="none")})}function downloadTextFile(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download=filename,document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},500)}function dateFileStamp(){const now=new Date;return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")}function renderResultPanel(type,rows,extraTopHtml){if(document.body.classList.contains("calculator-report-view"))return null;const panel=getOrCreateOutputPanel(type);if(!panel)return null;const isAgeResult="age"===type,isBmiResult="bmi"===type,resultHtml=isAgeResult?function(rows){return'<div class="age-point-result-box">'+makeAgeResultGroups(rows)+"</div>"}(rows):isBmiResult?function(rows){function rowLabel(row){return String((Array.isArray(row)?row[0]:row.label)||"")}function rowValue(row){return String((Array.isArray(row)?row[1]:row.value)||"")}function findRow(pattern){return rows.find(function(row){return pattern.test(rowLabel(row))})}rows=Array.isArray(rows)?rows:[];const bmiRow=findRow(/^BMI$/i),categoryRow=findRow(/^BMI category$/i),differenceRow=findRow(/^Difference to healthy range$/i);function makeSummaryCard(row,fallbackLabel,className){return row?'<section class="bmi-summary-card '+className+'"><div class="bmi-summary-card-label">'+escapeHtml(fallbackLabel||rowLabel(row))+'</div><div class="bmi-summary-card-value">'+escapeHtml(rowValue(row))+"</div></section>":""}const bmiValue=bmiRow?rowValue(bmiRow):"",categoryValue=categoryRow?rowValue(categoryRow):"",mainResultText=bmiValue?'<div class="bmi-main-result-text"><span class="bmi-main-result-label">Your BMI result</span><strong>'+escapeHtml(bmiValue)+"</strong>"+(categoryValue?"<small>"+escapeHtml(categoryValue)+"</small>":"")+"</div>":"",summaryHtml='<div class="bmi-summary-card-grid" aria-label="BMI result summary">'+makeSummaryCard(bmiRow,"BMI","bmi-summary-bmi")+makeSummaryCard(categoryRow,"BMI Category","bmi-summary-category")+makeSummaryCard(differenceRow,"Difference to healthy range","bmi-summary-difference")+"</div>",highlightPatterns=[/^BMI$/i,/^BMI category$/i,/^Difference to healthy range$/i],groups=[{key:"health",title:"Health overview",match:/Healthy weight range|Health risk|Waist-to-height ratio|Waist-to-height status|Neck circumference|Wrist size|Shoulder width|Hip circumference/i},{key:"calorie",title:"Calories & body fat",match:/Calories\/day|Body fat estimate|Body type comment|Frame size|Fat distribution|Body shape|Somatotype tendency|Suggested exercise|Suggested foods|Physique \/ body type/i},{key:"goal",title:"Goal timeline",match:/Goal timeline|Healthy\?|Best|Target weight|Time goal/i},{key:"profile",title:"Profile used",match:/Unit|Name|Age range|Gender|Activity level/i}],used=new Set;function makeGroup(group,groupRows){return groupRows.length?'<section class="bmi-result-group-box bmi-result-group-'+group.key+'"><h3>'+escapeHtml(group.title)+'</h3><ul class="bmi-point-result-list">'+groupRows.map(function(row){return"<li><strong>"+escapeHtml(rowLabel(row))+":</strong> <span>"+escapeHtml(rowValue(row))+"</span></li>"}).join("")+"</ul></section>":""}const groupHtml=groups.map(function(group){const groupRows=rows.filter(function(row,index){return!(!row||used.has(index))&&(!highlightPatterns.some(function(pattern){return pattern.test(rowLabel(row))})&&(!!group.match.test(rowLabel(row))&&(used.add(index),!0)))});return makeGroup(group,groupRows)}).join(""),otherRows=rows.filter(function(row,index){return!(!row||used.has(index))&&!highlightPatterns.some(function(pattern){return pattern.test(rowLabel(row))})}),otherHtml=otherRows.length?makeGroup({key:"other",title:"Other details"},otherRows):"";return'<div class="bmi-result-box bmi-result-box-card-form">'+mainResultText+summaryHtml+'<div class="bmi-result-group-grid">'+groupHtml+otherHtml+"</div></div>"}(rows):function(rows){return'<div class="loan-result-table-scroll"><table class="loan-result-table universal-loan-result-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>'+rows.map(function(row){return"<tr><td>"+escapeHtml(row[0])+"</td><td>"+escapeHtml(row[1])+"</td></tr>"}).join("")+"</tbody></table></div>"}(rows);if(panel.className="loan-style-output-panel calculator-clean-result "+type+"-clean-result"+(isAgeResult?" age-point-output":"")+(isBmiResult?" bmi-box-output":""),panel.innerHTML=isAgeResult?'<div class="loan-output-top age-result-shell"><div class="loan-result-panel age-result-main-box">'+(extraTopHtml||"")+'<div class="loan-result-body age-result-body">'+resultHtml+'</div><div class="age-result-actions"><button type="button" class="age-result-action-btn age-copy-btn">Copy</button><button type="button" class="age-result-action-btn age-save-btn">Save</button><button type="button" class="age-result-action-btn age-share-btn">Share</button><button type="button" class="age-result-action-btn age-report-btn">Report</button></div></div></div>':isBmiResult?'<div class="loan-output-top bmi-result-shell"><div class="loan-result-panel bmi-result-main-box"><div class="loan-result-body bmi-result-body">'+resultHtml+'</div><div class="bmi-result-actions"><button type="button" class="bmi-result-action-btn bmi-copy-btn">Copy</button><button type="button" class="bmi-result-action-btn bmi-save-btn">Save</button><button type="button" class="bmi-result-action-btn bmi-share-btn">Share</button><button type="button" class="bmi-result-action-btn bmi-report-btn">Report</button></div></div></div>':'<div class="loan-output-top universal-result-shell"><div class="loan-result-panel universal-result-main-box">'+(extraTopHtml?'<div class="universal-result-summary-wrap">'+extraTopHtml+"</div>":"")+'<div class="loan-result-body">'+resultHtml+'</div><div class="universal-result-actions"><button type="button" class="universal-result-action-btn loan-copy-btn">Copy</button><button type="button" class="universal-result-action-btn loan-save-btn">Save</button><button type="button" class="universal-result-action-btn loan-share-btn">Share</button><button type="button" class="universal-result-action-btn loan-report-btn">Report</button></div></div></div>',panel.hidden=!1,panel.style.setProperty("display","block","important"),panel.style.setProperty("visibility","visible","important"),isAgeResult){const ageText=rowsToPlainText(rows),copyBtn=panel.querySelector(".age-copy-btn"),saveBtn=panel.querySelector(".age-save-btn"),shareBtn=panel.querySelector(".age-share-btn"),reportBtn=panel.querySelector(".age-report-btn");copyBtn&&(copyBtn.onclick=function(){copyText(ageText,copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile("age-result-"+dateFileStamp()+".txt","Age Calculator Result\n\n"+ageText),setButtonState(saveBtn,"Saved!")}),shareBtn&&(shareBtn.onclick=function(){const shareData={title:"Age Calculator Result",text:ageText};navigator.share?navigator.share(shareData).catch(function(){copyText(ageText,shareBtn)}):copyText(ageText,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport("age",reportBtn)})}else if(isBmiResult){const bmiText=rowsToPlainText(rows),copyBtn=panel.querySelector(".bmi-copy-btn"),saveBtn=panel.querySelector(".bmi-save-btn"),shareBtn=panel.querySelector(".bmi-share-btn"),reportBtn=panel.querySelector(".bmi-report-btn");copyBtn&&(copyBtn.onclick=function(){copyText(bmiText,copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile("bmi-result-"+dateFileStamp()+".txt","BMI Calculator Result\n\n"+bmiText),setButtonState(saveBtn,"Saved!")}),shareBtn&&(shareBtn.onclick=function(){const shareData={title:"BMI Calculator Result",text:bmiText};navigator.share?navigator.share(shareData).catch(function(){copyText(bmiText,shareBtn)}):copyText(bmiText,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport("bmi",reportBtn)})}else{const resultText=rowsToPlainText(rows),copyBtn=panel.querySelector(".loan-copy-btn"),saveBtn=panel.querySelector(".loan-save-btn"),shareBtn=panel.querySelector(".loan-share-btn"),reportBtn=panel.querySelector(".loan-report-btn");copyBtn&&(copyBtn.onclick=function(){!function(table,button){if(!table)return;copyText(Array.from(table.querySelectorAll("tr")).map(function(row){return Array.from(row.querySelectorAll("th, td")).map(function(cell){return cleanText(cell.textContent)}).join("\t")}).join("\n"),button)}(panel.querySelector("table"),copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile(type+"-result-"+dateFileStamp()+".txt",resultText),setButtonState(saveBtn,"Saved!")}),shareBtn&&(shareBtn.onclick=function(){const shareData={title:"Calculator Result",text:resultText};navigator.share?navigator.share(shareData).catch(function(){copyText(resultText,shareBtn)}):copyText(resultText,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport(type,reportBtn)})}return hideNativeResultElements(),panel}function getInputLabel(input){if(!input)return"Input";if(input.id){const label=$('label[for="'+input.id+'"]');if(label)return cleanText(label.textContent.replace(/[:：]/g,""))}const previous=input.previousElementSibling;return previous&&"label"===lower(previous.tagName)?cleanText(previous.textContent.replace(/[:：]/g,"")):cleanText(input.getAttribute("aria-label")||input.placeholder||input.name||input.id||"Input")}function getFilledInputs(){const lines=[],used=new Set;return $$(".calculator input, .calculator select, .calculator textarea, .optional-mortgage-costs input, .optional-mortgage-costs select, .early-settlement-box input, .early-settlement-box select, .bmi-input-groups input, .bmi-input-groups select").forEach(function(input){if(!input)return;if(["hidden","button","submit","reset"].includes(input.type))return;if("display"===input.id)return;const key=input.id||input.name||getInputLabel(input);if(used.has(key))return;used.add(key);const value=function(input){if(!input)return"";if("select"===lower(input.tagName)){const option=input.options[input.selectedIndex];return cleanText(option?option.textContent:input.value)}return cleanText(input.value)}(input);value&&lines.push({label:getInputLabel(input),value:value})}),lines}function reportKey(type){return"calculatorReports_v5_"+type}function loadReports(type){return loadArray(reportKey(type))}function saveReports(type,reports){saveArray(reportKey(type),reports)}function shortReportLabel(type,report){const lines=report.inputLines||[];function find(pattern){const line=lines.find(function(item){return pattern.test(item.label||"")});return line?line.value:""}return"age"===type?"Birthdate: "+(find(/birth/i)||"-"):"bmi"===type?"BMI: "+(report.metrics&&report.metrics.bmi||"report"):"loan"===type?"Mortgage amount: "+moneyRM(find(/loan amount|purchase price|amount/i)):"personalLoan"===type?"Loan amount: "+moneyRM(find(/loan amount|amount/i)):"discount"===type?"Price: "+moneyRM(find(/price|amount/i)):"percentage"===type?(find(/percentage|percent/i)||"-")+" of "+(find(/number|amount|value/i)||"-"):"compound"===type?"Principal: "+moneyRM(find(/principal|amount/i)):"Report"}function reportSignature(report){return JSON.stringify({inputs:report.inputLines,result:report.resultText})}function saveCurrentReport(type,metrics){if(!isReportType(type))return;metrics=metrics||{};const resultHtml=function(type){const panel=byId(getOutputPanelId(type));if(!panel||panel.hidden)return"";const clone=panel.cloneNode(!0);return clone.querySelectorAll("script, iframe, object, embed, link, meta, button, a, .loan-copy-side, .loan-graph-copy-side, .calculator-report-actions").forEach(function(element){element.remove()}),clone.innerHTML||clone.outerHTML||""}(type),resultText=function(type){const panel=byId(getOutputPanelId(type));return panel&&!panel.hidden?cleanText(panel.innerText||panel.textContent||""):""}(type);if(!resultHtml||!resultText)return;const report={type:type,id:type+"_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),createdAt:(new Date).toLocaleString(),inputLines:getFilledInputs(),resultLines:Array.isArray(metrics.resultRows)?metrics.resultRows:[],resultHtml:resultHtml,resultText:resultText,metrics:metrics||{}};report.label=shortReportLabel(type,report);const reports=loadReports(type),last=reports[reports.length-1];if(last&&JSON.stringify(last.inputLines||[])===JSON.stringify(report.inputLines||[]))return reports[reports.length-1]=report,saveReports(type,reports),void renderReportHistory(type);last&&reportSignature(last)===reportSignature(report)||(reports.push(report),saveReports(type,reports)),renderReportHistory(type)}function reportHref(report){return window.location.href.split("#")[0]+"#calc-report="+function(text){const bytes=(new TextEncoder).encode(text);let binary="";return bytes.forEach(function(byte){binary+=String.fromCharCode(byte)}),btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}(JSON.stringify(report))}function renderReportHistory(type){if(!isReportType(type))return;const list=function(type){return byId({age:"ageHistoryList",bmi:"bmiHistoryList",loan:"loanHistoryList",personalLoan:"personalLoanHistoryList",discount:"discountHistoryList",percentage:"percentageHistoryList",compound:"compoundHistoryList"}[type])}(type);if(!list)return;const box=list.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box"),title=box?$("h3",box):null;title&&(title.textContent="History"),list.innerHTML="",loadReports(type).slice().reverse().forEach(function(report){const li=document.createElement("li");li.className="history-item calculator-report-history-item";const text=document.createElement("span");text.className="history-text calculator-report-history-label",text.textContent=report.label||shortReportLabel(type,report);const link=document.createElement("a");link.className="calculator-report-open-link mortgage-fast-open-link",link.textContent="open report",link.href=reportHref(report),link.target="_self",link.rel="",li.appendChild(text),li.appendChild(link),list.appendChild(li)})}function clearReports(type){safeRemove(reportKey(type)),renderReportHistory(type);const panel=byId(getOutputPanelId(type));panel&&(panel.hidden=!0)}function todayValueISO(){const today=new Date;return today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0")+"-"+String(today.getDate()).padStart(2,"0")}function formatDateDMY(value){const parts=String(value||"").split("-");return 3===parts.length?parts[2]+"/"+parts[1]+"/"+parts[0]:value||""}function parseDateInput(value,endOfToday){if(!value)return null;const parts=String(value).split("-").map(Number);if(3!==parts.length||parts.some(function(part){return!Number.isFinite(part)}))return null;const date=new Date(parts[0],parts[1]-1,parts[2],0,0,0,0);if(endOfToday&&value===todayValueISO()){const now=new Date;date.setHours(now.getHours(),now.getMinutes(),now.getSeconds(),now.getMilliseconds())}return date}function ensureAgeNameInput(){const birthdateInput=byId("birthdate");if(!birthdateInput||byId("ageName"))return;const label=document.createElement("label");label.setAttribute("for","ageName"),label.textContent="Name (optional):";const input=document.createElement("input");input.type="text",input.id="ageName",input.placeholder="Optional",input.setAttribute("autocomplete","name"),birthdateInput.insertAdjacentElement("beforebegin",input),input.insertAdjacentElement("beforebegin",label)}function ensureAgeTargetDateInput(){const birthdateInput=byId("birthdate");if(!birthdateInput)return null;let targetInput=byId("dateToCalculate");if(!targetInput){const label=document.createElement("label");label.setAttribute("for","dateToCalculate"),label.textContent="Calculation date:",targetInput=document.createElement("input"),targetInput.type="date",targetInput.id="dateToCalculate",targetInput.setAttribute("aria-label","Calculation date"),birthdateInput.insertAdjacentElement("afterend",targetInput),targetInput.insertAdjacentElement("beforebegin",label)}return targetInput.value||(targetInput.value=todayValueISO()),targetInput}function calendarAgeBreakdown(birthDate,targetDate){if(!birthDate||!targetDate||birthDate>targetDate)return null;let years=targetDate.getFullYear()-birthDate.getFullYear(),months=targetDate.getMonth()-birthDate.getMonth(),days=targetDate.getDate()-birthDate.getDate(),hours=targetDate.getHours()-birthDate.getHours(),minutes=targetDate.getMinutes()-birthDate.getMinutes();if(minutes<0&&(minutes+=60,hours-=1),hours<0&&(hours+=24,days-=1),days<0){days+=new Date(targetDate.getFullYear(),targetDate.getMonth(),0).getDate(),months-=1}return months<0&&(months+=12,years-=1),{years:years,months:months,days:days,hours:hours,minutes:minutes}}function nextBirthdayCountdown(birthDate){if(!birthDate)return"-";const now=new Date;let next=new Date(now.getFullYear(),birthDate.getMonth(),birthDate.getDate(),0,0,0,0);1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(next.getFullYear())||(next=new Date(now.getFullYear(),2,1,0,0,0,0)),next<now&&(next=new Date(now.getFullYear()+1,birthDate.getMonth(),birthDate.getDate(),0,0,0,0),1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(next.getFullYear())||(next=new Date(now.getFullYear()+1,2,1,0,0,0,0)));const diffMs=Math.max(0,next-now),totalMinutes=Math.floor(diffMs/6e4);return Math.floor(totalMinutes/1440)+" days, "+Math.floor(totalMinutes%1440/60)+" hours, "+totalMinutes%60+" minutes"}function isLeapYear(year){return year%4==0&&year%100!=0||year%400==0}function westernZodiac(month,day){const signs=[["Capricorn",1,19],["Aquarius",2,18],["Pisces",3,20],["Aries",4,19],["Taurus",5,20],["Gemini",6,20],["Cancer",7,22],["Leo",8,22],["Virgo",9,22],["Libra",10,22],["Scorpio",11,21],["Sagittarius",12,21]];for(const item of signs)if(month<item[1]||month===item[1]&&day<=item[2])return item[0];return"Capricorn"}function compactDuration(parts){if(!parts)return"-";return[[parts.years,"year"],[parts.months,"month"],[parts.days,"day"]].filter(function(item){return Number(item[0])>0}).map(function(item){return item[0]+" "+item[1]+(1===item[0]?"":"s")}).join(", ")||"0 days"}function countdownToAge(birthDate,targetDate,ageYears,label){if(!birthDate||!targetDate)return"-";const milestoneDate=new Date(birthDate.getFullYear()+ageYears,birthDate.getMonth(),birthDate.getDate(),birthDate.getHours(),birthDate.getMinutes(),birthDate.getSeconds(),birthDate.getMilliseconds());return 1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(milestoneDate.getFullYear())||milestoneDate.setMonth(2,1),targetDate<milestoneDate?compactDuration(calendarAgeBreakdown(targetDate,milestoneDate))+" before "+label+" (age "+ageYears+")":label+" reached "+compactDuration(calendarAgeBreakdown(milestoneDate,targetDate))+" ago"}function estimatedSleepText(totalDays){const sleepDays=Math.floor(totalDays/3),years=Math.floor(sleepDays/365.2425);return years+" years, "+Math.floor(sleepDays-365.2425*years)+" days (estimated 8 hours/day)"}function moonCycleText(totalDays){return(totalDays/29.530588853).toFixed(1)+" lunar cycles"}function formatLargeNumber(value){const number=Number(value);return Number.isFinite(number)?Math.round(number).toLocaleString("en-US"):"-"}function estimatedHeartbeatsText(totalSeconds){return formatLargeNumber(totalSeconds/60*70)+" heartbeats (estimated 70 bpm)"}function birthdayForYear(birthDate,year){let birthday=new Date(year,birthDate.getMonth(),birthDate.getDate(),birthDate.getHours(),birthDate.getMinutes(),birthDate.getSeconds(),birthDate.getMilliseconds());return 1!==birthDate.getMonth()||29!==birthDate.getDate()||isLeapYear(year)||(birthday=new Date(year,2,1,birthDate.getHours(),birthDate.getMinutes(),birthDate.getSeconds(),birthDate.getMilliseconds())),birthday}function nextAgeCountdownData(birthDate){if(!birthDate)return null;const now=new Date;let upcomingAge=now.getFullYear()-birthDate.getFullYear(),next=birthdayForYear(birthDate,birthDate.getFullYear()+upcomingAge);next<=now&&(upcomingAge+=1,next=birthdayForYear(birthDate,birthDate.getFullYear()+upcomingAge));return{upcomingAge:upcomingAge,seconds:Math.max(0,Math.floor((next.getTime()-now.getTime())/1e3)),nextDate:next}}function ageLiveCountdownHtml(birthdateValue){return'<div class="age-live-countdown" data-birthdate="'+escapeHtml(String(birthdateValue||""))+'"><span class="age-live-countdown-line"><strong data-age-countdown-line>-- second to -- years old</strong></span></div>'}let ageLiveCountdownTimer=null;function updateAgeLiveCountdowns(){$$(".age-live-countdown[data-birthdate]").forEach(function(box){const data=nextAgeCountdownData(parseDateInput(box.getAttribute("data-birthdate"),!1));if(!data)return;const lineEl=box.querySelector("[data-age-countdown-line]");lineEl&&(lineEl.textContent=formatLargeNumber(data.seconds)+" second to "+data.upcomingAge+" years old")})}function startAgeLiveCountdown(){updateAgeLiveCountdowns(),ageLiveCountdownTimer||(ageLiveCountdownTimer=setInterval(updateAgeLiveCountdowns,1e3))}function extractBirthPersonName(item){if(!item)return"";if(Array.isArray(item.pages)&&item.pages.length){const page=item.pages[0];if(page.normalizedtitle)return page.normalizedtitle;if(page.title)return String(page.title).replace(/_/g," ")}return String(item.text||"").split(",")[0].replace(/^\d+\s*[–-]\s*/,"").trim()}function famousDescription(item){return String(item&&item.text||"").toLowerCase()}function pickFamousBirthdayPeople(items){items=Array.isArray(items)?items:[];const blockedReligionPattern=/hindu|hinduism|buddhist|buddhism|sikh|sikhism|jain|jainism|shinto|taoist|taoism|zoroastrian|zoroastrianism|bah[aā]'?i|baha'i|bahai|pagan|polytheist|judaism|jewish|rabbi|kabbalah/i,muslimPattern=/muslim|islam|islamic|caliph|sultan|imam|qadi|sheikh|shaykh|muhaddith|mufassir|faqih|sufi|ottoman|abbasid|umayyad|ayyubid|mamluk|mughal|al-andalus|andalusian|ibn|al-|bint|abu|abd|salahuddin|saladin|khwarizmi|biruni|sina|rushd|ghazali|farabi|khaldun|rumi|iqbal|jinnah|tariq ibn ziyad|fatima al-fihri|malala/i,christianPattern=/christian|christianity|catholic|orthodox|protestant|anglican|lutheran|calvinist|methodist|baptist|pope|saint|st\.|apostle|bishop|priest|pastor|monk|nun|missionary|church|theologian|martyr|reformer|archbishop|cardinal|evangelist/i;function pickByPattern(pattern,used){const found=items.find(function(item){const name=extractBirthPersonName(item),desc=famousDescription(item);return!(!name||used.has(name))&&(!function(item){const desc=famousDescription(item);return blockedReligionPattern.test(desc)}(item)&&pattern.test(desc))});if(!found)return"";const name=extractBirthPersonName(found);return used.add(name),name}const used=new Set,picked=[pickByPattern(muslimPattern,used),pickByPattern(muslimPattern,used),pickByPattern(muslimPattern,used)];for(let i=0;i<picked.length;i+=1)picked[i]||(picked[i]=pickByPattern(christianPattern,used));return{celebrity:picked[0]||"Not found",sports:picked[1]||"Not found",historical:picked[2]||"Not found"}}function famousBirthdayRows(month,day){const fallback=function(month,day){const key=String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0");return{"01-01":["Ibn Khaldun","Muhammad Ali Jinnah","Omar Khayyam"],"01-08":["Abd al-Rahman al-Sufi","Ibn al-Haytham","Malala Yousafzai"],"01-15":["Nasser al-Din Shah Qajar","Ibn Battuta","Al-Farabi"],"02-12":["Nur ad-Din Zengi","Ibn Sina","Fatima al-Fihri"],"03-14":["Harun al-Rashid","Al-Biruni","Ibn Rushd"],"04-15":["Süleyman the Magnificent","Mimar Sinan","Ibn Arabi"],"05-05":["Salahuddin al-Ayyubi","Muhammad Iqbal","Al-Khwarizmi"],"06-01":["Abu Bakr al-Siddiq","Umar ibn al-Khattab","Uthman ibn Affan"],"07-24":["Mehmed II","Tipu Sultan","Al-Ghazali"],"08-04":["Rumi","Ibn Taymiyyah","Aisha bint Abi Bakr"],"09-04":["Al-Masudi","Ibn Hazm","Averroes"],"10-28":["Shah Waliullah Dehlawi","Tariq ibn Ziyad","Abd al-Qadir al-Jazairi"],"11-30":["Anwar Sadat","Ibn Jubayr","Ahmad Sirhindi"],"12-25":["Muhammad Ali","Muhammad Asad","Al-Idrisi"]}[key]||{"01-01":["Basil of Caesarea","Fulgentius of Ruspe","Zygmunt Gorazdowski"],"01-08":["Lawrence Giustiniani","Severinus of Noricum","Apollinaris Claudius"],"01-15":["Arnold Janssen","Paul of Thebes","Maurus"],"02-12":["Charles Lwanga","Benedict Biscop","Ethelwald of Lindisfarne"],"03-14":["Matilda of Ringelheim","Pauline of Thuringia","Leobinus"],"04-15":["Damien of Molokai","Paternus of Avranches","Hunna of Alsace"],"05-05":["Augustine of Canterbury","Nunzio Sulprizio","Avertinus"],"06-01":["Justin Martyr","Simeon of Trier","Wistan"],"07-24":["Christina the Astonishing","Declan of Ardmore","Charbel Makhlouf"],"08-04":["John Vianney","Aristarchus of Thessalonica","Euphronius of Tours"],"09-04":["Rosalia","Cuthbert of Lindisfarne","Marinus"],"10-28":["Simon the Zealot","Jude the Apostle","Alfred the Great"],"11-30":["Andrew the Apostle","Tugdual","Joseph Marchand"],"12-25":["Anastasia of Sirmium","Eugenia of Rome","Peter Nolasco"]}[key]||["Ibn Sina","Al-Khwarizmi","Salahuddin al-Ayyubi"]}(month,day);return[["Famous person",fallback[0]],["Famous person",fallback[1]],["Famous person",fallback[2]]]}function historicalEventFallback(month,day){return{"01-01":"630 - The Conquest of Makkah occurred around the 8th year after Hijrah, a major event in Islamic history.","01-08":"1198 - Ibn Rushd, a major Muslim philosopher and scholar, died in Marrakesh.","02-10":"1258 - The Siege of Baghdad ended, marking a major turning point in Islamic civilization.","03-03":"1924 - The Ottoman Caliphate was abolished, ending a major institution in modern Islamic history.","03-11":"1917 - British forces entered Baghdad during World War I, affecting the modern Muslim world.","04-02":"1453 - Ottoman Sultan Mehmed II began the final campaign that led to the conquest of Constantinople.","04-29":"711 - Muslim forces entered Iberia, beginning centuries of Islamic rule in Al-Andalus.","05-29":"1453 - Constantinople was conquered by the Ottoman Empire under Sultan Mehmed II.","06-08":"632 - Prophet Muhammad passed away in Madinah according to widely cited historical tradition.","07-02":"1187 - The Battle of Hattin began, leading to Salahuddin's recovery of Jerusalem.","07-04":"1187 - Salahuddin defeated the Crusader army at the Battle of Hattin.","07-15":"1099 - Jerusalem fell to the First Crusade, a major event in Islamic and Crusader history.","09-23":"622 - The Hijrah to Madinah marks the beginning of the Islamic calendar era.","10-02":"1187 - Salahuddin recovered Jerusalem after the Battle of Hattin.","10-29":"1923 - The Republic of Turkey was proclaimed after the Ottoman era.","12-17":"1273 - Jalal al-Din Rumi, the famous Muslim poet and scholar, died in Konya."}[String(month).padStart(2,"0")+"-"+String(day).padStart(2,"0")]||"No matching Islamic historical event found for this date yet."}function isRelevantAgeHistoricalEvent(item){const text=String(item&&item.text||"").toLowerCase();Number(item&&item.year);return!!text&&/islam|islamic|muslim|muhammad|prophet|quran|qur'an|caliph|caliphate|umayyad|abbasid|fatimid|ayyubid|mamluk|ottoman|seljuk|sultan|sultanate|emir|emirate|hijra|hijrah|mecca|makkah|medina|madinah|baghdad|damascus|cairo|cordoba|al-andalus|andalus|jerusalem|salahuddin|saladin|rumi|ibn|al-|imam|mosque|kaaba|ka'aba|hajj|ramadan|sharia|madrasa/i.test(text)}function updateHistoricalEventOnline(month,day,rows,metricsBuilder){if(!window.fetch)return;fetch("https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/"+month+"/"+day).then(function(response){if(!response.ok)throw new Error("Historical event API unavailable");return response.json()}).then(function(data){const eventText=function(item){if(!item)return"";const year=item.year?String(item.year)+" - ":"",text=String(item.text||"").trim();return text?year+text:""}((Array.isArray(data.events)?data.events:[]).find(isRelevantAgeHistoricalEvent));if(!eventText)return;rows.forEach(function(row){"Historical event on this day"===row[0]&&(row[1]=eventText)});const metrics="function"==typeof metricsBuilder?metricsBuilder(rows):{resultRows:rows.map(function(row){return{label:row[0],value:row[1]}})};renderResultPanel("age",rows,ageLiveCountdownHtml(metrics.birthdate||"")),startAgeLiveCountdown(),saveCurrentReport("age",metrics)}).catch(function(){})}function formatIntlDate(date,locale){try{return new Intl.DateTimeFormat(locale,{dateStyle:"full"}).format(date)}catch{return"Not available"}}function leapBirthdayInfo(birthDate,targetDate){if(!birthDate)return"-";const birthYear=birthDate.getFullYear(),targetYear=targetDate?targetDate.getFullYear():(new Date).getFullYear(),bornInLeapYear=isLeapYear(birthYear)?"Yes":"No";if(1!==birthDate.getMonth()||29!==birthDate.getDate())return"Born in leap year: "+bornInLeapYear;let leapBirthdays=0;for(let year=birthYear+1;year<=targetYear;year+=1)isLeapYear(year)&&(leapBirthdays+=1);return"Leap day birthday; actual Feb 29 birthdays passed: "+leapBirthdays}function calculateAge(){ensureAgeNameInput();const name=firstValue(["ageName","name","personName"]),birthdate=firstValue(["birthdate","birthDate","dob"]),targetInput=ensureAgeTargetDateInput(),targetValue=targetInput?targetInput.value:todayValueISO();if(!birthdate||!targetValue)return;const birthDate=parseDateInput(birthdate,!1),targetDate=parseDateInput(targetValue,!0);if(!birthDate||!targetDate||birthDate>targetDate)return;const exact=calendarAgeBreakdown(birthDate,targetDate);if(!exact)return;const asianAge=function(birthdateValue,targetDateValue){const birthYear=Number(String(birthdateValue||"").split("-")[0]),targetYear=Number(String(targetDateValue||"").split("-")[0]);return!birthYear||!targetYear||birthYear>targetYear?"":targetYear-birthYear+1}(birthdate,targetValue),weekday=birthDate.toLocaleDateString("en-US",{weekday:"long"}),month=birthDate.getMonth()+1,day=birthDate.getDate(),year=birthDate.getFullYear(),exactText=exact.years+" years, "+exact.months+" months, "+exact.days+" days, "+exact.hours+" hours, "+exact.minutes+" minutes",totalAliveDays=(endDate=targetDate,!(startDate=birthDate)||!endDate||endDate<startDate?0:Math.floor((endDate.getTime()-startDate.getTime())/864e5));var startDate,endDate;const totalAliveSeconds=function(startDate,endDate){return!startDate||!endDate||endDate<startDate?0:Math.floor((endDate.getTime()-startDate.getTime())/1e3)}(birthDate,targetDate),chineseAnimal=function(year){return["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"][(year-1900)%12<0?(year-1900)%12+12:(year-1900)%12]}(year),nextAgeData=nextAgeCountdownData(birthDate),secondsToNextAge=nextAgeData?formatLargeNumber(nextAgeData.seconds)+" second to "+nextAgeData.upcomingAge+" years old":"-",rows=[["Name",name||"-"],["Date range",formatDateDMY(birthdate)+" to "+formatDateDMY(targetValue)],["Day of week born",weekday],["Born date in Islamic calendar",formatIntlDate(birthDate,"en-GB-u-ca-islamic")],["Born date in Chinese calendar",formatIntlDate(birthDate,"en-GB-u-ca-chinese")],["Exact age",exactText],["Normal age",exact.years+" years old"],["Asian age",asianAge+" years old"],["Age in "+chineseAnimal+" year",String(exact.years)],["Months old",(exact.years*12+exact.months).toLocaleString()],["Weeks old",Math.floor(totalAliveDays/7).toLocaleString()],["Days old",totalAliveDays.toLocaleString()],["Seconds old",formatLargeNumber(totalAliveSeconds)],["Next birthday countdown",nextBirthdayCountdown(birthDate)],["Next age live countdown",secondsToNextAge],["Retirement",countdownToAge(birthDate,targetDate,60,"retirement")],["Legal age",countdownToAge(birthDate,targetDate,18,"legal adult age")],["Leap year age",leapBirthdayInfo(birthDate,targetDate)],["Estimated sleep time",estimatedSleepText(totalAliveDays)],["Breaths taken",(totalSeconds=totalAliveSeconds,formatLargeNumber(totalSeconds/60*16)+" breaths (estimated 16 breaths/minute)")],["Heartbeats lived",estimatedHeartbeatsText(totalAliveSeconds)],["Days spent alive",totalAliveDays.toLocaleString()],["Western zodiac",westernZodiac(month,day)],["Chinese zodiac",chineseAnimal]].concat(famousBirthdayRows(month,day)).concat([["Historical event on this day",historicalEventFallback(month,day)],["Age on other planets",(totalDays=totalAliveDays,[["Mercury",87.969],["Venus",224.701],["Mars",686.98],["Jupiter",4332.59],["Saturn",10759.22]].map(function(item){const age=totalDays/item[1];return item[0]+": "+age.toFixed(2)}).join(" | "))],["Moon cycles experienced",moonCycleText(totalAliveDays)]]);var totalDays,totalSeconds;function ageMetrics(currentRows){return{birthdate:birthdate,name:name,exactAge:exactText,normalAge:exact.years,asianAge:asianAge,resultRows:currentRows.map(function(row){return{label:row[0],value:row[1]}})}}renderResultPanel("age",rows,ageLiveCountdownHtml(birthdate)),startAgeLiveCountdown(),saveCurrentReport("age",ageMetrics(rows)),function(month,day,rows,metricsBuilder){if(!window.fetch)return;fetch("https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/"+month+"/"+day).then(function(response){if(!response.ok)throw new Error("Birthday API unavailable");return response.json()}).then(function(data){const picked=pickFamousBirthdayPeople(data.births||[]),famousPeople=[picked.celebrity,picked.sports,picked.historical].filter(function(name){return name&&"Not found"!==name});let famousIndex=0;rows.forEach(function(row){"Famous person"===row[0]&&famousPeople[famousIndex]&&(row[1]=famousPeople[famousIndex],famousIndex+=1)});const metrics="function"==typeof metricsBuilder?metricsBuilder(rows):{resultRows:rows.map(function(row){return{label:row[0],value:row[1]}})};renderResultPanel("age",rows,ageLiveCountdownHtml(metrics.birthdate||"")),startAgeLiveCountdown(),saveCurrentReport("age",metrics)}).catch(function(){})}(month,day,rows,ageMetrics),updateHistoricalEventOnline(month,day,rows,ageMetrics)}function ensureBMIProfileAndGroups(){if("bmi"!==getPageType())return;const calculator=$(".calculator");if(!calculator)return;const weight=byId("weight"),height=byId("height");byId("waist");if(!weight||!height)return;function makeLabel(id,forId,text){let label=byId(id);return label||(label=document.createElement("label"),label.id=id),label.setAttribute("for",forId),label.textContent=text,label}function makeNumberInput(id,placeholder){let input=byId(id);return input||(input=document.createElement("input"),input.type="number",input.id=id,input.placeholder=placeholder,input.inputMode="decimal"),input}function makeSelect(id,html,defaultValue){let select=byId(id);const previousValue=select?String(select.value||""):"";if(select&&select.tagName&&"select"!==select.tagName.toLowerCase()){const old=select;select=document.createElement("select"),select.id=id,old.replaceWith(select)}select||(select=document.createElement("select"),select.id=id),select.innerHTML=html;const values=Array.from(select.options).map(function(option){return option.value});return previousValue&&values.includes(previousValue)?select.value=previousValue:defaultValue&&values.includes(defaultValue)&&(select.value=defaultValue),select}const nameLabel=makeLabel("bmiNameLabel","bmiName","Name:"),name=function(id,placeholder){let input=byId(id);return input||(input=document.createElement("input"),input.type="text",input.id=id,input.placeholder=placeholder,input.autocomplete="name"),input}("bmiName","Optional"),ageLabel=makeLabel("bmiAgeLabel","bmiAge","Age:"),age=makeNumberInput("bmiAge","Optional, example: 30"),genderLabel=makeLabel("bmiGenderLabel","bmiGender","Gender:"),gender=makeSelect("bmiGender",'<option value="male">Male</option><option value="female">Female</option>',"male"),activityLabel=makeLabel("bmiActivityLabel","bmiActivityLevel","Activity level:"),activity=makeSelect("bmiActivityLevel",'<option value="sedentary">Sedentary</option><option value="light">Light activity</option><option value="moderate">Moderate activity</option><option value="active">Active</option><option value="veryActive">Very active</option>',"moderate"),timeGoalLabel=makeLabel("bmiTimeGoalLabel","bmiTimeGoalAmount","Time goal:"),timeGoalAmount=makeNumberInput("bmiTimeGoalAmount","Example: 12");timeGoalAmount.min="1",timeGoalAmount.step="1";[nameLabel,name,ageLabel,age,genderLabel,gender,activityLabel,activity,timeGoalLabel,timeGoalAmount,makeSelect("bmiTimeGoal",'<option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>',"weekly"),makeLabel("bmiTargetWeightLabel","bmiTargetWeight","Target weight:"),makeNumberInput("bmiTargetWeight","Optional"),makeLabel("bmiNeckLabel","bmiNeck","Neck circumference:"),makeNumberInput("bmiNeck","Optional"),makeLabel("bmiWristLabel","bmiWrist","Wrist size:"),makeNumberInput("bmiWrist","Optional"),makeLabel("bmiShoulderLabel","bmiShoulder","Shoulder width:"),makeNumberInput("bmiShoulder","Optional"),makeLabel("bmiHipLabel","bmiHip","Hip circumference:"),makeNumberInput("bmiHip","Optional")].forEach(function(el){el.parentElement||calculator.insertBefore(el,weight)});let row=$(".bmi-input-groups");if(!row){row=document.createElement("div"),row.className="bmi-input-groups";const titleRow=$(".bmi-title-row");titleRow?titleRow.insertAdjacentElement("afterend",row):calculator.insertAdjacentElement("afterbegin",row)}let bodyBox=$(".bmi-body-box");bodyBox||(bodyBox=document.createElement("div"),bodyBox.className="bmi-body-box bmi-input-group-box",bodyBox.innerHTML='<div class="bmi-extra-title">Body details</div>');let goalBox=$(".bmi-goal-box");goalBox||(goalBox=document.createElement("div"),goalBox.className="bmi-goal-box bmi-input-group-box",goalBox.innerHTML='<div class="bmi-extra-title">Activity & goal</div>');let optionalBox=$(".bmi-optional-box");optionalBox||(optionalBox=document.createElement("div"),optionalBox.className="bmi-optional-box bmi-input-group-box",optionalBox.innerHTML='<div class="bmi-extra-title">Optional target</div>'),row.contains(bodyBox)||row.appendChild(bodyBox),row.contains(goalBox)||row.appendChild(goalBox),row.contains(optionalBox)||row.appendChild(optionalBox),["bmiNameLabel","bmiName","heightLabel","height","weightLabel","weight","bmiAgeLabel","bmiAge","bmiGenderLabel","bmiGender"].forEach(function(id){const element=byId(id);element&&bodyBox.appendChild(element)}),["bmiActivityLabel","bmiActivityLevel","bmiTimeGoalLabel"].forEach(function(id){const element=byId(id);element&&goalBox.appendChild(element)});let timeGoalWrap=byId("bmiTimeGoalWrapper");timeGoalWrap||(timeGoalWrap=document.createElement("div"),timeGoalWrap.id="bmiTimeGoalWrapper",timeGoalWrap.className="bmi-time-goal-row"),goalBox.contains(timeGoalWrap)||goalBox.appendChild(timeGoalWrap),["bmiTimeGoalAmount","bmiTimeGoal"].forEach(function(id){const element=byId(id);element&&timeGoalWrap.appendChild(element)}),["bmiTargetWeightLabel","bmiTargetWeight","waistLabel","waist","bmiNeckLabel","bmiNeck","bmiWristLabel","bmiWrist","bmiShoulderLabel","bmiShoulder","bmiHipLabel","bmiHip"].forEach(function(id){const element=byId(id);element&&optionalBox.appendChild(element)}),["bmiFrameLabel",""].forEach(function(id){const element=byId(id);element&&element.remove()})}function setBMIUnit(unit){const normalized="us"===unit?"us":"si";document.body.dataset.bmiUnit=normalized;const button=byId("unitToggleBtn");button&&(button.dataset.currentUnit=normalized,button.textContent="si"===normalized?"SI":"US");const weightLabel=byId("weightLabel"),heightLabel=byId("heightLabel"),waistLabel=byId("waistLabel"),neckLabel=byId("bmiNeckLabel"),wristLabel=byId("bmiWristLabel"),shoulderLabel=byId("bmiShoulderLabel"),hipLabel=byId("bmiHipLabel"),targetWeightLabel=byId("bmiTargetWeightLabel"),weight=byId("weight"),height=byId("height"),waist=byId("waist"),neck=byId("bmiNeck"),wrist=byId("bmiWrist"),shoulder=byId("bmiShoulder"),hip=byId("bmiHip"),targetWeight=byId("bmiTargetWeight");"si"===normalized?(weightLabel&&(weightLabel.textContent="Weight in kg:"),heightLabel&&(heightLabel.textContent="Height in cm:"),waistLabel&&(waistLabel.textContent="Waist circumference in cm:"),neckLabel&&(neckLabel.textContent="Neck circumference in cm:"),wristLabel&&(wristLabel.textContent="Wrist size in cm:"),shoulderLabel&&(shoulderLabel.textContent="Shoulder width in cm:"),hipLabel&&(hipLabel.textContent="Hip circumference in cm:"),targetWeightLabel&&(targetWeightLabel.textContent="Target weight in kg:"),weight&&(weight.placeholder="Example: 70"),height&&(height.placeholder="Example: 170"),waist&&(waist.placeholder="Optional, Example: 80"),neck&&(neck.placeholder="Optional, Example: 38"),wrist&&(wrist.placeholder="Optional, Example: 16"),shoulder&&(shoulder.placeholder="Optional, Example: 46"),hip&&(hip.placeholder="Optional, Example: 95"),targetWeight&&(targetWeight.placeholder="Optional, Example: 65")):(weightLabel&&(weightLabel.textContent="Weight in lb:"),heightLabel&&(heightLabel.textContent="Height in inch:"),waistLabel&&(waistLabel.textContent="Waist circumference in inch:"),neckLabel&&(neckLabel.textContent="Neck circumference in inch:"),wristLabel&&(wristLabel.textContent="Wrist size in inch:"),shoulderLabel&&(shoulderLabel.textContent="Shoulder width in inch:"),hipLabel&&(hipLabel.textContent="Hip circumference in inch:"),targetWeightLabel&&(targetWeightLabel.textContent="Target weight in lb:"),weight&&(weight.placeholder="Example: 154"),height&&(height.placeholder="Example: 67"),waist&&(waist.placeholder="Optional, Example: 32"),neck&&(neck.placeholder="Optional, Example: 15"),wrist&&(wrist.placeholder="Optional, Example: 6.3"),shoulder&&(shoulder.placeholder="Optional, Example: 18"),hip&&(hip.placeholder="Optional, Example: 38"),targetWeight&&(targetWeight.placeholder="Optional, Example: 143"))}function ageRangeLabel(age){return!Number.isFinite(age)||age<=0?"Not provided":age<18?"Under 18":age<65?"Adult 18–64":"Senior 65+"}function calculateBMI(){ensureBMIProfileAndGroups();const name=firstValue(["bmiName"]),weight=firstNumber(["weight","bmiWeight"]),height=firstNumber(["height","bmiHeight"]),waist=firstNumber(["waist","bmiWaist"]),neck=firstNumber(["bmiNeck"]),wrist=firstNumber(["bmiWrist"]),shoulder=firstNumber(["bmiShoulder"]),hip=firstNumber(["bmiHip"]),age=firstNumber(["bmiAge"]),gender=firstValue(["bmiGender"])||"male",activity=firstValue(["bmiActivityLevel"])||"moderate",timeGoalAmount=firstNumber(["bmiTimeGoalAmount"]),timeGoal=firstValue(["bmiTimeGoal"])||"weekly",targetWeight=firstNumber(["bmiTargetWeight"]);if(!Number.isFinite(weight)||!Number.isFinite(height)||weight<=0||height<=0)return;const button=byId("unitToggleBtn"),unit=(button?button.dataset.currentUnit:document.body.dataset.bmiUnit)||"si";let bmi,weightKg,heightCm,displayUnit,ratio=NaN;if("us"===unit)bmi=703*weight/(height*height),Number.isFinite(waist)&&waist>0&&(ratio=waist/height),weightKg=.45359237*weight,heightCm=2.54*height,displayUnit="lb";else{const heightM=height/100;bmi=weight/(heightM*heightM),Number.isFinite(waist)&&waist>0&&(ratio=waist/height),weightKg=weight,heightCm=height,displayUnit="kg"}let category="Normal";function displayWeightFromKg(kg){return("us"===unit?kg/.45359237:kg).toFixed(1)+" "+displayUnit}bmi<18.5?category="Underweight":bmi>=25&&bmi<30?category="Overweight":bmi>=30&&(category="Obese");const heightM=heightCm/100,healthyMinKg=18.5*heightM*heightM,healthyMaxKg=24.9*heightM*heightM,healthyRange=displayWeightFromKg(healthyMinKg)+" – "+displayWeightFromKg(healthyMaxKg);let differenceText="Inside healthy range";weightKg<healthyMinKg?differenceText="Gain about "+displayWeightFromKg(healthyMinKg-weightKg)+" to enter healthy range":weightKg>healthyMaxKg&&(differenceText="Lose about "+displayWeightFromKg(weightKg-healthyMaxKg)+" to enter healthy range");const activityFactors={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,veryActive:1.9};let caloriesMaintainText="Enter age to estimate calories/day",caloriesGainText="Enter age to estimate calories/day",caloriesLossText="Enter age to estimate calories/day";if(Number.isFinite(age)&&age>0){const maleBmr=10*weightKg+6.25*heightCm-5*age+5,femaleBmr=10*weightKg+6.25*heightCm-5*age-161;let bmr=(maleBmr+femaleBmr)/2;"male"===gender&&(bmr=maleBmr),"female"===gender&&(bmr=femaleBmr);const maintenanceCalories=Math.round(bmr*(activityFactors[activity]||activityFactors.moderate)),gainCalories=maintenanceCalories+500,lossCalories=Math.max(1200,maintenanceCalories-500);caloriesMaintainText=maintenanceCalories.toLocaleString("en-US")+" calories/day to maintain weight",caloriesGainText=gainCalories.toLocaleString("en-US")+" calories/day to add weight",caloriesLossText=lossCalories.toLocaleString("en-US")+" calories/day to lose weight"}function measurementDisplay(value){return!Number.isFinite(value)||value<=0?"Not provided":value+("us"===unit?" inch":" cm")}function toCm(value){return!Number.isFinite(value)||value<=0?NaN:"us"===unit?2.54*value:value}const waistCm=toCm(waist),wristCm=(toCm(neck),toCm(wrist)),shoulderCm=toCm(shoulder),hipCm=toCm(hip),calculatedFrameSize=function(wristCm,heightCmValue){if(!Number.isFinite(wristCm)||wristCm<=0)return"Not provided";const wristHeightRatio=wristCm/heightCmValue;return"female"===gender?wristHeightRatio<.086?"Small frame":wristHeightRatio<=.094?"Medium frame":"Large frame":wristHeightRatio<.095?"Small frame":wristHeightRatio<=.104?"Medium frame":"Large frame"}(wristCm,heightCm);let bodyFatNumber=NaN,bodyFatText="Enter age and gender to estimate body fat";const waistForNavy="us"===unit?waist:waist/2.54,neckForNavy="us"===unit?neck:neck/2.54,heightForNavy="us"===unit?height:height/2.54;if(Number.isFinite(waistForNavy)&&Number.isFinite(neckForNavy)&&Number.isFinite(heightForNavy)&&waistForNavy>neckForNavy&&neckForNavy>0&&heightForNavy>0&&("male"===gender?(bodyFatNumber=86.01*Math.log10(waistForNavy-neckForNavy)-70.041*Math.log10(heightForNavy)+36.76,bodyFatText=Math.max(0,bodyFatNumber).toFixed(1)+"% estimated body fat using waist + neck"):bodyFatText="For female Navy body-fat estimate, hip circumference is normally needed; showing BMI-age estimate instead"),!Number.isFinite(bodyFatNumber)&&Number.isFinite(age)&&age>0&&gender){bodyFatNumber=1.2*bmi+.23*age-10.8*("male"===gender?1:"female"===gender?0:.5)-5.4,bodyFatText=Math.max(0,bodyFatNumber).toFixed(1)+"% estimated body fat"}const fatDistribution=function(waistCm,hipCm,ratioValue){const waistHipRatio=Number.isFinite(waistCm)&&Number.isFinite(hipCm)&&hipCm>0?waistCm/hipCm:NaN;if(Number.isFinite(waistHipRatio)){return(("male"===gender?waistHipRatio>=.9:waistHipRatio>=.85)?"Central / abdominal fat pattern":"Lower central-fat pattern")+" (waist-to-hip ratio "+waistHipRatio.toFixed(2)+")"}return Number.isFinite(ratioValue)?ratioValue>=.5?"Central-body-fat risk pattern from waist-to-height ratio":"Lower central-fat pattern from waist-to-height ratio":"Add waist and hip to estimate fat distribution"}(waistCm,hipCm,ratio),bodyShape=function(shoulderCm,waistCm,hipCm){return!Number.isFinite(shoulderCm)||!Number.isFinite(waistCm)||!Number.isFinite(hipCm)||waistCm<=0||hipCm<=0?"Add shoulder, waist, and hip to estimate body shape":shoulderCm>=1.08*hipCm&&waistCm<=.78*shoulderCm?"Inverted triangle / V-shape":hipCm>=1.08*shoulderCm&&waistCm<=.78*hipCm?"Pear / lower-body dominant shape":Math.abs(shoulderCm-hipCm)<=Math.max(4,.06*hipCm)&&waistCm<=.78*Math.min(shoulderCm,hipCm)?"Hourglass / balanced shape":waistCm>=.9*Math.min(shoulderCm,hipCm)?"Apple / midsection-dominant shape":"Rectangle / straight balanced shape"}(shoulderCm,waistCm,hipCm),somatotypeTendency=function(bmiValue,bodyFatValue,frameSize,shoulderCm,hipCm){const broadShoulders=Number.isFinite(shoulderCm)&&Number.isFinite(hipCm)&&shoulderCm>1.05*hipCm;return bmiValue<18.5&&("Small frame"===frameSize||"Not provided"===frameSize)?"Ectomorph tendency":Number.isFinite(bodyFatValue)&&bodyFatValue>=("male"===gender?25:32)?"Endomorph tendency":bmiValue>=25&&broadShoulders&&"Small frame"!==frameSize||"Large frame"===frameSize&&broadShoulders?"Mesomorph tendency":bmiValue>=25?"Endomorph tendency":"Balanced mixed tendency"}(bmi,bodyFatNumber,calculatedFrameSize,shoulderCm,hipCm),bodyTypeComment=function(frameSize,shapeText,somatotypeText,bodyFatValue){let base="Not provided"!==frameSize?frameSize.replace(" frame","")+" frame":"Frame size not fully known";if(/ectomorph/i.test(somatotypeText)&&(base="Lean frame"),/mesomorph/i.test(somatotypeText)&&(base="Athletic / solid frame"),/endomorph/i.test(somatotypeText)&&(base="Softer / higher-storage frame"),Number.isFinite(bodyFatValue)){if(bodyFatValue<("male"===gender?14:22))return base+" with lean body-fat estimate";if(bodyFatValue>=("male"===gender?25:32))return base+" with higher body-fat estimate"}return/central|apple/i.test(shapeText)?base+" with more midsection focus":base}(calculatedFrameSize,bodyShape,somatotypeTendency,bodyFatNumber),suggestedExercise=function(somatotypeText,shapeText,fatText,categoryText){const central=/central|abdominal|apple|midsection/i.test(String(fatText)+" "+String(shapeText));return/ectomorph/i.test(somatotypeText)?"Strength training 3–4 days/week, progressive overload, compound lifts, light cardio, and enough rest for muscle gain.":/mesomorph/i.test(somatotypeText)?"Balanced plan: strength training 3 days/week, cardio 2 days/week, mobility work, and sports or circuits for conditioning.":/endomorph/i.test(somatotypeText)||central||/overweight|obese/i.test(categoryText)?"Low-impact cardio 3–5 days/week, full-body resistance training 2–3 days/week, daily walking, and core stability work.":"General fitness: full-body strength 2–3 days/week, brisk walking or cycling, stretching, and gradual weekly progression."}(somatotypeTendency,bodyShape,fatDistribution,category),suggestedFoods=function(somatotypeText,shapeText,fatText,categoryText){const central=/central|abdominal|apple|midsection/i.test(String(fatText)+" "+String(shapeText));return/ectomorph/i.test(somatotypeText)?"Focus on calorie-dense healthy foods: rice/oats/potatoes, eggs/fish/chicken/tempeh, milk/yogurt, nuts, olive oil, and regular protein meals.":/mesomorph/i.test(somatotypeText)?"Use balanced plates: lean protein, rice/potato/whole grains, vegetables, fruit, healthy fats, and limit sugary drinks.":/endomorph/i.test(somatotypeText)||central||/overweight|obese/i.test(categoryText)?"Prioritize high-protein and high-fiber meals: fish/chicken/eggs/tofu, vegetables, beans, fruit, water, and reduce fried food, sweets, and sweet drinks.":"Choose simple balanced meals: protein each meal, vegetables, whole carbohydrates, fruit, water, and controlled snack portions."}(somatotypeTendency,bodyShape,fatDistribution,category),physiqueText=bodyTypeComment,timeGoalLabels={daily:"Daily",weekly:"Weekly",monthly:"Monthly"};function goalUnitText(amount,unitValue){const cleanAmount=Number.isFinite(amount)&&amount>0?Math.round(amount):"";if(!cleanAmount)return timeGoalLabels[unitValue]||"Weekly";return cleanAmount+" "+("daily"===unitValue?"day":"monthly"===unitValue?"month":"week")+(1===cleanAmount?"":"s")}function weeklyGoalHealthText(perWeekKg,targetKg,diffKg){if(!Number.isFinite(perWeekKg)||perWeekKg<=0)return"Enter target weight and time goal to check if the weekly change is healthy";const weeklyText=displayWeightFromKg(perWeekKg)+" per week",isSafePace=perWeekKg<=1,targetInHealthyRange=Number.isFinite(targetKg)&&targetKg>=healthyMinKg&&targetKg<=healthyMaxKg,isReduction=diffKg<0;return isSafePace?isReduction&&targetInHealthyRange?weeklyText+" is healthy and the target weight lands in the healthy BMI range":isReduction&&!targetInHealthyRange&&Number.isFinite(targetKg)&&targetKg>healthyMaxKg?weeklyText+" is a safe pace, but the target is still above the healthy BMI range":Number.isFinite(targetKg)&&targetKg<healthyMinKg?weeklyText+" may not be healthy because the target is below the healthy BMI range":weeklyText+" is within a safer pace":weeklyText+" is not healthy"}let goalTimeline="Enter target weight and time goal to estimate goal timeline",goalHealthyText="Enter target weight and time goal to check if it is healthy",goalBestText="Enter target weight to see easy, ideal, and hardest safe options";if(Number.isFinite(targetWeight)&&targetWeight>0){const targetKg="us"===unit?.45359237*targetWeight:targetWeight,diffKg=targetKg-weightKg,direction=diffKg<0?"lose":"gain",diffAbsKg=Math.abs(diffKg),availableWeeks=(amount=timeGoalAmount,unitValue=timeGoal,!Number.isFinite(amount)||amount<=0?NaN:"daily"===unitValue?amount/7:"monthly"===unitValue?4.345*amount:amount);if(goalBestText=function(diffKg){if(!Number.isFinite(diffKg)||Math.abs(diffKg)<.05)return"Already at target weight";const action=diffKg<0?"loss":"gain";return"Easy: "+displayWeightFromKg(.25)+"/week "+action+", Ideal: "+displayWeightFromKg(.5)+"/week "+action+", Hardest safe: "+displayWeightFromKg(1)+"/week "+action}(diffKg),diffAbsKg<.05)goalTimeline="Already at target weight",goalHealthyText="Already at target weight";else if(Number.isFinite(availableWeeks)&&availableWeeks>0){const perWeekKg=diffAbsKg/availableWeeks;goalTimeline="To "+direction+" "+displayWeightFromKg(diffAbsKg)+" in "+goalUnitText(timeGoalAmount,timeGoal)+", aim for about "+displayWeightFromKg(perWeekKg)+" per week.",goalHealthyText=weeklyGoalHealthText(perWeekKg,targetKg,diffKg)}else{const recommendedWeeks=Math.max(1,Math.ceil(diffAbsKg/.5)),perWeekText=displayWeightFromKg(.5);goalTimeline="daily"===timeGoal?"About "+7*recommendedWeeks+" days to "+direction+" "+displayWeightFromKg(diffAbsKg)+" at ~"+perWeekText+"/week.":"monthly"===timeGoal?"About "+Math.max(1,Math.ceil(recommendedWeeks/4.345))+" months to "+direction+" "+displayWeightFromKg(diffAbsKg)+" at ~"+perWeekText+"/week.":"About "+recommendedWeeks+" weeks to "+direction+" "+displayWeightFromKg(diffAbsKg)+" at ~"+perWeekText+"/week.",goalHealthyText=weeklyGoalHealthText(.5,targetKg,diffKg)}}var amount,unitValue;let waistStatus="Enter waist to check";Number.isFinite(ratio)&&(waistStatus=ratio<.5?"Healthy":"Higher risk");let healthRisk="Average risk — use BMI with waist-to-height ratio for a better view";"Normal"===category&&(!Number.isFinite(ratio)||ratio<.5)&&(healthRisk="Lower risk range"),"Underweight"===category&&(healthRisk="Possible risks: low energy, nutrient deficiency, weaker immunity, and bone health concerns"),"Overweight"===category&&(healthRisk="Possible risks: higher blood pressure, insulin resistance, fatty liver, joint strain, and higher cholesterol"),"Obese"===category&&(healthRisk="Possible risks: type 2 diabetes, high blood pressure, heart disease, sleep apnea, fatty liver, and joint problems"),Number.isFinite(ratio)&&ratio>=.5&&(healthRisk+="; waist-to-height ratio suggests higher central-body-fat risk"),"Large frame"!==calculatedFrameSize||"Overweight"!==category&&"Obese"!==category||(healthRisk+="; larger frame may explain some weight, but health risk still depends on waist and body-fat pattern");const rows=[["BMI",bmi.toFixed(2)],["BMI category",category],["Healthy weight range",healthyRange],["Difference to healthy range",differenceText],["Calories/day to maintain",caloriesMaintainText],["Calories/day to add weight",caloriesGainText],["Calories/day to lose weight",caloriesLossText],["Body fat estimate",bodyFatText],["Body type comment",bodyTypeComment],["Frame size",calculatedFrameSize],["Fat distribution",fatDistribution],["Body shape",bodyShape],["Somatotype tendency",somatotypeTendency],["Suggested exercise",suggestedExercise],["Suggested foods",suggestedFoods],["Goal timeline",goalTimeline],["Healthy?",goalHealthyText],["Best",goalBestText],["Waist-to-height ratio",Number.isFinite(ratio)?ratio.toFixed(2):"Not provided"],["Waist-to-height status",waistStatus],["Neck circumference",measurementDisplay(neck)],["Wrist size",measurementDisplay(wrist)],["Shoulder width",measurementDisplay(shoulder)],["Hip circumference",measurementDisplay(hip)],["Health risk",healthRisk],["Unit","us"===unit?"US":"SI"],["Name",name||"Not provided"],["Age range",ageRangeLabel(age)],["Gender",(value=gender,value?String(value).charAt(0).toUpperCase()+String(value).slice(1):"Not provided")],["Activity level",{sedentary:"Sedentary",light:"Light activity",moderate:"Moderate activity",active:"Active",veryActive:"Very active"}[activity]||"Moderate activity"],["Target weight",Number.isFinite(targetWeight)&&targetWeight>0?targetWeight+" "+displayUnit:"Not provided"],["Time goal",goalUnitText(timeGoalAmount,timeGoal)]];var value;const metrics={bmi:bmi.toFixed(2),category:category,healthyRange:healthyRange,healthRisk:healthRisk,calories:caloriesMaintainText,caloriesMaintain:caloriesMaintainText,caloriesGain:caloriesGainText,caloriesLoss:caloriesLossText,bodyFat:bodyFatText,physique:physiqueText,frameSize:calculatedFrameSize,fatDistribution:fatDistribution,bodyShape:bodyShape,somatotypeTendency:somatotypeTendency,bodyTypeComment:bodyTypeComment,suggestedExercise:suggestedExercise,suggestedFoods:suggestedFoods,goalTimeline:goalTimeline,name:name||"",resultRows:rows.map(function(row){return{label:row[0],value:row[1]}})};renderResultPanel("bmi",rows),saveCurrentReport("bmi",metrics)}function calculateDiscount(){const price=firstNumber(["price","originalPrice","amount"]),discount=firstNumber(["discount","discountRate"]);if(!Number.isFinite(price)||!Number.isFinite(discount)||price<=0||discount<0||discount>100)return;const savings=price*discount/100,finalPrice=price-savings;renderResultPanel("discount",[["Original price",moneyRM(price)],["Discount",discount+"%"],["Savings",moneyRM(savings)],["Final price",moneyRM(finalPrice)]]),saveCurrentReport("discount",{finalPrice:moneyRM(finalPrice)})}function calculatePercentage(){const percentage=firstNumber(["percentage","percent"]),number=firstNumber(["number","amount","value"]);if(!Number.isFinite(percentage)||!Number.isFinite(number))return;const answer=percentage/100*number;renderResultPanel("percentage",[["Percentage",percentage+"%"],["Number",String(number)],["Answer",money(answer)]]),saveCurrentReport("percentage",{result:money(answer)})}function calculateCompound(){const principal=firstNumber(["principal","compoundPrincipal","amount"]),rate=firstNumber(["rate","compoundRate","interest","interestRate"]),years=firstNumber(["years","compoundYears","time"]),frequency=Number(firstValue(["frequency","compoundFrequency"]))||1;if(!Number.isFinite(principal)||!Number.isFinite(rate)||!Number.isFinite(years)||principal<=0||rate<0||years<=0||frequency<=0)return;const futureValue=principal*Math.pow(1+rate/100/frequency,frequency*years),compoundInterest=futureValue-principal;renderResultPanel("compound",[["Principal",moneyRM(principal)],["Annual interest rate",rate+"%"],["Years",String(years)],["Compounding frequency",String(frequency)],["Future value",moneyRM(futureValue)],["Compound interest",moneyRM(compoundInterest)]]),saveCurrentReport("compound",{futureValue:moneyRM(futureValue)})}function localTodayIsoDate(){const now=new Date;return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")}function calculateLoanPayment(principal,annualRate,months){const monthlyRate=annualRate/100/12;return 0===monthlyRate?principal/months:principal*monthlyRate*Math.pow(1+monthlyRate,months)/(Math.pow(1+monthlyRate,months)-1)}function remainingBalance(principal,annualRate,months,paidMonths,extraMonthly){const monthlyRate=annualRate/100/12,payment=calculateLoanPayment(principal,annualRate,months)+(Number(extraMonthly)||0);return 0===monthlyRate?Math.max(0,principal-payment*paidMonths):Math.max(0,principal*Math.pow(1+monthlyRate,paidMonths)-payment*((Math.pow(1+monthlyRate,paidMonths)-1)/monthlyRate))}function ensureMortgageOptionalSections(){if("loan"!==getPageType())return;const calculator=$(".calculator");if(!calculator)return;let row=$(".loan-optional-row");if(!row){row=document.createElement("div"),row.className="loan-optional-row";const calculateButton=$(".main-btn",calculator)||Array.from($$("button",calculator)).find(function(button){return lower(button.textContent).includes("calculate")});calculateButton?calculateButton.insertAdjacentElement("beforebegin",row):calculator.appendChild(row)}let optional=$(".optional-mortgage-costs");optional||(optional=document.createElement("div"),optional.className="optional-mortgage-costs",optional.innerHTML='<button type="button" class="optional-mortgage-toggle" aria-expanded="true">Optional costs</button><div class="optional-mortgage-content"><label for="propertyTaxYearly">Property tax per year:</label><input type="number" id="propertyTaxYearly" placeholder="Optional"><label for="homeInsuranceYearly">Home insurance per year:</label><input type="number" id="homeInsuranceYearly" placeholder="Optional"><label for="otherMonthlyFees">Other monthly fees:</label><input type="number" id="otherMonthlyFees" placeholder="Optional"></div>');let early=$(".early-settlement-box");early||(early=document.createElement("div"),early.className="early-settlement-box",early.innerHTML='<button type="button" class="early-settlement-toggle" aria-expanded="true">Optional early settlement</button><div class="early-settlement-content"><label for="earlySettlementMonth">Settle after month:</label><input type="number" id="earlySettlementMonth" placeholder="Optional"><label for="extraMonthlyPayment">Extra monthly payment:</label><input type="number" id="extraMonthlyPayment" placeholder="Optional"></div>');const mortgageLayout=document.querySelector(".mortgage-two-column-input-layout"),mortgageLeftColumn=mortgageLayout?mortgageLayout.querySelector(".mortgage-left-input-column"):null,mortgageRightColumn=mortgageLayout?mortgageLayout.querySelector(".mortgage-right-input-column"):null;mortgageLeftColumn&&mortgageRightColumn?(optional.parentElement!==mortgageLeftColumn&&mortgageLeftColumn.appendChild(optional),early.parentElement!==mortgageRightColumn&&mortgageRightColumn.appendChild(early)):(row.contains(optional)||row.appendChild(optional),row.contains(early)||row.appendChild(early));const hoa=byId("hoaMonthly"),other=byId("otherMonthlyFees");if(hoa&&other){!other.value&&hoa.value&&(other.value=hoa.value);const label=$('label[for="hoaMonthly"]');label&&label.remove(),hoa.remove()}}function mortgagePayoffSchedule(principal,annualRate,months,extraMonthly){const monthlyRate=annualRate/100/12,basePayment=calculateLoanPayment(principal,annualRate,months),payment=basePayment+Math.max(0,Number(extraMonthly)||0);let balance=principal,totalInterest=0,payoffMonths=0,yearPrincipal=0,yearInterest=0;const yearly=[];for(let month=1;month<=months&&balance>.005;month+=1){const interestPaid=0===monthlyRate?0:balance*monthlyRate;let principalPaid=payment-interestPaid;principalPaid<=0&&(principalPaid=0),principalPaid>balance&&(principalPaid=balance),balance=Math.max(0,balance-principalPaid),totalInterest+=interestPaid,yearPrincipal+=principalPaid,yearInterest+=interestPaid,payoffMonths=month,(month%12==0||balance<=.005||month===months)&&(yearly.push({year:Math.ceil(month/12),principal:yearPrincipal,interest:yearInterest,balance:balance}),yearPrincipal=0,yearInterest=0)}return{basePayment:basePayment,paymentWithExtra:payment,totalInterest:totalInterest,totalPaid:principal+totalInterest,payoffMonths:payoffMonths,yearly:yearly}}function mortgageSimpleBarChart(items,valueKey){const values=(items=Array.isArray(items)?items:[]).map(function(item){return Number(item[valueKey])||0}),max=Math.max.apply(Math,values.concat([1])),min=Math.min.apply(Math,values.concat([0])),range=Math.max(1,max-min);function xAt(index){return items.length<=1?275:54+index/(items.length-1)*442}function yAt(value){return 174-(value-min)/range*150}return'<div class="mortgage-line-chart-wrap"><svg class="mortgage-line-chart" viewBox="0 0 520 220" role="img" aria-label="Mortgage line graph"><line class="mortgage-line-axis" x1="54" y1="174" x2="496" y2="174"></line><line class="mortgage-line-axis" x1="54" y1="24" x2="54" y2="174"></line><polyline class="mortgage-line-path" points="'+values.map(function(value,index){return xAt(index).toFixed(2)+","+yAt(value).toFixed(2)}).join(" ")+'"></polyline>'+items.map(function(item,index){const value=values[index],x=xAt(index),y=yAt(value);return'<g class="mortgage-line-point"><circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="5"></circle><text x="'+x.toFixed(2)+'" y="202" text-anchor="middle">'+escapeHtml(item.label||"")+'</text><text x="'+x.toFixed(2)+'" y="'+Math.max(12,y-10).toFixed(2)+'" text-anchor="middle">'+escapeHtml(item.display||moneyRM(value))+"</text></g>"}).join("")+"</svg></div>"}function mortgageTable(headers,rows,className){return'<div class="mortgage-advanced-table-scroll"><table class="mortgage-advanced-table '+(className||"")+'"><thead><tr>'+headers.map(function(header){return"<th>"+escapeHtml(header)+"</th>"}).join("")+"</tr></thead><tbody>"+rows.map(function(row){return"<tr>"+row.map(function(cell){return"<td>"+escapeHtml(cell)+"</td>"}).join("")+"</tr>"}).join("")+"</tbody></table></div>"}function calculateLoan(){ensureMortgageOptionalSections();const homeNameInput=byId("homeName"),homeName=homeNameInput?String(homeNameInput.value||"").trim():"",homePrice=firstNumber(["amount","loanAmount","loanPrincipal"]),downPayment=Math.max(0,firstNumber(["downPayment"])||0),principal=Number.isFinite(homePrice)?Math.max(0,homePrice-downPayment):NaN,annualRate=firstNumber(["interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["years","loanYears","loanTerm","term"]),rawTerm=termInput?numberFromString(termInput.value):NaN;if(!Number.isFinite(homePrice)||!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||homePrice<=0||principal<=0||annualRate<0||rawTerm<=0)return;const label=termInput?getInputLabel(termInput):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm);if(!Number.isFinite(months)||months<=0)return;const startDateInput=byId("startDate");startDateInput&&!startDateInput.value&&(startDateInput.value=localTodayIsoDate());const startDate=startDateInput&&startDateInput.value?startDateInput.value:localTodayIsoDate(),taxMonthly=(firstNumber(["propertyTaxYearly"])||0)/12,insuranceMonthly=(firstNumber(["homeInsuranceYearly"])||0)/12,otherMonthly=firstNumber(["otherMonthlyFees","hoaMonthly"])||0,extraMonthly=firstNumber(["extraMonthlyPayment"])||0,incomeMonthly=firstNumber(["incomeMonthly","monthlyIncome","income"])||0,baseMonthly=calculateLoanPayment(principal,annualRate,months),principalInterestValue=baseMonthly*months,baseTotalInterest=principalInterestValue-principal,totalMonthly=baseMonthly+taxMonthly+insuranceMonthly+otherMonthly+extraMonthly,requiredIncome=totalMonthly/.28,affordability=incomeMonthly>0?totalMonthly<=.28*incomeMonthly?"Yes, based on 28% of monthly income":"No, estimated payment is above 28% of income":"Add monthly income to check affordability",schedule=mortgagePayoffSchedule(principal,annualRate,months,extraMonthly),noExtraSchedule=mortgagePayoffSchedule(principal,annualRate,months,0),extraPaidApprox=Math.max(0,extraMonthly)*Math.max(0,schedule.payoffMonths),interestSaved=Math.max(0,noExtraSchedule.totalInterest-schedule.totalInterest),noDownMonthly=calculateLoanPayment(homePrice,annualRate,months),monthlySavingsFromDownPayment=Math.max(0,noDownMonthly-baseMonthly),breakEvenMonths=downPayment>0&&monthlySavingsFromDownPayment>0?Math.ceil(downPayment/monthlySavingsFromDownPayment):null,breakEvenText=breakEvenMonths?breakEvenMonths+" months (about "+(breakEvenMonths/12).toFixed(1)+" years)":"Not available without down payment savings",yearlyRows=schedule.yearly.map(function(row){return["Year "+row.year,moneyRM(row.principal),moneyRM(row.interest),moneyRM(row.balance)]}),interestChartItems=[-2,-1,0,1,2].map(function(change){const rate=Math.max(0,annualRate+change),monthly=calculateLoanPayment(principal,rate,months);return{label:(value=rate,Number.isFinite(value)?(Math.round(100*value)/100).toFixed(2)+"%":"-"),monthly:monthly,display:moneyRM(monthly)+"/mo"};var value}),yearCompareItems=[15,20,25,30].filter(function(year,index,arr){return arr.indexOf(year)===index}).map(function(year){const monthly=calculateLoanPayment(principal,annualRate,12*year);return{label:year+" years",monthly:monthly,display:moneyRM(monthly)+"/mo"}}),rows=(function(homePrice,annualRate,months,currentDownPayment){const percents=[0,10,20,30];if(currentDownPayment>0&&homePrice>0){const currentPercent=Math.round(currentDownPayment/homePrice*1e3)/10;percents.includes(currentPercent)||percents.push(currentPercent)}percents.filter(function(percent,index,arr){return arr.indexOf(percent)===index}).sort(function(a,b){return a-b}).map(function(percent){const dp=homePrice*percent/100,principal=Math.max(0,homePrice-dp),monthly=principal>0?calculateLoanPayment(principal,annualRate,months):0,totalInterest=principal>0?monthly*months-principal:0;return[percent+"%",moneyRM(dp),moneyRM(principal),moneyRM(monthly),moneyRM(totalInterest)]})}(homePrice,annualRate,months,downPayment),[["Home name",homeName||"Not provided"],["Home price",moneyRM(homePrice)],["Down payment",moneyRM(downPayment)],["Mortgage principal",moneyRM(principal)],["Annual interest rate",annualRate.toFixed(2)+"%"],["Loan term",months+" months ("+(months/12).toFixed(1)+" years)"],["Start date",startDate],["Principal + interest value",moneyRM(principalInterestValue)],["Monthly principal + interest",moneyRM(baseMonthly)],["Total interest",moneyRM(baseTotalInterest)],["Property tax monthly",moneyRM(taxMonthly)],["Insurance monthly",moneyRM(insuranceMonthly)],["Other monthly fee",moneyRM(otherMonthly)],["Extra monthly payment",moneyRM(extraMonthly)],["Estimated total monthly payment",moneyRM(totalMonthly)],["Is this house affordable?",affordability],["Income needed to afford this",moneyRM(requiredIncome)+"/month"],["How much I am paying extra",moneyRM(extraPaidApprox)+" over estimated payoff"],["Interest saved with extra payment",moneyRM(interestSaved)],["Estimated payoff time with extra",schedule.payoffMonths+" months"],["Break even time",breakEvenText]]),settleMonth=firstNumber(["earlySettlementMonth"]);if(Number.isFinite(settleMonth)&&settleMonth>0){const paidMonths=Math.min(Math.round(settleMonth),months);rows.push(["Estimated balance after month "+paidMonths,moneyRM(remainingBalance(principal,annualRate,months,paidMonths,extraMonthly))])}const normalPayoffYears=(noExtraSchedule.payoffMonths/12).toFixed(1),extraPayoffYears=(schedule.payoffMonths/12).toFixed(1),monthsSaved=Math.max(0,noExtraSchedule.payoffMonths-schedule.payoffMonths),yearlyPaymentTotal=12*totalMonthly,loanToValue=homePrice>0?principal/homePrice*100:0,downPaymentPercent=homePrice>0?downPayment/homePrice*100:0,costToIncomePercent=incomeMonthly>0?totalMonthly/incomeMonthly*100:0,yearsFloat=months/12,inflationAdjustedTotal=principalInterestValue/Math.pow(1.03,yearsFloat),assumedRent=Number.isFinite(currentMonthlyRent)?currentMonthlyRent:.75*totalMonthly,rentSourceText=Number.isFinite(currentMonthlyRent)?"Entered current rent":"Assumed comparable rent at 75% of buy monthly cost",buyVsRentGap=totalMonthly-assumedRent,flexiSuggestedExtra=extraMonthly>0?extraMonthly:Math.min(500,Math.max(100,.05*baseMonthly)),flexiScenario=mortgagePayoffSchedule(principal,annualRate,months,flexiSuggestedExtra),islamicMonthly=baseMonthly,islamicTotalProfit=Math.max(0,islamicMonthly*months-principal),islamicTotalSalePrice=principal+islamicTotalProfit,conventionalTotalRepayment=baseMonthly*months,islamicDifferenceAmount=(Math.max(0,conventionalTotalRepayment-principal),islamicTotalSalePrice-conventionalTotalRepayment),comparisonRows=(Math.abs(islamicDifferenceAmount)<1||(islamicDifferenceAmount>0?moneyRM(islamicDifferenceAmount):moneyRM(Math.abs(islamicDifferenceAmount))),[["Current loan",annualRate.toFixed(2)+"%",months+" months",moneyRM(baseMonthly),moneyRM(baseTotalInterest)],["Rate +1%",(annualRate+1).toFixed(2)+"%",months+" months",moneyRM(calculateLoanPayment(principal,annualRate+1,months)),moneyRM(calculateLoanPayment(principal,annualRate+1,months)*months-principal)],["Rate -1%",Math.max(0,annualRate-1).toFixed(2)+"%",months+" months",moneyRM(calculateLoanPayment(principal,Math.max(0,annualRate-1),months)),moneyRM(calculateLoanPayment(principal,Math.max(0,annualRate-1),months)*months-principal)]]),loanYearRows=yearCompareItems.map(function(item){const compareMonths=12*(Number(String(item.label).replace(/[^\d.]/g,""))||0),monthly=calculateLoanPayment(principal,annualRate,compareMonths);return[item.label,moneyRM(monthly),moneyRM(monthly*compareMonths-principal),moneyRM(monthly*compareMonths)]});!function(resultHtml){const panel=getOrCreateOutputPanel("loan");if(!panel)return null;panel.className="loan-style-output-panel calculator-clean-result loan-clean-result mortgage-modern-result-panel",panel.innerHTML='<div class="mortgage-modern-result-shell">'+(resultHtml||"")+'<div class="mortgage-result-actions mortgage-result-actions-final" aria-label="Mortgage result actions"><button type="button" class="mortgage-result-action-btn mortgage-result-copy-btn">Copy</button><button type="button" class="mortgage-result-action-btn mortgage-result-save-btn">Save</button><button type="button" class="mortgage-result-action-btn mortgage-result-share-btn">Share</button><button type="button" class="mortgage-result-action-btn mortgage-result-report-btn">Report</button></div></div>';const copyBtn=panel.querySelector(".mortgage-result-copy-btn"),saveBtn=panel.querySelector(".mortgage-result-save-btn"),shareBtn=panel.querySelector(".mortgage-result-share-btn"),reportBtn=panel.querySelector(".mortgage-result-report-btn");copyBtn&&(copyBtn.onclick=function(){copyText(cleanText(panel.innerText),copyBtn)}),saveBtn&&(saveBtn.onclick=function(){downloadTextFile("mortgage-result-"+dateFileStamp()+".txt",cleanText(panel.innerText))}),shareBtn&&(shareBtn.onclick=function(){const text=cleanText(panel.innerText);navigator.share?navigator.share({title:"Mortgage result",text:text}).catch(function(){copyText(text,shareBtn)}):copyText(text,shareBtn)}),reportBtn&&(reportBtn.onclick=function(){openLatestCalculatorReport("loan",reportBtn)}),panel.hidden=!1,panel.style.setProperty("display","block","important"),panel.style.setProperty("visibility","visible","important"),hideNativeResultElements()}('<div class="mortgage-modern-output"><section class="mortgage-modern-section mortgage-breakdown-section"><h3>Monthly payment breakdown</h3>'+mortgageTable(["Payment part","Monthly value"],[["Principal + interest",moneyRM(baseMonthly)],["Property tax",moneyRM(taxMonthly)],["Insurance",moneyRM(insuranceMonthly)],["Other monthly fee",moneyRM(otherMonthly)],["Extra monthly payment",moneyRM(extraMonthly)],["Estimated total monthly payment",moneyRM(totalMonthly)]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-affordability-section"><h3>Affordability analysis</h3>'+mortgageTable(["Check","Result"],[["Is this house affordable?",affordability],["Monthly income entered",incomeMonthly>0?moneyRM(incomeMonthly):"Not provided"],["Income needed to afford this",moneyRM(requiredIncome)+"/month"],["Payment to income ratio",incomeMonthly>0?costToIncomePercent.toFixed(1)+"%":"Add income to calculate"],["Rule used","Payment should stay around 28% of monthly income"]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-insights-section"><h3>Loan insights</h3>'+mortgageTable(["Insight","Value"],[["Home price",moneyRM(homePrice)],["Down payment",moneyRM(downPayment)+" ("+downPaymentPercent.toFixed(1)+"%)"],["Loan principal",moneyRM(principal)],["Loan-to-value",loanToValue.toFixed(1)+"%"],["Principal + interest value",moneyRM(principalInterestValue)],["Total interest",moneyRM(baseTotalInterest)],["Yearly payment estimate",moneyRM(yearlyPaymentTotal)]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-extra-section"><h3>Extra payment analysis</h3>'+mortgageTable(["Extra payment item","Result"],[["Extra monthly payment",moneyRM(extraMonthly)],["Approx extra paid",moneyRM(extraPaidApprox)],["Interest saved",moneyRM(interestSaved)],["Normal payoff time",noExtraSchedule.payoffMonths+" months ("+normalPayoffYears+" years)"],["Payoff time with extra",schedule.payoffMonths+" months ("+extraPayoffYears+" years)"],["Time saved",monthsSaved+" months"]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-comparison-section"><h3>Comparison scenario</h3>'+mortgageTable(["Scenario","Rate","Term","Monthly P+I","Total interest"],comparisonRows,"mortgage-modern-table")+mortgageTable(["Loan term","Monthly P+I","Total interest","Total P+I"],loanYearRows,"mortgage-modern-table mortgage-loan-years-table")+'</section><section class="mortgage-modern-section mortgage-visual-section"><h3>Graph and visualizations</h3><div class="mortgage-modern-graph-grid"><div><h4>Different interest rates</h4>'+mortgageSimpleBarChart(interestChartItems,"monthly")+"</div><div><h4>Different loan years</h4>"+mortgageSimpleBarChart(yearCompareItems,"monthly")+"</div><div><h4>Amortization balance</h4>"+function(yearly){const items=(yearly=Array.isArray(yearly)?yearly:[]).slice(0,40).map(function(row){return{label:"Y"+row.year,balance:Number(row.balance)||0,display:moneyRM(row.balance)}});return items.length?mortgageSimpleBarChart(items,"balance"):'<p class="mortgage-chart-empty">Enter loan details to see amortization line graph.</p>'}(schedule.yearly)+'</div></div></section><section class="mortgage-modern-section mortgage-amortization-section"><h3>Amortization schedule</h3>'+mortgageTable(["Year","Principal paid","Interest paid","Remaining balance"],yearlyRows,"mortgage-modern-table mortgage-year-table")+'</section><section class="mortgage-modern-section mortgage-smart-section"><h3>Smart insight</h3>'+mortgageTable(["Smart insight","Meaning"],[["Break-even time",breakEvenText],["Best quick improvement",extraMonthly>0?"Your extra payment is reducing interest and payoff time.":"Try adding a small extra monthly payment to reduce interest."],["Main cost driver",baseTotalInterest>.5*principal?"Interest is a major part of total cost.":"Principal is the main part of total cost."],["Affordability note",affordability]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-inflation-section"><h3>Inflation adjusted analysis</h3>'+mortgageTable(["Inflation item","Estimate"],[["Assumed inflation",3..toFixed(1)+"% per year"],["Years assumed",yearsFloat.toFixed(1)+" years"],["Nominal principal + interest",moneyRM(principalInterestValue)],["Inflation-adjusted equivalent",moneyRM(inflationAdjustedTotal)],["Long-term effect","Future payments may feel cheaper if income rises with inflation."]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-rentbuy-section"><h3>Rent buy analysis</h3>'+mortgageTable(["Rent vs buy item","Estimate"],[["Estimated buy monthly cost",moneyRM(totalMonthly)],["Rent used in analysis",moneyRM(assumedRent)+"/month"],["Rent source",rentSourceText],["Buy minus rent difference",moneyRM(buyVsRentGap)+"/month"],["Simple guidance",buyVsRentGap<=0?"Buying is cheaper than rent used in the analysis.":"Buying costs more monthly than rent, but may build ownership equity."]],"mortgage-modern-table")+'</section><section class="mortgage-modern-section mortgage-flexi-section"><h3>Flexi loan analysis</h3>'+mortgageTable(["Flexi loan item","Estimate"],[["Flexible extra payment tested",moneyRM(flexiSuggestedExtra)+"/month"],["Estimated payoff time",flexiScenario.payoffMonths+" months"],["Estimated interest saved",moneyRM(Math.max(0,noExtraSchedule.totalInterest-flexiScenario.totalInterest))],["Flexi loan note","A flexi loan can help if extra deposits reduce principal or interest calculation."]],"mortgage-modern-table")+"</section></div>"),saveCurrentReport("loan",{monthlyPayment:moneyRM(baseMonthly),totalInterest:moneyRM(baseTotalInterest),totalPayment:moneyRM(principalInterestValue),affordability:affordability,incomeNeeded:moneyRM(requiredIncome),breakEvenTime:breakEvenText})}function calculatePersonalLoan(){const amount=firstNumber(["amount","loanAmount","loanPrincipal"]),annualRate=firstNumber(["interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["years","loanYears","loanTerm","term"]),rawTerm=termInput?numberFromString(termInput.value):NaN;if(!Number.isFinite(amount)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||amount<=0||annualRate<0||rawTerm<=0)return;const label=termInput?getInputLabel(termInput):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm);if(!Number.isFinite(months)||months<=0)return;const monthlyPayment=calculateLoanPayment(amount,annualRate,months),totalPayment=monthlyPayment*months,totalInterest=totalPayment-amount;renderResultPanel("personalLoan",[["Loan amount",moneyRM(amount)],["Annual interest rate",annualRate.toFixed(2)+"%"],["Loan term",months+" months"],["Monthly payment",moneyRM(monthlyPayment)],["Total interest",moneyRM(totalInterest)],["Total payment",moneyRM(totalPayment)]],'<div class="calculator-report-summary-boxes personal-loan-result-summary"><div class="calculator-report-summary-card calculator-report-monthly-card"><div class="calculator-report-summary-label">Monthly payment</div><div class="calculator-report-summary-value">'+moneyRM(monthlyPayment)+'</div></div><div class="calculator-report-summary-card calculator-report-total-card"><div class="calculator-report-summary-label">Total payment</div><div class="calculator-report-summary-value">'+moneyRM(totalPayment)+'</div></div><div class="calculator-report-summary-card calculator-report-interest-card"><div class="calculator-report-summary-label">Total interest</div><div class="calculator-report-summary-value">'+moneyRM(totalInterest)+"</div></div></div>"),saveCurrentReport("personalLoan",{monthlyPayment:moneyRM(monthlyPayment),totalInterest:moneyRM(totalInterest),totalPayment:moneyRM(totalPayment)})}function tableRows(lines){return(lines||[]).map(function(line){return"<tr><td>"+escapeHtml(line.label)+"</td><td>"+escapeHtml(line.value)+"</td></tr>"}).join("")}function cleanResultHtml(html){const template=document.createElement("template");return template.innerHTML=html||"",template.content.querySelectorAll("script, iframe, object, embed, link, meta, button, a").forEach(function(element){element.remove()}),template.content.querySelectorAll("*").forEach(function(element){Array.from(element.attributes).forEach(function(attribute){const name=attribute.name.toLowerCase(),value=String(attribute.value||"").trim().toLowerCase();(name.startsWith("on")||value.startsWith("javascript:"))&&element.removeAttribute(attribute.name)})}),template.innerHTML}function ageReportFlowHtml(rows){rows=Array.isArray(rows)?rows:[];const groups=[{title:"Birth & calendar",note:"Where the age calculation starts.",match:/name|date range|day of week born|born date in islamic|born date in chinese/i},{title:"Current age",note:"Main age values for the selected date.",match:/exact age|normal age|asian age|age in .* year|days old|seconds old/i},{title:"Birthday & milestones",note:"Upcoming birthday and important age milestones.",match:/next birthday countdown|next age live countdown|seconds to next age|retirement|legal age|leap year age/i},{title:"Life summary",note:"Estimated time already lived, slept, breathed, and heartbeats.",match:/days spent alive|estimated sleep time|breaths taken|heartbeats lived/i},{title:"Zodiac",note:"Western and Chinese zodiac details.",match:/western zodiac|chinese zodiac/i},{title:"Famous birthdays & historical event",note:"People and events connected to the same month and day.",match:/famous person|famous celebrity|famous sports star|famous historical figure|historical event/i},{title:"Space & moon view",note:"Age translated into planet years and moon cycles.",match:/age on other planets|moon cycles experienced/i}],used=new Set;function makeStep(group,groupRows,index){return groupRows.length?'<section class="age-report-flow-step"><div class="age-report-flow-number">'+(index+1)+'</div><div class="age-report-flow-content"><h3>'+escapeHtml(group.title)+"</h3><p>"+escapeHtml(group.note)+'</p><div class="calculator-report-table-scroll"><table class="age-report-flow-table"><tbody>'+tableRows(groupRows)+"</tbody></table></div></div></section>":""}let html=groups.map(function(group,index){return makeStep(group,function(group){return rows.filter(function(row,index){if(!row||used.has(index))return!1;const label=String(row.label||"");return!!group.match.test(label)&&(used.add(index),!0)})}(group),index)}).join("");const remaining=rows.filter(function(row,index){return row&&!used.has(index)});return remaining.length&&(html+=makeStep({title:"Other details",note:"Additional age information.",match:/.*/},remaining,groups.length)),'<div class="age-report-flow">'+html+"</div>"}function bmiReportFlowHtml(rows){function label(row){return String((Array.isArray(row)?row[0]:row.label)||"")}function tableRowsFor(groupRows){return groupRows.map(function(row){return"<tr><th>"+escapeHtml(label(row))+"</th><td>"+escapeHtml(function(row){return String((Array.isArray(row)?row[1]:row.value)||"")}(row))+"</td></tr>"}).join("")}rows=Array.isArray(rows)?rows:[];const used=new Set;function makeStep(group,groupRows){return groupRows.length?'<section class="bmi-report-flow-step"><div class="bmi-report-flow-head"><h3>'+escapeHtml(group.title)+"</h3><p>"+escapeHtml(group.note)+'</p></div><div class="calculator-report-table-scroll"><table class="bmi-report-flow-table"><tbody>'+tableRowsFor(groupRows)+"</tbody></table></div></section>":""}let html=[{title:"1. BMI summary",note:"Main BMI reading and category.",match:/^BMI$|^BMI category$|^Difference to healthy range$/i},{title:"2. Health overview",note:"Healthy range, waist check, and risk summary.",match:/Healthy weight range|Health risk|Waist-to-height ratio|Waist-to-height status|Neck circumference|Wrist size|Shoulder width|Hip circumference/i},{title:"3. Calories & body composition",note:"Daily calorie estimate and body fat estimate.",match:/Calories\/day|Body fat estimate|Body type comment|Frame size|Fat distribution|Body shape|Somatotype tendency|Suggested exercise|Suggested foods|Physique \/ body type/i},{title:"4. Goal planning",note:"Target weight and estimated timeline.",match:/Goal timeline|Healthy\?|Best|Target weight|Time goal/i},{title:"5. Input profile",note:"Profile details used for the calculation.",match:/Unit|Name|Age range|Gender|Activity level/i}].map(function(group){return makeStep(group,function(group){return rows.filter(function(row,index){return!(!row||used.has(index)||!group.match.test(label(row))||(used.add(index),0))})}(group))}).join("");const remaining=rows.filter(function(row,index){return row&&!used.has(index)});return remaining.length&&(html+=makeStep({title:"6. Other details",note:"Additional BMI information.",match:/.*/},remaining)),'<div class="bmi-report-flow">'+html+"</div>"}function reportResultHtml(report){if(report&&"loan"===report.type)return function(report){const template=document.createElement("template");template.innerHTML=cleanResultHtml(report?report.resultHtml:""),template.content.querySelectorAll(".mortgage-modern-result-title, .loan-panel-title").forEach(function(title){/^result$/i.test(cleanText(title.textContent))&&title.remove()});const shell=template.content.querySelector(".mortgage-modern-result-shell");return shell?shell.innerHTML:template.innerHTML}(report);if(report&&"age"===report.type){if(Array.isArray(report.resultLines)&&report.resultLines.length)return ageReportFlowHtml(report.resultLines);if(report.metrics&&Array.isArray(report.metrics.resultRows)&&report.metrics.resultRows.length)return ageReportFlowHtml(report.metrics.resultRows)}if(report&&"bmi"===report.type){if(Array.isArray(report.resultLines)&&report.resultLines.length)return bmiReportFlowHtml(report.resultLines);if(report.metrics&&Array.isArray(report.metrics.resultRows)&&report.metrics.resultRows.length)return bmiReportFlowHtml(report.metrics.resultRows)}return cleanResultHtml(report?report.resultHtml:"")}function renderReportPage(report){document.body.classList.add("calculator-report-view","mortgage-report-clean-view"),$$(".calculator, .history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box, .instruction-box, .pc-what-slot, .instruction-what-box, #pcHelpQuestionButton, #pcQuestionOverlayButton, #universalLoanStyleOutput, #loanExternalOutput, #personalLoanExternalOutput, .calculator-clean-result, .age-clean-result, .age-point-output, #ageResult").forEach(function(element){element.style.setProperty("display","none","important")});const old=byId("calculatorReportPage");old&&old.remove();const section=document.createElement("section");section.id="calculatorReportPage",section.className="calculator-report-page mortgage-fast-report-page",section.innerHTML="<h1>"+escapeHtml({age:"Age Report",bmi:"BMI Report",loan:"Mortgage Report",personalLoan:"Personal Loan Report",discount:"Discount Report",percentage:"Percentage Report",compound:"Compound Interest Report"}[report.type]||"Calculator Report")+'</h1><p class="calculator-report-date"><strong>Generated:</strong> '+escapeHtml(report.createdAt||"")+"</p>"+function(report){return["loan","personalLoan"].includes(report.type)&&report.metrics?'<div class="calculator-report-summary-boxes"><div class="calculator-report-summary-card calculator-report-monthly-card"><div class="calculator-report-summary-label">Monthly payment</div><div class="calculator-report-summary-value">'+escapeHtml(report.metrics.monthlyPayment||"-")+'</div></div><div class="calculator-report-summary-card calculator-report-interest-card"><div class="calculator-report-summary-label">Total interest</div><div class="calculator-report-summary-value">'+escapeHtml(report.metrics.totalInterest||"-")+'</div></div><div class="calculator-report-summary-card calculator-report-total-card"><div class="calculator-report-summary-label">Total payment</div><div class="calculator-report-summary-value">'+escapeHtml(report.metrics.totalPayment||"-")+"</div></div></div>":""}(report)+'<div class="calculator-report-card"><h2>Inputs</h2><div class="calculator-report-table-scroll"><table><tbody>'+tableRows(report.inputLines)+'</tbody></table></div></div><div class="calculator-report-card"><div class="calculator-report-result">'+reportResultHtml(report)+'</div></div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn calculator-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn calculator-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn calculator-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn calculator-report-share-btn">Share report</button></div>';($("main")||document.body).insertAdjacentElement("afterbegin",section);const backButton=$(".calculator-report-back-btn",section);backButton&&(backButton.onclick=function(){window.location.href=window.location.href.split("#")[0]});const copyButton=$(".calculator-report-copy-btn",section);copyButton&&(copyButton.onclick=function(){copyText(cleanText(section.innerText),copyButton)});const saveButton=$(".calculator-report-save-btn",section);saveButton&&(saveButton.onclick=function(){!function(section,button){const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Calculator Report</title><style>body{margin:0;background:#f6f8f4;font-family:Inter,Segoe UI,Arial,sans-serif;padding:24px;color:#24342d}.report{box-sizing:border-box;max-width:1100px;margin:0 auto;padding:28px;background:#fff;border:1px solid #d8e4dc;border-radius:22px;box-shadow:0 18px 44px rgba(35,49,41,.10)}h1{margin:0 0 8px;color:#143b32;font-size:32px;line-height:1.12}h2{margin:22px 0 12px;color:#143b32;font-size:22px}.calculator-report-card{margin-top:18px;padding:20px;background:#fbfcfa;border:1px solid #dce7df;border-radius:18px}.calculator-report-result{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.calculator-report-table-scroll{width:100%;overflow-x:auto;border:1px solid #dce7df;border-radius:14px;background:#fff}table{width:100%;min-width:520px;border-collapse:collapse;background:#fff}td,th{border-bottom:1px solid #e3ece6;padding:12px 14px;text-align:left;vertical-align:top;line-height:1.45}th,tr:first-child td:first-child{background:#eef6f2;color:#143b32;font-weight:850}.calculator-report-summary-boxes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:18px 0}.calculator-report-summary-card{padding:16px;background:#f4faf6;border:1px solid #d4e5db;border-radius:16px}.calculator-report-summary-label{color:#64796f;font-weight:760}.calculator-report-summary-value{color:#123c34;font-size:24px;font-weight:900}.age-report-flow,.bmi-report-flow{display:grid;gap:14px}.age-report-flow-step,.bmi-report-flow-step{display:grid;grid-template-columns:48px 1fr;gap:14px;padding:16px;background:#fff;border:1px solid #dce7df;border-radius:16px}.age-report-flow-number{display:grid;place-items:center;width:42px;height:42px;color:#fff;background:#2c6a5b;border-radius:12px;font-weight:900}.bmi-report-flow-step{grid-template-columns:1fr}.calculator-report-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:20px}.calculator-report-action-btn{min-height:48px;color:#fff;background:#2c6a5b;border:1px solid #2c6a5b;border-radius:12px;font-weight:850}@media(max-width:700px){body{padding:12px}.report{padding:16px;border-radius:16px}.calculator-report-summary-boxes,.calculator-report-actions{grid-template-columns:1fr}.age-report-flow-step{grid-template-columns:1fr}table{min-width:420px}}</style></head><body><div class="report">'+section.innerHTML+"</div></body></html>",blob=new Blob([html],{type:"text/html;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download="calculator-report.html",document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},500),setButtonState(button,"Saved!")}(section,saveButton)});const shareButton=$(".calculator-report-share-btn",section);shareButton&&(shareButton.onclick=function(){!function(section,button){const url=window.location.href;navigator.share?navigator.share({title:"Calculator Report",text:cleanText(section.innerText).slice(0,500),url:url}).catch(function(){copyText(url,button)}):copyText(url,button)}(section,shareButton)})}function openReportFromHash(){if(!window.location.hash.startsWith("#calc-report="))return!1;try{return renderReportPage(JSON.parse(function(text){const normal=String(text||"").replace(/-/g,"+").replace(/_/g,"/"),padded=normal+"===".slice((normal.length+3)%4),binary=atob(padded),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i+=1)bytes[i]=binary.charCodeAt(i);return(new TextDecoder).decode(bytes)}(window.location.hash.replace("#calc-report=","")))),!0}catch(error){return console.error("Could not open report",error),!1}}const PAGE_DATA={basic:{what:"Use this for quick everyday maths such as addition, subtraction, multiplication, division, powers, and square root.",how:"Type or tap the numbers, choose the operator, then press =. Use AC to clear and ← to delete one character.",formula:"It follows the normal order of operations: brackets and powers first, then multiplication/division, then addition/subtraction.",example:"8 + 2 × 3 = 14 because multiplication is calculated before addition.",references:[["Order of operations","Standard arithmetic uses a fixed order so calculations are consistent.","https://www.purplemath.com/modules/orderops.htm"],["General note","For important money, school, or work calculations, recheck the result with your own records."]]},scientific:{what:"Use this for advanced maths such as powers, roots, trigonometry, logarithms, brackets, and scientific notation.",how:"Enter the expression carefully, check brackets, then calculate. Use the clear/delete buttons if you make a mistake.",formula:"Scientific functions follow standard calculator conventions. Trigonometry uses the selected angle mode when available.",example:"sqrt(144) gives 12. sin(30°) gives 0.5 when degree mode is used.",references:[["Scientific calculator functions","Use standard math references for trigonometry, logarithms, roots, and powers.","https://en.wikipedia.org/wiki/Scientific_calculator"],["General note","Make sure you use the correct angle mode for trigonometry questions."]]},percentage:{what:"Use this to find a percentage of a number, such as discounts, marks, commissions, and simple ratios.",how:"Enter the percentage and the number. The result updates automatically when enough information is entered.",formula:"Result = percentage ÷ 100 × number.",example:"20% of 150 = 30.",references:[["Percentage meaning","A percentage means a value expressed out of 100.","https://en.wikipedia.org/wiki/Percentage"],["General note","For taxes, fees, and financial decisions, confirm the exact percentage rule with the official provider."]]},unitConverter:{what:"Use this to convert common units such as length, weight, temperature, area, volume, and speed.",how:"Choose the unit type, enter the value, choose the starting unit and target unit, then read the converted result.",formula:"The calculator uses fixed conversion factors between supported units. Temperature conversions also include an offset.",example:"1 kilometre = 1000 metres. 1 inch = 2.54 centimetres.",references:[["Unit conversion","NIST provides reference information for SI units and conversion factors.","https://www.nist.gov/pml/owm/metric-si/si-units"],["General note","For medical, engineering, or legal measurements, always confirm the required unit standard."]]},age:{what:"Use this to calculate age from a birth date, including years, months, days, birthday countdown, and related age details.",how:"Enter the birth date. Add a target date if you want age on a specific day instead of today.",formula:"Age is calculated by comparing the birth date with the target date and counting completed years, months, and days.",example:"A person born on 15 January 2000 can see exact age, next birthday countdown, and days lived.",references:[["Age calculation","Age is commonly calculated by comparing a date of birth with the current or target date.","https://support.microsoft.com/en-us/office/calculate-age-113d599f-5fea-448f-a4c3-268927911b37"],["General note","Legal age rules can differ by country, state, or institution. Confirm with the relevant authority."]]},bmi:{what:"Use this to estimate Body Mass Index and waist-to-height ratio from your height, weight, and optional body details.",how:"Choose SI or US units, enter weight and height, then optionally add waist, age, gender, activity level, and target weight.",formula:"SI BMI = weight kg ÷ height m². US BMI = weight lb ÷ height in² × 703. Waist-to-height ratio = waist ÷ height.",example:"70 kg and 170 cm gives a BMI of about 24.2.",references:[["BMI formula","CDC lists metric and US BMI formulas and explains BMI as a screening measure.","https://www.cdc.gov/growth-chart-training/hcp/using-bmi/body-mass-index.html"],["Health note","BMI is only a screening estimate and is not a medical diagnosis. Speak with a health professional for personal advice."]]},salary:{what:"Use this to estimate gross salary, deductions, net monthly salary, and estimated yearly take-home income.",how:"Enter gross salary and optional deductions such as EPF, SOCSO, tax, or other monthly deductions.",formula:"Net salary = gross salary − total deductions.",example:"If gross salary is RM 5,000 and deductions are RM 800, estimated net salary is RM 4,200.",references:[["Salary estimate","Use your payslip, employment contract, and official deduction rates for accurate salary information."],["General note","This calculator is an estimate only and may not include every allowance, deduction, tax rule, or employer policy."]]},gajiPenjawatAwam:{what:"Use this to estimate Malaysian public-sector salary based on basic pay and common allowance/deduction inputs.",how:"Enter basic salary, allowances, and deductions. Review the estimated gross and net salary output.",formula:"Estimated net salary = basic salary + allowances − deductions.",example:"If salary plus allowances is RM 4,000 and deductions are RM 500, estimated net salary is RM 3,500.",references:[["Official salary information","Refer to official government circulars, JPA information, payslips, and department rules for accurate values.","https://www.jpa.gov.my/"],["General note","This calculator is only an estimate and does not replace official salary statements."]]},tax:{what:"Use this to estimate tax from income and deduction inputs.",how:"Enter annual income and any supported deduction or relief fields. Review the estimated taxable amount and tax output.",formula:"Estimated tax is calculated from taxable income after supported deductions, using the calculator’s included rate assumptions.",example:"If income is RM 60,000 and deductions are RM 10,000, the calculator estimates tax from RM 50,000 taxable income.",references:[["Official tax rules","Always confirm current tax rates, reliefs, and filing rules with LHDN or your local tax authority.","https://www.hasil.gov.my/"],["General note","Tax rules change over time. This calculator is for planning only, not official tax advice."]]},currencyConverter:{what:"Use this to convert an amount from one currency to another using the exchange rate entered in the form.",how:"Enter the amount, choose the from/to currencies, and enter or confirm the exchange rate.",formula:"Converted amount = original amount × exchange rate.",example:"If RM 100 is converted at a rate of 0.21, the result is 21 in the target currency.",references:[["Exchange rates","Exchange rates change often. Confirm live rates with your bank, payment provider, or central bank.","https://www.bnm.gov.my/exchange-rates"],["General note","Real conversions may include spread, fees, transfer charges, or card provider rates."]]},discount:{what:"Use this to calculate the final price after a discount and the amount you save.",how:"Enter the original price and discount percentage. The result updates automatically.",formula:"Savings = original price × discount ÷ 100. Final price = original price − savings.",example:"If the price is 100 and the discount is 20%, savings are 20 and final price is 80.",references:[["Discount formula","A percentage discount removes a percentage of the original price.","https://www.calculator.net/"],["General note","For shopping, check whether tax, shipping, service fee, or voucher conditions apply."]]},inflation:{what:"Use this to estimate how inflation changes buying power or future cost over time.",how:"Enter the starting amount, inflation rate, and number of years.",formula:"Future value = present value × (1 + inflation rate) ^ years.",example:"RM 1,000 at 3% inflation for 5 years becomes about RM 1,159.",references:[["Inflation estimate","Inflation is usually measured with price indexes and can vary by country and time period.","https://www.bnm.gov.my/"],["General note","This is a simplified estimate. Real inflation differs by item, location, and year."]]},compound:{what:"Use this to estimate how money grows when interest is added repeatedly over time.",how:"Enter principal, annual rate, time, and compounding frequency. Then calculate the future value and interest earned.",formula:"A = P(1 + r/n)^(nt). Compound interest = A − P.",example:"P = 1000, r = 5%, t = 10 years, n = monthly gives a future value of about 1647.01.",references:[["Compound interest","The standard compound interest formula uses principal, rate, time, and compounding frequency.","https://www.investopedia.com/terms/c/compoundinterest.asp"],["General note","Actual investment returns, fees, taxes, and bank rules can change the final result."]]},loan:{what:"Use this to estimate home loan monthly payment, total interest, total payment, and optional home ownership costs.",how:"Enter property/loan amount, interest rate, term, and any optional taxes, insurance, fees, extra payment, or settlement details.",formula:"Monthly payment = P × r × (1+r)^n ÷ ((1+r)^n − 1), where r is monthly interest rate and n is number of monthly payments.",example:"A RM 300,000 mortgage at 4% yearly for 360 months gives an estimated monthly payment using the amortization formula.",references:[["Mortgage formula","Mortgage estimates normally use loan amount, interest rate, and loan term.","https://www.investopedia.com/mortgage-calculator-5084794"],["General note","Real mortgage offers depend on bank approval, fees, insurance, legal cost, and property rules."]]},personalLoan:{what:"Use this to estimate personal loan monthly instalment, total interest, and total repayment.",how:"Enter loan amount, annual interest rate, and loan term in months.",formula:"Monthly payment = P × r × (1+r)^n ÷ ((1+r)^n − 1), where r is monthly interest rate and n is number of payments.",example:"A RM 10,000 loan at 5% yearly for 60 months gives an estimated monthly payment using the amortization formula.",references:[["Amortized loan","Many fixed-payment loans are estimated with an amortization formula.","https://www.investopedia.com/terms/a/amortized_loan.asp"],["General note","The bank’s actual repayment may include fees, insurance, stamp duty, or different rate rules."]]},loanComparison:{what:"Use this to compare two loan options side by side and see which one may cost less overall.",how:"Enter the shared loan amount, then enter rate and term details for option A and option B.",formula:"Each loan option uses the amortized payment formula, then compares monthly payment and total interest.",example:"Compare a 5-year loan at 6% with a 7-year loan at 5.5% to see the payment and interest difference.",references:[["Loan comparison","Loan cost depends on rate, term, principal, fees, and payment schedule."],["General note","Always compare effective interest rate, fees, penalties, insurance, and total repayment from the lender."]]},debtPayoff:{what:"Use this to estimate how long it may take to pay off a debt and how much interest may be paid.",how:"Enter debt balance, interest rate, and monthly payment.",formula:"The calculator estimates repayment by applying interest and subtracting your monthly payment until the balance reaches zero.",example:"If your balance is RM 5,000 and you pay RM 500 monthly, the calculator estimates payoff time and interest.",references:[["Debt repayment","Debt payoff depends on balance, rate, payment amount, and fees."],["General note","Minimum payments can extend payoff time. Confirm exact repayment details with your lender or card issuer."]]},creditCardPayoff:{what:"Use this to estimate how long it may take to pay off a credit-card balance.",how:"Enter card balance, APR, and planned monthly payment.",formula:"The calculator applies monthly interest from APR, subtracts your payment, and estimates the months to payoff.",example:"A RM 3,000 balance at 18% APR with RM 300 monthly payment estimates payoff time and interest.",references:[["Credit card payoff","APR, balance, fees, and payment amount affect credit-card payoff time."],["General note","Actual card interest can differ because of billing cycles, late fees, cash advances, and minimum payment rules."]]},creditCardInterest:{what:"Use this to estimate credit-card interest for a balance over a selected number of days.",how:"Enter card balance, APR, and the number of days interest is charged.",formula:"Estimated interest = balance × APR ÷ 100 × days ÷ 365.",example:"RM 2,000 at 18% APR for 30 days gives about RM 29.59 interest.",references:[["Credit card interest","Card interest can use daily periodic rates and billing-cycle rules."],["General note","Check your card statement or issuer terms for the exact interest method, grace period, and fees."]]},rentalYield:{what:"Use this to estimate rental yield from property price and rent.",how:"Enter property price, monthly rent, and optional annual costs if available.",formula:"Gross rental yield = yearly rent ÷ property price × 100. Net yield also subtracts supported costs.",example:"RM 2,000 monthly rent is RM 24,000 yearly. If property price is RM 500,000, gross yield is 4.8%.",references:[["Rental yield","Rental yield compares annual rent with property price."],["General note","Real returns may include vacancy, maintenance, assessment, management fee, tax, insurance, and financing cost."]]},fuelCost:{what:"Use this to estimate trip fuel cost from distance, vehicle fuel efficiency, and fuel price.",how:"Enter trip distance, fuel consumption/efficiency, and fuel price.",formula:"Fuel used = distance ÷ efficiency. Fuel cost = fuel used × fuel price. The exact formula depends on the selected efficiency unit.",example:"A 200 km trip at 10 km/L uses about 20 L. If fuel is RM 2.05/L, cost is about RM 41.",references:[["Fuel cost estimate","Fuel cost depends on distance, vehicle efficiency, traffic, driving style, and fuel price."],["General note","Actual cost may change with route, tyre pressure, load, road conditions, and fuel-price changes."]]}};function makeInfoBox(className,title,text){const box=document.createElement("div");return box.className=className,box.innerHTML="<h3>"+escapeHtml(title)+"</h3><p>"+escapeHtml(text)+"</p>",box}function buildInstructionLayout(){const type=function(){const path=pathText(),bodyPage=document.body&&document.body.dataset?String(document.body.dataset.page||"").toLowerCase():"";return path.includes("credit-card-interest-calculator")||"creditcardinterest"===bodyPage?"creditCardInterest":path.includes("credit-card-payoff-calculator")||"creditcardpayoff"===bodyPage?"creditCardPayoff":path.includes("loan-comparison-calculator")||"loancomparison"===bodyPage?"loanComparison":path.includes("debt-payoff-calculator")||"debtpayoff"===bodyPage?"debtPayoff":path.includes("personal-loan-calculator")||"personal-loan"===bodyPage?"personalLoan":path.includes("gaji-penjawat-awam-calculator")||"gajipenjawatawam"===bodyPage?"gajiPenjawatAwam":path.includes("currency-converter")||"currencyconverter"===bodyPage?"currencyConverter":path.includes("unit-converter-calculator")||"unitconverter"===bodyPage?"unitConverter":path.includes("rental-yield-calculator")||"rentalyield"===bodyPage?"rentalYield":path.includes("fuel-cost-calculator")||"fuelcost"===bodyPage?"fuelCost":path.includes("salary-calculator")||"salary"===bodyPage?"salary":path.includes("scientific-calculator")||"scientific"===bodyPage?"scientific":path.includes("tax-calculator")||"tax"===bodyPage?"tax":path.includes("inflation-calculator")||"inflation"===bodyPage?"inflation":getPageType()}(),data=PAGE_DATA[type],main=$("main");if(!main||!data||!$(".calculator",main)||main.classList.contains("calculator-box"))return;if($$(":scope > .universal-help-panel",main).length)return;main.classList.add("has-instructions"),$$(":scope > .instruction-box, :scope > .pc-what-slot, :scope > .extra-help-question-button",main).forEach(function(element){element.remove()});const box=document.createElement("aside");box.className="instruction-box universal-help-panel",box.setAttribute("aria-label","Instructions and references"),box.appendChild(makeInfoBox("instruction-section instruction-what-box","What does this calculator do?",data.what));const title=document.createElement("h2");title.className="instruction-main-title",title.textContent="Instructions",box.appendChild(title),box.appendChild(makeInfoBox("instruction-section instruction-how-box","How to use it",data.how)),box.appendChild(makeInfoBox("instruction-section instruction-formula-box","Formula used",data.formula)),box.appendChild(makeInfoBox("instruction-section instruction-example-box","Example calculation",data.example)),box.appendChild(function(type){const items=function(type){return{basic:[["Can I paste numbers into the display?","Yes. You can paste a number or expression into the display, then press Enter or = to calculate."],["Does it follow normal math order?","Yes. Brackets and powers are handled before multiplication, division, addition, and subtraction."],["Can I use square root?","Yes. Use the square root button or paste a square-root expression supported by the calculator."]],age:[["Why is exact age different from normal age?","Exact age breaks your age into years, months, days, hours, and minutes. Normal age usually counts full completed years only."],["What does next birthday countdown mean?","It shows how much time is left until your next birthday or upcoming age."],["Are famous birthdays and historical events exact?","They are helpful reference items based on the selected date, but they should be treated as general information."]],bmi:[["Is BMI a diagnosis?","No. BMI is a screening estimate. It does not replace advice from a doctor or health professional."],["Why add waist-to-height ratio?","Waist-to-height ratio gives extra context about body fat distribution and possible health risk."],["What does goal timeline mean?","It estimates how fast you may need to lose or gain weight based on your target weight and selected time goal."]],loan:[["Is this a mortgage approval result?","No. It is an estimate only. Banks may use credit score, debt commitments, income proof, property type, and other rules."],["What is included in monthly payment?","The calculator can include principal, interest, property tax, insurance, other monthly fees, and extra payments when provided."],["Why do results change when I add extra payment?","Extra payment can reduce remaining principal faster, which may reduce total interest and shorten the payoff time."]],personalLoan:[["Is this the bank’s final monthly payment?","No. It is an estimate. The real payment may include bank fees, insurance, taxes, or different interest rules."],["What loan details are needed?","Loan amount, interest rate, and loan term are the main inputs needed for the estimate."],["What does total interest mean?","It is the estimated interest paid over the full loan term if payments follow the schedule."]],discount:[["What is final price?","Final price is the original price minus the discount amount."],["What is savings?","Savings is the amount removed from the original price by the discount."],["Can I use this for sale items?","Yes. Enter the original price and discount percentage to estimate the sale price."]],percentage:[["What does percentage of a number mean?","It means finding a part of a number based on a value out of 100."],["Example: what is 20% of 150?","20% of 150 is 30 because 20 ÷ 100 × 150 = 30."],["Can I use decimals?","Yes. Decimal percentages and decimal numbers can be used."]],compound:[["What is compound interest?","Compound interest means interest is added to the balance, then future interest is calculated on the new larger balance."],["What does compounding frequency mean?","It means how often interest is added, such as yearly, monthly, or daily."],["Why is compound interest different from simple interest?","Simple interest is calculated only on the original principal. Compound interest grows on both principal and accumulated interest."]]}[type]||[]}(type),box=document.createElement("section");if(box.className="instruction-section instruction-faq-box",box.innerHTML="<h3>FAQs</h3>",!items.length)return box.innerHTML+="<p>No FAQs available for this calculator yet.</p>",box;const list=document.createElement("div");return list.className="calculator-faq-list",items.forEach(function(item,index){const details=document.createElement("details");details.className="calculator-faq-item",0===index&&(details.open=!0);const summary=document.createElement("summary");summary.textContent=item[0];const answer=document.createElement("p");answer.textContent=item[1],details.appendChild(summary),details.appendChild(answer),list.appendChild(details)}),box.appendChild(list),box}(type));const referenceBox=document.createElement("section");referenceBox.className="reference-box",referenceBox.innerHTML='<h2 class="reference-main-title">References</h2><div class="reference-scroll"></div>';const scroll=$(".reference-scroll",referenceBox);data.references.forEach(function(item){const card=document.createElement("div");card.className="reference-card",card.innerHTML="<h3>"+escapeHtml(item[0])+"</h3><p>"+escapeHtml(item[1])+'</p><a href="'+escapeHtml(item[2])+'" target="_blank" rel="noopener noreferrer">Open source</a>',scroll.appendChild(card)}),box.appendChild(referenceBox),main.appendChild(box)}function readyToCalculate(type){return"age"===type?!!firstValue(["birthdate"]):"bmi"===type?!!firstValue(["weight","bmiWeight"])&&!!firstValue(["height","bmiHeight"]):"loan"===type||"personalLoan"===type?!!firstValue(["amount","loanAmount","loanPrincipal"])&&!!firstValue(["interest","loanRate","interestRate","annualRate"])&&!!firstValue(["years","loanYears","loanTerm","term"]):"discount"===type?!!firstValue(["price","originalPrice","amount"])&&!!firstValue(["discount","discountRate"]):"percentage"===type?!!firstValue(["percentage","percent"])&&!!firstValue(["number","amount","value"]):"compound"===type&&(!!firstValue(["principal","compoundPrincipal","amount"])&&!!firstValue(["rate","compoundRate","interest","interestRate"])&&!!firstValue(["years","compoundYears","time"]))}function scheduleAutoCalculate(){const type=getPageType();isReportType(type)&&(clearTimeout(autoTimer),autoTimer=setTimeout(function(){if(readyToCalculate(type)&&!autoRunning){autoRunning=!0;try{!function(type){"age"===type?calculateAge():"bmi"===type?calculateBMI():"loan"===type?calculateLoan():"personalLoan"===type?calculatePersonalLoan():"discount"===type?calculateDiscount():"percentage"===type?calculatePercentage():"compound"===type&&calculateCompound()}(type)}finally{setTimeout(function(){autoRunning=!1},120)}}},2e3))}function hideCalculateButtons(){isReportType(getPageType())&&$$(".calculator button, main button").forEach(function(button){(function(button){if(!button)return!1;if(button.closest("#navbar"))return!1;if(button.closest(".history, .age-history-box, .bmi-history-box, .discount-history-box, .loan-history-box, .percentage-history-box, .compound-history-box"))return!1;if(button.closest(".calculator-report-actions"))return!1;const text=lower(button.textContent),id=lower(button.id||""),onclick=lower(button.getAttribute("onclick")||"");return"unittogglebtn"!==id&&!/clear|copy|save|share|back|optional|settlement/.test(text)&&(text.includes("calculate")||id.includes("calculate")||onclick.includes("calculate"))})(button)&&(button.style.setProperty("display","none","important"),button.setAttribute("aria-hidden","true"),button.tabIndex=-1)})}function fallbackCopy(text){const textarea=document.createElement("textarea");textarea.value=text,textarea.style.position="fixed",textarea.style.left="-9999px",textarea.style.top="-9999px",document.body.appendChild(textarea),textarea.focus(),textarea.select(),document.execCommand("copy"),textarea.remove()}async function copyText(text,button){const value=String(text||"").trim();if(value)try{navigator.clipboard&&window.isSecureContext?await navigator.clipboard.writeText(value):fallbackCopy(value),setButtonState(button,"Copied!")}catch{try{fallbackCopy(value),setButtonState(button,"Copied!")}catch{setButtonState(button,"Failed")}}}function setButtonState(button,text){if(!button)return;const old=button.dataset.originalText||button.textContent||"Copy";button.dataset.originalText=old,button.textContent=text,setTimeout(function(){button.textContent=old},1100)}function init(){if(function(){const type=getPageType();type&&(["basic-page","age-page","bmi-page","loan-page","personal-loan-page","discount-page","percentage-page","compound-page"].forEach(function(className){document.body.classList.remove(className)}),document.body.classList.add("personalLoan"===type?"personal-loan-page":type+"-page"),document.body.dataset.page="personalLoan"===type?"personal-loan":type)}(),openReportFromHash())return;buildInstructionLayout(),$$("input[type='number']").forEach(function(input){input.setAttribute("inputmode","decimal"),input.dataset.numberOnlyReady||(input.dataset.numberOnlyReady="true",input.addEventListener("keydown",function(event){["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Home","End"].includes(event.key)||event.ctrlKey||event.metaKey||/^[0-9]$/.test(event.key)||("."!==event.key||input.value.includes("."))&&event.preventDefault()}),input.addEventListener("input",function(){let value=input.value.replace(/[^0-9.]/g,"");const parts=value.split(".");parts.length>2&&(value=parts[0]+"."+parts.slice(1).join("")),input.value=value}))}),document.addEventListener("keydown",function(event){if("basic"!==getPageType())return;if(!getDisplay())return;const target=event.target;if(target&&target.closest&&target.closest(".site-search"))return;if(target&&"display"!==target.id&&(target.matches&&target.matches("input, textarea, select")||target.isContentEditable))return;const key=event.key,lowerKey=key.toLowerCase();return/^[0-9]$/.test(key)?(add(key),void flashButton(key)):"."===key?(add("."),void flashButton(".")):["+","-"].includes(key)?(add(key),void flashButton(key)):"*"===key||"x"===lowerKey?(add("*"),void flashButton("*")):"/"===key?(event.preventDefault(),add("/"),void flashButton("/")):"Enter"===key||"="===key?(event.preventDefault(),calculate(),void flashButton("=")):"Backspace"===key?(event.preventDefault(),removeLast(),void flashButton("←")):"Delete"===key||"Escape"===key?(event.preventDefault(),clearDisplay(),void flashButton("AC")):"^"===key?(addPower(),void flashButton("xʸ")):"r"===lowerKey?(addFunction("sqrt"),void flashButton("√")):void("a"===lowerKey&&(add("Ans"),flashButton("ANS")))}),document.addEventListener("input",function(event){!event.target.matches||!event.target.matches("input, select, textarea")||"display"===event.target.id||event.target.closest&&event.target.closest("#navbar, .site-search, .clean-nav-search")||scheduleAutoCalculate()},!0),document.addEventListener("change",function(event){!event.target.matches||!event.target.matches("input, select, textarea")||"display"===event.target.id||event.target.closest&&event.target.closest("#navbar, .site-search, .clean-nav-search")||scheduleAutoCalculate()},!0),document.addEventListener("click",function(event){const link=event.target.closest("a");if(link&&link.href&&link.href.includes("#calc-report="))link.target="_self";else if(event.target.closest("button.clear-btn, #clearCompoundHistoryBtn")){const type=getPageType();isReportType(type)&&setTimeout(function(){clearReports(type)},0)}},!0),function(){const scrollButton=byId("scrollTopBtn");scrollButton&&window.addEventListener("scroll",function(){scrollButton.style.display=window.scrollY>200?"flex":"none"},{passive:!0})}();const type=getPageType();"age"===type&&(ensureAgeNameInput(),ensureAgeTargetDateInput()),"bmi"===type&&(ensureBMIProfileAndGroups(),setBMIUnit("si")),"loan"===type&&ensureMortgageOptionalSections(),"basic"===type&&(showHistory(),renderBasicInlineResult(),removeBasicExternalResultBox()),isReportType(type)&&(hideCalculateButtons(),renderReportHistory(type),setTimeout(hideCalculateButtons,100),readyToCalculate(type)&&setTimeout(scheduleAutoCalculate,250))}function openLatestCalculatorReport(type,button){if(!isReportType(type))return!1;const reports=loadReports(type),report=reports&&reports.length?reports[reports.length-1]:null;return report?(window.location.href=reportHref(report),!0):(button&&setButtonState(button,"Calculate first"),!1)}window.addEventListener("hashchange",function(){window.location.hash.startsWith("#calc-report=")?openReportFromHash():document.body.classList.contains("calculator-report-view")&&(window.location.href=window.location.href.split("#")[0])}),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",init):init(),window.add=add,window.clearDisplay=clearDisplay,window.removeLast=removeLast,window.addFunction=addFunction,window.addPower=addPower,window.closeOpenBrackets=closeOpenBrackets,window.calculate=calculate,window.showHistory=showHistory,window.clearHistory=function(){basicHistory=[],safeRemove("basicEquationHistory"),showHistory()},window.copyHistoryItem=function(text,button){copyText(text,button)},window.copyText=copyText,window.scrollToTop=function(){window.scrollTo({top:0,behavior:"smooth"})},window.toggleMenu=function(){const navbar=byId("navbar");navbar&&navbar.classList.toggle("open")},window.flashButton=flashButton,window.openLatestCalculatorReport=openLatestCalculatorReport,window.calculateAge=calculateAge,window.calculateBMI=calculateBMI,window.calculateBmi=calculateBMI,window.toggleBMIUnit=function(){const button=byId("unitToggleBtn");setBMIUnit("si"===(button?button.dataset.currentUnit||document.body.dataset.bmiUnit||"si":document.body.dataset.bmiUnit||"si")?"us":"si"),scheduleAutoCalculate()},window.calculateLoan=calculateLoan,window.calculatePersonalLoan=calculatePersonalLoan,window.calculateDiscount=calculateDiscount,window.calculatePercentage=calculatePercentage,window.calculateCompound=calculateCompound,window.calculateCompoundInterest=calculateCompound,window.clearInputHistory=function(type){clearReports(type||getPageType())},window.clearAgeHistory=function(){clearReports("age")},window.clearBMIHistory=function(){clearReports("bmi")},window.clearLoanHistory=function(){clearReports("loan")},window.clearPersonalLoanHistory=function(){clearReports("personalLoan")},window.clearDiscountHistory=function(){clearReports("discount")},window.clearPercentageHistory=function(){clearReports("percentage")},window.clearCompoundHistory=function(){clearReports("compound")}}(),function(){"use strict";const CALCULATORS=[{title:"Basic Calculator",label:"basic",url:"basic-calculator.html",keywords:"basic calculator math arithmetic add subtract multiply divide"},{title:"Percentage Calculator",label:"percentage",url:"percentage-calculator.html",keywords:"percentage percent increase decrease difference discount salary increment"},{title:"Unit Converter",label:"unit converter",url:"unit-converter-calculator.html",keywords:"unit converter length weight temperature area volume speed"},{title:"Age Calculator",label:"age",url:"age-calculator.html",keywords:"age birthday birthdate years months days"},{title:"BMI Calculator",label:"bmi",url:"bmi-calculator.html",keywords:"bmi body mass index weight height health"},{title:"Pointer Grade Calculator",label:"grade",url:"grade.html",keywords:"grade pointer gpa cgpa credit hour education"},{title:"Salary Calculator",label:"salary",url:"salary-calculator.html",keywords:"salary take home pay epf socso eis monthly yearly income"},{title:"Gaji Penjawat Awam",label:"gaji penjawat awam",url:"gaji-penjawat-awam-calculator.html",keywords:"gaji penjawat awam kerajaan elaun potongan"},{title:"Tax Calculator",label:"tax",url:"tax-calculator.html",keywords:"tax income tax relief deduction rate"},{title:"Inflation Calculator",label:"inflation",url:"inflation-calculator.html",keywords:"inflation future cost buying power"},{title:"Compound Interest Calculator",label:"compound interest",url:"compound-interest-calculator.html",keywords:"compound interest investment savings future value principal rate"},{title:"Loan Calculator",label:"loan",url:"loan-calculator.html",keywords:"loan payment interest repayment finance"},{title:"Mortgage Calculator",label:"mortgage",url:"mortgage-calculator.html",keywords:"mortgage home housing loan monthly payment interest property"},{title:"Personal Loan Calculator",label:"personal loan",url:"personal-loan-calculator.html",keywords:"personal loan monthly payment interest borrowing repayment"},{title:"Loan Comparison",label:"loan comparison",url:"loan-comparison-calculator.html",keywords:"loan comparison compare interest monthly payment"},{title:"Debt Payoff",label:"debt payoff",url:"debt-payoff-calculator.html",keywords:"debt payoff repayment balance interest"},{title:"Credit Card Payoff",label:"credit card payoff",url:"credit-card-payoff-calculator.html",keywords:"credit card payoff debt payment interest"},{title:"Credit Card Interest",label:"credit card interest",url:"credit-card-interest-calculator.html",keywords:"credit card interest finance charge"},{title:"Rental Yield",label:"rental yield",url:"rental-yield-calculator.html",keywords:"rental yield property rent investment"},{title:"Fuel Cost",label:"fuel cost",url:"fuel-cost-calculator.html",keywords:"fuel cost petrol distance efficiency travel"}];let activeIndex=-1,currentMatches=[];function normalize(value){return String(value||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}function getScore(item,query){const q=normalize(query);if(!q)return 0;const label=normalize(item.label),title=normalize(item.title),haystack=title+" "+label+" "+normalize(item.keywords);if(label===q)return 100;if(title===q)return 95;if(label.startsWith(q))return 90;if(title.startsWith(q))return 85;if(haystack.includes(q))return 70;const words=q.split(/\s+/).filter(Boolean);return words.length&&words.every(function(word){return haystack.includes(word)})?55:0}function findMatches(query){return CALCULATORS.map(function(item){return{item:item,score:getScore(item,query)}}).filter(function(entry){return entry.score>0}).sort(function(a,b){return b.score-a.score||a.item.title.localeCompare(b.item.title)}).map(function(entry){return entry.item})}function goToCalculator(item){item&&item.url&&(window.location.href=item.url)}function closeResults(form){const results=form?form.querySelector(".site-search-results"):null;results&&(results.hidden=!0,results.innerHTML=""),activeIndex=-1,currentMatches=[]}function setActiveResult(form){Array.from(form.querySelectorAll(".site-search-result-btn")).forEach(function(button,index){const active=index===activeIndex;button.classList.toggle("is-active",active),button.setAttribute("aria-selected",active?"true":"false")})}function renderResults(form,query){const results=form.querySelector(".site-search-results");if(results)if(currentMatches=findMatches(query),activeIndex=currentMatches.length?0:-1,normalize(query)){if(!currentMatches.length)return results.hidden=!1,void(results.innerHTML='<li class="site-search-empty">No calculator found</li>');results.hidden=!1,results.innerHTML=currentMatches.slice(0,8).map(function(item,index){return'<li><button type="button" class="site-search-result-btn" data-search-index="'+index+'" role="option">'+item.title+"</button></li>"}).join(""),setActiveResult(form)}else closeResults(form)}function installCalculatorSearch(){const navbar=document.getElementById("navbar");if(!navbar)return;if(navbar.querySelector(".site-search"))return;const form=function(){const form=document.createElement("form");return form.className="site-search",form.setAttribute("role","search"),form.setAttribute("autocomplete","off"),form.innerHTML='<label class="site-search-label" for="calculatorSearchInput">Search tools</label><div class="site-search-inner"><input id="calculatorSearchInput" class="site-search-input" type="search" placeholder="Search tools" aria-label="Search tools" aria-autocomplete="list" aria-controls="calculatorSearchResults"><button type="submit" class="site-search-submit" aria-label="Open calculator search result">🔍</button></div><ul id="calculatorSearchResults" class="site-search-results" role="listbox" hidden></ul>',form}(),infoDropdown=navbar.querySelector(".about-dropdown");let chatLink=navbar.querySelector(".nav-chat-link");chatLink||(chatLink=document.createElement("a"),chatLink.href="review.html",chatLink.className="nav-chat-link",chatLink.textContent="Review");let inlineWrap=navbar.querySelector(".nav-chat-search-inline");inlineWrap||(inlineWrap=document.createElement("div"),inlineWrap.className="nav-chat-search-inline",infoDropdown?infoDropdown.insertAdjacentElement("afterend",inlineWrap):navbar.appendChild(inlineWrap)),inlineWrap.appendChild(chatLink),inlineWrap.appendChild(form),function(form){const input=form.querySelector(".site-search-input"),results=form.querySelector(".site-search-results");input&&results&&(input.addEventListener("keydown",function(event){event.stopPropagation()},!0),input.addEventListener("keyup",function(event){event.stopPropagation()},!0),input.addEventListener("input",function(event){event.stopPropagation(),renderResults(form,input.value)}),input.addEventListener("focus",function(){normalize(input.value)&&renderResults(form,input.value)}),input.addEventListener("keydown",function(event){currentMatches.length&&("ArrowDown"===event.key&&(event.preventDefault(),activeIndex=Math.min(activeIndex+1,Math.min(currentMatches.length,8)-1),setActiveResult(form)),"ArrowUp"===event.key&&(event.preventDefault(),activeIndex=Math.max(activeIndex-1,0),setActiveResult(form)),"Escape"===event.key&&closeResults(form))}),form.addEventListener("submit",function(event){event.preventDefault();const selected=(currentMatches.length?currentMatches:findMatches(input.value))[activeIndex>=0?activeIndex:0];selected&&goToCalculator(selected)}),results.addEventListener("click",function(event){const button=event.target.closest(".site-search-result-btn");if(!button)return;const index=Number(button.dataset.searchIndex);goToCalculator(currentMatches[index])}),document.addEventListener("click",function(event){form.contains(event.target)||closeResults(form)}))}(form)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",installCalculatorSearch):installCalculatorSearch()}(),function(){"use strict";function sanitizeExpression(value){return String(value||"").replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/gi,"Math.PI").replace(/Math\.sqrt\s*\(/gi,"√(").replace(/\bsqrt\s*\(/gi,"√(").replace(/[^0-9+\-*/().,%\sA-Za-z√]/g,"").replace(/\bpi\b/gi,"Math.PI").replace(/\bans\b/gi,function(){return String(window.lastAnswer||"0")})}function setupBasicDisplayPaste(){if(!(document.body.classList.contains("basic-page")||"basic"===document.body.dataset.page||document.getElementById("display")||document.querySelector(".basic-grid")||document.querySelector(".scientific-grid")))return;const display=document.getElementById("display");display&&(display.removeAttribute("readonly"),display.readOnly=!1,display.setAttribute("inputmode","decimal"),display.setAttribute("autocomplete","off"),display.setAttribute("spellcheck","false"),"true"!==display.dataset.pasteReady&&(display.dataset.pasteReady="true",display.addEventListener("paste",function(event){event.preventDefault();const clipboard=event.clipboardData||window.clipboardData,clean=sanitizeExpression(clipboard?clipboard.getData("text"):"");clean&&function(input,text){const start=input.selectionStart??input.value.length,end=input.selectionEnd??input.value.length,before=input.value.slice(0,start),after=input.value.slice(end);input.value=before+text+after;const next=start+text.length;input.setSelectionRange(next,next)}(display,clean)}),display.addEventListener("input",function(){const clean=sanitizeExpression(display.value);if(display.value!==clean){const end=clean.length;display.value=clean,display.setSelectionRange(end,end)}}),document.addEventListener("keydown",function(event){if(document.activeElement===display)return"Enter"===event.key||"="===event.key?(event.preventDefault(),event.stopImmediatePropagation(),void("function"==typeof window.calculate&&window.calculate())):(function(event){if(event.ctrlKey||event.metaKey)return!0;const key=event.key;return"Backspace"===key||"Delete"===key||"ArrowLeft"===key||"ArrowRight"===key||"ArrowUp"===key||"ArrowDown"===key||"Tab"===key||"Home"===key||"End"===key||/^[0-9+\-*/().,%]$/.test(key)}(event)||event.preventDefault(),void event.stopImmediatePropagation())},!0)))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",setupBasicDisplayPaste):setupBasicDisplayPaste()}(),function(){"use strict";let digits=new Array(7).fill(0),pointerDown=!1;function updateValueText(){const text=document.getElementById("liveAbacusValueText");text&&(text.textContent=function(){const raw=digits.join("").replace(/^0+(?=\d)/,""),number=Number(raw||"0");return Number.isFinite(number)?number.toLocaleString("en-MY"):raw||"0"}())}function setRodDigit(rod,digit){const number=Math.max(0,Math.min(9,Number(digit)||0)),rodIndex=Number(rod.dataset.rodIndex||"0");digits[rodIndex]=number;const topActive=number>=5,lowerCount=number%5,top=rod.querySelector(".abacus-top-bead");top&&(top.style.top=(topActive?72:38)+"px",top.classList.toggle("is-active",topActive),top.setAttribute("aria-pressed",topActive?"true":"false")),rod.querySelectorAll(".abacus-lower-bead").forEach(function(bead){const index=Number(bead.dataset.index||"0"),active=index<lowerCount;bead.style.top=(active?124+28*index:162+28*index)+"px",bead.classList.toggle("is-active",active),bead.setAttribute("aria-pressed",active?"true":"false")});const digitLabel=rod.querySelector(".abacus-digit");digitLabel&&(digitLabel.textContent=String(number));const numberLabel=rod.querySelector(".abacus-rod-number");numberLabel&&(numberLabel.textContent=String(number)),updateValueText()}function rodPlaceLabel(index){return["M","100K","10K","1K","100","10","1"][index]||"1"}function buildRod(index){const rod=document.createElement("div");rod.className="abacus-rod",rod.dataset.rodIndex=String(index);const numberLabel=document.createElement("span");numberLabel.className="abacus-rod-number",numberLabel.textContent="0",rod.appendChild(numberLabel);const separator=document.createElement("div");separator.className="abacus-separator",rod.appendChild(separator);const top=document.createElement("button");top.type="button",top.className="abacus-bead abacus-top-bead",top.dataset.kind="top",top.setAttribute("aria-label","Toggle top bead for "+rodPlaceLabel(index)),rod.appendChild(top);for(let i=0;i<4;i+=1){const bead=document.createElement("button");bead.type="button",bead.className="abacus-bead abacus-lower-bead",bead.dataset.kind="lower",bead.dataset.index=String(i),bead.setAttribute("aria-label","Set lower beads to "+(i+1)+" for "+rodPlaceLabel(index)),rod.appendChild(bead)}const label=document.createElement("span");return label.className="abacus-label",label.innerHTML='<span class="abacus-place-label">'+rodPlaceLabel(index)+'</span><span class="abacus-digit">0</span>',rod.appendChild(label),setRodDigit(rod,0),rod}function handleBeadAction(bead){const rod=bead.closest(".abacus-rod");if(!rod)return;const current=digits[Number(rod.dataset.rodIndex||"0")]||0,hasTop=current>=5,lower=current%5;if("top"===bead.dataset.kind)return void setRodDigit(rod,(hasTop?0:5)+lower);const wanted=Number(bead.dataset.index||"0")+1;setRodDigit(rod,(hasTop?5:0)+(lower===wanted?Math.max(0,wanted-1):wanted))}function startInteractiveAbacus(){(document.body.classList.contains("index-page")||"index"===document.body.dataset.page||document.getElementById("liveAbacus"))&&function(){const abacus=document.getElementById("liveAbacus");if(!abacus||"true"===abacus.dataset.interactiveReady)return;abacus.dataset.interactiveReady="true",abacus.innerHTML="";for(let i=0;i<7;i+=1)abacus.appendChild(buildRod(i));abacus.addEventListener("pointerdown",function(event){const bead=event.target.closest(".abacus-bead");bead&&(pointerDown=!0,event.preventDefault(),handleBeadAction(bead))}),abacus.addEventListener("pointerover",function(event){if(!pointerDown)return;const bead=event.target.closest(".abacus-bead");bead&&handleBeadAction(bead)}),document.addEventListener("pointerup",function(){pointerDown=!1}),abacus.addEventListener("click",function(event){event.target.closest(".abacus-bead")&&event.preventDefault()});const reset=document.getElementById("liveAbacusReset");reset&&reset.addEventListener("click",function(){digits=new Array(7).fill(0),document.querySelectorAll("#liveAbacus .abacus-rod").forEach(function(rod){setRodDigit(rod,0)})}),updateValueText()}()}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startInteractiveAbacus):startInteractiveAbacus()}(),function(){"use strict";function stopCalculatorKeys(event){var el;(el=event.target)&&el.closest&&el.closest(".site-search, .site-search-input, .site-search-results")&&event.stopPropagation()}function protectSearchBars(){document.querySelectorAll(".site-search, .site-search-input, .site-search-results").forEach(function(el){"true"!==el.dataset.searchKeyboardProtected&&(el.dataset.searchKeyboardProtected="true",["keydown","keypress","keyup"].forEach(function(type){el.addEventListener(type,stopCalculatorKeys,!0),el.addEventListener(type,stopCalculatorKeys,!1)}))})}function start(){protectSearchBars(),setTimeout(protectSearchBars,300),setTimeout(protectSearchBars,1e3),document.addEventListener("focusin",protectSearchBars,!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";["keydown","keypress","keyup"].forEach(function(eventName){document.addEventListener(eventName,function(event){var target;(target=event.target)&&target.closest&&target.closest(".site-search, .site-search-input, .site-search-box, .navbar-search, .search-bar, input[type='search']")&&event.stopPropagation()},!0)}),document.addEventListener("click",function(event){var link=event.target&&event.target.closest&&event.target.closest("body.index-page .index-dropdown-card .group-links a");if(link){var href=link.getAttribute("href");href&&"#"!==href&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||1===event.button||(event.preventDefault(),window.location.assign(href)))}},!0)}(),function(){"use strict";function installFinalAgeBmiStyle(){}"loading"===document.readyState&&document.addEventListener("DOMContentLoaded",installFinalAgeBmiStyle)}(),function(){"use strict";function installBmiCartoonResultStyle(){}"loading"===document.readyState&&document.addEventListener("DOMContentLoaded",installBmiCartoonResultStyle)}(),function(){"use strict";function installBmiFinalLayoutCleanup(){}"loading"===document.readyState&&document.addEventListener("DOMContentLoaded",installBmiFinalLayoutCleanup)}(),function(){"use strict";let bmiTypingTimer=null,bmiComposing=!1;function isBmiPage(){return document.body.classList.contains("bmi-page")||"bmi"===document.body.dataset.page||!!document.getElementById("bmiResult")||!!document.getElementById("weight")&&!!document.getElementById("height")}function isBmiInput(el){return!(!el||!isBmiPage())&&["bmiName","name","weight","height","waist","bmiAge","age","gender","sex","activityLevel","bmiActivityLevel","timeGoal","timeGoalValue","timeGoalUnit","targetWeight","targetWaist","bmiNeck","bmiWrist","bmiShoulder","bmiHip"].includes(el.id)}function valueOf(id){const el=document.getElementById(id);return el?String(el.value||"").trim():""}function runBmiAfterTyping(){if(!isBmiPage())return;if(""===valueOf("weight")||""===valueOf("height"))return;if(bmiComposing)return;const focusState=function(){const el=document.activeElement;return isBmiInput(el)?{id:el.id,start:"number"==typeof el.selectionStart?el.selectionStart:null,end:"number"==typeof el.selectionEnd?el.selectionEnd:null}:null}();try{"function"==typeof window.calculateBMI?window.calculateBMI():"function"==typeof window.calculateBmi&&window.calculateBmi()}catch(error){console.error("BMI delayed auto calculate error:",error)}setTimeout(function(){!function(state){if(!state||!state.id)return;const el=document.getElementById(state.id);if(el&&(document.activeElement!==el&&el.focus({preventScroll:!0}),null!==state.start&&null!==state.end&&"function"==typeof el.setSelectionRange))try{el.setSelectionRange(state.start,state.end)}catch{}}(focusState)},0)}function scheduleBmiAfterTyping(event){isBmiInput(event.target)&&(clearTimeout(bmiTypingTimer),bmiTypingTimer=setTimeout(runBmiAfterTyping,2e3))}function startBmiTypingFix(){isBmiPage()&&(document.addEventListener("compositionstart",function(event){isBmiInput(event.target)&&(bmiComposing=!0)},!0),document.addEventListener("compositionend",function(event){isBmiInput(event.target)&&(bmiComposing=!1,scheduleBmiAfterTyping(event))},!0),document.addEventListener("input",scheduleBmiAfterTyping,!0),document.addEventListener("change",scheduleBmiAfterTyping,!0))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startBmiTypingFix):startBmiTypingFix()}(),function(){"use strict";function text(el){return String(el&&el.textContent||"").replace(/\s+/g," ").trim().toLowerCase()}function wrapDropdownContent(box,toggle,contentClass){let content=box.querySelector(":scope > ."+contentClass);return content||(content=document.createElement("div"),content.className=contentClass,function(box,toggle){return Array.from(box.children).filter(function(child){return child!==toggle})}(box,toggle).forEach(function(child){content.appendChild(child)}),box.appendChild(content)),content}function setDropdownState(box,toggle,content,open){box.classList.toggle("mortgage-dropdown-open",open),box.classList.toggle("mortgage-dropdown-closed",!open),toggle.setAttribute("aria-expanded",open?"true":"false"),content.hidden=!open}function setupDropdown(box,options){if(!box)return;const titleText=options.title,toggleClass=options.toggleClass,contentClass=options.contentClass;let toggle=box.querySelector(":scope > ."+toggleClass);toggle?(toggle.classList.add("mortgage-dropdown-toggle"),text(toggle).replace(/[▼▲]/g,"").trim()||(toggle.textContent=titleText)):(toggle=document.createElement("button"),toggle.type="button",toggle.className=toggleClass+" mortgage-dropdown-toggle",toggle.textContent=titleText,box.insertAdjacentElement("afterbegin",toggle));const content=wrapDropdownContent(box,toggle,contentClass),contentId=(prefix=contentClass,(el=content).id||(el.id=prefix+"-"+Math.random().toString(36).slice(2,8)),el.id);var el,prefix;toggle.setAttribute("aria-controls",contentId),box.dataset.mortgageDropdownReady||(box.dataset.mortgageDropdownReady="yes",setDropdownState(box,toggle,content,!1),toggle.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation();const isOpen="true"===toggle.getAttribute("aria-expanded");setDropdownState(box,toggle,content,!isOpen)}))}function setupMortgageDropdowns(){(function(){const title=text(document.querySelector("h1")),path=window.location.pathname.toLowerCase();return path.includes("mortgage")||path.includes("loan-calculator")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanHistoryList")||!!document.getElementById("otherMonthlyFees")||!!document.getElementById("downPayment")||!!document.getElementById("propertyTaxYearly")||!!document.querySelector(".optional-mortgage-costs")||!!document.querySelector(".early-settlement-box")})()&&(document.body.classList.add("loan-page"),setupDropdown(document.querySelector(".optional-mortgage-costs"),{title:"Optional costs",toggleClass:"optional-mortgage-toggle",contentClass:"optional-mortgage-content"}),setupDropdown(document.querySelector(".early-settlement-box"),{title:"Optional early settlement",toggleClass:"early-settlement-toggle",contentClass:"early-settlement-content"}))}function start(){setupMortgageDropdowns(),setTimeout(setupMortgageDropdowns,300),setTimeout(setupMortgageDropdowns,900),setTimeout(setupMortgageDropdowns,1600)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function text(el){return String(el&&el.textContent||"").replace(/\s+/g," ").trim().toLowerCase()}function findBoxByTitle(patterns){return Array.from(document.querySelectorAll(".mortgage-input-box, .mortgage-home-box, .mortgage-loan-box, .optional-mortgage-costs, .early-settlement-box, .loan-optional-row > *")).find(function(box){const title=text(box.querySelector(".bmi-extra-title, .mortgage-box-title, h2, h3, button, .optional-mortgage-toggle, .early-settlement-toggle")||box);return patterns.some(function(pattern){return pattern.test(title)})})||null}function moveTo(parent,child){parent&&child&&child.parentElement!==parent&&parent.appendChild(child)}function organizeMortgageInputs(){if(!function(){const title=text(document.querySelector("h1"));return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.querySelector(".mortgage-home-box")||!!document.querySelector(".mortgage-loan-box")||!!document.querySelector(".optional-mortgage-costs")||!!document.querySelector(".early-settlement-box")}())return;const calculator=document.querySelector(".calculator");if(!calculator)return;const homeBox=document.querySelector(".mortgage-home-box")||document.querySelector(".mortgage-home-details-box")||findBoxByTitle([/home details/,/property details/,/home info/]),loanBox=document.querySelector(".mortgage-loan-box")||document.querySelector(".mortgage-loan-details-box")||findBoxByTitle([/loan details/,/financing details/,/loan info/]),optionalCostBox=document.querySelector(".optional-mortgage-costs")||findBoxByTitle([/optional costs/,/property tax/,/insurance/,/monthly fee/]),extraSettlementBox=document.querySelector(".early-settlement-box")||document.querySelector(".mortgage-extra-payment-box")||findBoxByTitle([/extra payment/,/early settlement/,/settlement/]);if(!(homeBox||loanBox||optionalCostBox||extraSettlementBox))return;let layout=document.querySelector(".mortgage-two-column-input-layout");if(!layout){layout=document.createElement("div"),layout.className="mortgage-two-column-input-layout";const firstBox=homeBox||loanBox||optionalCostBox||extraSettlementBox;firstBox&&firstBox.parentElement?firstBox.parentElement.insertBefore(layout,firstBox):calculator.appendChild(layout)}let leftCol=layout.querySelector(".mortgage-left-input-column"),rightCol=layout.querySelector(".mortgage-right-input-column");leftCol||(leftCol=document.createElement("div"),leftCol.className="mortgage-left-input-column",layout.appendChild(leftCol)),rightCol||(rightCol=document.createElement("div"),rightCol.className="mortgage-right-input-column",layout.appendChild(rightCol)),moveTo(leftCol,homeBox),moveTo(leftCol,optionalCostBox),moveTo(rightCol,loanBox),moveTo(rightCol,extraSettlementBox),optionalCostBox&&optionalCostBox.classList.add("mortgage-box-under-home"),extraSettlementBox&&extraSettlementBox.classList.add("mortgage-box-under-loan")}function start(){organizeMortgageInputs(),setTimeout(organizeMortgageInputs,200),setTimeout(organizeMortgageInputs,700),setTimeout(organizeMortgageInputs,1400),setTimeout(organizeMortgageInputs,2400)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function text(el){return String(el&&el.textContent||"").replace(/\s+/g," ").trim().toLowerCase()}function removeOldMortgageResultBox(){(function(){const title=text(document.querySelector("h1"));return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanExternalOutput")||!!document.querySelector(".mortgage-output-panel")})()&&([document.getElementById("loanResult"),document.getElementById("loanExternalOutput"),document.getElementById("universalLoanStyleOutput")].forEach(function(box){if(box)return box.classList.contains("mortgage-modern-result-panel")||box.querySelector(".mortgage-modern-output")?(box.hidden=!1,box.style.setProperty("display","block","important"),box.style.setProperty("visibility","visible","important"),void box.removeAttribute("aria-hidden")):void(function(el){if(!el)return!1;const hasTable=!!el.querySelector("table"),content=text(el);return!!hasTable&&(content.includes("monthly payment")||content.includes("principal")||content.includes("interest")||content.includes("remaining balance")||content.includes("total payment"))}(box)&&(box.innerHTML="",box.style.setProperty("display","none","important"),box.setAttribute("aria-hidden","true")))}),document.querySelectorAll(".loan-copy-side, .mortgage-old-copy-button, #loanResultCopyButton, #copyLoanResult, #loanCopyButton").forEach(function(button){button.remove()}),document.querySelectorAll("button").forEach(function(button){const btnText=text(button);if("copy"!==btnText&&"copy result"!==btnText)return;const parent=button.parentElement;parent&&(parent.querySelector("#loanResult")||parent.querySelector("#loanExternalOutput")||parent.className.toString().toLowerCase().includes("loan-result")||parent.className.toString().toLowerCase().includes("mortgage-result"))&&button.remove()}))}function start(){removeOldMortgageResultBox(),setTimeout(removeOldMortgageResultBox,200),setTimeout(removeOldMortgageResultBox,700),setTimeout(removeOldMortgageResultBox,1400),document.addEventListener("input",function(){setTimeout(removeOldMortgageResultBox,350),setTimeout(removeOldMortgageResultBox,900)},!0),document.addEventListener("change",function(){setTimeout(removeOldMortgageResultBox,350),setTimeout(removeOldMortgageResultBox,900)},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function markMortgagePage(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanHistoryList")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;document.body.classList.add("mortgage-page"),document.body.classList.add("loan-page");const layout=document.querySelector(".mortgage-two-column-input-layout");layout&&(layout.style.width="100%",layout.style.maxWidth="100%",layout.style.boxSizing="border-box"),document.querySelectorAll(".mortgage-left-input-column, .mortgage-right-input-column, .mortgage-input-box, .mortgage-home-box, .mortgage-loan-box, .optional-mortgage-costs, .early-settlement-box").forEach(function(el){el.style.width="100%",el.style.maxWidth="100%",el.style.boxSizing="border-box"})}function start(){markMortgagePage(),setTimeout(markMortgagePage,200),setTimeout(markMortgagePage,700),setTimeout(markMortgagePage,1500)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function cleanMortgageWidths(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("loanResult")||!!document.getElementById("loanHistoryList")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;document.body.classList.add("mortgage-page"),document.body.classList.add("loan-page");const selector=[".mortgage-two-column-input-layout",".mortgage-left-input-column",".mortgage-right-input-column",".mortgage-input-box",".mortgage-home-box",".mortgage-loan-box",".mortgage-home-details-box",".mortgage-loan-details-box",".optional-mortgage-costs",".early-settlement-box",".optional-mortgage-toggle",".early-settlement-toggle",".optional-mortgage-content",".early-settlement-content"].join(",");document.querySelectorAll(selector).forEach(function(el){el.style.setProperty("width","100%","important"),el.style.setProperty("max-width","none","important"),el.style.setProperty("min-width","0","important"),el.style.setProperty("box-sizing","border-box","important")}),document.querySelectorAll(".mortgage-input-box input, .mortgage-input-box select, .mortgage-home-box input, .mortgage-home-box select, .mortgage-loan-box input, .mortgage-loan-box select, .mortgage-home-details-box input, .mortgage-home-details-box select, .mortgage-loan-details-box input, .mortgage-loan-details-box select, .optional-mortgage-content input, .optional-mortgage-content select, .early-settlement-content input, .early-settlement-content select").forEach(function(el){el.style.setProperty("width","100%","important"),el.style.setProperty("max-width","100%","important"),el.style.setProperty("min-width","0","important"),el.style.setProperty("box-sizing","border-box","important")})}function start(){cleanMortgageWidths(),setTimeout(cleanMortgageWidths,100),setTimeout(cleanMortgageWidths,400),setTimeout(cleanMortgageWidths,900),setTimeout(cleanMortgageWidths,1800)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function fixMortgageGridWrapper(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.querySelector(".mortgage-input-grid")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;document.body.classList.add("mortgage-page","loan-page");const layout=document.querySelector(".mortgage-two-column-input-layout"),oldGrid=document.querySelector(".mortgage-input-grid"),calculator=document.querySelector(".calculator");layout&&oldGrid&&calculator&&(oldGrid.contains(layout)&&oldGrid.insertAdjacentElement("beforebegin",layout),oldGrid.querySelector(".mortgage-input-box")||(oldGrid.style.setProperty("display","none","important"),oldGrid.setAttribute("aria-hidden","true")),layout.style.setProperty("width","100%","important"),layout.style.setProperty("max-width","100%","important"),layout.style.setProperty("box-sizing","border-box","important"),document.querySelectorAll(".mortgage-left-input-column, .mortgage-right-input-column, .mortgage-left-input-column > *, .mortgage-right-input-column > *").forEach(function(el){el.style.setProperty("width","100%","important"),el.style.setProperty("max-width","100%","important"),el.style.setProperty("min-width","0","important"),el.style.setProperty("box-sizing","border-box","important")}))}function start(){fixMortgageGridWrapper(),setTimeout(fixMortgageGridWrapper,250),setTimeout(fixMortgageGridWrapper,800),setTimeout(fixMortgageGridWrapper,1600),setTimeout(fixMortgageGridWrapper,2600)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function keepMortgageOptionalVisible(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;const layout=document.querySelector(".mortgage-two-column-input-layout"),left=layout?layout.querySelector(".mortgage-left-input-column"):null,right=layout?layout.querySelector(".mortgage-right-input-column"):null,optional=document.querySelector(".optional-mortgage-costs"),early=document.querySelector(".early-settlement-box");left&&optional&&optional.parentElement!==left&&left.appendChild(optional),right&&early&&early.parentElement!==right&&right.appendChild(early),[optional,early].forEach(function(box){box&&(box.style.setProperty("display","block","important"),box.style.setProperty("visibility","visible","important"),box.style.setProperty("opacity","1","important"))})}function start(){keepMortgageOptionalVisible(),setTimeout(keepMortgageOptionalVisible,150),setTimeout(keepMortgageOptionalVisible,600),setTimeout(keepMortgageOptionalVisible,1200),document.addEventListener("input",function(){setTimeout(keepMortgageOptionalVisible,50),setTimeout(keepMortgageOptionalVisible,350)},!0),document.addEventListener("change",function(){setTimeout(keepMortgageOptionalVisible,50),setTimeout(keepMortgageOptionalVisible,350)},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function revealMortgageModernResult(){const panel=document.getElementById("loanExternalOutput");panel&&panel.classList.contains("mortgage-modern-result-panel")&&(panel.hidden=!1,panel.style.setProperty("display","block","important"),panel.style.setProperty("visibility","visible","important"),panel.style.setProperty("opacity","1","important"),panel.removeAttribute("aria-hidden"))}function start(){revealMortgageModernResult(),setTimeout(revealMortgageModernResult,100),setTimeout(revealMortgageModernResult,500),setTimeout(revealMortgageModernResult,1100),document.addEventListener("input",function(){setTimeout(revealMortgageModernResult,400),setTimeout(revealMortgageModernResult,900)},!0),document.addEventListener("change",function(){setTimeout(revealMortgageModernResult,400),setTimeout(revealMortgageModernResult,900)},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function hideAgeLiveResultDuringReport(){document.body.classList.contains("calculator-report-view")&&document.querySelectorAll(".age-clean-result, .age-point-output, #ageResult").forEach(function(el){el.closest("#calculatorReportPage")||(el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true"))})}function start(){hideAgeLiveResultDuringReport(),setTimeout(hideAgeLiveResultDuringReport,100),setTimeout(hideAgeLiveResultDuringReport,500),setTimeout(hideAgeLiveResultDuringReport,1200),setTimeout(hideAgeLiveResultDuringReport,2200),window.addEventListener("hashchange",function(){setTimeout(hideAgeLiveResultDuringReport,100),setTimeout(hideAgeLiveResultDuringReport,700)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function fillStartDate(){if(!function(){const title=String(document.querySelector("h1")?.textContent||"").toLowerCase();return window.location.pathname.toLowerCase().includes("mortgage")||title.includes("mortgage")||!!document.getElementById("startDate")||!!document.querySelector(".mortgage-two-column-input-layout")}())return;const input=document.getElementById("startDate");input&&!input.value&&(input.value=function(){const now=new Date;return now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0")}())}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",fillStartDate):fillStartDate(),setTimeout(fillStartDate,300),setTimeout(fillStartDate,1e3)}(),function(){"use strict";const calculators=[{title:"Basic Calculator",url:"basic-calculator.html"},{title:"Percentage Calculator",url:"percentage-calculator.html"},{title:"unit converter",url:"unit-converter-calculator.html"},{title:"Age Calculator",url:"age-calculator.html"},{title:"BMI Calculator",url:"bmi-calculator.html"},{title:"Salary Calculator",url:"salary-calculator.html"},{title:"gaji penjawat awam",url:"gaji-penjawat-awam-calculator.html"},{title:"Tax Calculator",url:"tax-calculator.html"},{title:"Discount Calculator",url:""},{title:"Inflation Calculator",url:"inflation-calculator.html"},{title:"compound interest",url:"compound-interest-calculator.html"},{title:"Mortgage Calculator",url:"mortgage-calculator.html"},{title:"Personal Loan",url:"personal-loan-calculator.html"},{title:"Loan Comparison",url:"loan-comparison-calculator.html"},{title:"Debt Payoff",url:"debt-payoff-calculator.html"},{title:"credit card payoff",url:"credit-card-payoff-calculator.html"},{title:"credit card interest",url:"credit-card-interest-calculator.html"},{title:"Rental Yield",url:"rental-yield-calculator.html"},{title:"Fuel Cost",url:"fuel-cost-calculator.html"}];function normalize(text){return String(text||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()}function rebuildNav(){const nav=document.getElementById("navbar");nav&&"true"!==nav.dataset.cleanRebuilt&&(nav.dataset.cleanRebuilt="true",nav.className="clean-navbar",nav.innerHTML='<div class="clean-nav-inner"><a class="clean-nav-link" href="index.html">Home</a><div class="clean-nav-dropdown clean-calculator-dropdown"><button type="button" class="clean-nav-link clean-nav-button" aria-expanded="false">Tools <span aria-hidden="true">▼</span></button><div class="clean-nav-dropdown-panel clean-calculator-panel"><div class="clean-nav-submenu clean-general-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">General <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="basic-calculator.html">Basic Calculator</a><a href="percentage-calculator.html">Percentage Calculator</a><a href="unit-converter-calculator.html">Unit Converter</a></div></div><div class="clean-nav-submenu clean-health-age-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Health & Age <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="age-calculator.html">Age Calculator</a><a href="bmi-calculator.html">BMI Calculator</a></div></div><div class="clean-nav-submenu clean-education-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Education <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="grade.html">Pointer Grade Calculator</a></div></div><div class="clean-nav-submenu clean-income-tax-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Income & Tax <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="salary-calculator.html">Salary Calculator</a><a href="gaji-penjawat-awam-calculator.html">Gaji Penjawat Awam</a><a href="tax-calculator.html">Tax Calculator</a></div></div><div class="clean-nav-submenu clean-finance-growth-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Finance & Growth <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="inflation-calculator.html">Inflation Calculator</a><a href="compound-interest-calculator.html">Compound Interest</a></div></div><div class="clean-nav-submenu clean-loans-debt-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Loans & Debt <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="loan-calculator.html">Loan Calculator</a><a href="mortgage-calculator.html">Mortgage Calculator</a><a href="personal-loan-calculator.html">Personal Loan</a><a href="loan-comparison-calculator.html">Loan Comparison</a><a href="debt-payoff-calculator.html">Debt Payoff</a><a href="credit-card-payoff-calculator.html">Credit Card Payoff</a><a href="credit-card-interest-calculator.html">Credit Card Interest</a></div></div><div class="clean-nav-submenu clean-property-travel-submenu"><button type="button" class="clean-nav-panel-row clean-nav-submenu-button">Property & Travel <span aria-hidden="true">▶</span></button><div class="clean-nav-submenu-panel"><a href="rental-yield-calculator.html">Rental Yield</a><a href="fuel-cost-calculator.html">Fuel Cost</a></div></div></div></div><div class="clean-nav-dropdown clean-info-dropdown"><button type="button" class="clean-nav-link clean-nav-button" aria-expanded="false">Resources <span aria-hidden="true">▼</span></button><div class="clean-nav-dropdown-panel clean-info-panel"><a href="about.html">About</a><a href="FAQS.html">FAQs</a><a href="privacy-policy.html">Privacy Policy</a><a href="contact.html">Contact</a></div></div><a class="clean-nav-link clean-chat-link" href="review.html">Review</a><a class="clean-nav-link clean-wall-link" href="Wall.html">Wall</a><form class="clean-nav-search" role="search" autocomplete="off"><label class="clean-nav-search-label" for="cleanCalculatorSearchInput">Search tools</label><input id="cleanCalculatorSearchInput" class="clean-nav-search-input" type="search" placeholder="Search tools" aria-label="Search tools"><button type="submit" class="clean-nav-search-button" aria-label="Search">🔍</button><ul class="clean-nav-search-results" hidden></ul></form></div>',function(nav){const dropdowns=Array.from(nav.querySelectorAll(".clean-nav-dropdown")),submenus=Array.from(nav.querySelectorAll(".clean-nav-submenu"));let closeTimer=null;function clearCloseTimer(){closeTimer&&(clearTimeout(closeTimer),closeTimer=null)}function setDropdownOpen(dropdown,open){const button=dropdown.querySelector(".clean-nav-button");dropdown.classList.toggle("is-open",!!open),button&&button.setAttribute("aria-expanded",open?"true":"false"),open||dropdown.querySelectorAll(".clean-nav-submenu.is-open").forEach(function(submenu){submenu.classList.remove("is-open")})}function closeAllDropdownsExcept(except){dropdowns.forEach(function(dropdown){dropdown!==except&&setDropdownOpen(dropdown,!1)})}function closeSubmenusExcept(submenu){const parentPanel=submenu?submenu.closest(".clean-nav-dropdown-panel"):null;submenus.forEach(function(item){item!==submenu&&(parentPanel&&item.closest(".clean-nav-dropdown-panel")!==parentPanel||item.classList.remove("is-open"))})}function openDropdown(dropdown){clearCloseTimer(),closeAllDropdownsExcept(dropdown),setDropdownOpen(dropdown,!0)}function closeEverything(){dropdowns.forEach(function(dropdown){setDropdownOpen(dropdown,!1)}),submenus.forEach(function(submenu){submenu.classList.remove("is-open")})}dropdowns.forEach(function(dropdown){const button=dropdown.querySelector(".clean-nav-button");button&&(button.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation();const isOpen=dropdown.classList.contains("is-open");closeAllDropdownsExcept(dropdown),setDropdownOpen(dropdown,!isOpen)}),dropdown.addEventListener("mouseenter",function(){openDropdown(dropdown)}),dropdown.addEventListener("focusin",function(){openDropdown(dropdown)}))}),submenus.forEach(function(submenu){const button=submenu.querySelector(".clean-nav-submenu-button");button&&(button.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation();const isOpen=submenu.classList.contains("is-open");closeSubmenusExcept(submenu),submenu.classList.toggle("is-open",!isOpen)}),submenu.addEventListener("mouseenter",function(){clearCloseTimer(),closeSubmenusExcept(submenu),submenu.classList.add("is-open")}),submenu.addEventListener("focusin",function(){clearCloseTimer(),closeSubmenusExcept(submenu),submenu.classList.add("is-open")}))}),nav.addEventListener("mouseenter",clearCloseTimer),nav.addEventListener("mouseleave",function(){clearCloseTimer(),closeTimer=setTimeout(function(){nav.matches(":hover")||nav.contains(document.activeElement)||closeEverything()},450)}),document.addEventListener("click",function(event){nav.contains(event.target)||closeEverything()}),document.addEventListener("keydown",function(event){"Escape"===event.key&&closeEverything()})}(nav),function(nav){const form=nav.querySelector(".clean-nav-search"),input=nav.querySelector(".clean-nav-search-input"),results=nav.querySelector(".clean-nav-search-results");function hideResults(){results.hidden=!0,results.innerHTML=""}function matchesFor(query){const q=normalize(query);return q?calculators.filter(function(item){return normalize(item.title).includes(q)}):[]}function renderResults(){const matches=matchesFor(input.value);normalize(input.value)?(results.hidden=!1,matches.length?results.innerHTML=matches.slice(0,8).map(function(item){return'<li><button type="button" class="clean-nav-search-result" data-url="'+item.url+'">'+item.title+"</button></li>"}).join(""):results.innerHTML='<li class="clean-nav-search-empty">No calculator found</li>'):hideResults()}form&&input&&results&&(input.addEventListener("keydown",function(event){event.stopPropagation(),"Escape"===event.key&&hideResults()},!0),input.addEventListener("keyup",function(event){event.stopPropagation()},!0),input.addEventListener("input",function(event){event.stopPropagation(),renderResults()}),input.addEventListener("focus",function(){renderResults()}),form.addEventListener("submit",function(event){event.preventDefault();const matches=matchesFor(input.value);matches.length&&(window.location.href=matches[0].url)}),results.addEventListener("click",function(event){const button=event.target.closest(".clean-nav-search-result");if(!button)return;const url=button.getAttribute("data-url");url&&(window.location.href=url)}),document.addEventListener("click",function(event){form.contains(event.target)||hideResults()}))}(nav))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",rebuildNav):rebuildNav()}(),function(){"use strict";function dedupeAgeResults(){const panels=Array.from(document.querySelectorAll(".age-clean-result, .age-point-output, #ageResult")).filter(function(el){return function(el){return!(!el||!el.classList.contains("age-clean-result")&&!el.classList.contains("age-point-output")&&"ageResult"!==el.id)}(el)&&!el.closest("#calculatorReportPage")});if(document.body.classList.contains("calculator-report-view"))return void panels.forEach(function(el){el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true")});if(panels.length<=1)return;const main=panels.find(function(el){return"ageExternalOutput"===el.id})||panels[0];panels.forEach(function(el){el!==main&&el.remove()}),main.style.removeProperty("display"),main.style.removeProperty("visibility"),main.removeAttribute("aria-hidden")}function start(){dedupeAgeResults(),setTimeout(dedupeAgeResults,80),setTimeout(dedupeAgeResults,300),setTimeout(dedupeAgeResults,900),setTimeout(dedupeAgeResults,1800),document.addEventListener("input",function(){setTimeout(dedupeAgeResults,300),setTimeout(dedupeAgeResults,900)},!0),document.addEventListener("change",function(){setTimeout(dedupeAgeResults,300),setTimeout(dedupeAgeResults,900)},!0),window.addEventListener("hashchange",function(){setTimeout(dedupeAgeResults,120),setTimeout(dedupeAgeResults,700)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";const resultGroups=[{key:"age",keepId:"ageReportOutput",selector:"#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"},{key:"bmi",keepId:"bmiReportOutput",selector:"#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"},{key:"loan",keepId:"loanExternalOutput",selector:"#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"},{key:"personalLoan",keepId:"personalLoanExternalOutput",selector:"#personalLoanExternalOutput, .personalLoan-clean-result, #personalLoanResult"},{key:"discount",keepId:"discountReportOutput",selector:"#discountReportOutput, .discount-clean-result, #discountResult"},{key:"percentage",keepId:"percentageReportOutput",selector:"#percentageReportOutput, .percentage-clean-result, #percentageResult"},{key:"compound",keepId:"compoundReportOutput",selector:"#compoundReportOutput, .compound-clean-result, #compoundResult"}];function isReportView(){return document.body.classList.contains("calculator-report-view")||!!document.getElementById("calculatorReportPage")}function cleanupGroup(group){let panels=Array.from(document.querySelectorAll(group.selector)).filter(function(panel){return panel&&!panel.closest("#calculatorReportPage")});if(!panels.length)return;const preferred=document.getElementById(group.keepId),keep=preferred&&panels.includes(preferred)?preferred:panels[panels.length-1];panels.forEach(function(panel){panel!==keep&&(panel.id&&panel.id!==group.keepId?(panel.style.setProperty("display","none","important"),panel.style.setProperty("visibility","hidden","important"),panel.setAttribute("aria-hidden","true")):panel.remove())}),isReportView()||(keep.style.removeProperty("display"),keep.style.removeProperty("visibility"),keep.removeAttribute("aria-hidden"))}function cleanupResults(){isReportView()&&document.querySelectorAll(".calculator-clean-result, .loan-style-output-panel, .mortgage-modern-result-panel").forEach(function(panel){panel.closest("#calculatorReportPage")||(panel.style.setProperty("display","none","important"),panel.style.setProperty("visibility","hidden","important"),panel.setAttribute("aria-hidden","true"))}),isReportView()||resultGroups.forEach(cleanupGroup)}function start(){cleanupResults(),setTimeout(cleanupResults,100),setTimeout(cleanupResults,500),setTimeout(cleanupResults,1200),setTimeout(cleanupResults,2400),document.addEventListener("input",function(){setTimeout(cleanupResults,2100),setTimeout(cleanupResults,2600)},!0),document.addEventListener("change",function(){setTimeout(cleanupResults,2100),setTimeout(cleanupResults,2600)},!0),window.addEventListener("hashchange",function(){setTimeout(cleanupResults,100),setTimeout(cleanupResults,800)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";const pageResultSelectors=[["ageReportOutput","#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"],["bmiReportOutput","#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"],["loanExternalOutput","#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"],["personalLoanExternalOutput","#personalLoanExternalOutput, .personalLoan-clean-result, #personalLoanResult"],["discountReportOutput","#discountReportOutput, .discount-clean-result, #discountResult"],["percentageReportOutput","#percentageReportOutput, .percentage-clean-result, #percentageResult"],["compoundReportOutput","#compoundReportOutput, .compound-clean-result, #compoundResult"]];function cleanupOne(keepId,selector){const panels=Array.from(document.querySelectorAll(selector)).filter(function(el){return el&&!el.closest("#calculatorReportPage")});if(!panels.length)return;if(document.body.classList.contains("calculator-report-view")||document.getElementById("calculatorReportPage"))return void panels.forEach(function(el){el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true")});const preferred=document.getElementById(keepId),keep=preferred&&panels.includes(preferred)?preferred:panels[panels.length-1];panels.forEach(function(el){el!==keep&&(el.id&&el.id!==keepId?(el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.setAttribute("aria-hidden","true")):el.remove())}),keep.style.removeProperty("display"),keep.style.removeProperty("visibility"),keep.removeAttribute("aria-hidden")}function cleanupAllResults(){pageResultSelectors.forEach(function(pair){cleanupOne(pair[0],pair[1])})}function start(){cleanupAllResults(),[100,500,1200,2200,3200].forEach(function(delay){setTimeout(cleanupAllResults,delay)}),document.addEventListener("input",function(){setTimeout(cleanupAllResults,2200),setTimeout(cleanupAllResults,3e3)},!0),document.addEventListener("change",function(){setTimeout(cleanupAllResults,2200),setTimeout(cleanupAllResults,3e3)},!0),window.addEventListener("hashchange",function(){setTimeout(cleanupAllResults,100),setTimeout(cleanupAllResults,800)})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function $(id){return document.getElementById(id)}function n(id){const el=$(id);if(!el)return NaN;const value=String(el.value||"").replace(/,/g,"").trim();return""===value?NaN:Number(value)}function val(id){const el=$(id);return el?String(el.value||"").trim():""}function money(value,prefix){const p=prefix||"RM";return Number.isFinite(value)?p+" "+value.toLocaleString("en-US",{maximumFractionDigits:2}):"Not available"}function num(value,digits){return Number.isFinite(value)?value.toLocaleString("en-US",{maximumFractionDigits:null==digits?2:digits}):"Not available"}function extraVisibleTitle(title){return String(title||"").replace(/\s+calculator\s+result\s*$/i," calculator").replace(/\s+result\s*$/i,"").trim()||"Answer"}function extraVisibleLabel(label){const text=String(null==label?"":label);return/^\s*result\s*$/i.test(text)?"Answer":text}function extraPlainText(title,rows,note){const lines=[extraVisibleTitle(title)];return(rows||[]).forEach(function(row){lines.push(extraVisibleLabel(row[0])+": "+row[1])}),note&&lines.push("Note: "+note),lines.join("\n")}function extraDownloadTextFile(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download=filename,document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},0)}function extraDateStamp(){const d=new Date;return[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0"),String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join("-")}function extraSetButton(button,text){if(!button)return;const oldText=button.textContent;button.textContent=text,setTimeout(function(){button.textContent=oldText},1200)}function extraCopyText(text,button){navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text).then(function(){extraSetButton(button,"Copied!")}).catch(function(){extraFallbackCopy(text,button)}):extraFallbackCopy(text,button)}function extraFallbackCopy(text,button){const area=document.createElement("textarea");area.value=text,area.setAttribute("readonly",""),area.style.position="fixed",area.style.left="-9999px",document.body.appendChild(area),area.select();try{document.execCommand("copy"),extraSetButton(button,"Copied!")}catch(error){extraSetButton(button,"Copy failed")}area.remove()}function extraFieldLabel(input){if(!input)return"Input";let label=null;var value;return input.id&&(label=document.querySelector('label[for="'+(value=input.id,String(value||"").replace(/[^a-zA-Z0-9_-]/g,"\\$&")+'"]'))),!label&&input.closest&&(label=input.closest("label")),label?cleanText(label.textContent).replace(/[:*]+$/g,"")||input.name||input.id||"Input":input.getAttribute("aria-label")||input.placeholder||input.name||input.id||"Input"}function extraReportTable(title,rows){return'<div class="calculator-report-table-scroll extra-report-table-scroll"><table class="calculator-report-data-table extra-report-data-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>'+function(rows){return(rows||[]).map(function(row){return"<tr><th>"+escapeHtml(extraVisibleLabel(row[0]))+"</th><td>"+escapeHtml(row[1])+"</td></tr>"}).join("")}(rows||[])+"</tbody></table></div>"}function extraOpenReport(title,rows,note){const old=document.getElementById("extraCalculatorReportPage");old&&old.remove(),document.body.classList.add("calculator-report-view"),document.querySelectorAll("main, .calculator, .extra-calculator-layout, #extraCalcResult").forEach(function(element){element.style.setProperty("display","none","important")});const section=document.createElement("section");section.id="extraCalculatorReportPage",section.className="calculator-report-page mortgage-fast-report-page extra-calculator-report-page table-report-page";const inputRows=function(){const root=document.querySelector(".extra-calculator-box")||document.querySelector(".calculator")||document,used=new Set;return Array.from(root.querySelectorAll("input, select, textarea")).filter(function(input){const type=String(input.type||"").toLowerCase();if(["button","submit","reset","hidden"].includes(type))return!1;if(input.disabled)return!1;if(null===input.offsetParent&&"radio"!==type&&"checkbox"!==type)return!1;const key=input.id||input.name;return(!key||!used.has(key))&&(key&&used.add(key),"checkbox"===type||"radio"===type?input.checked:""!==String(input.value||"").trim()||"SELECT"===input.tagName)}).map(function(input){const type=String(input.type||"").toLowerCase();let value="";return value="SELECT"===input.tagName?input.options&&input.selectedIndex>=0?input.options[input.selectedIndex].text:input.value:"checkbox"===type||"radio"===type?input.checked?input.value||"Selected":"Not selected":input.value,[extraFieldLabel(input),value||"-"]})}();section.innerHTML="<h1>"+escapeHtml(extraVisibleTitle(title))+'</h1><p class="calculator-report-date"><strong>Generated:</strong> '+escapeHtml((new Date).toLocaleString())+'</p><div class="calculator-report-card extra-report-input-card"><h2>Inputs</h2>'+extraReportTable(0,inputRows.length?inputRows:[["Input","No input saved"]])+'</div><div class="calculator-report-card extra-report-result-card"><h2>Results</h2>'+extraReportTable(0,rows)+(note?'<p class="extra-result-note">'+escapeHtml(note)+"</p>":"")+'</div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn extra-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn extra-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn extra-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn extra-report-share-btn">Share report</button></div>',document.body.appendChild(section);const text=extraPlainText(title,inputRows.concat(rows||[]),note),back=section.querySelector(".extra-report-back-btn"),copy=section.querySelector(".extra-report-copy-btn"),save=section.querySelector(".extra-report-save-btn"),share=section.querySelector(".extra-report-share-btn");back&&(back.onclick=function(){section.remove(),document.body.classList.remove("calculator-report-view"),document.querySelectorAll("main, .calculator, .extra-calculator-layout, #extraCalcResult").forEach(function(element){element.style.removeProperty("display")})}),copy&&(copy.onclick=function(){extraCopyText(text,copy)}),save&&(save.onclick=function(){extraDownloadTextFile("calculator-report-"+extraDateStamp()+".txt",text),extraSetButton(save,"Saved!")}),share&&(share.onclick=function(){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){extraCopyText(text,share)}):extraCopyText(text,share)}),section.scrollIntoView({behavior:"smooth",block:"start"})}function show(title,rows,note){const box=$("extraCalcResult");box&&(box.innerHTML=function(title,rows){return'<div class="extra-result-card"><h2>'+extraVisibleTitle(title)+'</h2><table class="extra-result-table"><tbody>'+rows.map(function(row){return"<tr><th>"+extraVisibleLabel(row[0])+"</th><td>"+row[1]+"</td></tr>"}).join("")+"</tbody></table></div>"}(title,rows)+(note?'<p class="extra-result-note">'+note+"</p>":"")+'<div class="extra-result-actions"><button type="button" class="extra-result-action-btn extra-result-copy-btn">Copy</button><button type="button" class="extra-result-action-btn extra-result-save-btn">Save</button><button type="button" class="extra-result-action-btn extra-result-share-btn">Share</button><button type="button" class="extra-result-action-btn extra-result-report-btn">Report</button></div>',box.hidden=!1,function(box,title,rows,note){const text=extraPlainText(title,rows,note),copy=box.querySelector(".extra-result-copy-btn"),save=box.querySelector(".extra-result-save-btn"),share=box.querySelector(".extra-result-share-btn"),report=box.querySelector(".extra-result-report-btn");copy&&(copy.onclick=function(){extraCopyText(text,copy)}),save&&(save.onclick=function(){extraDownloadTextFile("calculator-result-"+extraDateStamp()+".txt",text),extraSetButton(save,"Saved!")}),share&&(share.onclick=function(){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){extraCopyText(text,share)}):extraCopyText(text,share)}),report&&(report.onclick=function(){extraOpenReport(title,rows,note)})}(box,title,rows,note))}function loanPayment(principal,annualRate,months){if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(months)||principal<=0||months<=0)return NaN;const r=annualRate/100/12;return 0===r?principal/months:principal*r/(1-Math.pow(1+r,-months))}window.calculateSalaryExtra=function(){const gross=n("salaryGross"),epfRate=n("salaryEpfRate"),socso=n("salarySocso"),tax=n("salaryTax"),other=n("salaryOther");if(!Number.isFinite(gross)||gross<=0)return;const epf=gross*((Number.isFinite(epfRate)?epfRate:11)/100),totalDeduct=epf+(Number.isFinite(socso)?socso:0)+(Number.isFinite(tax)?tax:0)+(Number.isFinite(other)?other:0),net=gross-totalDeduct;show("Salary result",[["Gross monthly salary",money(gross)],["EPF deduction",money(epf)],["Other deductions",money(totalDeduct-epf)],["Net monthly salary",money(net)],["Estimated net yearly",money(12*net)]])},window.calculateCreditCardPayoffExtra=function(){const balance=n("ccBalance"),apr=n("ccApr"),payment=n("ccPayment");if(!Number.isFinite(balance)||!Number.isFinite(apr)||!Number.isFinite(payment)||balance<=0||payment<=0)return;let bal=balance,totalInterest=0,months=0;const monthlyRate=apr/100/12;for(;bal>.01&&months<1200;){const interest=bal*monthlyRate;if(totalInterest+=interest,bal+=interest,payment<=interest&&monthlyRate>0)return void show("Credit card payoff result",[["Balance",money(balance)],["Monthly interest",money(interest)],["Monthly payment",money(payment)],["Status","Payment is too low to reduce the balance"]],"Increase the monthly payment to pay off the card.");bal-=payment,months+=1}show("Credit card payoff result",[["Months to pay off",months+" months"],["Years to pay off",(months/12).toFixed(1)+" years"],["Total interest",money(totalInterest)],["Total paid",money(balance+totalInterest)]])},window.calculateLoanComparisonExtra=function(){const amount=n("loanCompareAmount"),rateA=n("loanCompareRateA"),termA=n("loanCompareTermA"),rateB=n("loanCompareRateB"),termB=n("loanCompareTermB");if(![amount,rateA,termA,rateB,termB].every(Number.isFinite))return;const monthsA=12*termA,monthsB=12*termB,payA=loanPayment(amount,rateA,monthsA),payB=loanPayment(amount,rateB,monthsB),totalA=payA*monthsA,totalB=payB*monthsB;show("Loan comparison result",[["Loan A monthly payment",money(payA)],["Loan A total interest",money(totalA-amount)],["Loan A total paid",money(totalA)],["Loan B monthly payment",money(payB)],["Loan B total interest",money(totalB-amount)],["Loan B total paid",money(totalB)],["Lower total cost",totalA<=totalB?"Loan A":"Loan B"],["Difference",money(Math.abs(totalA-totalB))]])},window.calculateDebtPayoffExtra=function(){const debt=n("debtTotal"),apr=n("debtApr"),payment=n("debtPayment"),extra=n("debtExtra");if(![debt,apr,payment].every(Number.isFinite)||debt<=0||payment<=0)return;const monthlyPayment=payment+(Number.isFinite(extra)?extra:0);let bal=debt,totalInterest=0,months=0;const rate=apr/100/12;for(;bal>.01&&months<1200;){const interest=bal*rate;if(totalInterest+=interest,bal+=interest,monthlyPayment<=interest&&rate>0)return void show("Debt payoff result",[["Monthly interest",money(interest)],["Monthly payment",money(monthlyPayment)],["Status","Payment is too low to reduce debt"]]);bal-=monthlyPayment,months+=1}show("Debt payoff result",[["Total debt",money(debt)],["Monthly payment used",money(monthlyPayment)],["Months to debt free",months+" months"],["Years to debt free",(months/12).toFixed(1)+" years"],["Total interest",money(totalInterest)]])},window.calculateTaxExtra=function(){const income=n("taxAnnualIncome"),relief=n("taxRelief"),rate=n("taxRate");if(!Number.isFinite(income)||income<=0)return;const taxable=Math.max(0,income-(Number.isFinite(relief)?relief:0)),tax=taxable*((Number.isFinite(rate)?rate:10)/100);show("Tax estimator result",[["Annual income",money(income)],["Relief / deduction",money(Number.isFinite(relief)?relief:0)],["Estimated taxable income",money(taxable)],["Tax rate used",(Number.isFinite(rate)?rate:10).toFixed(2)+"%"],["Estimated tax",money(tax)],["Estimated monthly tax",money(tax/12)]],"This is a simple estimator using your entered rate. It is not official tax advice.")},window.calculateGajiPenjawatAwamExtra=function(){const basic=n("gajiBasic"),fixed=n("gajiFixedAllowance"),cola=n("gajiCola"),other=n("gajiOtherAllowance"),deductions=n("gajiDeductions");if(!Number.isFinite(basic)||basic<=0)return;const allowance=(Number.isFinite(fixed)?fixed:0)+(Number.isFinite(cola)?cola:0)+(Number.isFinite(other)?other:0),gross=basic+allowance,net=gross-(Number.isFinite(deductions)?deductions:0);show("Gaji penjawat awam result",[["Gaji pokok",money(basic)],["Jumlah elaun",money(allowance)],["Gaji kasar",money(gross)],["Potongan",money(Number.isFinite(deductions)?deductions:0)],["Anggaran gaji bersih",money(net)]],"Masukkan nilai elaun dan potongan sendiri mengikut slip gaji anda.")},window.calculateInflationExtra=function(){const amount=n("inflationAmount"),rate=n("inflationRate"),years=n("inflationYears");if(![amount,rate,years].every(Number.isFinite))return;const future=amount*Math.pow(1+rate/100,years),loss=amount/Math.pow(1+rate/100,years);show("Inflation result",[["Today amount",money(amount)],["Inflation rate",rate.toFixed(2)+"%"],["Years",years],["Future cost estimate",money(future)],["Today buying power after period",money(loss)]])},window.calculateRentalYieldExtra=function(){const price=n("rentalPropertyPrice"),rent=n("rentalMonthlyRent"),expenses=n("rentalAnnualExpenses");if(!Number.isFinite(price)||!Number.isFinite(rent)||price<=0)return;const annualRent=12*rent,grossYield=annualRent/price*100,netYield=(annualRent-(Number.isFinite(expenses)?expenses:0))/price*100;show("Rental yield result",[["Property price",money(price)],["Annual rent",money(annualRent)],["Annual expenses",money(Number.isFinite(expenses)?expenses:0)],["Gross rental yield",grossYield.toFixed(2)+"%"],["Net rental yield",netYield.toFixed(2)+"%"]])},window.calculateFuelCostExtra=function(){const distance=n("fuelDistance"),efficiency=n("fuelEfficiency"),price=n("fuelPrice"),people=n("fuelPeople");if(![distance,efficiency,price].every(Number.isFinite)||efficiency<=0)return;const liters=distance/100*efficiency,total=liters*price,perPerson=total/(Number.isFinite(people)&&people>0?people:1);show("Fuel cost result",[["Distance",num(distance)+" km"],["Fuel needed",num(liters)+" L"],["Total fuel cost",money(total)],["Cost per person",money(perPerson)]])},window.calculateCreditCardInterestExtra=function(){const balance=n("ccInterestBalance"),apr=n("ccInterestApr"),days=n("ccInterestDays"),payment=n("ccInterestPayment");if(![balance,apr,days].every(Number.isFinite))return;const afterPayment=Math.max(0,balance-(Number.isFinite(payment)?payment:0)),interest=afterPayment*(apr/100)*(days/365);show("Credit card interest result",[["Starting balance",money(balance)],["Payment",money(Number.isFinite(payment)?payment:0)],["Balance used",money(afterPayment)],["APR",apr.toFixed(2)+"%"],["Days",days],["Estimated interest",money(interest)]])},window.calculateScientificExtra=function(){const input=document.getElementById("scientificExpression");input&&input.dispatchEvent(new Event("input",{bubbles:!0}));document.querySelectorAll("#extraCalcResult,#universalLoanStyleOutput,.extra-result-box,.calculator-result,.result-box").forEach(function(box){box.hidden=!0;box.innerHTML="";box.style.setProperty("display","none","important")})};const unitFactors={length:{m:1,km:1e3,cm:.01,mm:.001,mile:1609.344,yard:.9144,foot:.3048,inch:.0254},weight:{kg:1,g:.001,lb:.45359237,oz:.0283495},volume:{liter:1,ml:.001,gallon:3.78541,cup:.236588}};window.calculateUnitConverterExtra=function(){const type=val("unitType"),value=n("unitValue"),from=val("unitFrom"),to=val("unitTo");if(!(Number.isFinite(value)&&type&&from&&to))return;let result;if("temperature"===type)result=function(value,from,to){let c=value;return"f"===from&&(c=5*(value-32)/9),"k"===from&&(c=value-273.15),"f"===to?9*c/5+32:"k"===to?c+273.15:c}(value,from,to);else{const factors=unitFactors[type]||{};result=value*factors[from]/factors[to]}show("Unit converter result",[["Value",num(value)+" "+from],["Converted",num(result,6)+" "+to]])},window.calculateCurrencyConverterExtra=function(){const amount=n("currencyAmount"),from=val("currencyFrom").toUpperCase()||"FROM",to=val("currencyTo").toUpperCase()||"TO",rate=n("currencyRate");Number.isFinite(amount)&&Number.isFinite(rate)&&show("Currency converter result",[["Amount",num(amount)+" "+from],["Exchange rate used","1 "+from+" = "+num(rate,6)+" "+to],["Converted amount",num(amount*rate,2)+" "+to]],"This static GitHub Pages converter uses the exchange rate you enter manually.")};const pageMap={salary:window.calculateSalaryExtra,creditCardPayoff:window.calculateCreditCardPayoffExtra,loanComparison:window.calculateLoanComparisonExtra,debtPayoff:window.calculateDebtPayoffExtra,tax:window.calculateTaxExtra,gajiPenjawatAwam:window.calculateGajiPenjawatAwamExtra,inflation:window.calculateInflationExtra,rentalYield:window.calculateRentalYieldExtra,fuelCost:window.calculateFuelCostExtra,creditCardInterest:window.calculateCreditCardInterestExtra,scientific:window.calculateScientificExtra,unitConverter:window.calculateUnitConverterExtra,currencyConverter:window.calculateCurrencyConverterExtra};function start(){const fn=pageMap[document.body?document.body.dataset.page:""];if(!fn)return;let timer=null;document.addEventListener("input",function(event){event.target.closest(".extra-calculator-box")&&(clearTimeout(timer),timer=setTimeout(fn,2e3))},!0),document.addEventListener("change",function(event){event.target.closest(".extra-calculator-box")&&(clearTimeout(timer),timer=setTimeout(fn,2e3))},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function setupExtraHelpButton(){const button=document.querySelector(".extra-help-question-button"),panel=document.querySelector(".extra-help-panel");function setOpen(open){panel.hidden=!open,document.body.classList.toggle("extra-help-open",open),button.setAttribute("aria-expanded",open?"true":"false")}button&&panel&&"true"!==button.dataset.ready&&(button.dataset.ready="true",panel.hidden=!0,button.addEventListener("click",function(event){event.preventDefault(),event.stopPropagation(),setOpen(panel.hidden)}),document.addEventListener("keydown",function(event){"Escape"===event.key&&setOpen(!1)}),document.addEventListener("click",function(event){panel.hidden||panel.contains(event.target)||button.contains(event.target)||setOpen(!1)}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",setupExtraHelpButton):setupExtraHelpButton()}(),function(){"use strict";function keepFirst(selector){Array.prototype.slice.call(document.querySelectorAll(selector)).slice(1).forEach(function(node){node.remove()})}function cleanOnce(){const menu=document.getElementById("menuIcon");menu&&menu.remove(),document.body.classList.remove("menu-scrolled"),document.documentElement.classList.remove("menu-scrolled");const nav=document.getElementById("navbar");nav&&(nav.classList.remove("open"),nav.classList.add("clean-navbar")),keepFirst("#navbar"),keepFirst("main.grouped-calculator-home"),keepFirst("#liveAbacus"),keepFirst("#liveAbacusValueText"),keepFirst("#liveAbacusReset")}function val(id){const el=document.getElementById(id);return el?String(el.value||"").trim():""}function has(ids){return ids.some(function(id){return""!==val(id)})}function all(ids){return ids.every(function(id){return""!==val(id)})}function pageType(){const path=(location.pathname||"").toLowerCase();return path.includes("age-calculator")?"age":path.includes("bmi-calculator")?"bmi":path.includes("mortgage-calculator")?"loan":path.includes("personal-loan-calculator")?"personalLoan":path.includes("discount-calculator")?"discount":path.includes("percentage-calculator")?"percentage":path.includes("compound-interest-calculator")?"compound":path.includes("salary-calculator")?"salary":path.includes("credit-card-payoff-calculator")?"creditCardPayoff":path.includes("loan-comparison-calculator")?"loanComparison":path.includes("debt-payoff-calculator")?"debtPayoff":path.includes("tax-calculator")?"tax":path.includes("gaji-penjawat-awam-calculator")?"gajiPenjawatAwam":path.includes("inflation-calculator")?"inflation":path.includes("rental-yield-calculator")?"rentalYield":path.includes("fuel-cost-calculator")?"fuelCost":path.includes("credit-card-interest-calculator")?"creditCardInterest":path.includes("scientific-calculator")?"scientific":path.includes("unit-converter-calculator")?"unitConverter":path.includes("currency-converter")?"currencyConverter":""}function canCalc(type){if("age"===type)return has(["birthdate"]);if("bmi"===type)return has(["weight","bmiWeight"])&&has(["height","bmiHeight"]);if("loan"===type)return all(["amount","interest","years"]);if("personalLoan"===type)return has(["personalLoanAmount","loanAmount","amount"]);if("discount"===type)return all(["price","discount"]);if("percentage"===type)return has(["percentage","percent"])&&has(["number","amount","value"]);if("compound"===type)return all(["principal","rate","years"]);const required={salary:["salaryGross"],creditCardPayoff:["ccBalance","ccApr","ccPayment"],loanComparison:["loanCompareAmount","loanCompareRateA","loanCompareTermA","loanCompareRateB","loanCompareTermB"],debtPayoff:["debtTotal","debtApr","debtPayment"],tax:["taxAnnualIncome"],gajiPenjawatAwam:["gajiBasic"],inflation:["inflationAmount","inflationRate","inflationYears"],rentalYield:["rentalPropertyPrice","rentalMonthlyRent"],fuelCost:["fuelDistance","fuelEfficiency","fuelPrice"],creditCardInterest:["ccInterestBalance","ccInterestApr","ccInterestDays"],scientific:["scientificExpression"],unitConverter:["unitType","unitValue","unitFrom","unitTo"],currencyConverter:["currencyAmount","currencyFrom","currencyTo","currencyRate"]};return!!required[type]&&all(required[type])}function callCalc(type){const fn={age:"calculateAge",bmi:"calculateBMI",loan:"calculateLoan",personalLoan:"calculatePersonalLoan",discount:"calculateDiscount",percentage:"calculatePercentage",compound:"calculateCompound",salary:"calculateSalaryExtra",creditCardPayoff:"calculateCreditCardPayoffExtra",loanComparison:"calculateLoanComparisonExtra",debtPayoff:"calculateDebtPayoffExtra",tax:"calculateTaxExtra",gajiPenjawatAwam:"calculateGajiPenjawatAwamExtra",inflation:"calculateInflationExtra",rentalYield:"calculateRentalYieldExtra",fuelCost:"calculateFuelCostExtra",creditCardInterest:"calculateCreditCardInterestExtra",scientific:"calculateScientificExtra",unitConverter:"calculateUnitConverterExtra",currencyConverter:"calculateCurrencyConverterExtra"}[type];fn&&"function"==typeof window[fn]&&window[fn]()}var fn;fn=function(){cleanOnce(),function(){let timer=null;document.addEventListener("input",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;if(target.closest("#navbar, #scrollTopBtn, .clean-nav-search"))return;const type=pageType();type&&(clearTimeout(timer),timer=setTimeout(function(){canCalc(type)&&callCalc(type)},2e3))},!0),document.addEventListener("change",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;if(target.closest("#navbar, #scrollTopBtn, .clean-nav-search"))return;const type=pageType();type&&(clearTimeout(timer),timer=setTimeout(function(){canCalc(type)&&callCalc(type)},2e3))},!0)}()},"loading"===document.readyState?document.addEventListener("DOMContentLoaded",fn):fn(),window.toggleMenu=function(){return cleanOnce(),!1}}(),function(){"use strict";function setupFinalTopMenuHoverClick(){const nav=document.querySelector("#navbar.clean-navbar");function topDropdowns(){return Array.from(nav.querySelectorAll(".clean-nav-dropdown"))}function submenus(){return Array.from(nav.querySelectorAll(".clean-nav-submenu"))}function directButton(parent,selector){return parent?parent.querySelector(":scope > "+selector):null}function setTopExpanded(dropdown,open){const button=directButton(dropdown,".clean-nav-button");button&&button.setAttribute("aria-expanded",open?"true":"false")}function setSubExpanded(submenu,open){const button=directButton(submenu,".clean-nav-submenu-button");button&&button.setAttribute("aria-expanded",open?"true":"false")}function closeTopDropdown(dropdown){dropdown&&(dropdown.classList.remove("is-open"),setTopExpanded(dropdown,!1),function(dropdown){dropdown&&dropdown.querySelectorAll(".clean-nav-submenu.is-open").forEach(function(submenu){submenu.classList.remove("is-open"),setSubExpanded(submenu,!1)})}(dropdown))}function closeEverything(){topDropdowns().forEach(closeTopDropdown)}function openTopDropdown(dropdown){dropdown&&(topDropdowns().forEach(function(item){item!==dropdown&&closeTopDropdown(item)}),dropdown.classList.add("is-open"),setTopExpanded(dropdown,!0))}function openSubmenu(submenu){if(!submenu)return;const topDropdown=submenu.closest(".clean-nav-dropdown");topDropdown&&openTopDropdown(topDropdown),function(currentSubmenu){const parentPanel=currentSubmenu?currentSubmenu.closest(".clean-nav-dropdown-panel"):null;submenus().forEach(function(submenu){submenu!==currentSubmenu&&(parentPanel&&submenu.closest(".clean-nav-dropdown-panel")!==parentPanel||(submenu.classList.remove("is-open"),setSubExpanded(submenu,!1)))})}(submenu),submenu.classList.add("is-open"),setSubExpanded(submenu,!0)}nav&&"true"!==nav.dataset.finalTopMenuHoverClick&&(nav.dataset.finalTopMenuHoverClick="true",submenus().forEach(function(submenu){const button=directButton(submenu,".clean-nav-submenu-button");button&&!button.hasAttribute("aria-expanded")&&button.setAttribute("aria-expanded",submenu.classList.contains("is-open")?"true":"false")}),nav.addEventListener("mouseover",function(event){const submenu=event.target.closest(".clean-nav-submenu");if(submenu&&nav.contains(submenu))return void openSubmenu(submenu);const dropdown=event.target.closest(".clean-nav-dropdown");dropdown&&nav.contains(dropdown)?openTopDropdown(dropdown):event.target.closest(".clean-nav-link, .clean-nav-search")&&closeEverything()},!0),nav.addEventListener("click",function(event){const submenuButton=event.target.closest(".clean-nav-submenu-button");if(submenuButton&&nav.contains(submenuButton)){const submenu=submenuButton.closest(".clean-nav-submenu");if(submenu)return event.preventDefault(),event.stopImmediatePropagation(),void openSubmenu(submenu)}const topButton=event.target.closest(".clean-nav-button");if(topButton&&nav.contains(topButton)){const dropdown=topButton.closest(".clean-nav-dropdown");if(dropdown)return event.preventDefault(),event.stopImmediatePropagation(),void openTopDropdown(dropdown)}event.target.closest(".clean-nav-link, .clean-nav-search-input")&&closeEverything()},!0),nav.addEventListener("focusin",function(event){const submenu=event.target.closest(".clean-nav-submenu");if(submenu&&nav.contains(submenu))return void openSubmenu(submenu);const dropdown=event.target.closest(".clean-nav-dropdown");dropdown&&nav.contains(dropdown)?openTopDropdown(dropdown):event.target.closest(".clean-nav-link, .clean-nav-search")&&closeEverything()},!0),document.addEventListener("click",function(event){nav.contains(event.target)||closeEverything()}),document.addEventListener("keydown",function(event){"Escape"===event.key&&closeEverything()}),nav.addEventListener("mouseleave",function(){window.setTimeout(function(){nav.matches(":hover")||nav.contains(document.activeElement)||closeEverything()},250)}))}function startFinalTopMenuHoverClick(){setupFinalTopMenuHoverClick(),window.setTimeout(setupFinalTopMenuHoverClick,250),window.setTimeout(setupFinalTopMenuHoverClick,800)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startFinalTopMenuHoverClick):startFinalTopMenuHoverClick()}(),function(){"use strict";const ACTION_ROW_SELECTOR=[".age-result-actions",".bmi-result-actions",".universal-result-actions",".mortgage-result-actions",".mortgage-result-actions-final",".extra-result-actions",".global-result-actions",".calculator-report-actions"].join(", ");function forceImportant(element,property,value){element&&element.style&&element.style.setProperty(property,value,"important")}function fixActionRows(root){const scope=root&&root.querySelectorAll?root:document,rows=[];scope.matches&&scope.matches(ACTION_ROW_SELECTOR)&&rows.push(scope),scope.querySelectorAll(ACTION_ROW_SELECTOR).forEach(function(row){rows.push(row)}),rows.forEach(function(row){const buttons=Array.from(row.children).filter(function(child){return child&&child.matches&&child.matches("button, a")});buttons.length&&(row.classList.add("calculator-action-row-fixed"),row.setAttribute("data-result-actions-fixed","true"),forceImportant(row,"width","100%"),forceImportant(row,"max-width","100%"),forceImportant(row,"display","grid"),forceImportant(row,"grid-template-columns","repeat("+buttons.length+", minmax(0, 1fr))"),forceImportant(row,"gap",window.matchMedia("(max-width: 850px)").matches?"5px":"8px"),forceImportant(row,"align-items","stretch"),forceImportant(row,"justify-content","stretch"),forceImportant(row,"box-sizing","border-box"),buttons.forEach(function(button){button.classList.add("calculator-action-button-fixed"),forceImportant(button,"width","100%"),forceImportant(button,"min-width","0"),forceImportant(button,"max-width","100%"),forceImportant(button,"height",window.matchMedia("(max-width: 850px)").matches?"36px":"40px"),forceImportant(button,"min-height",window.matchMedia("(max-width: 850px)").matches?"36px":"40px"),forceImportant(button,"margin","0"),forceImportant(button,"padding",window.matchMedia("(max-width: 850px)").matches?"5px 2px":"6px 4px"),forceImportant(button,"display","inline-flex"),forceImportant(button,"align-items","center"),forceImportant(button,"justify-content","center"),forceImportant(button,"box-sizing","border-box"),forceImportant(button,"text-align","center"),forceImportant(button,"line-height","1"),forceImportant(button,"white-space","nowrap"),forceImportant(button,"overflow","hidden"),forceImportant(button,"text-overflow","ellipsis")}))})}function startResultActionRowFix(){fixActionRows(document),[100,300,700,1200].forEach(function(delay){setTimeout(function(){fixActionRows(document)},delay)}),document.body&&!document.body.dataset.resultActionRowObserverReady&&(document.body.dataset.resultActionRowObserverReady="true",new MutationObserver(function(mutations){mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){node&&1===node.nodeType&&fixActionRows(node)})})}).observe(document.body,{childList:!0,subtree:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startResultActionRowFix):startResultActionRowFix()}(),function(){"use strict";const NATIVE_RESULT_IDS=["result","ageResult","bmiResult","loanResult","personalLoanResult","discountResult","percentageResult","compoundResult"],RESULT_GROUPS=[{name:"basic",preferredIds:["universalLoanStyleOutput"],selector:"#universalLoanStyleOutput, .basic-equal-output-panel"},{name:"age",preferredIds:["ageReportOutput"],selector:"#ageReportOutput, .age-clean-result, .age-point-output, #ageResult"},{name:"bmi",preferredIds:["bmiReportOutput"],selector:"#bmiReportOutput, .bmi-clean-result, .bmi-box-output, #bmiResult"},{name:"loanMortgage",preferredIds:["loanExternalOutput"],selector:"#loanExternalOutput, .loan-clean-result, .mortgage-modern-result-panel, #loanResult"},{name:"personalLoan",preferredIds:["personalLoanExternalOutput"],selector:"#personalLoanExternalOutput, .personalLoan-clean-result, .personal-loan-clean-result, #personalLoanResult"},{name:"discount",preferredIds:["discountReportOutput"],selector:"#discountReportOutput, .discount-clean-result, #discountResult"},{name:"percentage",preferredIds:["percentageReportOutput"],selector:"#percentageReportOutput, .percentage-clean-result, #percentageResult"},{name:"compound",preferredIds:["compoundReportOutput"],selector:"#compoundReportOutput, .compound-clean-result, #compoundResult"},{name:"extra",preferredIds:["extraCalcResult"],selector:"#extraCalcResult, .extra-result-box"}];function isElement(node){return!(!node||1!==node.nodeType)}function hideElement(el){isElement(el)&&(el.hidden=!0,el.style.setProperty("display","none","important"),el.style.setProperty("visibility","hidden","important"),el.style.setProperty("opacity","0","important"),el.setAttribute("aria-hidden","true"))}function isNativeResultPlaceholder(el){return!(!isElement(el)||!el.id||-1===NATIVE_RESULT_IDS.indexOf(el.id))}function collectPanels(selector){return function(list){const seen=new Set;return list.filter(function(el){return!(!isElement(el)||seen.has(el)||(seen.add(el),0))})}(Array.from(document.querySelectorAll(selector))).filter(function(el){return!el.closest("#calculatorReportPage")})}function cleanupGroup(group){const panels=collectPanels(group.selector);if(!panels.length)return;if(document.body&&(document.body.classList.contains("calculator-report-view")||document.getElementById("calculatorReportPage")||0===String(window.location.hash||"").indexOf("#calc-report=")))return void panels.forEach(hideElement);const keep=function(group,panels){for(let i=0;i<group.preferredIds.length;i+=1){const el=document.getElementById(group.preferredIds[i]);if(el&&-1!==panels.indexOf(el))return el}const visiblePanels=panels.filter(function(el){if(isNativeResultPlaceholder(el))return!1;const style=window.getComputedStyle?window.getComputedStyle(el):null;return!style||"none"!==style.display&&"hidden"!==style.visibility});return visiblePanels[visiblePanels.length-1]||panels[panels.length-1]||null}(group,panels);var el;panels.forEach(function(panel){panel!==keep&&(isNativeResultPlaceholder(panel)||panel.id&&-1===group.preferredIds.indexOf(panel.id)?hideElement(panel):panel.remove())}),keep&&!isNativeResultPlaceholder(keep)&&isElement(el=keep)&&(el.hidden=!1,el.style.setProperty("display","block","important"),el.style.setProperty("visibility","visible","important"),el.style.setProperty("opacity","1","important"),el.removeAttribute("aria-hidden"))}function cleanupDuplicateResults(){NATIVE_RESULT_IDS.forEach(function(id){const el=document.getElementById(id);el&&!el.closest("#calculatorReportPage")&&hideElement(el)}),RESULT_GROUPS.forEach(function(group){cleanupGroup(group)})}function scheduleCleanup(){cleanupDuplicateResults(),[50,150,350,750,1400,2600].forEach(function(delay){window.setTimeout(cleanupDuplicateResults,delay)})}function start(){document.body&&"true"!==document.body.dataset.finalDoubleRenderGuardReady&&(document.body.dataset.finalDoubleRenderGuardReady="true",scheduleCleanup(),document.addEventListener("input",function(event){event.target&&event.target.closest&&event.target.closest("#navbar, .clean-nav-search, .site-search")||scheduleCleanup()},!0),document.addEventListener("change",function(event){event.target&&event.target.closest&&event.target.closest("#navbar, .clean-nav-search, .site-search")||scheduleCleanup()},!0),window.addEventListener("hashchange",scheduleCleanup),window.addEventListener("pageshow",scheduleCleanup),new MutationObserver(function(mutations){let shouldCleanup=!1;mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){isElement(node)&&(node.matches&&(node.matches(".calculator-clean-result, .loan-style-output-panel, .extra-result-box")||node.matches(NATIVE_RESULT_IDS.map(function(id){return"#"+id}).join(", ")))&&(shouldCleanup=!0),node.querySelector&&node.querySelector(".calculator-clean-result, .loan-style-output-panel, .extra-result-box, "+NATIVE_RESULT_IDS.map(function(id){return"#"+id}).join(", "))&&(shouldCleanup=!0))})}),shouldCleanup&&(window.clearTimeout(window.__finalResultDedupeTimer),window.__finalResultDedupeTimer=window.setTimeout(cleanupDuplicateResults,30))}).observe(document.body,{childList:!0,subtree:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function setupIndexDropdownOverlay(){var grid=document.querySelector("body.index-page .index-category-dropdown-grid");if(grid&&"true"!==grid.dataset.indexDropdownOverlayReady){var cards=Array.prototype.slice.call(grid.querySelectorAll("details.index-category-dropdown"));cards.length&&(grid.dataset.indexDropdownOverlayReady="true",cards.forEach(function(card){var summary=card.querySelector(":scope > summary");card.addEventListener("toggle",function(){card.open?(card.classList.add("is-index-dropdown-open"),closeOthers(card),clampPanel(card)):card.classList.remove("is-index-dropdown-open")}),summary&&summary.addEventListener("click",function(){window.setTimeout(function(){card.open&&(closeOthers(card),clampPanel(card))},0)}),card.addEventListener("mouseenter",function(){window.matchMedia("(hover: hover)").matches&&function(card){closeOthers(card),card.open=!0,card.classList.add("is-index-dropdown-open"),clampPanel(card)}(card)}),card.addEventListener("mouseleave",function(){window.matchMedia("(hover: hover)").matches&&window.setTimeout(function(){card.matches(":hover")||card.contains(document.activeElement)||closeCard(card)},180)})}),document.addEventListener("click",function(event){grid.contains(event.target)||closeAll()}),document.addEventListener("keydown",function(event){"Escape"===event.key&&closeAll()}),window.addEventListener("resize",function(){cards.forEach(function(card){card.open&&clampPanel(card)})}))}function closeCard(card){card&&(card.open=!1,card.classList.remove("is-index-dropdown-open"))}function closeOthers(activeCard){cards.forEach(function(card){card!==activeCard&&closeCard(card)})}function closeAll(){cards.forEach(closeCard)}function clampPanel(card){var panel=function(card){return card?card.querySelector(":scope > .index-category-dropdown-panel"):null}(card);panel&&card.open&&(panel.style.maxHeight="",panel.style.left="",panel.style.right="",panel.style.transform="",window.requestAnimationFrame(function(){if(card.open){var rect=panel.getBoundingClientRect();rect.right>window.innerWidth-14&&(panel.style.left="auto",panel.style.right="0",panel.style.transform="none"),(rect=panel.getBoundingClientRect()).left<14&&(panel.style.left="0",panel.style.right="auto",panel.style.transform="none"),rect=panel.getBoundingClientRect();var availableHeight=Math.max(180,window.innerHeight-rect.top-14);panel.style.maxHeight=Math.min(availableHeight,520)+"px"}}))}}function start(){setupIndexDropdownOverlay(),window.setTimeout(setupIndexDropdownOverlay,250),window.setTimeout(setupIndexDropdownOverlay,800)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function isResultPanel(el){return!(!el||1!==el.nodeType||!(el.classList.contains("calculator-clean-result")||el.classList.contains("loan-style-output-panel")||el.classList.contains("extra-result-box")||/ReportOutput$/.test(el.id||"")||-1!==["universalLoanStyleOutput","loanExternalOutput","personalLoanExternalOutput","ageReportOutput","bmiReportOutput"].indexOf(el.id)))}function fixResultPlacement(){Array.from(document.querySelectorAll(".calculator-clean-result, .loan-style-output-panel, .extra-result-box, #universalLoanStyleOutput, #loanExternalOutput, #personalLoanExternalOutput, #ageReportOutput, #bmiReportOutput, [id$='ReportOutput']")).filter(isResultPanel).forEach(function(panel){if(panel.closest("#calculatorReportPage"))return;var el;((el=panel)?el.closest(".tool-layout, .old-calculator-layout, .calculator-container, .age-calculator-container, .bmi-calculator-container, .loan-calculator-container, .percentage-calculator-container, .discount-calculator-container, .compound-calculator-container"):null)&&(panel.classList.add("full-width-result-section"),panel.style.setProperty("grid-column","1 / -1","important"),panel.style.setProperty("width","100%","important"),panel.style.setProperty("max-width","100%","important"))})}function start(){fixResultPlacement(),[80,200,500,1e3,1800].forEach(function(delay){window.setTimeout(fixResultPlacement,delay)}),document.body&&!document.body.dataset.fullWidthResultLayoutReady&&(document.body.dataset.fullWidthResultLayoutReady="true",new MutationObserver(function(mutations){let shouldFix=!1;mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){node&&1===node.nodeType&&(isResultPanel(node)||node.querySelector&&node.querySelector(".calculator-clean-result, .loan-style-output-panel, .extra-result-box"))&&(shouldFix=!0)})}),shouldFix&&window.setTimeout(fixResultPlacement,20)}).observe(document.body,{childList:!0,subtree:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";const RESULT_SELECTOR=[".calculator-clean-result",".loan-style-output-panel",".extra-result-box","#universalLoanStyleOutput","#loanExternalOutput","#personalLoanExternalOutput","#ageReportOutput","#bmiReportOutput","[id$='ReportOutput']"].join(", "),IGNORE_ACTION_SELECTOR=["#calculatorReportPage",".age-result-actions",".bmi-result-actions",".universal-result-actions",".mortgage-result-actions",".loan-result-actions",".report-actions",".saved-report-actions"].join(", ");let lastInputAt=0,actionSequence=0,lastScrolledSequence=-1,pendingTimer=null,pendingPanel=null;function now(){return Date.now?Date.now():(new Date).getTime()}function markUserInput(event){if(!document.querySelector(".calculator, main.pc-calculator-layout, .tool-layout, .old-calculator-layout, .age-calculator-container, .bmi-calculator-container, .loan-calculator-container"))return;const target=event&&event.target;if(!target||!target.closest)return;if(target.closest(IGNORE_ACTION_SELECTOR))return;const control=target.closest("input, select, textarea, button, .calculator button, .calc-button, .btn, [role='button']");if(!control)return;control.closest(".calculator, main.pc-calculator-layout, .tool-layout, form, .main-content, body")&&(lastInputAt=now(),actionSequence+=1)}function isUsableResultPanel(panel){if(!panel||1!==panel.nodeType)return!1;if(panel.closest("#calculatorReportPage"))return!1;if(panel.hidden)return!1;const style=window.getComputedStyle(panel);if("none"===style.display||"hidden"===style.visibility||0===Number(style.opacity))return!1;const rect=panel.getBoundingClientRect();if(rect.width<40||rect.height<40)return!1;return(panel.textContent||"").replace(/\s+/g," ").trim().length>8}function getBestPanel(fromNode){if(fromNode&&1===fromNode.nodeType){if(fromNode.matches&&fromNode.matches(RESULT_SELECTOR)&&isUsableResultPanel(fromNode))return fromNode;const nested=fromNode.querySelector&&fromNode.querySelector(RESULT_SELECTOR);if(nested&&isUsableResultPanel(nested))return nested}const panels=Array.from(document.querySelectorAll(RESULT_SELECTOR)).filter(isUsableResultPanel);return panels.length?(panels.sort(function(a,b){const ar=a.getBoundingClientRect();return b.getBoundingClientRect().top-ar.top}),panels[0]):null}function scrollToPanel(panel){if(!isUsableResultPanel(panel))return;if(lastScrolledSequence===actionSequence)return;const elapsed=now()-lastInputAt;if(!lastInputAt||elapsed>9e3)return;if(function(panel){const rect=panel.getBoundingClientRect(),bottomSafe=window.innerHeight-90;return rect.top>=90&&rect.top<=bottomSafe&&rect.height>0}(panel))return void(lastScrolledSequence=actionSequence);lastScrolledSequence=actionSequence;const rect=panel.getBoundingClientRect(),offset=window.innerWidth<=850?76:96,targetTop=Math.max(0,window.pageYOffset+rect.top-offset),smooth=!window.matchMedia||!window.matchMedia("(prefers-reduced-motion: reduce)").matches;try{window.scrollTo({top:targetTop,behavior:smooth?"smooth":"auto"})}catch(error){window.scrollTo(0,targetTop)}}function watchResults(){document.body&&"true"!==document.body.dataset.autoScrollResultReady&&(document.body.dataset.autoScrollResultReady="true",document.addEventListener("input",markUserInput,!0),document.addEventListener("change",markUserInput,!0),document.addEventListener("click",markUserInput,!0),new MutationObserver(function(mutations){let panel=null;mutations.forEach(function(mutation){if(!panel){if(mutation.target&&1===mutation.target.nodeType){const targetPanel=mutation.target.closest&&mutation.target.closest(RESULT_SELECTOR);if(targetPanel&&isUsableResultPanel(targetPanel))return void(panel=targetPanel)}mutation.addedNodes.forEach(function(node){if(panel||!node||1!==node.nodeType)return;const candidate=getBestPanel(node);candidate&&(panel=candidate)})}}),panel&&function(panel){const bestPanel=getBestPanel(panel);bestPanel&&(!lastInputAt||now()-lastInputAt>9e3||(pendingPanel=bestPanel,pendingTimer&&window.clearTimeout(pendingTimer),pendingTimer=window.setTimeout(function waitUntilTypingStops(){const elapsed=now()-lastInputAt;elapsed<2e3?pendingTimer=window.setTimeout(waitUntilTypingStops,2e3-elapsed+40):(pendingTimer=null,scrollToPanel(pendingPanel),pendingPanel=null)},260)))}(panel)}).observe(document.body,{childList:!0,subtree:!0,characterData:!0}))}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",watchResults):watchResults()}(),function(){"use strict";const RESULT_BOX_ID_BY_PAGE={loan:"loanExternalOutput",personalLoan:"personalLoanExternalOutput",discount:"discountReportOutput",loanComparison:"extraCalcResult",debtPayoff:"extraCalcResult",creditCardPayoff:"extraCalcResult",creditCardInterest:"extraCalcResult",rentalYield:"extraCalcResult",fuelCost:"extraCalcResult",salary:"extraCalcResult",gajiPenjawatAwam:"extraCalcResult",tax:"extraCalcResult",currencyConverter:"extraCalcResult",inflation:"extraCalcResult",scientific:"extraCalcResult",unitConverter:"extraCalcResult"};function $(id){return document.getElementById(id)}function pageType(){const path=String(location.pathname||"").toLowerCase(),bodyPage=document.body?String(document.body.dataset.page||"").toLowerCase():"";return path.includes("mortgage-calculator")||"loan"===bodyPage?"loan":path.includes("personal-loan-calculator")||"personal-loan"===bodyPage?"personalLoan":path.includes("loan-comparison-calculator")||"loancomparison"===bodyPage?"loanComparison":path.includes("debt-payoff-calculator")||"debtpayoff"===bodyPage?"debtPayoff":path.includes("credit-card-payoff-calculator")||"creditcardpayoff"===bodyPage?"creditCardPayoff":path.includes("credit-card-interest-calculator")||"creditcardinterest"===bodyPage?"creditCardInterest":path.includes("rental-yield-calculator")||"rentalyield"===bodyPage?"rentalYield":path.includes("fuel-cost-calculator")||"fuelcost"===bodyPage?"fuelCost":path.includes("salary-calculator")||"salary"===bodyPage?"salary":path.includes("gaji-penjawat-awam-calculator")||"gajipenjawatawam"===bodyPage?"gajiPenjawatAwam":path.includes("tax-calculator")||"tax"===bodyPage?"tax":path.includes("currency-converter")||"currencyconverter"===bodyPage?"currencyConverter":path.includes("scientific-calculator")||"scientific"===bodyPage?"scientific":path.includes("unit-converter-calculator")||"unitconverter"===bodyPage?"unitConverter":path.includes("discount-calculator")||"discount"===bodyPage?"discount":path.includes("inflation-calculator")||"inflation"===bodyPage?"inflation":""}function numberFromInput(id){const input=$(id);if(!input)return NaN;const raw=String(input.value||"").replace(/,/g,"").trim();return""===raw?NaN:Number(raw)}function valueFromInput(id){const input=$(id);return input?String(input.value||"").trim():""}function firstNumber(ids){for(const id of ids){const n=numberFromInput(id);if(Number.isFinite(n))return n}return NaN}function firstInput(ids){for(const id of ids){const input=$(id);if(input)return input}return null}function escapeHtml(value){return String(null==value?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}function money(value,prefix){return Number.isFinite(value)?(prefix||"RM")+" "+value.toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2}):"-"}function numberText(value,digits){return Number.isFinite(value)?value.toLocaleString("en-MY",{maximumFractionDigits:null==digits?2:digits}):"-"}function loanPayment(principal,annualRate,months){if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(months)||principal<=0||months<=0)return NaN;const monthlyRate=annualRate/100/12;return 0===monthlyRate?principal/months:principal*monthlyRate/(1-Math.pow(1+monthlyRate,-months))}function visibleResultTitle(title){return String(title||"").replace(/\s+calculator\s+result\s*$/i," calculator").replace(/\s+result\s*$/i,"").trim()||"Answer"}function visibleResultLabel(label){const text=String(null==label?"":label);return/^\s*result\s*$/i.test(text)?"Answer":text}function plainText(title,rows,note){const lines=[visibleResultTitle(title)];return(rows||[]).forEach(function(row){lines.push(visibleResultLabel(row[0])+": "+String(row[1]))}),note&&lines.push("Note: "+note),lines.join("\n")}function setButtonTemp(button,text){if(!button)return;const old=button.textContent;button.textContent=text,setTimeout(function(){button.textContent=old},1300)}function copyText(text,button){navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(text).then(function(){setButtonTemp(button,"Copied")}).catch(function(){fallbackCopy(text,button)}):fallbackCopy(text,button)}function fallbackCopy(text,button){const area=document.createElement("textarea");area.value=text,area.setAttribute("readonly",""),area.style.position="fixed",area.style.left="-9999px",document.body.appendChild(area),area.select();try{document.execCommand("copy"),setButtonTemp(button,"Copied")}catch(error){setButtonTemp(button,"Copy failed")}area.remove()}function downloadText(filename,text){const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url,link.download=filename,document.body.appendChild(link),link.click(),setTimeout(function(){URL.revokeObjectURL(url),link.remove()},0)}function fieldLabel(input){if(!input)return"Input";let label=null;if(input.id)try{label=document.querySelector('label[for="'+input.id.replace(/[^a-zA-Z0-9_-]/g,"\\$&")+'"]')}catch(error){label=null}return!label&&input.closest&&(label=input.closest("label")),label?String(label.textContent||"").replace(/\s+/g," ").replace(/[:*]+$/g,"").trim()||input.name||input.id||"Input":input.getAttribute("aria-label")||input.placeholder||input.name||input.id||"Input"}function reportTable(rows,emptyMessage){return'<div class="calculator-report-table-scroll finance-report-table-scroll"><table class="calculator-report-data-table finance-report-data-table"><thead><tr><th>Item</th><th>Value</th></tr></thead><tbody>'+function(rows){return(rows||[]).map(function(row){return"<tr><th>"+escapeHtml(visibleResultLabel(row[0]))+"</th><td>"+escapeHtml(row[1])+"</td></tr>"}).join("")}(rows&&rows.length?rows:[["Details",emptyMessage||"No data available"]])+"</tbody></table></div>"}function openReport(title,rows,note,graphHtml){const old=$("financeUpgradeReportPage");old&&old.remove(),document.body.classList.add("calculator-report-view"),document.querySelectorAll("main, .finance-upgrade-result-box").forEach(function(el){el.style.setProperty("display","none","important")});const inputRows=function(){const root=document.querySelector("main .calculator")||document.querySelector(".calculator")||document.querySelector(".extra-calculator-box")||document,used=new Set;return Array.from(root.querySelectorAll("input, select, textarea")).filter(function(input){const type=String(input.type||"").toLowerCase();if(["button","submit","reset","hidden"].includes(type))return!1;if(input.disabled)return!1;if("display"===input.id)return!1;const key=input.id||input.name;return(!key||!used.has(key))&&(key&&used.add(key),"checkbox"===type||"radio"===type?input.checked:"SELECT"===input.tagName||""!==String(input.value||"").trim())}).map(function(input){const type=String(input.type||"").toLowerCase();let value="";return value="SELECT"===input.tagName?input.options&&input.selectedIndex>=0?input.options[input.selectedIndex].text:input.value:"checkbox"===type||"radio"===type?input.checked?input.value||"Selected":"Not selected":input.value,[fieldLabel(input),value||"-"]})}(),section=document.createElement("section");section.id="financeUpgradeReportPage",section.className="calculator-report-page finance-upgrade-report-page table-report-page",section.innerHTML="<h1>"+escapeHtml(visibleResultTitle(title))+'</h1><p class="calculator-report-date"><strong>Generated:</strong> '+escapeHtml((new Date).toLocaleString())+'</p><div class="calculator-report-card finance-report-card finance-report-input-card"><h2>Inputs</h2>'+reportTable(inputRows,"No input saved")+'</div><div class="calculator-report-card finance-report-card finance-report-result-card"><h2>Results</h2>'+reportTable(rows,"No result available")+(graphHtml?'<div class="finance-report-graph-wrap">'+graphHtml+"</div>":"")+(note?'<p class="finance-result-note">'+escapeHtml(note)+"</p>":"")+'</div><div class="calculator-report-actions"><button type="button" class="calculator-report-action-btn finance-report-back-btn">Go back</button><button type="button" class="calculator-report-action-btn finance-report-copy-btn">Copy report</button><button type="button" class="calculator-report-action-btn finance-report-save-btn">Save report</button><button type="button" class="calculator-report-action-btn finance-report-share-btn">Share report</button></div>',document.body.appendChild(section);const text="Inputs\n"+plainText("Inputs",inputRows,"")+"\n\nResults\n"+plainText(title,rows,note);section.querySelector(".finance-report-back-btn").onclick=function(){section.remove(),document.body.classList.remove("calculator-report-view"),document.querySelectorAll("main, .finance-upgrade-result-box").forEach(function(el){el.style.removeProperty("display")})},section.querySelector(".finance-report-copy-btn").onclick=function(event){copyText(text,event.currentTarget)},section.querySelector(".finance-report-save-btn").onclick=function(event){downloadText("calculator-report.txt",text),setButtonTemp(event.currentTarget,"Saved")},section.querySelector(".finance-report-share-btn").onclick=function(event){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){copyText(text,event.currentTarget)}):copyText(text,event.currentTarget)},section.scrollIntoView({behavior:"smooth",block:"start"})}function lineGraph(title,series){if(!(series=(series||[]).filter(function(item){return item&&Array.isArray(item.points)&&item.points.length})).length)return"";const pad_left=70,pad_right=26,pad_top=28,chartWidth=760-pad_left-pad_right,chartHeight=300-pad_top-54,allValues=[];let maxLen=0;series.forEach(function(line){maxLen=Math.max(maxLen,line.points.length),line.points.forEach(function(point){allValues.push(Number(point.value)||0)})});const max=Math.max.apply(Math,allValues.concat([1])),min=Math.min.apply(Math,allValues.concat([0])),range=Math.max(1,max-min);function xAt(index){return maxLen<=1?pad_left+chartWidth/2:pad_left+index/(maxLen-1)*chartWidth}function yAt(value){return pad_top+chartHeight-(value-min)/range*chartHeight}const lines=series.map(function(line,index){return'<polyline class="finance-chart-line finance-chart-line-'+index+'" points="'+line.points.map(function(point,i){return xAt(i).toFixed(1)+","+yAt(Number(point.value)||0).toFixed(1)}).join(" ")+'"></polyline>'}).join(""),endLabels=series.map(function(line,index){const last=line.points[line.points.length-1],x=xAt(line.points.length-1),y=yAt(Number(last.value)||0);return'<text class="finance-chart-end-label finance-chart-end-label-'+index+'" x="'+Math.min(760-pad_right,x+8).toFixed(1)+'" y="'+Math.max(16,y-4).toFixed(1)+'">'+escapeHtml(line.name)+"</text>"}).join(""),legend=series.map(function(line,index){return'<span class="finance-chart-legend-item finance-chart-legend-'+index+'"><i></i>'+escapeHtml(line.name)+"</span>"}).join("");return'<section class="finance-result-graph-card"><div class="finance-result-graph-header"><h3>'+escapeHtml(title)+'</h3><div class="finance-chart-legend">'+legend+'</div></div><div class="finance-chart-scroll"><svg class="finance-line-chart" viewBox="0 0 760 300" role="img" aria-label="'+escapeHtml(title)+'"><line class="finance-chart-axis" x1="'+pad_left+'" y1="'+(pad_top+chartHeight)+'" x2="'+(pad_left+chartWidth)+'" y2="'+(pad_top+chartHeight)+'"></line><line class="finance-chart-axis" x1="'+pad_left+'" y1="'+pad_top+'" x2="'+pad_left+'" y2="'+(pad_top+chartHeight)+'"></line><text class="finance-chart-y-label" x="'+(pad_left-8)+'" y="'+(pad_top+12)+'" text-anchor="end">'+escapeHtml(money(max))+'</text><text class="finance-chart-y-label" x="'+(pad_left-8)+'" y="'+(pad_top+chartHeight)+'" text-anchor="end">'+escapeHtml(money(min))+'</text><text class="finance-chart-x-label" x="'+pad_left+'" y="282">Start</text><text class="finance-chart-x-label" x="'+(pad_left+chartWidth)+'" y="282" text-anchor="end">End</text>'+lines+endLabels+"</svg></div></section>"}function amortizationPoints(principal,annualRate,months,monthlyPayment,maxPoints){const rate=annualRate/100/12;let balance=principal;const raw=[{value:balance}];for(let month=1;month<=months&&balance>.01&&month<1200;month+=1){const interest=balance*rate;if(monthlyPayment<=interest&&rate>0)break;balance=Math.max(0,balance+interest-monthlyPayment),raw.push({value:balance})}if(maxPoints=maxPoints||36,raw.length<=maxPoints)return raw;const sampled=[];for(let i=0;i<maxPoints;i+=1){const index=Math.round(i/(maxPoints-1)*(raw.length-1));sampled.push(raw[index])}return sampled}function showResult(type,title,rows,options){options=options||{};const box=function(type){const id=RESULT_BOX_ID_BY_PAGE[type]||"extraCalcResult";let box=$(id);const calculator=document.querySelector("main .calculator")||document.querySelector(".calculator");return box||(box=document.createElement("section"),box.id=id,box.hidden=!0,calculator?calculator.insertAdjacentElement("afterend",box):document.body.appendChild(box)),calculator&&calculator.contains(box)&&calculator.insertAdjacentElement("afterend",box),box.className="extra-result-box finance-upgrade-result-box finance-result-own-box "+type+"-finance-result",box.setAttribute("aria-label","Calculator result"),box.hidden=!1,box.style.setProperty("display","block","important"),box.style.setProperty("visibility","visible","important"),box.style.setProperty("opacity","1","important"),box}(type),text=plainText(title,rows,options.note);!function(type){["result","loanResult","personalLoanResult","discountResult","extraCalculatorReportPage"].forEach(function(id){const el=$(id);el&&el.id!==RESULT_BOX_ID_BY_PAGE[type]&&el.style.setProperty("display","none","important")}),document.querySelectorAll(".calculator-report-summary-boxes:not(.finance-result-summary-grid)").forEach(function(el){el.closest(".finance-upgrade-result-box")||el.style.setProperty("display","none","important")})}(type),box.innerHTML='<article class="finance-result-shell"><header class="finance-result-header"><h2>'+escapeHtml(visibleResultTitle(title))+"</h2></header>"+function(rows){return'<div class="finance-result-summary-grid">'+(rows||[]).map(function(row){return'<article class="finance-result-metric-card"><div class="finance-result-metric-label">'+escapeHtml(visibleResultLabel(row[0]))+'</div><div class="finance-result-metric-value">'+escapeHtml(row[1])+"</div></article>"}).join("")+"</div>"}(rows)+(options.graphHtml||"")+(options.note?'<p class="finance-result-note">'+escapeHtml(options.note)+"</p>":"")+'<div class="finance-result-actions"><button type="button" class="finance-result-action-btn finance-copy-btn">Copy</button><button type="button" class="finance-result-action-btn finance-save-btn">Save</button><button type="button" class="finance-result-action-btn finance-share-btn">Share</button><button type="button" class="finance-result-action-btn finance-report-btn">Report</button></div></article>',box.querySelector(".finance-copy-btn").onclick=function(event){copyText(text,event.currentTarget)},box.querySelector(".finance-save-btn").onclick=function(event){downloadText("calculator-result.txt",text),setButtonTemp(event.currentTarget,"Saved")},box.querySelector(".finance-share-btn").onclick=function(event){navigator.share?navigator.share({title:visibleResultTitle(title),text:text}).catch(function(){copyText(text,event.currentTarget)}):copyText(text,event.currentTarget)},box.querySelector(".finance-report-btn").onclick=function(){openReport(visibleResultTitle(title),rows,options.note,options.graphHtml||"")},!1!==options.scroll&&setTimeout(function(){box.scrollIntoView({behavior:"smooth",block:"start"})},80)}function calculateMortgage(){const homePrice=firstNumber(["amount","loanAmount","loanPrincipal"]),downPayment=Math.max(0,firstNumber(["downPayment"])||0),principal=Number.isFinite(homePrice)?Math.max(0,homePrice-downPayment):NaN,annualRate=firstNumber(["interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["years","loanYears","loanTerm","term"]),rawTerm=termInput?Number(String(termInput.value||"").replace(/,/g,"")):NaN;if(!Number.isFinite(homePrice)||!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||homePrice<=0||principal<=0||annualRate<0||rawTerm<=0)return;const label=termInput?String((document.querySelector('label[for="'+termInput.id+'"]')||{}).textContent||""):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm),principalInterest=loanPayment(principal,annualRate,months),propertyTax=(numberFromInput("propertyTaxYearly")||0)/12,insurance=(numberFromInput("homeInsuranceYearly")||0)/12,otherFees=numberFromInput("otherMonthlyFees")||0,extra=numberFromInput("extraMonthlyPayment")||0,totalMonthly=principalInterest+propertyTax+insurance+otherFees+extra,totalPrincipalInterest=principalInterest*months,totalInterest=totalPrincipalInterest-principal,downPercent=homePrice>0?downPayment/homePrice*100:0,income=numberFromInput("incomeMonthly"),incomeRatio=Number.isFinite(income)&&income>0?totalMonthly/income*100:NaN;showResult("loan","Mortgage result",[["Estimated monthly payment",money(totalMonthly)],["Principal + interest",money(principalInterest)],["Loan amount",money(principal)],["Home price",money(homePrice)],["Down payment",money(downPayment)+" ("+downPercent.toFixed(1)+"%)"],["Total interest",money(totalInterest)],["Total principal + interest",money(totalPrincipalInterest)],["Loan term",months+" months"],["Payment / income",Number.isFinite(incomeRatio)?incomeRatio.toFixed(1)+"%":"Add income to calculate"]],{graphHtml:lineGraph("Mortgage balance over time",[{name:"Balance",points:amortizationPoints(principal,annualRate,months,principalInterest+extra,40)}])})}function calculatePersonalLoanOverride(){const amount=firstNumber(["personalLoanAmount","amount","loanAmount","loanPrincipal"]),annualRate=firstNumber(["personalLoanRate","interest","loanRate","interestRate","annualRate"]),termInput=firstInput(["personalLoanYears","years","loanYears","loanTerm","term"]),rawTerm=termInput?Number(String(termInput.value||"").replace(/,/g,"")):NaN;if(!Number.isFinite(amount)||!Number.isFinite(annualRate)||!Number.isFinite(rawTerm)||amount<=0||annualRate<0||rawTerm<=0)return;const label=termInput?String((document.querySelector('label[for="'+termInput.id+'"]')||{}).textContent||""):"",months=termInput&&("months"===termInput.dataset.termUnit||/month/i.test(label))?Math.round(rawTerm):Math.round(12*rawTerm),monthlyPayment=loanPayment(amount,annualRate,months),totalPayment=monthlyPayment*months,totalInterest=totalPayment-amount;showResult("personalLoan","Personal loan result",[["Monthly payment",money(monthlyPayment)],["Total payment",money(totalPayment)],["Total interest",money(totalInterest)],["Loan amount",money(amount)],["Annual interest rate",annualRate.toFixed(2)+"%"],["Loan term",months+" months"]])}function calculateLoanComparisonOverride(){const amount=numberFromInput("loanCompareAmount"),rateA=numberFromInput("loanCompareRateA"),termA=numberFromInput("loanCompareTermA"),rateB=numberFromInput("loanCompareRateB"),termB=numberFromInput("loanCompareTermB");if(![amount,rateA,termA,rateB,termB].every(Number.isFinite)||amount<=0||termA<=0||termB<=0)return;const monthsA=Math.round(12*termA),monthsB=Math.round(12*termB),payA=loanPayment(amount,rateA,monthsA),payB=loanPayment(amount,rateB,monthsB),totalA=payA*monthsA,totalB=payB*monthsB,graph=lineGraph("Loan balance comparison",[{name:"Loan A",points:amortizationPoints(amount,rateA,monthsA,payA,42)},{name:"Loan B",points:amortizationPoints(amount,rateB,monthsB,payB,42)}]);showResult("loanComparison","Loan comparison result",[["Loan A monthly payment",money(payA)],["Loan A total interest",money(totalA-amount)],["Loan A total paid",money(totalA)],["Loan B monthly payment",money(payB)],["Loan B total interest",money(totalB-amount)],["Loan B total paid",money(totalB)],["Lower total cost",totalA<=totalB?"Loan A":"Loan B"],["Difference",money(Math.abs(totalA-totalB))]],{graphHtml:graph})}function calculateDebtPayoffOverride(){const debt=numberFromInput("debtTotal"),apr=numberFromInput("debtApr"),payment=numberFromInput("debtPayment"),extra=Number.isFinite(numberFromInput("debtExtra"))?numberFromInput("debtExtra"):0;if(![debt,apr,payment].every(Number.isFinite)||debt<=0||payment<=0)return;function simulate(pay){let balance=debt,interestTotal=0,months=0;const rate=apr/100/12,points=[{value:balance}];for(;balance>.01&&months<1200;){const interest=balance*rate;if(pay<=interest&&rate>0)return{stuck:!0,interest:interest,months:months,totalInterest:interestTotal,points:points};interestTotal+=interest,balance=Math.max(0,balance+interest-pay),months+=1,points.push({value:balance})}return{stuck:!1,months:months,totalInterest:interestTotal,points:points}}const normal=simulate(payment),faster=simulate(payment+extra);if(normal.stuck&&faster.stuck)return void showResult("debtPayoff","Debt payoff result",[["Monthly interest",money(normal.interest)],["Normal payment",money(payment)],["With extra payment",money(payment+extra)],["Status","Payment is too low to reduce debt"]]);const graph=lineGraph("Debt balance comparison",[{name:"Normal payment",points:samplePoints(normal.points,42)},{name:extra>0?"With extra payment":"Same payment",points:samplePoints(faster.points,42)}]);showResult("debtPayoff","Debt payoff result",[["Total debt",money(debt)],["Normal monthly payment",money(payment)],["Extra monthly payment",money(extra)],["Payment used",money(payment+extra)],["Months to debt free",faster.stuck?"Payment too low":faster.months+" months"],["Years to debt free",faster.stuck?"Payment too low":(faster.months/12).toFixed(1)+" years"],["Total interest",faster.stuck?"Payment too low":money(faster.totalInterest)],["Time saved",normal.stuck||faster.stuck?"Add extra payment to compare":Math.max(0,normal.months-faster.months)+" months"]],{graphHtml:graph})}function samplePoints(points,maxPoints){if((points=Array.isArray(points)?points:[]).length<=maxPoints)return points;const sampled=[];for(let i=0;i<maxPoints;i+=1)sampled.push(points[Math.round(i/(maxPoints-1)*(points.length-1))]);return sampled}function calculateCreditCardPayoffOverride(){const balance=numberFromInput("ccBalance"),apr=numberFromInput("ccApr"),payment=numberFromInput("ccPayment");if(![balance,apr,payment].every(Number.isFinite)||balance<=0||payment<=0)return;let bal=balance,totalInterest=0,months=0;const monthlyRate=apr/100/12;for(;bal>.01&&months<1200;){const interest=bal*monthlyRate;if(payment<=interest&&monthlyRate>0)return void showResult("creditCardPayoff","Credit card payoff result",[["Balance",money(balance)],["Monthly interest",money(interest)],["Monthly payment",money(payment)],["Status","Payment is too low to reduce the balance"]],{note:"Increase the monthly payment to pay off the card."});totalInterest+=interest,bal=Math.max(0,bal+interest-payment),months+=1}showResult("creditCardPayoff","Credit card payoff result",[["Months to pay off",months+" months"],["Years to pay off",(months/12).toFixed(1)+" years"],["Total interest",money(totalInterest)],["Total paid",money(balance+totalInterest)]])}function calculateCreditCardInterestOverride(){const balance=numberFromInput("ccInterestBalance"),apr=numberFromInput("ccInterestApr"),days=numberFromInput("ccInterestDays"),payment=Number.isFinite(numberFromInput("ccInterestPayment"))?numberFromInput("ccInterestPayment"):0;if(![balance,apr,days].every(Number.isFinite))return;const afterPayment=Math.max(0,balance-payment),interest=afterPayment*(apr/100)*(days/365);showResult("creditCardInterest","Credit card interest result",[["Starting balance",money(balance)],["Payment",money(payment)],["Balance used",money(afterPayment)],["APR",apr.toFixed(2)+"%"],["Days",numberText(days,0)],["Estimated interest",money(interest)]])}function calculateRentalYieldOverride(){const price=numberFromInput("rentalPropertyPrice"),rent=numberFromInput("rentalMonthlyRent"),expenses=Number.isFinite(numberFromInput("rentalAnnualExpenses"))?numberFromInput("rentalAnnualExpenses"):0;if(!Number.isFinite(price)||!Number.isFinite(rent)||price<=0)return;const annualRent=12*rent,grossYield=annualRent/price*100,netYield=(annualRent-expenses)/price*100;showResult("rentalYield","Rental yield result",[["Property price",money(price)],["Monthly rent",money(rent)],["Annual rent",money(annualRent)],["Annual expenses",money(expenses)],["Gross rental yield",grossYield.toFixed(2)+"%"],["Net rental yield",netYield.toFixed(2)+"%"]])}function calculateFuelCostOverride(){const distance=numberFromInput("fuelDistance"),efficiency=numberFromInput("fuelEfficiency"),price=numberFromInput("fuelPrice"),people=Number.isFinite(numberFromInput("fuelPeople"))&&numberFromInput("fuelPeople")>0?numberFromInput("fuelPeople"):1;if(![distance,efficiency,price].every(Number.isFinite)||efficiency<=0)return;const liters=distance/100*efficiency,total=liters*price;showResult("fuelCost","Fuel cost result",[["Distance",numberText(distance)+" km"],["Fuel needed",numberText(liters)+" L"],["Fuel price",money(price)+" / L"],["Total fuel cost",money(total)],["Cost per person",money(total/people)]])}function calculateSalaryOverride(){const gross=numberFromInput("salaryGross"),epfRate=Number.isFinite(numberFromInput("salaryEpfRate"))?numberFromInput("salaryEpfRate"):11,socso=Number.isFinite(numberFromInput("salarySocso"))?numberFromInput("salarySocso"):0,tax=Number.isFinite(numberFromInput("salaryTax"))?numberFromInput("salaryTax"):0,other=Number.isFinite(numberFromInput("salaryOther"))?numberFromInput("salaryOther"):0;if(!Number.isFinite(gross)||gross<=0)return;const epf=gross*epfRate/100,totalDeduct=epf+socso+tax+other,net=gross-totalDeduct;showResult("salary","Salary result",[["Gross monthly salary",money(gross)],["EPF deduction",money(epf)],["Other deductions",money(totalDeduct-epf)],["Total deductions",money(totalDeduct)],["Net monthly salary",money(net)],["Estimated net yearly",money(12*net)]])}function calculateGajiOverride(){const basic=numberFromInput("gajiBasic"),fixed=Number.isFinite(numberFromInput("gajiFixedAllowance"))?numberFromInput("gajiFixedAllowance"):0,cola=Number.isFinite(numberFromInput("gajiCola"))?numberFromInput("gajiCola"):0,other=Number.isFinite(numberFromInput("gajiOtherAllowance"))?numberFromInput("gajiOtherAllowance"):0,deductions=Number.isFinite(numberFromInput("gajiDeductions"))?numberFromInput("gajiDeductions"):0;if(!Number.isFinite(basic)||basic<=0)return;const allowance=fixed+cola+other,gross=basic+allowance,net=gross-deductions;showResult("gajiPenjawatAwam","Gaji penjawat awam result",[["Gaji pokok",money(basic)],["Jumlah elaun",money(allowance)],["Gaji kasar",money(gross)],["Potongan",money(deductions)],["Anggaran gaji bersih",money(net)]],{note:"Masukkan nilai elaun dan potongan sendiri mengikut slip gaji anda."})}function calculateTaxOverride(){const income=numberFromInput("taxAnnualIncome"),relief=Number.isFinite(numberFromInput("taxRelief"))?numberFromInput("taxRelief"):0,rate=Number.isFinite(numberFromInput("taxRate"))?numberFromInput("taxRate"):10;if(!Number.isFinite(income)||income<=0)return;const taxable=Math.max(0,income-relief),tax=taxable*rate/100;showResult("tax","Tax estimator result",[["Annual income",money(income)],["Relief / deduction",money(relief)],["Estimated taxable income",money(taxable)],["Tax rate used",rate.toFixed(2)+"%"],["Estimated tax",money(tax)],["Estimated monthly tax",money(tax/12)]],{note:"This is a simple estimator using your entered rate. It is not official tax advice."})}function calculateCurrencyOverride(){const amount=numberFromInput("currencyAmount"),from=valueFromInput("currencyFrom").toUpperCase()||"FROM",to=valueFromInput("currencyTo").toUpperCase()||"TO",rate=numberFromInput("currencyRate");Number.isFinite(amount)&&Number.isFinite(rate)&&showResult("currencyConverter","Currency converter result",[["Amount",numberText(amount)+" "+from],["Exchange rate","1 "+from+" = "+numberText(rate,6)+" "+to],["Converted amount",numberText(amount*rate,2)+" "+to]],{note:"This static GitHub Pages converter uses the exchange rate you enter manually."})}function calculateDiscountOverride(){const price=numberFromInput("price"),discount=numberFromInput("discount");if(![price,discount].every(Number.isFinite)||price<0||discount<0)return;const savings=price*discount/100,finalPrice=price-savings;showResult("discount","Discount result",[["Original price",money(price)],["Discount",discount.toFixed(2)+"%"],["Savings",money(savings)],["Final price",money(finalPrice)]])}function calculateInflationOverride(){const amount=numberFromInput("inflationAmount"),rate=numberFromInput("inflationRate"),years=numberFromInput("inflationYears");if(![amount,rate,years].every(Number.isFinite))return;const future=amount*Math.pow(1+rate/100,years),buyingPower=amount/Math.pow(1+rate/100,years);showResult("inflation","Inflation result",[["Today amount",money(amount)],["Inflation rate",rate.toFixed(2)+"%"],["Years",numberText(years)],["Future cost estimate",money(future)],["Today buying power after period",money(buyingPower)]])}const unitConversionFactorsUpgrade={length:{m:1,meter:1,metre:1,km:1e3,kilometer:1e3,kilometre:1e3,cm:.01,centimeter:.01,centimetre:.01,mm:.001,millimeter:.001,millimetre:.001,mile:1609.344,mi:1609.344,yard:.9144,yd:.9144,foot:.3048,feet:.3048,ft:.3048,inch:.0254,inches:.0254,in:.0254},weight:{kg:1,kilogram:1,g:.001,gram:.001,lb:.45359237,lbs:.45359237,pound:.45359237,oz:.028349523125,ounce:.028349523125},volume:{liter:1,litre:1,l:1,ml:.001,milliliter:.001,millilitre:.001,gallon:3.785411784,gal:3.785411784,cup:.2365882365}};function normalUnitKey(value){return String(value||"").trim().toLowerCase().replace(/\./g,"")}function calculateScientificOverride(){const expression=valueFromInput("scientificExpression");if(!expression)return;const originalExpression=expression,safeExpression=expression.replace(/\^/g,"**").replace(/\bsin\s*\(/gi,"Math.sin(").replace(/\bcos\s*\(/gi,"Math.cos(").replace(/\btan\s*\(/gi,"Math.tan(").replace(/\bsqrt\s*\(/gi,"Math.sqrt(").replace(/\blog\s*\(/gi,"Math.log10(").replace(/\bln\s*\(/gi,"Math.log(").replace(/\babs\s*\(/gi,"Math.abs(").replace(/\bpi\b/gi,"Math.PI").replace(/\be\b/g,"Math.E");if(/^[0-9+\-*/%().,\s*MatPIEhlgocinsqrtab]+$/i.test(safeExpression))try{const result=Function('"use strict"; return ('+safeExpression+");")();if(!Number.isFinite(Number(result)))throw new Error("Result is not finite");showResult("scientific","Scientific result",[["Input",originalExpression],["Answer",numberText(Number(result),10)]],{note:"Trigonometric functions use radians in this calculator."})}catch(error){showResult("scientific","Scientific result",[["Input",originalExpression],["Answer","Cannot calculate this expression"]],{note:"Check brackets, symbols, and supported function names."})}else showResult("scientific","Scientific result",[["Input",originalExpression],["Answer","Unsupported expression"]],{note:"Use numbers, +, -, ×, ÷, brackets, powers, sqrt(), sin(), cos(), tan(), log(), ln(), abs(), pi, and e."})}function calculateUnitConverterOverride(){const type=valueFromInput("unitType")||"length",value=numberFromInput("unitValue"),fromRaw=valueFromInput("unitFrom"),toRaw=valueFromInput("unitTo"),from=normalUnitKey(fromRaw),to=normalUnitKey(toRaw);if(!(Number.isFinite(value)&&type&&from&&to))return;let result=NaN;if("temperature"===type)result=function(value,from,to){from=normalUnitKey(from),to=normalUnitKey(to);let c=value;if("f"===from||"fahrenheit"===from)c=5*(value-32)/9;else if("k"===from||"kelvin"===from)c=value-273.15;else if("c"!==from&&"celsius"!==from)return NaN;return"f"===to||"fahrenheit"===to?9*c/5+32:"k"===to||"kelvin"===to?c+273.15:"c"===to||"celsius"===to?c:NaN}(value,from,to);else{const factors=unitConversionFactorsUpgrade[type]||{};Number.isFinite(factors[from])&&Number.isFinite(factors[to])&&0!==factors[to]&&(result=value*factors[from]/factors[to])}return}function installOverrides(){window.calculateLoan=calculateMortgage,window.calculateMortgage=calculateMortgage,window.calculatePersonalLoan=calculatePersonalLoanOverride,window.calculateLoanComparisonExtra=calculateLoanComparisonOverride,window.calculateDebtPayoffExtra=calculateDebtPayoffOverride,window.calculateCreditCardPayoffExtra=calculateCreditCardPayoffOverride,window.calculateCreditCardInterestExtra=calculateCreditCardInterestOverride,window.calculateRentalYieldExtra=calculateRentalYieldOverride,window.calculateFuelCostExtra=calculateFuelCostOverride,window.calculateSalaryExtra=calculateSalaryOverride,window.calculateGajiPenjawatAwamExtra=calculateGajiOverride,window.calculateTaxExtra=calculateTaxOverride,window.calculateCurrencyConverterExtra=calculateCurrencyOverride,window.calculateScientificExtra=calculateScientificOverride,window.calculateUnitConverterExtra=calculateUnitConverterOverride,window.calculateDiscount=calculateDiscountOverride,window.calculateInflationExtra=calculateInflationOverride;const fuelPrice=$("fuelPrice");fuelPrice&&(fuelPrice.setAttribute("step","0.01"),fuelPrice.setAttribute("inputmode","decimal"),fuelPrice.style.setProperty("width","100%","important"),fuelPrice.style.setProperty("min-width","0","important"));const type=pageType();RESULT_BOX_ID_BY_PAGE[type]&&setTimeout(function(){const box=$(RESULT_BOX_ID_BY_PAGE[type]),calculator=document.querySelector("main .calculator")||document.querySelector(".calculator");box&&calculator&&calculator.contains(box)&&calculator.insertAdjacentElement("afterend",box)},100)}function runCurrentCalculator(){const type=pageType(),map={loan:calculateMortgage,personalLoan:calculatePersonalLoanOverride,loanComparison:calculateLoanComparisonOverride,debtPayoff:calculateDebtPayoffOverride,creditCardPayoff:calculateCreditCardPayoffOverride,creditCardInterest:calculateCreditCardInterestOverride,rentalYield:calculateRentalYieldOverride,fuelCost:calculateFuelCostOverride,salary:calculateSalaryOverride,gajiPenjawatAwam:calculateGajiOverride,tax:calculateTaxOverride,currencyConverter:calculateCurrencyOverride,scientific:calculateScientificOverride,unitConverter:calculateUnitConverterOverride,discount:calculateDiscountOverride,inflation:calculateInflationOverride};map[type]&&map[type]()}function start(){installOverrides(),setTimeout(installOverrides,300),setTimeout(installOverrides,1e3);let timer=null;document.addEventListener("input",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;if(target.closest("#navbar, .clean-nav-search, .site-search"))return;const type=pageType();RESULT_BOX_ID_BY_PAGE[type]&&(clearTimeout(timer),timer=setTimeout(runCurrentCalculator,2050))},!0),document.addEventListener("change",function(event){const target=event.target;if(!target||!target.matches("input, select, textarea"))return;const type=pageType();RESULT_BOX_ID_BY_PAGE[type]&&(clearTimeout(timer),timer=setTimeout(runCurrentCalculator,2050))},!0)}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}(),function(){"use strict";function cleanupExtraResultText(root){(root=root||document).querySelectorAll(".finance-result-eyebrow").forEach(function(el){/^\s*result\s*$/i.test(el.textContent||"")&&el.remove()}),root.querySelectorAll("h1, h2, h3, p, div, span, th").forEach(function(el){if(!function(el){return!(!el||!el.closest(".calculator-clean-result, .loan-style-output-panel, .finance-upgrade-result-box, .extra-result-box, .calculator-report-card, .calculator-report-result, #extraCalcResult, #financeUpgradeReportPage, #extraCalculatorReportPage, #calculatorReportPage"))}(el))return;const text=(el.textContent||"").trim();if(/^result$/i.test(text)&&0===el.children.length)el.matches("th, .finance-result-metric-label")?el.textContent="Answer":el.remove();else if(/\s+result$/i.test(text)&&0===el.children.length&&el.matches("h1, h2, h3")){const cleaned=function(text){return String(text||"").replace(/\s+calculator\s+result\s*$/i," calculator").replace(/\s+result\s*$/i,"").trim()}(text);cleaned&&(el.textContent=cleaned)}})}function startCleanup(){cleanupExtraResultText(document),[100,350,900,1800].forEach(function(delay){setTimeout(function(){cleanupExtraResultText(document)},delay)}),window.MutationObserver&&new MutationObserver(function(mutations){mutations.forEach(function(mutation){mutation.addedNodes.forEach(function(node){node&&1===node.nodeType&&cleanupExtraResultText(node)})})}).observe(document.body,{childList:!0,subtree:!0})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",startCleanup):startCleanup()}(),function(){"use strict";function fixReviewWallNav(){document.querySelectorAll("a.clean-chat-link, a.nav-chat-link").forEach(function(link){link.textContent="Review",link.setAttribute("href","review.html")}),document.querySelectorAll(".clean-nav-inner").forEach(function(inner){if(!inner.querySelector(".clean-wall-link")){var reviewLink=inner.querySelector(".clean-chat-link");if(reviewLink){var wallLink=document.createElement("a");wallLink.className="clean-nav-link clean-wall-link",wallLink.href="Wall.html",wallLink.textContent="Wall",reviewLink.insertAdjacentElement("afterend",wallLink)}}})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",fixReviewWallNav):fixReviewWallNav(),setTimeout(fixReviewWallNav,300)}(),
function(){
  "use strict";
  if (window.__calcStudioScientificGraphCleanInstalled) return;
  window.__calcStudioScientificGraphCleanInstalled = true;

  function isScientificPage(){
    return document.body && (document.body.dataset.page === "scientific" || location.pathname.indexOf("scientific-calculator") !== -1);
  }
  function byId(id){ return document.getElementById(id); }
  function finite(n){ return typeof n === "number" && Number.isFinite(n); }
  function fact(n){
    n = Number(n);
    if(!finite(n) || n < 0 || Math.floor(n) !== n || n > 170) return NaN;
    var r = 1;
    for(var i=2;i<=n;i++) r *= i;
    return r;
  }
  function nthRoot(a,n){
    a = Number(a); n = Number(n);
    if(!finite(a) || !finite(n) || n === 0) return NaN;
    if(a < 0 && Math.round(n) % 2 === 1) return -Math.pow(-a, 1/n);
    return Math.pow(a, 1/n);
  }
  function splitTopLevel(str){
    var out=[], start=0, depth=0, s=String(str||"");
    for(var i=0;i<s.length;i++){
      var ch=s[i];
      if(ch === "(") depth++;
      else if(ch === ")") depth = Math.max(0, depth-1);
      else if((ch === ";" || ch === "\n") && depth === 0){
        var part=s.slice(start,i).trim();
        if(part) out.push(part);
        start=i+1;
      }
    }
    var last=s.slice(start).trim();
    if(last) out.push(last);
    return out;
  }
  function normalize(expr){
    var s = String(expr || "").trim();
    s = s.replace(/[−–—]/g,"-").replace(/×/g,"*").replace(/÷/g,"/").replace(/π/g,"pi").replace(/√/g,"sqrt");
    s = s.replace(/\s+/g,"");
    s = s.replace(/(\d+|\)|pi|e|tau|phi)(?=(x|t|theta|pi|tau|phi|e|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|sqrt|cbrt|log|ln|exp|abs|floor|ceil|round|min|max|root|pow|sign|\())/gi,"$1*");
    s = s.replace(/(x|t|theta|pi|tau|phi|e|\))(?=(\d+))/gi,"$1*");
    s = s.replace(/\^/g,"**");
    s = s.replace(/(\d+(?:\.\d+)?|\([^()]*\)|[a-zA-Z_][a-zA-Z0-9_]*)(!)/g,"fact($1)");
    return s;
  }
  function jsExpression(expr, variableName){
    var s = normalize(expr);
    if(!/^[0-9a-zA-Z_+\-*/%.(),=<>!|&?:*\s]+$/.test(s)) throw new Error("Unsupported character");
    s = s.replace(/\broot\s*\(/gi,"nthRoot(");
    var fn = {
      sin:"Math.sin", cos:"Math.cos", tan:"Math.tan", asin:"Math.asin", acos:"Math.acos", atan:"Math.atan",
      sinh:"Math.sinh", cosh:"Math.cosh", tanh:"Math.tanh", sqrt:"Math.sqrt", cbrt:"Math.cbrt",
      log:"Math.log10", ln:"Math.log", exp:"Math.exp", abs:"Math.abs", floor:"Math.floor", ceil:"Math.ceil",
      round:"Math.round", min:"Math.min", max:"Math.max", pow:"Math.pow", sign:"Math.sign"
    };
    Object.keys(fn).forEach(function(name){ s = s.replace(new RegExp("\\b"+name+"\\s*\\(","gi"), fn[name]+"("); });
    s = s.replace(/\bpi\b/gi,"Math.PI").replace(/\btau\b/gi,"(2*Math.PI)").replace(/\bphi\b/gi,"((1+Math.sqrt(5))/2)");
    s = s.replace(/\bln2\b/gi,"Math.LN2").replace(/\bln10\b/gi,"Math.LN10").replace(/\be\b/g,"Math.E");
    if(variableName === "t") s = s.replace(/\btheta\b/gi,"t").replace(/\bx\b/g,"t");
    else s = s.replace(/\btheta\b/gi,"x").replace(/\bt\b/g,"x");
    return s;
  }
  function makeFunction(expr, variableName){
    var body = jsExpression(expr, variableName || "x");
    return new Function(variableName || "x", "fact", "nthRoot", "var y = " + body + "; return Number.isFinite(y) ? y : NaN;");
  }
  function getInput(){ return byId("scientificExpression"); }
  function trigger(){ scheduleDraw(); }
  window.focusScientificInput = function(){
    var input = getInput(); if(!input) return;
    input.focus();
    var len=input.value.length;
    try{ input.setSelectionRange(len,len); }catch(e){}
    trigger();
  };
  window.appendScientific = function(value){
    var input = getInput(); if(!input) return;
    input.focus();
    var start = input.selectionStart == null ? input.value.length : input.selectionStart;
    var end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
    input.value = input.value.slice(0,start) + value + input.value.slice(end);
    var next = start + String(value).length;
    try{ input.setSelectionRange(next,next); }catch(e){}
    trigger();
  };
  window.clearScientificInput = function(){
    var input = getInput(); if(!input) return;
    input.value = "";
    input.focus();
    trigger();
  };

  function setupCanvas(canvas){
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(360, Math.floor(rect.width || 720));
    var h = Math.max(280, Math.floor(w * 0.52));
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    canvas.style.height = h + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    return {ctx:ctx,w:w,h:h};
  }
  function getRange(){
    var min = Number((byId("graphXMin") || {}).value);
    var max = Number((byId("graphXMax") || {}).value);
    if(!finite(min)) min = -10;
    if(!finite(max)) max = 10;
    if(min === max){ min -= 10; max += 10; }
    if(min > max){ var t=min; min=max; max=t; }
    return {min:min,max:max};
  }
  function drawGrid(ctx,w,h,xMin,xMax,yMin,yMax){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0,0,w,h);
    function sx(x){ return (x-xMin)/(xMax-xMin)*w; }
    function sy(y){ return h-(y-yMin)/(yMax-yMin)*h; }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#e5e7eb";
    for(var i=0;i<=10;i++){
      var x=i*w/10, y=i*h/10;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.25;
    if(xMin <= 0 && xMax >= 0){ var zx=sx(0); ctx.beginPath(); ctx.moveTo(zx,0); ctx.lineTo(zx,h); ctx.stroke(); }
    if(yMin <= 0 && yMax >= 0){ var zy=sy(0); ctx.beginPath(); ctx.moveTo(0,zy); ctx.lineTo(w,zy); ctx.stroke(); }
    return {sx:sx,sy:sy};
  }
  function sampleCartesian(fn,xMin,xMax){
    var pts=[], steps=900;
    for(var i=0;i<=steps;i++){
      var x=xMin+(xMax-xMin)*i/steps, y=fn(x,fact,nthRoot);
      pts.push({x:x,y:y,ok:finite(y)&&Math.abs(y)<1e6});
    }
    return pts;
  }
  function sampleParametric(fx,fy,tMin,tMax){
    var pts=[], steps=1000;
    for(var i=0;i<=steps;i++){
      var t=tMin+(tMax-tMin)*i/steps, x=fx(t,fact,nthRoot), y=fy(t,fact,nthRoot);
      pts.push({x:x,y:y,ok:finite(x)&&finite(y)&&Math.abs(x)<1e6&&Math.abs(y)<1e6});
    }
    return pts;
  }
  function yRangeFromPoints(series){
    var ys=[];
    series.forEach(function(pts){ pts.forEach(function(p){ if(p.ok) ys.push(p.y); }); });
    if(!ys.length) return {min:-10,max:10};
    ys.sort(function(a,b){ return a-b; });
    var lo=ys[Math.floor(ys.length*0.03)], hi=ys[Math.floor(ys.length*0.97)];
    if(!finite(lo)||!finite(hi)||lo===hi){ lo=-10; hi=10; }
    var pad=(hi-lo)*0.15 || 5;
    return {min:lo-pad,max:hi+pad};
  }
  function drawSeries(ctx,map,pts,color){
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    var drawing=false, last=null;
    pts.forEach(function(p){
      if(!p.ok){ drawing=false; last=null; return; }
      var px=map.sx(p.x), py=map.sy(p.y);
      if(last && Math.abs(py-last.y)>260) drawing=false;
      if(!drawing){ ctx.moveTo(px,py); drawing=true; } else ctx.lineTo(px,py);
      last={x:px,y:py};
    });
    ctx.stroke();
  }
  function parseInput(raw){
    var parts=splitTopLevel(raw), res={series:[],type:"cartesian"};
    if(!parts.length) return res;
    var xPart=null,yPart=null;
    parts.forEach(function(p){ if(/^x\s*=/.test(p)) xPart=p.replace(/^x\s*=/,""); if(/^y\s*=/.test(p)) yPart=p.replace(/^y\s*=/,""); });
    if(xPart && yPart){
      res.type="parametric";
      res.fx=makeFunction(xPart,"t");
      res.fy=makeFunction(yPart,"t");
      return res;
    }
    parts.forEach(function(p){
      p=p.trim();
      if(/^r\s*=/.test(p)) res.series.push({kind:"polar",expr:p.replace(/^r\s*=/,"")});
      else if(/^x\s*=/.test(p)) res.series.push({kind:"vertical",x:Number(p.replace(/^x\s*=/,""))});
      else res.series.push({kind:"cartesian",expr:p.replace(/^y\s*=/,"")});
    });
    return res;
  }
  function drawScientificGraph(){
    if(!isScientificPage()) return;
    var canvas=byId("scientificGraphCanvas"), input=byId("scientificExpression"), status=byId("scientificGraphStatus");
    if(!canvas || !input) return;
    var setup=setupCanvas(canvas), ctx=setup.ctx, w=setup.w, h=setup.h;
    var range=getRange(), xMin=range.min, xMax=range.max;
    var raw=String(input.value||"").trim();
    if(!raw){
      drawGrid(ctx,w,h,xMin,xMax,-10,10);
      ctx.fillStyle="#64748b"; ctx.font="15px system-ui, sans-serif"; ctx.textAlign="center";
      ctx.fillText("Enter an expression to draw the graph", w/2, h/2);
      if(status) status.textContent="Enter an expression to draw the graph.";
      return;
    }
    try{
      var parsed=parseInput(raw), series=[];
      if(parsed.type === "parametric") series.push(sampleParametric(parsed.fx,parsed.fy,0,2*Math.PI));
      else parsed.series.forEach(function(s){
        if(s.kind === "cartesian") series.push(sampleCartesian(makeFunction(s.expr,"x"),xMin,xMax));
        else if(s.kind === "polar"){
          var fr=makeFunction(s.expr,"t");
          series.push(sampleParametric(function(t){ var r=fr(t,fact,nthRoot); return r*Math.cos(t); }, function(t){ var r=fr(t,fact,nthRoot); return r*Math.sin(t); }, 0, 2*Math.PI));
        } else if(s.kind === "vertical" && finite(s.x)) series.push([{x:s.x,y:-1e3,ok:true},{x:s.x,y:1e3,ok:true}]);
      });
      var yr=yRangeFromPoints(series), map=drawGrid(ctx,w,h,xMin,xMax,yr.min,yr.max);
      ["#0f766e","#2563eb","#c2410c","#7c3aed","#be123c","#15803d"].forEach(function(color,i){ if(series[i]) drawSeries(ctx,map,series[i],color); });
      if(status) status.textContent="Graph updated.";
    }catch(e){
      drawGrid(ctx,w,h,xMin,xMax,-10,10);
      ctx.fillStyle="#b42318"; ctx.font="14px system-ui, sans-serif"; ctx.textAlign="center";
      ctx.fillText("Cannot draw this expression. Check syntax.", w/2, h/2);
      if(status) status.textContent="Try sin(x), y=x^2, x=2, r=2sin(3t), or x=cos(t); y=sin(t).";
    }
  }
  var raf=0;
  function scheduleDraw(){
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){ raf=0; drawScientificGraph(); });
  }
  window.drawScientificGraph = drawScientificGraph;
  window.calculateScientificExtra = scheduleDraw;

  function addHint(){
    var card=document.querySelector(".scientific-expression-card");
    if(!card || byId("scientificGraphTypeHint")) return;
    var hint=document.createElement("p");
    hint.id="scientificGraphTypeHint";
    hint.className="graph-type-hint";
    hint.innerHTML="Graph types: <code>sin(x)</code>, <code>y=x^2</code>, <code>x=2</code>, multiple with <code>;</code>, polar <code>r=2sin(3t)</code>, parametric <code>x=cos(t); y=sin(t)</code>.";
    card.appendChild(hint);
  }
  function install(){
    if(!isScientificPage()) return;
    addHint();
    var input=byId("scientificExpression"), min=byId("graphXMin"), max=byId("graphXMax");
    if(input && !input.dataset.cleanGraphReady){ input.dataset.cleanGraphReady="1"; input.addEventListener("input", scheduleDraw); input.addEventListener("change", scheduleDraw); }
    if(min && !min.dataset.cleanGraphReady){ min.dataset.cleanGraphReady="1"; min.addEventListener("input", scheduleDraw); min.addEventListener("change", scheduleDraw); }
    if(max && !max.dataset.cleanGraphReady){ max.dataset.cleanGraphReady="1"; max.addEventListener("input", scheduleDraw); max.addEventListener("change", scheduleDraw); }
    scheduleDraw();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", install); else install();
  window.addEventListener("resize", function(){ clearTimeout(window.__sciCleanResize); window.__sciCleanResize=setTimeout(scheduleDraw,120); });
}();

(function () {
  "use strict";
  if (window.__calcStudioHideNavbarOnScrollInstalled) return;
  window.__calcStudioHideNavbarOnScrollInstalled = true;

  function initHideNavbarOnScroll() {
    var nav = document.getElementById("navbar") || document.querySelector(".clean-navbar");
    if (!nav) return;

    var lastY = window.scrollY || 0;
    var ticking = false;
    var minMove = 8;

    function isMenuOpen() {
      return !!document.querySelector(".clean-nav-dropdown:hover, .clean-nav-dropdown:focus-within, .clean-nav-dropdown.is-open");
    }

    function update() {
      var currentY = window.scrollY || 0;
      var diff = currentY - lastY;

      if (Math.abs(diff) >= minMove) {
        if (currentY > 90 && diff > 0 && !isMenuOpen()) {
          nav.classList.add("nav-hidden-on-scroll");
        } else if (diff < 0 || currentY <= 90) {
          nav.classList.remove("nav-hidden-on-scroll");
        }
        lastY = currentY;
      }
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    nav.addEventListener("mouseenter", function () {
      nav.classList.remove("nav-hidden-on-scroll");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHideNavbarOnScroll);
  } else {
    initHideNavbarOnScroll();
  }
}());

/* ===== Page isolation helpers ===== */
(function(){
  "use strict";
  window.CalcStudioPage = (document.body && document.body.dataset && document.body.dataset.page) || "";
})();

/* ===== Desktop behavior formerly from pc.js ===== */
!function(){"use strict";function syncModeClass(){document.body.classList.toggle("desktop-layout",window.matchMedia("(min-width: 851px)").matches)}function start(){!function(){const menuIcon=document.getElementById("menuIcon");menuIcon&&menuIcon.remove(),document.body.classList.remove("menu-scrolled"),document.documentElement.classList.remove("menu-scrolled");const nav=document.getElementById("navbar");nav&&(nav.classList.remove("open","scrolled"),nav.classList.add("clean-navbar"))}(),syncModeClass(),window.addEventListener("resize",syncModeClass,{passive:!0})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}();

/* ===== Mobile behavior formerly from phone.js ===== */
!function(){"use strict";function syncModeClass(){document.body.classList.toggle("mobile-layout",window.matchMedia("(max-width: 850px)").matches)}function start(){!function(){const menuIcon=document.getElementById("menuIcon");menuIcon&&menuIcon.remove(),document.body.classList.remove("menu-scrolled"),document.documentElement.classList.remove("menu-scrolled");const nav=document.getElementById("navbar");nav&&(nav.classList.remove("open","scrolled"),nav.classList.add("clean-navbar"))}(),syncModeClass(),window.addEventListener("resize",syncModeClass,{passive:!0})}"loading"===document.readyState?document.addEventListener("DOMContentLoaded",start):start()}();

/* ===== Extracted page-specific scripts from HTML files ===== */

/* ===== Page-specific JS: Wall.html (wall) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'wall') return;
(function () {
      "use strict";

      const storageKey = "calculatorUserReviewsV1";
      const wall = document.getElementById("reviewWallGrid");
      const canvas = document.getElementById("signatureWallCanvas");

      function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
      }

      function stars(value) {
        const rating = Math.max(1, Math.min(5, Number(value) || 5));
        return "★".repeat(rating) + "☆".repeat(5 - rating);
      }

      function getReviews() {
        try {
          const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
          return Array.isArray(list) ? list : [];
        } catch {
          return [];
        }
      }

      function layoutFor(index, count) {
        const wide = window.matchMedia("(min-width: 1120px)").matches;
        const tablet = window.matchMedia("(min-width: 760px)").matches;
        const columns = wide ? 4 : (tablet ? 3 : 1);
        const row = Math.floor(index / columns);
        const col = index % columns;
        const jitterX = ((index * 37) % 9) - 4;
        const jitterY = ((index * 29) % 34) - 8;
        const rotate = (((index * 17) % 13) - 6) + "deg";
        const width = (wide ? 230 : 210) + ((index * 19) % 44);
        const left = columns === 1 ? 0 : (4 + col * (92 / columns) + jitterX);
        const top = 38 + (row * 210) + jitterY;
        return {
          left: left + "%",
          top: top + "px",
          rotate: rotate,
          width: width + "px",
          minHeight: Math.max(620, 140 + (Math.ceil(count / columns) * 220)) + "px"
        };
      }

      function renderWall() {
        const reviews = getReviews();
        if (!wall || !canvas) return;

        if (!reviews.length) {
          wall.innerHTML = "";
          canvas.classList.add("is-empty");
          canvas.style.minHeight = "calc(100vh - 128px)";
          return;
        }

        canvas.classList.remove("is-empty");
        canvas.style.minHeight = layoutFor(0, reviews.length).minHeight;
        wall.innerHTML = reviews.map(function (review, index) {
          const pos = layoutFor(index, reviews.length);
          return '<article class="signature-wall-note" style="--note-left:' + pos.left + '; --note-top:' + pos.top + '; --note-rotate:' + pos.rotate + '; --note-width:' + pos.width + ';">' +
            '<div class="signature-wall-rating" aria-label="' + escapeText(review.rating || 5) + ' out of 5 stars">' + stars(review.rating) + '</div>' +
            '<p class="signature-wall-message">“' + escapeText(review.message || review.title || "Helpful calculator website") + '”</p>' +
            '<p class="signature-wall-signed">— ' + escapeText(review.name || "Guest") + '</p>' +
            '<time class="signature-wall-time">' + escapeText(review.time || "") + '</time>' +
          '</article>';
        }).join("");
      }

      window.addEventListener("resize", renderWall);
      window.addEventListener("storage", function (event) { if (event.key === storageKey) renderWall(); });
      renderWall();
      setInterval(renderWall, 5000);
    })();
})();

/* ===== Page-specific JS: basic-calculator.html (basic) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'basic') return;
document.addEventListener('DOMContentLoaded', function () {
  const removePreviousInputBox = () => {
    const box = document.getElementById('basicInlineResult');
    if (box) box.remove();
    document.querySelectorAll('.basic-inline-result').forEach(function (el) { el.remove(); });
  };
  removePreviousInputBox();
  new MutationObserver(removePreviousInputBox).observe(document.body, { childList: true, subtree: true });
});
})();

/* ===== Page-specific JS: basic-calculator.html (basic) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'basic') return;
document.addEventListener('DOMContentLoaded', function () {
  const display = document.getElementById('display');
  const previousLine = document.getElementById('basicPreviousLine');
  if (!display || !previousLine) return;

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function setPrevious(text) {
    const value = clean(text);
    previousLine.textContent = value || 'Previous calculation';
    previousLine.title = previousLine.textContent;
  }

  function loadLatestPrevious() {
    try {
      const history = JSON.parse(localStorage.getItem('basicCalculationHistory') || '[]');
      const latest = Array.isArray(history) ? history[history.length - 1] : null;
      if (latest && latest.expression) {
        setPrevious(latest.expression + ' = ' + latest.result);
      }
    } catch (error) {}
  }

  loadLatestPrevious();

  const oldCalculate = window.calculate;
  if (typeof oldCalculate === 'function') {
    window.calculate = function () {
      const expressionBefore = clean(display.value);
      oldCalculate.apply(this, arguments);
      setTimeout(function () {
        const answerAfter = clean(display.value);
        if (expressionBefore && expressionBefore !== 'Error' && answerAfter && answerAfter !== 'Error') {
          setPrevious(expressionBefore + ' = ' + answerAfter);
        }
      }, 0);
    };
  }

  const oldClearDisplay = window.clearDisplay;
  if (typeof oldClearDisplay === 'function') {
    window.clearDisplay = function () {
      oldClearDisplay.apply(this, arguments);
      setPrevious('Previous calculation');
    };
  }
});
})();

/* ===== Page-specific JS: basic-calculator.html (basic) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'basic') return;
document.addEventListener('DOMContentLoaded', function () {
  const display = document.getElementById('display');
  if (!display) return;

  const maxDesktop = 46;
  const maxMobile = 34;
  const minSize = 14;

  const measurer = document.createElement('span');
  measurer.setAttribute('aria-hidden', 'true');
  Object.assign(measurer.style, {
    position: 'fixed',
    left: '-99999px',
    top: '-99999px',
    visibility: 'hidden',
    whiteSpace: 'pre',
    pointerEvents: 'none'
  });
  document.body.appendChild(measurer);

  function syncMeasureStyle(size) {
    const style = window.getComputedStyle(display);
    measurer.style.fontFamily = style.fontFamily;
    measurer.style.fontWeight = style.fontWeight;
    measurer.style.letterSpacing = style.letterSpacing;
    measurer.style.fontSize = size + 'px';
  }

  function shrinkDisplayText() {
    const text = String(display.value || display.placeholder || '0');
    const available = Math.max(80, display.clientWidth - 20);
    let size = window.innerWidth < 700 ? maxMobile : maxDesktop;

    measurer.textContent = text;
    syncMeasureStyle(size);

    while (size > minSize && measurer.offsetWidth > available) {
      size -= 1;
      syncMeasureStyle(size);
    }

    /* setProperty with important is required because older page CSS also uses !important */
    display.style.setProperty('font-size', size + 'px', 'important');
    display.style.setProperty('line-height', '1.05', 'important');
  }

  function queueShrink() {
    requestAnimationFrame(shrinkDisplayText);
    setTimeout(shrinkDisplayText, 40);
  }

  display.addEventListener('input', queueShrink);
  display.addEventListener('change', queueShrink);
  window.addEventListener('resize', queueShrink);

  ['add', 'addFunction', 'addPower', 'removeLast', 'clearDisplay', 'calculate'].forEach(function (fnName) {
    const original = window[fnName];
    if (typeof original === 'function' && !original.__basicShrinkWrappedV2) {
      const wrapped = function () {
        const result = original.apply(this, arguments);
        queueShrink();
        return result;
      };
      wrapped.__basicShrinkWrappedV2 = true;
      window[fnName] = wrapped;
    }
  });

  queueShrink();
});
})();

/* ===== Page-specific JS: chatting.html (review) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'review') return;
(function () {
      "use strict";

      const storageKey = "calculatorUserReviewsV1";
      const oldStorageKey = "cartoonCalculatorLocalChatMessages";
      const form = document.getElementById("reviewForm");
      const preview = document.getElementById("latestReviewPreview");
      const status = document.getElementById("reviewStatus");
      const clearBtn = document.getElementById("clearReviewsBtn");

      function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
      }

      function stars(value) {
        const rating = Math.max(1, Math.min(5, Number(value) || 5));
        return "★".repeat(rating) + "☆".repeat(5 - rating);
      }

      function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
      }

      function getReviews() {
        const reviews = readJson(storageKey);
        if (reviews.length) return reviews;

        const oldMessages = readJson(oldStorageKey)
          .filter(function (item) { return item && String(item.type || "").toLowerCase() === "review"; })
          .map(function (item) {
            return {
              name: item.name || "Guest",
              rating: 5,
              title: "Review",
              message: item.message || "",
              time: item.time || ""
            };
          });

        if (oldMessages.length) localStorage.setItem(storageKey, JSON.stringify(oldMessages.slice(0, 100)));
        return oldMessages;
      }

      function saveReviews(reviews) {
        localStorage.setItem(storageKey, JSON.stringify(reviews.slice(0, 100)));
      }

      function renderPreview() {
        const reviews = getReviews();
        if (!preview) return;
        if (!reviews.length) {
          preview.innerHTML = '<p class="review-empty-state">No reviews yet. Be the first to post one.</p>';
          return;
        }

        preview.innerHTML = reviews.slice(0, 3).map(function (review) {
          return '<article class="review-preview-item">' +
            '<div class="review-stars" aria-label="' + escapeText(review.rating || 5) + ' out of 5 stars">' + stars(review.rating) + '</div>' +
            '<h3>' + escapeText(review.title || "Review") + '</h3>' +
            '<p>' + escapeText(review.message || "") + '</p>' +
            '<small>By ' + escapeText(review.name || "Guest") + ' · ' + escapeText(review.time || "") + '</small>' +
          '</article>';
        }).join("");
      }

      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          const name = document.getElementById("reviewName").value.trim() || "Guest";
          const rating = document.getElementById("reviewRating").value || "5";
          const title = document.getElementById("reviewTitle").value.trim() || "Helpful calculator website";
          const message = document.getElementById("reviewMessage").value.trim();
          if (!message) return;

          const reviews = getReviews();
          reviews.unshift({
            name: name,
            rating: Number(rating),
            title: title,
            message: message,
            time: new Date().toLocaleString()
          });
          saveReviews(reviews);
          form.reset();
          renderPreview();
          if (status) status.textContent = "Review posted. It is now shown on the Wall page.";
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (!confirm("Clear reviews saved in this browser?")) return;
          localStorage.removeItem(storageKey);
          renderPreview();
          if (status) status.textContent = "Saved reviews cleared from this browser.";
        });
      }

      renderPreview();
    })();
})();

/* ===== Page-specific JS: compound-interest-calculator.html (compound) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'compound') return;
if (window.location.pathname.endsWith("/calculator/")) {
      window.location.replace(
        window.location.pathname + "index.html" + window.location.search + window.location.hash
      );
    }
})();

/* ===== Page-specific JS: grade.html (grade) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'grade') return;

window.pointerRowHtml = function pointerRowHtml(index) {
  return '<tr>' +
    '<td><input type="text" class="pg-subject" placeholder="Subject ' + index + '"></td>' +
    '<td><input type="number" class="pg-credit" min="0" step="0.5" placeholder="3"></td>' +
    '<td><input type="number" class="pg-pointer" min="0" max="4" step="0.01" placeholder="4.00"></td>' +
    '<td><button type="button" class="pg-remove" onclick="removePointerRow(this)" aria-label="Remove row">×</button></td>' +
  '</tr>';
}

window.addPointerRow = function addPointerRow() {
  var body = document.getElementById('pointerGradeRows');
  body.insertAdjacentHTML('beforeend', pointerRowHtml(body.children.length + 1));
}

window.removePointerRow = function removePointerRow(button) {
  var body = document.getElementById('pointerGradeRows');
  if (body.children.length <= 1) return;
  button.closest('tr').remove();
  calculatePointerGrade();
}

window.calculatePointerGrade = function calculatePointerGrade() {
  var rows = Array.from(document.querySelectorAll('#pointerGradeRows tr'));
  var totalCredits = 0;
  var totalQuality = 0;
  var validRows = [];

  rows.forEach(function(row, i) {
    var subject = row.querySelector('.pg-subject').value.trim() || ('Subject ' + (i + 1));
    var credit = Number(row.querySelector('.pg-credit').value);
    var pointer = Number(row.querySelector('.pg-pointer').value);
    if (Number.isFinite(credit) && Number.isFinite(pointer) && credit > 0 && pointer >= 0) {
      if (pointer > 4) pointer = 4;
      var quality = credit * pointer;
      totalCredits += credit;
      totalQuality += quality;
      validRows.push({ subject: subject, credit: credit, pointer: pointer, quality: quality });
    }
  });

  var result = document.getElementById('gradeResult');
  if (!validRows.length || totalCredits <= 0) {
    result.innerHTML = '<article class="finance-result-shell"><header class="finance-result-header"><h2>Pointer result</h2><p>Add at least one subject with credit hour and pointer.</p></header></article>';
    return;
  }

  var gpa = totalQuality / totalCredits;
  var standing = gpa >= 3.67 ? 'Excellent' : gpa >= 3.00 ? 'Good' : gpa >= 2.00 ? 'Pass' : 'Needs improvement';
  var tableRows = validRows.map(function(item) {
    return '<tr><td>' + item.subject + '</td><td>' + item.credit.toFixed(1).replace('.0','') + '</td><td>' + item.pointer.toFixed(2) + '</td><td>' + item.quality.toFixed(2) + '</td></tr>';
  }).join('');

  result.innerHTML = '<article class="finance-result-shell">' +
    '<header class="finance-result-header"><h2>Pointer result</h2><p>Your weighted pointer based on credit hours.</p></header>' +
    '<div class="finance-result-summary-grid">' +
    '<article class="finance-result-metric-card"><div class="finance-result-metric-label">GPA / Pointer</div><div class="finance-result-metric-value">' + gpa.toFixed(2) + '</div></article>' +
    '<article class="finance-result-metric-card"><div class="finance-result-metric-label">Total credit hours</div><div class="finance-result-metric-value">' + totalCredits.toFixed(1).replace('.0','') + '</div></article>' +
    '<article class="finance-result-metric-card"><div class="finance-result-metric-label">Standing</div><div class="finance-result-metric-value">' + standing + '</div></article>' +
    '</div>' +
    '<table class="pointer-grade-mini-table"><thead><tr><th>Subject</th><th>Credit</th><th>Pointer</th><th>Quality points</th></tr></thead><tbody>' + tableRows + '</tbody></table>' +
    '</article>';
}

document.addEventListener('input', function(e) {
  if (e.target && (e.target.classList.contains('pg-credit') || e.target.classList.contains('pg-pointer') || e.target.classList.contains('pg-subject'))) {
    clearTimeout(window.gradeAutoTimer);
    window.gradeAutoTimer = setTimeout(calculatePointerGrade, 250);
  }
});

document.addEventListener('DOMContentLoaded', calculatePointerGrade);

})();

/* ===== Page-specific JS: percentage-calculator.html (percentage) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'percentage') return;
(function () {
  'use strict';

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function byId(id) { return document.getElementById(id); }

  var modes = {
    of: { a: 'Input A: Percentage (%)', b: 'Input B: Number', pa: 'Example: 20', pb: 'Example: 150', help: 'Find A% of B.' },
    iswhat: { a: 'Input A: Part value', b: 'Input B: Total value', pa: 'Example: 30', pb: 'Example: 150', help: 'Find what percentage A is of B.' },
    increase: { a: 'Input A: Original value', b: 'Input B: New value', pa: 'Example: 100', pb: 'Example: 125', help: 'Find percentage increase from A to B.' },
    decrease: { a: 'Input A: Original value', b: 'Input B: New value', pa: 'Example: 100', pb: 'Example: 80', help: 'Find percentage decrease from A to B.' },
    difference: { a: 'Input A: First value', b: 'Input B: Second value', pa: 'Example: 80', pb: 'Example: 100', help: 'Find percentage difference between A and B.' },
    discount: { a: 'Input A: Original price', b: 'Input B: Discount (%)', pa: 'Example: 100', pb: 'Example: 20', help: 'Find the final price after discount.' },
    salary: { a: 'Input A: Current salary', b: 'Input B: Increment (%)', pa: 'Example: 3000', pb: 'Example: 5', help: 'Find the new salary after increment.' },
    reverse: { a: 'Input A: Known value', b: 'Input B: Percentage (%)', pa: 'Example: 50', pb: 'Example: 25', help: 'Find the original value when A is B%.' },
    profitmargin: { a: 'Input A: Selling price', b: 'Input B: Cost price', pa: 'Example: 150', pb: 'Example: 100', help: 'Find the profit margin percentage.' },
    markup: { a: 'Input A: Cost price', b: 'Input B: Markup (%)', pa: 'Example: 100', pb: 'Example: 30', help: 'Find the selling price after markup.' },
    gstsst: { a: 'Input A: Amount before tax', b: 'Input B: GST/SST (%)', pa: 'Example: 100', pb: 'Example: 6', help: 'Find the total amount after GST/SST.' },
    commission: { a: 'Input A: Sales amount', b: 'Input B: Commission (%)', pa: 'Example: 5000', pb: 'Example: 5', help: 'Find the commission amount.' }
  };

  var state = { type: 'of' };

  function numberFromInput(input) {
    var raw = String((input && input.value) || '').replace(/,/g, '').trim();
    if (!raw) return NaN;
    var value = Number(raw);
    return Number.isFinite(value) ? value : NaN;
  }

  function fmt(value, decimals) {
    if (!Number.isFinite(value)) return '-';
    var fixed = Number(value.toFixed(decimals == null ? 8 : decimals));
    return fixed.toLocaleString('en-MY', { maximumFractionDigits: decimals == null ? 8 : decimals, minimumFractionDigits: 0 });
  }

  function money(value) {
    if (!Number.isFinite(value)) return '-';
    return 'RM ' + Number(value.toFixed(2)).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function resultText(a, b) {
    var answer;
    switch (state.type) {
      case 'of':
        return fmt((a / 100) * b);
      case 'iswhat':
        return b === 0 ? 'Cannot divide by zero' : fmt((a / b) * 100) + '%';
      case 'increase':
        return a === 0 ? 'Cannot divide by zero' : fmt(((b - a) / a) * 100) + '%';
      case 'decrease':
        return a === 0 ? 'Cannot divide by zero' : fmt(((a - b) / a) * 100) + '%';
      case 'difference':
        var avg = (Math.abs(a) + Math.abs(b)) / 2;
        return avg === 0 ? 'Cannot calculate difference' : fmt((Math.abs(a - b) / avg) * 100) + '%';
      case 'discount':
        return fmt(a - ((a * b) / 100));
      case 'salary':
        return money(a + ((a * b) / 100));
      case 'reverse':
        return b === 0 ? 'Cannot divide by zero' : fmt(a / (b / 100));
      case 'profitmargin':
        return a === 0 ? 'Cannot divide by zero' : fmt(((a - b) / a) * 100) + '%';
      case 'markup':
        answer = a + ((a * b) / 100);
        return fmt(answer);
      case 'gstsst':
        answer = a + ((a * b) / 100);
        return fmt(answer);
      case 'commission':
        return fmt((a * b) / 100);
      default:
        return 'Select a type';
    }
  }

  function calculate() {
    var inputA = byId('percentageInputA');
    var inputB = byId('percentageInputB');
    var result = byId('percentageLiveResult');
    var resultBox = byId('percentageLiveResultBox');
    var legacy = byId('percentageReportOutput');
    var oldResult = byId('percentageResult');
    if (legacy) legacy.remove();
    if (oldResult) oldResult.style.setProperty('display', 'none', 'important');
    if (!inputA || !inputB || !result || !resultBox) return;
    var a = numberFromInput(inputA);
    var b = numberFromInput(inputB);
    resultBox.hidden = false;
    resultBox.style.setProperty('display', 'block', 'important');
    resultBox.style.setProperty('visibility', 'visible', 'important');
    resultBox.style.setProperty('opacity', '1', 'important');
    result.textContent = (Number.isFinite(a) && Number.isFinite(b)) ? resultText(a, b) : 'Enter values';
  }

  function setMode(type) {
    if (!modes[type]) type = 'of';
    state.type = type;
    var mode = modes[type];
    var labelA = byId('percentageLabelA');
    var labelB = byId('percentageLabelB');
    var inputA = byId('percentageInputA');
    var inputB = byId('percentageInputB');
    var helper = byId('percentageHelper');
    if (labelA) labelA.textContent = mode.a;
    if (labelB) labelB.textContent = mode.b;
    if (inputA) inputA.placeholder = mode.pa;
    if (inputB) inputB.placeholder = mode.pb;
    if (helper) helper.textContent = mode.help;
    $all('.percentage-type-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-type') === type;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.type = 'button';
    });
    calculate();
  }

  function init() {
    var inputA = byId('percentageInputA');
    var inputB = byId('percentageInputB');
    var form = $('.clean-nav-search');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

    $all('.percentage-type-btn').forEach(function (btn) {
      btn.type = 'button';
      btn.style.pointerEvents = 'auto';
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setMode(btn.getAttribute('data-type'));
      });
    });
    if (inputA) {
      inputA.addEventListener('input', calculate);
      inputA.addEventListener('change', calculate);
    }
    if (inputB) {
      inputB.addEventListener('input', calculate);
      inputB.addEventListener('change', calculate);
    }
    var copyBtn = byId('percentageCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var result = byId('percentageLiveResult');
        var text = result ? String(result.textContent || '').trim() : '';
        if (!text || text === 'Enter values') return;
        function done() {
          var oldText = copyBtn.textContent;
          copyBtn.textContent = 'Copied';
          setTimeout(function () { copyBtn.textContent = oldText; }, 1200);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {
            var temp = document.createElement('textarea');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            temp.remove();
            done();
          });
        } else {
          var temp = document.createElement('textarea');
          temp.value = text;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          done();
        }
      });
    }
    window.calculatePercentage = calculate;
    window.calculatePercentageTypeButtons = calculate;
    window.__percentageSetMode = setMode;
    window.scrollToTop = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    setMode(($('.percentage-type-btn.active') || $('.percentage-type-btn') || {}).getAttribute ? (($('.percentage-type-btn.active') || $('.percentage-type-btn')).getAttribute('data-type')) : 'of');
    [50, 250, 700].forEach(function (delay) { setTimeout(calculate, delay); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
})();

/* ===== Page-specific JS: review.html (review) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'review') return;
(function () {
      "use strict";

      const storageKey = "calculatorUserReviewsV1";
      const oldStorageKey = "cartoonCalculatorLocalChatMessages";
      const form = document.getElementById("reviewForm");
      const preview = document.getElementById("latestReviewPreview");
      const status = document.getElementById("reviewStatus");
      const clearBtn = document.getElementById("clearReviewsBtn");

      function escapeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (ch) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
      }

      function stars(value) {
        const rating = Math.max(1, Math.min(5, Number(value) || 5));
        return "★".repeat(rating) + "☆".repeat(5 - rating);
      }

      function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
      }

      function getReviews() {
        const reviews = readJson(storageKey);
        if (reviews.length) return reviews;

        const oldMessages = readJson(oldStorageKey)
          .filter(function (item) { return item && String(item.type || "").toLowerCase() === "review"; })
          .map(function (item) {
            return {
              name: item.name || "Guest",
              rating: 5,
              title: "Review",
              message: item.message || "",
              time: item.time || ""
            };
          });

        if (oldMessages.length) localStorage.setItem(storageKey, JSON.stringify(oldMessages.slice(0, 100)));
        return oldMessages;
      }

      function saveReviews(reviews) {
        localStorage.setItem(storageKey, JSON.stringify(reviews.slice(0, 100)));
      }

      function renderPreview() {
        const reviews = getReviews();
        if (!preview) return;
        if (!reviews.length) {
          preview.innerHTML = '<p class="review-empty-state">No signatures yet. Be the first to sign the wall.</p>';
          return;
        }

        preview.innerHTML = reviews.slice(0, 3).map(function (review) {
          return '<article class="review-preview-item">' +
            '<div class="review-stars" aria-label="' + escapeText(review.rating || 5) + ' out of 5 stars">' + stars(review.rating) + '</div>' +
            '<h3>' + escapeText(review.title || "Review") + '</h3>' +
            '<p>' + escapeText(review.message || "") + '</p>' +
            '<small>By ' + escapeText(review.name || "Guest") + ' · ' + escapeText(review.time || "") + '</small>' +
          '</article>';
        }).join("");
      }

      if (form) {
        form.addEventListener("submit", function (event) {
          event.preventDefault();
          const name = document.getElementById("reviewName").value.trim() || "Guest";
          const rating = document.getElementById("reviewRating").value || "5";
          const title = document.getElementById("reviewTitle").value.trim() || "Helpful calculator website";
          const message = document.getElementById("reviewMessage").value.trim();
          if (!message) return;

          const reviews = getReviews();
          reviews.unshift({
            name: name,
            rating: Number(rating),
            title: title,
            message: message,
            time: new Date().toLocaleString()
          });
          saveReviews(reviews);
          form.reset();
          renderPreview();
          if (status) status.textContent = "Signature added. It is now shown on the Wall page.";
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          if (!confirm("Clear signatures saved in this browser?")) return;
          localStorage.removeItem(storageKey);
          renderPreview();
          if (status) status.textContent = "Saved signatures cleared from this browser.";
        });
      }

      renderPreview();
    })();
})();

/* ===== Page-specific JS: unit-converter-calculator.html (unitConverter) ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;
(function(){
  'use strict';
  if(!/unit-converter-calculator\.html?$/i.test(location.pathname)) return;

  const unitSets = {
    length: [
      ['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'],
      ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']
    ],
    weight: [
      ['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'],
      ['oz','Ounce'], ['tonne','Tonne']
    ],
    temperature: [
      ['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']
    ],
    area: [
      ['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'],
      ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']
    ],
    volume: [
      ['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'],
      ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']
    ],
    speed: [
      ['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'],
      ['knot','Knot'], ['fps','Foot/sec']
    ]
  };

  const factors = {
    length: {m:1,km:1000,cm:0.01,mm:0.001,mile:1609.344,yard:0.9144,ft:0.3048,inch:0.0254},
    weight: {kg:1,g:0.001,mg:0.000001,lb:0.45359237,oz:0.028349523125,tonne:1000},
    area: {m2:1,km2:1000000,cm2:0.0001,ft2:0.09290304,in2:0.00064516,acre:4046.8564224,hectare:10000},
    volume: {l:1,ml:0.001,m3:1000,cm3:0.001,gallon:3.785411784,cup:0.2365882365,pint:0.473176473},
    speed: {mps:1,kmh:0.2777777778,mph:0.44704,knot:0.5144444444,fps:0.3048}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'],
    area:['m2','ft2'], volume:['l','gallon'], speed:['kmh','mph']
  };

  function id(name){ return document.getElementById(name); }
  function activeType(){ return id('unitType') ? id('unitType').value || 'length' : 'length'; }
  function labelFor(type, key){
    const found = (unitSets[type] || []).find(item => item[0] === key);
    return found ? found[1] : key;
  }
  function format(value){
    if(!Number.isFinite(value)) return '-';
    return Number(value.toPrecision(12)).toLocaleString('en-MY', {maximumFractionDigits:8});
  }
  function convertTemp(value, from, to){
    let c;
    if(from === 'c') c = value;
    else if(from === 'f') c = (value - 32) * 5 / 9;
    else if(from === 'k') c = value - 273.15;
    else return NaN;
    if(to === 'c') return c;
    if(to === 'f') return c * 9 / 5 + 32;
    if(to === 'k') return c + 273.15;
    return NaN;
  }
  function renderResult(value, result, type, from, to){ return; }
  function renderEmptyResult(message){ return; }
  function calculate(){
    const type = activeType();
    const valueInput = id('unitValue');
    const value = Number(String(valueInput && valueInput.value || '').replace(/,/g,'').trim());
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';
    if(!Number.isFinite(value)) { renderEmptyResult('Enter value'); return; }
    let result = NaN;
    if(type === 'temperature') result = convertTemp(value, from, to);
    else if(factors[type] && Number.isFinite(factors[type][from]) && Number.isFinite(factors[type][to])) {
      result = value * factors[type][from] / factors[type][to];
    }
    if(Number.isFinite(result)) renderResult(value, result, type, from, to);
    else renderEmptyResult('Unsupported unit');
  }
  function renderUnitButtons(which){
    const type = activeType();
    const holder = id(which === 'from' ? 'unitFromButtons' : 'unitToButtons');
    const input = id(which === 'from' ? 'unitFrom' : 'unitTo');
    if(!holder || !input) return;
    holder.innerHTML = '';
    (unitSets[type] || []).forEach(([key, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.unitValue = key;
      if(input.value === key) btn.classList.add('is-active');
      btn.addEventListener('click', () => {
        input.value = key;
        holder.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        input.dispatchEvent(new Event('change', {bubbles:true}));
        calculate();
      });
      holder.appendChild(btn);
    });
  }
  function setType(type){
    if(!unitSets[type]) return;
    id('unitType').value = type;
    const pair = defaults[type];
    id('unitFrom').value = pair[0];
    id('unitTo').value = pair[1];
    document.querySelectorAll('.unit-type-btn').forEach(btn => btn.classList.toggle('is-active', btn.dataset.unitType === type));
    renderUnitButtons('from');
    renderUnitButtons('to');
    id('unitType').dispatchEvent(new Event('change', {bubbles:true}));
    calculate();
  }
  function init(){
    document.querySelectorAll('.unit-type-btn').forEach(btn => btn.addEventListener('click', () => setType(btn.dataset.unitType)));
    const valueInput = id('unitValue');
    if(valueInput){
      valueInput.addEventListener('input', calculate);
      valueInput.addEventListener('change', calculate);
    }
    window.calculateUnitConverterExtra = calculate;
    setType(activeType());
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  setTimeout(function(){ window.calculateUnitConverterExtra = calculate; }, 400);
})();
})();

/* ===== Unit Converter dropdown units override ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']]
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'],
    area:['m2','ft2'], volume:['l','gallon'], speed:['kmh','mph']
  };

  function id(name){ return document.getElementById(name); }

  function fillSelect(select, items, selected){
    if (!select) return;
    select.innerHTML = '';
    items.forEach(function(item){
      const opt = document.createElement('option');
      opt.value = item[0];
      opt.textContent = item[1];
      if (item[0] === selected) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function updateDropdowns(type){
    type = unitSets[type] ? type : 'length';
    const pair = defaults[type] || defaults.length;
    if (id('unitType')) id('unitType').value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
    document.querySelectorAll('.unit-type-btn').forEach(function(btn){
      btn.classList.toggle('is-active', btn.dataset.unitType === type);
    });
    if (typeof window.calculateUnitConverterExtra === 'function') {
      window.calculateUnitConverterExtra();
    }
  }

  function initUnitDropdowns(){
    document.querySelectorAll('.unit-type-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        setTimeout(function(){ updateDropdowns(btn.dataset.unitType); }, 0);
      });
    });
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (el) {
        el.addEventListener('change', function(){
          if (typeof window.calculateUnitConverterExtra === 'function') window.calculateUnitConverterExtra();
        });
        el.addEventListener('input', function(){
          if (typeof window.calculateUnitConverterExtra === 'function') window.calculateUnitConverterExtra();
        });
      }
    });
    updateDropdowns((id('unitType') && id('unitType').value) || 'length');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUnitDropdowns);
  else initUnitDropdowns();
})();

/* ===== Unit Converter type dropdown + expanded units override ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']],
    currency: [['usd','USD'], ['myr','MYR'], ['sgd','SGD'], ['eur','EUR'], ['gbp','GBP'], ['jpy','JPY'], ['aud','AUD']],
    data: [['b','Byte'], ['kb','Kilobyte'], ['mb','Megabyte'], ['gb','Gigabyte'], ['tb','Terabyte'], ['kib','Kibibyte'], ['mib','Mebibyte'], ['gib','Gibibyte']],
    time: [['s','Second'], ['min','Minute'], ['h','Hour'], ['day','Day'], ['week','Week'], ['month','Month'], ['year','Year']],
    energyPower: [['j','Joule'], ['kj','Kilojoule'], ['cal','Calorie'], ['kcal','Kilocalorie'], ['wh','Watt-hour'], ['kwh','Kilowatt-hour'], ['w','Watt'], ['kw','Kilowatt'], ['hp','Horsepower']]
  };

  const factors = {
    length: {m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254},
    weight: {kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, tonne:1000},
    area: {m2:1, km2:1000000, cm2:0.0001, ft2:0.09290304, in2:0.00064516, acre:4046.8564224, hectare:10000},
    volume: {l:1, ml:0.001, m3:1000, cm3:0.001, gallon:3.785411784, cup:0.2365882365, pint:0.473176473},
    speed: {mps:1, kmh:0.2777777778, mph:0.44704, knot:0.5144444444, fps:0.3048},
    currency: {usd:1, myr:0.213, sgd:0.74, eur:1.08, gbp:1.27, jpy:0.0064, aud:0.66},
    data: {b:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824},
    time: {s:1, min:60, h:3600, day:86400, week:604800, month:2629746, year:31556952},
    energyPower: {j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, w:1, kw:1000, hp:745.699872}
  };

  const dimension = {
    energyPower: {j:'energy', kj:'energy', cal:'energy', kcal:'energy', wh:'energy', kwh:'energy', w:'power', kw:'power', hp:'power'}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'], area:['m2','ft2'], volume:['l','gallon'], speed:['kmh','mph'],
    currency:['usd','myr'], data:['mb','gb'], time:['h','min'], energyPower:['j','kj']
  };

  function id(name){ return document.getElementById(name); }

  function fillSelect(select, items, selected){
    if (!select) return;
    select.innerHTML = '';
    items.forEach(function(item){
      const opt = document.createElement('option');
      opt.value = item[0];
      opt.textContent = item[1];
      if (item[0] === selected) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function convertTemp(value, from, to){
    let c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else if (from === 'k') c = value - 273.15;
    else return NaN;
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    if (to === 'k') return c + 273.15;
    return NaN;
  }

  function calculate(){
    const type = (id('unitType') && id('unitType').value) || 'length';
    const value = Number(String(id('unitValue') && id('unitValue').value || '').replace(/,/g,'').trim());
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';
    if (!Number.isFinite(value)) return;
    if (type === 'temperature') return convertTemp(value, from, to);
    if (dimension[type] && dimension[type][from] && dimension[type][to] && dimension[type][from] !== dimension[type][to]) return NaN;
    const set = factors[type] || {};
    if (Number.isFinite(set[from]) && Number.isFinite(set[to]) && set[to] !== 0) return value * set[from] / set[to];
    return NaN;
  }

  function setType(type){
    type = unitSets[type] ? type : 'length';
    const pair = defaults[type] || defaults.length;
    if (id('unitType')) id('unitType').value = type;
    if (id('unitTypeSelect')) id('unitTypeSelect').value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
  }

  function init(){
    const typeSelect = id('unitTypeSelect');
    if (typeSelect) {
      typeSelect.addEventListener('change', function(){ setType(typeSelect.value); });
    }
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (el) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
      }
    });
    setType((id('unitType') && id('unitType').value) || 'length');
    window.calculateUnitConverterExtra = calculate;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* ===== Unit Converter final standalone auto-calculate fix ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']],
    currency: [['usd','USD'], ['myr','MYR'], ['sgd','SGD'], ['eur','EUR'], ['gbp','GBP'], ['jpy','JPY'], ['aud','AUD']],
    data: [['b','Byte'], ['kb','Kilobyte'], ['mb','Megabyte'], ['gb','Gigabyte'], ['tb','Terabyte'], ['kib','Kibibyte'], ['mib','Mebibyte'], ['gib','Gibibyte']],
    time: [['s','Second'], ['min','Minute'], ['h','Hour'], ['day','Day'], ['week','Week'], ['month','Month'], ['year','Year']],
    energyPower: [['j','Joule'], ['kj','Kilojoule'], ['cal','Calorie'], ['kcal','Kilocalorie'], ['wh','Watt-hour'], ['kwh','Kilowatt-hour'], ['w','Watt'], ['kw','Kilowatt'], ['hp','Horsepower']]
  };

  const factors = {
    length: {m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254},
    weight: {kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, tonne:1000},
    area: {m2:1, km2:1000000, cm2:0.0001, ft2:0.09290304, in2:0.00064516, acre:4046.8564224, hectare:10000},
    volume: {l:1, ml:0.001, m3:1000, cm3:0.001, gallon:3.785411784, cup:0.2365882365, pint:0.473176473},
    speed: {mps:1, kmh:0.2777777778, mph:0.44704, knot:0.5144444444, fps:0.3048},
    /* Static approximate USD-based rates. For live rates, keep using your separate Currency Converter page. */
    currency: {usd:1, myr:0.213, sgd:0.74, eur:1.08, gbp:1.27, jpy:0.0064, aud:0.66},
    data: {b:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824},
    time: {s:1, min:60, h:3600, day:86400, week:604800, month:2629746, year:31556952},
    energyPower: {j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, w:1, kw:1000, hp:745.699872}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'], area:['m2','ft2'],
    volume:['l','gallon'], speed:['kmh','mph'], currency:['usd','myr'],
    data:['mb','gb'], time:['h','min'], energyPower:['j','kj']
  };

  const dimension = {
    energyPower: {j:'energy', kj:'energy', cal:'energy', kcal:'energy', wh:'energy', kwh:'energy', w:'power', kw:'power', hp:'power'}
  };

  function id(name){ return document.getElementById(name); }
  function labelFor(type, value){
    const found = (unitSets[type] || []).find(function(item){ return item[0] === value; });
    return found ? found[1] : value;
  }
  function fillSelect(select, items, selected){
    if (!select) return;
    const current = selected || select.value;
    select.innerHTML = '';
    items.forEach(function(item){
      const option = document.createElement('option');
      option.value = item[0];
      option.textContent = item[1];
      if (item[0] === current) option.selected = true;
      select.appendChild(option);
    });
  }
  function formatNumber(value){
    if (!Number.isFinite(value)) return '-';
    const clean = Math.abs(value) >= 100000000 || Math.abs(value) < 0.000001 && value !== 0
      ? Number(value).toExponential(6)
      : Number(value.toPrecision(12)).toLocaleString('en-MY', { maximumFractionDigits: 8 });
    return clean;
  }
  function setOutput(main, detail){
    const result = id('unitInlineResult');
    const detailEl = id('unitInlineDetail');
    if (result) result.textContent = main || 'Enter value';
    if (detailEl) detailEl.textContent = detail || '';
  }
  function convertTemp(value, from, to){
    let c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else if (from === 'k') c = value - 273.15;
    else return NaN;
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    if (to === 'k') return c + 273.15;
    return NaN;
  }
  function activeType(){
    const typeSelect = id('unitTypeSelect');
    const hidden = id('unitType');
    return (typeSelect && typeSelect.value) || (hidden && hidden.value) || 'length';
  }
  function calculate(){
    const type = activeType();
    const valueInput = id('unitValue');
    const raw = valueInput ? String(valueInput.value || '').replace(/,/g,'').trim() : '';
    const value = Number(raw);
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';

    if (!raw || !Number.isFinite(value)) {
      setOutput('Enter value', '');
      return NaN;
    }

    let result = NaN;
    if (type === 'temperature') {
      result = convertTemp(value, from, to);
    } else {
      if (dimension[type] && dimension[type][from] && dimension[type][to] && dimension[type][from] !== dimension[type][to]) {
        setOutput('Choose matching units', 'Energy and power cannot be directly converted.');
        return NaN;
      }
      const set = factors[type] || {};
      if (Number.isFinite(set[from]) && Number.isFinite(set[to]) && set[to] !== 0) {
        result = value * set[from] / set[to];
      }
    }

    if (!Number.isFinite(result)) {
      setOutput('Unsupported unit', '');
      return NaN;
    }

    setOutput(formatNumber(result) + ' ' + labelFor(type, to), formatNumber(value) + ' ' + labelFor(type, from) + ' → ' + labelFor(type, to));
    return result;
  }
  function setType(type){
    type = unitSets[type] ? type : 'length';
    const hidden = id('unitType');
    const typeSelect = id('unitTypeSelect');
    const pair = defaults[type] || defaults.length;

    if (hidden) hidden.value = type;
    if (typeSelect) typeSelect.value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
    calculate();
  }
  function init(){
    const typeSelect = id('unitTypeSelect');
    if (typeSelect) {
      typeSelect.addEventListener('change', function(){ setType(typeSelect.value); });
    }
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (!el) return;
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
      el.addEventListener('keyup', calculate);
    });

    window.calculateUnitConverterExtra = calculate;
    setType(activeType());
    calculate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* ===== Unit Converter live currency rate override ===== */
(function(){
  'use strict';
  if (!document.body || document.body.dataset.page !== 'unitConverter') return;

  const unitSets = {
    length: [['m','Meter'], ['km','Kilometer'], ['cm','Centimeter'], ['mm','Millimeter'], ['mile','Mile'], ['yard','Yard'], ['ft','Foot'], ['inch','Inch']],
    weight: [['kg','Kilogram'], ['g','Gram'], ['mg','Milligram'], ['lb','Pound'], ['oz','Ounce'], ['tonne','Tonne']],
    temperature: [['c','Celsius'], ['f','Fahrenheit'], ['k','Kelvin']],
    area: [['m2','Square meter'], ['km2','Square kilometer'], ['cm2','Square centimeter'], ['ft2','Square foot'], ['in2','Square inch'], ['acre','Acre'], ['hectare','Hectare']],
    volume: [['l','Liter'], ['ml','Milliliter'], ['m3','Cubic meter'], ['cm3','Cubic centimeter'], ['gallon','Gallon'], ['cup','Cup'], ['pint','Pint']],
    speed: [['mps','Meter/sec'], ['kmh','Kilometer/hour'], ['mph','Mile/hour'], ['knot','Knot'], ['fps','Foot/sec']],
    currency: [['USD','USD'], ['MYR','MYR'], ['SGD','SGD'], ['EUR','EUR'], ['GBP','GBP'], ['JPY','JPY'], ['AUD','AUD'], ['CAD','CAD'], ['CHF','CHF'], ['CNY','CNY'], ['THB','THB'], ['IDR','IDR']],
    data: [['b','Byte'], ['kb','Kilobyte'], ['mb','Megabyte'], ['gb','Gigabyte'], ['tb','Terabyte'], ['kib','Kibibyte'], ['mib','Mebibyte'], ['gib','Gibibyte']],
    time: [['s','Second'], ['min','Minute'], ['h','Hour'], ['day','Day'], ['week','Week'], ['month','Month'], ['year','Year']],
    energyPower: [['j','Joule'], ['kj','Kilojoule'], ['cal','Calorie'], ['kcal','Kilocalorie'], ['wh','Watt-hour'], ['kwh','Kilowatt-hour'], ['w','Watt'], ['kw','Kilowatt'], ['hp','Horsepower']]
  };

  const factors = {
    length: {m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254},
    weight: {kg:1, g:0.001, mg:0.000001, lb:0.45359237, oz:0.028349523125, tonne:1000},
    area: {m2:1, km2:1000000, cm2:0.0001, ft2:0.09290304, in2:0.00064516, acre:4046.8564224, hectare:10000},
    volume: {l:1, ml:0.001, m3:1000, cm3:0.001, gallon:3.785411784, cup:0.2365882365, pint:0.473176473},
    speed: {mps:1, kmh:0.2777777778, mph:0.44704, knot:0.5144444444, fps:0.3048},
    data: {b:1, kb:1000, mb:1000000, gb:1000000000, tb:1000000000000, kib:1024, mib:1048576, gib:1073741824},
    time: {s:1, min:60, h:3600, day:86400, week:604800, month:2629746, year:31556952},
    energyPower: {j:1, kj:1000, cal:4.184, kcal:4184, wh:3600, kwh:3600000, w:1, kw:1000, hp:745.699872}
  };

  const defaults = {
    length:['m','km'], weight:['kg','lb'], temperature:['c','f'], area:['m2','ft2'],
    volume:['l','gallon'], speed:['kmh','mph'], currency:['USD','MYR'],
    data:['mb','gb'], time:['h','min'], energyPower:['j','kj']
  };

  const dimension = {
    energyPower: {j:'energy', kj:'energy', cal:'energy', kcal:'energy', wh:'energy', kwh:'energy', w:'power', kw:'power', hp:'power'}
  };

  const rateCache = new Map();
  let currencyRequestToken = 0;

  function id(name){ return document.getElementById(name); }
  function labelFor(type, value){
    const found = (unitSets[type] || []).find(function(item){ return item[0] === value; });
    return found ? found[1] : value;
  }
  function fillSelect(select, items, selected){
    if (!select) return;
    select.innerHTML = '';
    items.forEach(function(item){
      const option = document.createElement('option');
      option.value = item[0];
      option.textContent = item[1];
      if (item[0] === selected) option.selected = true;
      select.appendChild(option);
    });
  }
  function formatNumber(value){
    if (!Number.isFinite(value)) return '-';
    if ((Math.abs(value) >= 100000000 || (Math.abs(value) < 0.000001 && value !== 0))) return Number(value).toExponential(6);
    return Number(value.toPrecision(12)).toLocaleString('en-MY', { maximumFractionDigits: 8 });
  }
  function setOutput(main, detail){
    const result = id('unitInlineResult');
    const detailEl = id('unitInlineDetail');
    if (result) result.textContent = main || 'Enter value';
    if (detailEl) detailEl.textContent = detail || '';
  }
  function convertTemp(value, from, to){
    let c;
    if (from === 'c') c = value;
    else if (from === 'f') c = (value - 32) * 5 / 9;
    else if (from === 'k') c = value - 273.15;
    else return NaN;
    if (to === 'c') return c;
    if (to === 'f') return c * 9 / 5 + 32;
    if (to === 'k') return c + 273.15;
    return NaN;
  }
  function activeType(){
    const typeSelect = id('unitTypeSelect');
    const hidden = id('unitType');
    return (typeSelect && typeSelect.value) || (hidden && hidden.value) || 'length';
  }
  function getValue(){
    const valueInput = id('unitValue');
    const raw = valueInput ? String(valueInput.value || '').replace(/,/g,'').trim() : '';
    return { raw: raw, value: Number(raw) };
  }
  function getCurrencyCacheKey(from, to){ return String(from).toUpperCase() + '_' + String(to).toUpperCase(); }
  async function getLiveRate(from, to){
    from = String(from || '').toUpperCase();
    to = String(to || '').toUpperCase();
    if (from === to) return { rate: 1, date: 'same currency' };

    const key = getCurrencyCacheKey(from, to);
    const cached = rateCache.get(key);
    if (cached && Date.now() - cached.savedAt < 30 * 60 * 1000) return cached;

    const storedRaw = sessionStorage.getItem('unitCurrencyRate_' + key);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        if (stored && Date.now() - stored.savedAt < 30 * 60 * 1000) {
          rateCache.set(key, stored);
          return stored;
        }
      } catch (e) {}
    }

    const url = 'https://api.frankfurter.dev/v1/latest?base=' + encodeURIComponent(from) + '&symbols=' + encodeURIComponent(to);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Exchange rate request failed');
    const data = await response.json();
    const rate = data && data.rates ? Number(data.rates[to]) : NaN;
    if (!Number.isFinite(rate)) throw new Error('Exchange rate unavailable');

    const payload = { rate: rate, date: data.date || 'latest', savedAt: Date.now() };
    rateCache.set(key, payload);
    try { sessionStorage.setItem('unitCurrencyRate_' + key, JSON.stringify(payload)); } catch (e) {}
    return payload;
  }
  function calculateNormal(type, value, from, to){
    if (type === 'temperature') return convertTemp(value, from, to);
    if (dimension[type] && dimension[type][from] && dimension[type][to] && dimension[type][from] !== dimension[type][to]) {
      setOutput('Choose matching units', 'Energy and power cannot be directly converted.');
      return NaN;
    }
    const set = factors[type] || {};
    if (Number.isFinite(set[from]) && Number.isFinite(set[to]) && set[to] !== 0) return value * set[from] / set[to];
    return NaN;
  }
  async function calculate(){
    const type = activeType();
    const val = getValue();
    const from = id('unitFrom') ? id('unitFrom').value : '';
    const to = id('unitTo') ? id('unitTo').value : '';
    if (!val.raw || !Number.isFinite(val.value)) {
      setOutput('Enter value', '');
      return NaN;
    }

    if (type === 'currency') {
      const token = ++currencyRequestToken;
      setOutput('Loading live rate...', String(from).toUpperCase() + ' → ' + String(to).toUpperCase());
      try {
        const live = await getLiveRate(from, to);
        if (token !== currencyRequestToken) return NaN;
        const result = val.value * live.rate;
        setOutput(formatNumber(result) + ' ' + String(to).toUpperCase(), 'Live rate: 1 ' + String(from).toUpperCase() + ' = ' + formatNumber(live.rate) + ' ' + String(to).toUpperCase() + ' · ' + live.date);
        return result;
      } catch (error) {
        if (token !== currencyRequestToken) return NaN;
        setOutput('Live rate unavailable', 'Check your internet connection or choose another currency.');
        return NaN;
      }
    }

    currencyRequestToken++;
    const result = calculateNormal(type, val.value, from, to);
    if (!Number.isFinite(result)) {
      if (type !== 'energyPower') setOutput('Unsupported unit', '');
      return NaN;
    }
    setOutput(formatNumber(result) + ' ' + labelFor(type, to), formatNumber(val.value) + ' ' + labelFor(type, from) + ' → ' + labelFor(type, to));
    return result;
  }
  function setType(type){
    type = unitSets[type] ? type : 'length';
    const hidden = id('unitType');
    const typeSelect = id('unitTypeSelect');
    const pair = defaults[type] || defaults.length;
    if (hidden) hidden.value = type;
    if (typeSelect) typeSelect.value = type;
    fillSelect(id('unitFrom'), unitSets[type], pair[0]);
    fillSelect(id('unitTo'), unitSets[type], pair[1]);
    calculate();
  }
  function init(){
    const typeSelect = id('unitTypeSelect');
    if (typeSelect) typeSelect.addEventListener('change', function(){ setType(typeSelect.value); });
    ['unitFrom','unitTo','unitValue'].forEach(function(name){
      const el = id(name);
      if (!el) return;
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
      el.addEventListener('keyup', calculate);
    });
    window.calculateUnitConverterExtra = calculate;
    window.setUnitConverterType = setType;
    setType(activeType());
    calculate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();


/* Unit Converter copy result button */
(function(){
  'use strict';
  function ready(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function(){
    if (!document.body || document.body.dataset.page !== 'unitConverter') return;
    var btn = document.getElementById('unitCopyResultBtn');
    var result = document.getElementById('unitInlineResult');
    var detail = document.getElementById('unitInlineDetail');
    if (!btn || !result) return;

    function getText(){
      var main = (result.textContent || '').trim();
      var sub = detail ? (detail.textContent || '').trim() : '';
      if (!main || /^enter value$/i.test(main) || /^-$/i.test(main)) return '';
      return sub ? main + ' — ' + sub : main;
    }

    function syncButton(){
      btn.disabled = !getText();
    }

    btn.addEventListener('click', function(){
      var text = getText();
      if (!text) return;
      function done(){
        var old = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function(){ btn.textContent = old || 'Copy result'; }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function(){
          var area = document.createElement('textarea');
          area.value = text;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.left = '-9999px';
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); done(); } catch(e) {}
          area.remove();
        });
      } else {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try { document.execCommand('copy'); done(); } catch(e) {}
        area.remove();
      }
    });

    syncButton();
    if (window.MutationObserver) {
      new MutationObserver(syncButton).observe(result, {childList:true, characterData:true, subtree:true});
      if (detail) new MutationObserver(syncButton).observe(detail, {childList:true, characterData:true, subtree:true});
    }
    document.addEventListener('input', syncButton, true);
    document.addEventListener('change', syncButton, true);
    setTimeout(syncButton, 500);
  });
})();


/* Basic Calculator copy result button */
(function(){
  'use strict';
  function initBasicCopyButton(){
    if (!document.body || document.body.dataset.page !== 'basic') return;
    var btn = document.getElementById('basicCopyBtn');
    var display = document.getElementById('display');
    if (!btn || !display || btn.dataset.copyReady === '1') return;
    btn.dataset.copyReady = '1';
    btn.addEventListener('click', function(){
      var text = String(display.value || '').trim();
      if (!text || text === 'Error') return;
      function done(){
        var oldText = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function(){ btn.textContent = oldText || 'Copy result'; }, 1200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function(){
          var temp = document.createElement('textarea');
          temp.value = text;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          temp.remove();
          done();
        });
      } else {
        var temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
        done();
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBasicCopyButton);
  else initBasicCopyButton();
})();

/* Sync Unit Converter instruction box width to calculator box */
(function(){
  'use strict';
  function syncUnitInstructionWidth(){
    if (!document.body || document.body.dataset.page !== 'unitConverter') return;
    var main = document.querySelector('main');
    var calc = main && main.querySelector(':scope > .calculator.extra-calculator-box');
    var instruction = main && main.querySelector(':scope > .instruction-box.universal-help-panel');
    if (!calc || !instruction) return;
    if (window.innerWidth < 851) {
      instruction.style.width = '';
      instruction.style.maxWidth = '';
      return;
    }
    var width = Math.round(calc.getBoundingClientRect().width);
    if (width > 0) {
      instruction.style.width = width + 'px';
      instruction.style.maxWidth = width + 'px';
      instruction.style.justifySelf = 'start';
      instruction.style.boxSizing = 'border-box';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncUnitInstructionWidth);
  else syncUnitInstructionWidth();
  window.addEventListener('resize', syncUnitInstructionWidth);
  setTimeout(syncUnitInstructionWidth, 100);
  setTimeout(syncUnitInstructionWidth, 500);
  setTimeout(syncUnitInstructionWidth, 1200);
})();


/* Unit Converter: exact-match instruction box width to calculator box */
(function () {
  'use strict';

  function syncUnitConverterInstructionWidth() {
    if (!document.body || document.body.dataset.page !== 'unitConverter') return;

    var main = document.querySelector('main.loan-calculator-container.extra-calculator-container.extra-calculator-layout.extra-help-layout.tool-layout');
    var calculator = main && main.querySelector(':scope > .calculator.extra-calculator-box');
    var instruction = main && main.querySelector(':scope > .instruction-box.universal-help-panel');

    if (!main || !calculator || !instruction) return;

    var width = Math.round(calculator.getBoundingClientRect().width);
    if (width > 0) {
      document.documentElement.style.setProperty('--unit-converter-box-width', width + 'px');
      instruction.style.setProperty('width', width + 'px', 'important');
      instruction.style.setProperty('max-width', width + 'px', 'important');
      instruction.style.setProperty('min-width', '0', 'important');
      instruction.style.setProperty('box-sizing', 'border-box', 'important');

      instruction.querySelectorAll('.instruction-section, .instruction-what-box, .reference-box, .reference-scroll').forEach(function (el) {
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('max-width', '100%', 'important');
        el.style.setProperty('box-sizing', 'border-box', 'important');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncUnitConverterInstructionWidth);
  } else {
    syncUnitConverterInstructionWidth();
  }

  window.addEventListener('resize', syncUnitConverterInstructionWidth);
  setTimeout(syncUnitConverterInstructionWidth, 100);
  setTimeout(syncUnitConverterInstructionWidth, 500);
})();



/* ===== Age Calculator single clean script: no duplicate render ===== */
(function () {
  'use strict';
  if (!document.body || document.body.dataset.page !== 'age') return;

  function $(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
    });
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parseISO(value, endOfDay) {
    if (!value) return null;
    var parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (n) { return !Number.isFinite(n); })) return null;
    return new Date(parts[0], parts[1] - 1, parts[2], endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  }
  function formatDMY(value) {
    var p = String(value || '').split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : value;
  }
  function breakdown(start, end) {
    if (!start || !end || end < start) return null;
    var y = end.getFullYear() - start.getFullYear();
    var m = end.getMonth() - start.getMonth();
    var d = end.getDate() - start.getDate();
    if (d < 0) {
      m -= 1;
      d += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    }
    if (m < 0) {
      y -= 1;
      m += 12;
    }
    return { years: y, months: m, days: d };
  }
  function zodiac(month, day) {
    var signs = [['Capricorn',1,19],['Aquarius',2,18],['Pisces',3,20],['Aries',4,19],['Taurus',5,20],['Gemini',6,20],['Cancer',7,22],['Leo',8,22],['Virgo',9,22],['Libra',10,22],['Scorpio',11,21],['Sagittarius',12,21]];
    for (var i = 0; i < signs.length; i++) {
      if (month < signs[i][1] || (month === signs[i][1] && day <= signs[i][2])) return signs[i][0];
    }
    return 'Capricorn';
  }
  function chinese(year) {
    var animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
    var index = (year - 1900) % 12;
    if (index < 0) index += 12;
    return animals[index];
  }
  function nextBirthdayDays(birth, target) {
    var base = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    var next = new Date(base.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < base) next = new Date(base.getFullYear() + 1, birth.getMonth(), birth.getDate());
    return Math.max(0, Math.ceil((next.getTime() - base.getTime()) / 86400000));
  }
  function row(label, value) {
    return '<li class="age-final-result-row"><strong>' + esc(label) + '</strong><span>' + esc(value) + '</span></li>';
  }
  function group(title, rows) {
    return '<section class="age-final-group-box"><h3>' + esc(title) + '</h3><ul class="age-final-result-list">' + rows.join('') + '</ul></section>';
  }
  function removeDuplicateAgePanels() {
    var main = document.querySelector('main.age-calculator-container');
    var calc = main && main.querySelector(':scope > .calculator');
    if (!main || !calc) return null;
    var panels = Array.from(document.querySelectorAll('#ageReportOutput'));
    var keeper = panels.find(function (panel) { return panel.parentElement === main; }) || panels[0] || null;
    if (!keeper) {
      keeper = document.createElement('section');
      keeper.id = 'ageReportOutput';
      keeper.className = 'age-clean-result age-point-output age-final-output';
      keeper.setAttribute('aria-label', 'Age Calculator result');
      keeper.hidden = true;
    }
    panels.forEach(function (panel) {
      if (panel !== keeper) panel.remove();
    });
    if (keeper.parentElement !== main) calc.insertAdjacentElement('afterend', keeper);
    else if (keeper.previousElementSibling !== calc) calc.insertAdjacentElement('afterend', keeper);
    keeper.className = 'age-clean-result age-point-output age-final-output';
    keeper.setAttribute('aria-label', 'Age Calculator result');
    return keeper;
  }
  function hidePanel() {
    var panel = removeDuplicateAgePanels();
    if (!panel) return;
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = '';
  }
  function showPanel(html) {
    var panel = removeDuplicateAgePanels();
    if (!panel) return;
    panel.innerHTML = html;
    panel.hidden = false;
    panel.removeAttribute('aria-hidden');
  }
  function calculateAgeClean() {
    removeDuplicateAgePanels();
    var nameInput = $('ageName');
    var birthInput = $('birthdate');
    var targetInput = $('dateToCalculate');
    if (targetInput && !targetInput.value) targetInput.value = todayISO();
    if (!birthInput || !birthInput.value) { hidePanel(); return; }

    var targetValue = targetInput && targetInput.value ? targetInput.value : todayISO();
    var birth = parseISO(birthInput.value, false);
    var target = parseISO(targetValue, true);
    if (!birth || !target || birth > target) {
      showPanel('<div class="age-final-error">Please choose a valid birth date before the calculation date.</div>');
      return;
    }

    var exact = breakdown(birth, target);
    if (!exact) { hidePanel(); return; }
    var totalDays = Math.floor((target.getTime() - birth.getTime()) / 86400000);
    var totalSeconds = Math.floor((target.getTime() - birth.getTime()) / 1000);
    var totalMonths = exact.years * 12 + exact.months;
    var totalWeeks = Math.floor(totalDays / 7);
    var birthdayDays = nextBirthdayDays(birth, target);
    var name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '-';
    var asianAge = target.getFullYear() - birth.getFullYear() + 1;

    var html = '<div class="age-final-result-shell"><div class="age-final-result-grid">' +
      group('Birth & calendar', [
        row('Name', name),
        row('Date range', formatDMY(birthInput.value) + ' to ' + formatDMY(targetValue)),
        row('Day of week born', birth.toLocaleDateString('en-US', { weekday: 'long' }))
      ]) +
      group('Current age', [
        row('Exact age', exact.years + ' years, ' + exact.months + ' months, ' + exact.days + ' days'),
        row('Normal age', exact.years + ' years old'),
        row('Asian age', asianAge + ' years old')
      ]) +
      group('Total time lived', [
        row('Months old', totalMonths.toLocaleString()),
        row('Weeks old', totalWeeks.toLocaleString()),
        row('Days old', totalDays.toLocaleString()),
        row('Seconds old', totalSeconds.toLocaleString())
      ]) +
      group('Birthday & milestones', [
        row('Next birthday countdown', birthdayDays + ' day' + (birthdayDays === 1 ? '' : 's')),
        row('Legal age', exact.years >= 18 ? 'Legal adult age reached' : (18 - exact.years) + ' years before legal adult age'),
        row('Retirement', exact.years >= 60 ? 'Retirement age reached' : (60 - exact.years) + ' years before retirement')
      ]) +
      group('Life summary', [
        row('Estimated sleep time', Math.floor(totalDays / 3).toLocaleString() + ' days'),
        row('Estimated breaths', Math.round(totalSeconds / 60 * 16).toLocaleString()),
        row('Estimated heartbeats', Math.round(totalSeconds / 60 * 70).toLocaleString())
      ]) +
      group('Zodiac', [
        row('Western zodiac', zodiac(birth.getMonth() + 1, birth.getDate())),
        row('Chinese zodiac', chinese(birth.getFullYear()))
      ]) +
      '</div></div>';
    showPanel(html);
  }
  function cleanAgeInputs() {
    var main = document.querySelector('main.age-calculator-container');
    var calc = main && main.querySelector(':scope > .calculator');
    if (!calc) return;

    Array.from(calc.querySelectorAll('.age-input-layout')).forEach(function (box, index) {
      if (index > 0) box.remove();
    });
    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (inputId) {
      var matches = Array.from(document.querySelectorAll('#' + inputId));
      matches.forEach(function (el, index) {
        if (index > 0) el.closest('.age-field, .age-input-box') ? el.closest('.age-field, .age-input-box').remove() : el.remove();
      });
    });
    removeDuplicateAgePanels();
  }
  function bind() {
    cleanAgeInputs();
    var target = $('dateToCalculate');
    if (target && !target.value) target.value = todayISO();
    ['ageName', 'birthdate', 'dateToCalculate'].forEach(function (inputId) {
      var el = $(inputId);
      if (!el) return;
      el.addEventListener('input', calculateAgeClean);
      el.addEventListener('change', calculateAgeClean);
    });
    var button = $('ageCalculateBtn');
    if (button) button.addEventListener('click', function (ev) { ev.preventDefault(); calculateAgeClean(); });
    window.calculateAge = calculateAgeClean;
    window.calculateAgeStandalone = calculateAgeClean;
    calculateAgeClean();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

/* ===== AGE CALCULATOR FINAL WIDTH + GROUP CARD FIX 20260531-B ===== */
(function () {
  'use strict';

  function isAgePage() {
    return !!document.body && document.body.dataset.page === 'age';
  }

  function important(el, prop, value) {
    if (el && el.style) el.style.setProperty(prop, value, 'important');
  }

  function applyGroupCardStyles(result) {
    if (!result) return;

    result.querySelectorAll('.age-result-group-grid, .age-final-result-grid, .age-result-clean-box').forEach(function (grid) {
      important(grid, 'display', 'grid');
      important(grid, 'grid-template-columns', window.innerWidth <= 1050 ? '1fr' : 'repeat(2, minmax(0, 1fr))');
      important(grid, 'gap', '18px');
      important(grid, 'width', '100%');
      important(grid, 'max-width', '100%');
      important(grid, 'min-width', '0');
      important(grid, 'box-sizing', 'border-box');
    });

    result.querySelectorAll('.age-point-result-box, .age-final-result-shell, .age-result-clean-box').forEach(function (shell) {
      important(shell, 'width', '100%');
      important(shell, 'max-width', '100%');
      important(shell, 'min-width', '0');
      important(shell, 'margin', '0');
      important(shell, 'padding', '0');
      important(shell, 'border', '0');
      important(shell, 'background', 'transparent');
      important(shell, 'box-shadow', 'none');
      important(shell, 'box-sizing', 'border-box');
    });

    result.querySelectorAll('.age-result-group-box, .age-final-group-box, .age-result-clean-section').forEach(function (box) {
      important(box, 'display', 'block');
      important(box, 'min-width', '0');
      important(box, 'height', 'auto');
      important(box, 'padding', '18px');
      important(box, 'border', '1px solid #d8e8e0');
      important(box, 'border-radius', '20px');
      important(box, 'background', '#ffffff');
      important(box, 'box-shadow', '0 8px 20px rgba(38, 58, 51, .065)');
      important(box, 'box-sizing', 'border-box');
      important(box, 'overflow', 'hidden');
    });

    result.querySelectorAll('.age-point-result-list li, .age-final-result-row, .age-result-clean-section li').forEach(function (row) {
      important(row, 'display', 'grid');
      important(row, 'grid-template-columns', window.innerWidth <= 850 ? '1fr' : 'minmax(135px, .42fr) minmax(0, 1fr)');
      important(row, 'gap', window.innerWidth <= 850 ? '4px' : '12px');
      important(row, 'align-items', 'start');
      important(row, 'padding', '10px 0');
      important(row, 'border', '0');
      important(row, 'border-bottom', '1px solid #edf4f1');
      important(row, 'border-radius', '0');
      important(row, 'background', 'transparent');
      important(row, 'box-shadow', 'none');
      important(row, 'box-sizing', 'border-box');
    });
  }

  function syncAgeResultWidth() {
    if (!isAgePage()) return;

    var main = document.querySelector('main.age-calculator-container');
    var calculator = main && main.querySelector(':scope > .calculator');
    var result = document.getElementById('ageReportOutput');
    var instruction = main && main.querySelector(':scope > .instruction-box, :scope > .universal-help-panel');

    if (!main || !calculator || !result) return;

    if (result.parentElement !== main || result.previousElementSibling !== calculator) {
      calculator.insertAdjacentElement('afterend', result);
    }
    if (instruction && instruction.previousElementSibling !== result) {
      result.insertAdjacentElement('afterend', instruction);
    }

    result.classList.add('age-clean-result', 'age-point-output', 'age-final-output');
    result.setAttribute('aria-label', 'Age Calculator result');

    important(calculator, 'grid-column', window.innerWidth <= 850 ? '1' : '2');
    important(calculator, 'grid-row', window.innerWidth <= 850 ? 'auto' : '1');
    important(calculator, 'justify-self', window.innerWidth <= 850 ? 'stretch' : 'start');
    important(calculator, 'box-sizing', 'border-box');

    var width = Math.round(calculator.getBoundingClientRect().width);
    if (!width || width < 260) {
      width = Math.round((calculator.offsetWidth || 0));
    }

    if (window.innerWidth > 850 && width > 0) {
      document.documentElement.style.setProperty('--age-final-calc-width', width + 'px');
      important(result, 'width', width + 'px');
      important(result, 'max-width', width + 'px');
      important(result, 'justify-self', 'start');
      if (instruction) {
        important(instruction, 'width', width + 'px');
        important(instruction, 'max-width', width + 'px');
        important(instruction, 'justify-self', 'start');
      }
    } else {
      document.documentElement.style.setProperty('--age-final-calc-width', '100%');
      important(result, 'width', '100%');
      important(result, 'max-width', '100%');
      important(result, 'justify-self', 'stretch');
      if (instruction) {
        important(instruction, 'width', '100%');
        important(instruction, 'max-width', '100%');
        important(instruction, 'justify-self', 'stretch');
      }
    }

    important(result, 'grid-column', window.innerWidth <= 850 ? '1' : '2');
    important(result, 'grid-row', window.innerWidth <= 850 ? 'auto' : '2');
    important(result, 'min-width', '0');
    important(result, 'box-sizing', 'border-box');
    important(result, 'overflow', 'visible');

    if (!result.hidden && result.innerHTML.trim()) {
      important(result, 'display', 'block');
      important(result, 'visibility', 'visible');
      important(result, 'opacity', '1');
      important(result, 'height', 'auto');
      important(result, 'max-height', 'none');
      important(result, 'margin', '22px 0 0');
      important(result, 'padding', 'clamp(18px, 2.2vw, 28px)');
      important(result, 'border', '1px solid #d7e6df');
      important(result, 'border-radius', '22px');
      important(result, 'background', '#ffffff');
      important(result, 'box-shadow', '0 12px 28px rgba(38, 58, 51, .07)');
    }

    if (instruction) {
      important(instruction, 'grid-column', window.innerWidth <= 850 ? '1' : '2');
      important(instruction, 'grid-row', window.innerWidth <= 850 ? 'auto' : '3');
      important(instruction, 'box-sizing', 'border-box');
    }

    applyGroupCardStyles(result);
  }

  function queueAgeResultFix() {
    syncAgeResultWidth();
    if (window.requestAnimationFrame) requestAnimationFrame(syncAgeResultWidth);
    [60, 160, 350, 800, 1500, 2600, 4200].forEach(function (delay) {
      setTimeout(syncAgeResultWidth, delay);
    });
  }

  function startAgeResultFinalFix() {
    queueAgeResultFix();

    ['input', 'change', 'click'].forEach(function (eventName) {
      document.addEventListener(eventName, function (event) {
        var target = event.target;
        if (!target) return;
        if (target.id === 'ageName' || target.id === 'birthdate' || target.id === 'dateToCalculate' || target.id === 'ageCalculateBtn' || target.closest && target.closest('#ageReportOutput')) {
          queueAgeResultFix();
        }
      }, true);
    });

    window.addEventListener('resize', queueAgeResultFix);
    window.addEventListener('load', queueAgeResultFix);

    if (window.MutationObserver && document.body) {
      new MutationObserver(function (mutations) {
        var shouldRun = false;
        mutations.forEach(function (mutation) {
          if (shouldRun) return;
          if (mutation.target && mutation.target.id === 'ageReportOutput') shouldRun = true;
          Array.prototype.slice.call(mutation.addedNodes || []).forEach(function (node) {
            if (node && node.nodeType === 1 && (node.id === 'ageReportOutput' || (node.matches && node.matches('.age-result-group-box, .age-final-group-box, .age-point-result-box, .age-final-result-shell')) || (node.querySelector && node.querySelector('#ageReportOutput, .age-result-group-box, .age-final-group-box')))) {
              shouldRun = true;
            }
          });
        });
        if (shouldRun) queueAgeResultFix();
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAgeResultFinalFix);
  } else {
    startAgeResultFinalFix();
  }
})();

>>>>>>> f0eaf396efc88dc7334c61564a5ec0a1ead9ff75
>>>>>>> 123113dfc3e81f966cc77132ba18a29f0148c488
