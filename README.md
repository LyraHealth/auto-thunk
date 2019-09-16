# AutoThunk

Enhanced version of [redux-thunk](https://github.com/reduxjs/redux-thunk) that provides a powerful and short syntax to write async action creators.

- backward compatible, drop in replacement of [redux-thunk](https://github.com/reduxjs/redux-thunk)
- No dependencies

## Motivation

Working with RESTful apis, async action creators are repetitive to write. In most cases, we just need to make a request and send an action passing the response data to the Redux store.
AutoThunk provides a short syntax to quickly connect your endpoints with the store.

## Installation

```
npm i --save auto-thunk
```

## Usage

### Configure and apply the middleware:

```js
import autoThunkMiddleware from 'auto-thunk'
import promise from 'redux-promise-middleware'

const autoThunk = autoThunkMiddleware({
  httpClient: axios.create(),
  errorHandler: error => { ... }, // Default error handler
  log: <myLogFunction>,
  track: <myTrackFunction>,
})

const store = createStore(<reducers>, <initialState>, applyMiddleware([promise(), autoThunk]))
```

Note that since autoThunk is using promises, you need 'redux-promise-middleware' to be applied first.

### Write your action creators

#### Syntax
```js
const getFoos = data => ({
  // Action as a string or an object or an array.
  action: <action>,
  // Request parameters (If an object is passed, it will be passed directly to the httpClient)
  request: ['<http client method>', '<endpoint>', <body>],
  // Log function will be called with '<identifier>' as the first argument, and the response/error as the second argument.
  log: '<identifier>',
  // Track function will be called with the given argument.
  track: <track function argument>,
  // Automatically transform the body data to formData.
  bodyType: 'formData',
  // Override the default error handler if needed
  errorHandler: error => { ... }
})
```

#### Examples
```js
// actions.js


export const getFoos = () => ({
  action: 'ADD_FOOS',
  request: ['get', '/foos']
})
// Dispatched action ==> { type: 'ADD_FOOS', data: <response.data>}

export const deleteFoo = ({ id }) => ({
  action: { type: 'DELETE_FOO', data: id },
  request: ['delete', `/foos/${id}`]
})
// Dispatched action ==> { type: 'DELETE_FOO', data: <id>}


// Dispatching several actions:
export const updateFooColor = ({ color, name, id }) => ({
  action: [
    { type: 'SET_UPDATED_FOO', version: 'v2' }, // Dispatched action ==> { type: 'SET_UPDATED_FOO', data: <response.data>, version: 'v2'}
    { type: 'UPDATE_FOO_COLOR', data: { color } }, // Dispatched action ==> { type: 'SET_UPDATED_FOO', data: { color } }
  ],
  request: ['put', `/foos/${id}`, { color, name }]
})


// With logging and tracking and custom error handler:
export const createFoo = ({ name, color }) => ({
  action: 'ADD_FOO',
  request: ['post', '/foos', { name, color }],
  track: { event: 'CREATION_OF_FOO' }, // Track function will be called with { event: 'CREATION_OF_FOO' }
  log: 'createFoo', // Log function will be called with 'createFoo' as the first argument, and the response/error as the second argument.
  errorHandler: error => console.log(error)
})
// Dispatched action ==> { type: 'ADD_FOO', data: <response.data>}

// Using request as an object:
const postSomeStuff = ({name, cancelToken}) => ({
  request: {
    method: 'post',
    url: `/stuff`,
    data: { name },
    cancelToken
  }
})

// Making requests without dispatching any action:
export const getBars = () => ['get', '/bars']
export const getBar = ({id}) => ['get', `/bars/${id}`]
```
