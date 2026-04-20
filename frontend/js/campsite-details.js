const campsiteId = getQueryParam("id");
let currentCampsite = null;
let isSaved = false;
let currentWeatherData = null;
let selectedForecastDays = [];

function getBookingDraftDates() {
  const bookingDraft = JSON.parse(localStorage.getItem("campeaseBookingDraft") || "null");
  if (!bookingDraft || !bookingDraft.checkInDate || !bookingDraft.checkOutDate) {
    return null;
  }
  return {
    checkInDate: bookingDraft.checkInDate,
    checkOutDate: bookingDraft.checkOutDate
  };
}

function getDateRangeArray(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function buildSelectedForecast(weatherData, checkInDate, checkOutDate) {
  if (!weatherData || !weatherData.daily) return [];

  const selectedDates = getDateRangeArray(checkInDate, checkOutDate);
  const daily = weatherData.daily;

  return selectedDates
    .map(date => {
      const index = daily.time.indexOf(date);
      if (index === -1) return null;

      return {
        date,
        weather_code: daily.weather_code?.[index],
        temperature_max: daily.temperature_2m_max?.[index],
        temperature_min: daily.temperature_2m_min?.[index],
        precipitation_probability_max: daily.precipitation_probability_max?.[index],
        wind_speed_10m_max: daily.wind_speed_10m_max?.[index]
      };
    })
    .filter(Boolean);
}

function renderSelectedForecastCards(days, targetId) {
  if (!days.length) {
    document.getElementById(targetId).innerHTML =
      `<div class="small-text">Weather forecast will appear here once booking dates are selected.</div>`;
    return;
  }

  document.getElementById(targetId).innerHTML = `
    <div class="selected-forecast-row">
      ${days.map(day => `
        <div class="selected-forecast-card">
          <div class="day-title">${day.date}</div>
          <div class="day-icon">${getWeatherIcon(day.weather_code)}</div>
          <div class="small-text">${getWeatherLabelFromCode(day.weather_code)}</div>
          <div class="small-text"><strong>${day.temperature_max ?? "-"}°</strong> / ${day.temperature_min ?? "-"}°</div>
        </div>
      `).join("")}
    </div>
  `;
}

async function loadCampsiteDetails() {
  if (!campsiteId) {
    document.getElementById("campName").textContent = "Campsite not found";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/campsites/${campsiteId}`);
    const campsite = await response.json();
    currentCampsite = campsite;

    document.getElementById("campName").textContent = campsite.name || "Unnamed campsite";
    document.getElementById("campLocation").textContent = campsite.emirate || "UAE";
    document.getElementById("campDescription").textContent = campsite.description || "No description available.";
    document.getElementById("priceText").textContent = formatPrice(campsite.priceAED, campsite.pricingModel);

    if (campsite.weatherEnabled && campsite.latitude && campsite.longitude) {
      await loadCampsiteWeather(campsite.latitude, campsite.longitude);
    } else {
      document.getElementById("weatherBox").innerHTML =
        `<div class="small-text">Weather is not available for this campsite.</div>`;
    }

    const detailsGrid = document.getElementById("detailsGrid");
    detailsGrid.innerHTML = `
      <div class="info-box"><strong>Category</strong><br><span class="small-text">${campsite.category || "N/A"}</span></div>
      <div class="info-box"><strong>Pricing</strong><br><span class="small-text">${campsite.pricingModel || "N/A"}</span></div>
      <div class="info-box"><strong>Capacity</strong><br><span class="small-text">${campsite.capacity || "N/A"} people</span></div>
      <div class="info-box"><strong>Permit</strong><br><span class="small-text">${campsite.permitBased ? "Required" : "Not Required"}</span></div>
      <div class="info-box"><strong>Parking</strong><br><span class="small-text">${campsite.parkingAvailable ? "Available" : "Not Available"}</span></div>
      <div class="info-box"><strong>Bonfire</strong><br><span class="small-text">${campsite.bonfireAllowed ? "Allowed" : "Not Allowed"}</span></div>
      <div class="info-box"><strong>Pets</strong><br><span class="small-text">${campsite.petsAllowed ? "Allowed" : "Not Allowed"}</span></div>
      <div class="info-box"><strong>Water / Toilet</strong><br><span class="small-text">${campsite.waterAvailable ? "Water" : "No Water"} • ${campsite.toiletAvailable ? "Toilet" : "No Toilet"}</span></div>
    `;

    const amenities = safeArray(campsite.amenities);
    document.getElementById("amenitiesBox").innerHTML = amenities.length
      ? amenities.map(item => `<span class="amenity">${item}</span>`).join("")
      : `<span class="small-text">No amenities listed yet.</span>`;

    const rules = safeArray(campsite.rules);
    const safetyTips = safeArray(campsite.safetyTips);
    const waste = safeArray(campsite.wasteDisposalInstructions);

    document.getElementById("safetyBox").innerHTML = `
      <div class="safety-item">
        <strong>Rules</strong>
        <ul>${rules.map(item => `<li class="small-text">${item}</li>`).join("")}</ul>
      </div>
      <div class="safety-item">
        <strong>Safety Tips</strong>
        <ul>${safetyTips.map(item => `<li class="small-text">${item}</li>`).join("")}</ul>
      </div>
      <div class="safety-item">
        <strong>Waste Disposal</strong>
        <ul>${waste.map(item => `<li class="small-text">${item}</li>`).join("")}</ul>
      </div>
    `;

    const tourBtn = document.getElementById("tourBtn");
    const tourStatusText = document.getElementById("tourStatusText");
    if (campsite.eTourUrl && campsite.eTourUrl.trim()) {
      tourBtn.href = campsite.eTourUrl;
      tourStatusText.textContent = "Interactive preview available";
    } else {
      tourBtn.href = "#";
      tourBtn.addEventListener("click", (e) => {
        e.preventDefault();
        alert("E-tour will be added later.");
      }, { once: true });
      tourStatusText.textContent = "Will be added later";
    }

    await checkIfSaved();
  } catch (error) {
    showMessage("detailsMessage", "Failed to load campsite details");
  }
}

async function loadCampsiteWeather(latitude, longitude) {
  const weatherBox = document.getElementById("weatherBox");
  const loadMoreBtn = document.getElementById("loadMoreWeatherBtn");

  const weather = await fetchWeather(latitude, longitude, 16);
  currentWeatherData = weather;

  if (!weather || !weather.current || !weather.daily) {
    weatherBox.innerHTML = `<div class="small-text">Weather unavailable for this campsite.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  const bookingDates = getBookingDraftDates();

  if (bookingDates) {
    selectedForecastDays = buildSelectedForecast(
      weather,
      bookingDates.checkInDate,
      bookingDates.checkOutDate
    );

    const firstFive = selectedForecastDays.slice(0, 5);
    renderSelectedForecastCards(firstFive, "weatherBox");

    if (selectedForecastDays.length > 5) {
      loadMoreBtn.classList.remove("hidden");
    } else {
      loadMoreBtn.classList.add("hidden");
    }

    return;
  }

  const current = weather.current;
  const daily = weather.daily;
  const currentLabel = getWeatherLabelFromCode(current.weather_code);
  const currentIcon = getWeatherIcon(current.weather_code);

  weatherBox.innerHTML = `
    <div class="row-between" style="margin-bottom: 12px;">
      <div>
        <div class="title-md">${current.temperature_2m}°C</div>
        <div class="small-text">${currentLabel}</div>
      </div>
      <div style="font-size: 28px;">${currentIcon}</div>
    </div>

    <div class="small-text" style="margin-bottom: 12px;">
      Wind Speed: ${current.wind_speed_10m} km/h
    </div>

    <div class="grid-2">
      <div class="info-box">
        <strong>Today</strong><br>
        <span class="small-text">${daily.temperature_2m_max?.[0] ?? "-"}° / ${daily.temperature_2m_min?.[0] ?? "-"}°</span>
      </div>
      <div class="info-box">
        <strong>Tomorrow</strong><br>
        <span class="small-text">${daily.temperature_2m_max?.[1] ?? "-"}° / ${daily.temperature_2m_min?.[1] ?? "-"}°</span>
      </div>
    </div>

    <div class="small-text" style="margin-top: 12px; color: var(--primary); font-weight: bold;">
      Tap to view full forecast
    </div>
  `;

  loadMoreBtn.classList.add("hidden");
}

function openWeatherModal() {
  const modal = document.getElementById("weatherModal");
  const content = document.getElementById("weatherDetailsContent");

  if (selectedForecastDays.length > 5) {
    const remainingDays = selectedForecastDays.slice(5);

    content.innerHTML = `
      <div class="section-label">More Selected-Date Forecast</div>
      <div class="weather-day-list">
        ${remainingDays.map(day => `
          <div class="weather-day-item">
            <div class="weather-day-left">
              <div class="weather-day-icon">${getWeatherIcon(day.weather_code)}</div>
              <div>
                <div class="title-md" style="font-size:14px;">${day.date}</div>
                <div class="small-text">${getWeatherLabelFromCode(day.weather_code)}</div>
              </div>
            </div>
            <div class="small-text">
              <strong>${day.temperature_max ?? "-"}°</strong> / ${day.temperature_min ?? "-"}°
            </div>
          </div>
        `).join("")}
      </div>
    `;

    modal.classList.add("show");
    return;
  }

  if (!currentWeatherData || !currentWeatherData.current || !currentWeatherData.daily) {
    content.innerHTML = `<div class="small-text">Weather details unavailable.</div>`;
    modal.classList.add("show");
    return;
  }

  const current = currentWeatherData.current;
  const daily = currentWeatherData.daily;
  const currentLabel = getWeatherLabelFromCode(current.weather_code);
  const currentIcon = getWeatherIcon(current.weather_code);

  const dayItems = daily.time.map((date, index) => {
    const code = daily.weather_code?.[index];
    const icon = getWeatherIcon(code);
    const label = getWeatherLabelFromCode(code);
    const max = daily.temperature_2m_max?.[index] ?? "-";
    const min = daily.temperature_2m_min?.[index] ?? "-";

    return `
      <div class="weather-day-item">
        <div class="weather-day-left">
          <div class="weather-day-icon">${icon}</div>
          <div>
            <div class="title-md" style="font-size:14px;">${date}</div>
            <div class="small-text">${label}</div>
          </div>
        </div>
        <div class="small-text"><strong>${max}°</strong> / ${min}°</div>
      </div>
    `;
  }).join("");

  content.innerHTML = `
    <div class="weather-main-summary">
      <div class="weather-main-card">
        <div class="row-between">
          <div>
            <div class="title-lg">${current.temperature_2m}°C</div>
            <div class="subtitle">${currentLabel}</div>
          </div>
          <div style="font-size: 34px;">${currentIcon}</div>
        </div>

        <div class="weather-stat-grid">
          <div class="weather-stat-box">
            <strong>Time</strong><br>
            <span class="small-text">${current.time}</span>
          </div>
          <div class="weather-stat-box">
            <strong>Wind</strong><br>
            <span class="small-text">${current.wind_speed_10m} km/h</span>
          </div>
          <div class="weather-stat-box">
            <strong>Timezone</strong><br>
            <span class="small-text">${currentWeatherData.timezone}</span>
          </div>
          <div class="weather-stat-box">
            <strong>Elevation</strong><br>
            <span class="small-text">${currentWeatherData.elevation} m</span>
          </div>
        </div>
      </div>

      <div>
        <div class="section-label">Forecast</div>
        <div class="weather-day-list">
          ${dayItems}
        </div>
      </div>
    </div>
  `;

  modal.classList.add("show");
}

function closeWeatherModal() {
  document.getElementById("weatherModal").classList.remove("show");
}

async function loadLocation() {
  try {
    const response = await fetch(`${API_BASE_URL}/campsites/${campsiteId}/location`);
    const data = await response.json();

    if (!response.ok) {
      document.getElementById("locationText").textContent = "Location unavailable";
      return;
    }

    document.getElementById("locationText").innerHTML = `
      <strong>${data.campsite.name}</strong><br>
      <span class="small-text">${data.campsite.latitude}, ${data.campsite.longitude}</span><br>
      <span class="small-text">${data.campsite.emirate}</span>
    `;

    document.getElementById("locationShortText").textContent =
      `${data.campsite.latitude}, ${data.campsite.longitude}`;

    document.getElementById("mapLink").href = data.campsite.googleMapsUrl;
  } catch (error) {
    document.getElementById("locationText").textContent = "Failed to load location";
  }
}

async function checkIfSaved() {
  const user = getUserSession();
  const saveBtn = document.getElementById("saveBtn");

  if (!user) return;

  try {
    const response = await fetch(`${API_BASE_URL}/saved-campsites/user/${user._id}`);
    const data = await response.json();

    isSaved = Array.isArray(data) && data.some(item => String(item.campsiteId) === String(campsiteId));
    updateSaveButton(saveBtn);
  } catch (error) {
    updateSaveButton(saveBtn);
  }
}

function updateSaveButton(saveBtn) {
  if (isSaved) {
    saveBtn.textContent = "♥";
    saveBtn.classList.add("saved");
  } else {
    saveBtn.textContent = "♡";
    saveBtn.classList.remove("saved");
  }
}

async function saveOrUnsaveCampsite() {
  const user = getUserSession();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    if (isSaved) {
      const response = await fetch(`${API_BASE_URL}/saved-campsites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, campsiteId })
      });

      const data = await response.json();
      if (!response.ok) {
        showMessage("detailsMessage", data.message || "Could not remove campsite");
        return;
      }

      isSaved = false;
      updateSaveButton(document.getElementById("saveBtn"));
      showMessage("detailsMessage", "Campsite removed from saved list", "success");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/saved-campsites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id, campsiteId })
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage("detailsMessage", data.message || "Could not save campsite");
      return;
    }

    isSaved = true;
    updateSaveButton(document.getElementById("saveBtn"));
    showMessage("detailsMessage", "Campsite added successfully", "success");
  } catch (error) {
    showMessage("detailsMessage", "Failed to save campsite");
  }
}

function goToBookingDetails() {
  window.location.href = `booking-details.html?id=${campsiteId}`;
}

document.getElementById("saveBtn").addEventListener("click", saveOrUnsaveCampsite);
document.getElementById("bookBtn").addEventListener("click", goToBookingDetails);
document.getElementById("weatherCard")?.addEventListener("click", openWeatherModal);
document.getElementById("loadMoreWeatherBtn").addEventListener("click", openWeatherModal);
document.getElementById("closeWeatherModalBtn").addEventListener("click", closeWeatherModal);

document.getElementById("planBtn").addEventListener("click", () => {
  alert("Trip planner remains prototype-only.");
});

loadCampsiteDetails();
loadLocation();