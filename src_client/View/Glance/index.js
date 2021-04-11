import React from 'react';
import { Tree, Button, Divider, Descriptions, Collapse } from 'antd';
const { TreeNode } = Tree;
const { Panel } = Collapse;
//antd样式
import 'antd/dist/antd.css';
//这个包比较大。。。
import { BiShow, BiHide, BiPointer } from 'react-icons/bi'
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkFPSMonitor from '../Widget/FPSMonitor';

import { getOrientationMarkerWidget } from '../Widget/OrientationMarkerWidget';
import { physikaInitObj } from '../../IO/InitObj';

class Glance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [{
                key: '0',
                name: '场景',
                children: [
                    {
                        key: '0-0',
                        name: '+'
                    }
                ]
            }],
            //结果展示信息
            description: [],
        };
    }

    componentDidMount() {
        //---------初始化渲染窗口
        this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            //background: [1.0, 1.0, 1.0],
            background: [0.75, 0.76, 0.79],
            rootContainer: geoViewer,
            //关键操作！！！能把canvas大小限制在div里了！
            containerStyle: { height: 'inherit', width: 'inherit' }
        });
        this.renderer = this.fullScreenRenderer.getRenderer();
        this.renderWindow = this.fullScreenRenderer.getRenderWindow();
        //添加旋转控制控件
        this.orientationMarkerWidget = getOrientationMarkerWidget(this.renderWindow);
        //模拟结果组成的场景（一个obj文件包含多个obj模型，每个模型分别作为一个独立的对象插入curScene）
        //curScene=[{source, mapper, actor},{source, mapper, actor}...]
        this.curScene = [];

    }

    componentWillUnmount() {
        console.log('子组件将卸载');
        let renderWindowDOM = document.getElementById("geoViewer");
        renderWindowDOM.innerHTML = ``;
        this.curScene = [];
        //是否需要？
        if (this.FPSWidget) {
            this.FPSWidget.delete();
        }
    }

    addModel = (index) => {
        //
    }

    deleteNode = (index) => {
        //
    }

    cellPick = (index) => {
        //
    }

    //递归渲染每个树节点（这里必须用map遍历！因为需要返回数组）
    renderTreeNodes = (data) => data.map((item, index) => {
        console.log(item);
        item.title = (
            <div>
                {
                    item.key === '0'
                        ? <span className="ant-rate-text">{item.name}</span>
                        : item.name === '+'
                            ? <Button type="text" size="small" onClick={() => this.addModel(index)}>{item.name}</Button>
                            : (
                                <div>
                                    <span className="ant-rate-text">{item.name}</span>
                                    {
                                        this.curScene[index].actor.getVisibility()
                                            ? <BiShow onClick={() => this.changeVisible(index)}></BiShow>
                                            : <BiHide onClick={() => this.changeVisible(index)}></BiHide>
                                    }
                                    {
                                        <BiPointer onClick={() => this.cellPick(index)}></BiPointer>
                                    }
                                    <Button type="text" size="small" onClick={() => this.deleteNode(index)}>-</Button>
                                </div>
                            )

                }
            </div >
        );

        if (item.children) {
            return (
                <TreeNode title={item.title} key={item.key}>
                    {this.renderTreeNodes(item.children)}
                </TreeNode>
            );
        }

        return <TreeNode {...item} />;
    });

    //只用于更新模拟结果模型
    updateScene = (newScene) => {
        //移除旧场景actor
        this.curScene.forEach(item => {
            Object.keys(item).forEach(key => {
                this.renderer.removeActor(item[key].actor);
                item[key].source.delete();
            });
        });
        this.curScene = newScene;
        //console.log(this.curScene);
        //添加新场景actor
        this.curScene.forEach(item => {
            Object.keys(item).forEach(key => {
                this.renderer.addActor(item[key].actor);
                if (!this.state.isShowResult) {
                    item[key].actor.setVisibility(false);
                }
            });
        });
        this.renderer.resetCamera();
        this.renderWindow.render();
    }

    initFPS = () => {
        let FPSContainer = document.getElementById("fps");
        if (FPSContainer.children.length === 0) {
            this.FPSWidget = vtkFPSMonitor.newInstance({ infoVisibility: false });
            this.FPSWidget.setContainer(FPSContainer);
            this.FPSWidget.setOrientation('vertical');
            this.FPSWidget.setRenderWindow(this.renderWindow);
        }
    }

    renderDescriptions = () => this.state.description.map((item, index) => {
        return <Descriptions.Item label={item.name} key={index}>{item.content}</Descriptions.Item>
    })

    render() {
        console.log("tree:", this.state.data);
        return (
            <div>
                <Divider>模型查看</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="场景模型" key="1">
                        <Tree style={{ overflowX: 'auto', width: '200px' }}>
                            {this.renderTreeNodes(this.state.data)}
                        </Tree>
                    </Panel>
                    <Panel header="模型信息" key="2">
                        <Descriptions column={1} layout={'horizontal'}>
                            {this.renderDescriptions()}
                        </Descriptions>
                    </Panel>
                    {/* forceRender为true，即折叠面板未打开时也渲染其中组件；若为false，则未打开面板前无法获得其中组件 */}
                    <Panel header="绘制信息" key="3" forceRender="true">
                        <div id="fps"></div>
                    </Panel>
                </Collapse>
            </div>
        )
    }

}

export {
    Glance as Glance
}