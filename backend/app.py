import os
from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')

# Get the API key from environment variables
API_KEY = os.getenv('OPENWEATHER_API_KEY')
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "http://api.openweathermap.org/data/2.5/forecast"
# NEW: Air Pollution API URL
AIR_POLLUTION_URL = "http://api.openweathermap.org/data/2.5/air_pollution"

@app.route('/')
def index():
    """Renders the main HTML page."""
    return render_template('index.html')

@app.route('/weather', methods=['GET'])
def get_weather():
    """
    Fetches weather data including Air Quality Index.
    """
    city = request.args.get('city')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    if not API_KEY:
        return jsonify({"error": "Weather API key not configured on the server."}), 500

    params = {
        'appid': API_KEY,
        'units': 'metric'
    }
    
    # Use coordinates if available, otherwise use city
    if lat and lon:
        params['lat'] = lat
        params['lon'] = lon
    elif city:
        params['q'] = city
    else:
        return jsonify({"error": "City or coordinates not provided"}), 400

    try:
        # Fetch current weather data
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        current_weather = response.json()

        # Use the coordinates from the first API call for subsequent calls
        # This ensures all data is for the exact same location
        coord_params = {
            'lat': current_weather['coord']['lat'],
            'lon': current_weather['coord']['lon'],
            'appid': API_KEY,
            'units': 'metric'
        }

        # Fetch 5-day forecast data
        forecast_response = requests.get(FORECAST_URL, params=coord_params)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        # NEW: Fetch Air Pollution data
        air_pollution_response = requests.get(AIR_POLLUTION_URL, params=coord_params)
        air_pollution_response.raise_for_status()
        air_pollution_data = air_pollution_response.json()

        # Combine all data into a single response
        weather_data = {
            "current": current_weather,
            "forecast": forecast_data,
            "air_quality": air_pollution_data
        }

        return jsonify(weather_data)

    except requests.exceptions.HTTPError as err:
        if err.response.status_code == 401:
            return jsonify({"error": "Invalid API Key. Please check your .env file."}), 401
        elif err.response.status_code == 404:
            return jsonify({"error": "Weather data not found for the specified location."}), 404
        else:
            return jsonify({"error": f"An HTTP error occurred: {err}"}), err.response.status_code

    except requests.exceptions.RequestException as err:
        return jsonify({"error": f"Could not connect to weather service: {err}"}), 503

    except Exception as e:
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500


if __name__ == '__main__':
    # Runs the Flask application
    app.run(debug=True)
