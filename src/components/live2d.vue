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
      type: Number,
      default: 280
    },
    height:{
      type: Number,
      default: 250
    },
    canvasID:{
      type: String,
      default: uuid()
    },
    modelPath: String
  },
  mounted(){
    initL2dCanvas(this.canvasID)
    init(this.modelPath)
  }
}
</script>

<style scoped>
</style>


