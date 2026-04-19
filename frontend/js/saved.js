requireLogin();

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

      const card = document.createElement("div");
      card.className = "card campsite-card";
      card.innerHTML = `
        <div class="campsite-thumb">Saved Campsite</div>
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

      card.querySelector(".title-md").addEventListener("click", () => {
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