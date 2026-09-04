import { createRouter, createWebHistory } from "vue-router";
import materail from "@/views/materialview/Material.vue";
import product from "@/views/productview/Product.vue";
import bom from "@/views/bomview/bom.vue";
import LoginPage from "@/testErp-sheng/pages/LoginPage.vue";
import PermissionPage from "@/testErp-sheng/pages/PermissionPage.vue";
const routes = [
  {
    path: "/material",
    name: "material",
    component: materail,
  },
  {
    path: "/product",
    name: "product",
    component: product,
  },
  {
    path: "/bom",
    name: "bom",
    component: bom,
  },
  {
    path: "/LoginPage",
    name: "LoginPage",
    component: LoginPage,
  },
  {
    path: "/PermissionPage",
    name: "PermissionPage",
    component: PermissionPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export default router;
