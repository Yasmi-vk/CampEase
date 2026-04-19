document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmPassword = document.getElementById("confirmPassword").value.trim();

  if (password !== confirmPassword) {
    showMessage("signupMessage", "Passwords do not match");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ fullName, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("signupMessage", data.message || "Registration failed");
      return;
    }

    showMessage("signupMessage", "Account created successfully", "success");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  } catch (error) {
    showMessage("signupMessage", "Server connection failed");
  }
});