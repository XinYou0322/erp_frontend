import { createRouter, createWebHistory } from 'vue-router'
import materail from '@/views/materialview/Material.vue'
import product from '@/views/productview/Product.vue'
import bom from '@/views/bomview/bom.vue'
import WorkflowDashboard from '../views/workflow/WorkflowDashboard.vue'
import WorkflowDetail from '../views/workflow/WorkflowDetail.vue'

const routes = [
  {
    path: '/material',
    name: 'material',
    component: materail
  },
  {
    path: '/product',
    name: 'product',
    component: product
  },
  {
    path: '/bom',
    name: 'bom',
    component: bom
  },
  { 
    path: '/workflows', 
    name: 'workflow-dashboard', 
    component: WorkflowDashboard 
  },
  { 
    path: '/workflows/:id', 
    name: 'workflow-detail', 
    component: WorkflowDetail, 
    props: true 
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes
})

export default router