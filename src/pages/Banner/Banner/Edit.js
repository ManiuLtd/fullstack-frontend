import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import styles from './Edit.less';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import BraftEditor from 'braft-editor';
import 'braft-editor/dist/index.css';
import moment from 'moment';
import 'moment/locale/zh-cn';
moment.locale('zh-cn');
import locale from 'antd/lib/date-picker/locale/zh_CN';

import {
  Card,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Tabs,
  Switch,
  Icon,
  Tag,
  Form,
  Select,
  Input,
  Button,
  Checkbox,
  Radio,
  Upload,
  message,
  Modal,
} from 'antd';

const { TextArea } = Input;
const TabPane = Tabs.TabPane;
const Option = Select.Option;
const RadioGroup = Radio.Group;

@connect(({ model }) => ({
  model,
}))
@Form.create()
class EditPage extends PureComponent {
  // 定义要操作的模型名称
  modelName = 'banner';

  state = {
    msg: '',
    url: '',
    previewVisible: false,
    previewImage: '',
    data: {
      categorys: [],
      file_id: null,
      file_name: null,
      file_path: null,
    },
    status: '',
    pagination: {},
    loading: false,
  };

  handleCancel = () => this.setState({ previewVisible: false });

  handlePreview = file => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  };

  // 当挂在模板时，初始化数据
  componentDidMount() {
    // loading
    this.setState({ loading: true });

    // 获得url参数
    const params = this.props.location.query;
    // 调用model
    this.props.dispatch({
      type: 'model/edit',
      payload: {
        modelName: this.modelName,
        ...params,
      },
      callback: res => {
        console.log(res);

        // 执行成功后，进行回调
        if (res) {
          res.data.content = BraftEditor.createEditorState(res.data.content);

          // 接口得到数据，放到state里
          this.setState({ data: res.data, loading: false });
        }
      },
    });
  }

  handleSubmit = e => {
    e.preventDefault();

    this.props.form.validateFields((err, values) => {
      // 数据id
      values.id = this.state.data.id;
      // 时间标准化
      values.deadline = values.deadline.format('YYYY-MM-DD HH:mm:ss');
      // 编辑器内容
      values.content = this.state.data.content;
      // 封面图id
      values.cover_id = this.state.data.cover_id;

      // 验证正确提交表单
      if (!err) {
        this.props.dispatch({
          type: 'model/save',
          payload: {
            modelName: this.modelName,
            ...values,
          },
        });
      }
    });
  };

  submitContent = async () => {
    // 在编辑器获得焦点时按下ctrl+s会执行此方法
    // 编辑器内容提交到服务端之前，可直接调用editorState.toHTML()来获取HTML格式的内容
    const htmlContent = this.state.content.toHTML();
    // const result = await saveEditorContent(htmlContent)
  };

  handleEditorChange = htmlContent => {
    this.state.data.content = htmlContent.toHTML();
  };

  handleEditorUpload = param => {
    const serverURL = '/api/admin/picture/upload';
    const xhr = new XMLHttpRequest();
    const fd = new FormData();

    const successFn = response => {
      // 假设服务端直接返回文件上传后的地址
      // 上传成功后调用param.success并传入上传后的文件地址

      const responseObj = JSON.parse(xhr.responseText);

      if (responseObj.status === 'success') {
        param.success({
          url: responseObj.data.url,
          meta: {
            id: responseObj.data.id,
            title: responseObj.data.title,
            alt: responseObj.data.title,
            loop: true, // 指定音视频是否循环播放
            autoPlay: true, // 指定音视频是否自动播放
            controls: true, // 指定音视频是否显示控制栏
            poster: responseObj.data.url, // 指定视频播放器的封面
          },
        });
      } else {
        // 上传发生错误时调用param.error
        param.error({
          msg: responseObj.msg,
        });
      }
    };

    const progressFn = event => {
      // 上传进度发生变化时调用param.progress
      param.progress((event.loaded / event.total) * 100);
    };

    const errorFn = response => {
      // 上传发生错误时调用param.error
      param.error({
        msg: 'unable to upload.',
      });
    };

    xhr.upload.addEventListener('progress', progressFn, false);
    xhr.addEventListener('load', successFn, false);
    xhr.addEventListener('error', errorFn, false);
    xhr.addEventListener('abort', errorFn, false);

    fd.append('file', param.file);
    xhr.open('POST', serverURL, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + sessionStorage['token']);
    xhr.send(fd);
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 2 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 22 },
      },
    };

    let state = {
      loading: false,
    };

    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">上传图片</div>
      </div>
    );

    // 图片上传
    const uploadPictureProps = {
      name: 'file',
      listType: 'picture-card',
      showUploadList: false,
      action: '/api/admin/picture/upload',
      headers: {
        authorization: 'Bearer ' + sessionStorage['token'],
      },
      beforeUpload: file => {
        if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
          message.error('请上传jpg或png格式的图片!');
          return false;
        }
        const isLt2M = file.size / 1024 / 1024 < 2;
        if (!isLt2M) {
          message.error('图片大小不可超过2MB!');
          return false;
        }
        return true;
      },
      onChange: info => {
        if (info.file.status === 'uploading') {
          this.setState({ loading: true });
          return;
        }

        if (info.file.status === 'done') {
          // Get this url from response in real world.
          if (info.file.response.status === 'success') {
            let stateData = this.state.data;
            stateData.cover_id = info.file.response.data.id;
            stateData.cover_path = info.file.response.data.url;

            this.setState({ data: stateData, loading: false });
          } else {
            message.error(info.file.response.msg);
          }
        }
      },
    };

    return (
      <PageHeaderWrapper title={false}>
        <div className={styles.container}>
          <Card
            size="small"
            title="编辑广告"
            bordered={false}
            extra={<a href="javascript:history.go(-1)">返回上一页</a>}
          >
            <Form onSubmit={this.handleSubmit} style={{ marginTop: 8 }}>
              <Form.Item style={{ marginBottom: 0 }} {...formItemLayout} label="标题">
                {getFieldDecorator(
                  'title',
                  {
                    initialValue: this.state.data.title,
                  },
                  {
                    rules: [{ message: '请输入标题！' }],
                  },
                )(<Input className={styles.middleItem} placeholder="请输入标题" />)}
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }} {...formItemLayout} label="位置">
                {getFieldDecorator(
                  'categoryId',
                  {
                    initialValue: this.state.data.category_id
                      ? this.state.data.category_id.toString()
                      : undefined,
                  },
                  {
                    rules: [{ required: true, message: '请选择位置！' }],
                  },
                )(
                  <Select style={{ width: 400 }} placeholder="选择位置">
                    {this.state.data.categorys.length !== 0
                      ? this.state.data.categorys.map(d => <Option key={d.id}>{d.title}</Option>)
                      : console.log('select data null')}
                  </Select>,
                )}
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }} {...formItemLayout} label="链接">
                {getFieldDecorator('url', {
                  initialValue: this.state.data.url,
                })(<Input className={styles.middleItem} placeholder="请输入链接地址" />)}
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }} {...formItemLayout} label="封面图">
                <Upload {...uploadPictureProps}>
                  {this.state.data.cover_path ? (
                    <img src={this.state.data.cover_path} alt="avatar" width={80} />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }} {...formItemLayout} label="排序">
                {getFieldDecorator('sort', {
                  initialValue: this.state.data.sort,
                })(<Input className={styles.smallItem} placeholder="请输入排序" />)}
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }} {...formItemLayout} label="截止时间">
                {getFieldDecorator('deadline', {
                  initialValue: moment(this.state.data.deadline, 'YYYY-MM-DD HH:mm:ss'),
                })(
                  <DatePicker
                    showTime
                    locale={locale}
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder="请选择时间"
                  />,
                )}
              </Form.Item>
              <Form.Item style={{ marginBottom: 8 }} {...formItemLayout} label="状态">
                {getFieldDecorator('status', {
                  initialValue: this.state.data.status === 1,
                  valuePropName: 'checked',
                })(<Switch checkedChildren="正常" unCheckedChildren="禁用" />)}
              </Form.Item>
              <Form.Item wrapperCol={{ span: 12, offset: 5 }}>
                <Button type="primary" htmlType="submit">
                  提交
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default EditPage;
