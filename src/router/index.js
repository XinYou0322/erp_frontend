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
  component: () =>
    import("@/view/InventoryPage.vue"),
},
  {
    path: '/material',
    name: 'material',
    component: () => import("@/view/MaterialManagement.vue")
  },
  {
    path: "/inventory/logs",
    name: "inventorylogs",
    component: () => import("@/view/InventoryLogManagement.vue"),
  },
  {
    path: "/attendance",
    name: "attendance",
    component: () => import("@/view/AttendanceRecordPage.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/calendar",
    name: "calendar",
    component: () => import("@/view/CalendarPage.vue"),
    meta: { requiresAuth: true },
  },

  {
    path: "/ComponentShowcase",
    name: "ComponentShowcase",
    component: () => import("@/view/ComponentShowcase.vue"),
  },

  {
    path: '/Supplier',
    name: 'Supplier',
    component: () => import("@/view/Supplier.vue")
  },
  {
    path: '/leave-requests',
    name: 'leave-list',
    component: () => import('../view/LeaveRequestListView.vue')
  },
  {
    path: '/leave-requests/new',
    name: 'leave-create',
    component: () => import('../view/LeaveRequestFormView.vue')
  },
  {
    path: '/leave-requests/:id/edit',
    name: 'leave-edit',
    component: () => import('../view/LeaveRequestFormView.vue')
  },
  {
    path: '/leave-requests/:id',
    name: 'leave-detail',
    component: () => import('../view/LeaveRequestDetailView.vue')
  },
    {
    path: '/pos',
    name: 'pos',
    component: ()=> import("@/view/pos.vue")
  },
    {
    path: '/purchaseOrder',
    name: 'purchaseOrder',
    component: ()=> import("@/view/PurchaseOrder.vue")
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return "/login";
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return "/permissions";
  }

  if (to.meta.adminOnly) {
    const isAdminUser =
      authStore.isAdmin || authStore.hasPermission("users.manage");
    if (!isAdminUser) {
      return "/permissions";
    }
  }
});

export default router;
