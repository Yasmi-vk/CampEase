requireLogin();

const bookingId = getQueryParam("bookingId");

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

async function loadBookingView() {
  const user = getUserSession();

  if (!bookingId) {
    document.getElementById("viewBookingMessage").innerHTML =
      `<div class="message error">Booking not found.</div>`;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/bookings/user/${user._id}`);
    const bookings = await response.json();

    if (!Array.isArray(bookings)) {
      throw new Error("Invalid bookings response");
    }

    const booking = bookings.find(item => String(item._id) === String(bookingId));

    if (!booking) {
      document.getElementById("viewBookingMessage").innerHTML =
        `<div class="message error">Booking not found.</div>`;
      return;
    }

    document.getElementById("viewBookingName").textContent = booking.campsiteName || "Booked Campsite";
    document.getElementById("viewBookingLocation").textContent = booking.emirate || "UAE";
    document.getElementById("viewCheckIn").textContent = booking.checkInDate || "-";
    document.getElementById("viewCheckOut").textContent = booking.checkOutDate || "-";
    document.getElementById("viewDuration").textContent = `${booking.nights || 0} day(s)`;
    document.getElementById("viewGuests").textContent =
      `${booking.adults ?? 1} adult(s), ${booking.children ?? 0} child(ren)`;
    document.getElementById("viewSpecialRequest").textContent = booking.specialRequest || "None";
    document.getElementById("viewPrice").textContent = formatPrice(booking.priceAED, booking.pricingModel);

    const isCancelled = booking.status === "cancelled";
    document.getElementById("viewBookingStatus").textContent = isCancelled ? "❌ Cancelled" : "✅ Confirmed";

    const imageBox = document.getElementById("viewBookingImage");
    const previewImage = getBookingFallbackImage(booking.campsiteName, booking.imageUrls);

    if (previewImage) {
      imageBox.innerHTML = `
        <img
          src="${previewImage}"
          alt="${booking.campsiteName}"
          style="width:100%;height:100%;object-fit:cover;border-radius:14px;"
          onerror="this.parentElement.textContent='Booking Image';"
        />
      `;
    } else {
      imageBox.textContent = "Booking Image";
    }
  } catch (error) {
    document.getElementById("viewBookingMessage").innerHTML =
      `<div class="message error">Failed to load booking details.</div>`;
  }
}

loadBookingView();
updateNotificationBadges();