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
  let expression = display.value;

let result = eval(expression);

display.value = result;

saveHistory(expression,result);
}

let history = [];

function saveHistory(expression,result){

  history.push(expression + " = " + result);

  updateHistory();

}

function updateHistory(){

  let list = document.getElementById("historyList");

  list.innerHTML = "";

  history.slice().reverse().forEach(item => {

    let li = document.createElement("li");

    li.textContent = item;

    list.appendChild(li);

  });

}

function clearHistory(){

  history = [];

  updateHistory();

}