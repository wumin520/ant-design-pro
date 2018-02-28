import { stringify } from 'qs';
import request from '../utils/request';

export async function query() {
  return request('/v2/api/dashboard');
}

export async function queryReport(params) {
  return request(`/v2/api/report?${stringify(params)}`);
}

export async function exportReportFile(params) {
  return {
    downloadUri: `/v2/api/report/download?${stringify(params)}`,
  };
}
