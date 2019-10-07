import Vue from 'vue'
import L2dManage from './../lib/main'

let live2DNumder = -1

export default Vue.extend({
    name: 'live2d',
    data: () => ({ 
        L2dManage: '',
        imgPath: ''
    }),
    render: function (createElement) {
        live2DNumder++
        return createElement('canvas', {
            attrs: {
                id: this.canvasID,
                width: this.width,
                height: this.height,
                class: 'live2d',
                'data-hook': live2DNumder,
                'data-path': this.imgPath,
            },
            style: this.canvasStyle,
            ref: 'live2dCanvas'
        })
    },
    props: {
        canvasID: {
            type: String,
            default: ''
        },
        modelPath: {
            type: String,
            default: ''
        },
        width: {
            type: Number,
            default: 290
        },
        height: {
            type: Number,
            default: 240
        },
        canvasStyle: {
            type: Object,
            default() {
                return {
                    'position': 'relative',
                    'z-index': 99
                }
            }
        }
    },
    mounted() {
        this.L2dManage = new L2dManage(this.$refs.live2dCanvas, this.modelPath)
    },
    methods: {
        initL2dMange(modelPath) {
            this.L2dManage.revise(modelPath)
        },
        save(captureName) {
            this.L2dManage.save(captureName)
        },
        setImgPath(path) {
            this.imgPath = path
        }
    },
    beforeUpdate() {
        this.L2dManage = null
    },
    updated() {
        this.L2dManage = new L2dManage(this.$refs.live2dCanvas, this.modelPath)
    },
    watch: {
        modelPath(newPath) {
            this.initL2dMange(newPath)
        }
    }
})