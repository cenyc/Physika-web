import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Button, Row, Col, Avatar } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import '../../static/css/antdesign.css'
import { PhysikaCloudEuler } from './CloudEuler'
import { PhysikaClothSimulation } from './Cloth'
import { LoginModal } from './LoginModal';

const { Header, Content, Sider } = Layout;

//屏蔽全局浏览器右键菜单
document.oncontextmenu = function () {
    return false;
}

function PhysikaWeb() {
    const [simType, setSimType] = useState(-1);
    const [userStatus, setUserStatus] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        window.localStorage.userID = 'localUser';
    }, []);

    const simTypeMenu = (
        <Menu onClick={auth}>
            <Menu.Item key='0'>云欧拉仿真</Menu.Item>
            <Menu.Item key='1'>单张图像构建三维云</Menu.Item>
        </Menu>
    )

    const userMenu = (
        <Menu onClick={userAction}>
            <Menu.Item key="0">注销</Menu.Item>
        </Menu>
    )

    function auth(e) {
        setSimType(e.key);
        if (!window.localStorage.userID) {
            setVisible(true);
        }
        else {
            //token验证
            setUserStatus(true);
        }
    }

    function changeUserStatus(status) {
        setUserStatus(status);
        setVisible(false);
    }

    function userAction(e) {
        if (e.key === '0') {
            console.log('注销！');
        }
    }

    return (

        <Layout>
            <Header className="header" style={{ backgroundColor: "#fff" }}>
                <Row>
                    <Col span={3} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <div className="logo" style={{ textAlign: "center", fontSize: "20px" }}>
                            云仿真平台
                        </div>
                    </Col>
                    <Col span={17}></Col>
                    <Col span={3} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Dropdown overlay={simTypeMenu} placement="bottomCenter">
                            <Button>选择仿真类型<DownOutlined /></Button>
                        </Dropdown>
                    </Col>
                    <Col span={1} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <Dropdown overlay={userMenu} placement="bottomCenter" arrow>
                            <Avatar size={40}>{window.localStorage.userID.substring(0, 1)}</Avatar>
                        </Dropdown>
                    </Col>
                </Row>
            </Header>
            <Layout style={{ height: "93vh" }}>
                <Sider width={250} className="site-layout-background" style={{ overflow: 'scroll' }}>
                    {
                        userStatus && (simType === "0") &&
                        <PhysikaCloudEuler></PhysikaCloudEuler>
                    }
                    {
                        userStatus && (simType === "1") &&
                        <PhysikaClothSimulation></PhysikaClothSimulation>
                    }
                </Sider>
                <Layout style={{ padding: '24px 24px 24px' }}>
                    <Content
                        className="site-layout-background"
                        style={{
                            padding: 0,
                            margin: 0,
                            minHeight: 280,
                        }}
                    >
                        <div id="geoViewer" style={{ height: "100%", width: "100%", position: "relative" }}></div>
                    </Content>
                </Layout>
            </Layout>
            <div>
                <LoginModal
                    visible={visible}
                    changeUserStatus={(status) => changeUserStatus(status)}
                ></LoginModal>
            </div>
        </Layout >

    );
}

export default PhysikaWeb;
