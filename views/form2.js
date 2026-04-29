const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

loginTab.onclick = () => {
  loginForm.classList.add("active");
  registerForm.classList.remove("active");
  loginTab.classList.add("active");
  registerTab.classList.remove("active");
};

registerTab.onclick = () => {
  registerForm.classList.add("active");
  loginForm.classList.remove("active");
  registerTab.classList.add("active");
  loginTab.classList.remove("active");
};

/* LOGIN */
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  if (!username || !password) {
    loginError.textContent = "Fill all fields";
    return;
  }

  console.log("Login:", { username, password });
});

/* REGISTER */
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  let role = roleInput.value.toLowerCase();

  if (role !== "author" && role !== "reader") {
    registerError.textContent = "Invalid role";
    return;
  }

  console.log("Register success");
});