import { createRouter, createWebHistory } from 'vue-router'
import Library from '../views/Library.vue'
import AddSpool from '../views/AddSpool.vue'
import AddSpoolNew from '../views/AddSpoolNew.vue'
import EditSpool from '../views/EditSpool.vue'
import FilamentTypes from '../views/FilamentTypes.vue'
import FilamentTypeDetail from '../views/FilamentTypeDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Library',
    component: Library
  },
  {
    path: '/filament-types',
    name: 'FilamentTypes',
    component: FilamentTypes
  },
  {
    path: '/filament-types/:id',
    name: 'FilamentTypeDetail',
    component: FilamentTypeDetail
  },
  {
    path: '/add',
    name: 'AddSpool',
    component: AddSpool
  },
  {
    path: '/add-spool',
    name: 'AddSpoolNew',
    component: AddSpoolNew
  },
  {
    path: '/edit-spool/:id',
    name: 'EditSpoolNew',
    component: EditSpool
  },
  {
    path: '/edit/:id',
    name: 'EditSpool',
    component: EditSpool
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
