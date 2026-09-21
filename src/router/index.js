import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.store";



const routes = [
  {
    path: "/",
    redirect: "/permissions",
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
    path: "/admin",
    name: "admin",
    component: () => import("@/view/PermissionPage.vue"),
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
  {
    path: "/material",
    name: "material",
    component: () => import("@/view/MaterialManagement.vue"),
    meta: { requiresAuth: true },
  },

  {
    path: '/workflows',
    name: 'workflow-dashboard',
    component: () => import('@/view/WorkflowDashboard.vue')
  },
  {
    path: '/workflows/:id',
    name: 'workflow-detail',
    component: () => import('@/view/WorkflowDetail.vue'),
    props: true
  },
  {
    path: "/inventory",
    name: "inventory",
    component: () => import("@/view/InventoryPage.vue"),
  },
 {
    path: '/inventory/logs',
    name: 'inventorylogs',
    component: ()=> import("@/view/InventoryLogManagement.vue")
  },

   {
    path: '/ComponentShowcase',
    name: 'ComponentShowcase',
    component: ()=> import("@/view/ComponentShowcase.vue")
  },

  {
    path: "/Supplier",
    name: "Supplier",
    component: () => import("@/view/Supplier.vue"),
  },
  {
    path: "/leave",
    redirect: "/leave-requests", // 重新導向到您真實存在的請假列表路徑
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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
  } else if (to.meta.guestOnly && authStore.isAuthenticated) {
    next("/permissions");
  } else {
    next();
  }
});

export default router;
