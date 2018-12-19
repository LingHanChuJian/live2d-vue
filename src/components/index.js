import live2d from './live2d'

const live2d_vue = {
    install(Vue) {
        Vue.component('live2d', live2d)
    }
}

export default live2d_vue