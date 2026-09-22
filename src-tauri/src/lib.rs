/*
 * @Author: DaLong Li
 * @Date: 2026-02-05 15:45:33
 * @LastEditTime: 2026-09-20 17:15:00
 * @LastEditors: DaLong Li
 * @Description:
 * 生命在于运动，代码在于抽动。
 */
use std::sync::{Mutex, OnceLock};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 状态栏显示配置：由前端同步过来。
/// template 中使用占位符（如 {YYYY} {MM} {DD} {ddd} {HH} {mm} {ss}），
/// 天气、城市等动态文本由前端替换好后再传入。
struct TrayConfig {
    show: bool,
    template: String,
    last_title: String,
    /// 当前状态栏是否显示图标（None = 尚未同步过）。
    /// 显示时间时只显示文字（宽度自适应）；关闭时间显示时用图标作为点击入口。
    icon_shown: Option<bool>,
}

impl Default for TrayConfig {
    fn default() -> Self {
        Self {
            show: false,
            template: String::new(),
            last_title: String::new(),
            icon_shown: None,
        }
    }
}

/// 状态栏图标（关闭时间显示时作为唤起窗口的入口）
fn tray_icon_image() -> tauri::image::Image<'static> {
    tauri::image::Image::from_bytes(include_bytes!("../icons/32x32.png")).expect("内置状态栏图标解析失败")
}

fn tray_config() -> &'static Mutex<TrayConfig> {
    static CONFIG: OnceLock<Mutex<TrayConfig>> = OnceLock::new();
    CONFIG.get_or_init(|| Mutex::new(TrayConfig::default()))
}

/// 前端同步状态栏显示配置（开关 + 模板）。
/// 真正的按秒计时在 Rust 后台线程执行，窗口隐藏 / WebView 挂起后时间依然正常走动。
#[tauri::command]
fn sync_tray_config(app: tauri::AppHandle, show: bool, template: String) {
    {
        let mut cfg = tray_config().lock().unwrap();
        cfg.show = show;
        cfg.template = template;
    }
    // 立即刷新一次，不用等下一个 tick
    tick_tray_title(&app);
}

/// 把模板中的占位符替换为当前本地时间
fn render_tray_template(template: &str) -> String {
    use chrono::{Datelike, Local, Timelike};

    let now = Local::now();
    let wd_idx = now.weekday().num_days_from_sunday() as usize;
    let weekday_cn = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    let weekday_full_cn = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    let wd = weekday_cn[wd_idx];
    let weekday_full = weekday_full_cn[wd_idx].to_string();
    let hour12 = {
        let h = now.hour() % 12;
        if h == 0 {
            12
        } else {
            h
        }
    };
    let ampm_upper = if now.hour() < 12 { "AM" } else { "PM" };
    let ampm_lower = if now.hour() < 12 { "am" } else { "pm" };

    // 注意：必须先替换长的占位符，再替换短的（如 {dddd} 先于 {ddd}，{MM} 先于 {M}）
    let pairs: [(&str, String); 20] = [
        ("{YYYY}", format!("{:04}", now.year())),
        ("{dddd}", weekday_full),
        ("{ddd}", wd.to_string()),
        ("{MM}", format!("{:02}", now.month())),
        ("{DD}", format!("{:02}", now.day())),
        ("{HH}", format!("{:02}", now.hour())),
        ("{hh}", format!("{:02}", hour12)),
        ("{mm}", format!("{:02}", now.minute())),
        ("{ss}", format!("{:02}", now.second())),
        ("{M}", format!("{}", now.month())),
        ("{D}", format!("{}", now.day())),
        ("{H}", format!("{}", now.hour())),
        ("{h}", format!("{}", hour12)),
        ("{m}", format!("{}", now.minute())),
        ("{s}", format!("{}", now.second())),
        ("{A}", ampm_upper.to_string()),
        ("{a}", ampm_lower.to_string()),
        ("{YY}", format!("{:02}", now.year() % 100)),
        ("{city}", String::new()),
        ("{temp}", String::new()),
    ];

    let mut out = template.to_string();
    for (k, v) in pairs {
        out = out.replace(k, &v);
    }
    out
}

fn tick_tray_title(app: &tauri::AppHandle) {
    let title = {
        let cfg = tray_config().lock().unwrap();
        if cfg.show && !cfg.template.is_empty() {
            render_tray_template(&cfg.template)
        } else {
            String::new()
        }
    };

    // 有文字时不显示图标，让状态栏项宽度完全跟随文字；无文字时显示图标作为点击入口
    let want_icon = title.is_empty();
    let (title_changed, icon_changed) = {
        let cfg = tray_config().lock().unwrap();
        (cfg.last_title != title, cfg.icon_shown != Some(want_icon))
    };
    if !title_changed && !icon_changed {
        return;
    }

    let Some(tray) = app.tray_by_id("main-tray") else { return };
    if icon_changed {
        let icon = if want_icon { Some(tray_icon_image()) } else { None };
        match tray.set_icon(icon) {
            Ok(()) => tray_config().lock().unwrap().icon_shown = Some(want_icon),
            Err(error) => eprintln!("状态栏图标更新失败: {error}"),
        }
    }
    if title_changed {
        match tray.set_title(Some(&title)) {
            Ok(()) => tray_config().lock().unwrap().last_title = title,
            Err(error) => eprintln!("状态栏更新失败: {error}"),
        }
    }
}

/// 启动原生后台计时线程：不受 WebView 挂起（App Nap）影响，
/// 解决窗口隐藏一段时间后状态栏时间/日期不走的问题。
fn start_tray_clock(app: tauri::AppHandle) {
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_millis(500));
        // 兜底：计时线程内的任何 panic 都不允许拖垮整个应用
        let _ = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            tick_tray_title(&app);
        }));
    });
}

/// macOS 26（Tahoe）状态栏归属诊断与修复。
///
/// Tahoe 起第三方状态栏项由 ControlCenter 统一托管，允许名单保存在
/// `~/Library/Group Containers/group.com.apple.controlcenter/Library/Preferences/group.com.apple.controlcenter.plist`
/// 的 `trackedApplications`（内嵌 binary plist）中。已知两类会让状态栏项"创建成功但永远不显示"的状态：
/// 1. 本应用条目 `isAllowed = false`（用户在 系统设置 → 菜单栏 中关闭了）；
/// 2. 本应用的 bundle id 被写进了**另一个** app 条目的 `menuItemLocations`，且那个 app `isAllowed = false`。
///    从终端 / IDE 直接启动应用时，macOS 会把状态栏项归属到启动它的父应用，从而产生这种孤儿映射，
///    此后无论如何重启都会被 ControlCenter 归入 blocked 列表（日志表现为 "Moving host to blocked list"）。
#[cfg(target_os = "macos")]
mod tray_tahoe {
    use std::path::PathBuf;

    pub const BUNDLE_ID: &str = "com.yunxiaoli.app";
    const TRACKED_KEY: &str = "trackedApplications";

    #[derive(serde::Serialize, Default)]
    pub struct TrayRegistration {
        /// 是否成功读取到 ControlCenter 的登记信息（非 Tahoe 或读取失败时为 false）
        pub available: bool,
        /// 本应用自身条目的 isAllowed；None 表示尚未登记
        pub allowed: Option<bool>,
        /// 把本应用列入自己 menuItemLocations 且被禁止显示的其他应用（真正造成屏蔽的元凶）
        pub blocked_by: Vec<String>,
        /// 把本应用列入自己 menuItemLocations 但仍允许显示的其他应用（暂无影响，一旦被关闭就会连带屏蔽）
        pub attributed_to: Vec<String>,
        pub error: Option<String>,
    }

    fn plist_path() -> Option<PathBuf> {
        let home = std::env::var_os("HOME")?;
        Some(PathBuf::from(home).join(
            "Library/Group Containers/group.com.apple.controlcenter/Library/Preferences/group.com.apple.controlcenter.plist",
        ))
    }

    fn bundle_of(loc: &plist::Value) -> Option<&str> {
        loc.as_dictionary()?
            .get("bundle")?
            .as_dictionary()?
            .get("_0")?
            .as_string()
    }

    /// 读取内层 trackedApplications 数组
    fn read_tracked() -> Result<Vec<plist::Value>, String> {
        let path = plist_path().ok_or("无法定位用户目录")?;
        let outer = plist::Value::from_file(&path).map_err(|e| format!("读取 ControlCenter 配置失败: {e}"))?;
        let data = outer
            .as_dictionary()
            .and_then(|d| d.get(TRACKED_KEY))
            .and_then(|v| v.as_data())
            .ok_or("配置中没有 trackedApplications")?;
        let inner = plist::Value::from_reader(std::io::Cursor::new(data))
            .map_err(|e| format!("解析 trackedApplications 失败: {e}"))?;
        inner.into_array().ok_or_else(|| "trackedApplications 不是数组".to_string())
    }

    pub fn inspect() -> TrayRegistration {
        let entries = match read_tracked() {
            Ok(e) => e,
            Err(e) => {
                return TrayRegistration {
                    error: Some(e),
                    ..Default::default()
                }
            }
        };
        let mut reg = TrayRegistration {
            available: true,
            ..Default::default()
        };
        for entry in &entries {
            let Some(dict) = entry.as_dictionary() else { continue };
            let Some(locations) = dict.get("menuItemLocations").and_then(|v| v.as_array()) else { continue };
            let owner = dict.get("location").and_then(bundle_of);
            let allowed = dict.get("isAllowed").and_then(|v| v.as_boolean()).unwrap_or(false);
            if owner == Some(BUNDLE_ID) {
                reg.allowed = Some(allowed);
                continue;
            }
            if locations.iter().any(|l| bundle_of(l) == Some(BUNDLE_ID)) {
                let name = owner.unwrap_or("unknown").to_string();
                if allowed {
                    reg.attributed_to.push(name);
                } else {
                    reg.blocked_by.push(name);
                }
            }
        }
        reg
    }

    /// 清理孤儿映射：把本应用从其他 app 的 menuItemLocations 中移除，并把自身 isAllowed 置为 true。
    /// 修改前把原始 plist 备份到 backup_dir；写入走 `defaults`（经 cfprefsd，避免被其缓存覆盖），
    /// 最后重启 ControlCenter 让其重新读取（launchd 会自动拉起）。
    pub fn repair(backup_dir: PathBuf) -> Result<String, String> {
        let path = plist_path().ok_or("无法定位用户目录")?;
        let mut entries = read_tracked()?;
        let changed = strip_orphan_mappings(&mut entries);
        if changed.is_empty() {
            return Ok("ControlCenter 登记信息正常，无需修复".into());
        }

        std::fs::create_dir_all(&backup_dir).map_err(|e| format!("创建备份目录失败: {e}"))?;
        let stamp = chrono::Local::now().format("%Y%m%d-%H%M%S");
        let backup = backup_dir.join(format!("group.com.apple.controlcenter.{stamp}.plist"));
        std::fs::copy(&path, &backup).map_err(|e| format!("备份失败: {e}"))?;

        let hex = encode_tracked(entries)?;
        // defaults 以路径作为域名时不带 .plist 后缀
        let domain = path.with_extension("");
        let status = std::process::Command::new("/usr/bin/defaults")
            .arg("write")
            .arg(&domain)
            .arg(TRACKED_KEY)
            .arg("-data")
            .arg(&hex)
            .status()
            .map_err(|e| format!("执行 defaults 失败: {e}"))?;
        if !status.success() {
            return Err("defaults write 执行失败".into());
        }

        let _ = std::process::Command::new("/usr/bin/killall").arg("ControlCenter").status();

        Ok(format!("已修复：{}。原配置已备份到 {}", changed.join("；"), backup.display()))
    }

    /// 纯逻辑：移除其他 app 对本应用的归属映射、确保自身 isAllowed = true。返回变更描述。
    pub fn strip_orphan_mappings(entries: &mut [plist::Value]) -> Vec<String> {
        let mut changed: Vec<String> = Vec::new();
        for entry in entries.iter_mut() {
            let Some(dict) = entry.as_dictionary_mut() else { continue };
            let owner = dict.get("location").and_then(bundle_of).map(str::to_string);
            if owner.as_deref() == Some(BUNDLE_ID) {
                if dict.get("isAllowed").and_then(|v| v.as_boolean()) != Some(true) {
                    dict.insert("isAllowed".into(), plist::Value::Boolean(true));
                    changed.push(format!("{BUNDLE_ID} 设为允许显示"));
                }
                continue;
            }
            let Some(locations) = dict.get_mut("menuItemLocations").and_then(|v| v.as_array_mut()) else { continue };
            let before = locations.len();
            locations.retain(|l| bundle_of(l) != Some(BUNDLE_ID));
            if locations.len() != before {
                changed.push(format!("解除与 {} 的归属关联", owner.unwrap_or_else(|| "unknown".into())));
            }
        }
        changed
    }

    /// 把内层数组序列化为 binary plist 的 hex 字串（供 `defaults write -data` 使用）
    pub fn encode_tracked(entries: Vec<plist::Value>) -> Result<String, String> {
        let mut buf = Vec::new();
        plist::Value::Array(entries)
            .to_writer_binary(&mut buf)
            .map_err(|e| format!("序列化失败: {e}"))?;
        Ok(buf.iter().map(|b| format!("{b:02x}")).collect())
    }
}

/// 查询 ControlCenter 对本应用状态栏项的登记情况（仅 macOS 26+ 有意义）
#[tauri::command]
fn tray_registration_status() -> serde_json::Value {
    #[cfg(target_os = "macos")]
    {
        serde_json::to_value(tray_tahoe::inspect()).unwrap_or(serde_json::Value::Null)
    }
    #[cfg(not(target_os = "macos"))]
    {
        serde_json::json!({ "available": false })
    }
}

/// 一键修复 ControlCenter 中对本应用的错误归属 / 屏蔽状态
#[tauri::command]
fn repair_tray_registration(app: tauri::AppHandle) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        use tauri::Manager;
        let dir = app
            .path()
            .app_config_dir()
            .map_err(|e| e.to_string())?
            .join("controlcenter-backup");
        tray_tahoe::repair(dir)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        Err("仅支持 macOS".into())
    }
}

/// 打开 系统设置 → 菜单栏（控制中心）面板
#[tauri::command]
fn open_menu_bar_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("/usr/bin/open")
            .arg("x-apple.systempreferences:com.apple.ControlCenter-Settings.extension")
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "macos"))]
    {
        Err("仅支持 macOS".into())
    }
}

/// 窗口尺寸/位置记忆（逻辑像素）。
/// 不用 window-state 插件：该插件在 Retina 屏上物理/逻辑像素混用，
/// 会导致恢复后尺寸翻倍、窗口跑出屏幕外。
#[derive(serde::Serialize, serde::Deserialize)]
struct WinState {
    width: f64,
    height: f64,
    x: i32,
    y: i32,
    maximized: bool,
}

fn win_state_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    use tauri::Manager;
    app.path()
        .app_config_dir()
        .ok()
        .map(|d| d.join("win-state.json"))
}

fn save_win_state(window: &tauri::WebviewWindow) {
    use tauri::Manager;
    // 最大化时不覆盖记录的正常尺寸
    if window.is_maximized().unwrap_or(false) {
        if let Some(path) = win_state_path(window.app_handle()) {
            if let Ok(data) = std::fs::read_to_string(&path) {
                if let Ok(mut state) = serde_json::from_str::<WinState>(&data) {
                    state.maximized = true;
                    let _ = std::fs::write(&path, serde_json::to_string_pretty(&state).unwrap());
                }
            }
        }
        return;
    }
    let Ok(scale) = window.scale_factor() else { return };
    let Ok(phys) = window.outer_size() else { return };
    let logical = phys.to_logical::<f64>(scale);
    let pos = window.outer_position().ok();
    let state = WinState {
        width: logical.width,
        height: logical.height,
        x: pos.map(|p| (p.x as f64 / scale) as i32).unwrap_or(100),
        y: pos.map(|p| (p.y as f64 / scale) as i32).unwrap_or(100),
        maximized: false,
    };
    if let Some(path) = win_state_path(window.app_handle()) {
        if let Some(dir) = path.parent() {
            let _ = std::fs::create_dir_all(dir);
        }
        let _ = std::fs::write(&path, serde_json::to_string_pretty(&state).unwrap());
    }
}

fn restore_win_state(window: &tauri::WebviewWindow) {
    use tauri::Manager;
    let Some(path) = win_state_path(window.app_handle()) else {
        return;
    };
    let Ok(data) = std::fs::read_to_string(&path) else {
        return;
    };
    let Ok(state) = serde_json::from_str::<WinState>(&data) else {
        return;
    };

    // 恢复尺寸（逻辑像素，带下限保护）
    let _ = window.set_size(tauri::LogicalSize::new(
        state.width.max(600.0),
        state.height.max(400.0)
    ));

    // 恢复位置：目标位置必须还落在当前屏幕范围内（防止外接显示器拔掉后窗口跑出屏幕）
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let m_pos = monitor.position();
        let m_size = monitor.size();
        let mx = m_pos.x as f64 / scale;
        let my = m_pos.y as f64 / scale;
        let mw = m_size.width as f64 / scale;
        let mh = m_size.height as f64 / scale;
        let x = state.x as f64;
        let y = state.y as f64;
        // 窗口左上角必须在屏幕内，且至少露出 1/3
        let in_bounds = x >= mx - state.width / 3.0
            && x < mx + mw - 100.0
            && y >= my
            && y < my + mh - 100.0;
        if in_bounds {
            let _ = window.set_position(tauri::LogicalPosition::new(x, y));
        } else {
            let _ = window.center();
        }
    }

    if state.maximized {
        let _ = window.maximize();
    }
}

/// 显示主窗口（macOS 下同时把应用切回 Regular 模式，恢复 Dock 图标）
fn show_main_window(app: &tauri::AppHandle) {
    use tauri::Manager;
    #[cfg(target_os = "macos")]
    {
        // Accessory 模式下应用不会出现在 Dock，也不会自动成为前台应用。
        // 托盘点击和登录项启动后的首次交互都需要显式恢复 Regular 模式。
        let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
    }
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// 隐藏窗口到状态栏（macOS 下同时切换为 Accessory 模式，Dock 中彻底隐藏）
#[tauri::command]
fn hide_window_to_tray(app: tauri::AppHandle) {
    use tauri::Manager;
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
}

/// 从状态栏恢复显示主窗口
#[tauri::command]
fn show_window_from_tray(app: tauri::AppHandle) {
    show_main_window(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None::<Vec<&str>>
        ))
        .setup(|app| {
            #[cfg(all(desktop, target_os = "macos"))]
            {
                use tauri::Manager;
                use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
                {
                    let tray = TrayIconBuilder::with_id("main-tray")
                        // 启动时先用图标占位（前端同步显示配置后，显示时间时会移除图标只留文字）。
                        // logo 是彩色圆角图，不能作为 template（会被渲染成实心白块）。
                        .icon(tray_icon_image())
                        .icon_as_template(false)
                        .tooltip("云小历：点击打开日历")
                        .show_menu_on_left_click(false)
                        .on_tray_icon_event(|tray, event| {
                            if let TrayIconEvent::Click {
                                button: MouseButton::Left,
                                button_state: MouseButtonState::Up,
                                ..
                            } = event
                            {
                                show_main_window(tray.app_handle());
                            }
                        })
                        .build(app)?;
                    // TrayIcon 在最后一个句柄释放时会从 macOS 状态栏移除，
                    // 必须由应用状态持有整个生命周期。
                    app.manage(tray);
                }
                // 启动原生状态栏计时线程
                start_tray_clock(app.handle().clone());
            }
            #[cfg(desktop)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    // 启动时恢复上次的窗口尺寸/位置
                    restore_win_state(&window);
                    // 关闭窗口时记录尺寸/位置
                    let w = window.clone();
                    window.on_window_event(move |event| {
                        if let tauri::WindowEvent::CloseRequested { .. } = event {
                            save_win_state(&w);
                        }
                    });
                }
            }
            let _ = app;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            sync_tray_config,
            hide_window_to_tray,
            show_window_from_tray,
            tray_registration_status,
            repair_tray_registration,
            open_menu_bar_settings
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        match &event {
            // 登录启动后窗口可能已可见但未激活，Dock 点击始终恢复并聚焦窗口。
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => show_main_window(app_handle),
            // Cmd+Q 等途径退出时也记录窗口尺寸/位置
            #[cfg(desktop)]
            tauri::RunEvent::ExitRequested { .. } => {
                use tauri::Manager;
                if let Some(window) = app_handle.get_webview_window("main") {
                    save_win_state(&window);
                }
            }
            _ => {}
        }
        let _ = app_handle;
        let _ = event;
    });
}
