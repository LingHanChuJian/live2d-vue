## 关于live2d-vue二三事

1. live2d-vue 参考资料 [EYHN](https://github.com/EYHN/hexo-helper-live2d) 以及[Jad](https://github.com/journey-ad/live2d_src)

2. 在这基础上加上一些魔法值 live2d-vue 就完成了

## 食用方法
```
yarn add live2d-vue
```
```
import live2d from 'live2d-vue'
Vue.use(live2d)
```
```
<live2d :modelPath="modelPath"></live2d>
<script>
export  default  {
	name: 'app',
	data: ()=>({
		modelPath:  'http://pjxaahzsk.bkt.clouddn.com/Pio/model.json'
	})
}
</script>
```
## api

**:width 宽度  默认  280**  

**:height  高度 默认  250**  

**:canvasID  标签id 默认 uuid()**  

**:modelPath  live2d模型配置json**  

## 关于模型

Pio目录模型参考

如何制作 [live2d模型](https://imjad.cn/archives/lab/add-dynamic-poster-girl-with-live2d-to-your-blog-02)

![药水制作师](https://raw.githubusercontent.com/LingHanChuJian/live2d-vue/master/public/live2d.png)
