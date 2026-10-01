// Codex 修改：十個角色共用同一份定義，統一顯示名稱、選單及後端等級。
export const SYSTEM_ROLES = [
  { key: "admin", level: 1, name: "系統管理員 (Admin)", desc: "擁有全系統最高存取與配置授權", icon: "shield_person", badge: "success" },
  { key: "manager", level: 2, name: "營運經理 / 店長 (Manager)", desc: "負責門市營運、配方編修、採購核准及財務分析", icon: "manage_accounts", badge: "info" },
  { key: "employee", level: 3, name: "現場員工 / 收銀員 (Employee)", desc: "負責現場 POS 點餐、打卡及假單提交", icon: "badge", badge: "warning" },
  { key: "guest", level: 4, name: "訪客 / 外部審計 (Guest)", desc: "僅限檢視總覽唯讀數據", icon: "visibility", badge: "neutral" },
  { key: "procurement", level: 5, name: "採購專員", desc: "維護供應商資料、開立採購單與追蹤採購進度", icon: "shopping_cart", badge: "info" },
  { key: "warehouse", level: 6, name: "倉儲專員", desc: "查閱物料配方與進貨紀錄，協助收貨核對", icon: "warehouse", badge: "warning" },
  { key: "research", level: 7, name: "配方研發專員", desc: "建立與編修產品配方，匯出物料結構", icon: "science", badge: "success" },
  { key: "finance", level: 8, name: "財務分析專員", desc: "檢視營運數據與採購紀錄，匯出分析報告", icon: "account_balance", badge: "info" },
  { key: "hr", level: 9, name: "人資專員", desc: "追蹤個人假單與簽核申請進度", icon: "groups", badge: "neutral" },
  { key: "supervisor", level: 10, name: "營運督導", desc: "檢視跨店營運數據、採購與門市流程", icon: "supervisor_account", badge: "success" },
];
