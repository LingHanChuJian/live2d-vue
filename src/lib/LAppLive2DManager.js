import { Live2DFramework } from './Live2DFramework'
import PlatformManager from './PlatformManager'
import LAppModel from './LAppModel'
import LAppDefine from './LAppDefine'
import { logInfo } from './log'

class LAppLive2DManager {
  constructor () {
    // logInfo("--> LAppLive2DManager()")
    this.models = []

    this.count = -1
    this.reloadFlg = false

    // Live2D.init()
    Live2DFramework.setPlatformManager(new PlatformManager())
  }

  createModel () {
    let model = new LAppModel()
    this.models.push(model)
    return model
  }

  changeModel (gl, modelurl) {
        // logInfo("--> LAppLive2DManager.update(gl)")

    if (this.reloadFlg) {
      this.reloadFlg = false
      this.releaseModel(0, gl)
      this.createModel()

      this.models[0].load(gl, modelurl)
    }
  }

  getModel (no) {
        // logInfo("--> LAppLive2DManager.getModel(" + no + ")")

    if (no >= this.models.length) return null
    return this.models[no]
  }

  releaseModel (no, gl) {
        // logInfo("--> LAppLive2DManager.releaseModel(" + no + ")")

    if (this.models.length <= no) return

    this.models[no].release(gl)

    delete this.models[no]
    this.models.splice(no, 1)
  }

  numModels () {
    return this.models.length
  }

  setDrag (x, y) {
    for (let i = 0; i < this.models.length; i++) {
      this.models[i].setDrag(x, y)
    }
  }

  maxScaleEvent () {
    if (LAppDefine.DEBUG_LOG) { logInfo('Max scale event.') }
    for (let i = 0; i < this.models.length; i++) {
      this.models[i].startRandomMotion(LAppDefine.MOTION_GROUP_PINCH_IN,
                LAppDefine.PRIORITY_NORMAL)
    }
  }

  minScaleEvent () {
    if (LAppDefine.DEBUG_LOG) { logInfo('Min scale event.') }
    for (let i = 0; i < this.models.length; i++) {
      this.models[i].startRandomMotion(LAppDefine.MOTION_GROUP_PINCH_OUT,
                LAppDefine.PRIORITY_NORMAL)
    }
  }

  tapEvent (x, y) {
    if (LAppDefine.DEBUG_LOG) { logInfo('tapEvent view x:' + x + ' y:' + y) }

    for (let i = 0; i < this.models.length; i++) {
      if (this.models[i].hitTest(LAppDefine.HIT_AREA_HEAD, x, y)) {
        if (LAppDefine.DEBUG_LOG) { logInfo('Tap face.') }

        this.models[i].setRandomExpression()
      } else if (this.models[i].hitTest(LAppDefine.HIT_AREA_BODY, x, y)) {
        if (LAppDefine.DEBUG_LOG) { logInfo('Tap body.' + ' models[' + i + ']') }

        this.models[i].startRandomMotion(LAppDefine.MOTION_GROUP_TAP_BODY,
                    LAppDefine.PRIORITY_NORMAL)
      } else if (this.models[i].hitTestCustom('head', x, y)) {
        if (LAppDefine.DEBUG_LOG) { logInfo('Tap face.') }

        this.models[i].startRandomMotion(LAppDefine.MOTION_GROUP_FLICK_HEAD,
                    LAppDefine.PRIORITY_NORMAL)
      } else if (this.models[i].hitTestCustom('body', x, y)) {
        if (LAppDefine.DEBUG_LOG) { logInfo('Tap body.' + ' models[' + i + ']') }

        this.models[i].startRandomMotion(LAppDefine.MOTION_GROUP_TAP_BODY,
                    LAppDefine.PRIORITY_NORMAL)
      }
    }

    return true
  }
}

export default LAppLive2DManager
