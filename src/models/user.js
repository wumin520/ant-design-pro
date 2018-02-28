import { query as queryUsers, queryCurrent, logout } from '../services/user';

export default {
  namespace: 'user',

  state: {
    list: [],
    currentUser: {},
    dashboard: {},
  },

  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(queryUsers);
      yield put({
        type: 'save',
        payload: response,
      });
    },
    *fetchCurrent(_, { call, put }) {
      const response = yield call(queryCurrent);
      yield put({
        type: 'saveCurrentUser',
        payload: response,
      });
      yield put({
        type: 'saveDashboard',
        payload: response,
      });
    },
    *logout(_, { call }) {
      yield call(logout);
    },
  },

  reducers: {
    save(state, action) {
      return {
        ...state,
        list: action.payload,
      };
    },
    saveCurrentUser(state, action) {
      return {
        ...state,
        currentUser: action.payload.payload.navbar,
      };
    },
    saveDashboard(state, action) {
      return {
        ...state,
        dashboard: action.payload,
      };
    },
    changeNotifyCount(state, action) {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          notifyCount: action.payload,
        },
      };
    },
  },
};
