/*
 * @Author: DaLong Li
 * @Date: 2026-02-06 15:30:28
 * @LastEditTime: 2026-02-06 15:37:14
 * @LastEditors: DaLong Li
 * @Description:
 * 生命在于运动，代码在于抽动。
 */
// 设置管理工具类
const STORAGE_KEY = 'calendar_api_settings';

const DEFAULT_SETTINGS = {
    weatherApi: 'https://restapi.amap.com/v3/weather/weatherInfo',
    weatherKey: '7d8e35ab2b1b5d9458b5bdaef24621d9',
    zodiacApi: 'http://web.juhe.cn/constellation/getAll',
    zodiacKey: '63553bcad1016ac89a4a60383b2c2bad',
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
                return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
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
