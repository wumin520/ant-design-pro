import request from '../utils/request';

export async function query() {
  return request('/api/users');
}

export async function queryCurrent() {
  return request('/v2/api/dashboard');
}

export async function logout() {
  return request('/v2/api/logout');
}
