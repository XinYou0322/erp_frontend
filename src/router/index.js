import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

 const routes = [
  {
    path: '/home',
    name: 'home',
    component: Home
  },
    {
    path: '/supplier/addsupplier',
    name: 'addsupplier',
    component: () => import("@/views/supplierview/addsuppliers.vue")
  },
    {
    path: '/supplier',
    name: 'supplier',
    component: () => import("@/views/supplierview/suppliers.vue")
  },
  {
    path: '/pos',
    name: 'pos',
    component: () => import("@/views/pos/pos.vue")
  },

//     name: 'product',
//     component: product
//   },
//   {
//     path: '/bom',
//     name: 'bom',
//     component: bom
//   }
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
  {
    path: "/PermissionPage",
    alias: ["/permissions"],
    name: "PermissionPage",
    component: PermissionPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export default router;
