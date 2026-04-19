requireLogin();
updateUserName("#userName");

let selectedCategory = "";
let filters = {
  emirate: "",
  pricingModel: "",
  seasonal: false,
  permitBased: false,
  weatherEnabled: false,
  parkingAvailable: false
};

async function loadCampsites() {
  const searchValue = document.getElementById("searchInput").value.trim();
  let url = `${API_BASE_URL}/campsites`;
  const params = new URLSearchParams();

  if (selectedCategory) params.append("category", selectedCategory);
  if (searchValue) params.append("q", searchValue);
  if (filters.emirate) params.append("emirate", filters.emirate);
  if (filters.pricingModel) params.append("pricingModel", filters.pricingModel);
  if (filters.seasonal) params.append("seasonal", "true");
  if (filters.permitBased) params.append("permitBased", "true");
  if (filters.weatherEnabled) params.append("weatherEnabled", "true");
  if (filters.parkingAvailable) params.append("parkingAvailable", "true");

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  try {
    const response = await fetch(url);
    const campsites = await response.json();

    const list = document.getElementById("campsiteList");
    list.innerHTML = "";

    if (!Array.isArray(campsites) || campsites.length === 0) {
      list.innerHTML = `<div class="empty-state card">No campsites found.</div>`;
      return;
    }

    campsites.slice(0, 12).forEach(campsite => {
      const badgeClass = campsite.category ? campsite.category : "default";

      const card = document.createElement("div");
      card.className = "card campsite-card";
      card.innerHTML = `
        <div class="campsite-thumb">Campsite Image</div>
        <div class="badges">
          <span class="badge ${badgeClass}">${campsite.category || "camp"}</span>
        </div>
        <div class="row-between">
          <div>
            <h3 class="title-md">${campsite.name}</h3>
            <div class="meta">${campsite.emirate || "UAE"}</div>
          </div>
          <div class="price">${formatPrice(campsite.priceAED, campsite.pricingModel)}</div>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `campsite-details.html?id=${campsite._id}`;
      });

      list.appendChild(card);
    });

    if (Array.isArray(campsites) && campsites.length > 0) {
      loadHomeWeather(campsites[0]);
    }
  } catch (error) {
    document.getElementById("campsiteList").innerHTML =
      `<div class="empty-state card">Failed to load campsites.</div>`;
  }
}

async function loadHomeWeather(featuredCampsite) {
  if (
    !featuredCampsite ||
    !featuredCampsite.weatherEnabled ||
    !featuredCampsite.latitude ||
    !featuredCampsite.longitude
  ) {
    document.getElementById("homeWeatherMeta").textContent = "Weather unavailable";
    return;
  }

  const weather = await fetchWeather(featuredCampsite.latitude, featuredCampsite.longitude);

  if (!weather || !weather.current) {
    document.getElementById("homeWeatherMeta").textContent = "Weather unavailable";
    return;
  }

  const current = weather.current;
  const label = getWeatherLabelFromCode(current.weather_code);
  const icon = getWeatherIcon(current.weather_code);

  document.getElementById("homeWeatherLocation").textContent = featuredCampsite.name;
  document.getElementById("homeWeatherMeta").textContent =
    `${current.temperature_2m}°C • ${current.wind_speed_10m} km/h • ${label}`;
  document.getElementById("homeWeatherIcon").textContent = icon;
}

document.getElementById("searchInput").addEventListener("input", loadCampsites);

document.querySelectorAll("#categoryChips .chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#categoryChips .chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    selectedCategory = chip.dataset.category;
    loadCampsites();
  });
});

const filterModal = document.getElementById("filterModal");

document.getElementById("openFilterBtn").addEventListener("click", () => {
  filterModal.classList.add("show");
});

document.getElementById("closeFilterBtn").addEventListener("click", () => {
  filterModal.classList.remove("show");
});

document.getElementById("applyFiltersBtn").addEventListener("click", () => {
  filters.emirate = document.getElementById("filterEmirate").value;
  filters.pricingModel = document.getElementById("filterPricing").value;
  filters.seasonal = document.getElementById("filterSeasonal").checked;
  filters.permitBased = document.getElementById("filterPermit").checked;
  filters.weatherEnabled = document.getElementById("filterWeather").checked;
  filters.parkingAvailable = document.getElementById("filterParking").checked;

  filterModal.classList.remove("show");
  loadCampsites();
});

document.getElementById("clearFiltersBtn").addEventListener("click", () => {
  document.getElementById("filterEmirate").value = "";
  document.getElementById("filterPricing").value = "";
  document.getElementById("filterSeasonal").checked = false;
  document.getElementById("filterPermit").checked = false;
  document.getElementById("filterWeather").checked = false;
  document.getElementById("filterParking").checked = false;

  filters = {
    emirate: "",
    pricingModel: "",
    seasonal: false,
    permitBased: false,
    weatherEnabled: false,
    parkingAvailable: false
  };

  filterModal.classList.remove("show");
  loadCampsites();
});

loadCampsites();
updateNotificationBadges();