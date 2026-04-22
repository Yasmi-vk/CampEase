requireLogin();

let currentTab = "active";
let pendingCancelBookingId = null;

function getBookingFallbackImage(campsiteName, imageUrls) {
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    return imageUrls[0];
  }

  const name = (campsiteName || "").toLowerCase();

  if (name.includes("qudra")) return `${STATIC_BASE_URL}/etour/alqudra/1.jpg`;
  if (name.includes("dibba")) return `${STATIC_BASE_URL}/etour/dibba/1.jpg`;
  if (name.includes("hatta")) return `${STATIC_BASE_URL}/etour/hatta/1.jpg`;
  if (name.includes("wadi shees") || name.includes("wadishees") || name.includes("shees")) return `${STATIC_BASE_URL}/etour/wadishees/1.jpg`;
  if (name.includes("jebel jais") || name.includes("jebeljais") || name.includes("jais")) return `${STATIC_BASE_URL}/etour/jebeljais/1.jpg`;

  return `${STATIC_BASE_URL}/etour/default/1.jpg`;
}

async function loadBookings() {
  const user = getUserSession();
  const container = document.getElementById("bookingsContainer");

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/user/${user._id}`);
    const data = await response.json();

    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<div class="empty-state card">No bookings found yet.</div>`;
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = data.filter(item => {
      const bookingEndDate = new Date(item.checkOutDate);
      bookingEndDate.setHours(0, 0, 0, 0);

      const isPastBooking = bookingEndDate < today;
      const isCancelled = item.status === "cancelled";

      if (currentTab === "active") {
        return !isPastBooking && !isCancelled;
      }

      return isPastBooking || isCancelled;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-state card">No ${currentTab} bookings found.</div>`;
      return;
    }

    filtered.forEach(item => {
      const statusText = item.status === "cancelled" ? "Cancelled" : "Confirmed";
      const statusIcon = item.status === "cancelled" ? "❌" : "✅";
      const imageUrl = getBookingFallbackImage(item.campsiteName, item.imageUrls);

      const card = document.createElement("div");
      card.className = "card campsite-card";
      card.innerHTML = `
        <div class="campsite-thumb">
          ${
            imageUrl
              ? `<img src="${imageUrl}" alt="${item.campsiteName}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" onerror="this.parentElement.textContent='Booking Image';" />`
              : `Booking Image`
          }
        </div>

        <div class="row-between" style="margin-bottom: 10px;">
          <div class="title-md">${item.campsiteName || "Booked Campsite"}</div>
          <span class="status-pill">${statusIcon} ${statusText}</span>
        </div>

        <div class="row">
          <button class="btn btn-outline view-booking-btn" data-id="${item._id}" style="margin-top:0;">View Details</button>
          ${
            currentTab === "active"
              ? `<button class="btn btn-danger-outline cancel-booking-btn" data-id="${item._id}" style="margin-top:0;">Cancel Booking</button>`
              : ``
          }
        </div>
      `;

      card.querySelector(".view-booking-btn").addEventListener("click", () => {
        window.location.href = `booking-view.html?bookingId=${item._id}`;
      });

      const cancelBtn = card.querySelector(".cancel-booking-btn");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          openCancelBookingModal(item._id);
        });
      }

      container.appendChild(card);
    });
  } catch (error) {
    container.innerHTML = `<div class="empty-state card">Failed to load bookings.</div>`;
  }
}

function openCancelBookingModal(bookingId) {
  pendingCancelBookingId = bookingId;
  document.getElementById("cancelBookingMessage").innerHTML = "";
  document.getElementById("cancelBookingModal").classList.add("show");
}

function closeCancelBookingModal() {
  pendingCancelBookingId = null;
  document.getElementById("cancelBookingModal").classList.remove("show");
  document.getElementById("cancelBookingMessage").innerHTML = "";
}

async function cancelBookingConfirmed() {
  if (!pendingCancelBookingId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${pendingCancelBookingId}/cancel`, {
      method: "PUT"
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("cancelBookingMessage", data.message || "Failed to cancel booking");
      return;
    }

    const user = getUserSession();

    await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user._id,
        type: "booking",
        title: "Booking cancelled",
        message: "Your campsite booking has been cancelled successfully.",
        actionText: "View Booking",
        actionUrl: `booking-view.html?bookingId=${pendingCancelBookingId}`
      })
    });

    showMessage("cancelBookingMessage", "Booking cancelled successfully", "success");

    setTimeout(() => {
      closeCancelBookingModal();
      loadBookings();
    }, 700);
  } catch (error) {
    showMessage("cancelBookingMessage", "Failed to cancel booking");
  }
}

document.getElementById("activeTabBtn").addEventListener("click", () => {
  currentTab = "active";
  document.getElementById("activeTabBtn").classList.add("active");
  document.getElementById("historyTabBtn").classList.remove("active");
  loadBookings();
});

document.getElementById("historyTabBtn").addEventListener("click", () => {
  currentTab = "history";
  document.getElementById("historyTabBtn").classList.add("active");
  document.getElementById("activeTabBtn").classList.remove("active");
  loadBookings();
});

document.getElementById("closeCancelBookingModalBtn").addEventListener("click", closeCancelBookingModal);
document.getElementById("keepBookingBtn").addEventListener("click", closeCancelBookingModal);
document.getElementById("confirmCancelBookingBtn").addEventListener("click", cancelBookingConfirmed);

loadBookings();
updateNotificationBadges();