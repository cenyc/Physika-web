import React from 'react';
import ReactDOM from 'react-dom';
import { Layout, Menu, Dropdown, Button,Row, Col} from 'antd';
import { DownOutlined } from '@ant-design/icons';

import '../../static/css/antdesign.css'

import { Test } from './CloudEuler'
import { PhysikaClothSimulation } from './Cloth'

const { Header, Content, Sider } = Layout;

class WebLayout extends React.Component {
    state = {
        item: 0
    };

    change = (e) => {
        console.log(e);
        this.setState({
            item: e.key
        });
    }

    menu = () => {
        return (
            <Menu onClick={this.change}>
                <Menu.Item key="1">流体</Menu.Item>
                <Menu.Item key="2">布料</Menu.Item>
            </Menu>
        );
    }

    //<Col span={3} style={{ display: "flex", justifyContent: "center", alignItems: "center", minWidth: "200px" }}></Col>

    render() {

        return (
            <Layout>
                <Header className="header" style={{ backgroundColor: "#fff" }}>
                    <Row>
                        <Col span={3} style={{ display: "flex", justifyContent: "center", alignItems: "center"}}>
                            <div className="logo" style={{ textAlign: "center", fontSize: "20px" }}>
                                云仿真平台
                            </div>
                        </Col>
                        <Col span={17}>

                        </Col>
                        <Col span={4} >
                            <Dropdown overlay={this.menu} placement="bottomCenter">
                                <Button>选择仿真类型<DownOutlined /></Button>
                            </Dropdown>
                        </Col>
                    </Row>
                </Header>
                <Layout style={{ height: "93vh" }}>
                    <Sider width={240} className="site-layout-background">
                        {
                            (this.state.item === "1") &&
                            <Test></Test>
                        }
                        {
                            (this.state.item === "2") &&
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
                            <div id="geoViewer" style={{ height: "100%", width: "100%"}}></div>
                        </Content>
                    </Layout>
                </Layout>
            </Layout>
        );
    }
}


function init() {
    window.onload = function () {
        ReactDOM.render(<WebLayout />, webBody);

    }
}

export { init }