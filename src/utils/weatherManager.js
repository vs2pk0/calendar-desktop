import { ref } from 'vue';

class WeatherManager {
    constructor() {
        this.currentWeather = ref(null);
    }

    update(data) {
        this.currentWeather.value = data;
    }

    get() {
        return this.currentWeather.value;
    }
}

export default new WeatherManager();
