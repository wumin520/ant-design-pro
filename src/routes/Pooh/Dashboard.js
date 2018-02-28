import React, { Component, Fragment } from 'react';
import { connect } from 'dva';
import {
  Row,
  Col,
  Icon,
  Card,
  Tabs,
  Table,
  DatePicker,
  Tooltip,
  Select,
} from 'antd';
import numeral from 'numeral';
import moment from 'moment';
import {
  ChartCard,
  yuan,
  MiniArea,
  MiniBar,
  MiniProgress,
  Field,
  Bar,
} from '../../components/Charts';
import { getTimeDistance } from '../../utils/utils';

import styles from './Dashboard.less';
import { Button } from '.3.2.1@antd/lib/radio';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

@connect(({ dashboard, chart, loading }) => ({
  portlet: dashboard.portlet,
  app_list: dashboard.app_list,
  tableData: dashboard.table,
  xlabels: dashboard.xlabels,
  ydata: dashboard.ydata,
  sevenDaysClicks: dashboard.sevenDaysClicks,
  sevenDaysEffects: dashboard.sevenDaysEffects,
  chart,
  loading: loading.effects['chart/fetch'],
}))
export default class Analysis extends Component {
  state = {
    rangePickerValue: getTimeDistance('7days'),
    app_id: '',
    activeKey: 'cost',
    sevenDaysCostData: [],
  };

  componentDidMount() {
    this.props.dispatch({
      type: 'dashboard/fetch',
    });
    this.fetchDataByAction(['table', 'chart']);

    this.fetchSevenDaysChartData('clicks');
    this.fetchSevenDaysChartData('effect_actions');
  }

  componentWillReceiveProps(nextProps) {
    const chartData = this.formatChartData(nextProps.xlabels, nextProps.ydata);
    // 初始化最近7日消费数据
    if (chartData.length > 0 && this.state.sevenDaysCostData.length < 1) {
      this.setState({
        sevenDaysCostData: chartData,
      });
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch({
      type: 'chart/clear',
    });
  }

  exportFile = () => {
    /* eslint-disable camelcase,no-underscore-dangle */
    const ts_start = Math.floor(Date.parse(this.state.rangePickerValue[0]._d) / 1000);
    const ts_end = Math.floor(Date.parse(this.state.rangePickerValue[1]._d) / 1000);
    const params = {
      app_id: this.state.app_id,
      ts_start,
      ts_end,
    };
    this.props.dispatch({
      type: 'dashboard/exportReportFile',
      payload: params,
    });
  };

  fetchSevenDaysChartData(content = 'clicks') {
    const ts_start = Math.floor(Date.parse(this.state.rangePickerValue[0]._d) / 1000);
    const ts_end = Math.floor(Date.parse(this.state.rangePickerValue[1]._d) / 1000);
    const { app_id } = this.state;
    const { dispatch } = this.props;
    const params = { action: 'chart', content, ts_start, ts_end, app_id };
    dispatch({
      type: 'dashboard/fetchSevenDaysChart',
      payload: params,
    });
  }

  fetchDataByAction(action, content = 'cost') {
    const ts_start = Math.floor(Date.parse(this.state.rangePickerValue[0]._d) / 1000);
    const ts_end = Math.floor(Date.parse(this.state.rangePickerValue[1]._d) / 1000);
    const { app_id } = this.state;
    const { dispatch } = this.props;
    const params = { content, ts_start, ts_end, app_id };
    for (let i = 0; i < action.length; i += 1) {
      const item = action[i];
      if (item === 'table') {
        dispatch({
          type: 'dashboard/fetchTable',
          payload: { ...params, action: 'table' },
        });
      } else if (item === 'chart') {
        dispatch({
          type: 'dashboard/fetchChart',
          payload: { ...params, action: 'chart' },
        });
      }
    }
  }

  tabBarChange = (activeKey) => {
    this.setState({
      activeKey,
    });
    this.fetchDataByAction(['table', 'chart'], activeKey);
  };

  handleRangePickerChange = (rangePickerValue) => {
    this.setState({
      rangePickerValue,
    }, () => {
      this.fetchDataByAction(['table', 'chart'], this.activeKey);
    });
  };

  selectDate = (type) => {
    this.setState({
      rangePickerValue: getTimeDistance(type),
    });

    this.props.dispatch({
      type: 'chart/fetchSalesData',
    });
  };

  handleChange = (val) => {
    this.setState({
      app_id: val,
    }, () => {
      this.fetchDataByAction(['table', 'chart'], this.state.activeKey);
    });
  };

  isActive(type) {
    const { rangePickerValue } = this.state;
    const value = getTimeDistance(type);
    if (!rangePickerValue[0] || !rangePickerValue[1]) {
      return;
    }
    if (
      rangePickerValue[0].isSame(value[0], 'day') &&
      rangePickerValue[1].isSame(value[1], 'day')
    ) {
      return styles.currentDate;
    }
  }
  /* eslint-disable class-methods-use-this */
  formatChartData(xlabels, ydata) {
    const chartData = [];
    let sum = 0;
    for (let i = 0; i < xlabels.length; i += 1) {
      chartData.push({
        x: xlabels[i],
        y: ydata[i],
      });
      sum += ydata[i];
    }
    chartData.sum = sum;
    return chartData;
  }

  render() {
    const { rangePickerValue, sevenDaysCostData } = this.state;
    const {
      portlet, app_list, tableData, xlabels, ydata, sevenDaysClicks, sevenDaysEffects, loading,
    } = this.props;
    const balancePerc = numeral((portlet.available_balance / portlet.balance) * 100).value();
    const chartData = this.formatChartData(xlabels, ydata);

    const { Option } = Select;
    const salesExtra = (
      <div className={styles.salesExtraWrap}>
        <div className={styles.salesExtra}>
          <Select defaultValue="全部应用" style={{ width: 218 }} onSelect={this.handleChange}>
            <Option value="">
              全部应用
            </Option>
            {
              app_list.map(app => (
                <Option key={app.appid} title={app.title}>
                  {app.title}
                </Option>
              ))
            }
          </Select>
        </div>
        <RangePicker
          value={rangePickerValue}
          ranges={{ 今日: [moment(), moment()],
          本周: [moment().startOf('week'), moment().endOf('week')],
          本月: [moment().startOf('month'), moment().endOf('month')],
          全年: [moment().startOf('year'), moment().endOf('year')] }}
          onChange={this.handleRangePickerChange}
          style={{ width: 256 }}
        />
        <Button onClick={this.exportFile} style={{ marginLeft: 20 }}>导出</Button>
      </div>
    );

    const topColResponsiveProps = {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 6,
      style: { marginBottom: 24 },
    };

    const columns = [{
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: text => <a href="#">{text}</a>,
    }, {
      title: '点击',
      dataIndex: 'clicks',
      key: 'clicks',
    }, {
      title: '完成',
      dataIndex: 'effect_actions',
      key: 'effect_actions',
    }, {
      title: '完成率',
      key: 'effect_rate',
      dataIndex: 'effect_rate',
    }, {
      title: '专属任务',
      key: 'zs_done_count',
      dataIndex: 'zs_done_count',
    }];
    const data = tableData;

    const visitData = [];
    const beginDay = new Date().getTime();

    const fakeY = [7, 5, 4, 2, 4, 7, 5, 6, 5, 9, 6, 3, 1, 5, 3, 6, 5];
    for (let i = 0; i < fakeY.length; i += 1) {
      visitData.push({
        x: moment(new Date(beginDay + (1000 * 60 * 60 * 24 * i))).format('YYYY-MM-DD'),
        y: fakeY[i],
      });
    }

    return (
      <Fragment>
        <Row gutter={24}>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="近七日消费"
              action={
                <Tooltip title="指标说明">
                  <Icon type="info-circle-o" />
                </Tooltip>
              }
              total={yuan(sevenDaysCostData.sum)}
              footer={<Field label="今日消费" value={`￥${numeral(portlet.today_cost).format('0,0')}`} />}
              contentHeight={46}
            >
              <MiniBar data={sevenDaysCostData} />
            </ChartCard>
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="近七日点击"
              action={
                <Tooltip title="指标说明">
                  <Icon type="info-circle-o" />
                </Tooltip>
              }
              total={numeral(sevenDaysClicks.sum).format('0,0')}
              footer={<Field label="今日点击" value={numeral(sevenDaysClicks.today).format('0,0')} />}
              contentHeight={46}
            >
              <MiniArea color="#975FE4" data={sevenDaysClicks.chartData} />
            </ChartCard>
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="近七日完成"
              action={
                <Tooltip title="指标说明">
                  <Icon type="info-circle-o" />
                </Tooltip>
              }
              total={numeral(sevenDaysEffects.sum).format('0,0')}
              footer={<Field label="今日完成" value={sevenDaysEffects.today} />}
              contentHeight={46}
            >
              <MiniArea color="#975FE4" data={sevenDaysEffects.chartData} />
            </ChartCard>
          </Col>
          <Col {...topColResponsiveProps}>
            <ChartCard
              bordered={false}
              title="可用余额"
              action={
                <Tooltip title="指标说明">
                  <Icon type="info-circle-o" />
                </Tooltip>
              }
              total={numeral(portlet.available_balance).format('0,0')}
              footer={
                <Field label="账户余额" value={numeral(portlet.balance).format('0,0')} />
              }
              contentHeight={46}
            >
              <MiniProgress percent={balancePerc} strokeWidth={8} target={balancePerc} color="#13C2C2" />
            </ChartCard>
          </Col>
        </Row>

        <Card loading={loading} bordered={false} bodyStyle={{ padding: 0 }}>
          <div className={styles.salesCard}>
            <Tabs tabBarExtraContent={salesExtra} activeKey={this.state.activeKey} onChange={this.tabBarChange} size="large" tabBarStyle={{ marginBottom: 24 }}>
              <TabPane tab="消费" key="cost">
                <Row>
                  <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                    <div className={styles.salesBar}>
                      <Bar height={295} title="" data={chartData} />
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="点击" key="clicks">
                <Row>
                  <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                    <div className={styles.salesBar}>
                      <Bar height={292} title="" data={chartData} />
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="完成" key="effect_actions">
                <Row>
                  <Col xl={24} lg={24} md={24} sm={24} xs={24}>
                    <div className={styles.salesBar}>
                      <Bar height={292} title="" data={chartData} />
                    </div>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </div>
        </Card>
        <div style={{ marginTop: 30, background: '#fff' }}>
          <Table rowKey="date" columns={columns} dataSource={data} />
        </div>
      </Fragment>
    );
  }
}
