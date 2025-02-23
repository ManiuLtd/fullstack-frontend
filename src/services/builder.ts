import request from '@/utils/request';
import { stringify } from 'qs';

export async function getFormInfo(params: any) {
  return request(`../../api/${params.url}`);
}

export async function formSubmit(params: any) {
  return request(`../../api/${params.url}`, {
    method: 'post',
    data: params,
  });
}

export async function getListInfo(params: any) {
  return request(`../../api/${params.url}`);
}

export async function changeStatus(params: any) {
  return request(`../../api/${params.url}`, {
    method: 'post',
    data: params,
  });
}