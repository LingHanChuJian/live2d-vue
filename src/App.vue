<template lang='pug'>
  div#app
    live2d(:modelPath="modelPath")
</template>

<script>

export default {
  name: 'app',
  data :()=>({
    modelPath: 'http://pjxaahzsk.bkt.clouddn.com/Pio/model.json'
  })
}
</script>

<style>

</style>
