import React, { useState, useEffect } from 'react';
import { Button, Modal, Form, InputNumber, Input, Row, Col, Select, Switch, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

//TreeNodeAttrModal组件中Form的样式
const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
};

//使用Hook实现的树结点属性显示Modal
const TreeNodeAttrModal = ({ treeNodeAttr, treeNodeText, visible, hideModal, changeData }) => {
    const [form] = Form.useForm();
    //使用treeNodeText为form赋初值
    const formInitialValues = {};
    //存储Select控件的Options
    const selectOptions = [];
    //upload附带body内容
    const uploadBodyContent = {
        userID: window.localStorage.userID,
        uploadDate: Date.now(),
    };

    const [okDisabled, setOkDisabled] = useState(false);

    useEffect(() => {
        if (form && visible) {
            setFormInitialValues();
            form.resetFields();
        }
        //当类型为上传文件时初始化为禁止保存
        if (treeNodeAttr.class === 'File') {
            setOkDisabled(true);
        }
        else {
            setOkDisabled(false);
        }
    }, [visible]);

    //捕获upload事件对象
    function normFile(e) {
        console.log('Upload event:', e);
        if (e.fileList.length > 1) {
            e.fileList.shift();
        }
        //如果文件上传成功，则可以保存
        if (e.fileList[0].status === 'done') {
            setOkDisabled(false);
        }
        return e && e.fileList;
    };

    function isDisabled() {
        return (treeNodeAttr.disabled === 'true');
    }

    function setSelectOptions() {
        treeNodeAttr.enum.split(' ').forEach(item => {
            selectOptions.push(item);
        });
        //注意大小括号：Array.map(item=>(不需要return))；Array.map(item=>{需要return}) 
        return selectOptions.map((value, index) => (
            <Option value={index} key={index}>{value}</Option>
        ));
    }

    //设置Form的初始化值
    function setFormInitialValues() {
        formInitialValues.name = treeNodeAttr.name;
        formInitialValues.class = treeNodeAttr.class;
        if (treeNodeText !== undefined) {
            switch (treeNodeAttr.class) {
                case 'Real':
                    formInitialValues.real = treeNodeText;
                    break;
                case 'Unsigned':
                    formInitialValues.unsigned = treeNodeText;
                    break;
                case 'Vector2u':
                    const vector2u = treeNodeText.split(' ');
                    formInitialValues.v2u_X = vector2u[0];
                    formInitialValues.v2u_Y = vector2u[1];
                    break;
                case 'Vector2f':
                    const vector2f = treeNodeText.split(' ');
                    formInitialValues.v2f_X = vector2f[0];
                    formInitialValues.v2f_Y = vector2f[1];
                    break;
                case 'Vector3f':
                    const vector3f = treeNodeText.split(' ');
                    formInitialValues.v3f_X = vector3f[0];
                    formInitialValues.v3f_Y = vector3f[1];
                    formInitialValues.v3f_Z = vector3f[2];
                    break;
                case 'Enum':
                    formInitialValues.enum_value = selectOptions[treeNodeText];
                    break;
                case 'Bool':
                    formInitialValues.checked = (treeNodeText === 'true');
                    break;
                case 'File':
                    formInitialValues.upload = (treeNodeText === 'null') ? [] : treeNodeText;
                    break;
            }
        }
    }

    //返回树结点修改后的数据
    function returnTreeNodeData(value) {
        const obj = {
            _attributes: treeNodeAttr,
            //_text: ''
        };

        if (treeNodeText !== undefined) {
            switch (treeNodeAttr.class) {
                case 'Real':
                    obj._text = value.real + '';
                    break;
                case 'Unsigned':
                    obj._text = value.unsigned + '';
                    break;
                case 'Vector2u':
                    obj._text = value.v2u_X + ' ' + value.v2u_Y;
                    break;
                case 'Vector2f':
                    obj._text = value.v2f_X + ' ' + value.v2f_Y;
                    break;
                case 'Vector3f':
                    obj._text = value.v3f_X + ' ' + value.v3f_Y + ' ' + value.v3f_Z;
                    break;
                case 'Enum':
                    obj._text = value.enum_value + '';
                    break;
                case 'Bool':
                    obj._text = value.checked ? 'true' : 'false';
                    break;
                case 'File':
                    obj._text = value.upload;
                    obj._text[0].uploadDate = uploadBodyContent.uploadDate;
                    break;
            }
        }

        changeData(obj);
    }

    return (
        <Modal
            title={"结点属性"}
            visible={visible}
            onOk={() => {
                form.validateFields()
                    .then(value => {
                        console.log(value);
                        returnTreeNodeData(value);
                    })
                    .catch(info => {
                        console.log('Validate Failed:', info);
                    });
            }}
            onCancel={hideModal}
            okText="保存"
            cancelText="取消"
            okButtonProps={{ disabled: okDisabled }}
        >
            <Form
                {...formItemLayout}
                form={form}
                name="nodeAttrModal"
                initialValues={formInitialValues}
            >
                <Form.Item name="name" label="Name" >
                    <Input disabled={true} />
                </Form.Item>
                <Form.Item name="class" label="Class" >
                    <Input disabled={true} />
                </Form.Item>
                {
                    (treeNodeAttr.class === 'Real') &&
                    <Form.Item name="real" label="Value"
                        rules={[{ required: true, message: 'Value cannot be empty!' }]}
                    >
                        <InputNumber min={0} max={10000} step={0.1} disabled={isDisabled()} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Unsigned') &&
                    <Form.Item name='unsigned' label="Value"
                        rules={[{ required: true, message: 'Value cannot be empty!' }]}
                    >
                        <InputNumber formatter={value => `${value}`.replace(/[^\d]+/g, '')} parser={value => value.replace(/[^\d]+/g, '')} disabled={isDisabled()} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Vector2u') &&
                    <Form.Item label="Value">
                        <Row>
                            <Col span={8}>
                                <Form.Item name="v2u_X" label="X"
                                    rules={[{ required: true, message: 'X cannot be empty!' }]}
                                >
                                    <InputNumber formatter={value => `${value}`.replace(/[^\d]+/g, '')} parser={value => value.replace(/[^\d]+/g, '')} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="v2u_Y" label="Y"
                                    rules={[{ required: true, message: 'Y cannot be empty!' }]}
                                >
                                    <InputNumber formatter={value => `${value}`.replace(/[^\d]+/g, '')} parser={value => value.replace(/[^\d]+/g, '')} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Vector2f') &&
                    <Form.Item label="Value">
                        <Row>
                            <Col span={8}>
                                <Form.Item name="v2f_X" label="X"
                                    rules={[{ required: true, message: 'X cannot be empty!' }]}
                                >
                                    <InputNumber min={1} max={100} step={1} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="v2f_Y" label="Y"
                                    rules={[{ required: true, message: 'Y cannot be empty!' }]}
                                >
                                    <InputNumber min={1} max={100} step={1} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Vector3f') &&
                    <Form.Item label="Value">
                        <Row>
                            <Col span={8}>
                                <Form.Item name="v3f_X" label="X"
                                    rules={[{ required: true, message: 'X cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="v3f_Y" label="Y"
                                    rules={[{ required: true, message: 'Y cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="v3f_Z" label="Z"
                                    rules={[{ required: true, message: 'Z cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} disabled={isDisabled()} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Enum') &&
                    <Form.Item name="enum_value" label="Type"
                        rules={[{ required: true }]}
                    >
                        <Select
                            disabled={isDisabled()}
                        >
                            {setSelectOptions()}
                        </Select>
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Bool') &&
                    <Form.Item name="checked" label="Switch"
                        valuePropName="checked"
                    >
                        <Switch
                            checkedChildren="Y"
                            unCheckedChildren="N"
                            disabled={isDisabled()}
                        >
                            {treeNodeAttr.name}
                        </Switch>
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'File') &&
                    <Form.Item name="upload" label="Upload"
                        valuePropName="fileList"
                        getValueFromEvent={normFile}
                        rules={[{ required: true, message: 'Please upload the corresponding file!' }]}
                    >
                        <Upload action="/uploadFile" listType="picture" showUploadList={{ showRemoveIcon: false }}
                            accept={treeNodeAttr.accept} data={uploadBodyContent}>
                            <Button icon={<UploadOutlined />}>Click to upload</Button>
                        </Upload>
                    </Form.Item>
                }
            </Form>
        </Modal>
    );
}

export {
    TreeNodeAttrModal as PhysikaTreeNodeAttrModal
};
