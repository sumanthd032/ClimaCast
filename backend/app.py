import os
from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')

# Get the API key from environment variables
API_KEY = os.getenv('OPENWEATHER_API_KEY')
BASE_URL = "[http://api.openweathermap.org/data/2.5/weather](http://api.openweathermap.org/data/2.5/weather)"
FORECAST_URL = "[http://api.openweathermap.org/data/2.5/forecast](http://api.openweathermap.org/data/2.5/forecast)"

@app.route('/')
def index():
    """Renders the main HTML page."""
    return render_template('index.html')

@app.route('/weather', methods=['GET'])
def get_weather():
    """
    Fetches current weather and 5-day forecast data for a given city.
    The city is passed as a query parameter.
    """
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City not provided"}), 400

    # Parameters for the API request
    params = {
        'q': city,
        'appid': API_KEY,
        'units': 'metric'  # Use metric units (Celsius)
    }

    try:
        # Fetch current weather data
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes
        current_weather = response.json()

        # Fetch 5-day forecast data
        forecast_response = requests.get(FORECAST_URL, params=params)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        # Combine the data into a single response
        weather_data = {
            "current": current_weather,
            "forecast": forecast_data
        }

        return jsonify(weather_data)

    except requests.exceptions.RequestException as e:
        # For city not found, OpenWeatherMap returns a 404
        if e.response and e.response.status_code == 404:
             return jsonify({"error": "City not found. Please check the spelling."}), 404
        return jsonify({"error": "Could not connect to weather service."}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    # Runs the Flask application
    app.run(debug=True)