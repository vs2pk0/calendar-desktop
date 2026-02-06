<template>
    <div class="right-panel">
        <!-- Date Info Card -->
        <div class="info-card today-info">
            <div class="date-summary">
                {{ dateSummary }}
            </div>
            <div class="create-btn-wrapper">
                <a-button type="text" class="create-schedule-btn" @click="showScheduleModal">
                    <plus-circle-filled style="color: #597ef7; font-size: 16px; margin-right: 8px" />
                    创建日程
                </a-button>
            </div>
        </div>

        <!-- Lunar Detail Card -->
        <div v-if="subscribedIds.includes('huangli')" class="info-card lunar-card">
            <div class="lunar-date-header">农历 {{ lunarString }}</div>
            <div class="lunar-detail">
                {{ lunarYearInfo }}
            </div>
            <div class="yi-ji-container">
                <div class="yi-row">
                    <span class="yi-label">宜</span>
                    <span class="yi-content">{{ yi }}</span>
                </div>
                <div class="ji-row">
                    <span class="ji-label">忌</span>
                    <span class="ji-content">{{ ji }}</span>
                </div>
            </div>
        </div>

        <!-- My Schedule Card -->
        <div v-if="subscribedIds.includes('schedule')" class="info-card schedule-card">
            <div class="schedule-header">
                <div class="header-left">
                    <calendar-two-tone two-tone-color="#1890ff" />
                    <span class="schedule-title">日程安排</span>
                </div>
                <a-button type="primary" size="small" shape="round" class="create-btn" @click="showScheduleModal">
                    <template #icon><plus-outlined /></template>
                    新建
                </a-button>
            </div>

            <div v-if="todaySchedules.length === 0" class="empty-schedule-box">
                <div class="empty-icon">📂</div>
                <div class="empty-text">今日暂无日程安排</div>
                <a-button type="link" size="small" @click="showScheduleModal">立即添加</a-button>
            </div>
            <div v-else class="schedule-container">
                <div v-for="item in todaySchedules" :key="item.id" class="schedule-card-item">
                    <div class="type-indicator" :class="'indicator-' + item.type"></div>
                    <div class="item-body">
                        <div class="item-top">
                            <div class="item-info">
                                <div class="item-title-row">
                                    <span class="item-title">{{ item.title }}</span>
                                </div>
                                <div class="item-meta-row">
                                    <span class="item-type-tag" :class="'tag-' + item.type">
                                        {{ getScheduleTypeName(item.type) }}
                                    </span>
                                    <span class="item-time">
                                        <clock-circle-outlined style="font-size: 12px; margin-right: 4px" />
                                        {{ item.isAllDay ? '全天' : item.time }}
                                    </span>
                                </div>
                            </div>
                            <div class="item-ops">
                                <a-button type="text" size="small" class="op-btn" @click="editSchedule(item)">
                                    <template #icon><edit-outlined /></template>
                                </a-button>
                                <a-button
                                    type="text"
                                    size="small"
                                    danger
                                    class="op-btn"
                                    @click="deleteSchedule(item.id)"
                                >
                                    <template #icon><delete-outlined /></template>
                                </a-button>
                            </div>
                        </div>
                        <div v-if="item.location || item.note" class="item-extra">
                            <div v-if="item.location" class="extra-line">
                                <environment-outlined /> {{ item.location }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Subscribed Content Cards -->
        <div class="subscribed-cards">
            <!-- Weather Card -->
            <div v-if="subscribedIds.includes('weather')" class="info-card weather-card">
                <div class="card-header">
                    <span class="card-title">天气预报</span>
                    <setting-outlined class="card-setting" @click="showWeatherSettings" />
                </div>
                <div class="weather-main">
                    <div class="weather-icon">
                        <cloud-filled style="font-size: 48px; color: #69c0ff" />
                    </div>
                    <div class="weather-temp">
                        14°C
                        <span class="weather-air">空气良 83</span>
                    </div>
                </div>
                <div class="weather-detail-text">3°/14°C 阴 | 东北风2级 | 湿度 46%</div>
                <div class="weather-forecast">
                    <div class="forecast-item">
                        <cloud-filled /> -2° / 9°C <br />
                        <span class="f-day">明天 | 雨夹雪转阴</span>
                    </div>
                    <div class="forecast-item">
                        <cloud-filled /> -3° / 4°C <br />
                        <span class="f-day">后天 | 多云转晴</span>
                    </div>
                </div>
            </div>

            <!-- World Clock Card -->
            <div v-if="subscribedIds.includes('worldClock')" class="info-card clock-card">
                <div class="card-header">
                    <span class="card-title">世界时钟</span>
                    <setting-outlined class="card-setting" />
                </div>
                <div class="clocks-container">
                    <div class="clock-item">
                        <div class="analog-clock">
                            <div
                                class="hand hour"
                                :style="{ transform: `rotate(${(now.hour() % 12) * 30 + now.minute() * 0.5}deg)` }"
                            ></div>
                            <div class="hand min" :style="{ transform: `rotate(${now.minute() * 6}deg)` }"></div>
                            <div class="hand sec" :style="{ transform: `rotate(${now.second() * 6}deg)` }"></div>
                        </div>
                        <div class="clock-info">
                            <div class="c-date">{{ beijingDate }} {{ beijingTime }}</div>
                            <div class="c-name">北京</div>
                        </div>
                    </div>
                    <div class="clock-item">
                        <div class="analog-clock">
                            <div
                                class="hand hour"
                                :style="{
                                    transform: `rotate(${(now.add(-13, 'hour').hour() % 12) * 30 + now.minute() * 0.5}deg)`
                                }"
                            ></div>
                            <div class="hand min" :style="{ transform: `rotate(${now.minute() * 6}deg)` }"></div>
                            <div class="hand sec" :style="{ transform: `rotate(${now.second() * 6}deg)` }"></div>
                        </div>
                        <div class="clock-info">
                            <div class="c-date">{{ nyDate }} {{ nyTime }}</div>
                            <div class="c-name">纽约 <span class="diff">-13小时</span></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Traffic Restriction Card -->
            <div v-if="subscribedIds.includes('traffic')" class="info-card traffic-card">
                <div class="card-header">
                    <span class="card-title">城市限行 <small>北京</small></span>
                    <setting-outlined class="card-setting" />
                </div>
                <div class="traffic-content">
                    <div class="t-item">
                        <span class="t-label">周四 10-1</span>
                        <span class="t-value">不限行</span>
                    </div>
                    <div class="t-item">
                        <span class="t-label">周五 10-2</span>
                        <span class="t-value">不限行</span>
                    </div>
                </div>
            </div>

            <!-- Zodiac Card -->
            <div v-if="subscribedIds.includes('zodiac')" class="info-card zodiac-card">
                <div class="card-header">
                    <div class="card-title-group">
                        <span class="card-title">星座运势</span>
                    </div>
                    <a-select
                        v-model:value="selectedZodiac"
                        size="small"
                        class="zodiac-selector"
                        @change="fetchZodiac"
                        :bordered="false"
                    >
                        <a-select-option v-for="z in zodiacs" :key="z.value" :value="z.value">
                            {{ z.name }}
                        </a-select-option>
                    </a-select>
                </div>
                <div v-if="zodiacLoading" class="zodiac-loading">
                    <a-spin size="small" />
                </div>
                <div v-else-if="zodiacInfo" class="zodiac-content">
                    <div class="zodiac-main">
                        <div class="zodiac-fortune-item">
                            <span class="f-label">综合指数</span>
                            <a-rate
                                :value="parseInt(zodiacInfo.fortunetext?.all || 0) / 20"
                                disabled
                                class="small-rate"
                            />
                        </div>
                        <div class="zodiac-fortune-item">
                            <span class="f-label">爱情指数</span>
                            <a-rate
                                :value="parseInt(zodiacInfo.fortunetext?.love || 0) / 20"
                                disabled
                                class="small-rate"
                            />
                        </div>
                    </div>
                    <div class="zodiac-tag-row">
                        <span class="z-tag">幸运色：{{ zodiacInfo.luckycolor }}</span>
                        <span class="z-tag">幸运数：{{ zodiacInfo.luckynumber }}</span>
                    </div>
                    <div class="zodiac-desc">
                        {{ zodiacInfo.description || '今日运势平稳，适合处理琐事。' }}
                    </div>
                </div>
                <div v-else class="zodiac-empty">
                    获取数据失败，请重试
                    <a-button type="link" size="small" @click="fetchZodiac">刷新</a-button>
                </div>
            </div>

            <!-- Huangli Card -->
            <div v-if="subscribedIds.includes('huangli')" class="info-card huangli-card">
                <div class="card-header">
                    <span class="card-title">黄历运势</span>
                    <setting-outlined class="card-setting" />
                </div>
                <div class="huangli-content">
                    <div class="h-item h-yi">
                        <div class="h-label">宜</div>
                        <div class="h-list">{{ yi }}</div>
                    </div>
                    <div class="h-item h-ji">
                        <div class="h-label">忌</div>
                        <div class="h-list">{{ ji }}</div>
                    </div>
                </div>
            </div>

            <!-- Edit Subscriptions Button -->
            <div class="edit-subscription-btn-container">
                <a-button shape="round" @click="$emit('edit-subscription')">编辑订阅</a-button>
            </div>
        </div>

        <!-- Weather City Settings Modal -->
        <a-modal
            v-model:open="weatherSettingsVisible"
            title="天气设置"
            width="400px"
            @ok="handleWeatherSettingsOk"
            ok-text="确定"
            cancel-text="取消"
        >
            <div style="padding: 20px 0">
                <div style="margin-bottom: 12px; font-weight: 500">选择城市：</div>
                <a-select
                    v-model:value="weatherCityAdcode"
                    style="width: 100%"
                    show-search
                    placeholder="选择一个城市"
                    option-filter-prop="label"
                >
                    <a-select-option
                        v-for="city in majorCities"
                        :key="city.adcode"
                        :value="city.adcode"
                        :label="city.name"
                    >
                        {{ city.name }}
                    </a-select-option>
                </a-select>
                <div style="margin-top: 12px; font-size: 12px; color: #8c8c8c">
                    提示：目前支持全国主要城市，选择后点击确定刷新天气数据。
                </div>
            </div>
        </a-modal>

        <!-- Bottom Tools (Icons) -->
        <div class="bottom-tools">
            <div class="tool-item" @click="showCalendarConverter">
                <div class="tool-icon" style="background: #ff7875"><calendar-outlined /></div>
                <span>公农历转换</span>
            </div>
            <div class="tool-item" @click="showHolidayList">
                <div class="tool-icon" style="background: #ff9c6e"><gift-outlined /></div>
                <span>节日大全</span>
            </div>
            <div class="tool-item" @click="showDateCalculator">
                <div class="tool-icon" style="background: #9254de"><calculator-outlined /></div>
                <span>日期计算</span>
            </div>
            <div class="tool-item" @click="showAllTools">
                <div class="tool-icon custom-more">...</div>
                <span>全部</span>
            </div>
        </div>

        <!-- 公农历转换弹窗 -->
        <a-modal
            v-model:open="calendarConverterVisible"
            title="公农历转换"
            width="500px"
            ok-text="确定"
            cancel-text="取消"
            @ok="calendarConverterVisible = false"
        >
            <div style="padding: 20px 0">
                <a-space direction="vertical" style="width: 100%" :size="16">
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">选择公历日期：</div>
                        <a-date-picker v-model:value="converterDate" style="width: 100%" />
                    </div>
                    <a-divider />
                    <div v-if="converterDate">
                        <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">
                            转换结果
                        </div>
                        <div class="converter-result">
                            <div class="result-item">
                                <span class="label">公历：</span>
                                <span class="value">{{ converterDate.format('YYYY年MM月DD日') }}</span>
                            </div>
                            <div class="result-item">
                                <span class="label">农历：</span>
                                <span class="value">{{ getLunarDate(converterDate) }}</span>
                            </div>
                            <div class="result-item">
                                <span class="label">干支：</span>
                                <span class="value">{{ getLunarGanZhi(converterDate) }}</span>
                            </div>
                            <div class="result-item">
                                <span class="label">生肖：</span>
                                <span class="value">{{ getLunarZodiac(converterDate) }}年</span>
                            </div>
                            <div class="result-item" v-if="getLunarFestival(converterDate)">
                                <span class="label">节日：</span>
                                <span class="value" style="color: #ff4d4f">{{ getLunarFestival(converterDate) }}</span>
                            </div>
                        </div>
                    </div>
                </a-space>
            </div>
        </a-modal>

        <!-- 节日大全弹窗 -->
        <a-modal
            v-model:open="holidayListVisible"
            title="2026年节日大全"
            width="600px"
            ok-text="确定"
            cancel-text="取消"
            @ok="holidayListVisible = false"
        >
            <div style="max-height: 500px; overflow-y: auto">
                <a-tabs v-model:active-key="holidayTab">
                    <a-tab-pane key="legal" tab="法定节假日">
                        <a-list :data-source="legalHolidays" size="small">
                            <template #renderItem="{ item }">
                                <a-list-item>
                                    <a-list-item-meta>
                                        <template #title>
                                            <span style="color: #ff4d4f; font-weight: 500">{{ item.name }}</span>
                                        </template>
                                        <template #description>
                                            {{ item.date }}
                                            <span v-if="item.days" style="margin-left: 8px; color: #52c41a">
                                                (放假{{ item.days }}天)
                                            </span>
                                        </template>
                                    </a-list-item-meta>
                                </a-list-item>
                            </template>
                        </a-list>
                    </a-tab-pane>
                    <a-tab-pane key="traditional" tab="传统节日">
                        <a-list :data-source="traditionalHolidays" size="small">
                            <template #renderItem="{ item }">
                                <a-list-item>
                                    <a-list-item-meta>
                                        <template #title>{{ item.name }}</template>
                                        <template #description>{{ item.lunarDate }}</template>
                                    </a-list-item-meta>
                                </a-list-item>
                            </template>
                        </a-list>
                    </a-tab-pane>
                    <a-tab-pane key="solar" tab="24节气">
                        <a-list :data-source="solarTerms" :grid="{ gutter: 16, column: 2 }" size="small">
                            <template #renderItem="{ item }">
                                <a-card size="small">
                                    <div style="text-align: center">
                                        <div style="font-weight: 500; margin-bottom: 4px">{{ item.name }}</div>
                                        <div style="color: #888; font-size: 12px">{{ item.date }}</div>
                                    </div>
                                </a-card>
                            </template>
                        </a-list>
                    </a-tab-pane>
                </a-tabs>
            </div>
        </a-modal>

        <!-- 日期计算弹窗 -->
        <a-modal
            v-model:open="dateCalculatorVisible"
            title="日期计算器"
            width="500px"
            ok-text="确定"
            cancel-text="取消"
            @ok="dateCalculatorVisible = false"
        >
            <div style="padding: 20px 0">
                <a-space direction="vertical" style="width: 100%" :size="16">
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">开始日期：</div>
                        <a-date-picker v-model:value="calcStartDate" style="width: 100%" />
                    </div>
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">结束日期：</div>
                        <a-date-picker v-model:value="calcEndDate" style="width: 100%" />
                    </div>
                    <a-divider />
                    <div v-if="calcStartDate && calcEndDate">
                        <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">
                            计算结果
                        </div>
                        <div class="converter-result">
                            <div class="result-item">
                                <span class="label">相差天数：</span>
                                <span class="value" style="color: #52c41a; font-size: 20px; font-weight: 600">
                                    {{ Math.abs(calcEndDate.diff(calcStartDate, 'day')) }} 天
                                </span>
                            </div>
                            <div class="result-item">
                                <span class="label">相差周数：</span>
                                <span class="value"
                                    >{{ Math.floor(Math.abs(calcEndDate.diff(calcStartDate, 'day')) / 7) }} 周</span
                                >
                            </div>
                            <div class="result-item">
                                <span class="label">相差月数：</span>
                                <span class="value">{{ Math.abs(calcEndDate.diff(calcStartDate, 'month')) }} 个月</span>
                            </div>
                            <div class="result-item">
                                <span class="label">相差年数：</span>
                                <span class="value">{{ Math.abs(calcEndDate.diff(calcStartDate, 'year')) }} 年</span>
                            </div>
                        </div>
                    </div>
                </a-space>
            </div>
        </a-modal>

        <!-- 全部工具弹窗 -->
        <a-modal
            v-model:open="allToolsVisible"
            title="全部工具"
            width="600px"
            ok-text="确定"
            cancel-text="取消"
            @ok="allToolsVisible = false"
        >
            <div class="all-tools-grid">
                <div class="tool-card" @click="showCalendarConverter">
                    <div class="tool-card-icon" style="background: #ff7875">
                        <calendar-outlined style="font-size: 24px" />
                    </div>
                    <div class="tool-card-title">公农历转换</div>
                    <div class="tool-card-desc">公历农历互转</div>
                </div>
                <div class="tool-card" @click="showHolidayList">
                    <div class="tool-card-icon" style="background: #ff9c6e">
                        <gift-outlined style="font-size: 24px" />
                    </div>
                    <div class="tool-card-title">节日大全</div>
                    <div class="tool-card-desc">查看所有节日</div>
                </div>
                <div class="tool-card" @click="showDateCalculator">
                    <div class="tool-card-icon" style="background: #9254de">
                        <calculator-outlined style="font-size: 24px" />
                    </div>
                    <div class="tool-card-title">日期计算</div>
                    <div class="tool-card-desc">计算日期差异</div>
                </div>
                <div class="tool-card" @click="showCountdown">
                    <div class="tool-card-icon" style="background: #40a9ff">
                        <clock-circle-outlined style="font-size: 24px" />
                    </div>
                    <div class="tool-card-title">倒数日</div>
                    <div class="tool-card-desc">重要日期倒计时</div>
                </div>
                <div class="tool-card" @click="showPerpetualCalendar">
                    <div class="tool-card-icon" style="background: #73d13d">
                        <calendar-two-tone style="font-size: 24px" />
                    </div>
                    <div class="tool-card-title">万年历</div>
                    <div class="tool-card-desc">查询历史日期</div>
                </div>
                <div class="tool-card" @click="showLuckyDay">
                    <div class="tool-card-icon" style="background: #ffd666">
                        <star-outlined style="font-size: 24px" />
                    </div>
                    <div class="tool-card-title">吉日查询</div>
                    <div class="tool-card-desc">黄道吉日查询</div>
                </div>
            </div>
        </a-modal>

        <!-- 倒数日弹窗 -->
        <a-modal
            v-model:open="countdownVisible"
            title="倒数日"
            width="500px"
            ok-text="确定"
            cancel-text="取消"
            @ok="countdownVisible = false"
        >
            <div style="padding: 20px 0">
                <a-space direction="vertical" style="width: 100%" :size="16">
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">目标日期：</div>
                        <a-date-picker v-model:value="countdownTargetDate" style="width: 100%" />
                    </div>
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">事件名称：</div>
                        <a-input v-model:value="countdownEventName" placeholder="例如：我的生日" />
                    </div>
                    <a-divider />
                    <div v-if="countdownTargetDate">
                        <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">倒计时</div>
                        <div class="converter-result">
                            <div style="text-align: center; padding: 20px 0">
                                <div style="font-size: 14px; color: #666; margin-bottom: 8px">
                                    {{ countdownEventName || '目标日期' }}
                                </div>
                                <div style="font-size: 48px; font-weight: 700; color: #1890ff; margin-bottom: 8px">
                                    {{ getCountdownDays(countdownTargetDate) }}
                                </div>
                                <div style="font-size: 16px; color: #666">
                                    {{ getCountdownDays(countdownTargetDate) >= 0 ? '天后到达' : '天前已过' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </a-space>
            </div>
        </a-modal>

        <!-- 万年历弹窗 -->
        <a-modal
            v-model:open="perpetualCalendarVisible"
            title="万年历查询"
            width="600px"
            ok-text="确定"
            cancel-text="取消"
            @ok="perpetualCalendarVisible = false"
        >
            <div style="padding: 20px 0">
                <a-space direction="vertical" style="width: 100%" :size="16">
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">选择日期：</div>
                        <a-date-picker v-model:value="perpetualDate" style="width: 100%" />
                    </div>
                    <a-divider />
                    <div v-if="perpetualDate">
                        <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">
                            日期详情
                        </div>
                        <div class="converter-result">
                            <div class="result-item">
                                <span class="label">公历：</span>
                                <span class="value"
                                    >{{ perpetualDate.format('YYYY年MM月DD日') }} {{ getWeekDay(perpetualDate) }}</span
                                >
                            </div>
                            <div class="result-item">
                                <span class="label">农历：</span>
                                <span class="value">{{ getLunarDate(perpetualDate) }}</span>
                            </div>
                            <div class="result-item">
                                <span class="label">干支：</span>
                                <span class="value">{{ getLunarGanZhi(perpetualDate) }}</span>
                            </div>
                            <div class="result-item">
                                <span class="label">生肖：</span>
                                <span class="value">{{ getLunarZodiac(perpetualDate) }}年</span>
                            </div>
                            <div class="result-item" v-if="getLunarFestival(perpetualDate)">
                                <span class="label">节日：</span>
                                <span class="value" style="color: #ff4d4f">{{ getLunarFestival(perpetualDate) }}</span>
                            </div>
                            <div class="result-item" v-if="getPerpetualTerm(perpetualDate)">
                                <span class="label">节气：</span>
                                <span class="value" style="color: #52c41a">{{ getPerpetualTerm(perpetualDate) }}</span>
                            </div>
                        </div>
                    </div>
                </a-space>
            </div>
        </a-modal>

        <!-- 吉日查询弹窗 -->
        <a-modal
            v-model:open="luckyDayVisible"
            title="黄道吉日查询"
            width="600px"
            ok-text="确定"
            cancel-text="取消"
            @ok="luckyDayVisible = false"
        >
            <div style="padding: 20px 0">
                <a-space direction="vertical" style="width: 100%" :size="16">
                    <div>
                        <div style="margin-bottom: 8px; font-weight: 500">选择日期：</div>
                        <a-date-picker v-model:value="luckyDate" style="width: 100%" />
                    </div>
                    <a-divider />
                    <div v-if="luckyDate">
                        <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: #1890ff">
                            宜忌事项
                        </div>
                        <div class="converter-result">
                            <div style="margin-bottom: 16px">
                                <div
                                    style="
                                        font-weight: 600;
                                        color: #52c41a;
                                        margin-bottom: 8px;
                                        display: flex;
                                        align-items: center;
                                    "
                                >
                                    <span
                                        style="
                                            display: inline-block;
                                            width: 4px;
                                            height: 16px;
                                            background: #52c41a;
                                            margin-right: 8px;
                                        "
                                    ></span>
                                    宜
                                </div>
                                <div style="color: #333; line-height: 1.8; padding-left: 12px">
                                    {{ getLuckyYi(luckyDate) }}
                                </div>
                            </div>
                            <div>
                                <div
                                    style="
                                        font-weight: 600;
                                        color: #ff4d4f;
                                        margin-bottom: 8px;
                                        display: flex;
                                        align-items: center;
                                    "
                                >
                                    <span
                                        style="
                                            display: inline-block;
                                            width: 4px;
                                            height: 16px;
                                            background: #ff4d4f;
                                            margin-right: 8px;
                                        "
                                    ></span>
                                    忌
                                </div>
                                <div style="color: #333; line-height: 1.8; padding-left: 12px">
                                    {{ getLuckyJi(luckyDate) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </a-space>
            </div>
        </a-modal>

        <!-- 日程管理弹窗 -->
        <ScheduleModal
            v-model="scheduleModalVisible"
            :initial-date="currentDateObj.format('YYYY-MM-DD')"
            :editing-schedule="editingSchedule"
            @saved="handleScheduleSaved"
        />
    </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted, createVNode } from 'vue';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import { Lunar, Solar } from 'lunar-javascript';
import {
    PlusCircleFilled,
    PlusOutlined,
    CloudFilled,
    CalendarOutlined,
    GiftOutlined,
    CalculatorOutlined,
    ClockCircleOutlined,
    CalendarTwoTone,
    StarOutlined,
    CheckSquareOutlined,
    HeartOutlined,
    EditOutlined,
    DeleteOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    SettingOutlined
} from '@ant-design/icons-vue';
import ScheduleModal from './ScheduleModal.vue';
import scheduleManager from '../utils/scheduleManager';

dayjs.extend(weekOfYear);
dayjs.extend(dayOfYear);

const props = defineProps(['selectedDate']);
const emit = defineEmits(['refresh-calendar']); // 添加事件以刷新日历

import { Modal, message } from 'ant-design-vue';
import { fetch } from '@tauri-apps/plugin-http';
import subscriptionManager from '../utils/subscriptionManager';

// 订阅数据
const subscribedIds = subscriptionManager.subscribedIds;

// 星座数据
const zodiacLoading = ref(false);
const zodiacInfo = ref(null);
const selectedZodiac = ref(localStorage.getItem('selected_zodiac') || 'aries');
const zodiacs = [
    { name: '白羊座', value: 'aries' },
    { name: '金牛座', value: 'taurus' },
    { name: '双子座', value: 'gemini' },
    { name: '巨蟹座', value: 'cancer' },
    { name: '狮子座', value: 'leo' },
    { name: '处女座', value: 'virgo' },
    { name: '天秤座', value: 'libra' },
    { name: '天蝎座', value: 'scorpio' },
    { name: '射手座', value: 'sagittarius' },
    { name: '摩羯座', value: 'capricorn' },
    { name: '水瓶座', value: 'aquarius' },
    { name: '双鱼座', value: 'pisces' }
];

async function fetchZodiac() {
    if (!subscriptionManager.isSubscribed('zodiac')) return;
    try {
        zodiacLoading.value = true;
        localStorage.setItem('selected_zodiac', selectedZodiac.value);
        // 使用韩小韩免费API
        const res = await fetch(`https://api.vvhan.com/api/horoscope?type=${selectedZodiac.value}&time=today`);
        const data = await res.json();
        if (data.success) {
            zodiacInfo.value = data.data;
        }
    } catch (e) {
        console.error('获取星座运势失败:', e);
    } finally {
        zodiacLoading.value = false;
    }
}

// 天气数据
const weatherData = ref(null);
const weatherLoading = ref(false);
const weatherSettingsVisible = ref(false);
const weatherCityAdcode = ref(
    (() => {
        const saved = localStorage.getItem('weather_adcode');
        // 中国天气网编码通常为9位，旧的高德编码为6位
        return saved && saved.length === 9 ? saved : '101010100';
    })()
);
const weatherCityName = ref(localStorage.getItem('weather_city_name') || '北京');

const majorCities = [
    { name: '北京', adcode: '101010100' },
    { name: '上海', adcode: '101020100' },
    { name: '广州', adcode: '101280101' },
    { name: '深圳', adcode: '101280601' },
    { name: '杭州', adcode: '101210101' },
    { name: '成都', adcode: '101270101' },
    { name: '武汉', adcode: '101200101' },
    { name: '西安', adcode: '101110101' },
    { name: '南京', adcode: '101190101' },
    { name: '浦口', adcode: '101190107' },
    { name: '重庆', adcode: '101040100' },
    { name: '苏州', adcode: '101190401' },
    { name: '天津', adcode: '101030100' },
    { name: '郑州', adcode: '101180101' },
    { name: '长沙', adcode: '101250101' },
    { name: '福州', adcode: '101230101' },
    { name: '沈阳', adcode: '101070101' },
    { name: '哈尔滨', adcode: '101050101' },
    { name: '济南', adcode: '101120101' },
    { name: '青岛', adcode: '101120201' },
    { name: '大连', adcode: '101070201' },
    { name: '宁波', adcode: '101210401' },
    { name: '厦门', adcode: '101230201' }
];

function showWeatherSettings() {
    weatherSettingsVisible.value = true;
}

function handleWeatherSettingsOk() {
    const city = majorCities.find((c) => c.adcode === weatherCityAdcode.value);
    if (city) {
        weatherCityName.value = city.name;
        localStorage.setItem('weather_adcode', city.adcode);
        localStorage.setItem('weather_city_name', city.name);
    }
    weatherSettingsVisible.value = false;
    fetchWeather();
}

// 世界时钟逻辑
const now = ref(dayjs());
let clockTimer = null;

function updateClocks() {
    now.value = dayjs();
}

onMounted(() => {
    clockTimer = setInterval(updateClocks, 1000);
});

onUnmounted(() => {
    if (clockTimer) clearInterval(clockTimer);
});

// 计算北京和纽约时间
const beijingTime = computed(() => now.value.format('HH:mm:ss'));
const beijingDate = computed(() => now.value.format('M月D日'));

const nyTime = computed(() => now.value.add(-13, 'hour').format('HH:mm:ss'));
const nyDate = computed(() => now.value.add(-13, 'hour').format('M月D日'));

// 假期数据
const holidayData = ref({});

// 模态框状态
const calendarConverterVisible = ref(false);
const holidayListVisible = ref(false);
const dateCalculatorVisible = ref(false);
const allToolsVisible = ref(false);
const countdownVisible = ref(false);
const perpetualCalendarVisible = ref(false);
const luckyDayVisible = ref(false);

// 日程管理相关
const scheduleModalVisible = ref(false);
const todaySchedules = ref([]);
const editingSchedule = ref(null);

// 加载当天日程
async function loadTodaySchedules() {
    const dateStr = currentDateObj.value.format('YYYY-MM-DD');
    todaySchedules.value = await scheduleManager.getSchedulesByDate(dateStr);
}

// 显示日程弹窗
function showScheduleModal() {
    editingSchedule.value = null; // 清空编辑状态
    scheduleModalVisible.value = true;
}

// 编辑日程
function editSchedule(schedule) {
    editingSchedule.value = JSON.parse(JSON.stringify(schedule)); // 深拷贝
    scheduleModalVisible.value = true;
}

// 删除日程
async function deleteSchedule(id) {
    Modal.confirm({
        title: '确定要删除这个日程吗？',
        icon: createVNode(ExclamationCircleOutlined, { style: 'color: #ff4d4f' }),
        content: '删除后将无法恢复',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
            try {
                await scheduleManager.deleteSchedule(id);
                await loadTodaySchedules();
                emit('refresh-calendar'); // 刷新日历标记
                message.success('日程已删除');
            } catch (e) {
                console.error('删除日程失败:', e);
                message.error('删除失败');
            }
        }
    });
}

// 处理日程保存
function handleScheduleSaved(schedule) {
    console.log('日程已保存:', schedule);
    loadTodaySchedules();
    emit('refresh-calendar'); // 刷新日历标记
}

// 公农历转换相关
const converterDate = ref(dayjs());

// 日期计算相关
const calcStartDate = ref(dayjs());
const calcEndDate = ref(dayjs().add(30, 'day'));

// 倒数日相关
const countdownTargetDate = ref(dayjs().add(100, 'day'));
const countdownEventName = ref('');

// 万年历相关
const perpetualDate = ref(dayjs());

// 吉日查询相关
const luckyDate = ref(dayjs());

// 节日tab
const holidayTab = ref('legal');

const currentDateObj = computed(() => {
    return props.selectedDate ? dayjs(props.selectedDate.dateObj) : dayjs();
});

const dateSummary = computed(() => {
    const d = currentDateObj.value;
    const isToday = d.isSame(dayjs(), 'day');
    return `${d.year()}年第${d.week()}周 第${d.dayOfYear()}天 ${isToday ? '今天' : ''}`;
});

const lunarObj = computed(() => {
    return Lunar.fromDate(currentDateObj.value.toDate());
});

const lunarString = computed(() => {
    return `${lunarObj.value.getMonthInChinese()}月${lunarObj.value.getDayInChinese()}`;
});

const lunarYearInfo = computed(() => {
    // e.g. 丙午 马年 ...
    const l = lunarObj.value;
    return `${l.getYearInGanZhi()} ${l.getYearShengXiao()}年 ${l.getMonthInGanZhi()}月 ${l.getDayInGanZhi()}日 ${l.getTimeZhi()}时`;
});

const yi = computed(() => lunarObj.value.getDayYi().join(' '));
const ji = computed(() => lunarObj.value.getDayJi().join(' '));

// 节日数据
const legalHolidays = ref([
    { name: '元旦', date: '2026-01-01', days: 3 },
    { name: '春节', date: '2026-02-17~02-23', days: 7 },
    { name: '清明节', date: '2026-04-05~04-07', days: 3 },
    { name: '劳动节', date: '2026-05-01~05-03', days: 3 },
    { name: '端午节', date: '2026-06-25~06-27', days: 3 },
    { name: '中秋节', date: '2026-10-06~10-08', days: 3 },
    { name: '国庆节', date: '2026-10-01~10-07', days: 7 }
]);

const traditionalHolidays = ref([
    { name: '除夕', lunarDate: '农历腊月三十' },
    { name: '春节', lunarDate: '农历正月初一' },
    { name: '元宵节', lunarDate: '农历正月十五' },
    { name: '龙抬头', lunarDate: '农历二月初二' },
    { name: '清明节', lunarDate: '清明节气' },
    { name: '端午节', lunarDate: '农历五月初五' },
    { name: '七夕节', lunarDate: '农历七月初七' },
    { name: '中元节', lunarDate: '农历七月十五' },
    { name: '中秋节', lunarDate: '农历八月十五' },
    { name: '重阳节', lunarDate: '农历九月初九' },
    { name: '寒衣节', lunarDate: '农历十月初一' },
    { name: '冬至节', lunarDate: '冬至节气' },
    { name: '腊八节', lunarDate: '农历腊月初八' }
]);

const solarTerms = ref([
    { name: '立春', date: '2月3-5日' },
    { name: '雨水', date: '2月18-20日' },
    { name: '惊蛰', date: '3月5-7日' },
    { name: '春分', date: '3月20-22日' },
    { name: '清明', date: '4月4-6日' },
    { name: '谷雨', date: '4月19-21日' },
    { name: '立夏', date: '5月5-7日' },
    { name: '小满', date: '5月20-22日' },
    { name: '芒种', date: '6月5-7日' },
    { name: '夏至', date: '6月21-22日' },
    { name: '小暑', date: '7月6-8日' },
    { name: '大暑', date: '7月22-24日' },
    { name: '立秋', date: '8月7-9日' },
    { name: '处暑', date: '8月22-24日' },
    { name: '白露', date: '9月7-9日' },
    { name: '秋分', date: '9月22-24日' },
    { name: '寒露', date: '10月8-9日' },
    { name: '霜降', date: '10月23-24日' },
    { name: '立冬', date: '11月7-8日' },
    { name: '小雪', date: '11月22-23日' },
    { name: '大雪', date: '12月6-8日' },
    { name: '冬至', date: '12月21-23日' },
    { name: '小寒', date: '1月5-7日' },
    { name: '大寒', date: '1月20-21日' }
]);

// 工具按钮点击事件
function showCalendarConverter() {
    calendarConverterVisible.value = true;
    allToolsVisible.value = false;
}

function showHolidayList() {
    holidayListVisible.value = true;
    allToolsVisible.value = false;
}

function showDateCalculator() {
    dateCalculatorVisible.value = true;
    allToolsVisible.value = false;
}

function showAllTools() {
    allToolsVisible.value = true;
}

// 农历转换辅助函数
function getLunarDate(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
}

function getLunarGanZhi(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;
}

function getLunarZodiac(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return lunar.getYearShengXiao();
}

function getLunarFestival(date) {
    const lunar = Lunar.fromDate(date.toDate());
    const festivals = lunar.getFestivals();
    return festivals.length > 0 ? festivals.join('、') : null;
}

// 获取天气数据（使用中国天气网天气接口）
async function fetchWeather() {
    if (!subscriptionManager.isSubscribed('weather')) return;
    try {
        weatherLoading.value = true;
        const code = weatherCityAdcode.value;
        const timestamp = Date.now();

        // 1. 获取实况天气 (SK)
        const skRes = await fetch(`https://d1.weather.com.cn/sk_2d/${code}.html?_=${timestamp}`, {
            method: 'GET',
            headers: {
                Referer: 'https://e.weather.com.cn/'
            }
        });
        const skText = await skRes.text();
        // 解析格式：var dataSK = {...};
        const skData = JSON.parse(skText.replace(/^var\s+\w+\s*=\s*/, '').replace(/;?$/, ''));

        // 2. 获取预报数据 (40d)
        const fcRes = await fetch(`https://d1.weather.com.cn/wap_40d/${code}.html?_=${timestamp}`, {
            method: 'GET',
            headers: {
                Referer: 'https://e.weather.com.cn/'
            }
        });
        const fcText = await fcRes.text();
        // 解析格式：var fc40 = [...];
        const fcData = JSON.parse(fcText.replace(/^var\s+\w+\s*=\s*/, '').replace(/;?$/, ''));

        // 转换数据格式以适配现有 UI
        weatherData.value = {
            city: skData.cityname,
            weather: skData.weather,
            temperature: skData.temp,
            temperature_float: skData.temp,
            winddirection: skData.WD,
            windpower: skData.WS,
            humidity: skData.SD,
            reporttime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            forecasts: fcData.slice(1, 3).map((item) => ({
                date: dayjs(item['009'], 'YYYYMMDD').format('YYYY-MM-DD'),
                dayweather: getWeatherByCode(item['001']),
                nightweather: getWeatherByCode(item['002']),
                daytemp: item['003'],
                nighttemp: item['004']
            }))
        };
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
    } finally {
        weatherLoading.value = false;
    }
}

// 辅助函数：根据天气代码获取描述
function getWeatherByCode(code) {
    const codeMap = {
        '00': '晴',
        '01': '多云',
        '02': '阴',
        '03': '阵雨',
        '04': '雷阵雨',
        '05': '雷阵雨伴有冰雹',
        '06': '雨夹雪',
        '07': '小雨',
        '08': '中雨',
        '09': '大雨',
        10: '暴雨',
        13: '阵雪',
        14: '小雪',
        15: '中雪',
        16: '大雪',
        17: '暴雪',
        18: '雾',
        19: '冻雨',
        20: '沙尘暴',
        31: '霾',
        53: '霾'
    };
    return codeMap[code] || '未知';
}

// 获取假期数据
async function fetchHolidays() {
    try {
        const year = dayjs().year();
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`);
        const data = await response.json();

        if (data.code === 0) {
            holidayData.value = data.holiday || {};
        }
    } catch (error) {
        console.error('获取假期数据失败:', error);
    }
}

onMounted(() => {
    fetchWeather();
    fetchHolidays();
    loadTodaySchedules();
    fetchZodiac();
});

// 显示新功能的函数
function showCountdown() {
    countdownVisible.value = true;
    allToolsVisible.value = false;
}

function showPerpetualCalendar() {
    perpetualCalendarVisible.value = true;
    allToolsVisible.value = false;
}

function showLuckyDay() {
    luckyDayVisible.value = true;
    allToolsVisible.value = false;
}

// 倒数日计算
function getCountdownDays(targetDate) {
    const today = dayjs();
    const target = dayjs(targetDate);
    return target.diff(today, 'day');
}

// 获取星期
function getWeekDay(date) {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekDays[date.day()];
}

// 获取节气
function getPerpetualTerm(date) {
    const lunar = Lunar.fromDate(date.toDate());
    return lunar.getJieQi();
}

// 获取宜
function getLuckyYi(date) {
    const lunar = Lunar.fromDate(date.toDate());
    const yi = lunar.getDayYi();
    return yi.length > 0 ? yi.join(' ') : '诸事不宜';
}

// 获取忌
function getLuckyJi(date) {
    const lunar = Lunar.fromDate(date.toDate());
    const ji = lunar.getDayJi();
    return ji.length > 0 ? ji.join(' ') : '百无禁忌';
}

// 获取日程类型名称
function getScheduleTypeName(type) {
    const types = {
        todo: '待办',
        event: '日程',
        birthday: '生日',
        anniversary: '纪念日',
        countdown: '倒数'
    };
    return types[type] || '其他';
}

// 暴露方法给父组件
defineExpose({
    showAllTools
});

// 监听日期变化，更新天气和日程
watch(currentDateObj, () => {
    fetchWeather();
    loadTodaySchedules();
});
</script>

<style scoped>
.right-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-left: 16px;
    gap: 16px;
    font-size: 14px;
    overflow-x: hidden; /* 防止横向滚动 */
    overflow-y: auto; /* 允许纵向滚动 */
}

.info-card {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.subscribed-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.today-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.date-summary {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 12px;
}

.create-btn-wrapper {
    width: 100%;
    text-align: center;
}
.create-schedule-btn {
    font-size: 15px;
    color: #597ef7;
}

.lunar-card {
    flex-grow: 1; /* allow it to expand slightly */
}

.lunar-date-header {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}
.lunar-detail {
    color: #666;
    font-size: 12px;
    margin-bottom: 12px;
}
.yi-row,
.ji-row {
    display: flex;
    margin-bottom: 4px;
}
.yi-label {
    color: #52c41a;
    font-weight: bold;
    margin-right: 8px;
    min-width: 20px;
}
.ji-label {
    color: #ff4d4f;
    font-weight: bold;
    margin-right: 8px;
    min-width: 20px;
}
.yi-content,
.ji-content {
    color: #555;
    line-height: 1.4;
}

.weather-card {
    background: linear-gradient(to right bottom, #ffffff, #f0f5ff);
}
.weather-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.weather-temp {
    font-size: 32px;
    font-weight: 300;
    position: relative;
}
.weather-desc {
    font-size: 12px;
    background: #faad14;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    position: absolute;
    top: 0;
    right: -50px;
}
.weather-detail-text {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
}
.weather-forecast {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-size: 12px;
    color: #888;
}
.forecast-item {
    text-align: center;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.card-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}
.card-setting {
    cursor: pointer;
    color: #bfbfbf;
    font-size: 14px;
}
.card-setting:hover {
    color: #1890ff;
}

.weather-air {
    font-size: 12px;
    background: #faad14;
    color: white;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 8px;
    vertical-align: middle;
}

.f-day {
    font-size: 11px;
    color: #bfbfbf;
}

/* 世界时钟样式 */
.clocks-container {
    display: flex;
    justify-content: space-around;
    padding: 8px 0;
}
.clock-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}
.analog-clock {
    width: 64px;
    height: 64px;
    border: 2px solid #333;
    border-radius: 50%;
    position: relative;
    background: white;
}
.analog-clock::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: #333;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    margin: -2px 0 0 -2px;
}
.hand {
    position: absolute;
    bottom: 50%;
    left: 50%;
    transform-origin: bottom center;
    background: #333;
    border-radius: 2px;
}
.hand.hour {
    width: 3px;
    height: 18px;
    margin-left: -1.5px;
}
.hand.min {
    width: 2px;
    height: 24px;
    margin-left: -1px;
}
.hand.sec {
    width: 1px;
    height: 28px;
    background: #ff4d4f;
    margin-left: -0.5px;
}
.clock-info {
    text-align: center;
}
.c-date {
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 2px;
}
.c-name {
    font-size: 14px;
    color: #333;
    font-weight: 500;
}
.diff {
    font-size: 11px;
    color: #bfbfbf;
    font-weight: normal;
}

/* 城市限行样式 */
.traffic-content {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    background: #f8faff;
    border-radius: 8px;
}
.t-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.t-label {
    font-size: 12px;
    color: #8c8c8c;
}
.t-value {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

/* 星座运势样式 */
.zodiac-card {
    background: linear-gradient(to right bottom, #ffffff, #f9f0ff);
}
.zodiac-selector {
    width: 90px;
    margin-right: -8px;
}
.zodiac-selector :deep(.ant-select-selector) {
    color: #722ed1 !important;
    font-weight: 600;
}
.zodiac-loading {
    padding: 20px;
    text-align: center;
}
.zodiac-main {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
}
.zodiac-fortune-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.f-label {
    font-size: 12px;
    color: #8c8c8c;
}
.small-rate {
    font-size: 12px;
}
.zodiac-tag-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
}
.z-tag {
    font-size: 11px;
    padding: 2px 8px;
    background: rgba(114, 46, 209, 0.1);
    color: #722ed1;
    border-radius: 4px;
}
.zodiac-desc {
    font-size: 13px;
    color: #595959;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.zodiac-empty {
    text-align: center;
    padding: 10px;
    color: #bfbfbf;
    font-size: 12px;
}

/* 黄历运势样式 */
.huangli-card {
    background: linear-gradient(to right bottom, #ffffff, #fff7e6);
}
.huangli-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.h-item {
    display: flex;
    gap: 12px;
}
.h-label {
    width: 24px;
    height: 24px;
    min-width: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
}
.h-yi .h-label {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
}
.h-ji .h-label {
    background: #fff1f0;
    color: #f5222d;
    border: 1px solid #ffa39e;
}
.h-list {
    font-size: 13px;
    color: #262626;
    line-height: 1.6;
}

.edit-subscription-btn-container {
    text-align: center;
    padding: 10px 0;
}
.edit-subscription-btn-container :deep(.ant-btn) {
    background: #f0f2f5;
    border: none;
    color: #595959;
    font-size: 13px;
    padding: 0 24px;
}
.edit-subscription-btn-container :deep(.ant-btn:hover) {
    background: #e6e8eb;
    color: #262626;
}

.bottom-tools {
    display: flex;
    justify-content: space-between;
    margin-top: auto; /* push to bottom */
}
.tool-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: #333;
    cursor: pointer;
    transition: all 0.2s;
}
.tool-item:hover {
    transform: translateY(-2px);
}
.tool-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    margin-bottom: 4px;
}
.custom-more {
    background: #f0f0f0;
    color: #999;
}

/* 公农历转换样式 */
.converter-result {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 8px;
}
.result-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}
.result-item:last-child {
    margin-bottom: 0;
}
.result-item .label {
    min-width: 80px;
    font-weight: 500;
    color: #666;
}
.result-item .value {
    color: #333;
    font-size: 15px;
}

/* 全部工具网格 */
.all-tools-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 16px 0;
}
.tool-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border-radius: 12px;
    background: #f9f9f9;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
}
.tool-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: #1890ff;
    background: white;
}
.tool-card-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    margin-bottom: 12px;
    transition: all 0.3s;
}
.tool-card:hover .tool-card-icon {
    transform: scale(1.1);
}
.tool-card-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    color: #333;
}
.tool-card-desc {
    font-size: 12px;
    color: #999;
    text-align: center;
}

/* 日程卡片优化样式 */
.schedule-card {
    padding: 14px !important;
}
.schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
}
.header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
}
.schedule-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.schedule-card-item {
    position: relative;
    background: #f8faff;
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.2s;
    border: 1px solid transparent;
}
.schedule-card-item:hover {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #e6f7ff;
}
.type-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
}
.indicator-event {
    background: #1890ff;
}
.indicator-todo {
    background: #52c41a;
}
.indicator-birthday {
    background: #eb2f96;
}
.indicator-anniversary {
    background: #f5222d;
}
.indicator-countdown {
    background: #722ed1;
}

.item-body {
    padding: 10px 12px 10px 14px;
}
.item-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.item-info {
    flex: 1;
    overflow: hidden;
}
.item-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}
.item-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}
.item-type-tag {
    font-size: 10px;
    padding: 0 6px;
    border-radius: 4px;
    line-height: 18px;
}
.tag-event {
    background: #e6f7ff;
    color: #1890ff;
}
.tag-todo {
    background: #f6ffed;
    color: #52c41a;
}
.tag-birthday {
    background: #fff0f6;
    color: #eb2f96;
}
.tag-anniversary {
    background: #fff1f0;
    color: #f5222d;
}
.tag-countdown {
    background: #f9f0ff;
    color: #722ed1;
}

.item-time {
    font-size: 12px;
    color: #8c8c8c;
}
.item-ops {
    display: flex;
    gap: 4px;
    opacity: 0.3;
    transition: all 0.2s;
}
.schedule-card-item:hover .item-ops {
    opacity: 1;
}
.op-btn {
    padding: 0 4px;
    height: 24px;
    width: 24px;
}
.item-extra {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #f0f0f0;
    font-size: 12px;
    color: #8c8c8c;
}
.empty-schedule-box {
    text-align: center;
    padding: 24px 0;
    background: #fafafa;
    border-radius: 8px;
    border: 1px dashed #d9d9d9;
}
.empty-icon {
    font-size: 28px;
    margin-bottom: 8px;
}
.empty-text {
    color: #bfbfbf;
    font-size: 13px;
}
</style>
