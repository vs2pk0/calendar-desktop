import { ref } from 'vue';
import { fetch } from '@tauri-apps/plugin-http';
import settingsManager from './settingsManager';
import dayjs from 'dayjs';

/*
 * 多天气源管理（数据来源：https://www.rinuo.com/free/weather 中列出的免费接口）
 * 支持 4 个可切换的免费天气源：
 *   1. Open-Meteo      —— 完全免费、无需 Key（默认）
 *   2. OpenWeatherMap  —— 需要 Key（免费 60 次/分钟）
 *   3. WeatherAPI.com  —— 需要 Key（免费 100 万次/月）
 *   4. Weatherbit      —— 需要 Key（免费 50 次/天）
 *
 * 各源返回数据统一映射为高德格式的 forecast 结构，
 * 保持 UI（RightPanel / 状态栏）无需感知数据源差异：
 *   { date, dayweather, nightweather, daytemp, nighttemp, daywind, daypower }
 */

export const WEATHER_PROVIDERS = [
    {
        id: 'open-meteo',
        name: 'Open-Meteo（免 Key）',
        needKey: false,
        doc: 'https://open-meteo.com/',
        maxDays: 14
    },
    {
        id: 'openweathermap',
        name: 'OpenWeatherMap',
        needKey: true,
        doc: 'https://openweathermap.org/api',
        maxDays: 5
    },
    {
        id: 'weatherapi',
        name: 'WeatherAPI.com',
        needKey: true,
        doc: 'https://www.weatherapi.com/',
        maxDays: 3
    },
    {
        id: 'weatherbit',
        name: 'Weatherbit',
        needKey: true,
        doc: 'https://www.weatherbit.io/',
        maxDays: 14
    }
];

// WMO 天气代码 → 中文（Open-Meteo 使用）
const WMO_WEATHER_MAP = {
    0: '晴',
    1: '晴间多云',
    2: '多云',
    3: '阴',
    45: '雾',
    48: '雾凇',
    51: '毛毛雨',
    53: '毛毛雨',
    55: '毛毛雨',
    56: '冻毛毛雨',
    57: '冻毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    66: '冻雨',
    67: '冻雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪粒',
    80: '阵雨',
    81: '强阵雨',
    82: '暴雨',
    85: '阵雪',
    86: '强阵雪',
    95: '雷暴',
    96: '雷阵雨伴冰雹',
    99: '雷阵雨伴冰雹'
};

const WIND_ABBR_MAP = {
    N: '北', NNE: '北东北', NE: '东北', ENE: '东东北',
    E: '东', ESE: '东东南', SE: '东南', SSE: '南东南',
    S: '南', SSW: '南西南', SW: '西南', WSW: '西西南',
    W: '西', WNW: '西西北', NW: '西北', NNW: '北西北'
};

// 角度 → 中文风向
function windDirFromDeg(deg) {
    if (deg == null || isNaN(deg)) return '';
    const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    return dirs[Math.round(deg / 45) % 8] + '风';
}

// km/h → 风力等级（蒲福风级近似）
function windLevelFromKmh(kmh) {
    if (kmh == null || isNaN(kmh)) return '';
    const thresholds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118];
    let level = 0;
    for (const t of thresholds) {
        if (kmh >= t) level++;
    }
    return level <= 3 ? '≤3级' : `${level}级`;
}

class WeatherManager {
    constructor() {
        this.todayWeather = ref(null);
        this.selectedWeather = ref(null);
        this.weatherForecasts = ref([]);
    }

    getProvider() {
        const id = settingsManager.get('weatherProvider') || 'open-meteo';
        return WEATHER_PROVIDERS.find((p) => p.id === id) || WEATHER_PROVIDERS[0];
    }

    // 当前数据源支持的最大预报天数
    getSupportedDays() {
        return this.getProvider().maxDays || 7;
    }

    getKey(providerId) {
        const keys = settingsManager.get('weatherKeys') || {};
        return keys[providerId] || '';
    }

    /**
     * 拉取指定城市（城市名，如 "北京"）的天气预报并统一格式
     */
    async fetchWeather(cityName) {
        const city = cityName || '北京';
        const provider = this.getProvider();
        try {
            let forecasts = null;
            switch (provider.id) {
                case 'openweathermap':
                    forecasts = await this._fetchOpenWeatherMap(city);
                    break;
                case 'weatherapi':
                    forecasts = await this._fetchWeatherApi(city);
                    break;
                case 'weatherbit':
                    forecasts = await this._fetchWeatherbit(city);
                    break;
                default:
                    forecasts = await this._fetchOpenMeteo(city);
            }
            if (forecasts && forecasts.length > 0) {
                this.weatherForecasts.value = forecasts;
                this.updateToday();
                return forecasts;
            }
        } catch (error) {
            console.error(`获取天气失败 [${provider.id}]:`, error);
        }
        return null;
    }

    // ---------- 数据源实现 ----------

    // 1. Open-Meteo：免 Key，先地理编码再取 7 天预报
    async _fetchOpenMeteo(city) {
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`,
            { method: 'GET' }
        );
        const geo = await geoRes.json();
        const loc = geo.results && geo.results[0];
        if (!loc) throw new Error(`未找到城市: ${city}`);

        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
                `&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant` +
                `&timezone=auto&forecast_days=16`,
            { method: 'GET' }
        );
        const data = await res.json();
        const d = data.daily;
        if (!d || !d.time) return null;

        return d.time.map((date, i) => {
            const text = WMO_WEATHER_MAP[d.weather_code[i]] || '未知';
            return {
                date,
                dayweather: text,
                nightweather: text,
                daytemp: Math.round(d.temperature_2m_max[i]),
                nighttemp: Math.round(d.temperature_2m_min[i]),
                daywind: windDirFromDeg(d.wind_direction_10m_dominant[i]),
                daypower: windLevelFromKmh(d.wind_speed_10m_max[i])
            };
        });
    }

    // 2. OpenWeatherMap：免费 5 天/3 小时间隔预报，聚合为按天数据
    async _fetchOpenWeatherMap(city) {
        const key = this.getKey('openweathermap');
        if (!key) throw new Error('未配置 OpenWeatherMap API Key');
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${key}&units=metric&lang=zh_cn`,
            { method: 'GET' }
        );
        const data = await res.json();
        if (!data.list) throw new Error(data.message || 'OpenWeatherMap 返回异常');

        // 按日期分组
        const byDate = {};
        for (const item of data.list) {
            const date = item.dt_txt.slice(0, 10);
            const hour = parseInt(item.dt_txt.slice(11, 13), 10);
            (byDate[date] = byDate[date] || []).push({
                hour,
                temp: item.main.temp,
                desc: item.weather[0]?.description || '',
                windDeg: item.wind?.deg,
                windSpeedKmh: (item.wind?.speed || 0) * 3.6
            });
        }

        const pickClosest = (entries, targetHour) =>
            entries.reduce((a, b) => (Math.abs(b.hour - targetHour) < Math.abs(a.hour - targetHour) ? b : a));

        return Object.keys(byDate)
            .sort()
            .map((date) => {
                const entries = byDate[date];
                const dayEntry = pickClosest(entries, 14);
                const nightEntry = pickClosest(entries, 2);
                return {
                    date,
                    dayweather: dayEntry.desc,
                    nightweather: nightEntry.desc,
                    daytemp: Math.round(Math.max(...entries.map((e) => e.temp))),
                    nighttemp: Math.round(Math.min(...entries.map((e) => e.temp))),
                    daywind: windDirFromDeg(dayEntry.windDeg),
                    daypower: windLevelFromKmh(dayEntry.windSpeedKmh)
                };
            });
    }

    // 3. WeatherAPI.com：一次返回 7 天预报
    async _fetchWeatherApi(city) {
        const key = this.getKey('weatherapi');
        if (!key) throw new Error('未配置 WeatherAPI.com API Key');
        const res = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${encodeURIComponent(city)}&days=3&lang=zh`,
            { method: 'GET' }
        );
        const data = await res.json();
        const days = data.forecast && data.forecast.forecastday;
        if (!days) throw new Error(data.error?.message || 'WeatherAPI 返回异常');

        return days.map((d) => ({
            date: d.date,
            dayweather: d.day.condition.text,
            nightweather: d.day.condition.text,
            daytemp: Math.round(d.day.maxtemp_c),
            nighttemp: Math.round(d.day.mintemp_c),
            daywind: '',
            daypower: windLevelFromKmh(d.day.maxwind_kph)
        }));
    }

    // 4. Weatherbit：免费档支持 16 天每日预报
    async _fetchWeatherbit(city) {
        const key = this.getKey('weatherbit');
        if (!key) throw new Error('未配置 Weatherbit API Key');
        const res = await fetch(
            `https://api.weatherbit.io/v2.0/forecast/daily?city=${encodeURIComponent(city)}&key=${key}&lang=zh&days=16`,
            { method: 'GET' }
        );
        const data = await res.json();
        if (!data.data) throw new Error('Weatherbit 返回异常');

        return data.data.map((d) => ({
            date: d.valid_date,
            dayweather: d.weather.description,
            nightweather: d.weather.description,
            daytemp: Math.round(d.max_temp),
            nighttemp: Math.round(d.min_temp),
            daywind: WIND_ABBR_MAP[d.wind_cdir] ? `${WIND_ABBR_MAP[d.wind_cdir]}风` : '',
            daypower: windLevelFromKmh((d.wind_spd || 0) * 3.6)
        }));
    }

    // ---------- 统一的数据访问层 ----------

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
