const API_BASE = 'https://services.swpc.noaa.gov/json';

// Helper to format time nicely
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Create or update chart
function createOrUpdateChart(canvasId, label, labels, data, borderColor) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (ctx.chart) {
    ctx.chart.data.labels = labels;
    ctx.chart.data.datasets[0].data = data;
    ctx.chart.update();
  } else {
    ctx.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          fill: false,
          borderColor: borderColor,
          backgroundColor: borderColor,
          pointRadius: 2,
          borderWidth: 2,
          tension: 0.2,
        }]
      },
      options: {
        responsive: true,
        animation: { duration: 700 },
        scales: {
          x: {
            ticks: { color: '#FFA500' },
            grid: { color: '#333' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#FFA500' },
            grid: { color: '#333' }
          }
        },
        plugins: {
          legend: { labels: { color: '#FFA500' } },
          tooltip: {
            mode: 'nearest',
            intersect: false,
            backgroundColor: '#FF8C00',
            titleColor: '#000',
            bodyColor: '#000',
          }
        }
      }
    });
  }
}

// Fetch KP Index data
async function fetchKP() {
  try {
    const resp = await fetch(`${API_BASE}/kp-index.json`);
    if (!resp.ok) throw new Error('KP fetch failed');
    const data = await resp.json();
    const labels = data.map(d => formatTime(new Date(d.time_tag)));
    const values = data.map(d => parseFloat(d.kp_index));
    const latest = data[data.length - 1];
    return { labels, values, latestValue: latest.kp_index };
  } catch {
    return null;
  }
}

// Fetch Solar Flares data
async function fetchFlares() {
  try {
    const resp = await fetch(`${API_BASE}/xray-flares.json`);
    if (!resp.ok) throw new Error('Flares fetch failed');
    const data = await resp.json();
    const labels = data.map(d => formatTime(new Date(d.time_tag)));
    const values = data.map(d => parseFloat(d['flux']) || 0);
    const latest = data[data.length - 1];
    const latestClass = latest['classType'] || 'N/A';
    return { labels, values, latestValue: `${latestClass} - ${latest.flux}` };
  } catch {
    return null;
  }
}

// Fetch CME data (speed)
async function fetchCMEs() {
  try {
    const resp = await fetch(`${API_BASE}/cme.json`);
    if (!resp.ok) throw new Error('CMEs fetch failed');
    const data = await resp.json();
    const filtered = data.filter(d => d.speed && d.time);
    const labels = filtered.map(d => formatTime(new Date(d.time)));
    const values = filtered.map(d => parseFloat(d.speed));
    const latest = filtered[filtered.length - 1];
    return { labels, values, latestValue: latest ? latest.speed : 'N/A' };
  } catch {
    return null;
  }
}

// Fetch Solar Wind speed
async function fetchSolarWind() {
  try {
    const resp = await fetch(`${API_BASE}/solar-wind.json`);
    if (!resp.ok) throw new Error('Solar Wind fetch failed');
    const data = await resp.json();
    const labels = data.map(d => formatTime(new Date(d.time_tag)));
    const values = data.map(d => parseFloat(d['speed']));
    const latest = data[data.length - 1];
    return { labels, values, latestValue: latest.speed };
  } catch {
    return null;
  }
}

// Fetch Proton Flux data
async function fetchProtonFlux() {
  try {
    const resp = await fetch(`${API_BASE}/proton-flux.json`);
    if (!resp.ok) throw new Error('Proton Flux fetch failed');
    const data = await resp.json();
    const labels = data.map(d => formatTime(new Date(d.time_tag)));
    const values = data.map(d => parseFloat(d['flux']));
    const latest = data[data.length - 1];
    return { labels, values, latestValue: latest.flux };
  } catch {
    return null;
  }
}

// Update all data & charts
async function updateAll() {
  // Update KP
  const kpData = await fetchKP();
  if (kpData) {
    document.querySelector('#kp-current p').textContent = kpData.latestValue;
    createOrUpdateChart("kp-chart", "KP Index", kpData.labels, kpData.values, "#FFA500");
  } else {
    document.querySelector('#kp-current p').textContent = 'Data unavailable';
  }

  // Update Flares
  const flaresData = await fetchFlares();
  if (flaresData) {
    document.querySelector('#flares-current p').textContent = flaresData.latestValue;
    createOrUpdateChart("flare-chart", "Solar Flares (X-ray Flux)", flaresData.labels, flaresData.values, "#FF8C00");
  } else {
    document.querySelector('#flares-current p').textContent = 'Data unavailable';
  }

  // Update CMEs
  const cmesData = await fetchCMEs();
  if (cmesData) {
    document.querySelector('#cme-current p').textContent = cmesData.latestValue;
    createOrUpdateChart("cme-chart", "CMEs Speed (km/s)", cmesData.labels, cmesData.values, "#FFA500");
  } else {
    document.querySelector('#cme-current p').textContent = 'Data unavailable';
  }

  // Update Solar Wind
  const solarWindData = await fetchSolarWind();
  if (solarWindData) {
    document.querySelector('#solarwind-current p').textContent = solarWindData.latestValue;
    createOrUpdateChart("solarwind-chart", "Solar Wind Speed (km/s)", solarWindData.labels, solarWindData.values, "#FF8C00");
  } else {
    document.querySelector('#solarwind-current p').textContent = 'Data unavailable';
  }

  // Update Proton Flux
  const protonData = await fetchProtonFlux();
  if (protonData) {
    document.querySelector('#proton-current p').textContent = protonData.latestValue;
    createOrUpdateChart("proton-chart", "Proton Flux", protonData.labels, protonData.values, "#FFA500");
  } else {
    document.querySelector('#proton-current p').textContent = 'Data unavailable';
  }
}

// Run initially and every 5 minutes
updateAll();
setInterval(updateAll, 5 * 60 * 1000);
