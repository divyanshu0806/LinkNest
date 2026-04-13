let hubs = [];
const API_BASE = "http://127.0.0.1:8000";

async function loadHubs() {
    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) {
        window.location.href = "../login/signin.html";
        return;
    }

    try {
        // 1. Fetch Hubs from DB
        const res = await fetch(`${API_BASE}/api/hubs/${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        const rawHubs = data.hubs || [];

        // 2. Fetch Analytics for each hub to get real view counts
        const analyticsPromises = rawHubs.map(hub => 
            fetch(`${API_BASE}/api/analytics/${hub.slug}`)
                .then(r => r.ok ? r.json() : { total_views: 0, total_clicks: 0 })
                .catch(() => ({ total_views: 0, total_clicks: 0 }))
        );

        const analyticsResults = await Promise.all(analyticsPromises);

        // 3. Merge Hubs with their Analytics
        hubs = rawHubs.map((hub, i) => ({
            ...hub,
            views: analyticsResults[i].total_views || 0,
            clicks: analyticsResults[i].total_clicks || 0,
            status: hub.status || 'active'
        }));

        renderHubs();
        updateStats();

    } catch (err) {
        console.error("Failed to load hubs:", err);
        document.getElementById("hubsContainer").innerHTML = `<p class="text-red-500 col-span-full text-center">Error connecting to server.</p>`;
    }
}

function renderHubs() {
    const container = document.getElementById("hubsContainer");
    container.innerHTML = "";

    if (hubs.length === 0) {
        container.innerHTML = `<div class="col-span-full py-20 text-center text-gray-500">No hubs found. Create one!</div>`;
        return;
    }

    hubs.forEach((hub, index) => {
        const card = document.createElement("div");
        card.className = "hub-card bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-green-500 transition-all relative";
        
        card.innerHTML = `
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                    <div class="text-3xl">📋</div>
                    <div>
                        <h3 class="font-semibold text-white text-lg">${hub.title}</h3>
                        <p class="text-xs text-gray-500">/${hub.slug}</p>
                    </div>
                </div>
                <span class="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full font-medium">Active</span>
            </div>

            <p class="text-sm text-gray-400 mb-4 line-clamp-2">${hub.description || "No description provided."}</p>

            <div class="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b border-zinc-800">
                <div>
                    <div class="text-xl font-bold text-white">${formatNumber(hub.views)}</div>
                    <div class="text-xs text-gray-500">Views</div>
                </div>
                <div>
                    <div class="text-xl font-bold text-white">${formatNumber(hub.clicks)}</div>
                    <div class="text-xs text-gray-500">Clicks</div>
                </div>
                <div>
                    <div class="text-xl font-bold text-white">${hub.links?.length || 0}</div>
                    <div class="text-xs text-gray-500">Links</div>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="openEditHub(${index})" class="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <a href="../Analytics/index.html?hub=${hub.slug}" class="flex-1 border border-zinc-700 text-gray-300 hover:text-green-500 hover:border-green-500 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                    <i class="fas fa-chart-bar"></i> Analytics
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateStats() {
    const totalViews = hubs.reduce((acc, hub) => acc + hub.views, 0);
    document.getElementById("totalHubsCount").textContent = hubs.length;
    document.getElementById("activeHubsCount").textContent = hubs.length; // Assuming all active for now
    document.getElementById("totalViewsCount").textContent = formatNumber(totalViews);
}

function formatNumber(num) {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    loadHubs();
    
    // Logout logic
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = "../login/signin.html";
    });
});

function openEditModal() { document.getElementById('editModal').style.opacity = "1"; document.getElementById('editModal').style.pointerEvents = "auto"; }
function closeEditModal() { document.getElementById('editModal').style.opacity = "0"; document.getElementById('editModal').style.pointerEvents = "none"; }