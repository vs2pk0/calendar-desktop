# 高德天气 API 配置指南

## 步骤 1: 注册高德开放平台账号

1. 访问: https://console.amap.com/dev/user/signin
2. 使用手机号注册账号并登录

## 步骤 2: 创建应用

1. 登录后访问: https://console.amap.com/dev/key/app
2. 点击"创建新应用"
3. 填写应用信息:
    - 应用名称: `日历桌面应用`（或任意名称）
    - 应用类型: 选择"其他"

## 步骤 3: 添加 Key

1. 在应用列表中找到刚创建的应用
2. 点击"添加Key"
3. 填写Key信息:
    - Key名称: `天气服务`（或任意名称）
    - 服务平台: 选择 **"Web服务"**
    - 提交

## 步骤 4: 获取 Key

1. 创建成功后，在应用详情页可以看到生成的 Key
2. 复制这个 Key（格式类似: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`）

## 步骤 5: 配置到应用中

打开 `src/components/RightPanel.vue` 文件，找到第135行左右：

```javascript
const key = 'YOUR_AMAP_KEY'; // 请替换为您的高德API Key
```

替换为你的Key：

```javascript
const key = '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'; // 替换为刚才复制的Key
```

## 步骤 6: 配置城市代码

在同一个文件中找到：

```javascript
const adcode = '110000'; // 北京的城市编码，可以根据需要修改
```

如果需要其他城市的天气，可以修改城市代码：

### 常用城市代码

- 北京: `110000`
- 上海: `310000`
- 广州: `440100`
- 深圳: `440300`
- 杭州: `330100`
- 成都: `510100`
- 武汉: `420100`
- 西安: `610100`
- 南京: `320100`
- 重庆: `500000`

完整城市代码列表: https://lbs.amap.com/api/webservice/download

## 步骤 7: 解决跨域问题（可选）

由于Tauri桌面应用的安全限制，直接调用API可能会遇到跨域问题。

### 方案1: 修改 CSP 配置

在 `src-tauri/tauri.conf.json` 中修改 CSP 设置：

```json
"security": {
  "csp": "default-src 'self'; connect-src 'self' https://restapi.amap.com"
}
```

### 方案2: 通过 Tauri 后端调用（推荐）

创建一个 Tauri 命令来调用API，避免跨域问题。

## 免费额度说明

- **每日配额**: 30万次
- **并发数**: 200次/秒
- **个人认证**: 免费
- **企业认证**: 需要营业执照

对于个人使用，免费额度完全足够！

## 常见问题

### Q: Key不可用怎么办？

A: 新创建的Key可能需要等待几分钟才能生效。

### Q: 还是提示跨域错误？

A: 暂时使用模拟数据，或按照"步骤7"配置CSP。

### Q: 想要更详细的天气数据？

A: 可以查看高德天气API文档: https://lbs.amap.com/api/webservice/guide/api/weatherinfo

## 其他免费天气API

如果不想注册高德，也可以使用以下免费API：

1. **心知天气**: https://www.seniverse.com/ （永久免费，每分钟20次）
2. **彩云天气**: https://caiyunapp.com/map/ （每月10000次）
3. **和风天气**: https://dev.qweather.com/ （每日1000次）

只需要修改 `RightPanel.vue` 中的API调用逻辑即可。
