import { logError } from './log'
let context

export const setContext = webglContext => {
  context = webglContext
}

export const getContext = () => {
  return context
}

export const getWebGLContext = canvas => {
  let NAMES = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl']
    for (let i = 0; i < NAMES.length; i++) {
      try {
        let ctx = canvas.getContext(NAMES[i], { premultipliedAlpha: true })
        if (ctx) return ctx
      } catch (e) {
        logError(`getWebGLContext : ${e}`)
      }
    }
    return null
}