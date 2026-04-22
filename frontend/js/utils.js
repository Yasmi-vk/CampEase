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

function getFallbackETourImages(campsiteName) {
  if (!campsiteName) {
    return [
      "/etour/default/1.jpg",
      "/etour/default/2.jpg",
      "/etour/default/3.jpg",
      "/etour/default/4.jpg",
      "/etour/default/5.jpg"
    ];
  }

  const name = campsiteName.toLowerCase();

  if (name.includes("qudra")) {
    return [
      "/etour/alqudra/1.jpg",
      "/etour/alqudra/2.jpg",
      "/etour/alqudra/3.jpg",
      "/etour/alqudra/4.jpg",
      "/etour/alqudra/5.jpg"
    ];
  }

  if (name.includes("dibba")) {
    return [
      "/etour/dibba/1.jpg",
      "/etour/dibba/2.jpg",
      "/etour/dibba/3.jpg",
      "/etour/dibba/4.jpg",
      "/etour/dibba/5.jpg"
    ];
  }

  if (name.includes("hatta")) {
    return [
      "/etour/hatta/1.jpg",
      "/etour/hatta/2.jpg",
      "/etour/hatta/3.jpg",
      "/etour/hatta/4.jpg",
      "/etour/hatta/5.jpg"
    ];
  }

  if (name.includes("wadi shees") || name.includes("wadishees") || name.includes("shees")) {
    return [
      "/etour/wadishees/1.jpg",
      "/etour/wadishees/2.jpg",
      "/etour/wadishees/3.jpg",
      "/etour/wadishees/4.jpg",
      "/etour/wadishees/5.jpg"
    ];
  }

  if (name.includes("jebel jais") || name.includes("jebeljais") || name.includes("jais")) {
    return [
      "/etour/jebeljais/1.jpg",
      "/etour/jebeljais/2.jpg",
      "/etour/jebeljais/3.jpg",
      "/etour/jebeljais/4.jpg",
      "/etour/jebeljais/5.jpg"
    ];
  }

  return [
    "/etour/default/1.jpg",
    "/etour/default/2.jpg",
    "/etour/default/3.jpg",
    "/etour/default/4.jpg",
    "/etour/default/5.jpg"
  ];
}

function getPrimaryCampsiteImage(campsite) {
  if (Array.isArray(campsite?.imageUrls) && campsite.imageUrls.length > 0) {
    return campsite.imageUrls[0];
  }

  const fallbackImages = getFallbackETourImages(campsite?.name || "");
  return fallbackImages.length ? `${STATIC_BASE_URL}${fallbackImages[0]}` : null;
}

function getCampsiteImageSet(campsite) {
  if (Array.isArray(campsite?.imageUrls) && campsite.imageUrls.length > 0) {
    return campsite.imageUrls;
  }

  return getFallbackETourImages(campsite?.name || "").map(path => `${STATIC_BASE_URL}${path}`);
}