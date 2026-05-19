function add(value){
  const display = document.getElementById("display");
  const lastChar = display.value.slice(-1);
  const operators = ["+", "-", "*", "/"];

  if(operators.includes(value) && operators.includes(lastChar)){
    display.value = display.value.slice(0, -1) + value;
  }else{
    display.value += value;
  }
}

function clearDisplay(){
  document.getElementById("display").value = "";
}

function removeLast(){
  const display = document.getElementById("display");
  display.value = display.value.slice(0, -1);
}

function calculate(){
  const display = document.getElementById("display");

  try{
    let expression = display.value;
    let result = eval(expression);

    display.value = result;

    saveHistory(expression, result);
  }catch{
    display.value = "Error";
  }
}

let history = [];

function saveHistory(expression, result){
  const historyList = document.getElementById("historyList");

  if(!historyList) return;

  history.push(expression + " = " + result);

  historyList.innerHTML = "";

  history.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}

function clearHistory(){
  history = [];
  document.getElementById("historyList").innerHTML = "";
}