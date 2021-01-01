import 'bootstrap';
import React from 'react';
import { Tree, Button, Slider, Divider, Descriptions, Collapse } from 'antd';
const { TreeNode } = Tree;
const { Panel } = Collapse;
//antd样式
import 'antd/dist/antd.css';
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkVolumeController from '../Widget/VolumeController'

import { physikaLoadConfig } from '../../IO/LoadConfig'
import { physikaUploadConfig } from '../../IO/UploadConfig'
import { PhysikaTreeNodeAttrModal } from '../TreeNodeAttrModal'
import { physikaLoadVti } from '../../IO/LoadVti'
import { getOrientationMarkerWidget } from '../Widget/OrientationMarkerWidget'


import WebworkerPromise from 'webworker-promise';
import WorkerTest from '../../test.worker';

import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

function parseSimulationResult(data) {
    let simRunObj;
    for (let i = 0; i < data[0].children.length; i++) {
        if (data[0].children[i].tag === 'SimulationRun') {
            simRunObj = data[0].children[i];
            data[0].children.splice(i, 1);
        }
    }
    const resultInfo = {
        fileName: '',
        frameSum: 0,
        animation: false,
        description: []
    }
    for (const item of simRunObj.children) {
        if (item.tag === 'FileName') {
            resultInfo.fileName = item._text;
        }
        if (item.tag === 'FrameSum') {
            resultInfo.frameSum = item._text;
        }
        if (item.tag === 'Animation') {
            resultInfo.animation = (item._text === 'true');
        }
        resultInfo.description.push(
            {
                name: item._attributes.name,
                content: item._text
            }
        );
    }
    return resultInfo;
}

class CloudEulerSimulation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [],
            treeNodeAttr: {},
            treeNodeText: "",
            treeNodeKey: -1,
            uploadDisabled: true,

            curFrameIndex: 0,
            //结果展示信息
            description: [],

            isTreeNodeAttrModalShow: false,
            uploadDisabled: true,
            isSliderShow: false,
            animation: false,
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
        //显示方向标记部件
        this.orientationMarkerWidget.setEnabled(true);
        //curScene={source, mapper, actor}
        this.curScene = {};
        //frameSeq保存了每帧场景，用于实现动画（是否还需要？）
        this.frameSeq = [];

        //文件名
        this.fileName = '';
        //总帧数
        this.frameSum = 0;
        //frameStateArray保存每一帧仿真模型的当前状态：
        // 0（未获取）、1（正在获取）、2（在indexedDB中）、3（在内存对象中（无法获知js对象在内存中的大小，没法设定内存对象大小。。。））
        this.frameStateArray;

        //判断是否第一次加载vtk控件
        this.isFirstLoad = true;

        this.worker = new WebworkerPromise(new WorkerTest());
        this.worker.postMessage({ init: true });
    }


    componentWillUnmount() {
        console.log('子组件将卸载');
        let renderWindowDOM = document.getElementById("geoViewer");
        renderWindowDOM.innerHTML = ``;
        this.worker.terminate();
    }


    load = () => {
        physikaLoadConfig('fluid')
            .then(res => {
                console.log("成功获取初始化配置");
                this.setState({
                    data: res,
                    uploadDisabled: false
                });
                //如果不是第一次加载，则清空原场景
                if (!this.isFirstLoad) {
                    this.renderer.removeActor(this.curScene.actor);
                    this.curScene = {};
                    let geoViewer = document.getElementById("geoViewer");
                    if (document.getElementById("volumeController")) {
                        geoViewer.removeChild(document.getElementById("volumeController"));
                    }
                    this.renderer.resetCamera();
                    this.renderWindow.render();
                    this.setState({
                        curFrameIndex: 0,
                        description: [],
                        isSliderShow: false,
                        animation: false,
                    });
                    this.isFirstLoad = true;
                }
            })
            .catch(err => {
                console.log("Error loading: ", err);
            })
    }

    //递归渲染每个树节点（这里必须用map遍历！因为需要返回数组）
    renderTreeNodes = (data) => data.map((item, index) => {
        item.title = (
            <div>
                <Button type="text" size="small" onClick={() => this.showTreeNodeAttrModal(item)}>{item._attributes.name}</Button>
            </div>
        );

        if (item.children) {
            return (
                <TreeNode title={item.title} key={item.key} >
                    {this.renderTreeNodes(item.children)}
                </TreeNode>
            );
        }

        return <TreeNode {...item} />;
    });

    showTreeNodeAttrModal = (item) => {
        this.setState({
            isTreeNodeAttrModalShow: true,
            treeNodeAttr: item._attributes,
            treeNodeKey: item.key,
            treeNodeText: item._text
        });
    }

    hideTreeNodeAttrModal = () => {
        this.setState({
            isTreeNodeAttrModalShow: false
        });
    }

    //接收TreeNodeAttrModal返回的结点数据并更新树
    changeData = (obj) => {
        //注意：这里直接改变this.state.data本身不会触发渲染，
        //真正触发渲染的是hideTreeNodeAttrModal()函数的setState！
        //官方并不建议直接修改this.state中的值，因为这样不会触发渲染，
        //但是React的setState本身并不能处理nested object的更新。
        //若该函数不再包含hideTreeNodeAttrModal()函数，则需要另想办法更新this.state.data！
        let eachKey = this.state.treeNodeKey.split('-');
        let count = 0;
        const findTreeNodeKey = (node) => {
            if (count === eachKey.length - 1) {
                //找到treeNodeKey对应树结点，更新数据
                if (obj.hasOwnProperty('_text')) {
                    console.log("obj ", obj);
                    node[eachKey[count]]._text = obj._text;
                }
                //若以后需修改_attributes属性，则在此添加代码
                return;
            }
            findTreeNodeKey(node[eachKey[count++]].children);
        };
        findTreeNodeKey(this.state.data);
        this.hideTreeNodeAttrModal();
    }

    updateScene = (newScene) => {
        //移除旧场景actor
        this.renderer.removeActor(this.curScene.actor);
        this.curScene = newScene;
        console.log(this.curScene);
        //添加新场景actor
        this.renderer.addActor(this.curScene.actor);
        this.renderer.resetCamera();
        this.renderWindow.render();
    }

    initVolumeController = () => {
        //动态删除添加volume这个div
        let geoViewer = document.getElementById("geoViewer");
        if (document.getElementById("volumeController")) {
            geoViewer.removeChild(document.getElementById("volumeController"));
        }
        let volumeControllerContainer = document.createElement("div");
        volumeControllerContainer.id = "volumeController";
        geoViewer.append(volumeControllerContainer);

        this.controllerWidget = vtkVolumeController.newInstance({
            size: [400, 150],
            rescaleColorMap: true,
        });
        this.controllerWidget.setContainer(volumeControllerContainer);
        this.controllerWidget.setupContent(this.renderWindow, this.curScene.actor, true);
    }

    upload = () => {
        this.setState({
            uploadDisabled: true
        }, () => {
            //第一个参数data，第二个参数仿真类型
            physikaUploadConfig(this.state.data, 'fluid')
                .then(res => {
                    console.log("成功上传配置并获取到仿真结果配置");
                    const resultInfo = parseSimulationResult(res);
                    this.fileName = resultInfo.fileName;
                    this.frameSum = resultInfo.frameSum;

                    this.fetchModel(0);

                    this.setState({
                        description: resultInfo.description,
                        animation: resultInfo.animation,
                        uploadDisabled: false,
                        isSliderShow: true,
                        isDescriptionShow: true,
                    });
                })
        })
    }

    fetchModel = (frameIndex) => {
        this.worker.postMessage({
            data: { fileName: this.fileName + '_' + frameIndex + '.vti' }
        })
            .then(res => {
                const vtiReader = new vtkXMLImageDataReader.newInstance();
                vtiReader.parseAsArrayBuffer(res);
                const source = vtiReader.getOutputData(0);
                const mapper = vtkVolumeMapper.newInstance();
                const actor = vtkVolume.newInstance();

                mapper.setInputData(source);
                actor.setMapper(mapper);

                actor.getProperty().setAmbient(0.2);
                actor.getProperty().setDiffuse(0.7);
                actor.getProperty().setSpecular(0.3);
                actor.getProperty().setSpecularPower(8.0);

                const newScene = { source, mapper, actor };

                if (this.isFirstLoad) {
                    this.updateScene(newScene);
                    //初始化体素渲染控制控件
                    this.initVolumeController();
                    this.isFirstLoad = false;
                }
                else {
                    this.updateScene(newScene);
                    this.controllerWidget.changeActor(this.curScene.actor);
                }

                this.setState({ curFrameIndex: frameIndex });

            })
            .catch(err => {
                console.log("Error uploading: ", err);
            });
    }

    onSliderChange = (value) => {
        //console.log('onChange: ', value);
    }

    onSliderAfterChange = (value) => {
        console.log('onAfterChange: ', value);
        if (value !== this.state.curFrameIndex) {
            this.fetchModel(value);
        }

    }

    renderDescriptions = () => this.state.description.map((item, index) => {
        return <Descriptions.Item label={item.name} key={index}>{item.content}</Descriptions.Item>
    })

    render() {
        console.log("tree:", this.state.data);
        return (
            <div>
                <Divider>云欧拉仿真</Divider>
                <Collapse defaultActiveKey={['1']}>
                    <Panel header="仿真初始化" key="1">
                        <Button type="primary" size={'small'} block onClick={this.load}>加载场景</Button>
                        <Tree>
                            {this.renderTreeNodes(this.state.data)}
                        </Tree>
                        <br />
                        <Button type="primary" size={'small'} block onClick={this.upload} disabled={this.state.uploadDisabled}>开始仿真</Button>
                    </Panel>
                    <Panel header="仿真结果信息" key="2">
                        <Descriptions column={1} layout={'horizontal'}>
                            {this.renderDescriptions()}
                        </Descriptions>
                    </Panel>
                    <Panel header="仿真展示控制" key="3">
                        {
                            (this.state.isSliderShow) &&
                            <div>
                                <Slider defaultValue={0} max={this.frameSum - 1}
                                    onChange={this.onSliderChange} onAfterChange={this.onSliderAfterChange}></Slider>
                            </div>
                        }
                    </Panel>
                </Collapse>
                <div >
                    <PhysikaTreeNodeAttrModal
                        treeNodeAttr={this.state.treeNodeAttr}
                        treeNodeText={this.state.treeNodeText}
                        visible={this.state.isTreeNodeAttrModalShow}
                        hideModal={this.hideTreeNodeAttrModal}
                        changeData={(obj) => this.changeData(obj)}
                    ></PhysikaTreeNodeAttrModal>
                </div>
            </div>
        )
    }
}

export {
    CloudEulerSimulation as PhysikaCloudEuler
}
