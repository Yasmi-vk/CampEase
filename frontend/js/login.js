document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("loginMessage", data.message || "Login failed");
      return;
    }

    saveUserSession(data.user);
    showMessage("loginMessage", "Login successful", "success");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 800);
  } catch (error) {
    showMessage("loginMessage", "Server connection failed");
  }
});