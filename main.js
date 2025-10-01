// URLs for NOAA JSON APIs
const urls = {
  kp: "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json",
  flares: "https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json",
  cmes: "https://services.swpc.noaa.gov/json/cme.json",
  solarWind: "https://services.swpc.noaa.gov/json/solar-wind.json",
  protonFlux: "https://services.swpc.noaa.gov/json/goes/primary/particles-latest.json"
};

let charts = {}; // Hold Chart.js instances

// Helper: Format datetime string to human-readable (HH:mm)
function formatTime(datetimeStr) {
  const d = new Date(datetimeStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Fetch and process KP index data
async function fetchKP() {
  const res = await fetch(urls.kp);
  const data = await res.json();

  // Last 24 entries (24 minutes)
  const recent = data.slice(-24);

  const labels = recent.map((d) => formatTime(d.time_tag));
  const values = recent.map((d) => parseFloat(d.kp_index));

  // Update current value display (last reading)
  const currentValue = values[values.length - 1].toFixed(1);
  document.getElementById("kp-current").textContent = currentValue;

  return { labels, values };
}

// Fetch and process Solar Flares (X-ray)
async function fetchFlares() {
  const res = await fetch(urls.flares);
  const data = await res.json();

  // data is sorted newest first; reverse it
  const sorted = data.slice().reverse();

  // We'll plot X-ray flux (flux field), label with time
  // Limit to last 24 readings if available
  const recent = sorted.slice(-24);

  const labels = recent.map((d) => formatTime(d.time_tag));
  const values = recent.map((d) => parseFloat(d.flux));

  // Current max class and flux
  const latest = sorted[sorted.length - 1];
  if (latest) {
    document.getElementById("flare-current").textContent = `${latest.class_type} - ${latest.flux}`;
  } else {
    document.getElementById("flare-current").textContent = "N/A";
  }

  return { labels, values };
}

// Fetch and process CMEs (Coronal Mass Ejections)
async function fetchCMEs() {
  const res = await fetch(urls.cmes);
  const data = await res.json();

  // Sort ascending by time_tag
  const sorted = data.slice().sort((a, b) => new Date(a.time_tag) - new Date(b.time_tag));
  // Last 24 CMEs or fewer if less data
  const recent = sorted.slice(-24);

  const labels = recent.map((d) => formatTime(d.time_tag));
  // CME speed (km/s) as value
  const values = recent.map((d) => parseFloat(d.speed_km_s) || 0);

  // Show last CME speed as current
  const latest = sorted[sorted.length - 1];
  if (latest) {
    document.getElementById("cme-current").textContent = `${latest.speed_km_s} km/s`;
  } else {
    document.getElementById("cme-current").textContent = "N/A";
  }

  return { labels, values };
}

// Fetch and process Solar Wind data
async function fetchSolarWind() {
  const res = await fetch(urls.solarWind);
  const data = await res.json();

  // Sort ascending by time_tag
  const sorted = data.slice().sort((a, b) => new Date(a.time_tag) - new Date(b.time_tag));
  // Take last 24 entries
  const recent = sorted.slice(-24);

  const labels = recent.map((d) => formatTime(d.time_tag));
  // Use speed in km/s for plot
  const values = recent.map((d) => parseFloat(d.speed) || 0);

  // Latest speed as current
  const latest = sorted[sorted.length - 1];
  if (latest) {
    document.getElementById("solarwind-current").textContent = `${latest.speed} km/s`;
  } else {
    document.getElementById("solarwind-current").textContent = "N/A";
  }

  return { labels, values };
}

// Fetch and process Proton Flux data
async function fetchProtonFlux() {
  const res = await fetch(urls.protonFlux);
  const data = await res.json();

  // Sort ascending by time_tag
  const sorted = data.slice().sort((a, b) => new Date(a.time_tag) - new Date(b.time_tag));
  // Take last 24 entries
  const recent = sorted.slice(-24);

  const labels = recent.map((d) => formatTime(d.time_tag));
  // Proton flux: pflux field or proton_flux_10MeV (choose one)
  // Using "pflux" here
  const values = recent.map((d) => parseFloat(d.pflux) || 0);

  // Latest proton flux current value
  const latest = sorted[sorted.length - 1];
  if (latest) {
    document.getElementById("proton-current").textContent = latest.pflux;
  } else {
    document.getElementById("proton-current").textContent = "N/A";
  }

  return { labels, values };
}

// Create or update Chart.js chart
function createOrUpdateChart(id, label, labels, data, color) {
  const ctx = document.getElementById(id).getContext("2d");

  if (charts[id]) {
    charts[id].data.labels = labels;
    charts[id].data.datasets[0].data = data;
    charts[id].update();
  } else {
    charts[id] = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            borderColor: color,
            backgroundColor: color + "33",
            fill: true,
            tension: 0.2,
            pointRadius: 2,
            borderWidth: 2,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              maxTicksLimit: 6,
            },
          },
          x: {
            ticks: {
              maxTicksLimit: 6,
            },
          },
        },
        plugins: {
          legend: { display: true },
        },
      },
    });
  }
}

// Main update function
async function updateAll() {
  try {
    const kp = await fetchKP();
    createOrUpdateChart("kp-chart", "KP Index", kp.labels, kp.values, "rgb(75, 192, 192)");

    const flares = await fetchFlares();
    createOrUpdateChart("flare-chart", "Solar Flares (X-ray Flux)", flares.labels, flares.values, "rgb(255, 99, 132)");

    const cmes = await fetchCMEs();
    createOrUpdateChart("cme-chart", "CMEs Speed (km/s)", cmes.labels, cmes.values, "rgb(255, 159, 64)");

    const solarWind = await fetchSolarWind();
    createOrUpdateChart("solarwind-chart", "Solar Wind Speed (km/s)", solarWind.labels, solarWind.values, "rgb(54, 162, 235)");

    const proton = await fetchProtonFlux();
    createOrUpdateChart("proton-chart", "Proton Flux (pflux)", proton.labels, proton.values, "rgb(153, 102, 255)");
  } catch (err) {
    console.error("Error updating data:", err);
  }
}

// Initial load + auto-refresh every 5 minutes
updateAll();
setInterval(updateAll, 5 * 60 * 1000);
