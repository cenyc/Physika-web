import 'bootstrap';
import React from 'react';
import { Tree, Button } from 'antd';
const { TreeNode } = Tree;
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
//坐标轴
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
//旋转控制控件
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
//antd样式
import 'antd/dist/antd.css';
//obj读取器
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
//actor
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
//mapper
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

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
        physikaLoadConfig(0).then(value => {
            this.setState({
                data: value
            });
        }).then(() => {
            //setState异步操作，需要接then保证正确加载obj
            this.loadObject();
        });
    }

    //加载obj，是否这样用待定！
    loadObject = () => {
        this.objectList = [];
        this.state.data[0].children.map((i, index) => {
            let obj = {};
            if (i.tag == 'Node') {
                i.children.map((j, index) => {
                    if (j._attributes.name == '路径') {
                        obj.url = j._text;
                    }
                });
                this.objectList.push(obj);
            }
        });
        console.log("1111111111");
        console.log(this.objectList);
        const reader = vtkOBJReader.newInstance();
        this.objectList.map((item, index) => {
            reader.setUrl(item.url)
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
                    }
                    this.renderer.resetCamera();
                    this.renderWindow.render();
                });
        });
    }

    renderTreeNodes = (data) => data.map((item, index) => {
        item.title = (
            <div>
                <Button type="text" onClick={() => this.showTreeNodeAttrModal(item)}>{item._attributes.name}</Button>
                {
                    (item.tag === 'Node') &&
                    <Button type="text">pick</Button>
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
            treeNodeKey: item.key
        });
        if (item._text) {
            this.setState({ treeNodeText: item._text });
        }
    }

    hideTreeNodeAttrModal = () => {
        this.setState({
            isTreeNodeAttrModalShow: false
        });
    }

    //接收TreeNodeAttrModal返回的结点数据并更新树
    changeData = (obj) => {
        let data = this.state.data;
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
        findTreeNodeKey(data);
        this.setState({
            data: data
        })
        this.hideTreeNodeAttrModal();
    }

    //上传xml配置文件
    uploadConfig = () => {
        physikaUploadConfig(this.state.data);
    }

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
