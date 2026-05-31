# E-Reader Tauri 测试指南

## 测试结构

本项目包含两种测试：

1. **Rust 后端单元测试** - 测试 Tauri Command、Service、Repository 层
2. **WebDriver E2E 测试** - 测试完整的前后端交互流程

## Rust 后端测试

### 运行测试

```bash
cd src-tauri
cargo test
```

### 测试覆盖

- **BookRepository**: 创建、查询、删除、搜索图书
- **BookService**: 业务逻辑层测试
- **QueryRecordRepository**: 查词记录创建、词汇列表、统计
- **WordCacheRepository**: 翻译缓存创建、查询、更新
- **TranslationService**: 翻译流程测试
- **StatisticsService**: 统计服务测试

### 测试数据库

测试使用内存 SQLite 数据库 (`sqlite::memory:`)，每次测试独立运行，互不影响。

## WebDriver E2E 测试

### 前置条件

1. 安装 tauri-driver：
```bash
cargo install tauri-driver
```

2. 构建应用：
```bash
cd src-tauri
cargo build --release
```

3. 安装 WebDriverIO 依赖：
```bash
cd webdriver/webdriverio
npm install
```

### 运行测试

1. 启动 tauri-driver：
```bash
tauri-driver --port 4444
```

2. 运行测试：
```bash
cd webdriver/webdriverio
npm test
```

### 测试场景

#### Library 页面测试
- 页面加载验证
- 空状态显示
- 上传按钮可点击
- 图书卡片导航
- Statistics 链接导航

#### Viewer 页面测试
- 页面加载验证
- 导航控件存在
- 下一页导航
- 上一页导航
- 返回 Library
- 目录侧边栏
- 翻译面板结构

## CI 配置示例

```yaml
name: Tests

on: [push]

jobs:
  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Rust stable
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Cargo test
        uses: actions-rs/cargo@v1
        with:
          command: test

  webdriver-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Tauri dependencies
        run: |
          sudo apt-get update &&
          sudo apt-get install -y
          libgtk-3-dev
          libayatana-appindicator3-dev
          libwebkit2gtk-4.0-dev
          webkit2gtk-driver
          xvfb
      - name: Rust stable
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: Cargo build
        uses: actions-rs/cargo@v1
        with:
          command: build
          args: --release
      - name: Install tauri-driver
        uses: actions-rs/cargo@v1
        with:
          command: install
          args: tauri-driver
      - name: Node v16
        uses: actions/setup-node@v2
        with:
          node-version: 16.x
      - name: Yarn install
        run: yarn install
        working-directory: webdriver/webdriverio
      - name: WebdriverIO
        run: xvfb-run yarn test
        working-directory: webdriver/webdriverio
```