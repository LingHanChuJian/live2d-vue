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

    this.modelSetting = new ModelSettingJson(Number(gl.canvas.getAttribute('data-hook')))

    this.modelSetting.loadModelSetting(modelSettingPath, () => {
      let path = this.modelHomeDir + this.modelSetting.getModelFile()
      this.loadModelData(path, gl, () => {
        for (let i = 0; i < this.modelSetting.getTextureNum(); i++) {
          let texPaths
          if (/^https?:\/\/|^\/\//i.test(this.modelSetting.getTextureFile(i))) {
            texPaths = this.modelSetting.getTextureFile(i)
          } else {
            texPaths = this.modelHomeDir +
                            this.modelSetting.getTextureFile(i)
          }
          this.loadTexture(i, texPaths, gl, () => {
            if (this.isTexLoaded) {
              if (this.modelSetting.getExpressionNum() > 0) {
                this.expressions = {}
                for (let j = 0; j < this.modelSetting.getExpressionNum(); j++) {
                  let expName = this.modelSetting.getExpressionName(j)
                  let expFilePath = this.modelHomeDir + this.modelSetting.getExpressionFile(j)
                  this.loadExpression(expName, expFilePath, gl)
                }
              } else {
                this.expressionManager = null
                this.expressions = {}
              }

              // if (this.eyeBlink == null) {
              //     this.eyeBlink = new L2DEyeBlink()
              // }

              if (this.modelSetting.getPhysicsFile() != null) {
                this.loadPhysics(this.modelHomeDir + this.modelSetting.getPhysicsFile(), gl)
              } else {
                this.physics = null
              }

              if (this.modelSetting.getPoseFile() != null) {
                this.loadPose(this.modelHomeDir + this.modelSetting.getPoseFile(), gl, () => {
                  this.pose.updateParam(this.live2DModel)
                })
              } else {
                this.pose = null
              }

              if (this.modelSetting.getLayout() != null) {
                let layout = this.modelSetting.getLayout()
                if (layout['width'] != null) { this.modelMatrix.setWidth(layout['width']) }
                if (layout['height'] != null) { this.modelMatrix.setHeight(layout['height']) }

                if (layout['x'] != null) { this.modelMatrix.setX(layout['x']) }
                if (layout['y'] != null) { this.modelMatrix.setY(layout['y']) }
                if (layout['center_x'] != null) { this.modelMatrix.centerX(layout['center_x']) }
                if (layout['center_y'] != null) { this.modelMatrix.centerY(layout['center_y']) }
                if (layout['top'] != null) { this.modelMatrix.top(layout['top']) }
                if (layout['bottom'] != null) { this.modelMatrix.bottom(layout['bottom']) }
                if (layout['left'] != null) { this.modelMatrix.left(layout['left']) }
                if (layout['right'] != null) { this.modelMatrix.right(layout['right']) }
              }

              if (this.modelSetting.getHitAreasCustom() != null) {
                let hit_areas_custom = this.modelSetting.getHitAreasCustom()
                if (hit_areas_custom['head_x'] != null) { LAppDefine.hit_areas_custom_head_x = hit_areas_custom['head_x'] }
                if (hit_areas_custom['head_y'] != null) { LAppDefine.hit_areas_custom_head_y = hit_areas_custom['head_y'] }
                if (hit_areas_custom['body_x'] != null) { LAppDefine.hit_areas_custom_body_x = hit_areas_custom['body_x'] }
                if (hit_areas_custom['body_y'] != null) { LAppDefine.hit_areas_custom_body_y = hit_areas_custom['body_y'] }
              }

              for (let j = 0; j < this.modelSetting.getInitParamNum(); j++) {
                this.live2DModel.setParamFloat(
                                    this.modelSetting.getInitParamID(j),
                                    this.modelSetting.getInitParamValue(j)
                                )
              }

              for (let k = 0; k < this.modelSetting.getInitPartsVisibleNum(); k++) {
                this.live2DModel.setPartsOpacity(
                                    this.modelSetting.getInitPartsVisibleID(k),
                                    this.modelSetting.getInitPartsVisibleValue(k)
                                )
              }

              this.live2DModel.saveParam()
                            // this.live2DModel.setGL(gl)

              this.preloadMotionGroup(LAppDefine.MOTION_GROUP_IDLE, gl)
              this.preloadMotionGroup(LAppDefine.MOTION_GROUP_SLEEPY, gl)
              this.mainMotionManager.stopAllMotions()

              this.setUpdating(false)
              this.setInitialized(true)

              if (typeof callback === 'function') callback()
            }
          })
        }
      })
    })
  }

  release (gl) {
    // this.live2DModel.deleteTextures()
    let pm = Live2DFramework.getInstance().getPlatformManager(Number(gl.canvas.getAttribute('data-hook')))
    gl.deleteTexture(pm.texture)
  }

  preloadMotionGroup (name, gl) {
    for (let i = 0; i < this.modelSetting.getMotionNum(name); i++) {
      let file = this.modelSetting.getMotionFile(name, i)
      this.loadMotion(file, this.modelHomeDir + file, gl, motion => {
        motion.setFadeIn(this.modelSetting.getMotionFadeIn(name, i))
        motion.setFadeOut(this.modelSetting.getMotionFadeOut(name, i))
      })
    }
  }

  update (gl) {
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
        this.startRandomMotion(LAppDefine.MOTION_GROUP_SLEEPY, LAppDefine.PRIORITY_SLEEPY, gl)
      } else {
        this.startRandomMotion(LAppDefine.MOTION_GROUP_IDLE, LAppDefine.PRIORITY_IDLE, gl)
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

  startRandomMotion (name, priority, gl) {
    let max = this.modelSetting.getMotionNum(name)
    let no = parseInt(Math.random() * max)
    this.startMotion(name, no, priority, gl)
  }

  startMotion (name, no, priority, gl) {
    // logInfo(`startMotion : ${name} ${no} ${priority}`)
    
    let motionName = this.modelSetting.getMotionFile(name, no)

    if (motionName === null || motionName === '') {
      if (LAppDefine.DEBUG_LOG) { logError('Failed to motion.') }
      return
    }

    if (priority === LAppDefine.PRIORITY_FORCE) {
      this.mainMotionManager.setReservePriority(priority)
    } else if (!this.mainMotionManager.reserveMotion(priority)) {
      if (LAppDefine.DEBUG_LOG) { logInfo('Motion is running.') }
      return
    }

    let motion
    if (this.motions[name] == null) {
      this.loadMotion(null, this.modelHomeDir + motionName, gl, mtn => {
        motion = mtn
        this.setFadeInFadeOut(name, no, priority, motion)
      })
    } else {
      motion = this.motions[name]
      this.setFadeInFadeOut(name, no, priority, motion)
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

    if(this.live2DModel == null) return

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
