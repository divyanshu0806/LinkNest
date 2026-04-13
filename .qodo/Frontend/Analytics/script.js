const API_BASE = "http://127.0.0.1:8000";
let trafficChart = null;
let peakHoursChart = null;

document.addEventListener("DOMContentLoaded", () => {
    loadAnalyticsForAllHubs();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = "../login/signin.html";
        });
    }
});

async function loadAnalyticsForAllHubs() {
    const userEmail = localStorage.getItem("user_email");
    if (!userEmail) return showError("Please log in to view analytics");

    try {
        const hubsRes = await fetch(`${API_BASE}/api/hubs/${encodeURIComponent(userEmail)}`);
        const hubsData = await hubsRes.json();

        if (!hubsData.hubs || hubsData.hubs.length === 0) {
            return showError("No hubs found. Create your first hub!");
        }

        const analyticsPromises = hubsData.hubs.map(hub => 
            fetch(`${API_BASE}/api/analytics/${hub.slug}`).then(r => r.json()).catch(() => null)
        );

        const allAnalytics = (await Promise.all(analyticsPromises)).filter(d => d !== null);
        const combinedData = combineAnalytics(allAnalytics, hubsData.hubs);
        renderAnalytics(combinedData);

    } catch (err) {
        console.error("❌ Analytics error:", err);
        showError("Failed to load analytics");
    }
}

function combineAnalytics(analyticsArray, hubs) {
    let totals = { views: 0, clicks: 0 };
    let devices = { mobile: 0, desktop: 0, tablet: 0 };
    let countries = {}, referrers = {}, trafficByDay = {}, hoursActivity = {};
    let allLinks = [];

    analyticsArray.forEach((data, index) => {
        totals.views += (data.total_views || 0);
        totals.clicks += (data.total_clicks || 0);

        // Devices
        if (data.devices) {
            devices.mobile += (data.devices.mobile || 0);
            devices.desktop += (data.devices.desktop || 0);
            devices.tablet += (data.devices.tablet || 0);
        }

        // Objects merge
        const merge = (source, target) => {
            Object.entries(source || {}).forEach(([k, v]) => {
                target[k] = (target[k] || 0) + v;
            });
        };

        merge(data.countries, countries);
        merge(data.referrers, referrers);
        merge(data.hours_activity, hoursActivity);

        // Daily
        Object.entries(data.traffic_by_day || {}).forEach(([day, stats]) => {
            if (!trafficByDay[day]) trafficByDay[day] = { views: 0, clicks: 0 };
            trafficByDay[day].views += stats.views;
            trafficByDay[day].clicks += stats.clicks;
        });

        if (data.top_links) {
            data.top_links.forEach(l => allLinks.push({ ...l, hub_name: hubs[index].title }));
        }
    });

    return {
        total_views: totals.views,
        total_clicks: totals.clicks,
        ctr: totals.views > 0 ? (totals.clicks / totals.views * 100) : 0,
        devices, countries, referrers, traffic_by_day: trafficByDay,
        hours_activity: hoursActivity,
        top_links: allLinks.sort((a, b) => b.clicks - a.clicks)
    };
}

function renderAnalytics(data) {
    // Stat Cards
    document.getElementById("viewsCard").textContent = data.total_views.toLocaleString();
    document.getElementById("clicksCard").textContent = data.total_clicks.toLocaleString();
    document.getElementById("ctrCard").textContent = data.ctr.toFixed(1) + "%";
    
    const totalD = Object.values(data.devices).reduce((a, b) => a + b, 0);
    const mobPct = totalD > 0 ? ((data.devices.mobile / totalD) * 100).toFixed(0) : 0;
    document.getElementById("mobilePct").textContent = mobPct + "%";

    // Charts
    updateTrafficChart(data.traffic_by_day);
    updatePeakHoursChart(data.hours_activity);

    // Breakdowns
    renderSimpleList("devicesContainer", data.devices, true);
    renderSimpleList("countriesContainer", data.countries, false);
    renderProgressBarList("topLinksContainer", data.top_links, "clicks");
    renderProgressBarList("trafficSourcesContainer", data.referrers, "visits");
    
    // Table
    renderTable(data.top_links, data.total_views);
}

function renderSimpleList(id, obj, isDevice) {
    const container = document.getElementById(id);
    const total = Object.values(obj).reduce((a, b) => a + b, 0);
    if (total === 0) return container.innerHTML = "No data";

    container.innerHTML = Object.entries(obj).sort((a,b) => b[1]-a[1]).map(([k, v]) => `
        <div class="flex justify-between items-center text-sm">
            <span class="capitalize text-gray-400">${k}</span>
            <span class="text-white font-medium">${((v/total)*100).toFixed(0)}%</span>
        </div>
    `).join("");
}

function renderProgressBarList(id, items, label) {
    const container = document.getElementById(id);
    const data = Array.isArray(items) ? items.slice(0, 5) : Object.entries(items).map(([k, v]) => ({title: k, clicks: v})).slice(0, 5);
    if (data.length === 0) return container.innerHTML = "No data";

    const max = Math.max(...data.map(d => d.clicks || 0), 1);
    container.innerHTML = data.map(d => `
        <div>
            <div class="flex justify-between text-xs mb-1">
                <span class="text-gray-300 truncate w-40">${d.title || d.hub_name}</span>
                <span class="text-gray-500">${d.clicks} ${label}</span>
            </div>
            <div class="w-full bg-zinc-800 h-1.5 rounded-full">
                <div class="bg-green-500 h-1.5 rounded-full" style="width: ${(d.clicks/max*100)}%"></div>
            </div>
        </div>
    `).join("");
}

function renderTable(links, totalViews) {
    const tbody = document.getElementById("performanceTableBody");
    if (links.length === 0) return tbody.innerHTML = "<tr><td colspan='4'>No data</td></tr>";

    tbody.innerHTML = links.slice(0, 10).map(l => `
        <tr class="border-b border-zinc-800 text-sm hover:bg-zinc-900 transition-colors">
            <td class="py-4 px-4"><div class="text-white font-medium">${l.title}</div><div class="text-gray-500 text-xs">${l.hub_name}</div></td>
            <td class="py-4 px-4 text-right">${totalViews}</td>
            <td class="py-4 px-4 text-right">${l.clicks}</td>
            <td class="py-4 px-4 text-right text-green-500 font-bold">${(totalViews > 0 ? (l.clicks/totalViews*100) : 0).toFixed(1)}%</td>
        </tr>
    `).join("");
}

function updateTrafficChart(trafficByDay) {
    const dates = Object.keys(trafficByDay).sort();
    const ctx = document.getElementById("trafficChart").getContext('2d');
    if (trafficChart) trafficChart.destroy();
    trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                { label: 'Views', data: dates.map(d => trafficByDay[d].views), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
                { label: 'Clicks', data: dates.map(d => trafficByDay[d].clicks), borderColor: '#f97316', tension: 0.4 }
            ]
        },
        options: { responsive: true, plugins: { legend: { labels: { color: '#9ca3af' } } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } } }
    });
}

function updatePeakHoursChart(hours) {
    const ctx = document.getElementById("peakHoursChart").getContext('2d');
    const data = Array.from({length: 24}, (_, i) => hours[i] || 0);
    if (peakHoursChart) peakHoursChart.destroy();
    peakHoursChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => i + ":00"),
            datasets: [{ data, backgroundColor: '#22c55e' }]
        },
        options: { plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#9ca3af' } }, y: { ticks: { color: '#9ca3af' } } } }
    });
}

function showError(msg) {
    document.querySelector('main').innerHTML = `<div class="p-20 text-center"><h2 class="text-2xl">${msg}</h2></div>`;
}