import autoThunkMiddleware from '../src/index'
import { createStore, combineReducers, applyMiddleware } from 'redux'

const fooReducer = (state = { data: [] }, action) => {
  switch (action.type) {
    case 'ADD_FOO':
      state.data.push(action.data)
      return state
    case 'UPDATE_FOO_COLOR':
      state.data = state.data.map(foo => {
        if (foo.id === action.data.id) foo = action.data
        return foo
      })
      return state
    case 'DELETE_FOO':
      state.data = state.data.filter(foo => foo.id !== action.data.id)
      state.extraProp = action.extraProp
      return state
    case 'ADD_FOOS':
      state.data = [...state.data, ...action.data]
      return state
    case 'SET_UPDATED_FOO':
      state.lastUpdatedFoo = action.data
      state.version = action.version
    default:
      return state
  }
}

const mockedData = {
  getStuff: {
    response: {name: 'myStuff'},
    params: { id: '1' }
  },
  getOtherStuff: {
    response: {name: 'myOtherStuff'},
    params: { id: '11' }
  },
  postSomeStuff:{
    response: {name: 'someOtherStuff'},
    params: { name: 'someStuff'}
  },
  getFoos: {
    response: [{ name: 'foo1', id: '1' }, { name: 'foo2', id: '2' }]
  },
  createFoo: {
    response: { name: 'foo3', color: 'testColor', id: '3' },
    params: { name: 'test', color: 'testColor' }
  },
  deleteFoo: {
    response: { name: 'foo4', id: '4' },
    params: { id: '4' }
  },
  updateFooColor: {
    response: { name: 'foo4', id: '5', color: 'testColor' },
    params: { name: 'test', color: 'testColor', id: '5' }
  }
}

const expectedReducerData = {
  createFoo: { data: [{ name: 'foo3', color: 'testColor', id: '3' }] },
  deleteFoo: { data: [], extraProp: 'test' },
  getFoos: { data: mockedData.getFoos.response },
  updateFooColor: { data: [], version: 'v2', lastUpdatedFoo: mockedData.updateFooColor.response },
  getStuff: { data: [] },
  getOtherStuff: { data: [] },
  postSomeStuff: { data: [] }
}

const postSomeStuffData = new FormData()
postSomeStuffData.append('name', 'someStuff')

const expectedFetcherArguments = {
  getStuff: {
    method: 'get',
    url: '/stuff/1'
  },
  getOtherStuff: {
    method: 'get',
    url: '/otherStuff/11'
  },
  postSomeStuff: {
    method: 'post',
    url: '/stuff',
    data: postSomeStuffData
  },
  getFoos: {
    method: 'get',
    url: '/foos'
  },
  createFoo: {
    method: 'post',
    url: '/foos',
    data: { name: 'test', color: 'testColor' }
  },
  deleteFoo: {
    method: 'delete',
    url: '/foos/4'
  },
  updateFooColor: {
    method: 'put',
    url: '/foos/5',
    data: { name: 'test', color: 'testColor' }
  },
  getFooToken:  {
    method: 'get',
    url: '/token',
    params: {
      access_token: 'asdf',
      client_id: '653463'
    }
  }
}

let store
let httpClient = () => {}
beforeEach(() => {
  const autoThunk = autoThunkMiddleware({ httpClient })
  store = createStore(combineReducers({ fooReducer }), {}, applyMiddleware(autoThunk))
})

////////////////////////
//// Action Creators ///
////////////////////////

// Basic action creator
const addFoo = data => ({ type: 'ADD_FOO', data })

// Make a request without dispatching any action
const getStuff = ({id}) => ['get', `/stuff/${id}`]
const getOtherStuff = ({id}) => ({
  request: {
    method: 'get',
    url: `/otherStuff/${id}`
  }
})
const postSomeStuff = ({name}) => ({
  request: {
    method: 'post',
    url: `/stuff`,
    data: { name }
  },
  bodyType: 'formData'
})

// Make a request and dispatch an action with the returned data
const getFoos = () => ({
  action: 'ADD_FOOS',
  request: ['get', '/foos']
})

const createFoo = ({ name, color }) => ({
  action: 'ADD_FOO',
  request: ['post', '/foos', { name, color }]
})

const deleteFoo = ({ id }) => ({
  action: { type: 'DELETE_FOO', data: id, extraProp: 'test' },
  request: ['delete', `/foos/${id}`]
})

// Make a request and dispatch several actions
const updateFooColor = ({ color, name, id }) => ({
  action: [
    { type: 'SET_UPDATED_FOO', version: 'v2' },
    { type: 'UPDATE_FOO_COLOR', data: { color } },
  ],
  request: ['put', `/foos/${id}`, { color, name }]
})

it('should handle a simple redux action', () => {
  store.dispatch(addFoo({ name: 'foo1', color: 'green' }))
  expect(store.getState().fooReducer).toEqual({ data: [{ name: 'foo1', color: 'green' }] })
})

/// /// Async actions ///////
describe.each([getStuff, getOtherStuff, getFoos, createFoo, deleteFoo, updateFooColor])('Request', func => {
  beforeEach(() => {
    httpClient.request = jest.fn(() => Promise.resolve({ data: mockedData[func.name].response }))
  })
  afterEach(() => {
    httpClient.request.mockRestore()
  })

  it('should dispatch the given action passing the fetched data', async () => {
    await store.dispatch(func(mockedData[func.name].params))
    expect(httpClient.request).toHaveBeenCalledWith(expectedFetcherArguments[func.name])
    expect(store.getState().fooReducer).toEqual(expectedReducerData[func.name])
  })
})

it('should convert to form data if bodyType: `formData` is specified', async () => {
  httpClient.request = jest.fn(() => Promise.resolve({ data: mockedData.postSomeStuff.response }))

  await store.dispatch(postSomeStuff(mockedData.postSomeStuff.params))
  expect(httpClient.request).toHaveBeenCalledWith(expectedFetcherArguments.postSomeStuff)

  httpClient.request.mockRestore()
})