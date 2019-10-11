## 关于live2d-vue二三事

1. live2d-vue 参考资料 [EYHN](https://github.com/EYHN/hexo-helper-live2d) [Jad](https://github.com/journey-ad/live2d_src) [A Panda](https://blog.imalan.cn/archives/95/)

2. 在这基础上加上一些魔法 live2d-vue 就完成了

## 食用方法
```
yarn add live2d-vue
```
```
import live2d from 'live2d-vue'
Vue.use(live2d)
```
```
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

```
# API

## live2d 人物

#### `:width` 宽度  
> 默认  280

#### `:height`  高度 
> 默认  250  

#### `:canvasID`  标签ID 
> 默认 ''

#### `:modelPath`  模型JSON路径

#### `:canvasStyle` canvas样式
> 默认 {'position': 'relative','z-index': 99}

## dialogue 对话框

#### `:dialogueID` 标签ID
> 默认 uuid()

#### `:dialogueStyle` 标签样式
>默认 undefined

#### `customDialogue` 栗子
>默认 undefined

```
export default {
    "mouseover": [{
        "selector": [".live2d"],
        "message": ["干嘛呢你，快把手拿开", "鼠…鼠标放错地方了！", "别过来,变态!"]
    }, {
        "selector": ["#home"],
        "message": ["想看我的主页么?"]
    }, {
        "selector": ["#change"],
        "message": ["喜欢换装play?"]
    }, {
        "selector": ["#save"],
        "message": ["保持微笑就好"]
    }, {
        "selector": ["#about"],
        "message": ["想知道我的一切?"]
    },{
        "selector": ["#hide"],
        "message": ["哼! 你会后悔的!!"]
    }],
    "click": [
        {
            "selector": [".live2d"],
            "message": ["是…是不小心碰到了吧", "萝莉控是什么呀", "你看到我的小熊了吗?", "再摸的话我可要报警了！⌇●﹏●⌇", "110吗，这里有个变态一直在摸我(ó﹏ò｡)", "我要生气哟(ー`´ー)"]
        }
    ]
}
```

## live2dTools 标签

#### `:width` 展示的宽度
>默认 28

#### `:minWidth` 最小展示宽度
>默认 18

#### `:position` 位置 'left' 'right'
>默认 'left'

#### `:customDialogue` 
>默认 undefined  同上 dialogue 标签

#### `:dialogueRightLevelPosition`
>默认 10        对话框在右边水平位置

#### `:toolsID` 标签ID
>单个标签 默认 '' 多个标签 必填

#### `:backgroundColor` 标签背景
>默认 #FFFFFF

#### `:toolsStyle` 标签样式
>默认 undefined

#### `:tabMsg` 标签描述
>默认 undefined

## 关于模型

[模型参考](https://github.com/LingHanChuJian/live2d-vue/tree/master/model)

如何制作 [live2d模型](https://imjad.cn/archives/lab/add-dynamic-poster-girl-with-live2d-to-your-blog-02)

![药水制作师](https://raw.githubusercontent.com/LingHanChuJian/live2d-vue/master/public/live2d.png)

![药水制作师](https://raw.githubusercontent.com/LingHanChuJian/live2d-vue/master/public/live2d-1.png)

![药水制作师](https://raw.githubusercontent.com/LingHanChuJian/live2d-vue/master/public/live2d-2.png)
