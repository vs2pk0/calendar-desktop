/*
 * @Author: DaLong Li
 * @Date: 2026-02-06 15:30:28
 * @LastEditTime: 2026-02-06 15:38:28
 * @LastEditors: DaLong Li
 * @Description:
 * 生命在于运动，代码在于抽动。
 */
// 设置管理工具类
const STORAGE_KEY = 'calendar_api_settings';

const DEFAULT_SETTINGS = {
    weatherApi: 'https://restapi.amap.com/v3/weather/weatherInfo',
    weatherKey: '7d8e35ab2b1b5d9458b5bdaef24621d9',
    zodiacApi: 'https://v2.xxapi.cn/api/horoscope',
    zodiacKey: 'free',
    holidayApi: 'https://timor.tech/api/holiday/year'
};

class SettingsManager {
    constructor() {
        this.settings = this._load();
    }

    _load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
                // 迁移逻辑：如果还是旧的聚合接口，强制更新为新的免费接口
                if (settings.zodiacApi && settings.zodiacApi.includes('juhe.cn')) {
                    settings.zodiacApi = DEFAULT_SETTINGS.zodiacApi;
                    settings.zodiacKey = DEFAULT_SETTINGS.zodiacKey;
                    // 保存更新后的设置
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
                }
                return settings;
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        }
        return { ...DEFAULT_SETTINGS };
    }

    get(key) {
        return this.settings[key];
    }

    getAll() {
        return { ...this.settings };
    }

    set(key, value) {
        this.settings[key] = value;
        this._save();
    }

    setAll(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this._save();
    }

    _save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    }

    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this._save();
    }
}

export default new SettingsManager();
