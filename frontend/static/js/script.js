document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-btn');
    const cityInput = document.getElementById('city-input');
    const weatherDashboard = document.getElementById('weather-dashboard');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');

    let map;
    let tempChart;

    // Function to fetch weather data from the backend
    const fetchWeather = async (city) => {
        showLoader();
        hideError();
        weatherDashboard.classList.add('hidden');

        try {
            const response = await fetch(`/weather?city=${encodeURIComponent(city)}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'An error occurred');
            }
            updateUI(data);
            weatherDashboard.classList.remove('hidden');
        } catch (error) {
            showError(error.message);
        } finally {
            hideLoader();
        }
    };

    // Event listener for the search button
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        } else {
            showError('Please enter a city name.');
        }
    });

    // Event listener for pressing Enter in the input field
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    // Function to update the UI with fetched data
    const updateUI = (data) => {
        updateCurrentWeather(data.current);
        updateForecast(data.forecast);
        updateMap(data.current.coord.lat, data.current.coord.lon);
        updateChart(data.forecast);
    };

    // Function to update the current weather section
    const updateCurrentWeather = (current) => {
        document.getElementById('city-name').textContent = `${current.name}, ${current.sys.country}`;
        document.getElementById('temperature').textContent = `${Math.round(current.main.temp)}°C`;
        document.getElementById('weather-description').textContent = current.weather[0].description;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
        document.getElementById('feels-like').textContent = `${Math.round(current.main.feels_like)}°C`;
        document.getElementById('humidity').textContent = `${current.main.humidity}%`;
        document.getElementById('wind-speed').textContent = `${current.wind.speed} m/s`;
        document.getElementById('pressure').textContent = `${current.main.pressure} hPa`;
    };

    // Function to update the 5-day forecast section
    const updateForecast = (forecast) => {
        const forecastCardsContainer = document.getElementById('forecast-cards');
        forecastCardsContainer.innerHTML = '';
        
        // Filter for one forecast per day (e.g., at noon)
        const dailyForecasts = forecast.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyForecasts.forEach(day => {
            const card = document.createElement('div');
            card.className = 'forecast-card bg-gray-50 p-4 rounded-xl text-center shadow-md';
            
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            card.innerHTML = `
                <p class="font-bold">${dayName}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="Weather icon" class="mx-auto">
                <p class="text-lg">${Math.round(day.main.temp)}°C</p>
            `;
            forecastCardsContainer.appendChild(card);
        });
    };

    // Function to update the map
    const updateMap = (lat, lon) => {
        if (!map) {
            map = L.map('map').setView([lat, lon], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        } else {
            map.setView([lat, lon], 10);
        }
        
        // Clear existing markers
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        L.marker([lat, lon]).addTo(map);
    };

    // Function to update the temperature chart
    const updateChart = (forecast) => {
        const labels = forecast.list.slice(0, 8).map(item => {
            return new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        });
        const tempData = forecast.list.slice(0, 8).map(item => item.main.temp);

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: tempData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };

        if (tempChart) {
            tempChart.destroy();
        }

        const ctx = document.getElementById('temp-chart').getContext('2d');
        tempChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    };

    // Helper functions for loader and error messages
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
});
