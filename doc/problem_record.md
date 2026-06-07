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