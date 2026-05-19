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
    display.value = eval(display.value);
  }catch{
    display.value = "Error";
  }
}