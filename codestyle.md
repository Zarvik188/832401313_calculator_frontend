# 前端代码规范

本项目参考 [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)，并采用简单的原生 HTML/CSS/JavaScript 写法。

- 使用 2 个空格缩进，字符串优先使用双引号。
- 变量和函数使用 `camelCase`，常量使用 `UPPER_SNAKE_CASE`。
- DOM 元素使用有意义的 ID 和 class 名称。
- 事件处理和网络请求写成小函数，避免把全部逻辑塞进一个事件回调。
- 用户输入显示到页面时使用 `textContent`，不直接拼接 `innerHTML`。
- 前端只负责发送表达式和展示结果，不能计算最终结果。
- 异步请求使用 `async/await`，统一处理网络错误和后端错误。
- CSS 按页面结构组织，颜色和间距优先使用已有样式变量或一致的数值。

