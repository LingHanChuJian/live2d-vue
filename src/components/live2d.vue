<template lang="pug">
    canvas(:id="canvasID" :width="width" :height="height")
</template>

<script>
import uuid from 'uuid'
import { initL2dCanvas,init } from './../lib/main'

export default {
  name: "live2d",
  props:{
    width:{
      default: 280
    },
    height:{
      default: 250
    },
    canvasID:{
      default: uuid()
    },
    modelPath: String,
    cross: {
      default: false
    }
  },
  mounted(){
    initL2dCanvas(this.canvasID)
    init(this.modelPath,this.cross)
  }
}
</script>

<style scoped>
</style>


