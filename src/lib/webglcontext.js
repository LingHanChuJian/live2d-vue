let context

export const setContext = webglContext => {
  context = webglContext
}

export const getContext = () => {
  return context
}
