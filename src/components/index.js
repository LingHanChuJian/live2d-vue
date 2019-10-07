import live2d from './Live2dCanvas'
import dialogue from './dialogue'
import tools from './live2dTools'

const live2d_vue = {
    install(Vue) {
        Vue.component('live2d', live2d)
        Vue.component('dialogue', dialogue)
        Vue.component('live2dTools', tools)
    }
}

export default live2d_vue