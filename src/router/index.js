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
  // {
  //   path: '/product',
  //   name: 'product',
  //   component: product
  // },
  {
    path: '/bom',
    name: 'bom',
    component: ()=> import("@/testXinyou/InventoryManagement.vue")
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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
});

export default router;
