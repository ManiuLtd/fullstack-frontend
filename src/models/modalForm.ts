import { routerRedux } from 'dva/router';
import { Reducer } from 'redux';
import { Effect,Subscription } from 'dva';
import { message } from 'antd';
import { 
  getFormInfo,
  formSubmit,
} from '@/services/builder';

export interface ModalFormModelState {
  pageTitle:string;
  name:string;
  pageRandom:string;
  previewImage:string;
  previewVisible:boolean;
  pageLoading:boolean;
  controls: [];
  labelCol: [];
  wrapperCol: [];
}

export interface ModelType {
  namespace: string;
  state: {};
  subscriptions:{ setup: Subscription };
  effects: {
    getFormInfo: Effect;
    submit: Effect;
    updateFileList: Effect;
  };
  reducers: {
    updateState: Reducer<{}>;
    updateList: Reducer<{}>;
    previewImage: Reducer<{}>;
    pageLoading: Reducer<{}>;
    resetState: Reducer<{}>;
  };
}

const ModalForm: ModelType = {

  namespace: 'modalForm',

  state: {
    pageTitle:'',
    name:'',
    pageRandom:null,
    previewImage:'',
    previewVisible:false,
    pageLoading:true,
    controls: [],
    labelCol: [],
    wrapperCol: [],
  },

  subscriptions: {
    setup({ dispatch, history }) {
      return history.listen(({ pathname }) => {
        let historyUrl = window.localStorage.getItem('historyUrl')
        if(pathname !== historyUrl) {
          window.localStorage.setItem('historyUrl', pathname);
          dispatch({
            type: 'modalForm/resetState',
          });
        }
      });
    },
  },

  effects: {
    *getFormInfo({ payload, callback }, { put, call, select }) {

      yield put({
        type: 'pageLoading',
        payload: { pageLoading:true},
      });

      const response = yield call(getFormInfo, payload);
      if (response.status === 'success') {

        const data = { ...response.data, pageLoading:false};

        yield put({
          type: 'updateState',
          payload: data,
        });

        if (callback && typeof callback === 'function') {
          callback(response); // 返回结果
        }
      }
    },
    *submit({ type, payload }, { put, call, select }) {
      const response = yield call(formSubmit, payload);
      // 操作成功
      if (response.status === 'success') {
        // 提示信息
        message.success(response.msg, 3);
        // 页面跳转
        yield put(
          routerRedux.push({
            pathname: response.url,
          }),
        );
      } else {
        message.error(response.msg, 3);
      }
    },
    *updateFileList({ payload, callback }, { put, call, select }) {
      yield put({
        type: 'updateList',
        payload: payload,
      });
    },
  },

  reducers: {
    updateState(state, action) {
      return {
        ...action.payload,
      };
    },
    resetState(state, action) {
    let resetState = {
        pageTitle:'',
        name:'',
        pageRandom:null,
        previewImage:'',
        previewVisible:false,
        pageLoading:true,
        controls: [],
        labelCol: [],
        wrapperCol: []
      }
      return {
        ...resetState,
      };
    },
    pageLoading(state, action) {
      state.pageLoading = action.payload.pageLoading;
      return {
        ...state,
      };
    },
    updateList(state, action) {
      state.controls.map((control:any,key:any) => {
        if(control.name == action.payload.controlName) {
          state.controls[key]['list'] = action.payload.fileList;
        }
      })
      state.pageRandom = Math.random();
      return {
        ...state,
      };
    },
    previewImage(state, action) {
      state.previewVisible = action.payload.previewVisible;
      state.previewImage = action.payload.previewImage;
      return {
        ...state,
      };
    },
  },
};

export default ModalForm;
