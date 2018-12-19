import Vue from 'vue'
import App from './App.vue'

import live2d from '@/components/index'

Vue.config.productionTip = false

Vue.use(live2d)

new Vue({
  render: function (h) { return h(App) },
}).$mount('#app')
