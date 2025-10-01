// =============================
// Space Weather App
// =============================
const API_KEY = "00xMw6Bfm995ZG2luXDlJvX54do8p0FMePETEEEF"; // your key
const endpoints = {
  wind: `https://services.swpc.noaa.gov/products/solar-wind/propagated-speed.json?api_key=${API_KEY}`,
  kp: `https://services.swpc.noaa.gov/json/planetary_k_index_1m.json?api_key=${API_KEY}`,
  cmes: `https://services.swpc.noaa.gov/json/cme_analysis.json?api_key=${API_KEY}`
};

// =============================
// Fetch helper
// =============================
async function fetchJson(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Bad response");
    return await response.json();
  } catch (err) {
    console.warn("Fetch failed:", err);
    return null;
  }
}

// =============================
// Populate UI
// =============================
async function loadSpaceWeather() {
  document.getElementById("page-status").textContent = "Loading…";

  // Solar Wind
  const windData = await fetchJson(endpoints.wind);
  let latestWind = "---";
  if (windData && windData.length > 1) {
    const lastRow = windData[windData.length - 1];
    latestWind = lastRow[1]; // km/s
  }
  document.getElementById("metric-wind").textContent = `${latestWind} km/s`;

  // Kp-index
  const kpData = await fetchJson(endpoints.kp);
  let latestKp = "---";
  if (kpData && kpData.length > 1) {
    const lastRow = kpData[kpData.length - 1];
    latestKp = lastRow.kp_index ?? lastRow[1];
  }
  document.getElementById("metric-kp").textContent = latestKp;

  // CMEs
  const cmeData = await fetchJson(endpoints.cmes);
  let cmeCount = 0;
  if (cmeData && cmeData.length) {
    cmeCount = cmeData.slice(-5).length;
  }
  document.getElementById("metric-cmes").textContent = `${cmeCount} recent`;

  // Forecast cards (demo using wind & kp)
  const forecastEl = document.getElementById("forecast-cards");
  forecastEl.innerHTML = "";
  const days = ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
  for (let i = 0; i < 7; i++) {
    const windVal = Math.floor(Math.random() * 200) + 300; // demo random wind
    const kpVal = Math.floor(Math.random() * 5); // demo random kp
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <div class="day">${days[i]}</div>
      <div class="space">
        <div>Wind: ${windVal} km/s</div>
        <div>Kp: ${kpVal}</div>
      </div>`;
    forecastEl.appendChild(card);
  }

  // Chart
  makeChart();

  document.getElementById("page-status").textContent = "Updated ✓";
}

// =============================
// Chart.js visualizer
// =============================
let chart;
function makeChart() {
  const ctx = document.getElementById("spaceChart");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Thu","Fri","Sat","Sun","Mon","Tue","Wed"],
      datasets: [
        {
          label: "Solar Wind (km/s)",
          data: [350, 420, 480, 390, 460, 510, 440],
          borderColor: "orange",
          tension: 0.4,
          yAxisID: "y1"
        },
        {
          label: "Kp-index",
          data: [1, 2, 3, 4, 2, 1, 3],
          borderColor: "cyan",
          tension: 0.4,
          yAxisID: "y2"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#fff" } }
      },
      scales: {
        x: { ticks: { color: "#aaa" } },
        y1: { position: "left", ticks: { color: "orange" } },
        y2: { position: "right", ticks: { color: "cyan" } }
      }
    }
  });
}

function toggleChart(type) {
  if (!chart) return;
  if (type === "wind") {
    chart.setDatasetVisibility(0, true);
    chart.setDatasetVisibility(1, false);
  }
  if (type === "kp") {
    chart.setDatasetVisibility(0, false);
    chart.setDatasetVisibility(1, true);
  }
  chart.update();
}

// =============================
// Init
// =============================
document.addEventListener("DOMContentLoaded", loadSpaceWeather);
