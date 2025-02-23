import { AnyAction } from 'redux';
import { EffectsCommandMap } from 'dva';
import { MenuDataItem } from '@ant-design/pro-layout';
import { RouterTypes } from 'umi';
import { GlobalModelState } from './global';
import { DefaultSettings as SettingModelState } from '../../config/defaultSettings';
import { BasicFormModelState } from './basicForm';
import { ModalFormModelState } from './modalForm';
import { BasicListModelState } from './basicList';
import { AccountModelState } from './account';

export { GlobalModelState, SettingModelState,BasicFormModelState,ModalFormModelState, BasicListModelState };

export interface Loading {
  global: boolean;
  effects: { [key: string]: boolean | undefined };
  models: {
    global?: boolean;
    menu?: boolean;
    setting?: boolean;
    basicForm?: boolean;
    basicList?: boolean;
    modalForm?: boolean;
    account?: boolean;
  };
}

export interface ConnectState {
  global: GlobalModelState;
  loading: Loading;
  settings: SettingModelState;
  basicForm: BasicFormModelState;
  basicList: BasicListModelState;
  modalForm: ModalFormModelState;
  account: AccountModelState;
}

export type Effect = (
  action: AnyAction,
  effects: EffectsCommandMap & { select: <T>(func: (state: ConnectState) => T) => T },
) => void;

/**
 * @type P: Type of payload
 * @type C: Type of callback
 */
export type Dispatch = <P = any, C = (payload: P) => void>(action: {
  type: string;
  payload?: P;
  callback?: C;
  [key: string]: any;
}) => any;

export interface Route extends MenuDataItem {
  routes?: Route[];
}

/**
 * @type T: Params matched in dynamic routing
 */
export interface ConnectProps<T = {}> extends Partial<RouterTypes<Route, T>> {
  dispatch?: Dispatch;
}
