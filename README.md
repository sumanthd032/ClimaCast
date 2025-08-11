
# ClimaCast - Advanced Weather Dashboard

ClimaCast is a modern, responsive weather dashboard application built with Flask and Tailwind CSS. It provides real-time weather information, a 5-day forecast, and other atmospheric details for any location worldwide. The dashboard automatically fetches weather for the user's current location on startup and also supports manual search by city name.

## Features

- **Real-Time Weather**: Get up-to-the-minute weather data, including temperature, "feels like" temperature, humidity, wind speed, and pressure.
- **5-Day Forecast**: View a summarized weather forecast for the next five days.
- **Automatic Geolocation**: Automatically detects and displays the weather for the user's current location on page load.
- **Search by City**: Manually search for the weather in any city around the globe.
- **Interactive Map**: Visualizes the searched location on an interactive map using Leaflet.js.
- **Temperature Trend Chart**: A line chart displaying the temperature forecast for the next 24 hours.
- **Atmosphere Details**: Includes local sunrise/sunset times and the current Air Quality Index (AQI).

## Tech Stack

- **Backend**: Python, Flask
- **Frontend**: HTML, JavaScript, Tailwind CSS
- **APIs**: OpenWeatherMap (Current & Forecast, Air Pollution)
- **Libraries**:
  - `requests` (for making API calls in Python)
  - `python-dotenv` (for managing environment variables)
  - `gunicorn` (for production deployment)
  - `Chart.js` (for data visualization)
  - `Leaflet.js` (for the interactive map)

## Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. Clone the Repository
```bash
git clone https://github.com/sumanthd032/ClimaCast.git
cd ClimaCast
```

### 2. Set Up the Backend
Navigate to the backend directory and set up a Python virtual environment.
```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
Install all the required Python packages.
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
You need a free API key from OpenWeatherMap to fetch weather data.

Sign up on OpenWeatherMap and get your API key.

In the backend directory, create a new file named `.env`.

Add your API key to the `.env` file like this:
```
OPENWEATHER_API_KEY=your_actual_api_key_here
```

### 5. Run the Application
Start the Flask development server.
```bash
python app.py
```

The application will now be running at `http://127.0.0.1:5000`. Open this URL in your web browser to see the dashboard in action!