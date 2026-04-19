requireLogin();

function fillProfile() {
  const currentUser = getUserSession();
  if (!currentUser) return;

  document.getElementById("profileName").textContent = currentUser.fullName || "Explorer";
  document.getElementById("profileEmail").textContent = currentUser.email || "No email";

  document.getElementById("editFullName").value = currentUser.fullName || "";
  document.getElementById("editEmail").value = currentUser.email || "";
  document.getElementById("editPassword").value = "";
}

fillProfile();
updateNotificationBadges();

document.getElementById("logoutBtn").addEventListener("click", logoutUser);

document.getElementById("editProfileBtn").addEventListener("click", () => {
  document.getElementById("editProfileCard").classList.remove("hidden");
});

document.getElementById("closeEditBtn").addEventListener("click", () => {
  document.getElementById("editProfileCard").classList.add("hidden");
});

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentUser = getUserSession();
  const fullName = document.getElementById("editFullName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const password = document.getElementById("editPassword").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/users/${currentUser._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName,
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage("profileMessage", data.message || "Failed to update profile");
      return;
    }

    saveUserSession(data.user);
    fillProfile();
    showMessage("profileMessage", "Profile updated successfully", "success");

    setTimeout(() => {
      document.getElementById("editProfileCard").classList.add("hidden");
    }, 900);
  } catch (error) {
    showMessage("profileMessage", "Failed to update profile");
  }
});

const helpModal = document.getElementById("helpModal");
const aboutModal = document.getElementById("aboutModal");
const planTripModal = document.getElementById("planTripModal");

document.getElementById("planTripCard").addEventListener("click", () => {
  planTripModal.classList.add("show");
});

document.getElementById("closePlanTripModalBtn").addEventListener("click", () => {
  planTripModal.classList.remove("show");
});

document.getElementById("openHelpCentreBtn").addEventListener("click", () => {
  helpModal.classList.add("show");
});

document.getElementById("closeHelpModalBtn").addEventListener("click", () => {
  helpModal.classList.remove("show");
});

document.getElementById("openAboutBtn").addEventListener("click", () => {
  aboutModal.classList.add("show");
});

document.getElementById("closeAboutModalBtn").addEventListener("click", () => {
  aboutModal.classList.remove("show");
});