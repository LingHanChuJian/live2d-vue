import './live2d.min'

import { L2DTargetPoint, L2DViewMatrix, L2DMatrix44 } from './Live2DFramework'

import LAppLive2DManager from './LAppLive2DManager'

import LAppDefine from './LAppDefine'

import MatrixStack from './MatrixStack'

import { setContext, getWebGLContext } from './webglcontext'

import { logError, logInfo } from './log'

class L2dManage {
  constructor(el, modelUrl) {
    this.dragMgr = new L2DTargetPoint()
    this.viewMatrix = new L2DViewMatrix()
    this.projMatrix = new L2DMatrix44()
    this.deviceToScreen = new L2DMatrix44()
    this.live2DMgr = new LAppLive2DManager()
    this.canvas = el
    this.gl = getWebGLContext(this.canvas)
    this.isDrawStart = false
    this.drag = false
    this.head_pos = 0.5
    this.initL2dCanvas()
    this.init(modelUrl)
  }

  initL2dCanvas() {
    if (this.canvas.addEventListener) {
      // this.canvas.addEventListener("mousewheel", this.mouseEvent)
      window.addEventListener('click', e => this.mouseEvent(e))
      window.addEventListener('mousedown', e => this.mouseEvent(e))
      window.addEventListener('mousemove', e => this.mouseEvent(e))
      window.addEventListener('mouseup', e => this.mouseEvent(e))
      document.addEventListener('mouseout', e => this.mouseEvent(e))
      // this.canvas.addEventListener("contextmenu", this.mouseEvent)
      window.addEventListener('touchstart', e => this.touchEvent(e))
      window.addEventListener('touchend', e => this.touchEvent(e))
      window.addEventListener('touchmove', e => this.touchEvent(e))
    }
  }

  init(modelUrl) {
    let width = this.canvas.width
    let height = this.canvas.height

    let ratio = height / width
    let left = LAppDefine.VIEW_LOGICAL_LEFT
    let right = LAppDefine.VIEW_LOGICAL_RIGHT
    let bottom = -ratio
    let top = ratio

    window.Live2D.captureFrame = false

    this.viewMatrix.setScreenRect(left, right, bottom, top)

    this.viewMatrix.setMaxScreenRect(LAppDefine.VIEW_LOGICAL_MAX_LEFT,
      LAppDefine.VIEW_LOGICAL_MAX_RIGHT,
      LAppDefine.VIEW_LOGICAL_MAX_BOTTOM,
      LAppDefine.VIEW_LOGICAL_MAX_TOP)

    this.viewMatrix.setMaxScale(LAppDefine.VIEW_MAX_SCALE)
    this.viewMatrix.setMinScale(LAppDefine.VIEW_MIN_SCALE)

    this.projMatrix.multScale(1, (width / height))

    this.deviceToScreen.multTranslate(-width / 2.0, -height / 2.0)
    this.deviceToScreen.multScale(2 / width, -2 / width)

    setContext(this.gl)
    if (!this.gl) {
      logError('Failed to create WebGL context.')
      if (!window.WebGLRenderingContext) {
        logError("Your browser don't support WebGL, check https://get.webgl.org/ for futher information.")
      }
      return
    }
    window.Live2D.setGL(this.gl)
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0)
    this.changeModel(modelUrl)
    this.startDraw()
  }

  startDraw() {
    if (!this.isDrawStart) {
      this.isDrawStart = true
      this.tick()
    }
  }

  draw() {
    MatrixStack.reset()
    MatrixStack.loadIdentity()
    this.dragMgr.update()
    this.live2DMgr.setDrag(this.dragMgr.getX(), this.dragMgr.getY())

    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    MatrixStack.multMatrix(this.projMatrix.getArray())
    MatrixStack.multMatrix(this.viewMatrix.getArray())
    MatrixStack.push()

    for (let i = 0; i < this.live2DMgr.numModels(); i++) {
      let model = this.live2DMgr.getModel(i)

      if (model == null) return

      if (model.initialized && !model.updating) {
        model.update()
        model.draw(this.gl)
      }
    }
    MatrixStack.pop()
  }

  tick() {
    this.draw()
    let requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame

    if (window.Live2D.captureFrame) {
      window.Live2D.captureFrame = false
      let link = document.createElement('a')
      document.body.appendChild(link)
      link.setAttribute('type', 'hidden')
      link.href = this.canvas.toDataURL()
      link.download = window.Live2D.captureName || 'live2d.png'
      link.click()
    }
    requestAnimationFrame(()=>this.tick())
  }

  changeModel(modelUrl) {
    this.live2DMgr.reloadFlg = true
    this.live2DMgr.count++
    this.live2DMgr.changeModel(this.gl, modelUrl)
  }

  dot(A, B) {
    return A.x * B.x + A.y * B.y
  }

  normalize(x, y) {
    let length = Math.sqrt(x * x + y * y)
    return {
      x: x / length,
      y: y / length
    }
  }

  angle(Len_X, Len_Y) {
    return Math.acos(this.dot({
      x: 0,
      y: 1
    }, this.normalize(Len_X, Len_Y))) * 180 / Math.PI
  }

  transformRect(center, transform, rect) {
    if (transform.x < rect.left + rect.width && transform.y < rect.top + rect.height &&
      transform.x > rect.left && transform.y > rect.top) return transform
    let Len_X = center.x - transform.x
    let Len_Y = center.y - transform.y

    let angleTarget = this.angle(Len_X, Len_Y)
    if (transform.x < center.x) angleTarget = 360 - angleTarget
    let angleLeftTop = 360 - this.angle(rect.left - center.x, (rect.top - center.y) * -1)
    let angleLeftBottom = 360 - this.angle(rect.left - center.x, (rect.top + rect.height - center.y) * -1)
    let angleRightTop = this.angle(rect.left + rect.width - center.x, (rect.top - center.y) * -1)
    let angleRightBottom = this.angle(rect.left + rect.width - center.x, (rect.top + rect.height - center.y) * -1)
    let scale = Len_Y / Len_X
    let res = {}

    if (angleTarget < angleRightTop) {
      let y3 = rect.top - center.y
      let x3 = y3 / scale
      res = {
        y: center.y + y3,
        x: center.x + x3
      }
    } else if (angleTarget < angleRightBottom) {
      let x3 = rect.left + rect.width - center.x
      let y3 = x3 * scale
      res = {
        y: center.y + y3,
        x: center.x + x3
      }
    } else if (angleTarget < angleLeftBottom) {
      let y3 = rect.top + rect.height - center.y
      let x3 = y3 / scale
      res = {
        y: center.y + y3,
        x: center.x + x3
      }
    } else if (angleTarget < angleLeftTop) {
      let x3 = center.x - rect.left
      let y3 = x3 * scale
      res = {
        y: center.y - y3,
        x: center.x - x3
      }
    } else {
      let y3 = rect.top - center.y
      let x3 = y3 / scale
      res = {
        y: center.y + y3,
        x: center.x + x3
      }
    }

    return res
  }

  modelTurnHead(event) {
    this.drag = true

    let rect = this.canvas.getBoundingClientRect()

    let target = this.transformRect({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * this.head_pos
    }, {
        x: event.clientX,
        y: event.clientY
      }, rect)
    let vx = this.transformViewX(target.x - rect.left)
    let vy = this.transformViewY(target.y - rect.top)

    if (LAppDefine.DEBUG_MOUSE_LOG) { logInfo(`onMouseMove device( x: ${event.clientX} y: ${event.clientY} ) view( x: ${vx} y: ${vy} )`) }

    this.dragMgr.setPoint(vx, vy)

    // this.live2DMgr.tapEvent(vx, vy)
  }

  modelTapEvent(event) {
    this.drag = true

    let rect = this.canvas.getBoundingClientRect()

    let target = this.transformRect({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * this.head_pos
    }, {
        x: event.clientX,
        y: event.clientY
      }, rect)
    let vx = this.transformViewX(target.x - rect.left)
    let vy = this.transformViewY(target.y - rect.top)

    if (LAppDefine.DEBUG_MOUSE_LOG) { logInfo(`onMouseDown device( x: ${event.clientX} y: ${event.clientY} ) view( x: ${vx} y: ${vy})`) }

    // this.dragMgr.setPoint(vx, vy)

    this.live2DMgr.tapEvent(vx, vy)
  }

  followPointer(event) {
    let rect = this.canvas.getBoundingClientRect()

    let target = this.transformRect({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * this.head_pos
    }, {
        x: event.clientX,
        y: event.clientY
      }, rect)
    let vx = this.transformViewX(target.x - rect.left)
    let vy = this.transformViewY(target.y - rect.top)

    if (LAppDefine.DEBUG_MOUSE_LOG) { logInfo(`onMouseDown device( x: ${event.clientX} y: ${event.clientY} ) view( x: ${vx} y: ${vy})`) }

    if (this.drag) {
      this.dragMgr.setPoint(vx, vy)
    }
  }

  lookFront() {
    if (this.drag) {
      this.drag = false
    }
    this.dragMgr.setPoint(0, 0)
  }

  sleepy() {
    if (LAppDefine.DEBUG_LOG) { logInfo('Set Session Storage.') }
    sessionStorage.setItem('Sleepy', '1')
  }

  mouseEvent(e) {
    let Sleepy = sessionStorage.getItem('Sleepy')
    let SleepyTimer = sessionStorage.getItem('SleepyTimer')
    switch (e.type) {
      case 'mousedown':
        this.modelTapEvent(e)
        break
      case 'mousemove':
        if (Sleepy === '1') {
          sessionStorage.setItem('Sleepy', '0')
        }
        this.modelTurnHead(e)
        break
      case 'mouseup':
        if ('button' in e && e.button !== 0) { return '' }
        // this.lookFront()
        break
      case 'mouseout':
        if (LAppDefine.DEBUG_LOG) { logInfo('Mouse out Window.') }
        this.lookFront()
        window.clearTimeout(SleepyTimer)
        SleepyTimer = window.setTimeout(this.sleepy, 50000)
        sessionStorage.setItem('SleepyTimer', SleepyTimer)
        break
    }
  }

  touchEvent(e) {
    let touch = e.touches[0]
    switch (e.type) {
      case 'touchstart':
        if (e.touches.length === 1) this.modelTurnHead(touch)
        break
      case 'touchmove':
        this.followPointer(touch)
        break
      case 'touchend':
        this.lookFront()
        break
    }
  }

  transformViewX(deviceX) {
    let screenX = this.deviceToScreen.transformX(deviceX)
    return this.viewMatrix.invertTransformX(screenX)
  }

  transformViewY(deviceY) {
    let screenY = this.deviceToScreen.transformY(deviceY)
    return this.viewMatrix.invertTransformY(screenY)
  }
}

export default L2dManage
