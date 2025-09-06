const apiKey = "68b058092637284d31b851a0590cbad5";
let cities = [];

// -----------------------
// DOM ELEMENTS
// -----------------------
const tempEl = document.getElementById("temp-in-c");
const dateTimeEl = document.getElementById("date-time");
const weatherIconEl = document.getElementById("weather-icon");
const countryEl = document.getElementById("country");
const cloudyEl = document.getElementById("cloudy");
const rainEl = document.getElementById("rain");

const feelsLikeEl = document.getElementById("feels-like");
const windStatusEl = document.getElementById("wind-status");
const sunriseSunsetEl = document.getElementById("sunrise-sunset");
const humidityEl = document.getElementById("humidity-tile");
const visibilityEl = document.getElementById("visibility");
const pressureEl = document.getElementById("pressure");

const dayCards = document.querySelectorAll(".day-card-container .day-card");
const cityInputEl = document.getElementById("cityNameInput");
const searchBtn = document.getElementById("search-icon");

// -----------------------
// HELPER FUNCTIONS
// -----------------------
function formatTime(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  return date.toUTCString().match(/\d{2}:\d{2}/)[0];
}

function getWeatherEmoji(main) {
  switch (main) {
    case "Clear":
      return "🌞";
    case "Clouds":
      return "⛅";
    case "Rain":
      return "🌧️";
    case "Snow":
      return "❄️";
    case "Thunderstorm":
      return "🌩️";
    default:
      return "🌤️";
  }
}

function getDayName(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// -----------------------
// FETCH WEATHER
// -----------------------
async function fetchWeather(city) {
  if (!city) return alert("City name cannot be empty");
  console.log(`Fetching weather for ${city}...`);
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    console.log("Current weather data received:", data);

    updateLeftSection(data);

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?id=${data.id}&units=metric&appid=${apiKey}`
    );
    if (!forecastRes.ok) throw new Error("Failed to fetch forecast");
    const forecastData = await forecastRes.json();
    console.log("Forecast data received:", forecastData);

    updateWeekCards(forecastData.list);
  } catch (err) {
    console.error("Error fetching weather:", err);
    alert("Error fetching weather data!");
  }
}

// -----------------------
// UPDATE LEFT SECTION
// -----------------------
function updateLeftSection(data) {
  tempEl.textContent = `${data.main.temp.toFixed(1)}°C`;
  dateTimeEl.textContent = new Date().toLocaleString("en-GB", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
  countryEl.textContent = `${data.name}, ${data.sys.country}`;
  cloudyEl.textContent = data.weather[0].description;
  rainEl.textContent = `Clouds: ${data.clouds.all}%`;

  feelsLikeEl.textContent = `${data.main.feels_like.toFixed(1)}°C`;
  windStatusEl.textContent = `${data.wind.speed} m/s`;
  humidityEl.textContent = `${data.main.humidity}%`;
  pressureEl.textContent = `${data.main.pressure} hPa`;
  visibilityEl.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  sunriseSunsetEl.textContent = `${formatTime(
    data.sys.sunrise,
    data.timezone
  )} / ${formatTime(data.sys.sunset, data.timezone)}`;

  const iconCode = data.weather[0].icon;
  weatherIconEl.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="Weather Icon"/>`;
}

// -----------------------
// UPDATE 4-DAY FORECAST CARDS
// -----------------------
function updateWeekCards(list) {
  const today = new Date().toISOString().split("T")[0];
  const dailyTemps = {};

  list.forEach((item) => {
    const day = item.dt_txt.split(" ")[0];
    if (day !== today) {
      if (!dailyTemps[day]) {
        dailyTemps[day] = {
          min: item.main.temp,
          max: item.main.temp,
          weather: item.weather[0].main,
        };
      } else {
        dailyTemps[day].min = Math.min(dailyTemps[day].min, item.main.temp);
        dailyTemps[day].max = Math.max(dailyTemps[day].max, item.main.temp);
      }
    }
  });

  Object.keys(dailyTemps)
    .slice(0, 4)
    .forEach((day, index) => {
      const card = dayCards[index];
      if (!card) return;

      const temps = dailyTemps[day];
      const dayName = getDayName(day);
      const weatherIcon = getWeatherEmoji(temps.weather);

      card.querySelector("p:first-child").textContent = dayName;
      card.querySelector(".day-card-icon").textContent = weatherIcon;
      card.querySelector("p:last-child").textContent = `${Math.round(
        temps.max
      )}°-${Math.round(temps.min)}°`;
    });
}

// -----------------------
// SEARCH FUNCTION
// -----------------------
function searchCity() {
  const inputCity = cityInputEl.value.trim();
  if (!inputCity) return alert("Please enter a city name");

  const cityMatch = cities.find(
    (c) => c.name.toLowerCase() === inputCity.toLowerCase()
  );
  if (!cityMatch) return alert("City not found!");

  fetchWeather(cityMatch.name);
}

// -----------------------
// SEARCH BUTTON CLICK
// -----------------------
searchBtn.addEventListener("click", searchCity);

// -----------------------
// ENTER KEY PRESS
// -----------------------
cityInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchCity();
  }
});

// -----------------------
// LOAD CITY LIST AND INITIAL FETCH
// -----------------------
fetch("city.list.json")
  .then((res) => res.json())
  .then((data) => {
    cities = data;
    console.log(`Loaded ${cities.length} cities`);

    // Load default city as Delhi
    const initialCity = cityInputEl.value.trim() || "Delhi";
    fetchWeather(initialCity);
  })
  .catch((err) => console.error("Error loading city list:", err));
