// Codex 修改：申請帳號與開立／編輯帳號共用部門選項及預設部門。
export const DEFAULT_DEPARTMENT = "門市收銀課";
export const DEPARTMENTS = ["總管理處", "營運與行銷部", "生產研發部", "門市收銀課", "外部審計顧問"];
export function departmentOptions(users = [], selected = "") {
  return [...new Set([...DEPARTMENTS, ...users.map((user) => user.department), selected])].filter(Boolean);
}
