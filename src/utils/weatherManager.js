import { ref } from 'vue';
import { fetch } from '@tauri-apps/plugin-http';
import settingsManager from './settingsManager';
import dayjs from 'dayjs';

class WeatherManager {
    constructor() {
        this.todayWeather = ref(null);
        this.selectedWeather = ref(null);
        this.weatherForecasts = ref([]);
    }

    async fetchWeather(adcode) {
        try {
            const weatherApi = settingsManager.get('weatherApi');
            const weatherKey = settingsManager.get('weatherKey');
            if (!weatherApi || !weatherKey) return null;

            const res = await fetch(`${weatherApi}?city=${adcode}&key=${weatherKey}&extensions=all`, {
                method: 'GET'
            });
            const data = await res.json();

            if (data.status === '1' && data.forecasts && data.forecasts.length > 0) {
                this.weatherForecasts.value = data.forecasts[0].casts;
                this.updateToday();
                return this.weatherForecasts.value;
            }
        } catch (error) {
            console.error('Failed to fetch weather data:', error);
        }
        return null;
    }

    updateToday() {
        const todayStr = dayjs().format('YYYY-MM-DD');
        const match = this.weatherForecasts.value.find((f) => f.date === todayStr);
        if (match) {
            this.todayWeather.value = {
                weather:
                    match.dayweather === match.nightweather
                        ? match.dayweather
                        : `${match.dayweather}转${match.nightweather}`,
                temp_day: match.daytemp,
                temp_night: match.nighttemp,
                date: match.date
            };
        }
    }

    updateSelected(dateStr, cityName) {
        const match = this.weatherForecasts.value.find((f) => f.date === dateStr);
        if (match) {
            this.selectedWeather.value = {
                city: cityName,
                weather:
                    match.dayweather === match.nightweather
                        ? match.dayweather
                        : `${match.dayweather}转${match.nightweather}`,
                temp_day: match.daytemp,
                temp_night: match.nighttemp,
                daywind: match.daywind,
                daypower: match.daypower,
                date: match.date
            };
        } else {
            this.selectedWeather.value = null;
        }
    }

    getToday() {
        return this.todayWeather.value;
    }

    getSelected() {
        return this.selectedWeather.value;
    }

    // Compatibility method
    update(data) {
        this.todayWeather.value = data;
    }

    // Compatibility method
    get() {
        return this.todayWeather.value;
    }
}

export default new WeatherManager();
