import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Checkbox } from 'antd';

//Form的样式
const formItemLayout = {
    labelCol: {
        span: 6,
    },
    wrapperCol: {
        span: 14,
    },
};

const tailLayout = {
    wrapperCol: {
        offset: 6,
        span: 14,
    },
};

const LoginModal = ({visible, changeUserStatus}) => {
    const [form] = Form.useForm();

    const onFinish = (values) => {
        console.log('Success:', values);
        window.localStorage.userID = values.username;
        changeUserStatus(true);
    };

    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };

    return (
        <Modal
            title={"用户登录"}
            visible={visible}
            closable={false}
            destroyOnClose={true}
            footer={null}
        >
            <Form
                {...formItemLayout}
                form={form}
                name=""
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
            >
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[
                        {
                            required: true,
                            message: 'Please input your username!',
                        },
                    ]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        {
                            required: true,
                            message: 'Please input your password!',
                        },
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item {...tailLayout} name="remember" valuePropName="checked">
                    <Checkbox>Remember me</Checkbox>
                </Form.Item>

                <Form.Item {...tailLayout}>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}

export {
    LoginModal as LoginModal
};