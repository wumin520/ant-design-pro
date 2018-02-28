import { query, queryReport, exportReportFile } from '../services/dashboard';

const formatChartData = ({ labels, data }) => {
  const chartData = [];
  let sum = 0;
  let today = 0;
  for (let i = 0; i < labels.length; i += 1) {
    chartData.push({
      x: labels[i],
      y: data[i],
    });
    sum += data[i];
    today = data[i];
  }
  return { chartData, sum, today };
};
export default {
  namespace: 'dashboard',
  state: {
    portlet: {},
    app_list: [],
    navbar: {},
    table: [],
    ydata: [],
    xlabels: [],
    sevenDaysClicks: {},
    sevenDaysEffects: {},
  },
  effects: {
    *fetch(_, { call, put }) {
      const response = yield call(query);
      yield put({
        type: 'save',
        payload: response,
      });
    },
    *fetchTable({ payload }, { call, put }) {
      const response = yield call(queryReport, payload);
      yield put({
        type: 'saveTable',
        res: response,
      });
    },
    *fetchChart({ payload }, { call, put }) {
      const response = yield call(queryReport, payload);
      yield put({
        type: 'saveChart',
        res: response,
      });
    },
    *fetchSevenDaysChart({ payload }, { call, put }) {
      const response = yield call(queryReport, payload);
      // dataType enum type 7日点击clicks、完成effects
      yield put({
        type: 'saveSevenChartData',
        res: response,
        dataType: payload.content,
      });
    },
    *exportReportFile({ payload }, { call }) {
      const response = yield call(exportReportFile, payload);
      location.href = response.downloadUri;
    },
  },
  reducers: {
    save(state, action) {
      /* eslint-disable camelcase */
      const { app_list, navbar, portlet } = action.payload.payload;
      return {
        ...state,
        app_list,
        navbar,
        portlet,
      };
    },
    saveTable(state, action) {
      return {
        ...state,
        table: action.res.payload.data,
      };
    },
    saveChart(state, action) {
      return {
        ...state,
        ydata: action.res.payload.data,
        xlabels: action.res.payload.labels,
      };
    },
    saveSevenChartData(state, action) {
      if (action.dataType === 'clicks') {
        return {
          ...state,
          sevenDaysClicks: formatChartData(action.res.payload),
        };
      } else {
        return {
          ...state,
          sevenDaysEffects: formatChartData(action.res.payload),
        };
      }
    },
  },
};
