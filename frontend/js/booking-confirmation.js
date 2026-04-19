requireLogin();

const bookingDraft = JSON.parse(localStorage.getItem("campeaseBookingDraft") || "null");

function fillBookingConfirmation() {
  if (!bookingDraft) {
    document.getElementById("confirmCampsiteName").textContent = "No booking details found";
    return;
  }

  document.getElementById("confirmCampsiteName").textContent = bookingDraft.campsiteName || "Selected Campsite";
  document.getElementById("confirmCampsiteLocation").textContent = bookingDraft.emirate || "UAE";
  document.getElementById("confirmCheckIn").textContent = bookingDraft.checkInDate;
  document.getElementById("confirmCheckOut").textContent = bookingDraft.checkOutDate;
  document.getElementById("confirmDuration").textContent = `${bookingDraft.duration} day(s)`;
  document.getElementById("confirmGuests").textContent = `${bookingDraft.guests} people`;
  document.getElementById("confirmSpecialRequest").textContent = bookingDraft.specialRequest || "None";
  document.getElementById("confirmPrice").textContent = formatPrice(bookingDraft.priceAED, bookingDraft.pricingModel);
}

async function createBookingNotification(userId, campsiteName, emirate) {
  try {
    await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId,
        type: "booking",
        title: "Your booking is confirmed",
        message: `Your booking at ${campsiteName} in ${emirate} has been confirmed.`,
        actionText: "View Booking",
        actionUrl: "bookings.html"
      })
    });
  } catch (error) {
    console.error("Failed to create booking notification");
  }
}

async function confirmBooking() {
  const user = getUserSession();

  if (!bookingDraft) {
    showMessage("confirmationMessage", "Booking details are missing");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user._id,
        campsiteId: bookingDraft.campsiteId,
        checkInDate: bookingDraft.checkInDate,
        checkOutDate: bookingDraft.checkOutDate,
        guests: bookingDraft.guests,
        specialRequest: bookingDraft.specialRequest
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("confirmationMessage", data.message || "Booking failed");
      return;
    }

    await createBookingNotification(user._id, bookingDraft.campsiteName, bookingDraft.emirate || "UAE");

    localStorage.removeItem("campeaseBookingDraft");
    window.location.href = `bookings.html`;
  } catch (error) {
    showMessage("confirmationMessage", "Failed to confirm booking");
  }
}

document.getElementById("confirmBookingBtn").addEventListener("click", confirmBooking);

fillBookingConfirmation();