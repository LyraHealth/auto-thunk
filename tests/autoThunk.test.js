import autoThunkMiddleware from '../src/index'
import axios from 'axios'
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
      return state
    case 'ADD_FOOS':
      state.data = [...state.data, ...action.data]
      return state
    case 'SET_VERSION':
      state.version = action.data
      return state
    default:
      return state
  }
}

let store, httpClient
beforeEach(() => {
  httpClient = axios.create()
  const autoThunk = autoThunkMiddleware({ httpClient })
  store = createStore(combineReducers({ fooReducer }), {}, applyMiddleware(autoThunk))
})

const addFoo = data => ({ type: 'ADD_FOO', data })
const getFoos = data => ({
  action: 'ADD_FOOS',
  request: ['get', '/foos']
})

const createFoo = ({ name, color }) => ({
  action: 'ADD_FOO',
  request: ['post', '/foos', { name, color }]
})

const deleteFoo = ({ id }) => ({
  action: { type: 'DELETE_FOO', data: { id } },
  request: ['delete', `/foos/${id}`]
})

const updateFooColor = ({ color, version, name, id }) => ({
  action: [{ type: 'UPDATE_FOO_COLOR', data: { color } }, { type: 'SET_VERSION', data: 'v2' }],
  request: ['put', `/foos/${id}`, { color, name }]
})

const mockedData = {
  getFoos: {
    response: [{ name: 'foo1', id: '1' }, { name: 'foo2', id: '2' }]
  },
  createFoo: {
    response: { name: 'foo3', id: '3' },
    params: { name: 'test', color: 'testColor' }
  },
  deleteFoo: {
    response: { name: 'foo4', id: '4' },
    params: { id: '4' }
  },
  updateFooColor: {
    response: { name: 'foo4', id: '5', color: 'testColor', version: '12' },
    params: { name: 'test', color: 'testColor', id: '5' }
  }
}

const expectedReducerData = {
  createFoo: { data: [{ name: 'foo3', id: '3' }] },
  deleteFoo: { data: [] },
  getFoos: { data: mockedData.getFoos.response },
  updateFooColor: { data: [], version: 'v2' }
}

const expectedFetcherArguments = {
  getFoos: ['get', '/foos'],
  createFoo: ['post', '/foos', { name: 'test', color: 'testColor' }],
  deleteFoo: ['delete', '/foos/4'],
  updateFooColor: ['put', '/foos/5', { name: 'test', color: 'testColor' }],
  getFooToken: ['get', '/token?access_token=asdf&client_id=653463']
}

it('should dispatch the given action passing the fetched data', () => {
  store.dispatch(addFoo({ name: 'foo1', color: 'green' }))
  expect(store.getState().fooReducer).toEqual({ data: [{ name: 'foo1', color: 'green' }] })
})

/// /// Async actions ///////
describe.each([createFoo, deleteFoo, getFoos, updateFooColor])('Request', func => {
  beforeEach(() => {
    httpClient.get = jest.fn(() => Promise.resolve({ data: mockedData[func.name].response }))
    httpClient.post = jest.fn(() => Promise.resolve({ data: mockedData[func.name].response }))
    httpClient.put = jest.fn(() => Promise.resolve({ data: mockedData[func.name].response }))
    httpClient.delete = jest.fn(() => Promise.resolve({ data: mockedData[func.name].response }))
  })
  afterEach(() => {
    httpClient.get.mockRestore()
    httpClient.post.mockRestore()
    httpClient.put.mockRestore()
    httpClient.delete.mockRestore()
  })
  it('should dispatch the given action passing the fetched data', async () => {
    await store.dispatch(func(mockedData[func.name].params))
    expect(httpClient[expectedFetcherArguments[func.name][0]]).toHaveBeenCalledWith(expectedFetcherArguments[func.name][1], expectedFetcherArguments[func.name][2])
    expect(store.getState().fooReducer).toEqual(expectedReducerData[func.name])
  })
})
