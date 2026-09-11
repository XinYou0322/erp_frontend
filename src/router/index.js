import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views222222/Home.vue";

const routes = [
  {
    path: "/home",
    name: "home",
    component: Home,
  },
  {
    path: "/supplier/addsupplier",
    name: "addsupplier",
    component: () => import("@/views222222/supplierview/addsuppliers.vue"),
  },
  {
    path: "/supplier",
    name: "supplier",
    component: () => import("@/views222222/supplierview/suppliers.vue"),
  },
  {
    path: "/product",
    name: "product",
    component: () => import("@/testXinyou/ProductBomManagement.vue"),
  },
  {
    path: "/bom",
    name: "bom",
    component: () => import("@/testXinyou/InventoryManagement.vue"),
  },
  {
    path: "/PermissionPage",
    name: "PermissionPage",
    component: () => import("@/view/PermissionPage.vue"),
  },
  // {
  //   path: '/workflows',
  //   name: 'workflow-dashboard',
  //   component: WorkflowDashboard
  // },
  // {
  //   path: '/workflows/:id',
  //   name: 'workflow-detail',
  //   component: WorkflowDetail,
  //   props: true
  // },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export default router;
