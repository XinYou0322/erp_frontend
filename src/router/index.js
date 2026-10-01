import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";
// Codex 修改：直接輸入網址也遵守 Sidebar 相同權限。
import { canAccessPath, permissionForPath, accessibleHome } from "@/data/navigationPermissions";

const routes = [
  { path: "/access-denied", component: () => import("@/view/AccessDeniedView.vue"), meta: { requiresAuth: true } },
  {
    path: "/",
    // Codex 修改：登入後及網站首頁以門市營運儀表板為入口。
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/view/LoginPage.vue"),
    meta: { guestOnly: true },
  },
  {
    path: "/LoginPage",
    redirect: "/login",
  },
  {
    path: "/permissions",
    name: "permissions",
    component: () => import("@/view/PermissionPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => import("@/view/DashboardView.vue"),
    meta: { requiresAuth: true },
  },
  {
  path: "/dashboard/revenue",
  name: "revenue-detail",
  component: () => import("../view/RevenueDetailView.vue"), 
 },
 {
  path: '/dashboard/order-value-analysis',
  name: 'OrderValueAnalysis',
  component: () => import('@/view/OrderValueAnalysisView.vue'),
  },
   {
  path: '/dashboard/cost',
  name: 'cost-detail',
  component: () => import('@/view/CostDetail.vue'),
  },
  {
  path: '/dashboard/profit',
  name: 'profit-detail',
  component: () => import('@/view/ProfitDetail.vue'),
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/view/PermissionPage.vue"),
    meta: { requiresAuth: true, adminOnly: true },
  },
  {
    path: "/system-settings",
    name: "system-settings",
    component: () => import("@/view/SystemSettingsPage.vue"),
    meta: { requiresAuth: true, adminOnly: true },
  },
  {
    path: "/PermissionPage",
    redirect: "/permissions",
  },
  {
    path: "/Admin",
    redirect: "/admin",
  },
  {
    path: "/users",
    redirect: "/permissions", // 或者導向到 "/admin"，看您希望通知點開去哪個頁面
  },

  {
    path: "/product",
    name: "product",
    component: () => import("@/view/ProductBomManagement.vue"),
  },
  // {
  //   path: "/material",
  //   name: "material",
  //   component: () => import("@/view/MaterialManagement.vue"),
  //   meta: { requiresAuth: true },
  // },

  {
    path: "/workflows",
    name: "workflow-dashboard",
    component: () => import("@/view/WorkflowDashboard.vue"),
  },
  {
    path: "/workflows/:id",
    name: "workflow-detail",
    component: () => import("@/view/WorkflowDetail.vue"),
    props: true,
  },
  {
    path: "/inventory",
    name: "inventory",
    component: () => import("@/view/InventoryPage.vue"),
  },
  {
    path: "/inventory/logs",
    name: "inventorylogs",
    component: () => import("@/view/InventoryLogManagement.vue"),
  },

  {
    path: "/ComponentShowcase",
    name: "ComponentShowcase",
    component: () => import("@/view/ComponentShowcase.vue"),
  },

  {
    path: "/Supplier",
    name: "Supplier",
    component: () => import("@/view/Supplier.vue"),
  },
  {
    path: "/leave",
    redirect: "/workflows", // 重新導向到您真實存在的請假列表路徑
  },
  {
    path: "/leave-requests",
    name: "leave-list",
    component: () => import("../view/LeaveRequestListView.vue"),
  },
  {
    path: "/leave-requests/new",
    name: "leave-create",
    component: () => import("../view/LeaveRequestFormView.vue"),
  },
  {
    path: "/leave-requests/:id/edit",
    name: "leave-edit",
    component: () => import("../view/LeaveRequestFormView.vue"),
  },
  {
    path: "/leave-requests/:id",
    name: "leave-detail",
    component: () => import("../view/LeaveRequestDetailView.vue"),
  },
  {
    path: "/pos",
    name: "pos",
    component: () => import("@/view/pos.vue"),
  },
  {
    path: "/purchaseOrder",
    name: "purchaseOrder",
    component: () => import("@/view/PurchaseOrder.vue"),
  },
  {
    path: "/purchase-orders",
    redirect: "/purchaseOrder", // 自動導向到您真實存在的採購單頁面
  },
  {
    path: "/SalesOrder",
    name: "SalesOrder",
    component: () => import("@/view/SalesOrder.vue"),
  },

  {
    path: "/calendar",
    name: "calendar",
    component: () => import("@/view/CalendarPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/attendance",
    name: "attendance",
    component: () => import("@/view/AttendanceRecordPage.vue"),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  // ✨ 核心修正：如果前端網頁剛啟動，且系統還沒有完成首次驗證，強迫路由卡住，等待後端回應
  if (!authStore.isInitialized) {
    await authStore.restoreSessionFromBackend();
  }

  // 1. 如果沒登入，且要去需要驗證的頁面 -> 強制導向登入頁
  if ((to.meta.requiresAuth || permissionForPath(to.path)) && !authStore.isAuthenticated) {
    return "/login";
  }

  // 2. 如果已經登入，且要去訪客限定的頁面（例如登入頁） -> 自動彈回後台
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return accessibleHome(authStore);
  }

  // 3. 管理員權限檢查
  // Codex 修改：防止繞過隱藏選單直接開啟停用功能。
  if (authStore.isAuthenticated && !canAccessPath(authStore, to.path)) return accessibleHome(authStore);
  if (to.meta.adminOnly) {
    const isAdminUser =
      authStore.isAdmin || authStore.hasPermission("users.manage");
    if (!isAdminUser) {
      return "/permissions";
    }
  }
});
export default router;
