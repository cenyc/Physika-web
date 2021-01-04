'use strict';
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
import { physikaInitVti } from '../../IO/InitVti'
import { getOrientationMarkerWidget } from '../Widget/OrientationMarkerWidget'

import WebworkerPromise from 'webworker-promise';
import WSWorker from '../../Worker/ws.worker';

import db from '../../db';

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

//load:重新加载初始化文件，并清空界面；upload：只会清空界面。

class CloudEulerSimulation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [],
            treeNodeAttr: {},
            treeNodeText: "",
            treeNodeKey: -1,
            uploadDisabled: true,

            //结果展示信息
            description: [],

            isTreeNodeAttrModalShow: false,
            uploadDisabled: true,
            animation: false,
            isSliderShow: false,
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
        //文件名
        this.fileName = '';
        //总帧数
        this.frameSum = 0;
        //当前帧序号
        this.curFrameIndex = 0;
        //curScene={source, mapper, actor}
        this.curScene = {};
        //frameStateArray保存每一帧仿真模型的当前状态：
        // 0（未获取）、1（正在获取）、2（在indexedDB中）、3（在内存对象中（无法获知js对象在内存中的大小，没法设定内存对象大小。。。））
        this.frameStateArray = [];
        //fetchFrameQueue保存未获取帧的获取序列
        this.fetchFrameQueue = [];
        //加载到内存中的帧
        this.frameSeq = [];
        this.workerLock = false;
        this.fetchModelTimer = null;

        this.wsWorker = new WebworkerPromise(new WSWorker());
        this.wsWorker.postMessage({ init: true });

        this.uploadDate=null;
    }

    componentWillUnmount() {
        console.log('子组件将卸载');
        let renderWindowDOM = document.getElementById("geoViewer");
        renderWindowDOM.innerHTML = ``;
        this.wsWorker.terminate();
        //关闭定时器
        if (this.fetchModelTimer !== null) {
            clearInterval(this.fetchModelTimer);
        }
    }

    clean = () => {
        this.renderer.removeActor(this.curScene.actor);
        this.curFrameIndex = 0;
        this.curScene = {};
        this.frameStateArray = [];
        this.fetchFrameQueue = [];
        this.frameSeq = [];
        this.workerLock = false;
        if (this.fetchModelTimer !== null) {
            clearInterval(this.fetchModelTimer);
        }

        let geoViewer = document.getElementById("geoViewer");
        if (document.getElementById("volumeController")) {
            geoViewer.removeChild(document.getElementById("volumeController"));
        }
        this.renderer.resetCamera();
        this.renderWindow.render();

        this.setState({
            description: [],
            animation: false,
            isSliderShow: false,
        });
    }

    load = () => {
        physikaLoadConfig('fluid')
            .then(res => {
                console.log("成功获取初始化配置");
                this.setState({
                    data: res,
                    uploadDisabled: false
                });
                this.clean();
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
        //添加新场景actor
        this.renderer.addActor(this.curScene.actor);
        this.renderer.resetCamera();
        this.renderWindow.render();
    }

    initVolumeController = () => {
        //动态删除添加volume这个div
        let geoViewer = document.getElementById("geoViewer");
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

    //现在upload不更新data！
    upload = () => {
        this.clean();
        //存储提交日期用于区分新旧数据，并删除旧数据
        this.uploadDate=Date.now();
        this.setState({
            uploadDisabled: true,
        }, () => {
            //第一个参数data，第二个参数仿真类型
            physikaUploadConfig(this.state.data, 'fluid')
                .then(res => {
                    console.log("成功上传配置并获取到仿真结果配置");
                    const resultInfo = parseSimulationResult(res);
                    this.fileName = resultInfo.fileName;
                    this.frameSum = resultInfo.frameSum;
                    this.setState({
                        description: resultInfo.description,
                        animation: resultInfo.animation,
                    });
                    //强制加载第0帧，然后再显示其他内容！
                    if (this.frameSum > 0) {
                        for (let i = 0; i < this.frameSum; i++) {
                            //根据帧总数初始化this.frameStateArray
                            this.frameStateArray.push(0);
                            //初始化获取帧序列
                            this.fetchFrameQueue.push(i);
                        }
                        this.fetchFrameQueue.shift();
                        console.log(this.frameStateArray, this.fetchFrameQueue, this.frameSum);
                        return this.wsWorker.postMessage({
                            data: { fileName: this.fileName + '_0.vti' }
                        });
                    }
                    else {
                        return Promise.reject('模拟帧数不大于0！');
                    }
                })
                .then(res => {
                    //第一帧获取时在开启获取定时器之前，故不需要锁
                    //开启获取定时器
                    this.fetchModelTimer = setInterval(this.checkFrameQueue, 1000);
                    //存入indexeddDB
                    db.table('model').add({
                        userID:'li',uploadDate:this.uploadDate,frameIndex:0,arrayBuffer:res
                    }).then(id=>{
                        console.log(id,"成功存入第0帧！");
                    }).catch(err=>{
                        console.log(err);
                    })
                    //注意后缀！
                    return physikaInitVti(res, 'zip');
                })
                .then(res => {
                    //第0帧的state为已获取
                    this.frameStateArray[0] = 2;
                    //将第0帧加入framSeq
                    this.frameSeq[0] = res;
                    this.updateScene(res);
                    this.initVolumeController();
                    this.setState({
                        uploadDisabled: false,
                        isSliderShow: true,
                    });
                })
                .catch(err => {
                    console.log("Error uploading: ", err);
                })
        });
    }

    checkFrameQueue = () => {
        //如果获取帧队列不为空 且 worker未上锁
        if (this.fetchFrameQueue.length !== 0 && !this.workerLock) {
            //开启worker锁
            this.workerLock = true;
            this.fetchModel(this.fetchFrameQueue.shift());
        }
        if (this.fetchFrameQueue.length === 0) {
            clearInterval(this.fetchModelTimer);
            console.log("获取完毕，清除定时器", this.fetchFrameQueue);
        }
    }

    fetchModel = (frameIndex) => {
        //设定当前帧状态为获取中
        this.frameStateArray[frameIndex] = 1;
        this.wsWorker.postMessage({
            data: { fileName: this.fileName + '_' + frameIndex + '.vti' }
        })
            .then(res => {
                //关闭worker锁
                this.workerLock = false;
                return physikaInitVti(res, 'zip');
            })
            .then(res => {
                //设定当前帧状态为以获取
                this.frameStateArray[frameIndex] = 2;
                //将当前帧加入frameSeq
                this.frameSeq[frameIndex] = res;
                if (frameIndex === this.curFrameIndex) {
                    this.updateScene(res);
                    this.controllerWidget.changeActor(this.curScene.actor);
                }
                console.log('获取到第', frameIndex, '帧，', this.frameStateArray, this.frameSeq, this.fetchFrameQueue);
            })
            .catch(err => {
                console.log("Error fetchModel: ", err);
            });
    }

    onSliderChange = (value) => {
        //console.log('onChange: ', value);
    }

    onSliderAfterChange = (value) => {
        console.log('onAfterChange: ', value);
        this.curFrameIndex = value;
        switch (this.frameStateArray[value]) {
            case 0:
                //未获取
                console.log("-------", this.fetchFrameQueue);
                //考虑到value在数组中的位置，前方数组可能比后面大，
                //执行过多的push会导致效率太低，考虑将数组变为队列应该可以改善效率
                const pos = this.fetchFrameQueue.indexOf(value);
                const frontArray = this.fetchFrameQueue.splice(0, pos);
                for (const item of frontArray) {
                    this.fetchFrameQueue.push(item);
                }
                console.log("-------", this.fetchFrameQueue);
                break;
            case 1:
                //获取中,不管！
                break;
            case 2:
                //目前假设以获取
                this.updateScene(this.frameSeq[value]);
                this.controllerWidget.changeActor(this.curScene.actor);
                break;
            default:
                break;
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
                        <Tree style={{ overflowX: 'auto', width: '200px' }}>
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
                            <Slider defaultValue={0} max={this.frameSum - 1}
                                onChange={this.onSliderChange} onAfterChange={this.onSliderAfterChange}></Slider>
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
