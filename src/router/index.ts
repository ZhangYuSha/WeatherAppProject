//createRouter = creates the router instance
//createWebHistory = sets up how the browser's URL/history is managed
import { createRouter, createWebHistory } from 'vue-router'
import CityListPage from '../pages/CityListPage/CityListPage.vue'
import AccountPage from '../pages/AccountPage/AccountPage.vue'
import WeatherDetailPage from '../pages/WeatherDetailPage/WeatherDetailPage.vue'

const router = createRouter({
    //Ensure the URL look normal rather than using #, require server configuration
    history: createWebHistory(),
    //Empty array for route definitions
    routes: [{
      path: '/',
      name: 'city-list',
      component: CityListPage,
    },
  {
      path: '/account',
      name: 'account',
      component: AccountPage,
    },
    {
        path: '/weather/:city',
        name: 'weather-detail',
        component: WeatherDetailPage,
    },
  ],
})

export default router