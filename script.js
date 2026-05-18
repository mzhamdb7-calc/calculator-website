function add(value){
  document.getElementById("display").value += value;
}

function calculate(){
  let result = eval(document.getElementById("display").value);
  document.getElementById("display").value = result;
}