import React, { PureComponent } from 'react';
import { connect } from 'dva';
import router from 'umi/router';
import styles from './Index.less';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { routerRedux } from 'dva/router';
import { stringify } from 'qs';

import {
  Row,
  Col,
  Icon,
  Select,
  Input,
  Form,
  Button,
  Tag,
  Modal,
  message,
  Table,
  Divider,
  Popconfirm,
  DatePicker,
  TimePicker,
} from 'antd';

const Search = Input.Search;
const { RangePicker } = DatePicker;
const ButtonGroup = Button.Group;
const confirm = Modal.confirm;
const Option = Select.Option;

@connect(({ model }) => ({
  model,
}))
@Form.create()
class IndexPage extends PureComponent {
  // 定义要操作的模型名称
  modelName = 'actionLog';

  state = {
    msg: '',
    url: '',
    data: {
      categorys: [],
    },
    status: '',
    pagination: {},
    loading: false,
    previewVisible: false,
    previewImage: '',
    expand: false, // 高级搜索是否展开
    selectedRowKeys: [],
  };

  // 当挂在模板时，初始化数据
  componentDidMount() {
    // loading
    this.setState({ loading: true });

    // 调用model
    this.props.dispatch({
      type: 'model/index',
      payload: {
        modelName: this.modelName,
      },
      callback: res => {
        // 执行成功后，进行回调
        if (res) {
          this.setState({ ...res, loading: false });
        }
      },
    });
  }

  // 删除操作
  handleDestroy = id => {
    const { dispatch } = this.props;
    dispatch({
      type: 'model/destroy',
      payload: {
        modelName: this.modelName,
        id: id,
      },
    }).then(() => {
      // 操作成功
      if (this.state.status === 'success') {
        // 过滤数据
        this.state.data.lists = this.state.data.lists.filter(item => item.id !== id);

        // 更新数据
        this.setState({ ...this.state.data });
      }
    });
  };

  // 改变数据状态操作
  handleStatusChange = (id, status) => {
    // loading
    this.setState({ loading: true });

    const { dispatch } = this.props;
    dispatch({
      type: 'model/changeStatus',
      payload: {
        modelName: this.modelName,
        id: id,
        status: status,
      },
    }).then(() => {
      const { dispatch } = this.props;
      // 调用model
      dispatch({
        type: 'model/index',
        payload: {
          modelName: this.modelName,
          ...this.state.pagination,
          search: this.state.search,
        },
        callback: res => {
          // 执行成功后，进行回调
          if (res) {
            this.setState({ ...res, loading: false });
          }
        },
      });
    });
  };

  // 删除多个操作
  handleMultiDestroy = () => {
    const that = this;
    confirm({
      title: '确定删除这些数据吗？',
      content: '删除后数据不可恢复，请谨慎操作！',
      okText: '确认',
      cancelText: '取消',
      centered: true,
      onOk() {
        let ids = that.state.selectedRowKeys;
        const { dispatch } = that.props;
        dispatch({
          type: 'model/destroy',
          payload: {
            modelName: that.modelName,
            id: ids,
          },
        }).then(() => {
          // 操作成功
          if (that.state.status === 'success') {
            ids.map(id => {
              that.state.data.lists = that.state.data.lists.filter(item => item.id !== id);
            });
            // 更新数据
            that.setState({ ...that.state.data, selectedRowKeys: [] });
          }
        });
      },
      onCancel() {},
    });
  };

  // 改变多个数据状态操作
  handleMultiStatusChange = status => {
    // loading
    this.setState({ loading: true });

    let ids = this.state.selectedRowKeys;

    const { dispatch } = this.props;
    dispatch({
      type: 'model/changeStatus',
      payload: {
        modelName: this.modelName,
        id: ids,
        status: status,
      },
    }).then(() => {
      const { dispatch } = this.props;
      // 调用model
      dispatch({
        type: 'model/index',
        payload: {
          modelName: this.modelName,
          ...this.state.pagination,
          search: this.state.search,
        },
        callback: res => {
          // 执行成功后，进行回调
          if (res) {
            this.setState({ ...res, loading: false });
          }
        },
      });
    });
  };

  // 分页切换
  handleTableChange = (pagination, filters, sorter) => {
    // loading
    this.setState({ loading: true });
    const { dispatch } = this.props;
    // 调用model
    dispatch({
      type: 'model/index',
      payload: {
        modelName: this.modelName,
        pageSize: pagination.pageSize, // 分页数量
        current: pagination.current, // 当前页码
        sortField: sorter.field, // 排序字段
        sortOrder: sorter.order, // 排序规则
        ...filters, // 筛选
        search: this.state.search,
      },
      callback: res => {
        // 执行成功后，进行回调
        if (res) {
          this.setState({ ...res, loading: false, selectedRowKeys: [] });
        }
      },
    });
  };

  // 展开或收缩高级搜索
  toggle = () => {
    const { expand } = this.state;
    this.setState({ expand: !expand });
  };

  // 全选
  handleSelectAll = () => {
    let rowKeys = this.state.data.lists.map(item => {
      return item.id;
    });

    console.log(rowKeys);

    this.setState({
      selectedRowKeys: rowKeys,
    });
  };

  // 取消全选
  handleCancelSelectAll = () => {
    this.setState({
      selectedRowKeys: [],
    });
  };

  // 选择事件
  onSelectChange = selectedRowKeys => {
    console.log('selectedRowKeys changed: ', selectedRowKeys);
    this.setState({ selectedRowKeys });
  };

  // 搜索
  handleSearch = e => {
    e.preventDefault();

    this.props.form.validateFields((err, values) => {
      if (values.dateRange) {
        if (values.dateRange[0] && values.dateRange[1]) {
          // 时间标准化
          let dateStart = values.dateRange[0].format('YYYY-MM-DD');
          let dateEnd = values.dateRange[1].format('YYYY-MM-DD');

          // 先清空对象
          values.dateRange = [];

          // 重新赋值对象
          values.dateRange = [dateStart, dateEnd];
        }
      }

      // 验证正确提交表单
      if (!err) {
        const { dispatch } = this.props;
        // 调用model
        dispatch({
          type: 'model/index',
          payload: {
            modelName: this.modelName,
            ...this.state.pagination,
            search: values,
          },
          callback: res => {
            // 执行成功后，进行回调
            if (res) {
              this.setState({ ...res, loading: false });
            }
          },
        });
      }
    });
  };

  // 搜索重置
  handleResetSearch = () => {
    this.props.form.resetFields();
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    // 默认选中的行
    const { selectedRowKeys } = this.state;

    // 行选中配置
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange,
      getCheckboxProps: record => ({
        name: record.name,
      }),
      fixed: 'left',
    };

    const columns = [
      {
        title: '用户名',
        dataIndex: 'username',
        key: 'username',
      },
      {
        title: '行为',
        dataIndex: 'action',
        key: 'action',
      },
      {
        title: '访问地址',
        dataIndex: 'url',
        key: 'url',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
      },

      {
        title: '发生时间',
        dataIndex: 'created_at',
        key: 'created_at',
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 80,
        render: (text, record) => (
          <span>
            <Popconfirm title="确定删除吗？" onConfirm={() => this.handleDestroy(record.id)}>
              <a href="javascript:;">删除</a>
            </Popconfirm>
          </span>
        ),
      },
    ];

    const rangeConfig = {
      rules: [{ type: 'array', required: true, message: 'Please select time!' }],
    };

    return (
      <PageHeaderWrapper title={false}>
        <div className={styles.container}>
          <div className={styles.tableHeader}>
            <Row type="flex" justify="start">
              <Col span={12}>
                <h5 className={styles.tableHeaderTitle}>日志列表</h5>
              </Col>
              <Col span={12}>
                <div className={styles.floatRight}>
                  &nbsp;
                  <a
                    href={
                      '/api/admin/' +
                      this.modelName +
                      '/export?' +
                      stringify({ search: this.state.search })
                    }
                    target="_blank"
                  >
                    <Button>
                      <Icon type="export" />
                      导出数据
                    </Button>
                  </a>
                </div>
              </Col>
            </Row>
          </div>
          <Divider style={{ marginBottom: 10 }} />
          <div className={styles.tableToolBar}>
            <Row type="flex" justify="start">
              <Col span={8}>
                <ButtonGroup>
                  <Button onClick={() => this.handleSelectAll()}>全选</Button>
                  <Button onClick={() => this.handleCancelSelectAll()}>取消</Button>
                </ButtonGroup>
                <Divider type="vertical" />
                <Button onClick={() => this.handleMultiDestroy()} type="danger">
                  删除
                </Button>
              </Col>
              <Col span={16}>
                <div className={styles.floatRight}>
                  <Form layout="inline" onSubmit={this.handleSearch}>
                    <Form.Item style={{ display: 'inline-block' }}>
                      {getFieldDecorator('name')(
                        <Input placeholder="请输入要搜索的用户名" style={{ width: 200 }} />,
                      )}
                    </Form.Item>
                    <Form.Item style={{ display: 'inline-block' }}>
                      <Button htmlType="submit">搜索</Button>
                    </Form.Item>
                    <Form.Item style={{ marginRight: 10 }}>
                      <a style={{ fontSize: 12 }} onClick={this.toggle}>
                        高级搜索 <Icon type={this.state.expand ? 'up' : 'down'} />
                      </a>
                    </Form.Item>
                  </Form>
                </div>
              </Col>
            </Row>
          </div>
          <div
            className={styles.tableAdvancedSearchBar}
            style={{ display: this.state.expand ? 'block' : 'none' }}
          >
            <Row>
              <Col span={24}>
                <Form layout="inline" onSubmit={this.handleSearch}>
                  <Form.Item label="行为" style={{ display: 'inline-block' }}>
                    {getFieldDecorator('action')(
                      <Input placeholder="请输入要搜索的行为" style={{ width: 200 }} />,
                    )}
                  </Form.Item>
                  <Form.Item label="ip" style={{ display: 'inline-block' }}>
                    {getFieldDecorator('ip')(
                      <Input placeholder="请输入ip地址" style={{ width: 200 }} />,
                    )}
                  </Form.Item>
                  <Form.Item label="备注" style={{ display: 'inline-block' }}>
                    {getFieldDecorator('remark')(
                      <Input placeholder="请输入备注信息" style={{ width: 200 }} />,
                    )}
                  </Form.Item>

                  <Form.Item label="发生时间">
                    {getFieldDecorator('dateRange')(<RangePicker />)}
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon="search" htmlType="submit">
                      高级搜索
                    </Button>
                    &nbsp;
                    <Button onClick={this.handleResetSearch}>重置</Button>
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          </div>

          <div className={styles.tableData}>
            <Table
              rowKey={record => record.id}
              rowSelection={rowSelection}
              columns={columns}
              dataSource={this.state.data.lists}
              pagination={this.state.pagination}
              loading={this.state.loading}
              onChange={this.handleTableChange}
            />
          </div>
        </div>
      </PageHeaderWrapper>
    );
  }
}

export default IndexPage;
