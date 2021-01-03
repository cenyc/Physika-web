import React from 'react';
import { Layout, Menu, Dropdown, Button, Row, Col } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import '../../static/css/antdesign.css'
import { PhysikaCloudEuler } from './CloudEuler'
import { PhysikaClothSimulation } from './Cloth'

const { Header, Content, Sider } = Layout;

import WebworkerPromise from 'webworker-promise';
import WSWorker from '../ws.worker'

class PhysikaWeb extends React.Component {
    state = {
        item: 0
    };

    componentDidMount(){
        //this.wsWorker = new WebworkerPromise(new WSWorker());
        //this.wsWorker.postMessage({ init: true });
    }

    change = (e) => {
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
                        <Col span={3} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
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
                        <pre id="response"></pre>
                    </Row>
                </Header>
                <Layout style={{ height: "93vh" }}>
                    <Sider width={250} className="site-layout-background" style={{overflow:'scroll'}}>
                        {
                            (this.state.item === "1") &&
                            <PhysikaCloudEuler></PhysikaCloudEuler>
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
                            <div id="geoViewer" style={{ height: "100%", width: "100%", position: "relative" }}></div>
                        </Content>
                    </Layout>
                </Layout>
            </Layout >
        );
    }
}

export default PhysikaWeb;
