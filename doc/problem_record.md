## 沙盒问题

```
const rendition = book.renderTo(containerRef.current, {
  width: containerWidth,
  height: containerHeight,
  // spread: 'none' as const,
  flow: 'paginated' as const,
  allowScriptedContent: true
});
```

需要设置 allowScriptedContent = true

## 渲染无效，且不报错

检查container是否有多个
严格模式下useEffect 会被调用两次，所以会renderTo两次导致出现重复的容器

## vscode前端 debug 断点是灰色的

tauri前端只能通过 Shift + Ctril + i调出控制台来debug

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Debug Backend",
      "cargo": {
        "args": [
          "build",
          "--manifest-path",
          "${workspaceFolder}/src-tauri/Cargo.toml"
        ],
        "filter": {
          "name": "e-reader-tauri",
          "kind": "bin"
        }
      },
      "args": [],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

# EPUB Viewer 闭包问题记录

## 问题描述

在 `EpubContent` 组件中，当用户在 EPUB 内容中选中文本时，触发的回调函数可能不会使用最新的 `onSelectedText` prop。

## 问题原因

### 闭包陷阱

当使用 `useEffect` 添加事件监听器时，如果依赖数组为空，effect 只运行一次：

```javascript
useEffect(() => {
  rendition.on("selected", async (cfiRange, _contents) => {
    onSelectedText(text, context); // 直接使用 prop
  });
}, []); // 空依赖数组
```

此时，回调函数形成闭包，捕获了初始的 `onSelectedText` 引用。如果父组件的 `onSelectedText` 回调函数发生变化（例如依赖于父组件的状态），事件监听器仍然会调用旧的函数。

### 具体场景

1. 父组件定义回调函数依赖于某个状态
2. 状态更新导致父组件重新渲染，产生新的回调函数引用
3. EpubContent 中的事件监听器仍然持有旧的函数引用
4. 用户选中文本时，调用的是旧的回调函数，导致状态更新不正确

## 解决方案

使用 `useRef` 包装回调函数，确保每次调用的都是最新的函数：

```javascript
const onSelectedTextRef = useRef(onSelectedText);

// 每次渲染都更新 ref
useEffect(() => {
  onSelectedTextRef.current = onSelectedText;
});

useEffect(() => {
  rendition.on("selected", async (cfiRange, _contents) => {
    // 通过 ref 调用最新的函数
    onSelectedTextRef.current?.(text, context);
  });
}, []);
```

## 关键要点

1. `useRef` 对象在组件生命周期中保持同一个引用
2. 每次组件渲染时，同步更新 `ref.current` 为最新的回调函数
3. 事件触发时，通过 `ref.current` 调用，总是能获取到最新的函数

## 相关文件

- `src/pages/Viewer/components/EpubContent/index.tsx`

# useEffect 依赖与 useRef.current 的区别

## 问题描述

在 `useEpubReader` Hook 中，`eBookRef.current` 赋值后不会触发依赖它的 `useEffect`，导致后续的事件监听和 ResizeObserver 无法正确执行。

## 问题原因

### useState vs useRef

| 类型             | 是否触发重新渲染 | 是否触发 useEffect        |
| ---------------- | ---------------- | ------------------------- |
| `useState`       | ✅ 是            | ✅ 是（如果在依赖数组中） |
| `useRef.current` | ❌ 否            | ❌ 否                     |

### 执行流程分析

```javascript
// useEffect 1
useEffect(() => {
  eBookRef.current = eBook; // ❌ 不会触发任何东西
  setIsReady(true); // ✅ 触发重新渲染
}, [bookPath]);

// useEffect 2 - 依赖 isReady，不是 eBookRef.current
useEffect(() => {
  if (!isReady || !eBookRef.current) return;
  // ...
}, [isReady, containerRef]); // ✅ isReady 变化会触发
```

**关键区别**：

- `useRef.current` 的变化发生在渲染之后的副作用中
- React 的依赖检查是在渲染阶段进行的，无法检测到 `useRef.current` 的变化
- 只有 `useState`、`useProps`、`useContext` 的变化才能触发重新渲染和 useEffect

## 解决方案

使用 `useState` 驱动流程，将 `useRef.current` 的变化转换为 state 变化：

```javascript
const [isReady, setIsReady] = useState(false);
const [isDisplayed, setIsDisplayed] = useState(false);

// useEffect 1: 创建 book
useEffect(() => {
  eBookRef.current = eBook;
  setIsReady(true);  // ✅ 通过 state 触发后续流程
}, [bookPath]);

// useEffect 2: 创建 rendition
useEffect(() => {
  if (!isReady) return;
  const rendition = book.renderTo(container, {...});

  // 等 display 成功后才赋值给 ref
  rendition.display().then(() => {
    renditionRef.current = rendition;
    setIsDisplayed(true);  // ✅ 通过 state 触发后续流程
  });
}, [isReady, containerRef]);

// useEffect 3: 事件监听和 ResizeObserver
useEffect(() => {
  if (!isReady || !isDisplayed) return;  // ✅ 通过 state 判断
  // 现在可以安全使用 renditionRef.current 了
}, [isReady, isDisplayed, containerRef]);
```

## 关键要点

1. `useRef` 的设计目的是存储不需要触发重新渲染的值
2. 如果某个值的变化需要触发副作用，应该使用 `useState`
3. 可以结合使用：用 `useRef` 存储实例引用，用 `useState` 标记状态变化
4. 避免在依赖数组中使用 `useRef.current`，这是无效的依赖

## 相关文件

- `src/hooks/useEpubReader.ts`
