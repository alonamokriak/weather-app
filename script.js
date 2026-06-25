"use strict";

const form = document.querySelector(".form-search");
const searchInput = document.getElementById("searchInput");

const cityElement = document.getElementById("cityName");
const dateElement = document.getElementById("currentDate");
const weatherIcon = document.getElementById("weatherIcon");

const temperatureElement = document.getElementById("mainTemperature");
const statusElement = document.getElementById("weatherStatus");
const feelElement = document.getElementById("feelTemperature");
const humidityElement = document.getElementById("humidity");
const windElement = document.getElementById("winds");
const pressureElement = document.getElementById("pressure");
const cityOptionsElement = document.getElementById("cityOptions");

let searchTimeoutId;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeoutId);

  const city = searchInput.value.trim();

  if (!city) {
    cityOptionsElement.innerHTML = "";
    return;
  }

  searchTimeoutId = setTimeout(() => {
    searchCities(city);
  }, 400);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = searchInput.value.trim();

  if (!city) return;

  searchCities(city);
});

async function searchCities(city) {
  try {
    const locations = await getCoordinates(city);
    renderCityOptions(locations);
  } catch (error) {
    cityOptionsElement.innerHTML = "";
    showError("City not found");
  }
}

async function getWeatherByLocation(location) {
  try {
    const weather = await getWeatherData(location.latitude, location.longitude);

    renderCurrentWeather(weather.current, location);
    renderDetailedWeather(weather.hourly, weather.current.time);
  } catch (error) {
    showError("Weather data is not available");
  }
}

function showError(message) {
  cityElement.textContent = message;
  dateElement.textContent = "";
  statusElement.textContent = "No weather data";
  temperatureElement.textContent = "--°C";
  feelElement.textContent = "--°C";
  humidityElement.textContent = "-- %";
  windElement.textContent = "-- km/h";
  pressureElement.textContent = "-- hPa";
}

async function getCoordinates(city) {
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=5&language=en&format=json`);

  const data = await response.json();

  if (!data.results) {
    throw new Error("City not found");
  }
  return data.results;
}

function renderCityOptions(locations) {
  cityOptionsElement.innerHTML = "";

  locations.forEach((location) => {
    const item = document.createElement("li");
    const button = document.createElement("button");

    item.className = "form-search__item";

    button.type = "button";
    button.className = "form-search__option";
    button.textContent = `${location.name}, ${location.country}`;

    button.addEventListener("click", () => {
      searchInput.value = `${location.name}, ${location.country_code}`;
      cityOptionsElement.innerHTML = "";

      getWeatherByLocation(location);
    });

    item.append(button);
    cityOptionsElement.append(item);
  });
}

async function getWeatherData(latitude, longitude) {
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl&hourly=temperature_2m,weather_code&timezone=auto`);

  const data = await response.json();
  return data;
}

function renderCurrentWeather(current, location) {
  const weatherLabel = getWeatherLabel(current.weather_code);

  statusElement.textContent = weatherLabel;
  weatherIcon.src = getWeatherIconPath(current.weather_code);
  weatherIcon.alt = weatherLabel;
  cityElement.textContent = `${location.name}, ${location.country_code}`;
  dateElement.textContent = formatDate(current.time);
  dateElement.setAttribute("datetime", current.time);

  temperatureElement.textContent = `${Math.round(current.temperature_2m)}°C`;

  feelElement.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidityElement.textContent = `${current.relative_humidity_2m} %`;
  windElement.textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  pressureElement.textContent = `${Math.round(current.pressure_msl)} hPa`;
}

function renderDetailedWeather(hourly, currentTime) {
  const currentDate = currentTime.slice(0, 10);

  const slots = [
    { label: "Morning", hour: "08" },
    { label: "Afternoon", hour: "13" },
    { label: "Evening", hour: "18" },
    { label: "Night", hour: "22" }
  ];

  slots.forEach((slot) => {
    const time = `${currentDate}T${slot.hour}:00`;
    const index = hourly.time.indexOf(time);

    if (index === -1) return;

    const card = document.querySelector(`[data-slot="${slot.label}"]`);

    if (!card) return;

    const weatherCode = hourly.weather_code[index];
    const weatherLabel = getWeatherLabel(weatherCode);

    const icon = card.querySelector(".card__icon");
    const temperature = card.querySelector(".card__temperature");
    const status = card.querySelector(".card__status");

    icon.src = getWeatherIconPath(weatherCode);
    icon.alt = weatherLabel;

    temperature.textContent = `${Math.round(hourly.temperature_2m[index])}°C`;
    status.textContent = weatherLabel;
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getWeatherLabel(code) {
  if (code === 0) return "Clear sky";
  if (code === 1) return "Mainly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";

  return "Unknown";
}

function getWeatherIconPath(code) {
  if (code === 0) return "assets/clear-day.svg";
  if (code === 1 || code === 2) return "assets/mostly-clear-day.svg";
  if (code === 3) return "assets/cloudy.svg";
  if (code === 45 || code === 48) return "assets/fog.svg";
  if (code >= 51 && code <= 67) return "assets/rain.svg";
  if (code >= 71 && code <= 86) return "assets/snow.svg";
  if (code >= 80 && code <= 82) return "assets/rain.svg";
  if (code >= 95 && code <= 99) return "assets/thunderstorms.svg";

  return "assets/clear-day.svg";
}
