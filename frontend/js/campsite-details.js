const campsiteId = getQueryParam("id");
let currentCampsite = null;
let isSaved = false;
let currentWeatherData = null;
let selectedForecastDays = [];

// function getDateRangeArray(startDate, endDate) {
//   const dates = [];
//   const current = new Date(startDate);
//   const end = new Date(endDate);

//   while (current <= end) {
//     dates.push(current.toISOString().split("T")[0]);
//     current.setDate(current.getDate() + 1);
//   }

//   return dates;
// }

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

function renderForecastStrip(days) {
  const weatherBox = document.getElementById("weatherBox");

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

async function loadSelectedForecast() {
  const checkIn = document.getElementById("forecastCheckIn").value;
  const checkOut = document.getElementById("forecastCheckOut").value;
  const loadMoreBtn = document.getElementById("loadMoreWeatherBtn");

  if (!checkIn || !checkOut) {
    document.getElementById("weatherBox").innerHTML =
      `<div class="small-text">Select dates to view forecast.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

 const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (diff <= 0) {
    document.getElementById("weatherBox").innerHTML =
        `<div class="small-text">Check-out date must be after check-in date.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
    }

  if (!currentCampsite || !currentCampsite.latitude || !currentCampsite.longitude || !currentCampsite.weatherEnabled) {
    document.getElementById("weatherBox").innerHTML =
      `<div class="small-text">Weather is not available for this campsite.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

  currentWeatherData = await fetchWeather(currentCampsite.latitude, currentCampsite.longitude, 16);

  if (!currentWeatherData || !currentWeatherData.daily) {
    document.getElementById("weatherBox").innerHTML =
      `<div class="small-text">Weather forecast unavailable.</div>`;
    loadMoreBtn.classList.add("hidden");
    return;
  }

    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    selectedForecastDays = buildSelectedForecast(currentWeatherData, checkIn, durationDays);
    renderForecastStrip(selectedForecastDays.slice(0, 5));
    document.getElementById("showForecastBtn").classList.add("hidden");

  if (selectedForecastDays.length > 5) {
    loadMoreBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.add("hidden");
  }
}

function openWeatherModal() {
  const modal = document.getElementById("weatherModal");
  const content = document.getElementById("weatherDetailsContent");

  if (!selectedForecastDays.length) {
    content.innerHTML = `<div class="small-text">No detailed forecast available.</div>`;
    modal.classList.add("show");
    return;
  }

  const remainingDays = selectedForecastDays;
    
  content.innerHTML = `
    <div class="forecast-detail-grid">
      ${remainingDays.map(day => `
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

function closeWeatherModal() {
  document.getElementById("weatherModal").classList.remove("show");
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
document.getElementById("forecastCheckIn").addEventListener("change", () => {
  document.getElementById("showForecastBtn").classList.remove("hidden");
  document.getElementById("loadMoreWeatherBtn").classList.add("hidden");
});

document.getElementById("forecastCheckOut").addEventListener("change", () => {
  document.getElementById("showForecastBtn").classList.remove("hidden");
  document.getElementById("loadMoreWeatherBtn").classList.add("hidden");
});
document.getElementById("showForecastBtn").addEventListener("click", loadSelectedForecast);
document.getElementById("loadMoreWeatherBtn").addEventListener("click", openWeatherModal);
document.getElementById("closeWeatherModalBtn").addEventListener("click", closeWeatherModal);

document.getElementById("planBtn").addEventListener("click", () => {
  alert("Trip planner remains prototype-only.");
});

loadCampsiteDetails();
loadLocation();