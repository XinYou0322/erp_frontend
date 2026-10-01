// Codex 修改：薪資安全檢查與千分位顯示，範圍沿用資料庫 decimal(10, 2)。
export function validateSalary(value) {
  if (value === "" || value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(Number(text))) {
    return "薪資請輸入非負數字，最多兩位小數。";
  }
  if (Number(text) > 99999999.99) return "薪資不可超過 NT$ 99,999,999.99。";
  return "";
}

export function formatSalary(value) {
  return value === null || value === undefined || value === ""
    ? "未設定" : `NT$ ${Number(value).toLocaleString("zh-TW", { maximumFractionDigits: 2 })}`;
}
