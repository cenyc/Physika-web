import React from 'react';
import { Tree, Button, Divider, Descriptions, Collapse, notification } from 'antd';
const { TreeNode } = Tree;
const { Panel } = Collapse;
//antd样式
import 'antd/dist/antd.css';
//这个包比较大。。。
import { BiShow, BiHide, BiPointer, BiCube } from 'react-icons/bi'
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkFPSMonitor from '../Widget/FPSMonitor';

import { getOrientationMarkerWidget } from '../Widget/OrientationMarkerWidget';
import { physikaInitObj } from '../../IO/InitObj';
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';


function setDescription(model, type) {
    const description = [];
    if (type === 'obj') {
        description.push(
            {
                name: "面片数",
                content: model.source.getNumberOfPolys()
            }
        );
    }
    return description;
}

class Glance extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [{
                key: '0',
                name: '场景',
                children: []
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

    handleFile = (e) => {
        const files = e.target.files;
        Object.keys(files).forEach((fileKey, fileIndex) => {
            const file = files[fileKey];
            const fileNameSplitArray = file.name.split('.');
            const name = fileNameSplitArray[0];
            const ext = fileNameSplitArray[1];
            if (ext === 'obj') {
                const reader = new FileReader();
                reader.onload = e => {
                    physikaInitObj(e.target.result, 'obj')
                        .then(res => {
                            if (Object.keys(res).length === 1) {
                                this.state.data[0].children.push({
                                    key: '0-' + this.curScene.length,
                                    name: name
                                });
                                this.curScene.push(res[0]);
                                this.renderer.addActor(res[0].actor);
                                this.state.description.push(setDescription(res[0], ext));
                            }
                            else {
                                Object.keys(res).forEach((modelKey, modelIndex) => {
                                    console.log(res[modelKey].source);
                                    this.state.data[0].children.push({
                                        key: '0-' + this.curScene.length,
                                        name: name + '_' + modelKey
                                    });
                                    this.curScene.push(res[modelKey]);
                                    this.renderer.addActor(res[modelKey].actor);
                                    this.state.description.push(setDescription(res[modelKey], ext));
                                })
                            }
                            //显示方向标记部件
                            this.orientationMarkerWidget.setEnabled(true);
                            //初始化fps控件
                            this.initFPS();
                            this.updateScene();
                        })
                        .catch(err => {
                            console.log('Error in init obj： ', err);
                        })
                };
                reader.readAsText(file);
            }
            //其他类型模型
        });

    }

    deleteModel = (index) => {
        this.renderer.removeActor(this.curScene[index].actor);
        this.curScene[index].source.delete();
        this.curScene.splice(index, 1);
        const array = this.state.data[0].children;
        array.splice(index, 1);
        for (let i = index; i < array.length; ++i) {
            const keyArray = array[i].key.split('-');
            array[i].key = keyArray[0] + '-' + (Number(keyArray[1]) - 1);
        }
        this.state.description.splice(index, 1);
        this.updateScene();
    }

    changeVisible = (index) => {
        const visibility = this.curScene[index].actor.getVisibility();
        this.curScene[index].actor.setVisibility(!visibility);
        this.updateScene();
    }

    cellPick = (index) => {
        console.log("开始选取");

        const picker = vtkCellPicker.newInstance();
        picker.setPickFromList(true);
        picker.setTolerance(0);
        picker.initializePickList();
        picker.addPickList(this.curScene[index].actor);
        //console.log(picker.getPickList());

        const subscription = this.renderWindow.getInteractor().onRightButtonPress((callData) => {
            if (this.renderer !== callData.pokedRenderer) {
                return;
            }

            const pos = callData.position;
            const point = [pos.x, pos.y, 0.0];
            console.log(`Pick at: ${point}`);
            picker.pick(point, this.renderer);

            if (picker.getActors().length === 0) {
                const pickedPoint = picker.getPickPosition();
                console.log(`No cells picked, default: ${pickedPoint}`);
            }
            else {
                const pickedCellId = picker.getCellId();
                console.log('Picked cell: ', pickedCellId);
                const pickedPoints = picker.getPickedPositions();
                for (let i = 0; i < pickedPoints.length; i++) {
                    const pickedPoint = pickedPoints[i];
                    console.log(`Picked: ${pickedPoint}`);
                }
                notification['info']({
                    message: '面片选取',
                    description: '所选面片id： ' + pickedCellId
                });
            }
            //取消鼠标右键点击的订阅（2020.10.17）
            subscription.unsubscribe();
        });
    }

    updateScene = () => {
        this.forceUpdate();
        this.renderer.resetCamera();
        this.renderWindow.render();
    }

    //递归渲染每个树节点（这里必须用map遍历！因为需要返回数组）
    renderTreeNodes = (data) => data.map((item, index) => {
        console.log(item);
        item.title = (
            <div>
                {
                    item.key === '0'
                        ? <span className="ant-rate-text">{item.name}</span>
                        : <div>
                            <span className="ant-rate-text">{item.name}</span>
                            {
                                this.curScene[index].actor.getVisibility()
                                    ? <BiShow onClick={() => this.changeVisible(index)}></BiShow>
                                    : <BiHide onClick={() => this.changeVisible(index)}></BiHide>
                            }
                            {
                                <BiPointer onClick={() => this.cellPick(index)}></BiPointer>
                            }
                            <Button type="text" size="small" onClick={() => this.deleteModel(index)}>-</Button>
                        </div>
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

    initFPS = () => {
        let FPSContainer = document.getElementById("fps");
        if (FPSContainer.children.length === 0) {
            this.FPSWidget = vtkFPSMonitor.newInstance({ infoVisibility: false });
            this.FPSWidget.setContainer(FPSContainer);
            this.FPSWidget.setOrientation('vertical');
            this.FPSWidget.setRenderWindow(this.renderWindow);
        }
    }

    renderDescriptionItems = (i) => this.state.description[i].map((item, index) => {
        return <Descriptions.Item label={item.name} key={index}>{item.content}</Descriptions.Item>
    })

    renderDescriptions = () => this.state.description.map((item, index) => {
        return <Descriptions title={this.state.data[0].children[index].name} column={1} layout={'horizontal'} key={index}>{this.renderDescriptionItems(index)}</Descriptions>
    })

    render() {
        console.log("tree:", this.state.data);
        return (
            <div>
                <Divider>模型查看</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="场景模型" key="1">
                        <div>
                            <input type="file" id="glance-input" accept=".obj" onChange={this.handleFile} style={{ display: 'none' }} multiple />
                            <BiCube />
                            <Button type="text" onClick={() => document.getElementById("glance-input").click()}>添加模型</Button>
                        </div>
                        <Divider />
                        <Tree style={{ overflowX: 'auto', width: '200px' }}>
                            {this.renderTreeNodes(this.state.data)}
                        </Tree>
                    </Panel>
                    <Panel header="模型信息" key="2">
                        {this.renderDescriptions()}
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