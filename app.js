const API_BASE = "http://127.0.0.1:5000/api";
const expressionInput = document.querySelector("#expression");
const resultElement = document.querySelector("#result");
const messageElement = document.querySelector("#message");
const historyList = document.querySelector("#history-list");
const historySearch = document.querySelector("#history-search");
const historyCount = document.querySelector("#history-count");
const precisionSelect = document.querySelector("#precision");
const favoritesOnly = document.querySelector("#favorites-only");
let historyRecords = [];
let lastResult = "";
let favoriteIds = new Set(JSON.parse(localStorage.getItem("calculator-favorites") || "[]"));

function showMessage(text, type = "") {
  messageElement.textContent = text;
  messageElement.className = `message ${type}`;
}

function appendValue(value) {
  expressionInput.value += value;
  expressionInput.focus();
}

function formatResult(value) {
  const text = String(value);
  const digits = precisionSelect.value;
  if (digits === "auto" || !Number.isFinite(Number(value))) return text;
  return String(Number(Number(value).toFixed(Number(digits))));
}

function saveFavorites() {
  localStorage.setItem("calculator-favorites", JSON.stringify([...favoriteIds]));
}

async function calculate() {
  const expression = expressionInput.value.trim();
  if (!expression) {
    showMessage("请先输入表达式。", "error");
    return;
  }
  showMessage("正在请求后端计算……");
  try {
    const response = await fetch(`${API_BASE}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || "计算失败");
    resultElement.textContent = formatResult(payload.result);
    lastResult = String(payload.result);
    showMessage("计算成功，记录已经保存到后端数据库。", "success");
    await loadHistory();
  } catch (error) {
    resultElement.textContent = "—";
    showMessage(error.message || "无法连接后端服务。", "error");
  }
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE}/history`);
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || "读取失败");
    historyRecords = payload.history;
    renderHistory();
  } catch (error) {
    historyRecords = [];
    historyList.innerHTML = "";
    const text = document.createElement("p");
    text.className = "empty-state";
    text.textContent = `历史记录读取失败：${error.message}`;
    historyList.appendChild(text);
    historyCount.textContent = "OFFLINE";
  }
}

function renderHistory() {
  const keyword = historySearch.value.trim().toLowerCase();
  const visibleRecords = historyRecords.filter((record) => {
    const matchesKeyword = `${record.expression} ${record.result}`.toLowerCase().includes(keyword);
    return matchesKeyword && (!favoritesOnly.checked || favoriteIds.has(String(record.id)));
  });
  historyCount.textContent = `${visibleRecords.length} 条`;
  historyList.innerHTML = "";
  if (!visibleRecords.length) {
    const text = document.createElement("p");
    text.className = "empty-state";
    text.textContent = keyword || favoritesOnly.checked ? "没有匹配的历史记录。" : "还没有成功的计算记录。";
    historyList.appendChild(text);
    return;
  }
  visibleRecords.forEach((record) => {
    const item = document.createElement("article");
    item.className = "history-item";
    const details = document.createElement("div");
    const expression = document.createElement("div");
    expression.className = "history-expression";
    expression.textContent = record.expression;
    expression.title = "点击后将表达式放回输入框";
    expression.addEventListener("click", () => {
      expressionInput.value = record.expression;
      expressionInput.focus();
      showMessage("已把历史表达式放回输入框。", "success");
    });
    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = `${record.created_at} · 结果 ${formatResult(record.result)}`;
    details.append(expression, meta);
    const actions = document.createElement("div");
    actions.className = "history-actions";
    const favoriteButton = document.createElement("button");
    favoriteButton.className = `favorite-button ${favoriteIds.has(String(record.id)) ? "selected" : ""}`;
    favoriteButton.textContent = favoriteIds.has(String(record.id)) ? "★" : "☆";
    favoriteButton.title = "收藏此记录";
    favoriteButton.addEventListener("click", () => {
      const id = String(record.id);
      if (favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id);
      saveFavorites();
      renderHistory();
    });
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => deleteHistory(record.id));
    actions.append(favoriteButton, deleteButton);
    item.append(details, actions);
    historyList.appendChild(item);
  });
}

async function deleteHistory(id) {
  try {
    const response = await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || "删除失败");
    showMessage("历史记录已从后端数据库删除。", "success");
    favoriteIds.delete(String(id));
    saveFavorites();
    await loadHistory();
  } catch (error) {
    showMessage(error.message || "删除失败。", "error");
  }
}

async function clearHistory() {
  if (!historyRecords.length || !window.confirm("确定清空全部历史记录吗？")) return;
  try {
    const response = await fetch(`${API_BASE}/history`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.message || "清空失败");
    showMessage("全部历史记录已从后端数据库删除。", "success");
    favoriteIds.clear();
    saveFavorites();
    await loadHistory();
  } catch (error) {
    showMessage(error.message || "清空失败。", "error");
  }
}

function clearInput() {
  expressionInput.value = "";
  resultElement.textContent = "结果待计算";
  showMessage("输入表达式后按 Enter，或点击等号。");
  expressionInput.focus();
}

function copyResult() {
  if (!lastResult) {
    showMessage("还没有可复制的结果。", "error");
    return;
  }
  navigator.clipboard?.writeText(lastResult).then(() => showMessage("结果已复制。", "success"), () => showMessage("复制失败，请手动选择结果。", "error"));
}

document.querySelectorAll(".key").forEach((button) => {
  button.addEventListener("click", () => {
    const { action, value } = button.dataset;
    if (action === "clear") clearInput();
    else if (action === "backspace") { expressionInput.value = expressionInput.value.slice(0, -1); expressionInput.focus(); }
    else if (action === "answer") appendValue(lastResult || "0");
    else if (action === "calculate") calculate();
    else if (value) appendValue(value);
  });
});

expressionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") calculate();
  if (event.key === "Escape") clearInput();
});
historySearch.addEventListener("input", renderHistory);
document.querySelector("#refresh-history").addEventListener("click", loadHistory);
document.querySelector("#clear-history").addEventListener("click", clearHistory);
document.querySelector("#copy-result").addEventListener("click", copyResult);
precisionSelect.addEventListener("change", () => {
  if (lastResult) resultElement.textContent = formatResult(lastResult);
  renderHistory();
});
favoritesOnly.addEventListener("change", renderHistory);
document.querySelector("#theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
  localStorage.setItem("calculator-theme", document.body.classList.contains("light") ? "light" : "dark");
});
if (localStorage.getItem("calculator-theme") === "light") document.body.classList.add("light");
loadHistory();
