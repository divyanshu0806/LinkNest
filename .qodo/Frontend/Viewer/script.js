// ==========================================
// CONFIG
// ==========================================

// ==========================================
// FONT MAP
// ==========================================
const fontMap = {
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
  montserrat: "'Montserrat', sans-serif",
  oswald: "'Oswald', sans-serif",
  "pt-serif": "'PT Serif', serif",
  courier: "'Courier New', monospace",
  bellota: "'Bellota', cursive"
};


const API_BASE = "http://127.0.0.1:8000";

// ==========================================
// DEVICE DETECTION
// ==========================================
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|windows phone/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

// ==========================================
// TRACK PAGE VIEW
// ==========================================
async function trackPageView(hubSlug) {
  try {
    await fetch(`${API_BASE}/api/track/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hub_slug: hubSlug,
        device: getDeviceType(),
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || "direct",
        screen_width: window.screen.width,
        screen_height: window.screen.height
      })
    });
    console.log("✅ Page view tracked");
  } catch (err) {
    console.error("❌ Failed to track view:", err);
  }
}

// ==========================================
// TRACK LINK CLICK
// ==========================================
async function trackLinkClick(hubSlug, linkTitle, linkUrl) {
  try {
    await fetch(`${API_BASE}/api/track/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hub_slug: hubSlug,
        link_title: linkTitle,
        link_url: linkUrl,
        device: getDeviceType(),
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || "direct"
      })
    });
    console.log(`✅ Click tracked: ${linkTitle}`);
  } catch (err) {
    console.error("❌ Failed to track click:", err);
  }
}

// ==========================================
// INIT - Load Hub Data
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Viewer page loaded");
  
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("user") || params.get("slug");

  if (!slug) {
    showErrorPage("No hub specified");
    return;
  }

  slug = slug.toLowerCase().trim();
  
  try {
    const apiUrl = `${API_BASE}/api/hub/${slug}`;
    console.log("🔍 Fetching from:", apiUrl);
    
    const res = await fetch(apiUrl);
    console.log("📡 Response status:", res.status);

    if (!res.ok) {
      throw new Error("Hub not found");
    }

    const hub = await res.json();
    console.log("✅ Hub data:", hub);

    // Track page view
    await trackPageView(slug);

    renderHub(hub);

  } catch (err) {
    console.error("❌ Error:", err);
    showErrorPage("Hub not found");
  }
});

// ==========================================
// RENDER HUB
// ==========================================
function renderHub(hub) {
  console.log("🎨 Rendering hub...");

  // ===============================
  // COLORS (SAFE DEFAULTS)
  // ===============================
  const textColor = hub.textColor || "#ffffff";
  const cardTextColor = hub.textColor || "#ffffff";

  let cardBg = "rgba(255,255,255,0.08)";
  let cardBorder = "rgba(255,255,255,0.15)";

  // Light backgrounds
  if (["#fdfbf7", "#ccb7a8", "#ffffff"].includes(hub.background)) {
    cardBg = "#ffffff";
    cardBorder = "#e5e7eb";
  }

  // ===============================
  // BACKGROUND
  // ===============================
  const container = document.getElementById("appContainer");
  container.style.background = hub.background || "#000";
  document.body.style.background = hub.background || "#000";

  // ===============================
  // FONT (SAFE)
  // ===============================
  const fontFamily = fontMap[hub.font] || "'Inter', sans-serif";
  document.body.style.fontFamily = fontFamily;

  // ===============================
  // PROFILE IMAGE
  // ===============================
  document.getElementById("profileImageContainer").innerHTML = `
    <div class="w-full h-full flex items-center justify-center rounded-full"
         style="background:rgba(0,0,0,0.25); color:${textColor}">
      <i class="fa-solid fa-user text-4xl"></i>
    </div>
  `;

  // ===============================
  // TITLE + USERNAME
  // ===============================
  const titleEl = document.getElementById("profileTitle");
  const userEl = document.getElementById("profileUsername");

  titleEl.textContent = hub.title || "Untitled";
  userEl.textContent = `@${hub.slug}`;

  titleEl.style.color = textColor;
  userEl.style.color = textColor;

  // ===============================
  // LINKS
  // ===============================
  const linksList = document.getElementById("linksList");

  if (!hub.links || hub.links.length === 0) {
    linksList.innerHTML = `
      <div class="text-center py-12" style="color:${textColor}; opacity:0.6">
        <i class="fa-solid fa-link-slash text-5xl mb-4"></i>
        <p class="text-lg">No links added yet</p>
      </div>
    `;
  } else {
    linksList.innerHTML = hub.links.map(link => `
      <div
        style="background:${cardBg}; border:1px solid ${cardBorder}"
        class="rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between group"
        onclick="handleLinkClick('${hub.slug}', '${escapeHtml(link.title)}', '${escapeHtml(link.url)}')">

        <div class="flex items-center gap-3">
          <i class="fa-solid fa-link" style="color:${cardTextColor}"></i>
          <span class="font-medium" style="color:${cardTextColor}">
            ${escapeHtml(link.title)}
          </span>
        </div>

        <div class="flex gap-2">
          <button onclick="event.stopPropagation(); openQr('${escapeHtml(link.url)}', '${escapeHtml(link.title)}')"
                  class="p-2 rounded-lg transition-colors"
                  style="color:${cardTextColor}">
            <i class="fa-solid fa-qrcode"></i>
          </button>

          <button onclick="event.stopPropagation(); shareLink('${escapeHtml(link.url)}', '${escapeHtml(link.title)}')"
                  class="p-2 rounded-lg transition-colors"
                  style="color:${cardTextColor}">
            <i class="fa-solid fa-share"></i>
          </button>
        </div>
      </div>
    `).join("");
  }

  // ===============================
  // SHOW PAGE
  // ===============================
  document.body.classList.remove("hidden-opacity");
  console.log("✅ Render complete!");
}



// ==========================================
// ACTIONS
// ==========================================
async function handleLinkClick(hubSlug, linkTitle, linkUrl) {
  console.log("🔗 Opening:", linkUrl);
  
  // Track click
  await trackLinkClick(hubSlug, linkTitle, linkUrl);
  
  // Open link
  window.open(linkUrl, "_blank");
}

function openQr(url, title) {
  console.log("📱 QR for:", url);
  
  const modal = document.getElementById("qrModal");
  const qrImg = document.getElementById("qrImage");
  const qrLinkUrl = document.getElementById("qrLinkUrl");
  const modalContent = modal.querySelector(".modal-content");

  qrImg.src = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(url);
  qrLinkUrl.textContent = title || url;
  modal.dataset.currentUrl = url;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  
  setTimeout(() => {
    modalContent.style.transform = "scale(1)";
    modalContent.style.opacity = "1";
  }, 10);
}

function closeQrModal() {
  const modal = document.getElementById("qrModal");
  const modalContent = modal.querySelector(".modal-content");
  
  modalContent.style.transform = "scale(0.95)";
  modalContent.style.opacity = "0";
  
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }, 200);
}

function downloadQr() {
  const modal = document.getElementById("qrModal");
  const url = modal.dataset.currentUrl;
  
  if (!url) return;
  
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" + encodeURIComponent(url);
  
  const a = document.createElement('a');
  a.href = qrUrl;
  a.download = 'qr-code.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  showToast("QR Code downloaded!");
}

async function shareLink(url, title) {
  console.log("📤 Sharing:", title);

  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url });
      showToast("Shared successfully!");
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyToClipboard(url);
      }
    }
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast("Link copied!");
  }).catch(() => {
    showToast("Failed to copy");
  });
}

// ==========================================
// HELPERS
// ==========================================
function showToast(msg) {
  const toast = document.getElementById("toast");
  const toastMsg = document.getElementById("toastMsg");
  
  toastMsg.textContent = msg;
  toast.style.transform = "translateX(-50%) translateY(0)";
  toast.style.opacity = "1";
  
  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(20px)";
    toast.style.opacity = "0";
  }, 2500);
}

function showErrorPage(msg) {
  document.body.innerHTML = `
    <div style="height:100vh; display:flex; align-items:center; justify-content:center; 
                background:#000; color:#fff; text-align:center; padding:20px;">
      <div>
        <i class="fa-solid fa-circle-exclamation text-6xl mb-4 text-red-500"></i>
        <h2 class="text-2xl font-bold mb-2">${msg}</h2>
        <p class="text-gray-400">Please check the URL and try again</p>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('click', (e) => {
  const modal = document.getElementById('qrModal');
  if (e.target === modal) {
    closeQrModal();
  }
});

console.log("✅ Script loaded");