/**
 *
 *  You can modify and use this source freely
 *  only for the development of application related Live2D.
 *
 *  (c) Live2D Inc. All rights reserved.
 */
/**
 * EYHN 修改
 *
 * Copyright © 2016 - 2017 EYHN
 */

import { logError } from './log'

class MatrixStack {}

let matrixStack = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

let depth = 0

let currentMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

let tmp = new Array(16)

MatrixStack.reset = () => {
  depth = 0
}

MatrixStack.loadIdentity = () => {
  for (let i = 0; i < 16; i++) {
    currentMatrix[i] = (i % 5 === 0) ? 1 : 0
  }
}

MatrixStack.push = () => {
  let nextOffset = (depth + 1) * 16

  if (matrixStack.length < nextOffset + 16) {
    matrixStack.length = nextOffset + 16
  }

  for (let i = 0; i < 16; i++) {
    matrixStack[nextOffset + i] = currentMatrix[i]
  }

  depth++
}

MatrixStack.pop = () => {
  depth--
  if (depth < 0) {
    logError('Invalid matrix stack.')
    depth = 0
  }

  let offset = depth * 16
  for (let i = 0; i < 16; i++) {
    currentMatrix[i] = matrixStack[offset + i]
  }
}

MatrixStack.getMatrix = () => {
  return currentMatrix
}

MatrixStack.multMatrix = matNew => {
  let i, j, k

  for (i = 0; i < 16; i++) {
    tmp[i] = 0
  }

  for (i = 0; i < 4; i++) {
    for (j = 0; j < 4; j++) {
      for (k = 0; k < 4; k++) {
        tmp[i + j * 4] += currentMatrix[i + k * 4] * matNew[k + j * 4]
      }
    }
  }
  for (i = 0; i < 16; i++) {
    currentMatrix[i] = tmp[i]
  }
}

export default MatrixStack
