// ===============================
// Account Settings JavaScript
// ===============================

const API_BASE = "http://127.0.0.1:8000";
let USER_EMAIL = localStorage.getItem("user_email");

// ===============================
// Page Load
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    if (!USER_EMAIL) {
        window.location.href = "../login/signin.html";
        return;
    }

    const saveButton = document.querySelector(".save-changes-btn");

    // ===============================
    // LOAD ACCOUNT SETTINGS
    // ===============================
    fetch(`${API_BASE}/api/account-settings/${USER_EMAIL}`)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            document.querySelector('input[type="text"]').value = data.profile?.name || "";
            document.querySelector('textarea').value = data.profile?.bio || "";
            document.querySelector('input[type="email"]').value = data.profile?.email || "";

            const selects = document.querySelectorAll("select");
            selects[0].value = data.preferences?.timezone || "Asia/Kolkata (IST)";
            selects[1].value = data.preferences?.date_format || "DD/MM/YYYY";
            selects[2].value = data.preferences?.language || "English";

            document.getElementById("weekly-report").checked = !!data.notifications?.weekly_report;
            document.getElementById("traffic-alert").checked = !!data.notifications?.traffic_alert;
            document.getElementById("country-alert").checked = !!data.notifications?.country_alert;

            document.querySelector(".api-key-code").textContent =
                data.api?.api_key || "Not generated";

            if (data.profile?.avatar) {
                const profilePic = document.querySelector(".profile-picture");
                profilePic.style.backgroundImage = `url(${data.profile.avatar})`;
                profilePic.style.backgroundSize = "cover";
                profilePic.style.backgroundPosition = "center";
                profilePic.textContent = "";
            }

        })
        .catch(() => showError("Failed to load account settings"));

    // ===============================
    // SAVE CHANGES
    // ===============================
    
    saveButton.addEventListener("click", async () => {

        if (!validateForm()) return;

        const newEmail = document.querySelector('input[type="email"]').value;

        const payload = {
            profile: {
                name: document.querySelector('input[type="text"]').value,
                bio: document.querySelector("textarea").value,
                email: newEmail
            },
            preferences: {
                timezone: document.querySelectorAll("select")[0].value,
                date_format: document.querySelectorAll("select")[1].value,
                language: document.querySelectorAll("select")[2].value
            },
            notifications: {
                weekly_report: document.getElementById("weekly-report").checked,
                traffic_alert: document.getElementById("traffic-alert").checked,
                country_alert: document.getElementById("country-alert").checked
            }
        };

        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        const res = await fetch(`${API_BASE}/api/account-settings/${USER_EMAIL}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";

        if (res.ok) {
            // 🔥 IMPORTANT FIX
            if (newEmail !== USER_EMAIL) {
                USER_EMAIL = newEmail;
                localStorage.setItem("user_email", newEmail);
            }
            showSuccess("Settings saved successfully!");
        } else {
            showError("Failed to save settings");
        }
    });

    initializeProfilePicture();
    initializeAPIKey();
    initializeDangerZone();
    initializeNotifications();
});

// ===============================
// Profile Picture
// ===============================
function initializeProfilePicture() {
  const uploadButton = document.querySelector(".profile-picture-upload");

  if (!uploadButton) return;

  uploadButton.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async e => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        showError("Image must be less than 2MB");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(
          `${API_BASE}/api/account-settings/${USER_EMAIL}/avatar`,
          {
            method: "POST",
            body: formData
          }
        );

        if (!res.ok) throw new Error();

        const data = await res.json();

        const profilePic = document.querySelector(".profile-picture");
        profilePic.style.backgroundImage = `url(${data.avatar})`;
        profilePic.style.backgroundSize = "cover";
        profilePic.textContent = "";

        showSuccess("Profile picture updated!");
      } catch {
        showError("Failed to upload image");
      }
    };

    input.click();
  });
}


// ===============================
// API Key
// ===============================
function initializeAPIKey() {
    const regen = document.querySelector(".regenerate-api-key");
    if (!regen) return;

    regen.addEventListener("click", async () => {
        if (!confirm("Regenerate API key?")) return;

        const res = await fetch(
            `${API_BASE}/api/account-settings/${USER_EMAIL}/api-key`,
            { method: "POST" }
        );

        const data = await res.json();
        document.querySelector(".api-key-code").textContent = data.api_key;
        showSuccess("API key regenerated");
    });
}

// ===============================
// Danger Zone
// ===============================
function initializeDangerZone() {
    const del = document.querySelector(".delete-account-btn");
    if (!del) return;

    del.addEventListener("click", async () => {
        if (prompt('Type "DELETE"') !== "DELETE") return;

        await fetch(`${API_BASE}/api/account-settings/${USER_EMAIL}`, {
            method: "DELETE"
        });

        localStorage.clear();
        window.location.href = "../login/signin.html";
    });
}

// ===============================
// Notifications
// ===============================
function initializeNotifications() {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener("change", () => {
            console.log(cb.id, cb.checked);
        });
    });
}

// ===============================
// Helpers
// ===============================
function showSuccess(msg) { alert(msg); }
function showError(msg) { alert(msg); }

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm() {
    const name = document.querySelector('input[type="text"]').value.trim();
    const email = document.querySelector('input[type="email"]').value.trim();

    if (!name) return showError("Name required"), false;
    if (!validateEmail(email)) return showError("Invalid email"), false;

    return true;
}


