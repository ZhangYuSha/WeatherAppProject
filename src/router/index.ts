//createRouter = creates the router instance
//createWebHistory = sets up how tohe browser's URL/history is managed
import { createRouter, createWebHistory } from 'vue-router'
import CityListPage from '../pages/CityListPage/CityListPage.vue'

const router = createRouter({
    //Ensure the URL look normal rather than using #, require server configuration
    history: createWebHistory(),
    //Empty array for route definitions
    routes: [{
      path: '/',
      name: 'city-list',
      component: CityListPage,
    },],
})

export default router