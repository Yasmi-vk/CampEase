requireLogin();

const user = getUserSession();
let allNotifications = [];
let currentType = "all";

function getRelativeTime(dateString) {
  const created = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins || 1}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

async function loadNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${user._id}`);
    const data = await response.json();
    allNotifications = Array.isArray(data) ? data : [];
    renderNotifications();
  } catch (error) {
    document.getElementById("notificationsList").innerHTML =
      `<div class="empty-state card">Failed to load notifications.</div>`;
  }
}

function renderNotifications() {
  const list = document.getElementById("notificationsList");
  list.innerHTML = "";

  let filtered = allNotifications;

  if (currentType !== "all") {
    filtered = allNotifications.filter(item => item.type === currentType);
  }

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state card">No notifications found.</div>`;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card section-card";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <div class="row-between" style="align-items:flex-start;">
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <div style="width:42px; height:42px; border-radius:12px; background:#EAE6DF; display:flex; align-items:center; justify-content:center;">
            ${item.type === "booking" ? "✓" : item.type === "weather" ? "☀" : "📍"}
          </div>
          <div>
            <div class="title-md" style="margin-bottom:6px;">${item.title}</div>
            <div class="subtitle" style="font-size:13px;">${item.message}</div>
            ${item.actionText ? `<div style="margin-top:10px; color:var(--primary); font-size:12px; font-weight:bold;">${item.actionText}</div>` : ""}
          </div>
        </div>
        <div class="small-text">${getRelativeTime(item.createdAt)}</div>
      </div>
    `;

    card.addEventListener("click", async () => {
      if (!item.isRead) {
        await fetch(`${API_BASE_URL}/notifications/${item._id}/read`, {
          method: "PUT"
        });
      }

      if (item.actionUrl) {
        window.location.href = item.actionUrl;
      }
    });

    list.appendChild(card);
  });
}

document.querySelectorAll(".booking-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".booking-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentType = btn.dataset.type;
    renderNotifications();
  });
});

loadNotifications();
updateNotificationBadges();
