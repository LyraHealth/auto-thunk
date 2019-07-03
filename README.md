# AutoThunk

Enhanced Redux Thunk middlware that provides a powerful and short syntax to write action creators.

## Motivation

Working with a RESTful api, async action creators are repetitive to write. In most cases, you just need to make a request and send an action passing the response data to the Redux store.
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
  errorHandler: error => { ... },
  log: <myLogFunction>,
  track: <myTrackFunction>,
})

const store = createStore(<reducers>, <initialState>, applyMiddleware([promise(), autoThunk]))
```

Note that since autoThunk is using promises, you need 'redux-promise-middleware' to be applied first.

### Write your action creators

#### Syntax
```
const getFoos = data => ({
  action: <action>, // Action as a string or an object. Can be an array of actions
  request: [<http client method>, <endpoint>, <body>],
  errorHandler: error => { ... } // Override the default error handler if needed
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

export const createFoo = ({ name, color }) => ({
  action: 'ADD_FOO',
  request: ['post', '/foos', { name, color }]
})
// Dispatched action ==> { type: 'ADD_FOO', data: <response.data>}

export const deleteFoo = ({ id }) => ({
  action: { type: 'DELETE_FOO', data: id },
  request: ['delete', `/foos/${id}`]
})
// Dispatched action ==> { type: 'DELETE_FOO', data: <id>}

// Make a request and dispatch several actions
export const updateFooColor = ({ color, name, id }) => ({
  action: [
    { type: 'SET_UPDATED_FOO', version: 'v2' }, // Dispatched action ==> { type: 'SET_UPDATED_FOO', data: <response.data>, version: 'v2'}
    { type: 'UPDATE_FOO_COLOR', data: { color } }, // Dispatched action ==> { type: 'SET_UPDATED_FOO', data: { color } }
  ],
  request: ['put', `/foos/${id}`, { color, name }]
})

// Make a request without dispatching any action
export const getStuff = ({id}) => ['get', `/stuff/${id}`]

```
