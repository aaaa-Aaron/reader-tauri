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
  rendition.on('selected', async (cfiRange, _contents) => {
    onSelectedText(text, context);  // 直接使用 prop
  });
}, []);  // 空依赖数组
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
  rendition.on('selected', async (cfiRange, _contents) => {
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