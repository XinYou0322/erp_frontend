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
    path: "/PermissionPage",
    redirect: "/permissions",
  },

   {
     path: '/product',
    name: 'product',
     component: ()=> import("@/view/ProductBomManagement.vue")
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
    path: '/inventory',
    name: 'inventory',
    component: ()=> import("@/view/InventoryManagement.vue")
  },
  {
    path: '/material',
    name: 'material',
    component: ()=> import("@/view/MaterialManagement.vue")
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
    path: '/Supplier',
    name: 'Supplier',
    component: ()=> import("@/view/Supplier.vue")
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
]

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
