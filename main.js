// ✅ Your API key
const API_KEY = '00xMw6Bfm995ZG2luXDlJvX54do8p0FMePETEEEF';

// Endpoints (NOAA/SWPC JSON feeds)
const endpoints = {
  kp: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
  goes: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json',
  mag: 'https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json'
};

// 5-hour window
const cutoffMs = 5 * 60 * 60 * 1000;

// DOM elements
const kpVal = document.getElementById('kp-val'), kpTime = document.getElementById('kp-time');
const speedVal = document.getElementById('speed-val'), speedTime = document.getElementById('speed-time');
const denVal = document.getElementById('den-val'), denTime = document.getElementById('den-time');
const bzVal = document.getElementById('bz-val'), bzTime = document.getElementById('bz-time');
const xrayVal = document.getElementById('xray-val'), xrayTime = document.getElementById('xray-time');
const lastUpdateEl = document.getElementById('last-update');

// Nice local time formatting
function niceTime(s){try{return new Date(s).toLocaleTimeString()}catch(e){return s}}

// Create Chart.js chart
function createChart(ctx, label, color){
  return new Chart(ctx, {
    type:'line',
    data:{labels:[], datasets:[{label, data:[], borderColor:color, borderWidth:2, pointRadius:0, tension:0.2}]},
    options:{
      plugins:{legend:{display:false}},
      scales:{x:{type:'time', time:{unit:'minute'}, ticks:{autoSkip:true}}, y:{beginAtZero:false}},
      responsive:true, maintainAspectRatio:false
    }
  });
}

// Charts
let chartSpeed = createChart(document.getElementById('chart-speed'), 'Speed', '#ff7a18');
let chartBz = createChart(document.getElementById('chart-bz'), 'Bz', '#ff4b00');
let chartXray = createChart(document.getElementById('chart-xray'), 'X-ray', '#ffaa66');

// Fetch JSON with API key in headers
async function fetchJson(url){
  try{
    const res = await fetch(url, {
      method:'GET',
      headers:{
        'Authorization': `Bearer ${API_KEY}`,
        'Accept':'application/json'
      },
      cache:'no-store'
    });
    return await res.json();
  } catch(e){
    console.error('Fetch error:', e);
    return null;
  }
}

// Filter last 5 hours
function filter5h(arr){
  if(!arr) return [];
  const cutoff = Date.now() - cutoffMs;
  return arr.filter(s=>{
    const t = new Date(s.time_tag || s.timestamp || s.date).getTime();
    return t >= cutoff;
  });
}

// Demo fallback (so charts render instantly)
const demoMagData = Array.from({length:50},(_,i)=>{
  const now = Date.now() - (50-i)*6*60*1000;
  return {time_tag:new Date(now).toISOString(), speed:400+Math.random()*50, density:5+Math.random()*2, bz:-5+Math.random()*10};
});
const demoGOESData = Array.from({length:50},(_,i)=>{
  const now = Date.now() - (50-i)*6*60*1000;
  return {time_tag:new Date(now).toISOString(), flux:1e-6+Math.random()*5e-7};
});
const demoKpData = Array.from({length:50},(_,i)=>{
  const now = Date.now() - (50-i)*6*60*1000;
  return {time_tag:new Date(now).toISOString(), kp:Math.random()*5};
});

// Update all data
async function updateAll(){
  lastUpdateEl.textContent = "Updated " + new Date().toLocaleTimeString();

  let [kpJson, goesJson, magJson] = await Promise.all([
    fetchJson(endpoints.kp),
    fetchJson(endpoints.goes),
    fetchJson(endpoints.mag)
  ]);

  // Use fallback if live data unavailable
  kpJson = kpJson && kpJson.length ? kpJson : demoKpData;
  goesJson = goesJson && goesJson.length ? goesJson : demoGOESData;
  magJson = magJson && magJson.length ? magJson : demoMagData;

  // --- Kp
  const kpSlice = filter5h(kpJson);
  const latestKp = kpSlice[kpSlice.length-1];
  kpVal.textContent = latestKp.kp?.toFixed(2) || '—';
  kpTime.textContent = niceTime(latestKp.time_tag);

  // --- GOES X-ray
  const goesSlice = filter5h(goesJson);
  chartXray.data.labels = goesSlice.map(s => s.time_tag);
  chartXray.data.datasets[0].data = goesSlice.map(s => Number(s.flux || s.value));
  chartXray.update();
  const latestGOES = goesSlice[goesSlice.length-1];
  xrayVal.textContent = (latestGOES.flux || latestGOES.value).toExponential(2);
  xrayTime.textContent = niceTime(latestGOES.time_tag);

  // --- Solar Wind
  const magSlice = filter5h(magJson);
  chartSpeed.data.labels = magSlice.map(s => s.time_tag);
  chartSpeed.data.datasets[0].data = magSlice.map(s => s.speed || s.flow_speed || s.v);
  chartSpeed.update();
  chartBz.data.labels = magSlice.map(s => s.time_tag);
  chartBz.data.datasets[0].data = magSlice.map(s => s.bz || s.bz_gsm || 0);
  chartBz.update();

  const latestMag = magSlice[magSlice.length-1];
  speedVal.textContent = Math.round(latestMag.speed || latestMag.flow_speed || latestMag.v || 0);
  denVal.textContent = (latestMag.density || latestMag.proton_density || 0).toFixed(1);
  bzVal.textContent = (latestMag.bz || latestMag.bz_gsm || 0).toFixed(2);
  speedTime.textContent = denTime.textContent = bzTime.textContent = niceTime(latestMag.time_tag);
}

// Initial fetch + refresh every 60s
updateAll();
setInterval(updateAll, 60000);
