const input=document.getElementById("searchInput");
const searchBtn=document.getElementById("searchBtn");
const locateBtn=document.getElementById("locateBtn");
const cityEl=document.getElementById("cityName");
const timeEl=document.getElementById("updated");
const tempEl=document.getElementById("temp");
const iconEl=document.getElementById("icon");
const descEl=document.getElementById("desc");
const feelsEl=document.getElementById("feels");
const humidityEl=document.getElementById("humidity");
const windEl=document.getElementById("wind");
const hourlyEl=document.getElementById("hourly");
const loader=document.getElementById("loader");
const toast=document.getElementById("toast");

const WEATHER_MAP={0:{t:"Clear sky",e:"☀️"},1:{t:"Mainly clear",e:"🌤️"},2:{t:"Partly cloudy",e:"⛅"},3:{t:"Overcast",e:"☁️"},45:{t:"Fog",e:"🌫️"},48:{t:"Rime fog",e:"🌫️"},51:{t:"Light drizzle",e:"🌦️"},53:{t:"Moderate drizzle",e:"🌦️"},55:{t:"Dense drizzle",e:"🌧️"},56:{t:"Freezing drizzle",e:"🌧️"},57:{t:"Freezing drizzle",e:"🌧️"},61:{t:"Light rain",e:"🌧️"},63:{t:"Moderate rain",e:"🌧️"},65:{t:"Heavy rain",e:"🌧️"},66:{t:"Freezing rain",e:"🌧️"},67:{t:"Freezing rain",e:"🌧️"},71:{t:"Light snow",e:"🌨️"},73:{t:"Moderate snow",e:"🌨️"},75:{t:"Heavy snow",e:"❄️"},77:{t:"Snow grains",e:"❄️"},80:{t:"Rain showers",e:"🌧️"},81:{t:"Rain showers",e:"🌧️"},82:{t:"Violent showers",e:"🌧️"},85:{t:"Snow showers",e:"🌨️"},86:{t:"Snow showers",e:"❄️"},95:{t:"Thunderstorm",e:"⛈️"},96:{t:"Storm with hail",e:"⛈️"},99:{t:"Storm with hail",e:"⛈️"}};

function showLoader(v){loader.classList.toggle("hidden",!v)}
function showToast(msg){toast.textContent=msg;toast.classList.remove("hidden");setTimeout(()=>toast.classList.add("hidden"),2500)}
function fmtTemp(x){return `${Math.round(x)}°C`}
function fmtWind(x){return `${Math.round(x)} km/h`}
function fmtHum(x){return `${Math.round(x)}%`}
function fmtTime(ts){try{const d=new Date(ts);return new Intl.DateTimeFormat(undefined,{weekday:"short",hour:"2-digit",minute:"2-digit"}).format(d)}catch{return "—"}}

function nearestHourIndex(times,target){if(!Array.isArray(times)||!times.length)return -1;const tt=typeof target==="string"?new Date(target).getTime():new Date(target).getTime();let best=-1;let diff=Infinity;for(let i=0;i<times.length;i++){const di=Math.abs(new Date(times[i]).getTime()-tt);if(di<diff){diff=di;best=i}}return best}

async function geocodeCity(name){const u=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;const r=await fetch(u);if(!r.ok)throw new Error("Network");const j=await r.json();if(!j.results||!j.results.length)throw new Error("City not found");const g=j.results[0];return {name:g.name+(g.country?`, ${g.country}`:""),lat:g.latitude,lon:g.longitude}}

async function fetchWeather(lat,lon){const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;const r=await fetch(u);if(!r.ok)throw new Error("Network");return r.json()}

function updateUI(place,res){const c=res.current_weather;const code=c.weathercode;const m=WEATHER_MAP[code]||{t:"—",e:"❓"};cityEl.textContent=place;timeEl.textContent=fmtTime(c.time);tempEl.textContent=fmtTemp(c.temperature);iconEl.textContent=m.e;descEl.textContent=m.t;windEl.textContent=fmtWind(c.windspeed);
let feels="—",hum="—";try{const idx=nearestHourIndex(res.hourly.time||[],c.time);if(idx>=0){if(Array.isArray(res.hourly.apparent_temperature))feels=fmtTemp(res.hourly.apparent_temperature[idx]);if(Array.isArray(res.hourly.relative_humidity_2m))hum=fmtHum(res.hourly.relative_humidity_2m[idx]);}}catch{}
feelsEl.textContent=feels;humidityEl.textContent=hum;updateHourly(res)}

function updateHourly(res){hourlyEl.innerHTML="";const t=res.hourly.time||[];const temp=res.hourly.temperature_2m||[];const wcode=res.hourly.weather_code||[];const start=Math.max(0,nearestHourIndex(t,new Date()));const end=Math.min(t.length,start+12);for(let i=start;i<end;i++){const code=wcode[i];const m=WEATHER_MAP[code]||{e:"❓"};const h=document.createElement("div");h.className="hour";const te=document.createElement("div");te.className="t";te.textContent=new Intl.DateTimeFormat(undefined,{hour:"2-digit"}).format(new Date(t[i]));const we=document.createElement("div");we.className="w";we.textContent=m.e;const va=document.createElement("div");va.className="e";va.textContent=fmtTemp(temp[i]);h.appendChild(te);h.appendChild(we);h.appendChild(va);hourlyEl.appendChild(h)}}

async function searchByCity(){const q=input.value.trim();if(!q)return;showLoader(true);try{const g=await geocodeCity(q);const res=await fetchWeather(g.lat,g.lon);updateUI(g.name,res)}catch(e){showToast(e.message||"Something went wrong")}finally{showLoader(false)}}

async function useLocation(){if(!navigator.geolocation){showToast("Geolocation unavailable");return}showLoader(true);navigator.geolocation.getCurrentPosition(async p=>{try{const lat=p.coords.latitude;const lon=p.coords.longitude;const res=await fetchWeather(lat,lon);const place=`Your Location`;updateUI(place,res)}catch(e){showToast(e.message||"Something went wrong")}finally{showLoader(false)}},()=>{showLoader(false);showToast("Location access denied")},{enableHighAccuracy:true,timeout:8000})}

searchBtn.addEventListener("click",searchByCity);
locateBtn.addEventListener("click",useLocation);
input.addEventListener("keydown",e=>{if(e.key==="Enter")searchByCity()});

(function init(){useLocation();if(!input.value)input.placeholder="Search city"})();