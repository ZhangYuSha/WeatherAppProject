//createRouter = creates the router instance
//createWebHistory = sets up how the browser's URL/history is managed
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  //Ensure the URL look normal rather than using #, require server configuration
  history: createWebHistory(),
  //Route definitions — each component is dynamically imported so
  //Vite code-splits it into its own chunk, loaded only when that
  //route is actually visited, rather than bundling all three pages
  //into the initial page load.
  routes: [
    {
      path: '/',
      name: 'city-list',
      component: () =>
        import('../pages/CityListPage/CityListPage.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () =>
        import('../pages/AccountPage/AccountPage.vue'),
    },
    {
      path: '/weather/:city',
      name: 'weather-detail',
      component: () =>
        import('../pages/WeatherDetailPage/WeatherDetailPage.vue'),
    },
  ],
})

export default router