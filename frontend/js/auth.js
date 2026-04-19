function requireLogin() {
  const user = getUserSession();
  if (!user) {
    window.location.href = "login.html";
  }
}

function updateUserName(selector) {
  const user = getUserSession();
  const el = document.querySelector(selector);
  if (user && el) {
    el.textContent = user.fullName || "Explorer";
  }
}