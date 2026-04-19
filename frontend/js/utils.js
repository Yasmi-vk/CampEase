function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

function saveUserSession(user) {
  localStorage.setItem("campeaseUser", JSON.stringify(user));
}

function getUserSession() {
  const user = localStorage.getItem("campeaseUser");
  return user ? JSON.parse(user) : null;
}

function logoutUser() {
  localStorage.removeItem("campeaseUser");
  window.location.href = "login.html";
}

function showMessage(elementId, message, type = "error") {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = message;
  el.className = `message ${type}`;
}

function formatPrice(price, pricingModel) {
  if (pricingModel === "free" || Number(price) === 0) {
    return "Free";
  }
  return `AED ${Number(price).toLocaleString()}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function fetchUnreadNotificationCount() {
  const user = getUserSession();
  if (!user) return 0;

  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${user._id}`);
    const data = await response.json();

    if (!Array.isArray(data)) return 0;

    return data.filter(item => !item.isRead).length;
  } catch (error) {
    return 0;
  }
}

async function updateNotificationBadges() {
  const count = await fetchUnreadNotificationCount();
  document.querySelectorAll(".notification-badge").forEach(badge => {
    if (count > 0) {
      badge.textContent = count > 9 ? "9+" : String(count);
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  });
}