document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const searchBtn = document.getElementById('search-btn');
    const cityInput = document.getElementById('city-input');
    const weatherDashboard = document.getElementById('weather-dashboard');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    let map;
    let tempChart;

    // --- Dark Mode Logic ---
    // Check for saved theme in localStorage and apply it
    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        themeToggleDarkIcon.classList.remove('hidden');
    }

    // Add event listener for the theme toggle button
    themeToggleBtn.addEventListener('click', () => {
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
    });

    // --- API Fetching Logic ---
    const getLocalWeather = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeatherByCoords(position.coords.latitude, position.coords.longitude),
                () => showError("Could not get your location. Please search for a city manually.")
            );
        } else {
            showError("Geolocation is not supported. Please search for a city.");
        }
    };

    const fetchWeatherByCoords = async (lat, lon) => {
        fetchWeatherData(`/weather?lat=${lat}&lon=${lon}`);
    };

    const fetchWeatherByCity = async (city) => {
        fetchWeatherData(`/weather?city=${encodeURIComponent(city)}`);
    };

    const fetchWeatherData = async (url) => {
        showLoader();
        hideError();
        weatherDashboard.classList.add('hidden');

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An error occurred');
            updateUI(data);
            weatherDashboard.classList.remove('hidden');
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoader();
        }
    };

    // --- Event Listeners ---
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
        else showError('Please enter a city name.');
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    // --- UI Update Functions ---
    const updateUI = (data) => {
        updateCurrentWeather(data.current);
        updateAtmosphere(data.current, data.air_quality); // Pass both current and air quality data
        updateForecast(data.forecast);
        updateMap(data.current.coord.lat, data.current.coord.lon);
        updateChart(data.forecast);
    };

    const updateCurrentWeather = (current) => {
        document.getElementById('city-name').textContent = `${current.name}, ${current.sys.country}`;
        document.getElementById('temperature').textContent = `${Math.round(current.main.temp)}°C`;
        document.getElementById('weather-description').textContent = current.weather[0].description;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;
        document.getElementById('feels-like').textContent = `${Math.round(current.main.feels_like)}°C`;
        document.getElementById('humidity').textContent = `${current.main.humidity}%`;
        document.getElementById('wind-speed').textContent = `${current.wind.speed} m/s`;
        document.getElementById('pressure').textContent = `${current.main.pressure} hPa`;
    };
    
    // NEW: Update Atmosphere card
    const updateAtmosphere = (current, air_quality) => {
        const formatTime = (timestamp) => new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('sunrise-time').textContent = formatTime(current.sys.sunrise);
        document.getElementById('sunset-time').textContent = formatTime(current.sys.sunset);

        const aqiValue = air_quality.list[0].main.aqi;
        const aqiEl = document.getElementById('aqi');
        const [aqiText, aqiColor] = getAqiInfo(aqiValue);
        aqiEl.textContent = aqiText;
        aqiEl.className = `font-semibold px-2 py-1 rounded ${aqiColor}`;
    };

    const getAqiInfo = (aqi) => {
        switch (aqi) {
            case 1: return ["Good", "bg-green-500 text-white"];
            case 2: return ["Fair", "bg-yellow-500 text-white"];
            case 3: return ["Moderate", "bg-orange-500 text-white"];
            case 4: return ["Poor", "bg-red-500 text-white"];
            case 5: return ["Very Poor", "bg-purple-500 text-white"];
            default: return ["Unknown", "bg-gray-400 text-white"];
        }
    };

    const updateForecast = (forecast) => {
        const forecastCardsContainer = document.getElementById('forecast-cards');
        forecastCardsContainer.innerHTML = '';
        const dailyForecasts = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyForecasts.forEach(day => {
            const card = document.createElement('div');
            card.className = 'forecast-card bg-gray-100 dark:bg-gray-700 p-4 rounded-xl text-center shadow-md';
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            card.innerHTML = `
                <p class="font-bold">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="Weather icon" class="mx-auto">
                <p class="text-lg">${Math.round(day.main.temp)}°C</p>
            `;
            forecastCardsContainer.appendChild(card);
        });
    };

    const updateMap = (lat, lon) => {
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        } else {
            map.setView([lat, lon], 10);
        }
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });
        L.marker([lat, lon]).addTo(map);
    };

    const updateChart = (forecast) => {
        const labels = forecast.list.slice(0, 8).map(item => new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        const tempData = forecast.list.slice(0, 8).map(item => item.main.temp);

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3b82f6'
            }]
        };

        if (tempChart) tempChart.destroy();

        const ctx = document.getElementById('temp-chart').getContext('2d');
        tempChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false, grid: { color: document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb' }, ticks: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563' } },
                    x: { grid: { color: document.documentElement.classList.contains('dark') ? '#4b5563' : '#e5e7eb' }, ticks: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563' } }
                },
                plugins: { legend: { labels: { color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#4b5563' } } }
            }
        });
    };

    // --- Helper Functions ---
    const showLoader = () => loader.classList.remove('hidden');
    const hideLoader = () => loader.classList.add('hidden');
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    };
    const hideError = () => {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
    };

    // --- Initial Call ---
    getLocalWeather();
});
