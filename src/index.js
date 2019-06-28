const getErrorText = statusCode => {
  const defaultErrorMessages = {
    '400': 'The request contained invalid data. Please double check the information provided and try again.',
    '401': 'Authorization failed for the given request. Please make sure you are logged in.',
    '404': 'Nothing found for the requested service',
    '413': 'The request your are trying to send is too large.',
    '500': 'The server is having issues. Please try again later.',
    '503': 'An error occurred in making the request. Please try again.',
    '504': 'The request has timed out. Please try again.'
  }
  return defaultErrorMessages[statusCode]
}

const defaultActionErrorHandler = error => {
  if (!error || !error.response) {
    let error = 'An unknown error has occured'
    throw error
  }
  let errorText = error.response.data.message || getErrorText(error.response.status)
  throw errorText
}

const createThunk = (config, data) => {
  if (typeof data === 'function') {
    return data
  }
  if (Array.isArray(data)) {
    data = { request: data }
  }
  if (!data.request) {
    return data
  }
  let body = data.request[2]
  if (body && data.bodyType === 'formData') {
    let formData = new FormData()
    Object.entries(body)(([value, key]) => {
      if (!value === undefined && !value === null) {
        formData.append(key, value)
      }
    })
    body = formData
  }

  return async dispatch => {
    try {
      const res = await config.httpClient[data.request[0]](data.request[1], body)
      if (data.log) {
        config.log(data.log.identifier, data.log.data || res.data)
      }
      if (data.track) {
        config.track(data.track.success)
      }
      if (!data.action) return res.data
      const actionsArray = Array.isArray(data.action) ? data.action : [data.action]
      actionsArray.forEach(action => dispatch(typeof action === 'string' ? { type: action, data: res.data } : action))
      return res.data
    } catch (error) {
      if (data.track) {
        const trackerObj = { ...data.track.failure, properties: { status: error.response.status, message: error.response.data.message } }
        config.track(trackerObj)
      }
      config.actionErrorHandler(error, dispatch, data.action)
    }
  }
}

export default function autoThunkMiddleware (config, extraArgument) {
  if (typeof config !== 'object' || typeof config.httpClient !== 'function') {
    console.error('You must provide an http client to be able to make xhr requests. Supported libs are: axios.js')
    return
  }

  config = {
    httpClient: config.httpClient,
    actionErrorHandler: config.actionErrorHandler || defaultActionErrorHandler,
    track: config.track || (() => {}),
    log: config.log || (() => {})
  }
  return ({ dispatch, getState }) => next => action => {
    action = createThunk(config, action)
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument)
    }
    return next(action)
  }
}
