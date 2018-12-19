/**
 * EYHN 基于 https://github.com/EYHN/hexo-helper-live2d  Live2DFramework.js 修改
 *
 * Copyright © 2016 - 2017 EYHN
 */
// ============================================================
// ============================================================
//  class L2DBaseModel
// ============================================================
// ============================================================

import { logError, logWarn } from './log'

let texCounter = 0

class L2DBaseModel {
  constructor () {
    this.live2DModel = null // ALive2DModel
    this.modelMatrix = null // L2DModelMatrix
    this.eyeBlink = null // L2DEyeBlink
    this.physics = null // L2DPhysics
    this.pose = null // L2DPose
    this.debugMode = false
    this.initialized = false
    this.updating = false
    this.alpha = 1
    this.accAlpha = 0
    this.lipSync = false
    this.lipSyncValue = 0
    this.accelX = 0
    this.accelY = 0
    this.accelZ = 0
    this.dragX = 0
    this.dragY = 0
    this.startTimeMSec = null
    this.mainMotionManager = new L2DMotionManager() // L2DMotionManager
    this.expressionManager = new L2DMotionManager() // L2DMotionManager
    this.motions = {}
    this.expressions = {}
    this.isTexLoaded = false
  }

  getModelMatrix () {
    return this.modelMatrix
  }

  setAlpha (a/* float */) {
    if (a > 0.999) a = 1
    if (a < 0.001) a = 0
    this.alpha = a
  }

  getAlpha () {
    return this.alpha
  }

  isInitialized () {
    return this.initialized
  }

  setInitialized (v/* boolean */) {
    this.initialized = v
  }

  isUpdating () {
    return this.updating
  }

  setUpdating (v/* boolean */) {
    this.updating = v
  }

  getLive2DModel () {
    return this.live2DModel
  }

  setLipSync (v/* boolean */) {
    this.lipSync = v
  }

  setLipSyncValue (v/* float */) {
    this.lipSyncValue = v
  }

  setAccel (x/* float */, y/* float */, z/* float */) {
    this.accelX = x
    this.accelY = y
    this.accelZ = z
  }

  setDrag (x/* float */, y/* float */) {
    this.dragX = x
    this.dragY = y
  }

  getMainMotionManager () {
    return this.mainMotionManager
  }

  getExpressionManager () {
    return this.expressionManager
  }

  loadModelData (path/* String */, callback) {
        /*
            if( this.live2DModel != null ) {
                this.live2DModel.deleteTextures();
            }
        */
    let pm = Live2DFramework.getPlatformManager() // IPlatformManager
    if (this.debugMode) pm.log(`Load model : ${path}`)

    let thisRef = this
    pm.loadLive2DModel(path, l2dModel => {
      thisRef.live2DModel = l2dModel
      thisRef.live2DModel.saveParam()

            let _err = Live2D.getError() // eslint-disable-line

      if (_err !== 0) {
        logError('Error : Failed to loadModelData().')
        return
      }

      thisRef.modelMatrix = new L2DModelMatrix(
                thisRef.live2DModel.getCanvasWidth(),
                thisRef.live2DModel.getCanvasHeight()) // L2DModelMatrix
      thisRef.modelMatrix.setWidth(2)
      thisRef.modelMatrix.setCenterPosition(0, 0)
      callback(thisRef.live2DModel)
    })
  }

  loadTexture (no/* int */, path/* String */, callback) {
    texCounter++

    let pm = Live2DFramework.getPlatformManager() // IPlatformManager

    if (this.debugMode) pm.log(`Load Texture : ${path}`)

    let thisRef = this
    pm.loadTexture(this.live2DModel, no, path, () => {
      texCounter--
      if (texCounter === 0) thisRef.isTexLoaded = true
      if (typeof callback === 'function') callback()
    })
  }

  loadMotion (name/* String */, path /* String */, callback) {
    let pm = Live2DFramework.getPlatformManager() // IPlatformManager

    if (this.debugMode) pm.log(`Load Motion : ${path}`)

    let motion = null // Live2DMotion

    let thisRef = this
    pm.loadBytes(path, buf => {
            motion = Live2DMotion.loadMotion(buf) // eslint-disable-line
      if (name != null) {
        thisRef.motions[name] = motion
      }
      callback(motion)
    })
  }

  loadExpression (name/* String */, path /* String */, callback) {
    let pm = Live2DFramework.getPlatformManager() // IPlatformManager

    if (this.debugMode) pm.log(`Load Expression : ${path}`)

    let thisRef = this
    pm.loadBytes(path, buf => {
      if (name != null) {
        thisRef.expressions[name] = L2DExpressionMotion.loadJson(buf)
      }
      if (typeof callback === 'function') callback()
    })
  }

  loadPose (path /* String */, callback) {
    let pm = Live2DFramework.getPlatformManager() // IPlatformManager
    if (this.debugMode) pm.log(`Load Pose : ${path}`)
    let thisRef = this
    try {
      pm.loadBytes(path, buf => {
        thisRef.pose = L2DPose.load(buf)
        if (typeof callback === 'function') callback()
      })
    } catch (e) {
      logWarn(e)
    }
  }

  loadPhysics (path/* String */) {
    let pm = Live2DFramework.getPlatformManager() // IPlatformManager
    if (this.debugMode) pm.log(`Load Physics : ${path}`)
    let thisRef = this
    try {
      pm.loadBytes(path, buf => {
        thisRef.physics = L2DPhysics.load(buf)
      })
    } catch (e) {
      logWarn(e)
    }
  }

  hitTestSimple (drawID, testX, testY) {
    if (this.live2DModel === null) return !1

    let drawIndex = this.live2DModel.getDrawDataIndex(drawID)

    if (drawIndex < 0) return false

    let [points, left, right, top, bottom] = [this.live2DModel.getTransformedPoints(drawIndex), this.live2DModel.getCanvasWidth(), 0, this.live2DModel.getCanvasHeight(), 0]

    for (let j = 0; j < points.length; j = j + 2) {
      let x = points[j]
      let y = points[j + 1]

      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
    let [tx, ty] = [this.modelMatrix.invertTransformX(testX), this.modelMatrix.invertTransformY(testY)]

    return (left <= tx && tx <= right && top <= ty && ty <= bottom)
  }

  hitTestSimpleCustom (x, y, testX, testY) {
    if (this.live2DModel === null) return !1
    if (testX >= x[0] && testX <= y[0]) {
      if (testY <= x[1] && testY >= y[1]) { return true }
    }
    return false
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DExpressionMotion  extends     AMotion
// ============================================================
// ============================================================

class L2DExpressionMotion extends AMotion { // eslint-disable-line
  constructor () {
    super()
    this.paramList = []
  }

    updateParamExe(model /*ALive2DModel*/, timeMSec/*long*/, weight /*float*/, motionQueueEnt /*MotionQueueEnt*/) { // eslint-disable-line
      for (let i = this.paramList.length - 1; i >= 0; --i) {
        let param = this.paramList[i] // L2DExpressionParam
            // if (!param || !param.type) continue
        if (param.type === L2DExpressionMotion.TYPE_ADD) {
          model.addToParamFloat(param.id, param.value, weight)
        } else if (param.type === L2DExpressionMotion.TYPE_MULT) {
          model.multParamFloat(param.id, param.value, weight)
        } else if (param.type === L2DExpressionMotion.TYPE_SET) {
          model.setParamFloat(param.id, param.value, weight)
        }
      }
    }
}

L2DExpressionMotion.EXPRESSION_DEFAULT = 'DEFAULT'
L2DExpressionMotion.TYPE_SET = 0
L2DExpressionMotion.TYPE_ADD = 1
L2DExpressionMotion.TYPE_MULT = 2

L2DExpressionMotion.loadJson = buf => {
  let ret = new L2DExpressionMotion()
  let pm = Live2DFramework.getPlatformManager()
  let json = pm.jsonParseFromBytes(buf)

  ret.setFadeIn(parseInt(json.fade_in) > 0 ? parseInt(json.fade_in) : 1000)
  ret.setFadeOut(parseInt(json.fade_out) > 0 ? parseInt(json.fade_out) : 1000)

  if (json.params == null) {
    return ret
  }

  let params = json.params
  let paramNum = params.length
  ret.paramList = [] // ArrayList<L2DExpressionParam>
  for (let i = 0; i < paramNum; i++) {
    let param = params[i]
    let paramID = param.id.toString()
    let value = parseFloat(param.val)
    let calcTypeInt = L2DExpressionMotion.TYPE_ADD
    let calc = param.calc != null ? param.calc.toString() : 'add'
    if (calc === 'add') {
      calcTypeInt = L2DExpressionMotion.TYPE_ADD
    } else if (calc === 'mult') {
      calcTypeInt = L2DExpressionMotion.TYPE_MULT
    } else if (calc === 'set') {
      calcTypeInt = L2DExpressionMotion.TYPE_SET
    } else {
      calcTypeInt = L2DExpressionMotion.TYPE_ADD
    }
    if (calcTypeInt === L2DExpressionMotion.TYPE_ADD) {
      let defaultValue = param.def == null ? 0 : parseFloat(param.def)
      value = value - defaultValue
    } else if (calcTypeInt === L2DExpressionMotion.TYPE_MULT) {
      let defaultValue2 = param.def == null ? 1 : parseFloat(param.def)
      if (defaultValue2 === 0) defaultValue2 = 1
      value = value / defaultValue2
    }

    let item = new L2DExpressionParam()
    item.id = paramID
    item.type = calcTypeInt
    item.value = value

    ret.paramList.push(item)
  }

  return ret
}
// ============================================================
// ============================================================
//  class L2DExpressionParam
// ============================================================
// ============================================================

class L2DExpressionParam {
  constructor () {
    this.id = ''
    this.type = -1
    this.value = null
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DEyeBlink
// ============================================================
// ============================================================

class L2DEyeBlink {
  constructor () {
    this.nextBlinkTime = null /* TODO NOT INIT */
    this.stateStartTime = null /* TODO NOT INIT */
    this.blinkIntervalMsec = null /* TODO NOT INIT */
    this.eyeState = EYE_STATE.STATE_FIRST
    this.blinkIntervalMsec = 4000
    this.closingMotionMsec = 100
    this.closedMotionMsec = 50
    this.openingMotionMsec = 150
    this.closeIfZero = true
    this.eyeID_L = 'PARAM_EYE_L_OPEN'
    this.eyeID_R = 'PARAM_EYE_R_OPEN'
  }

  calcNextBlink () {
        let time /*long*/ = UtSystem.getUserTimeMSec() // eslint-disable-line
    let r /* Number */ = Math.random()
    return  /* (long) */ (time + r * (2 * this.blinkIntervalMsec - 1))
  }

  setInterval (blinkIntervalMsec /* int */) {
    this.blinkIntervalMsec = blinkIntervalMsec
  }

  setEyeMotion (closingMotionMsec/* int */, closedMotionMsec/* int */, openingMotionMsec/* int */) {
    this.closingMotionMsec = closingMotionMsec
    this.closedMotionMsec = closedMotionMsec
    this.openingMotionMsec = openingMotionMsec
  }

  updateParam (model/* ALive2DModel */) {
        let time /*:long*/ = UtSystem.getUserTimeMSec() // eslint-disable-line
    let eyeParamValue /*: Number */
    let t /*: Number */ = 0
    switch (this.eyeState) {
      case EYE_STATE.STATE_CLOSING:
        t = (time - this.stateStartTime) / this.closingMotionMsec
        if (t >= 1) {
          t = 1
          this.eyeState = EYE_STATE.STATE_CLOSED
          this.stateStartTime = time
        }
        eyeParamValue = 1 - t
        break
      case EYE_STATE.STATE_CLOSED:
        t = (time - this.stateStartTime) / this.closedMotionMsec
        if (t >= 1) {
          this.eyeState = EYE_STATE.STATE_OPENING
          this.stateStartTime = time
        }
        eyeParamValue = 0
        break
      case EYE_STATE.STATE_OPENING:
        t = (time - this.stateStartTime) / this.openingMotionMsec
        if (t >= 1) {
          t = 1
          this.eyeState = EYE_STATE.STATE_INTERVAL
          this.nextBlinkTime = this.calcNextBlink()
        }
        eyeParamValue = t
        break
      case EYE_STATE.STATE_INTERVAL:
        if (this.nextBlinkTime < time) {
          this.eyeState = EYE_STATE.STATE_CLOSING
          this.stateStartTime = time
        }
        eyeParamValue = 1
        break
      case EYE_STATE.STATE_FIRST:
      default:
        this.eyeState = EYE_STATE.STATE_INTERVAL
        this.nextBlinkTime = this.calcNextBlink()
        eyeParamValue = 1
        break
    }
    if (!this.closeIfZero) eyeParamValue = -eyeParamValue
    model.setParamFloat(this.eyeID_L, eyeParamValue)
    model.setParamFloat(this.eyeID_R, eyeParamValue)
  }
}

let EYE_STATE = {}

EYE_STATE.STATE_FIRST = 'STATE_FIRST'
EYE_STATE.STATE_INTERVAL = 'STATE_INTERVAL'
EYE_STATE.STATE_CLOSING = 'STATE_CLOSING'
EYE_STATE.STATE_CLOSED = 'STATE_CLOSED'
EYE_STATE.STATE_OPENING = 'STATE_OPENING'

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DMatrix44
// ============================================================
// ============================================================

class L2DMatrix44 {
  constructor () {
    this.tr = new Float32Array(16)
    this.identity()
  }

  identity () {
    for (let i/*: int */ = 0; i < 16; i++) { this.tr[i] = ((i % 5) === 0) ? 1 : 0 }
  }

  getArray () {
    return this.tr
  }

  getCopyMatrix () {
    return new Float32Array(this.tr) // this.tr.clone()
  }

  setMatrix (tr/* float[] */) {
    if (this.tr == null || this.tr.length !== this.tr.length) return
    for (let i/*: int */ = 0; i < 16; i++) this.tr[i] = tr[i]
  }

  getScaleX () {
    return this.tr[0]
  }

  getScaleY () {
    return this.tr[5]
  }

  transformX (src/* float */) {
    return this.tr[0] * src + this.tr[12]
  }

  transformY (src/* float */) {
    return this.tr[5] * src + this.tr[13]
  }

  invertTransformX (src/* float */) {
    return (src - this.tr[12]) / this.tr[0]
  }

  invertTransformY (src/* float */) {
    return (src - this.tr[13]) / this.tr[5]
  }

  multTranslate (shiftX/* float */, shiftY/* float */) {
    let tr1 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, shiftX, shiftY, 0, 1]
    L2DMatrix44.mul(tr1, this.tr, this.tr)
  }

  translate (x/* float */, y/* float */) {
    this.tr[12] = x
    this.tr[13] = y
  }

  translateX (x/* float */) {
    this.tr[12] = x
  }

  translateY (y/* float */) {
    this.tr[13] = y
  }

  multScale (scaleX/* float */, scaleY/* float */) {
    let tr1 = [scaleX, 0, 0, 0, 0, scaleY, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    L2DMatrix44.mul(tr1, this.tr, this.tr)
  }

  scale (scaleX/* float */, scaleY/* float */) {
    this.tr[0] = scaleX
    this.tr[5] = scaleY
  }
}

L2DMatrix44.mul = (a/* float[] */, b/* float[] */, dst/* float[] */) => {
  let c = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  let n = 4
  let i, j, k
  for (i = 0; i < n; i++) {
    for (j = 0; j < n; j++) {
      for (k = 0; k < n; k++) {
        c[i + j * 4] += a[i + k * 4] * b[k + j * 4]
      }
    }
  }
  for (i = 0; i < 16; i++) {
    dst[i] = c[i]
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DModelMatrix       extends     L2DMatrix44
// ============================================================
// ============================================================

class L2DModelMatrix extends L2DMatrix44 {
  constructor (w/* float */, h/* float */) {
    super()
    this.width = w
    this.height = h
  }

  setPosition (x/* float */, y/* float */) {
    let w = this.width * this.getScaleX()
    let h = this.height * this.getScaleY()
    this.translate(x - w / 2, y - h / 2)
  }

  setCenterPosition (x/* float */, y/* float */) {
    let w = this.width * this.getScaleX()
    let h = this.height * this.getScaleY()
    this.translate(x - w / 2, y - h / 2)
  }

  top (y/* float */) {
    this.setY(y)
  }

  bottom (y/* float */) {
    let h = this.height * this.getScaleY()
    this.translateY(y - h)
  }

  left (x/* float */) {
    this.setX(x)
  }

  right (x/* float */) {
    let w = this.width * this.getScaleX()
    this.translateX(x - w)
  }

  centerX (x/* float */) {
    let w = this.width * this.getScaleX()
    this.translateX(x - w / 2)
  }

  centerY (y/* float */) {
    let h = this.height * this.getScaleY()
    this.translateY(y - h / 2)
  }

  setX (x/* float */) {
    this.translateX(x)
  }

  setY (y/* float */) {
    this.translateY(y)
  }

  setHeight (h/* float */) {
    let scaleX = h / this.height
    let scaleY = -scaleX
    this.scale(scaleX, scaleY)
  }

  setWidth (w/* float */) {
    let scaleX = w / this.width
    let scaleY = -scaleX
    this.scale(scaleX, scaleY)
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DMotionManager     extends     MotionQueueManager
// ============================================================
// ============================================================

class L2DMotionManager extends MotionQueueManager { // eslint-disable-line
  constructor () {
    super()
    this.currentPriority = null
    this.reservePriority = null

        this.super = MotionQueueManager.prototype // eslint-disable-line
  }

  getCurrentPriority () {
    return this.currentPriority
  }

  getReservePriority () {
    return this.reservePriority
  }

  reserveMotion (priority/* int */) {
    if (this.reservePriority >= priority) {
      return false
    }
    if (this.currentPriority >= priority) {
      return false
    }
    this.reservePriority = priority
    return true
  }

  setReservePriority (val/* int */) {
    this.reservePriority = val
  }

  updateParam (model/* ALive2DModel */) {
        let updated = MotionQueueManager.prototype.updateParam.call(this, model) // eslint-disable-line
    if (this.isFinished()) {
      this.currentPriority = 0
    }
    return updated
  }

  startMotionPrio (motion/* AMotion */, priority/* int */) {
    if (priority === this.reservePriority) {
      this.reservePriority = 0
    }
    this.currentPriority = priority
    return this.startMotion(motion, false)
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DPhysics
// ============================================================
// ============================================================

class L2DPhysics {
  constructor () {
    this.physicsList = [] // ArrayList<PhysicsHair>
    this.startTimeMSec = UtSystem.getUserTimeMSec() // eslint-disable-line
  }

  updateParam (model/* ALive2DModel */) {
    let timeMSec = UtSystem.getUserTimeMSec() - this.startTimeMSec // eslint-disable-line
    for (let i = 0; i < this.physicsList.length; i++) {
      this.physicsList[i].update(model, timeMSec)
    }
  }
}

L2DPhysics.load = buf => {
  let ret = new L2DPhysics() // L2DPhysicsL2DPhysics
  let pm = Live2DFramework.getPlatformManager()
  let json = pm.jsonParseFromBytes(buf)
  let params = json.physics_hair
  let paramNum = params.length
  for (let i = 0; i < paramNum; i++) {
    let param = params[i] // Value
    let physics = new PhysicsHair() // eslint-disable-line
    let setup = param.setup // Value
    let length = parseFloat(setup.length)
    let resist = parseFloat(setup.regist)
    let mass = parseFloat(setup.mass)
    physics.setup(length, resist, mass)
    let srcList = param.src // Value
    let srcNum = srcList.length
    for (let j = 0; j < srcNum; j++) {
      let src = srcList[j] // Value
      let id = src.id // String
      let type = PhysicsHair.Src.SRC_TO_X // eslint-disable-line
      let typeStr = src.ptype // String
      if (typeStr === 'x') {
        type = PhysicsHair.Src.SRC_TO_X // eslint-disable-line
      } else if (typeStr === 'y') {
        type = PhysicsHair.Src.SRC_TO_Y // eslint-disable-line
      } else if (typeStr === 'angle') {
        type = PhysicsHair.Src.SRC_TO_G_ANGLE // eslint-disable-line
      } else {
        logError('live2d', 'Invalid parameter:PhysicsHair.Src')
      }
      let scale = parseFloat(src.scale)
      let weight = parseFloat(src.weight)
      physics.addSrcParam(type, id, scale, weight)
    }
    let targetList = param.targets // Value
    let targetNum = targetList.length
    for (let j = 0; j < targetNum; j++) {
      let target = targetList[j] // Value
      let id = target.id // String
      let type = PhysicsHair.Target.TARGET_FROM_ANGLE // eslint-disable-line
      let typeStr = target.ptype // String
      if (typeStr === 'angle') {
        type = PhysicsHair.Target.TARGET_FROM_ANGLE // eslint-disable-line
      } else if (typeStr === 'angle_v') {
        type = PhysicsHair.Target.TARGET_FROM_ANGLE_V // eslint-disable-line
      } else {
        logError('live2d', 'Invalid parameter:PhysicsHair.Target')
      }
      let scale = parseFloat(target.scale)
      let weight = parseFloat(target.weight)
      physics.addTargetParam(type, id, scale, weight)
    }
    ret.physicsList.push(physics)
  }
  return ret
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DPose
// ============================================================
// ============================================================

class L2DPose {
  constructor () {
    this.lastTime = 0
    this.lastModel = null // ALive2DModel
    this.partsGroups = [] // ArrayList<L2DPartsParam[]>
  }

  updateParam (model/* ALive2DModel */) {
    if (model == null) return

    if (!(model === this.lastModel)) {
      this.initParam(model)
    }
    this.lastModel = model

        let curTime = UtSystem.getUserTimeMSec() // eslint-disable-line
    let deltaTimeSec = ((this.lastTime === 0) ? 0 : (curTime - this.lastTime) / 1000.0)
    this.lastTime = curTime
    if (deltaTimeSec < 0) deltaTimeSec = 0
    for (let i = 0; i < this.partsGroups.length; i++) {
      this.normalizePartsOpacityGroup(model, this.partsGroups[i], deltaTimeSec)
      this.copyOpacityOtherParts(model, this.partsGroups[i])
    }
  }

  initParam (model/* ALive2DModel */) {
    if (model == null) return
    for (let i = 0; i < this.partsGroups.length; i++) {
      let partsGroup = this.partsGroups[i] // L2DPartsParam
      for (let j = 0; j < partsGroup.length; j++) {
        partsGroup[j].initIndex(model)
        let partsIndex = partsGroup[j].partsIndex
        let paramIndex = partsGroup[j].paramIndex
        if (partsIndex < 0) continue
        let v/*: Boolean */ = (model.getParamFloat(paramIndex) !== 0)
        model.setPartsOpacity(partsIndex, (v ? 1.0 : 0.0))
        model.setParamFloat(paramIndex, (v ? 1.0 : 0.0))
        if (partsGroup[j].link == null) continue
        for (let k = 0; k < partsGroup[j].link.length; k++) {
          partsGroup[j].link[k].initIndex(model)
        }
      }
    }
  }

  normalizePartsOpacityGroup (model/* ALive2DModel */, partsGroup/* L2DPartsParam[] */, deltaTimeSec/* float */) {
    let [visibleParts, visibleOpacity, CLEAR_TIME_SEC, phi, maxBackOpacity] = [-1, 1.0, 0.5, 0.5, 0.15]
    for (let i = 0; i < partsGroup.length; i++) {
      let partsIndex = partsGroup[i].partsIndex
      let paramIndex = partsGroup[i].paramIndex
      if (partsIndex < 0) continue
      if (model.getParamFloat(paramIndex) !== 0) {
        if (visibleParts >= 0) {
          break
        }
        visibleParts = i
        visibleOpacity = model.getPartsOpacity(partsIndex)
        visibleOpacity += deltaTimeSec / CLEAR_TIME_SEC
        if (visibleOpacity > 1) {
          visibleOpacity = 1
        }
      }
    }
    if (visibleParts < 0) {
      visibleParts = 0
      visibleOpacity = 1
    }
    for (let i = 0; i < partsGroup.length; i++) {
      let partsIndex = partsGroup[i].partsIndex
      if (partsIndex < 0) continue
      if (visibleParts === i) {
        model.setPartsOpacity(partsIndex, visibleOpacity)
      } else {
        let opacity = model.getPartsOpacity(partsIndex)
        let a1
        if (visibleOpacity < phi) {
          a1 = visibleOpacity * (phi - 1) / phi + 1
        } else {
          a1 = (1 - visibleOpacity) * phi / (1 - phi)
        }
        let backOp = (1 - a1) * (1 - visibleOpacity)
        if (backOp > maxBackOpacity) {
          a1 = 1 - maxBackOpacity / (1 - visibleOpacity)
        }
        if (opacity > a1) {
          opacity = a1
        }
        model.setPartsOpacity(partsIndex, opacity)
      }
    }
  }

  copyOpacityOtherParts (model/* ALive2DModel */, partsGroup/* L2DPartsParam[] */) {
    for (let i_group = 0; i_group < partsGroup.length; i_group++) {
      let partsParam = partsGroup[i_group] // L2DPartsParam
      if (partsParam.link == null) continue
      if (partsParam.partsIndex < 0) continue
      let opacity = model.getPartsOpacity(partsParam.partsIndex)
      for (let i_link = 0; i_link < partsParam.link.length; i_link++) {
        let linkParts = partsParam.link[i_link] // L2DPartsParam
        if (linkParts.partsIndex < 0) continue
        model.setPartsOpacity(linkParts.partsIndex, opacity)
      }
    }
  }
}

L2DPose.load = buf => {
  let ret = new L2DPose() // L2DPose
  let pm = Live2DFramework.getPlatformManager()
  let json = pm.jsonParseFromBytes(buf)
  let poseListInfo = json.parts_visible // Value
  let poseNum = poseListInfo.length
  for (let i_pose = 0; i_pose < poseNum; i_pose++) {
    let poseInfo = poseListInfo[i_pose] // Value
    let idListInfo = poseInfo.group // Value
    let idNum = idListInfo.length
    let partsGroup/* L2DPartsParam */ = []
    for (let i_group = 0; i_group < idNum; i_group++) {
      let partsInfo = idListInfo[i_group] // Value
      let parts = new L2DPartsParam(partsInfo.id) // L2DPartsParamL2DPartsParam
      partsGroup[i_group] = parts
      if (partsInfo.link == null) continue
      let linkListInfo = partsInfo.link // Value
      let linkNum = linkListInfo.length
      parts.link = [] // ArrayList<L2DPartsParam>
      for (let i_link = 0; i_link < linkNum; i_link++) {
        let linkParts = new L2DPartsParam(linkListInfo[i_link]) // L2DPartsParamL2DPartsParam
        parts.link.push(linkParts)
      }
    }
    ret.partsGroups.push(partsGroup)
  }
  return ret
}

// ============================================================
// ============================================================
//  class L2DPartsParam
// ============================================================
// ============================================================

class L2DPartsParam {
  constructor (id/* String */) {
    this.paramIndex = -1
    this.partsIndex = -1
    this.link = null // ArrayList<L2DPartsParam>
    this.id = id
  }

  initIndex (model/* ALive2DModel */) {
    this.paramIndex = model.getParamIndex(`VISIBLE: ${this.id}`)
        this.partsIndex = model.getPartsDataIndex(PartsDataID.getID(this.id)) // eslint-disable-line
    model.setParamFloat(this.paramIndex, 1)
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DTargetPoint
// ============================================================
// ============================================================

class L2DTargetPoint {
  constructor () {
    this.EPSILON = 0.01 // 変化の最小値（この値以下は無視される）
    this.faceTargetX = 0
    this.faceTargetY = 0
    this.faceX = 0
    this.faceY = 0
    this.faceVX = 0
    this.faceVY = 0
    this.lastTimeSec = 0
  }

  setPoint (x/* float */, y/* float */) {
    this.faceTargetX = x
    this.faceTargetY = y
  }

  getX () {
    return this.faceX
  }

  getY () {
    return this.faceY
  }

  update () {
    const TIME_TO_MAX_SPEED = 0.15
    const FACE_PARAM_MAX_V = 40.0 / 7.5
    const MAX_V = FACE_PARAM_MAX_V / L2DTargetPoint.FRAME_RATE
    if (this.lastTimeSec === 0) {
            this.lastTimeSec = UtSystem.getUserTimeMSec() // eslint-disable-line
      return
    }
        let curTimeSec = UtSystem.getUserTimeMSec() // eslint-disable-line
    let deltaTimeWeight = (curTimeSec - this.lastTimeSec) * L2DTargetPoint.FRAME_RATE / 1000.0
    this.lastTimeSec = curTimeSec
    const FRAME_TO_MAX_SPEED = TIME_TO_MAX_SPEED * L2DTargetPoint.FRAME_RATE
    const MAX_A = deltaTimeWeight * MAX_V / FRAME_TO_MAX_SPEED
    let dx = (this.faceTargetX - this.faceX)
    let dy = (this.faceTargetY - this.faceY)
        // if(dx == 0 && dy == 0) return
    if (Math.abs(dx) <= this.EPSILON && Math.abs(dy) <= this.EPSILON) return
    let d = Math.sqrt(dx * dx + dy * dy)
    let vx = MAX_V * dx / d
    let vy = MAX_V * dy / d
    let ax = vx - this.faceVX
    let ay = vy - this.faceVY
    let a = Math.sqrt(ax * ax + ay * ay)
    if (a < -MAX_A || a > MAX_A) {
      ax *= MAX_A / a
      ay *= MAX_A / a
      a = MAX_A
    }
    this.faceVX += ax
    this.faceVY += ay
    {
      let max_v = 0.5 * (Math.sqrt(MAX_A * MAX_A + 16 * MAX_A * d - 8 * MAX_A * d) - MAX_A)
      let cur_v = Math.sqrt(this.faceVX * this.faceVX + this.faceVY * this.faceVY)
      if (cur_v > max_v) {
        this.faceVX *= max_v / cur_v
        this.faceVY *= max_v / cur_v
      }
    }
    this.faceX += this.faceVX
    this.faceY += this.faceVY
  }
}

L2DTargetPoint.FRAME_RATE = 30

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class L2DViewMatrix        extends     L2DMatrix44
// ============================================================
// ============================================================

class L2DViewMatrix extends L2DMatrix44 {
  constructor () {
    super()
    this.screenLeft = null
    this.screenRight = null
    this.screenTop = null
    this.screenBottom = null
    this.maxLeft = null
    this.maxRight = null
    this.maxTop = null
    this.maxBottom = null
    this.max = Number.MAX_VALUE
    this.min = 0
  }

  getMaxScale () {
    return this.max
  }

  getMinScale () {
    return this.min
  }

  setMaxScale (v/* float */) {
    this.max = v
  }

  setMinScale (v/* float */) {
    this.min = v
  }

  isMaxScale () {
    return this.getScaleX() === this.max
  }

  isMinScale () {
    return this.getScaleX() === this.min
  }

  adjustTranslate (shiftX/* float */, shiftY/* float */) {
    if (this.tr[0] * this.maxLeft + (this.tr[12] + shiftX) > this.screenLeft) { shiftX = this.screenLeft - this.tr[0] * this.maxLeft - this.tr[12] }
    if (this.tr[0] * this.maxRight + (this.tr[12] + shiftX) < this.screenRight) { shiftX = this.screenRight - this.tr[0] * this.maxRight - this.tr[12] }
    if (this.tr[5] * this.maxTop + (this.tr[13] + shiftY) < this.screenTop) { shiftY = this.screenTop - this.tr[5] * this.maxTop - this.tr[13] }
    if (this.tr[5] * this.maxBottom + (this.tr[13] + shiftY) > this.screenBottom) { shiftY = this.screenBottom - this.tr[5] * this.maxBottom - this.tr[13] }

    let tr1 = [1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      shiftX, shiftY, 0, 1]
    L2DMatrix44.mul(tr1, this.tr, this.tr)
  }

  adjustScale (cx/* float */, cy/* float */, scale/* float */) {
    let targetScale = scale * this.tr[0]
    if (targetScale < this.min) {
      if (this.tr[0] > 0) scale = this.min / this.tr[0]
    } else if (targetScale > this.max) {
      if (this.tr[0] > 0) scale = this.max / this.tr[0]
    }
    let tr1 = [1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      cx, cy, 0, 1]
    let tr2 = [scale, 0, 0, 0,
      0, scale, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1]
    let tr3 = [1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      -cx, -cy, 0, 1]
    L2DMatrix44.mul(tr3, this.tr, this.tr)
    L2DMatrix44.mul(tr2, this.tr, this.tr)
    L2DMatrix44.mul(tr1, this.tr, this.tr)
  }

  setScreenRect (left/* float */, right/* float */, bottom/* float */, top/* float */) {
    this.screenLeft = left
    this.screenRight = right
    this.screenTop = top
    this.screenBottom = bottom
  }

  setMaxScreenRect (left/* float */, right/* float */, bottom/* float */, top/* float */) {
    this.maxLeft = left
    this.maxRight = right
    this.maxTop = top
    this.maxBottom = bottom
  }

  getScreenLeft () {
    return this.screenLeft
  }

  getScreenRight () {
    return this.screenRight
  }

  getScreenBottom () {
    return this.screenBottom
  }

  getScreenTop () {
    return this.screenTop
  }

  getMaxLeft () {
    return this.maxLeft
  }

  getMaxRight () {
    return this.maxRight
  }

  getMaxBottom () {
    return this.maxBottom
  }

  getMaxTop () {
    return this.maxTop
  }
}

/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */

// ============================================================
// ============================================================
//  class Live2DFramework
// ============================================================
// ============================================================

class Live2DFramework { }

Live2DFramework.platformManager = null

Live2DFramework.getPlatformManager = () => {
  return Live2DFramework.platformManager
}

Live2DFramework.setPlatformManager = platformManager => {
  Live2DFramework.platformManager = platformManager
}

export {
    L2DTargetPoint,
    Live2DFramework,
    L2DViewMatrix,
    L2DPose,
    L2DPartsParam,
    L2DPhysics,
    L2DMotionManager,
    L2DModelMatrix,
    L2DMatrix44,
    EYE_STATE,
    L2DEyeBlink,
    L2DExpressionParam,
    L2DExpressionMotion,
    L2DBaseModel
}
