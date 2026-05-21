let history = [];
let lastAnswer = 0;

/* ADD VALUE TO DISPLAY */

function add(value) {
  const display = document.getElementById("display");
  if (!display) return;

  const operators = ["+", "-", "*", "/"];
  const lastChar = display.value.slice(-1);

  if (value === "Ans") {
    display.value += lastAnswer;
    return;
  }

  if (value === "%") {
    display.value += "/100";
    return;
  }

  if (operators.includes(value) && operators.includes(lastChar)) {
    display.value = display.value.slice(0, -1) + value;
  } else {
    display.value += value;
  }
}

/* CLEAR DISPLAY */

function clearDisplay() {
  const display = document.getElementById("display");
  if (display) {
    display.value = "";
  }
}

/* REMOVE LAST CHARACTER */

function removeLast() {
  const display = document.getElementById("display");
  if (display) {
    display.value = display.value.slice(0, -1);
  }
}

/* SCIENTIFIC FUNCTIONS */

function addFunction(func) {
  const display = document.getElementById("display");
  if (!display) return;

  if (func === "sin") {
    display.value += "Math.sin(";
  } else if (func === "cos") {
    display.value += "Math.cos(";
  } else if (func === "tan") {
    display.value += "Math.tan(";
  } else if (func === "log") {
    display.value += "Math.log10(";
  } else if (func === "ln") {
    display.value += "Math.log(";
  } else if (func === "sqrt") {
    display.value += "Math.sqrt(";
  }
}

/* POWER BUTTON */

function addPower() {
  const display = document.getElementById("display");
  if (display) {
    display.value += "**";
  }
}

/* AUTO CLOSE BRACKETS */

function closeOpenBrackets(expression) {
  const open = (expression.match(/\(/g) || []).length;
  const close = (expression.match(/\)/g) || []).length;

  return expression + ")".repeat(open - close);
}

/* CALCULATE */

function calculate() {
  const display = document.getElementById("display");
  if (!display) return;

  try {
    let expression = display.value;

    if (expression.trim() === "") {
      return;
    }

    expression = closeOpenBrackets(expression);

    const result = Function('"use strict"; return (' + expression + ')')();

    if (!isFinite(result)) {
      display.value = "Error";
      return;
    }

    display.value = result;
    lastAnswer = result;

    saveHistory(expression, result);

  } catch (error) {
    display.value = "Error";
  }
}

/* HISTORY */

function saveHistory(expression, result) {
  const historyList = document.getElementById("historyList");

  if (!historyList) return;

  history.push(expression + " = " + result);

  historyList.innerHTML = "";

  history.slice().reverse().forEach(function (item) {
    const li = document.createElement("li");
    li.textContent = item;
    historyList.appendChild(li);
  });
}

function clearHistory() {
  history = [];

  const historyList = document.getElementById("historyList");

  if (historyList) {
    historyList.innerHTML = "";
  }
}

/* NAVBAR SCROLL MENU */

window.addEventListener("scroll", function () {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");
  const scrollBtn = document.getElementById("scrollTopBtn");

  if (navbar && menuIcon) {
    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
      menuIcon.classList.add("show");
    } else {
      navbar.classList.remove("scrolled");
      navbar.classList.remove("open");
      menuIcon.classList.remove("show");
    }
  }

  if (scrollBtn) {
    scrollBtn.style.display = window.scrollY > 200 ? "flex" : "none";
  }
});

/* TOGGLE HAMBURGER MENU */

function toggleMenu() {
  const navbar = document.getElementById("navbar");

  if (!navbar) return;

  navbar.classList.toggle("open");

  if (navbar.classList.contains("open")) {
    navbar.classList.remove("scrolled");
  } else {
    navbar.classList.add("scrolled");
  }
}

/* CLOSE MENU WHEN CLICK OUTSIDE */

document.addEventListener("click", function (event) {
  const navbar = document.getElementById("navbar");
  const menuIcon = document.getElementById("menuIcon");

  if (
    navbar &&
    menuIcon &&
    !navbar.contains(event.target) &&
    !menuIcon.contains(event.target)
  ) {
    navbar.classList.remove("open");

    if (window.scrollY > 80) {
      navbar.classList.add("scrolled");
    }
  }
});

/* SCROLL TO TOP */

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* LEFT / RIGHT HAND MODE */

function createHandToggleButton() {
  if (document.getElementById("handToggleBtn")) return;

  const button = document.createElement("button");

  button.id = "handToggleBtn";
  button.type = "button";
  button.innerText = "↔";
  button.title = "Switch left hand / right hand mode";
  button.onclick = toggleHandMode;

  document.body.appendChild(button);
}

function loadHandMode() {
  const savedMode = localStorage.getItem("handMode");

  document.body.classList.remove("left-hand", "right-hand");

  if (savedMode === "left") {
    document.body.classList.add("left-hand");
  } else {
    document.body.classList.add("right-hand");
  }
}

function toggleHandMode() {
  const isLeft = document.body.classList.contains("left-hand");

  document.body.classList.remove("left-hand", "right-hand");

  if (isLeft) {
    document.body.classList.add("right-hand");
    localStorage.setItem("handMode", "right");
  } else {
    document.body.classList.add("left-hand");
    localStorage.setItem("handMode", "left");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  createHandToggleButton();
  loadHandMode();
});
/* KEYBOARD SUPPORT FOR BASIC CALCULATOR */

document.addEventListener("keydown", function (event) {
  const display = document.getElementById("display");

  if (!display) return;

  const key = event.key;

  if (!isNaN(key)) {
    add(key);
    flashButton(key);
    return;
  }

  if (key === ".") {
    add(".");
    flashButton(".");
    return;
  }

  if (key === "+") {
    add("+");
    flashButton("+");
    return;
  }

  if (key === "-") {
    add("-");
    flashButton("−");
    return;
  }

  if (key === "*" || key.toLowerCase() === "x") {
    add("*");
    flashButton("×");
    return;
  }

  if (key === "/") {
    event.preventDefault();
    add("/");
    flashButton("÷");
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
    flashButton("=");
    return;
  }

  if (key === "Backspace") {
    removeLast();
    flashButton("←");
    return;
  }

  if (key === "Delete" || key === "Escape") {
    clearDisplay();
    flashButton("AC");
    return;
  }

  if (key === "^") {
    addPower();
    flashButton("xʸ");
    return;
  }

  if (key.toLowerCase() === "r") {
    addFunction("sqrt");
    flashButton("√");
    return;
  }
});

/* BUTTON FLASH EFFECT */

function flashButton(buttonText) {
  const buttons = document.querySelectorAll(".buttons button");

  buttons.forEach(function (button) {
    if (button.textContent.trim() === buttonText) {
      button.classList.add("keyboard-active");

      setTimeout(function () {
        button.classList.remove("keyboard-active");
      }, 150);
    }
  });
}