requireLogin();

function getSavedFallbackImage(campsiteName, imageUrls) {
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

async function loadSavedCampsites() {
  const user = getUserSession();
  const savedList = document.getElementById("savedList");

  try {
    const response = await fetch(`${API_BASE_URL}/saved-campsites/user/${user._id}`);
    const data = await response.json();

    savedList.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      savedList.innerHTML = `<div class="empty-state card">No saved campsites yet.</div>`;
      return;
    }

    data.forEach(item => {
      const badgeClass = item.category ? item.category : "default";
      const previewImage = getSavedFallbackImage(item.campsiteName, item.imageUrls);

      const card = document.createElement("div");
      card.className = "card campsite-card";
      card.innerHTML = `
        <div class="campsite-thumb">
          ${
            previewImage
              ? `<img src="${previewImage}" alt="${item.campsiteName || "Saved campsite"}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" onerror="this.parentElement.textContent='Saved Campsite';" />`
              : `Saved Campsite`
          }
        </div>
        <div class="badges">
          <span class="badge ${badgeClass}">${item.category || "camp"}</span>
        </div>
        <div class="row-between">
          <div>
            <h3 class="title-md">${item.campsiteName || "Unnamed campsite"}</h3>
            <div class="meta">${item.emirate || "UAE"}</div>
          </div>
          <div class="price">${formatPrice(item.priceAED, item.pricingModel)}</div>
        </div>
        <button class="btn btn-danger-outline remove-btn" data-campsiteid="${item.campsiteId}">Remove</button>
      `;

      card.addEventListener("click", () => {
        window.location.href = `campsite-details.html?id=${item.campsiteId}`;
      });

      card.querySelector(".remove-btn").addEventListener("click", async (e) => {
        e.stopPropagation();
        await removeSaved(item.campsiteId);
      });

      savedList.appendChild(card);
    });
  } catch (error) {
    savedList.innerHTML = `<div class="empty-state card">Failed to load saved campsites.</div>`;
  }
}

async function removeSaved(campsiteId) {
  const user = getUserSession();

  try {
    await fetch(`${API_BASE_URL}/saved-campsites`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user._id,
        campsiteId
      })
    });

    loadSavedCampsites();
  } catch (error) {
    alert("Failed to remove saved campsite");
  }
}

loadSavedCampsites();
updateNotificationBadges();