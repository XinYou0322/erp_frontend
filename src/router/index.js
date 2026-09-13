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
    path: "/material",
    name: "material",
    component: () => import("@/view/MaterialManagement.vue"),
    meta: { requiresAuth: true },
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
