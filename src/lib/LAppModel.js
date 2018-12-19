import { Live2DFramework, L2DBaseModel } from './Live2DFramework'
import ModelSettingJson from './ModelSettingJson'
import LAppDefine from './LAppDefine'
import MatrixStack from './MatrixStack'
import { logError, logInfo } from './log'

// ============================================================
// ============================================================
//  class LAppModel     extends L2DBaseModel
// ============================================================
// ============================================================

class LAppModel extends L2DBaseModel {
  constructor () {
    super()
    this.modelHomeDir = ''
    this.modelSetting = null
    this.tmpMatrix = []
  }

  load (gl, modelSettingPath, callback) {
    logInfo(gl)
    this.setUpdating(true)
    this.setInitialized(false)

    this.modelHomeDir = modelSettingPath.substring(0, modelSettingPath.lastIndexOf('/') + 1)

    this.modelSetting = new ModelSettingJson()

    let thisRef = this

    this.modelSetting.loadModelSetting(modelSettingPath, () => {
      let path = thisRef.modelHomeDir + thisRef.modelSetting.getModelFile()
      thisRef.loadModelData(path, () => {
        for (let i = 0; i < thisRef.modelSetting.getTextureNum(); i++) {
          let texPaths
          if (/^https?:\/\/|^\/\//i.test(thisRef.modelSetting.getTextureFile(i))) {
            texPaths = thisRef.modelSetting.getTextureFile(i)
          } else {
            texPaths = thisRef.modelHomeDir +
                            thisRef.modelSetting.getTextureFile(i)
          }
          thisRef.loadTexture(i, texPaths, () => {
            if (thisRef.isTexLoaded) {
              if (thisRef.modelSetting.getExpressionNum() > 0) {
                thisRef.expressions = {}
                for (let j = 0; j < thisRef.modelSetting.getExpressionNum(); j++) {
                  let expName = thisRef.modelSetting.getExpressionName(j)
                  let expFilePath = thisRef.modelHomeDir +
                                        thisRef.modelSetting.getExpressionFile(j)
                  thisRef.loadExpression(expName, expFilePath)
                }
              } else {
                thisRef.expressionManager = null
                thisRef.expressions = {}
              }

                            // if (thisRef.eyeBlink == null) {
                            //     thisRef.eyeBlink = new L2DEyeBlink()
                            // }

              if (thisRef.modelSetting.getPhysicsFile() != null) {
                thisRef.loadPhysics(thisRef.modelHomeDir +
                                    thisRef.modelSetting.getPhysicsFile())
              } else {
                thisRef.physics = null
              }

              if (thisRef.modelSetting.getPoseFile() != null) {
                thisRef.loadPose(thisRef.modelHomeDir + thisRef.modelSetting.getPoseFile(), () => {
                  thisRef.pose.updateParam(thisRef.live2DModel)
                }
                                )
              } else {
                thisRef.pose = null
              }

              if (thisRef.modelSetting.getLayout() != null) {
                let layout = thisRef.modelSetting.getLayout()
                if (layout['width'] != null) { thisRef.modelMatrix.setWidth(layout['width']) }
                if (layout['height'] != null) { thisRef.modelMatrix.setHeight(layout['height']) }

                if (layout['x'] != null) { thisRef.modelMatrix.setX(layout['x']) }
                if (layout['y'] != null) { thisRef.modelMatrix.setY(layout['y']) }
                if (layout['center_x'] != null) { thisRef.modelMatrix.centerX(layout['center_x']) }
                if (layout['center_y'] != null) { thisRef.modelMatrix.centerY(layout['center_y']) }
                if (layout['top'] != null) { thisRef.modelMatrix.top(layout['top']) }
                if (layout['bottom'] != null) { thisRef.modelMatrix.bottom(layout['bottom']) }
                if (layout['left'] != null) { thisRef.modelMatrix.left(layout['left']) }
                if (layout['right'] != null) { thisRef.modelMatrix.right(layout['right']) }
              }

              if (thisRef.modelSetting.getHitAreasCustom() != null) {
                let hit_areas_custom = thisRef.modelSetting.getHitAreasCustom()
                if (hit_areas_custom['head_x'] != null) { LAppDefine.hit_areas_custom_head_x = hit_areas_custom['head_x'] }
                if (hit_areas_custom['head_y'] != null) { LAppDefine.hit_areas_custom_head_y = hit_areas_custom['head_y'] }
                if (hit_areas_custom['body_x'] != null) { LAppDefine.hit_areas_custom_body_x = hit_areas_custom['body_x'] }
                if (hit_areas_custom['body_y'] != null) { LAppDefine.hit_areas_custom_body_y = hit_areas_custom['body_y'] }
              }

              for (let j = 0; j < thisRef.modelSetting.getInitParamNum(); j++) {
                thisRef.live2DModel.setParamFloat(
                                    thisRef.modelSetting.getInitParamID(j),
                                    thisRef.modelSetting.getInitParamValue(j)
                                )
              }

              for (let k = 0; k < thisRef.modelSetting.getInitPartsVisibleNum(); k++) {
                thisRef.live2DModel.setPartsOpacity(
                                    thisRef.modelSetting.getInitPartsVisibleID(k),
                                    thisRef.modelSetting.getInitPartsVisibleValue(k)
                                )
              }

              thisRef.live2DModel.saveParam()
                            // thisRef.live2DModel.setGL(gl)

              thisRef.preloadMotionGroup(LAppDefine.MOTION_GROUP_IDLE)
              thisRef.preloadMotionGroup(LAppDefine.MOTION_GROUP_SLEEPY)
              thisRef.mainMotionManager.stopAllMotions()

              thisRef.setUpdating(false)
              thisRef.setInitialized(true)

              if (typeof callback === 'function') callback()
            }
          })
        }
      })
    })
  }

  release (gl) {
        // this.live2DModel.deleteTextures()
    let pm = Live2DFramework.getPlatformManager()
    gl.deleteTexture(pm.texture)
  }

  preloadMotionGroup (name) {
    let thisRef = this
    for (let i = 0; i < this.modelSetting.getMotionNum(name); i++) {
      let file = this.modelSetting.getMotionFile(name, i)
      this.loadMotion(file, this.modelHomeDir + file, motion => {
        motion.setFadeIn(thisRef.modelSetting.getMotionFadeIn(name, i))
        motion.setFadeOut(thisRef.modelSetting.getMotionFadeOut(name, i))
      })
    }
  }

  update () {
        // logInfo("--> LAppModel.update()")

    if (this.live2DModel == null) {
      if (LAppDefine.DEBUG_LOG) logError('Failed to update.')
      return
    }

        let timeMSec = UtSystem.getUserTimeMSec() - this.startTimeMSec // eslint-disable-line
    let timeSec = timeMSec / 1000.0
    let t = timeSec * 2 * Math.PI

    if (this.mainMotionManager.isFinished()) {
      let Sleepy = sessionStorage.getItem('Sleepy')
      if (Sleepy === '1') {
        this.startRandomMotion(LAppDefine.MOTION_GROUP_SLEEPY, LAppDefine.PRIORITY_SLEEPY)
      } else {
        this.startRandomMotion(LAppDefine.MOTION_GROUP_IDLE, LAppDefine.PRIORITY_IDLE)
      }
    }

    this.live2DModel.loadParam()

    let update = this.mainMotionManager.updateParam(this.live2DModel)
    if (!update) {
      if (this.eyeBlink != null) {
        this.eyeBlink.updateParam(this.live2DModel)
      }
    }

    this.live2DModel.saveParam()

    if (this.expressionManager != null &&
            this.expressions != null &&
            !this.expressionManager.isFinished()) {
      this.expressionManager.updateParam(this.live2DModel)
    }

    this.live2DModel.addToParamFloat('PARAM_ANGLE_X', this.dragX * 30, 1)
    this.live2DModel.addToParamFloat('PARAM_ANGLE_Y', this.dragY * 30, 1)
    this.live2DModel.addToParamFloat('PARAM_ANGLE_Z', (this.dragX * this.dragY) * -30, 1)

    this.live2DModel.addToParamFloat('PARAM_BODY_ANGLE_X', this.dragX * 10, 1)

    this.live2DModel.addToParamFloat('PARAM_EYE_BALL_X', this.dragX, 1)
    this.live2DModel.addToParamFloat('PARAM_EYE_BALL_Y', this.dragY, 1)

    this.live2DModel.addToParamFloat('PARAM_ANGLE_X',
            Number((15 * Math.sin(t / 6.5345))), 0.5)
    this.live2DModel.addToParamFloat('PARAM_ANGLE_Y',
            Number((8 * Math.sin(t / 3.5345))), 0.5)
    this.live2DModel.addToParamFloat('PARAM_ANGLE_Z',
            Number((10 * Math.sin(t / 5.5345))), 0.5)
    this.live2DModel.addToParamFloat('PARAM_BODY_ANGLE_X',
            Number((4 * Math.sin(t / 15.5345))), 0.5)
    this.live2DModel.setParamFloat('PARAM_BREATH',
            Number((0.5 + 0.5 * Math.sin(t / 3.2345))), 1)

    if (this.physics != null) {
      this.physics.updateParam(this.live2DModel)
    }

    if (this.lipSync == null) {
      this.live2DModel.setParamFloat('PARAM_MOUTH_OPEN_Y', this.lipSyncValue)
    }

    if (this.pose != null) {
      this.pose.updateParam(this.live2DModel)
    }

    this.live2DModel.update()
  }

  setRandomExpression () {
    let tmp = []
    for (let name in this.expressions) {
      tmp.push(name)
    }

    let no = parseInt(Math.random() * tmp.length)
    this.setExpression(tmp[no])
  }

  startRandomMotion (name, priority) {
    let max = this.modelSetting.getMotionNum(name)
    let no = parseInt(Math.random() * max)
    this.startMotion(name, no, priority)
  }

  startMotion (name, no, priority) {
        // logInfo(`startMotion : ${name} ${no} ${priority}`)

    let motionName = this.modelSetting.getMotionFile(name, no)

    if (motionName == null || motionName === '') {
      if (LAppDefine.DEBUG_LOG) { logError('Failed to motion.') }
      return
    }

    if (priority === LAppDefine.PRIORITY_FORCE) {
      this.mainMotionManager.setReservePriority(priority)
    } else if (!this.mainMotionManager.reserveMotion(priority)) {
      if (LAppDefine.DEBUG_LOG) { logInfo('Motion is running.') }
      return
    }

    let thisRef = this
    let motion

    if (this.motions[name] == null) {
      this.loadMotion(null, this.modelHomeDir + motionName, mtn => {
        motion = mtn
        thisRef.setFadeInFadeOut(name, no, priority, motion)
      })
    } else {
      motion = this.motions[name]
      thisRef.setFadeInFadeOut(name, no, priority, motion)
    }
  }

  setFadeInFadeOut (name, no, priority, motion) {
    let motionName = this.modelSetting.getMotionFile(name, no)

    motion.setFadeIn(this.modelSetting.getMotionFadeIn(name, no))
    motion.setFadeOut(this.modelSetting.getMotionFadeOut(name, no))

    if (LAppDefine.DEBUG_LOG) { logInfo(`Start motion : ${motionName}`) }

    if (this.modelSetting.getMotionSound(name, no) == null) {
      this.mainMotionManager.startMotionPrio(motion, priority)
    } else {
      let soundName = this.modelSetting.getMotionSound(name, no)
            // let player = new Sound(this.modelHomeDir + soundName)

      let snd = document.createElement('audio')
      snd.src = this.modelHomeDir + soundName

      if (LAppDefine.DEBUG_LOG) { logInfo(`Start sound : ${soundName}`) }

      snd.play()
      this.mainMotionManager.startMotionPrio(motion, priority)
    }
  }

  setExpression (name) {
    let motion = this.expressions[name]

    if (LAppDefine.DEBUG_LOG) { logInfo(`Expression : ${name}`) }

    this.expressionManager.startMotion(motion, false)
  }

  draw () {
        // logInfo("--> LAppModel.draw()")

        // if(this.live2DModel == null) return

    MatrixStack.push()

    MatrixStack.multMatrix(this.modelMatrix.getArray())

    this.tmpMatrix = MatrixStack.getMatrix()
    this.live2DModel.setMatrix(this.tmpMatrix)
    this.live2DModel.draw()

    MatrixStack.pop()
  }

  hitTest (id, testX, testY) {
    let len = this.modelSetting.getHitAreaNum()
    for (let i = 0; i < len; i++) {
      if (id === this.modelSetting.getHitAreaName(i)) {
        let drawID = this.modelSetting.getHitAreaID(i)
        return this.hitTestSimple(drawID, testX, testY)
      }
    }
    return false
  }

  hitTestCustom (type, testX, testY) {
    if (type === 'head') {
      return this.hitTestSimpleCustom(LAppDefine.hit_areas_custom_head_x, LAppDefine.hit_areas_custom_head_y, testX, testY)
    } else if (type === 'body') {
      return this.hitTestSimpleCustom(LAppDefine.hit_areas_custom_body_x, LAppDefine.hit_areas_custom_body_y, testX, testY)
    } else {
      return false
    }
  }
}

export default LAppModel
