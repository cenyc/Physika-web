import React from 'react';
import { Tree, Button, Slider, Divider, Descriptions, Collapse, Row, Col, InputNumber } from 'antd';
const { TreeNode } = Tree;
const { Panel } = Collapse;
//antd样式
import 'antd/dist/antd.css';
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkVolumeController from '../Widget/VolumeController'
import vtkFPSMonitor from '../Widget/FPSMonitor'

import { physikaLoadConfig } from '../../IO/LoadConfig'
import { physikaUploadConfig } from '../../IO/UploadConfig'
import { PhysikaTreeNodeAttrModal } from '../TreeNodeAttrModal'
import { physikaInitVti } from '../../IO/InitVti'
import { getOrientationMarkerWidget } from '../Widget/OrientationMarkerWidget'
import { parseSimulationResult, checkUploadConfig } from '../../Common'

import WebworkerPromise from 'webworker-promise';
import WSWorker from '../../Worker/ws.worker';

import db from '../../db';

const simType = 4;

//一些想法：
//一次是否可以获取多帧？获取到zip有几个文件后再进行下一次获取？目前按照一个一个传
//如何更好地处理重复load？
class SPH extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [],
            treeNodeAttr: {},
            treeNodeText: "",
            treeNodeKey: -1,

            //结果展示信息
            description: [],
            //当前帧索引
            curFrameIndex: 0,
            //已获取帧数
            maxFrameIndex: 0,

            isTreeNodeAttrModalShow: false,
            uploadDisabled: true,
            isSliderShow: false,
            //控制播放动画按钮
            isPlay: false,
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
        //下一个要获取的帧的索引
        this.nextFetchFrameIndex = 0;
        //总帧数
        this.frameSum = 0;
        //curScene=[{source, mapper, actor},{source, mapper, actor}...]
        this.curScene = [];
        //frameStateArray保存每一帧仿真模型的当前状态：0（已获取，未存入indexedDB）、1（在indexedDB中）
        this.frameStateArray = [];
        //记录本次upload的时间
        this.uploadDate = null;
        //worker创建及WebSocket初始化
        this.wsWorker = null;

    }

    componentWillUnmount() {
        console.log('子组件将卸载');
        let renderWindowDOM = document.getElementById("geoViewer");
        renderWindowDOM.innerHTML = ``;
        //关闭WebSocket
        if (this.wsWorker) {
            this.wsWorker.postMessage({ close: true });
            this.wsWorker.terminate();
        }
        db.table('model').where('[uploadDate+frameIndex]').between(
            [0, 0], [Date.now(), Number.MAX_SAFE_INTEGER]
        ).delete()
            .then(() => { console.log('删除旧数据成功!') })
            .catch(err => { console.log('删除旧数据出错! ' + err) });
        //是否需要？
        if (this.FPSWidget) {
            this.FPSWidget.delete();
        }
    }

    clean = () => {
        Object.keys(this.curScene).forEach(key => {
            this.renderer.removeActor(this.curScene[key].actor);
        });
        let geoViewer = document.getElementById("geoViewer");
        if (document.getElementById("volumeController")) {
            geoViewer.removeChild(document.getElementById("volumeController"));
        }
        this.renderer.resetCamera();
        this.renderWindow.render();

        this.setState({
            curFrameIndex: 0,
            maxFrameIndex: 0,
            description: [],
            isSliderShow: false,
            isPlay: false,
        });
        this.nextFetchFrameIndex = 0;
        this.frameSum = 0;
        this.curScene = [];
        this.frameStateArray = [];
    }

    load = () => {
        if (this.wsWorker) {
            this.wsWorker.terminate();
            console.log("wsworker", this.wsWorker);
        }
        this.clean();
        physikaLoadConfig(simType)
            .then(res => {
                console.log("成功获取初始化配置");
                this.setState({
                    data: res,
                    uploadDisabled: false
                });
            })
            .catch(err => {
                console.log("Error loading: ", err);
            })
    }

    //递归渲染每个树节点（这里必须用map遍历！因为需要返回数组）
    renderTreeNodes = (data) => data.map((item, index) => {
        item.title = (
            <div>
                {
                    item._text
                        ? <Button type="text" size="small" onClick={() => this.showTreeNodeAttrModal(item)}>{item._attributes.name}</Button>
                        : <span className="ant-rate-text">{item._attributes.name}</span>
                }
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
        Object.keys(this.curScene).forEach(key => {
            this.renderer.removeActor(this.curScene[key].actor);
        });
        this.curScene = newScene;
        console.log(this.curScene);
        //添加新场景actor
        Object.keys(this.curScene).forEach(key => {
            this.renderer.addActor(this.curScene[key].actor);
        });
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
        this.controllerWidget.setupContent(this.renderWindow, this.curScene[0].actor, true);
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

    //现在upload不更新data！
    upload = () => {
        if (!checkUploadConfig(this.state.data)) {
            return;
        }
        if (this.wsWorker) {
            this.wsWorker.terminate();
            console.log("wsworker", this.wsWorker);
        }
        this.wsWorker = new WebworkerPromise(new WSWorker());
        this.wsWorker.postMessage({ init: true });
        this.clean();
        //存储提交日期用于区分新旧数据，并删除旧数据
        //this.uploadDate = Date.now();
        //测试就将uploadDate调为0；
        this.uploadDate = 0;
        this.setState({
            uploadDisabled: true,
        }, () => {
            //设置后端存储使用的额外信息
            const extraInfo = {
                userID: window.localStorage.userID,
                uploadDate: this.uploadDate,
                simType: simType,
            }

            //开始预取缓存？
            setTimeout(this.startPrefetch, 0);

            //第一个参数data，第二个参数仿真类型
            physikaUploadConfig(this.state.data, extraInfo)
                .then(res => {
                    console.log("成功上传配置并获取到仿真结果配置");
                    const resultInfo = parseSimulationResult(res);
                    this.frameSum = resultInfo.frameSum;
                    this.setState({
                        description: resultInfo.description,
                        uploadDisabled: false
                    });
                })
                .catch(err => {
                    console.log("Error uploading: ", err);
                })
        });
    }

    startPrefetch = () => {
        this.wsWorker.postMessage({
            data: {
                userID: window.localStorage.userID,
                uploadDate: this.uploadDate,
                usePrefetch: true,
                simType: simType,
                frameIndex: 0
            }
        })
            .then(res => {
                if (res.byteLength === 0) {
                    throw ("Prefetch timed out!");
                }
                else {
                    this.fetchModel(++this.nextFetchFrameIndex);
                    this.frameStateArray[0] = 0;
                    console.log('获取到第', 0, '帧，', this.frameStateArray);
                    //存入indexedDB
                    //注意：先执行完下一个then中的updateScene等操作才会执行写数据（writeModel中的异步操作放在当前微任务队列最后）
                    this.writeModel(0, res);
                    //注意后缀！
                    return physikaInitVti(res, 'zip');
                }
            })
            .then(res => {
                this.updateScene([res]);
                //初始化体素显示控制控件
                this.initVolumeController();
                //显示方向标记部件
                this.orientationMarkerWidget.setEnabled(true);
                //初始化fps控件
                this.initFPS();
                this.setState({
                    isSliderShow: true,
                    maxFrameIndex: this.nextFetchFrameIndex - 1
                });
            })
            .catch(err => {
                console.log("Error startPrefetch: ", err);
            })
    }

    fetchModel = (frameIndex) => {
        this.wsWorker.postMessage({
            data: {
                userID: window.localStorage.userID,
                uploadDate: this.uploadDate,
                usePrefetch: true,
                simType: simType,
                frameIndex: frameIndex
            }
        })
            .then(res => {
                //添加判断
                if (res.byteLength === 0) {
                    //为什么不能===严格相等？
                    if (this.nextFetchFrameIndex == this.frameSum) {
                        console.log("Prefetch finish.")
                    }
                    else {
                        throw ("Prefetch timed out!");
                    }
                }
                else {
                    this.fetchModel(++this.nextFetchFrameIndex);
                    //设定当前帧状态为已获取但未存入indexedDB
                    this.frameStateArray[frameIndex] = 0;
                    console.log('获取到第', frameIndex, '帧，', this.frameStateArray);
                    //将模型写入indexedDB
                    this.writeModel(frameIndex, res);
                    this.setState({
                        maxFrameIndex: this.nextFetchFrameIndex - 1
                    });
                }
            })
            .catch(err => {
                console.log("Error fetchModel: ", err);
            });
    }

    writeModel = (frameIndex, arrayBuffer) => {
        db.table('model').add({
            userID: window.localStorage.userID, uploadDate: this.uploadDate, frameIndex: frameIndex, arrayBuffer: arrayBuffer
        }).then(id => {
            this.frameStateArray[frameIndex] = 1;
            console.log(id, '成功存入第' + frameIndex + '帧！', this.frameStateArray);
        }).catch(err => {
            console.log(err);
        })
    }

    readModel = (uploadDate, frameIndex) => {
        db.table('model').where('[uploadDate+frameIndex]').equals([uploadDate, frameIndex]).toArray()
            .then(model => {
                return physikaInitVti(model[0].arrayBuffer, 'zip');
            })
            .then(res => {
                if (uploadDate === this.uploadDate && frameIndex === this.state.curFrameIndex) {
                    this.updateScene([res]);
                    this.controllerWidget.changeActor(this.curScene[0].actor);
                }
                else {
                    //快速改变已获取帧数可以看到如下显示
                    console.log('Old model ' + frameIndex + ' is no longer uesd!');
                }
            })
            .catch(err => {
                console.log('Error readModel: ', err);
            });
    }

    changeInput = (value) => {
        console.log('changeInput: ', value);
        this.setState({ curFrameIndex: value }, () => {
            switch (this.frameStateArray[value]) {
                case 0:
                    setTimeout(this.changeInput(value), 1000);
                    break;
                case 1:
                    this.readModel(this.uploadDate, value);
                    break;
                default:
                    break;
            }
        });
    }

    playClick = () => {
        if (this.state.curFrameIndex < this.state.maxFrameIndex) {
            if (!this.state.isPlay) {
                this.setState({
                    isPlay: true
                }, () => {
                    const playNextFrame = () => {
                        db.table('model').where('[uploadDate+frameIndex]').equals([this.uploadDate, this.state.curFrameIndex + 1]).toArray()
                            .then(model => {
                                return physikaInitVti(model[0].arrayBuffer, 'zip');
                            })
                            .then(res => {
                                this.updateScene([res]);
                                this.controllerWidget.changeActor(this.curScene[0].actor);
                                if (this.state.curFrameIndex == this.state.maxFrameIndex - 1 || !this.state.isPlay) {
                                    this.setState({
                                        curFrameIndex: ++this.state.curFrameIndex,
                                        isPlay: false
                                    });
                                }
                                else {
                                    this.setState({
                                        curFrameIndex: ++this.state.curFrameIndex
                                    }, () => {
                                        setTimeout(playNextFrame, 500);
                                    })
                                }
                            })
                            .catch(err => {
                                console.log('Error readModel: ', err);
                            });
                    }
                    playNextFrame();
                });
            }
            else {
                this.setState({ isPlay: false });
            }
        }
    }

    renderDescriptions = () => this.state.description.map((item, index) => {
        return <Descriptions.Item label={item.name} key={index}>{item.content}</Descriptions.Item>
    })

    render() {
        console.log("tree:", this.state.data);
        return (
            <div>
                <Divider>SPH流体仿真</Divider>
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
                    <Panel header="多帧展示控制" key="3">
                        {
                            (this.state.isSliderShow) &&
                            <div>
                                <Slider min={0} max={this.state.maxFrameIndex} value={this.state.curFrameIndex} onChange={this.changeInput} disabled={this.state.isPlay} />
                                <Row>
                                    <Col span={13} style={{ alignItems: 'center', display: 'flex' }}>
                                        <span className="ant-rate-text">当前帧序号：</span>
                                    </Col>
                                    <Col span={3}>
                                        <InputNumber min={0} max={this.state.maxFrameIndex} value={this.state.curFrameIndex} onChange={this.changeInput} disabled={this.state.isPlay} />
                                    </Col>
                                </Row>
                                <br />
                                <Row>
                                    <Col span={13} style={{ alignItems: 'center', display: 'flex' }}>
                                        <span className="ant-rate-text">逐帧播放：</span>
                                    </Col>
                                    <Col span={3}>
                                        <Button onClick={this.playClick}>{this.state.isPlay ? 'Stop' : 'Play'}</Button>
                                    </Col>
                                </Row>
                            </div>
                        }
                    </Panel>
                    {/* forceRender为true，即折叠面板未打开时也渲染其中组件；若为false，则未打开面板前无法获得其中组件 */}
                    <Panel header="绘制信息" key="4" forceRender="true">
                        <div id="fps"></div>
                    </Panel>
                </Collapse>
                <div>
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
    SPH as MySPH
}