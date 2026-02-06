// 日程管理工具类
// 使用 tauri-plugin-sql (SQLite) 存储日程数据
import Database from '@tauri-apps/plugin-sql';

/**
 * 日程类型
 */
export const SCHEDULE_TYPES = {
    TODO: 'todo',
    EVENT: 'event',
    BIRTHDAY: 'birthday',
    ANNIVERSARY: 'anniversary',
    COUNTDOWN: 'countdown'
};

const DB_NAME = 'sqlite:calendar.db';
const STORAGE_KEY = 'calendar_schedules';

class ScheduleManager {
    constructor() {
        this.db = null;
        this.initPromise = this._init();
    }

    async _init() {
        if (this.db) return this.db;

        try {
            const db = await Database.load(DB_NAME);

            // 创建表
            await db.execute(`
                CREATE TABLE IF NOT EXISTS schedules (
                    id TEXT PRIMARY KEY,
                    type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT,
                    endDate TEXT,
                    endTime TEXT,
                    isAllDay INTEGER,
                    isLunar INTEGER,
                    reminder TEXT,
                    location TEXT,
                    note TEXT,
                    repeat TEXT,
                    createdAt INTEGER,
                    updatedAt INTEGER
                )
            `);

            this.db = db; // 先赋值 db，避免后续方法调用 ensureInit 时阻塞

            // 检查是否需要从 localStorage 迁移数据
            await this._migrateFromLocalStorage(db);

            return db;
        } catch (error) {
            console.error('初始化数据库失败:', error);
            throw error;
        }
    }

    async _migrateFromLocalStorage(db) {
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
            try {
                const schedules = JSON.parse(localData);
                if (Array.isArray(schedules) && schedules.length > 0) {
                    console.log(`从 localStorage 迁移 ${schedules.length} 条数据...`);
                    for (const s of schedules) {
                        // 直接通过 db 插入，避免调用 public addSchedule 引起死锁
                        await this._insertToDb(db, s, s.id);
                    }
                    localStorage.removeItem(STORAGE_KEY);
                    console.log('数据迁移完成');
                }
            } catch (e) {
                console.error('数据迁移失败:', e);
            }
        }
    }

    async ensureInit() {
        if (this.db) return this.db;
        return this.initPromise;
    }

    // 生成唯一ID
    generateId() {
        return `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 内部插入方法
    async _insertToDb(db, scheduleData, forceId = null) {
        const id = forceId || this.generateId();
        const now = Date.now();

        const schedule = {
            id: id,
            type: scheduleData.type || SCHEDULE_TYPES.EVENT,
            title: scheduleData.title || '',
            date: scheduleData.date || '',
            time: scheduleData.time || '',
            endDate: scheduleData.endDate || '',
            endTime: scheduleData.endTime || '',
            isAllDay: scheduleData.isAllDay !== undefined ? (scheduleData.isAllDay ? 1 : 0) : 1,
            isLunar: scheduleData.isLunar ? 1 : 0,
            reminder: scheduleData.reminder || '',
            location: scheduleData.location || '',
            note: scheduleData.note || '',
            repeat: scheduleData.repeat || 'none',
            createdAt: scheduleData.createdAt || now,
            updatedAt: now
        };

        await db.execute(
            `INSERT INTO schedules (
                id, type, title, date, time, endDate, endTime, 
                isAllDay, isLunar, reminder, location, note, repeat, createdAt, updatedAt
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                schedule.id,
                schedule.type,
                schedule.title,
                schedule.date,
                schedule.time,
                schedule.endDate,
                schedule.endTime,
                schedule.isAllDay,
                schedule.isLunar,
                schedule.reminder,
                schedule.location,
                schedule.note,
                schedule.repeat,
                schedule.createdAt,
                schedule.updatedAt
            ]
        );
        return schedule;
    }

    // 添加日程
    async addSchedule(scheduleData) {
        const db = await this.ensureInit();
        return this._insertToDb(db, scheduleData);
    }

    // 更新日程
    async updateSchedule(id, updates) {
        const db = await this.ensureInit();
        const now = Date.now();
        const keys = Object.keys(updates).filter((k) => k !== 'id' && k !== 'createdAt');
        if (keys.length === 0) return null;

        const values = keys.map((k) => {
            if (k === 'isAllDay' || k === 'isLunar') return updates[k] ? 1 : 0;
            return updates[k];
        });

        const setClause = keys.map((k) => `${k} = ?`).join(', ');
        values.push(now, id);

        await db.execute(`UPDATE schedules SET ${setClause}, updatedAt = ? WHERE id = ?`, values);
        return await this.getScheduleById(id);
    }

    async deleteSchedule(id) {
        const db = await this.ensureInit();
        await db.execute('DELETE FROM schedules WHERE id = ?', [id]);
        return true;
    }

    async getScheduleById(id) {
        const db = await this.ensureInit();
        const results = await db.select('SELECT * FROM schedules WHERE id = ?', [id]);
        return results[0] || null;
    }

    async getSchedulesByDate(date) {
        const db = await this.ensureInit();
        const schedules = await db.select(
            `SELECT * FROM schedules WHERE date = ? OR (endDate IS NOT NULL AND endDate != '' AND date <= ? AND endDate >= ?)`,
            [date, date, date]
        );
        return schedules.map((s) => ({
            ...s,
            isAllDay: !!s.isAllDay,
            isLunar: !!s.isLunar
        }));
    }

    async getSchedulesByMonth(year, month) {
        const db = await this.ensureInit();
        const monthStr = month.toString().padStart(2, '0');
        const prefix = `${year}-${monthStr}%`;
        const schedules = await db.select(`SELECT * FROM schedules WHERE date LIKE ?`, [prefix]);
        return schedules.map((s) => ({
            ...s,
            isAllDay: !!s.isAllDay,
            isLunar: !!s.isLunar
        }));
    }

    async getAllSchedules() {
        const db = await this.ensureInit();
        const schedules = await db.select('SELECT * FROM schedules ORDER BY date ASC, time ASC');
        return schedules.map((s) => ({
            ...s,
            isAllDay: !!s.isAllDay,
            isLunar: !!s.isLunar
        }));
    }

    async searchSchedules(keyword) {
        const db = await this.ensureInit();
        const searchVal = `%${keyword}%`;
        const schedules = await db.select(
            `SELECT * FROM schedules WHERE title LIKE ? OR location LIKE ? OR note LIKE ?`,
            [searchVal, searchVal, searchVal]
        );
        return schedules.map((s) => ({
            ...s,
            isAllDay: !!s.isAllDay,
            isLunar: !!s.isLunar
        }));
    }

    async clearAll() {
        const db = await this.ensureInit();
        await db.execute('DELETE FROM schedules');
    }
}

export default new ScheduleManager();
