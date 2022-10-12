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

const defaulterrorHandler = error => {
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
  if (data.type !== undefined && data.type !== null) {
    return data
  }

  let requestParams = data.request
  if (Array.isArray(requestParams)) {
    requestParams = {
      method: requestParams[0],
      url: requestParams[1],
      data: requestParams[2],
    }
  }
  if (requestParams.data && data.bodyType === 'formData') {
    let formData = new FormData()
    Object.entries(requestParams.data).map(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          value = JSON.stringify(value)
        }
        formData.append(key, value)
      }
    })
    requestParams.data = formData
  }

  return async dispatch => {
    try {
      const res = await config.httpClient.request(requestParams)
      if (data.log) {
        config.log(data.log, res.data)
      }
      if (data.track) {
        config.track(data.track)
      }
      if (!data.action) return res.data
      const actionsArray = Array.isArray(data.action) ? data.action : [data.action]
      actionsArray.forEach(action => {
        if (typeof action === 'string') {
          action = { type: action, data: res.data }
        } else if (typeof action === 'object' && [undefined, null].includes(action.data)) {
          action = {...action, data: res.data}
        }
        dispatch(action)
      })
      return res.data
    } catch (error) {
      if (error.response) {
        if (data.log) {
          config.log(data.log, error.response)
        }
      }
      const errorHandler = data.errorHandler ? data.errorHandler : config.errorHandler
      errorHandler(error, dispatch, data.action)
      throw error
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
    errorHandler: config.errorHandler || defaulterrorHandler,
    track: config.track || (() => {}),
    log: config.log || (() => {})
  }
  return ({ dispatch, getState, ...rest }) => next => action => {
    if (!action) return
    action = createThunk(config, action)
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument)
    }
    return next(action)
  }
}
