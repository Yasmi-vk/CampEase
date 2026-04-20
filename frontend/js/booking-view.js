requireLogin();

const bookingId = getQueryParam("bookingId");

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
    if (booking.imageUrls && booking.imageUrls.length > 0) {
      imageBox.innerHTML = `
        <img src="${booking.imageUrls[0]}" alt="${booking.campsiteName}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" />
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