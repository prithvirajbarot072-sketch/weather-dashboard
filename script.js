/**
 * Weather Dashboard Application
 * Fetches real-time weather data from OpenWeatherMap API
 * Displays current weather, 5-day forecast, and additional weather information
 */

// Configuration
const API_KEY = 'f3582ec47eaa3e4b86c5c76198c7e3c8'; // OpenWeatherMap API Key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const FORECAST_API = 'https://api.openweathermap.org/data/2.5/forecast';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeatherDiv = document.getElementById('currentWeather');
const additionalInfoDiv = document.getElementById('additionalInfo');
const forecastSection = document.getElementById('forecastSection');
const forecastContainer = document.getElementById('forecastContainer');
const errorMessageDiv = document.getElementById('errorMessage');
const searchSuggestionsDiv = document.getElementById('searchSuggestions');
const recentSearchesSection = document.getElementById('recentSearchesSection');
const recentSearchesList = document.getElementById('recentSearchesList');

// State
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

/**
 * Initialize the application
 * Load default city weather and render recent searches
 */
function init() {
    // Load weather for default city (London)
    getWeatherByCity('London');
    renderRecentSearches();
}

/**
 * Get weather data by city name
 * Fetches current weather and 5-day forecast
 * @param {string} cityName - Name of the city to fetch weather for
 */
async function getWeatherByCity(cityName) {
    try {
        // Show loading state
        currentWeatherDiv.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading weather data...</div>';
        errorMessageDiv.classList.remove('show');
        errorMessageDiv.textContent = '';

        // Fetch current weather data
        const weatherResponse = await fetch(
            `${API_BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric`
        );

        if (!weatherResponse.ok) {
            throw new Error(`City not found: ${cityName}`);
        }

        const weatherData = await weatherResponse.json();

        // Fetch 5-day forecast data
        const forecastResponse = await fetch(
            `${FORECAST_API}?q=${cityName}&appid=${API_KEY}&units=metric`
        );

        if (!forecastResponse.ok) {
            throw new Error('Failed to fetch forecast data');
        }

        const forecastData = await forecastResponse.json();

        // Display weather data
        displayCurrentWeather(weatherData);
        displayAdditionalInfo(weatherData);
        displayForecast(forecastData);

        // Add to recent searches
        addToRecentSearches(cityName);

        // Hide error message
        errorMessageDiv.classList.remove('show');
        searchSuggestionsDiv.classList.remove('show');

    } catch (error) {
        // Handle errors
        currentWeatherDiv.innerHTML = `<div class="error-message" style="background: #fadbd8; color: #e74c3c; border: none; margin: 0;"><i class="fas fa-exclamation-circle"></i> ${error.message}</div>`;
        additionalInfoDiv.style.display = 'none';
        forecastSection.style.display = 'none';
        errorMessageDiv.textContent = error.message;
        errorMessageDiv.classList.add('show');
    }
}

/**
 * Display current weather information
 * Shows temperature, weather condition, humidity, and wind speed
 * @param {object} data - Weather data from API
 */
function displayCurrentWeather(data) {
    const { main, weather, wind, sys, name, coord } = data;
    const iconCode = weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

    const html = `
        <div class="weather-header">
            <div class="location-info">
                <h2>${name}, ${sys.country}</h2>
                <p style="opacity: 0.9; font-size: 14px;">Coordinates: ${coord.lat.toFixed(2)}°, ${coord.lon.toFixed(2)}°</p>
            </div>
            <img src="${iconUrl}" alt="${weather[0].main}" class="weather-icon">
        </div>
        <div class="temperature">${Math.round(main.temp)}°C</div>
        <div class="weather-description">${weather[0].description}</div>
        <div class="weather-details">
            <div class="detail-item">
                <span class="detail-value">${Math.round(main.feels_like)}°C</span>
                <span class="detail-label">Feels Like</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">${main.humidity}%</span>
                <span class="detail-label">Humidity</span>
            </div>
            <div class="detail-item">
                <span class="detail-value">${wind.speed.toFixed(1)} m/s</span>
                <span class="detail-label">Wind Speed</span>
            </div>
        </div>
    `;

    currentWeatherDiv.innerHTML = html;
}

/**
 * Display additional weather information
 * Shows visibility, pressure, min/max temperature, etc.
 * @param {object} data - Weather data from API
 */
function displayAdditionalInfo(data) {
    const { main, visibility, wind } = data;

    // Update visibility
    document.getElementById('visibility').textContent = `${(visibility / 1000).toFixed(1)} km`;

    // Update pressure
    document.getElementById('pressure').textContent = `${main.pressure} hPa`;

    // Update humidity
    document.getElementById('humidityInfo').textContent = `${main.humidity}%`;

    // Update wind speed
    document.getElementById('windInfo').textContent = `${wind.speed.toFixed(1)} m/s`;

    // Update max temperature
    document.getElementById('maxTemp').textContent = `${Math.round(main.temp_max)}°C`;

    // Update min temperature
    document.getElementById('minTemp').textContent = `${Math.round(main.temp_min)}°C`;

    // Show additional info section
    additionalInfoDiv.style.display = 'block';
}

/**
 * Display 5-day weather forecast
 * Shows weather predictions for the next 5 days with daily min/max temps
 * @param {object} data - Forecast data from API
 */
function displayForecast(data) {
    const forecasts = data.list;
    const dailyForecasts = {};

    // Group forecast data by day
    forecasts.forEach(forecast => {
        const date = new Date(forecast.dt * 1000);
        const day = date.toISOString().split('T')[0];

        if (!dailyForecasts[day]) {
            dailyForecasts[day] = {
                temps: [],
                description: forecast.weather[0].description,
                icon: forecast.weather[0].icon,
                date: date
            };
        }
        dailyForecasts[day].temps.push(forecast.main.temp);
    });

    // Create forecast cards for each day
    forecastContainer.innerHTML = '';
    const days = Object.keys(dailyForecasts).slice(1, 6); // Skip today, show next 5 days

    days.forEach(day => {
        const forecast = dailyForecasts[day];
        const minTemp = Math.round(Math.min(...forecast.temps));
        const maxTemp = Math.round(Math.max(...forecast.temps));
        const iconUrl = `https://openweathermap.org/img/wn/${forecast.icon}@2x.png`;
        const date = forecast.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const forecastCard = `
            <div class="forecast-card">
                <div class="forecast-date">${date}</div>
                <img src="${iconUrl}" alt="${forecast.description}" style="height: 50px;">
                <div class="forecast-temp">${maxTemp}°C</div>
                <div class="forecast-temp-range">Low: ${minTemp}°C</div>
                <div class="forecast-desc">${forecast.description}</div>
            </div>
        `;
        forecastContainer.innerHTML += forecastCard;
    });

    // Show forecast section
    forecastSection.style.display = 'block';
}

/**
 * Add city to recent searches
 * Stores up to 5 recent searches in localStorage
 * @param {string} cityName - City name to add
 */
function addToRecentSearches(cityName) {
    const normalized = cityName.trim();

    // Remove if already exists
    recentSearches = recentSearches.filter(city => city.toLowerCase() !== normalized.toLowerCase());

    // Add to front of array
    recentSearches.unshift(normalized);

    // Keep only 5 most recent
    recentSearches = recentSearches.slice(0, 5);

    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));

    // Render the list
    renderRecentSearches();
}

/**
 * Render recent searches list
 * Displays clickable buttons for recent city searches
 */
function renderRecentSearches() {
    if (recentSearches.length === 0) {
        recentSearchesSection.style.display = 'none';
        return;
    }

    recentSearchesList.innerHTML = '';
    recentSearches.forEach(city => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.textContent = city;
        item.addEventListener('click', () => {
            searchInput.value = city;
            getWeatherByCity(city);
        });
        recentSearchesList.appendChild(item);
    });

    recentSearchesSection.style.display = 'block';
}

/**
 * Handle search button click
 * Validates input and fetches weather data
 */
searchBtn.addEventListener('click', () => {
    const cityName = searchInput.value.trim();
    if (cityName) {
        getWeatherByCity(cityName);
    }
});

/**
 * Handle Enter key in search input
 * Allows searching by pressing Enter key
 */
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityName = searchInput.value.trim();
        if (cityName) {
            getWeatherByCity(cityName);
        }
    }
});

/**
 * Popular cities for quick access
 * Used for autocomplete suggestions
 */
const popularCities = [
    'London', 'New York', 'Tokyo', 'Paris', 'Dubai',
    'Sydney', 'Toronto', 'Berlin', 'Amsterdam', 'Bangkok',
    'Singapore', 'Hong Kong', 'Barcelona', 'Rome', 'Madrid'
];

/**
 * Handle search input with autocomplete suggestions
 * Shows relevant city suggestions as user types
 */
searchInput.addEventListener('input', (e) => {
    const input = e.target.value.trim().toLowerCase();

    if (input.length === 0) {
        searchSuggestionsDiv.classList.remove('show');
        return;
    }

    // Filter popular cities based on input
    const suggestions = popularCities.filter(city =>
        city.toLowerCase().startsWith(input)
    ).slice(0, 5);

    if (suggestions.length === 0) {
        searchSuggestionsDiv.classList.remove('show');
        return;
    }

    // Display suggestions
    searchSuggestionsDiv.innerHTML = '';
    suggestions.forEach(city => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = city;
        item.addEventListener('click', () => {
            searchInput.value = city;
            getWeatherByCity(city);
        });
        searchSuggestionsDiv.appendChild(item);
    });

    searchSuggestionsDiv.classList.add('show');
});

/**
 * Close suggestions when clicking outside
 */
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        searchSuggestionsDiv.classList.remove('show');
    }
});

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', init);