requireLogin();

const bookingCampsiteId = getQueryParam("id");
let selectedCampsite = null;
let bookingWeatherData = null;
let bookingSelectedForecastDays = [];

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

async function loadBookingPreview() {
  try {
    const response = await fetch(`${API_BASE_URL}/campsites/${bookingCampsiteId}`);
    const campsite = await response.json();
    selectedCampsite = campsite;

    document.getElementById("bookingCampName").textContent = campsite.name;
    document.getElementById("bookingCampLocation").textContent = campsite.emirate || "UAE";
    document.getElementById("bookingBasePrice").textContent = formatPrice(campsite.priceAED, campsite.pricingModel);

    const bookingImageBox = document.querySelector(".booking-card-image");
    const previewImage = getBookingFallbackImage(campsite.name, campsite.imageUrls);

    if (bookingImageBox) {
      if (previewImage) {
        bookingImageBox.innerHTML = `
          <img
            src="${previewImage}"
            alt="${campsite.name}"
            style="width:100%;height:100%;object-fit:cover;border-radius:14px;"
            onerror="this.parentElement.textContent='Selected Campsite Image';"
          />
        `;
      } else {
        bookingImageBox.textContent = "Selected Campsite Image";
      }
    }
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
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  document.getElementById("bookingDuration").value = diff > 0 ? diff : "";
}

function formatDayLabel(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function buildSelectedForecast(weatherData, checkInDate, durationDays) {
  if (!weatherData || !weatherData.daily) return [];

  const daily = weatherData.daily;
  const startIndex = daily.time.indexOf(checkInDate);

  if (startIndex === -1) return [];

  return daily.time
    .slice(startIndex, startIndex + durationDays)
    .map((date, offset) => {
      const index = startIndex + offset;

      return {
        date,
        weather_code: daily.weather_code?.[index],
        temperature_max: daily.temperature_2m_max?.[index],
        temperature_min: daily.temperature_2m_min?.[index],
        precipitation_probability_max: daily.precipitation_probability_max?.[index],
        wind_speed_10m_max: daily.wind_speed_10m_max?.[index]
      };
    });
}

function renderBookingForecastStrip(days) {
  const weatherBox = document.getElementById("bookingWeatherBox");

  if (!days.length) {
    weatherBox.innerHTML = `<div class="small-text">No forecast found for the selected dates.</div>`;
    return;
  }

  weatherBox.innerHTML = `
    <div class="selected-forecast-strip">
      ${days.map(day => `
        <div class="selected-forecast-item">
          <div class="day-name">${formatDayLabel(day.date)}</div>
          <div class="day-icon">${getWeatherIcon(day.weather_code)}</div>
          <div class="day-temp"><strong>${day.temperature_max ?? "-"}°</strong> ${day.temperature_min ?? "-"}°</div>
          <div class="day-sub">${getWeatherLabelFromCode(day.weather_code)}</div>
        </div>
      `).join("")}
    </div>
  `;
}

async function loadBookingWeatherPreview() {
  const weatherBox = document.getElementById("bookingWeatherBox");
  const loadMoreBtn = document.getElementById("bookingLoadMoreWeatherBtn");

  if (!selectedCampsite || !selectedCampsite.latitude || !selectedCampsite.longitude || !selectedCampsite.weatherEnabled) {
    weatherBox.innerHTML = `<div class="small-text">Weather is not available for this campsite.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  const checkIn = document.getElementById("bookingCheckIn").value;
  const checkOut = document.getElementById("bookingCheckOut").value;

  if (!checkIn || !checkOut) {
    weatherBox.innerHTML = `<div class="small-text">Select your dates to view the forecast.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (diff <= 0) {
    weatherBox.innerHTML = `<div class="small-text">Check-out date must be after check-in date.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  bookingWeatherData = await fetchWeather(selectedCampsite.latitude, selectedCampsite.longitude, 16);

  if (!bookingWeatherData || !bookingWeatherData.daily) {
    weatherBox.innerHTML = `<div class="small-text">Weather forecast unavailable.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  const durationDays = Number(document.getElementById("bookingDuration").value);

  bookingSelectedForecastDays = buildSelectedForecast(
    bookingWeatherData,
    checkIn,
    durationDays
  );

  renderBookingForecastStrip(bookingSelectedForecastDays.slice(0, 5));

  if (bookingSelectedForecastDays.length > 5) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }
}

function openBookingWeatherModal() {
  const modal = document.getElementById("bookingWeatherModal");
  const content = document.getElementById("bookingWeatherDetailsContent");

  if (!bookingSelectedForecastDays.length) {
    content.innerHTML = `<div class="small-text">No detailed forecast available.</div>`;
    modal.classList.add("show");
    return;
  }

  content.innerHTML = `
    <div class="forecast-detail-grid">
      ${bookingSelectedForecastDays.map(day => `
        <div class="forecast-detail-card">
          <div class="row-between" style="margin-bottom: 10px;">
            <div>
              <div class="title-md">${day.date}</div>
              <div class="small-text">${getWeatherLabelFromCode(day.weather_code)}</div>
            </div>
            <div style="font-size: 28px;">${getWeatherIcon(day.weather_code)}</div>
          </div>

          <div class="grid-2">
            <div class="info-box">
              <strong>Temperature</strong><br>
              <span class="small-text">${day.temperature_max ?? "-"}° / ${day.temperature_min ?? "-"}°</span>
            </div>
            <div class="info-box">
              <strong>Wind</strong><br>
              <span class="small-text">${day.wind_speed_10m_max ?? "-"} km/h</span>
            </div>
            <div class="info-box">
              <strong>Rain Chance</strong><br>
              <span class="small-text">${day.precipitation_probability_max ?? "-"}%</span>
            </div>
            <div class="info-box">
              <strong>Condition</strong><br>
              <span class="small-text">${getWeatherLabelFromCode(day.weather_code)}</span>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  modal.classList.add("show");
}

function closeBookingWeatherModal() {
  document.getElementById("bookingWeatherModal").classList.remove("show");
}

document.getElementById("bookingCheckIn").addEventListener("change", async () => {
  calculateDuration();
  await loadBookingWeatherPreview();
});

document.getElementById("bookingCheckOut").addEventListener("change", async () => {
  calculateDuration();
  await loadBookingWeatherPreview();
});

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

document.getElementById("bookingLoadMoreWeatherBtn").addEventListener("click", openBookingWeatherModal);
document.getElementById("closeBookingWeatherModalBtn").addEventListener("click", closeBookingWeatherModal);

loadBookingPreview();