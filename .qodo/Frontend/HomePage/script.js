document.addEventListener("DOMContentLoaded", () => {
  console.log("HomePage script loaded");

  /* =========================
     COPY LINK
  ========================= */
  function copyLink() {
    const link = "yourapp.com/r/U-John-Doe";
    navigator.clipboard.writeText(link).then(() => {
      alert("Link copied to clipboard!");
    });
  }
  window.copyLink = copyLink;

  /* =========================
     SMOOTH SCROLL
  ========================= */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  /* =========================
     EDIT HUB MODAL
  ========================= */
  const editModal = document.getElementById("editModal");
  const modalTrack = document.getElementById("modalTrack");

  window.openEditModal = function () {
    editModal.classList.add("active");
  };

  window.closeEditModal = function () {
    editModal.classList.remove("active");
    modalTrack.style.transform = "translateX(0)";
  };

  window.openAddRule = function () {
    modalTrack.style.transform = "translateX(-50%)";
  };

  window.goBackToHub = function () {
    modalTrack.style.transform = "translateX(0)";
  };

  /* =========================
     LOAD USER STATS
  ========================= */
  async function loadStats() {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.email) {
      console.warn("Not logged in");
      return;
    }

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/my-stats?email=${encodeURIComponent(
          user.email
        )}`
      );

      if (!res.ok) {
        throw new Error("Stats API failed");
      }

      const data = await res.json();

      const hubsEl = document.getElementById("totalHubs");
      const linksEl = document.getElementById("totalLinks");

      if (hubsEl) hubsEl.textContent = data.total_hubs;
      if (linksEl) linksEl.textContent = data.total_links;

      console.log("Stats loaded:", data);
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  }

  loadProfileInfo();
  loadStats();
  loadPhoneLinks();

  /* =========================
   PROFILE SHARE BUTTON
  ========================= */
  const profileShareBtn = document.getElementById("profileShareBtn");

  if (profileShareBtn) {
    profileShareBtn.addEventListener("click", openShareModal);
  }

  /* =========================
     LOGOUT BUTTON
  ========================= */
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "../login/signin.html";
    });
  }

  /* =========================
     LOAD CREATE-HUB POPUP
  ========================= */
  fetch("../Popup/index.html")
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const modal = doc.querySelector("#createHubModal");

      if (modal) {
        document.getElementById("modalContainer").appendChild(modal);

        const popupScript = document.createElement("script");
        popupScript.src = "../Popup/script.js";
        document.body.appendChild(popupScript);

        popupScript.onload = function () {
          console.log("Popup script loaded");

          setTimeout(function () {
            const btn = document.getElementById("createHubBtn");

            if (btn) {
              btn.addEventListener("click", function (e) {
                e.preventDefault();
                console.log("Create Hub button clicked");

                const sidebar = document.querySelector('.sidebar');
                const overlay = document.querySelector('.sidebar-overlay');
                sidebar?.classList.remove('active');
                overlay?.classList.remove('active');

                if (window.openHubModal) {
                  window.openHubModal();
                } else {
                  console.error("openHubModal not found");
                }
              });

              console.log("Create Hub button wired");
            } else {
              console.error("createHubBtn not found in DOM");
            }
          }, 100);
        };
      }
    })
    .catch(error => console.error("Error loading popup:", error));
});

/* =========================
   LOAD PROFILE INFO
========================= */
async function loadProfileInfo() {
  const userEmail = localStorage.getItem("user_email");
  if (!userEmail) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/account-settings/${encodeURIComponent(userEmail)}`
    );

    if (!res.ok) throw new Error("Failed to load account settings");

    const data = await res.json();

    const name = data.profile?.name || "User";
    const bio = data.profile?.bio || "";
    const avatar = data.profile?.avatar || null;

    /* Desktop Profile */
    const nameEl = document.getElementById("profileName");
    const bioEl = document.getElementById("profileBio");
    const avatarEl = document.getElementById("profileAvatar");

    if (nameEl) nameEl.textContent = name;
    if (bioEl) bioEl.textContent = bio;

    if (avatar && avatarEl) {
      avatarEl.style.backgroundImage = `url(${avatar})`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
      avatarEl.textContent = "";
    } else if (avatarEl) {
      avatarEl.textContent = name.charAt(0).toUpperCase();
    }

    const welcomeEl = document.getElementById("welcomeName");
    if (welcomeEl) {
      welcomeEl.textContent = data.profile?.name || "User";
    }

    /* Phone Preview */
    const phoneName = document.getElementById("phoneName");
    const phoneBio = document.getElementById("phoneBio");
    const phoneAvatar = document.getElementById("phoneAvatar");

    if (phoneName) phoneName.textContent = name;
    if (phoneBio) phoneBio.textContent = bio;

    if (avatar && phoneAvatar) {
      phoneAvatar.style.backgroundImage = `url(${avatar})`;
      phoneAvatar.style.backgroundSize = "cover";
      phoneAvatar.style.backgroundPosition = "center";
      phoneAvatar.textContent = "";
    } else if (phoneAvatar) {
      phoneAvatar.textContent = name.charAt(0).toUpperCase();
    }

  } catch (err) {
    console.error("Profile load error:", err);
  }
}

/* =========================
   LOAD PHONE LINKS
========================= */
async function loadPhoneLinks() {
  const userEmail = localStorage.getItem("user_email");
  if (!userEmail) return;

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/hubs/${encodeURIComponent(userEmail)}`
    );

    if (!res.ok) throw new Error("Failed to load hubs");

    const data = await res.json();
    const phoneLinks = document.getElementById("phoneLinks");

    if (!phoneLinks) return;

    phoneLinks.innerHTML = "";

    data.hubs.forEach(hub => {
      hub.links.forEach(link => {
        const div = document.createElement("div");

        div.className =
          "bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-lg text-sm text-black font-medium flex items-center justify-between cursor-pointer transition-all";

        div.innerHTML = `
          <span>${link.title}</span>
          <i class="fas fa-external-link-alt text-gray-500 text-xs"></i>
        `;

        div.onclick = () => window.open(link.url, "_blank");

        phoneLinks.appendChild(div);
      });
    });

  } catch (err) {
    console.error("Phone links error:", err);
  }
}

/* =========================
   ADD RULE 3, 4, 5...
========================= */
let ruleStep = 2;

const addBtn = document.getElementById("addConditionBtn");

if (addBtn) {
  addBtn.addEventListener("click", () => {
    if (ruleStep === 2) {
      const rule3 = document.getElementById("rule3Template").cloneNode(true);
      rule3.classList.remove("hidden");
      rule3.removeAttribute("id");

      rule3.querySelector(".remove-rule").onclick = () => {
        rule3.remove();
        ruleStep = 2;
        addBtn.disabled = false;
        addBtn.innerText = "+ Add Another Condition";
      };

      addBtn.before(rule3);
      rule3.scrollIntoView({ behavior: "smooth", block: "center" });
      ruleStep = 3;
      return;
    }

    if (ruleStep === 3) {
      const rule4 = document.getElementById("rule4Template").cloneNode(true);
      rule4.classList.remove("hidden");
      rule4.removeAttribute("id");

      rule4.querySelector(".remove-rule").onclick = () => {
        rule4.remove();
        ruleStep = 3;
        addBtn.disabled = false;
        addBtn.innerText = "+ Add Another Condition";
      };

      addBtn.before(rule4);
      rule4.scrollIntoView({ behavior: "smooth", block: "center" });

      addBtn.disabled = true;
      addBtn.innerText = "Maximum rules added";
      addBtn.classList.add("opacity-50");
    }
  });
}

/* =========================
   SHARE MODAL
========================= */
async function openShareModal() {
  const userEmail = localStorage.getItem("user_email");
  if (!userEmail) return alert("User not logged in");

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/api/hubs/${encodeURIComponent(userEmail)}`
    );

    if (!res.ok) throw new Error("Failed to load hubs");

    const data = await res.json();

    const modal = document.getElementById("shareHubModal");
    const list = document.getElementById("shareHubList");

    list.innerHTML = "";

    if (data.hubs.length === 0) {
      list.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <i class="fas fa-inbox text-4xl mb-3"></i>
          <p>No hubs to share yet</p>
        </div>
      `;
      modal.classList.remove("hidden");
      return;
    }

    data.hubs.forEach(hub => {
      const shareUrl = `http://127.0.0.1:5500/.qodo/Frontend/Viewer/index.html?user=${hub.slug}`;

      const item = document.createElement("div");
      item.className =
        "flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3";

      item.innerHTML = `
        <div class="flex-1">
          <p class="text-white font-medium">${hub.title}</p>
          <p class="text-xs text-gray-400 break-all mt-1">${shareUrl}</p>
        </div>
        <div class="flex gap-3 ml-4">
          <button class="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            onclick="window.open('${shareUrl}', '_blank')">
            <i class="fas fa-external-link-alt"></i>
          </button>
          
          <button class="text-green-400 hover:text-green-300 text-sm transition-colors"
            onclick="shareHubLink('${shareUrl}', '${hub.title}')">
            <i class="fas fa-share-alt"></i>
          </button>

          <button class="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            onclick="copyHubLink('${shareUrl}')">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      `;

      list.appendChild(item);
    });

    modal.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    alert("Failed to open share modal");
  }
}

function closeShareModal() {
  document.getElementById("shareHubModal").classList.add("hidden");
}

async function shareHubLink(url, title) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: `Check out my hub: ${title}`,
        url: url
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyHubLink(url);
      }
    }
  } else {
    copyHubLink(url);
  }
}

function copyHubLink(url) {
  navigator.clipboard.writeText(url).then(() => {
    showToast("Link copied to clipboard!");
  }).catch(() => {
    alert("Failed to copy link");
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.shareHubLink = shareHubLink;
window.copyHubLink = copyHubLink;