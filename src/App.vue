<template lang='pug'>
  div#app
    live2d(v-if="islive2d" :modelPath="modelPaths" ref='l2dManges')
    div.live2d-panel
      dialogue(v-if="isDialogue" :customDialogue="customDialogue" ref='dialogue')
      live2d(v-if="islive2d" :modelPath="modelPath" ref='l2dMange')
    div.tools-panel
      live2dTools(v-for="(item,index) in toolsData" :key="index" v-if="item.show" :position="item.position" @click="toolsClick(item)" :width="item.width" :toolsID="item.tabMsg" :tabMsg="item.tabMsg" :customDialogue='item.customDialogue' :backgroundColor="item.backgroundColor" ref='tool')
</template>

<script>
import custom from './custom'

export default {
  name: 'app',
  data :()=>({
    modelPath: '',
    modelPaths: '',
    customDialogue: custom,
    toolsData:[
      {tabMsg:'home',backgroundColor:'#ff0', show:true, position: 'left'},
      {tabMsg:'dialogue', width: 280, customDialogue: custom, show:true, position: 'left'},
      {tabMsg:'change',backgroundColor:'#add8e6', show:true, position: 'left'},
      {tabMsg:'save',backgroundColor:'green', show:true, position: 'left'},
      {tabMsg:'about',backgroundColor:'#eb7a77', show:true, position: 'left'},
      {tabMsg:'hide',backgroundColor:'red', show:true, position: 'left'}
    ],
    islive2d: true,
    isDialogue: false
  }),
  mounted(){
    setInterval(()=>{
      fetch('https://api.imjad.cn/hitokoto/?cat=&charset=utf-8&length=28&encode=json')
        .then(res => res.json())
        .then(data => {
          if(!this.isDialogue){
            let tool = this.$refs.tool.filter(item => { return item.customDialogue })
            if(tool && tool.length > 0)
              tool[0].showMessage(data.hitokoto)
          }else{
            this.$refs.dialogue.showMessage(data.hitokoto)
          }
      })
    },30000)
    this.modelPath = 'http://127.0.0.1:8000/media/static/live2d/Pio/model.json'
    setTimeout(()=>{
      this.modelPaths = 'http://127.0.0.1:8000/media/static/live2d/Pio/model.json'
    }, 2000)
  },
  methods:{
    toolsClick(item){
      switch(item.tabMsg)
      {
        case 'home': 
          window.open("https://github.com/LingHanChuJian/live2d-vue")
          break
        case 'change':
          this.$refs.l2dMange.setImgPath('http://127.0.0.1:8000/media/static/live2d/Pio/textures/pajamas-costume.png')  //这个是换衣服地址
          break
        case 'save':
          this.$refs.l2dMange.save(`live2d-${Date.now()}.png`)
          break
        case 'about': 
          window.open("https://github.com/LingHanChuJian/live2d-vue")
          break
        case 'hide': 
          this.islive2d = false
          this.toolsDisplay('hide')
          break
        case 'show':
          this.islive2d = true
          this.toolsDisplay('show')
          break
      }
    },
    toolsDisplay(display){
      for(let i=0,len=this.toolsData.length;i<len;i++){
        let tabMsg =  this.toolsData[i].tabMsg
        if(display === 'hide'){
          if(tabMsg === 'home' || tabMsg === 'about')
            continue
          this.toolsData[i].show = false
          if(tabMsg === 'hide'){
            this.toolsData[i].show = true
            this.toolsData[i].tabMsg = 'show'
          }
        }else{
          this.toolsData[i].show = true
          if(tabMsg === 'show')
            this.toolsData[i].tabMsg = 'hide'
        }
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
  #app
    position relative
  .tools-panel
    position fixed
    left 0
    bottom 0
    max-width 32px
  .live2d-panel
    position fixed
    left: 0
    bottom: 0
</style>
