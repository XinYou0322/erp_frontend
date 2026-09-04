import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'

 const routes = [
  {
    path: '/home',
    name: 'home',
    component: Home
  },
    {
    path: '/addsupplier',
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
 ]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

export default router