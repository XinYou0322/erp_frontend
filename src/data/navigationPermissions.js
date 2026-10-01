// Codex 修改：Sidebar 與路由共用入口權限，查看權限關閉時不因編輯權限而繼續顯示。
const rules = [
  ["/dashboard", "overview.view"],
  ["/inventory", "inventory.view"],
  ["/product", "bom.view"],
  ["/supplier", "suppliers.view"],
  ["/purchaseorder", "suppliers.view"],
  ["/salesorder", "sales.view"],
  ["/leave-requests/new", "workflows.submit"],
  ["/leave-requests", "workflows.view"],
  ["/workflows", "workflows.approve"],
  ["/pos", "pos.view"],
  ["/attendance", "attendance.view"],
  ["/calendar", "workflows.view"],
  ["/permissions", "permissions.view"],
];

export function permissionForPath(path) {
  const normalized = path.toLowerCase().replace(/\/$/, "");
  if (/^\/leave-requests\/[^/]+\/edit$/.test(normalized)) return "workflows.submit";
  return rules.find(([prefix]) => normalized === prefix || normalized.startsWith(`${prefix}/`))?.[1];
}

export function canAccessPath(auth, path) {
  const permission = permissionForPath(path);
  return !permission || auth.hasPermission(permission);
}

export function accessibleHome(auth) {
  return ["/dashboard", "/inventory", "/product", "/Supplier", "/purchaseOrder", "/SalesOrder", "/leave-requests", "/workflows", "/pos", "/attendance", "/permissions"]
    .find((path) => canAccessPath(auth, path)) || "/access-denied";
}
