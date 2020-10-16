import React, { useEffect } from 'react';
import { Tree, Button, Modal, Form, InputNumber, Input, Row, Col } from 'antd';

import { deepCopy, isObject } from '../../Common';

//TreeNodeAttrModal组件中Form的样式
const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
};

//使用Hook实现的树结点属性显示Modal
const TreeNodeAttrModal = ({ treeNodeAttr, treeNodeText, visible, hideModal, changeData }) => {
    const [form] = Form.useForm();
    const formInitialValues = {};

    useEffect(() => {
        if (form && visible) {
            setFormInitialValues();
            form.resetFields();
        }
    }, [visible]);

    //设置Form的初始化值
    function setFormInitialValues() {
        formInitialValues.name = treeNodeAttr.name;
        formInitialValues.class = treeNodeAttr.class;
        //当结点不含有type时，formInitialValues.type=undefined！
        formInitialValues.type = treeNodeAttr.type;
        if (!!treeNodeText) {
            switch (treeNodeAttr.class) {
                case 'Real':
                    formInitialValues.real = treeNodeText;
                    break;
                case 'Vector3f':
                    let vector3f = treeNodeText.split(' ');
                    formInitialValues.realX = vector3f[0];
                    formInitialValues.realY = vector3f[1];
                    formInitialValues.realZ = vector3f[2];
            }
        }
    }

    //返回树结点修改后的数据
    function returnTreeNodeData(value) {
        let obj = {
            _attributes: treeNodeAttr,
            _text: ''
        };
        Object.keys(obj._attributes).map((item) => {
            //这里不能点引用item，会出大问题！（会将item作为一个新成员加入到obj._attributes中）
            obj._attributes[item] = value[item];
        });
        if (value.hasOwnProperty('real')) {
            obj._text = value.real;
        }
        else if (value.hasOwnProperty('realX')) {
            obj._text = value.realX + ' ' + value.realY + ' ' + value.realZ;
        }
        else {
            console.log("There is no _text in this treeNode.");
        }
        changeData(deepCopy(obj));
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
                    (!!treeNodeAttr.type) &&
                    <Form.Item name="type" label="Type" >
                        <Input disabled={true} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Real') &&
                    <Form.Item name="real" label="Value"
                        rules={[{ required: true, message: 'Value cannot be empty!' }]}
                    >
                        <InputNumber min={0} max={10000} step={0.1} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Vector3f') &&
                    <Form.Item label="Value">
                        <Row>
                            <Col span={8}>
                                <Form.Item name="realX" label="X"
                                    rules={[{ required: true, message: 'X cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="realY" label="Y"
                                    rules={[{ required: true, message: 'Y cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="realZ" label="Z"
                                    rules={[{ required: true, message: 'Z cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                }
            </Form>
        </Modal>
    );
}

export {
    TreeNodeAttrModal as PhysikaTreeNodeAttrModal
};
