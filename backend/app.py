import os
from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')

API_KEY = os.getenv('OPENWEATHER_API_KEY')
BASE_URL = "http://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "http://api.openweathermap.org/data/2.5/forecast"

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

    params = {
        'q': city,
        'appid': API_KEY,
        'units': 'metric' 
    }

    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status() 
        current_weather = response.json()

        forecast_response = requests.get(FORECAST_URL, params=params)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        weather_data = {
            "current": current_weather,
            "forecast": forecast_data
        }

        return jsonify(weather_data)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": "An unexpected error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True)