requireLogin();

const bookingCampsiteId = getQueryParam("id");
let selectedCampsite = null;

async function loadBookingPreview() {
  try {
    const response = await fetch(`${API_BASE_URL}/campsites/${bookingCampsiteId}`);
    const campsite = await response.json();
    selectedCampsite = campsite;

    document.getElementById("bookingCampName").textContent = campsite.name;
    document.getElementById("bookingCampLocation").textContent = campsite.emirate || "UAE";
    document.getElementById("bookingBasePrice").textContent = formatPrice(campsite.priceAED, campsite.pricingModel);
  } catch (error) {
    showMessage("bookingDetailsMessage", "Failed to load booking details");
  }
}

function calculateDuration() {
  const checkIn = document.getElementById("bookingCheckIn").value;
  const checkOut = document.getElementById("bookingCheckOut").value;

  if (!checkIn || !checkOut) {
    document.getElementById("bookingDuration").value = "";
    return;
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  document.getElementById("bookingDuration").value = diff > 0 ? diff : "";
}

document.getElementById("bookingCheckIn").addEventListener("change", calculateDuration);
document.getElementById("bookingCheckOut").addEventListener("change", calculateDuration);

document.getElementById("bookingForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const adults = Number(document.getElementById("bookingAdults").value);
  const children = Number(document.getElementById("bookingChildren").value);
  const checkInDate = document.getElementById("bookingCheckIn").value;
  const checkOutDate = document.getElementById("bookingCheckOut").value;
  const duration = document.getElementById("bookingDuration").value;
  const specialRequest = document.getElementById("bookingSpecialRequest").value.trim();

  if (!adults || adults < 1 || !checkInDate || !checkOutDate || !duration) {
    showMessage("bookingDetailsMessage", "Please complete all booking details");
    return;
  }

  if (Number(duration) <= 0) {
    showMessage("bookingDetailsMessage", "Check-out date must be after check-in date");
    return;
  }

  const bookingDraft = {
    campsiteId: bookingCampsiteId,
    campsiteName: selectedCampsite?.name || "",
    emirate: selectedCampsite?.emirate || "",
    priceAED: selectedCampsite?.priceAED ?? 0,
    pricingModel: selectedCampsite?.pricingModel || "free",
    adults,
    children,
    guests: adults + children,
    checkInDate,
    checkOutDate,
    duration: Number(duration),
    specialRequest
  };

  localStorage.setItem("campeaseBookingDraft", JSON.stringify(bookingDraft));
  window.location.href = "booking-confirmation.html";
});

loadBookingPreview();