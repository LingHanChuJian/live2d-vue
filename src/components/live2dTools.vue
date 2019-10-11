<template lang="pug">
    a 
        div.live2d-tools(:id="toolsID" :style='toolsStyle' v-on="toolsListeners" ref="live2dTools") 
            slot 
                span(:class="{ 'right-msg': position === 'right' }") {{ tabMsg }}
</template>

<script>
import tools from './../lib/tools'

export default {
    name: 'tools',
    data:()=>({
        live2dTools : ''
    }),
    props:{
       width: {
           type: Number,
           default: 28
       },
       minWidth:{
           type: Number,
           default: 18
       },
       dialogueRightLevelPosition: {
           type: Number,
           default: 10
       },
       position:{
            type: String,
            default: 'left'
       },
       customDialogue: Object,
       toolsID: String,
       backgroundColor:{
           type: String,
           default: '#FFFFFF'
       },
       toolsStyle: Object,
       tabMsg: String
    },
    mounted(){
       this.live2dTools = new tools(this.$refs.live2dTools, this.minWidth, this.width, this.position, this.backgroundColor, this.customDialogue, this.dialogueRightLevelPosition)
    },
    methods:{
        showMessage(remark,time=5000){
            this.live2dTools.showMessage(remark)
            this.live2dTools.hideMessage(time)
        }
    },
    computed:{
        toolsListeners(){
            let vm = this
            return Object.assign({},this.$listeners,{
                click(event){
                    vm.$emit('click',event)
                }
            })
        }
    }
}
</script>


<style lang="stylus" scoped>
    .live2d-tools
        margin 2px 0 
        writing-mode vertical-lr
        cursor pointer
        text-align center
        min-height 50px
        line-height 35px
        padding 3px 2px
        height auto
        box-shadow 1px 2px 5px rgba(0,0,0,0.3)
        background-color #FFFFFF  
        transition all .2s
        border-top-right-radius 8px
        border-bottom-right-radius 8px
    .right-msg
        display inline-block
        transform rotate(180deg)
</style>
