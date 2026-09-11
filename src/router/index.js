import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views222222/Home.vue'

 const routes = [
  {
    path: '/home',
    name: 'home',
    component: Home
  },
    {
    path: '/supplier/addsupplier',
    name: 'addsupplier',
    component: () => import("@/views222222/supplierview/addsuppliers.vue")
  },
    {
    path: '/supplier',
    name: 'supplier',
    component: () => import("@/views222222/supplierview/suppliers.vue")
  },
   {
     path: '/product',
    name: 'product',
     component: ()=> import("@/view/ProductBomManagement.vue")
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
