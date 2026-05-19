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

  const historyList = document.getElementById("historyList");

  if(historyList){
    historyList.innerHTML = "";
  }
}

function toggleMenu(){

  const navbar = document.getElementById("navbar");

  navbar.classList.toggle("open");

}

document.addEventListener("click", function(event){

  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if(
    navbar &&
    menuIcon &&
    !navbar.contains(event.target) &&
    !menuIcon.contains(event.target)
  ){
    navbar.classList.remove("open");
  }

});

function addFunction(func){
  const display = document.getElementById("display");

  if(func === "sin"){
    display.value += "Math.sin(";
  }

  if(func === "cos"){
    display.value += "Math.cos(";
  }

  if(func === "tan"){
    display.value += "Math.tan(";
  }

  if(func === "log"){
    display.value += "Math.log10(";
  }

  if(func === "ln"){
    display.value += "Math.log(";
  }

  if(func === "sqrt"){
    display.value += "Math.sqrt(";
  }
}

function addPower(){
  const display = document.getElementById("display");
  display.value += "**";
}