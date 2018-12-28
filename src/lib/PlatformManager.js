/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */
import { getContext } from './webglcontext'
import { logError } from './log'
// ============================================================
// ============================================================
//  class PlatformManager
// ============================================================
// ============================================================

class PlatformManager {
  loadBytes (path/* String */, callback) {
    let request = new XMLHttpRequest()
    request.open('GET', path, true)
    request.responseType = 'arraybuffer'
    request.onload = () => {
      switch (request.status) {
        case 200:
          callback(request.response)
          break
        default:
          logError(`Failed to load (${request.status}) : ${path}`)
          break
      }
    }
    request.send(null)
    // return request
  }

  loadString (path/* String */) {
    this.loadBytes(path, buf => {
      return buf
    })
  }

  loadLive2DModel (path/* String */, callback) {
    let model = null
    // load moc
    this.loadBytes(path, buf => {
      model = Live2DModelWebGL.loadModel(buf) // eslint-disable-line
      callback(model)
    })
  }

  loadTexture (model/* ALive2DModel */, no/* int */, path/* String */, callback) {
    // load textures
    let loadedImage = new Image()
    loadedImage.crossOrigin = 'Anonymous'
    loadedImage.src = path

    loadedImage.onload = () => {
      // create texture
      let gl = getContext()

      let texture = gl.createTexture()
      if (!texture) {
        logError('Failed to generate gl texture name.')
        return -1
      }
      if (model.isPremultipliedAlpha() === false) {
                // 乗算済アルファテクスチャ以外の場合
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                gl.UNSIGNED_BYTE, loadedImage)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
      gl.generateMipmap(gl.TEXTURE_2D)

      model.setTexture(no, texture)

            // テクスチャオブジェクトを解放
      texture = null

      if (typeof callback === 'function') callback()
    }
    loadedImage.onerror = () => {
      logError(`Failed to load image : ${path}`)
    }
  }

  jsonParseFromBytes (buf) {
    let jsonStr
    let bomCode = new Uint8Array(buf, 0, 3)
    if (bomCode[0] === 239 && bomCode[1] === 187 && bomCode[2] === 191) {
      jsonStr = String.fromCharCode.apply(null, new Uint8Array(buf, 3))
    } else {
      jsonStr = String.fromCharCode.apply(null, new Uint8Array(buf))
    }
    return JSON.parse(jsonStr)
  }
}

export default PlatformManager
