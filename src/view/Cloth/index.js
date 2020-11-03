import 'bootstrap';
import React from 'react';
import { Tree, Button } from 'antd';
import { BiShow, BiHide, BiPointer, BiMinus } from 'react-icons/bi'
const { TreeNode } = Tree;
//antd样式
import 'antd/dist/antd.css';
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
//坐标轴
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
//旋转控制控件
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
//obj读取器
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
//actor
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
//mapper
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
//面片拾取
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';
//loadConfig
import { physikaLoadConfig } from '../../IO/LoadConfig'
//uploadConfig
import { physikaUploadConfig } from '../../IO/UploadConfig'
//TreeNodeAttrModal(react模块名字首字母必须大写！)
import { PhysikaTreeNodeAttrModal } from '../TreeNodeAttrModal'

/*
//是否需要给treeNodeAttr设置默认值?
treeNodeAttr: {
    name: "",
    class: "",
    type: ""
},
*/

//屏蔽全局浏览器右键菜单
document.oncontextmenu = function () {
    return false;
}

//添加拾取的面片对应的树节点
function addPickedCell(cellId, node) {
    //添加pick对象
    let hasPickObj = false;
    if (!node.hasOwnProperty('children')) {
        node.children = [];
    }
    let pickObjIndex = node.children.length;
    node.children.map((item, index) => {
        if (item.tag == 'Pick') {
            hasPickObj = true;
            pickObjIndex = index;
        }
    });
    if (!hasPickObj) {
        let pickOBj = {
            children: [],
            key: `${node.key}-${node.children.length}`,
            tag: 'Pick',
            _attributes: {
                class: 'Pick',
                name: '面片拾取'
            }
        };
        node.children.push(pickOBj);
    }
    //添加面对象
    const pickObj = node.children[pickObjIndex];
    let hasCellObj = false;
    let cellObjIndex = pickObj.children.length;
    pickObj.children.map((item, index) => {
        if (item._attributes.name == `cell-${cellId}`) {
            hasCellObj = true;
            cellObjIndex = index;
        }
    });
    if (!hasCellObj) {
        let cellObj = {
            children: [],
            key: `${pickObj.key}-${pickObj.children.length}`,
            tag: 'Cell',
            _attributes: {
                class: 'Cell',
                name: `cell-${cellId}`
            }
        };
        pickObj.children.push(cellObj);
    }
    const cellObj = pickObj.children[cellObjIndex];
    if (cellObj.children.length === 0) {
        let fieldeObj = {
            key: `${cellObj.key}-0`,
            tag: 'Field',
            _text: '0.0 0.0 0.0',
            _attributes: {
                class: 'Vector3f',
                name: '施加力'
            }
        };
        cellObj.children.push(fieldeObj);
    }
    return cellObj.children[0];
}

class ClothSimulation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [],
            isTreeNodeAttrModalShow: false,
            treeNodeAttr: {},
            treeNodeText: "",
            treeNodeKey: -1

        };
    }

    componentDidMount() {
        //---------初始化渲染窗口
        this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            background: [0, 0, 0],
            rootContainer: geoViewer,
            containerStyle: { height: '100%', width: '100%', position: 'absolute' }
        });
        this.renderer = this.fullScreenRenderer.getRenderer();
        this.renderWindow = this.fullScreenRenderer.getRenderWindow();
        //明确一个前提：
        //如果当前帧场景中包含不止一个obj，则这些obj应写在同一个文件中
        //curScene中保存了当前帧中所包含的obj
        //curScene={name:{polydata, mapper, actor},...}
        this.curScene = {};

        //------------------------
        /*
        //添加坐标轴：X：红，Y：黄，Z: 绿
        this.axesActor = vtkAxesActor.newInstance();
        this.renderer.addActor(this.axesActor);
        */

        //--------添加旋转控制控件
        this.axesActor = vtkAxesActor.newInstance();
        const orientationMarkerWidget = vtkOrientationMarkerWidget.newInstance({
            actor: this.axesActor,
            interactor: this.renderWindow.getInteractor(),
        });
        orientationMarkerWidget.setEnabled(true);
        orientationMarkerWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
        );
        //控制控件大小
        orientationMarkerWidget.setViewportSize(0.3);
        orientationMarkerWidget.setMinPixelSize(100);
        orientationMarkerWidget.setMaxPixelSize(300);
        //-----------------------

        this.renderer.resetCamera();
        this.renderWindow.render();
    }
    /*
        componentWillUnmount() {
            console.log('子组件将卸载');
        }
    */

    //导入配置文件并传回树结构支持的data数组
    loadConfig = () => {
        //需要传入仿真类型
        physikaLoadConfig('cloth').then(value => {
            //加载对象是异步的，为了能够正确处理changeVisible事件，
            //在this.state.date更新触发render之前必须完成对this.curScene对象的赋值
            //所以这里故意将传回的value值延迟到this.curScene对象赋值完成后再赋值给data
            this.loadObject(value).then(value => {
                this.setState({
                    data: value
                });
            });
        });
    }

    //加载obj，是否这样用待定！
    loadObject = (data) => {
        let path = '';
        data[0].children.map(item => {
            if (item.tag == 'Path') {
                path = item._text;
            }
        });
        console.log(path);
        //清空旧场景，移除旧actor
        Object.keys(this.curScene).map(key => {
            this.renderer.removeActor(this.curScene[key].actor);
        });
        this.curScene = {};
        //removeAllActors()这个方法有点问题，删完没反应；讨论区说用removeAllViewProps()
        //this.renderer.removeAllActors();
        //this.renderer.removeAllViewProps();
        //splitMode模式会将obj中的多个对象拆分存储，'usemtl'能否换成别的目前不清楚。。。
        const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
        return new Promise((resolve, reject) => {
            reader.setUrl(path)
                .then(() => {
                    const size = reader.getNumberOfOutputPorts();
                    for (let i = 0; i < size; i++) {
                        const polydata = reader.getOutputData(i);
                        const name = polydata.get('name').name;
                        const mapper = vtkMapper.newInstance();
                        const actor = vtkActor.newInstance();

                        actor.setMapper(mapper);
                        mapper.setInputData(polydata);
                        this.renderer.addActor(actor);

                        this.curScene[name] = { polydata, mapper, actor };
                        //curScene.push({name,polydata,mapper,actor});
                    }
                    console.log(this.curScene);
                    //在this.curScene对象赋值完成后再发送data数据
                    resolve(data);
                    //重置camera位置为默认值（小控件刷新有问题）
                    this.renderer.getActiveCamera().setPosition(0, 0, 1);
                    this.renderer.getActiveCamera().setViewUp(0, 1, 0);
                    this.renderer.getActiveCamera().setFocalPoint(0, 0, 0);

                    this.renderer.resetCamera();
                    this.renderWindow.render();
                })
                .catch((res) => {
                    console.log("获取模型对象失败:", res);
                });
        });
    }

    //改变actor的可见性
    changeVisible = (item) => {
        const actor = this.curScene[item._attributes.name].actor;
        const visibility = actor.getVisibility();
        actor.setVisibility(!visibility);
        //因为actor可见性的变化不会触发组件的render，
        //所以这里强制触发render，使得BiShow控件变为BiHide控件
        this.forceUpdate();
        this.renderWindow.render();
    }

    //递归渲染每个树节点
    renderTreeNodes = (data) => data.map((item, index) => {
        item.title = (
            <div>
                {
                    (item.tag === 'Node') &&
                    (this.curScene[item._attributes.name].actor.getVisibility()
                        ? <BiShow type="regular" onClick={() => this.changeVisible(item)}></BiShow>
                        : <BiHide type="regular" onClick={() => this.changeVisible(item)}></BiHide>)
                }
                <Button type="text" size="small" onClick={() => this.showTreeNodeAttrModal(item)}>{item._attributes.name}</Button>
                {
                    (item.tag === 'Node') &&
                    <BiPointer type="regular" onClick={() => this.cellPick(item)}></BiPointer>
                }
                {
                    (item.tag === 'Cell') &&
                    <BiMinus type="regular" onClick={() => this.deleteNode(item.key)}></BiMinus>
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
                if (!!obj._text) {
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

    //上传xml配置文件并获取模拟结果的xml
    uploadConfig = () => {
        if (this.state.data.length == 0) {
            alert("还未加载配置文件！");
        }
        else {
            //第一个参数data，第二个参数仿真类型
            physikaUploadConfig(this.state.data, 'cloth').then(value => {
                //加载对象是异步的，为了能够正确处理changeVisible事件，
                //在this.state.date更新触发render之前必须完成对this.curScene对象的赋值
                //所以这里故意将传回的value值延迟到this.curScene对象赋值完成后再赋值给data
                this.loadObject(value).then(value => {
                    this.setState({
                        data: value
                    });
                });
            });
        }
    }

    //---------2020.10.15 面片选取----------
    cellPick = (item) => {
        console.log("开始选取");

        const picker = vtkCellPicker.newInstance();
        picker.setPickFromList(true);
        picker.setTolerance(0);
        picker.initializePickList();
        picker.addPickList(this.curScene[item._attributes.name].actor);
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
                //添加选定节点
                this.showTreeNodeAttrModal(addPickedCell(pickedCellId, item));
            }
            //取消鼠标右键点击的订阅（2020.10.17）
            subscription.unsubscribe();
        });
    }
    //------------------------------------

    //删除指定树节点（其父节点保留）
    deleteNode = (treeNodeKey) => {
        let eachKey = treeNodeKey.split('-');
        let count = 0;
        const findTreeNodeKey = (node) => {
            //找到treeNodeKey所在的children数组
            if (count === eachKey.length - 1) {
                //删除对应节点
                node.splice(eachKey[count], 1);
                //父节点key值变化，所以其所有子结点的key值也需要更新！
                const changeNodeKey = (node_, fatherNodeKey) =>
                    node_.map((item, index) => {
                        item.key = fatherNodeKey + index;
                        if (item.hasOwnProperty('children')) {
                            changeNodeKey(item.children, item.key + '-');
                        }
                    });
                changeNodeKey(node, treeNodeKey.slice(0, treeNodeKey.length - 1));
                return;
            }
            findTreeNodeKey(node[eachKey[count++]].children);
        };
        findTreeNodeKey(this.state.data);
        this.forceUpdate();
    }
    //------------------------------------

    render() {
        console.log("tree:", this.state.data);
        return (
            <div className="w-100">
                <div className="card border rounded-0"><span className="text-center m-1">布料仿真</span>
                    <hr className="m-0" />
                    <div className="card-body pt-2">
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.loadConfig}><span className="glyphicon glyphicon-plus">加载场景</span></button>
                        <div className="pt-2">
                            <Tree >
                                {this.renderTreeNodes(this.state.data)}
                            </Tree>
                        </div>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.uploadConfig}><span className="glyphicon glyphicon-plus">上传</span></button>

                    </div>
                    <div >
                        <PhysikaTreeNodeAttrModal
                            treeNodeAttr={this.state.treeNodeAttr}
                            treeNodeText={this.state.treeNodeText}
                            visible={this.state.isTreeNodeAttrModalShow}
                            hideModal={() => this.hideTreeNodeAttrModal()}
                            changeData={(obj) => this.changeData(obj)}
                        ></PhysikaTreeNodeAttrModal>
                    </div>
                </div>
            </div>
        );
    }
}

export {
    ClothSimulation as PhysikaClothSimulation
};
