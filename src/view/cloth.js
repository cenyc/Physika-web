import 'bootstrap';
import React, { useEffect } from 'react';
import { Tree, Button, Modal, Form, InputNumber, Input, Row, Col } from 'antd';
const { TreeNode } = Tree;
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

//坐标轴
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
//旋转控制控件
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import 'antd/dist/antd.css';

import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

//loadConfig
import { physikaLoadConfig } from '../IO/LoadConfig'
//uploadConfig
import { physikaUploadConfig } from '../IO/UploadConfig'

//深拷贝
function deepCopy(obj) {
    var newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
        return;
    }
    for (var i in obj) {
        //title成员中含有的dom标签在深拷贝时有很多问题！！！！
        if (i !== 'title') {
            newobj[i] = (typeof obj[i] === 'object' && obj[i] !== null) ? deepCopy(obj[i]) : obj[i];
        }
    }
    return newobj;
}

//判断输入对象是否为Object
const isObject = (object) => {
    return Object.prototype.toString.call(object) === '[object Object]';
}

//TreeNodeAttrModal组件中Form的样式
const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
};

//使用Hook实现的树结点属性显示Modal
const TreeNodeAttrModal = ({ treeNodeAttr, treeNodeText, visible, hideModal, changeData }) => {
    const [form] = Form.useForm();
    const formInitialValues = {};

    useEffect(() => {
        if (form && visible) {
            setFormInitialValues();
            form.resetFields();
        }
    }, [visible]);

    //设置Form的初始化值
    function setFormInitialValues() {
        formInitialValues.name = treeNodeAttr.name;
        formInitialValues.class = treeNodeAttr.class;
        //当结点不含有type时，formInitialValues.type=undefined！
        formInitialValues.type = treeNodeAttr.type;
        if (!!treeNodeText) {
            switch (treeNodeAttr.class) {
                case 'Real':
                    formInitialValues.real = treeNodeText;
                    break;
                case 'vector3f':
                    let vector3f = treeNodeText.split(' ');
                    formInitialValues.realX = vector3f[0];
                    formInitialValues.realY = vector3f[1];
                    formInitialValues.realZ = vector3f[2];
            }
        }
    }

    //返回树结点修改后的数据
    function returnTreeNodeData(value) {
        let obj = {
            _attributes: treeNodeAttr,
            _text: ''
        };
        Object.keys(obj._attributes).map((item) => {
            //这里不能点引用item，会出大问题！（会将item作为一个新成员加入到obj._attributes中）
            obj._attributes[item] = value[item];
        });
        if (value.hasOwnProperty('real')) {
            obj._text = value.real;
        }
        else if (value.hasOwnProperty('realX')) {
            obj._text = value.realX + ' ' + value.realY + ' ' + value.realZ;
        }
        else {
            console.log("There is no _text in this treeNode.");
        }
        changeData(deepCopy(obj));
    }

    return (
        <Modal
            title={"结点属性"}
            visible={visible}
            onOk={() => {
                form.validateFields()
                    .then(value => {
                        console.log(value);
                        returnTreeNodeData(value);
                    })
                    .catch(info => {

                        console.log('Validate Failed:', info);
                    });
            }}
            onCancel={hideModal}
        >
            <Form
                {...formItemLayout}
                form={form}
                name="nodeAttrModal"
                initialValues={formInitialValues}
            >
                <Form.Item name="name" label="Name" >
                    <Input disabled={true} />
                </Form.Item>
                <Form.Item name="class" label="Class" >
                    <Input disabled={true} />
                </Form.Item>
                {
                    (!!treeNodeAttr.type) &&
                    <Form.Item name="type" label="Type" >
                        <Input disabled={true} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'Real') &&
                    <Form.Item name="real" label="Value"
                        rules={[{ required: true, message: 'Value cannot be empty!' }]}
                    >
                        <InputNumber min={0} max={10000} step={0.1} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'vector3f') &&
                    <Form.Item label="Value">
                        <Row>
                            <Col span={8}>
                                <Form.Item name="realX" label="X"
                                    rules={[{ required: true, message: 'X cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="realY" label="Y"
                                    rules={[{ required: true, message: 'Y cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="realZ" label="Z"
                                    rules={[{ required: true, message: 'Z cannot be empty!' }]}
                                >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form.Item>
                }
            </Form>
        </Modal>
    );
}
/*
//是否需要给treeNodeAttr设置默认值?
treeNodeAttr: {
    name: "",
    class: "",
    type: ""
},
*/
class ClothSimulation2 extends React.Component {
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
                        <TreeNodeAttrModal
                            treeNodeAttr={this.state.treeNodeAttr}
                            treeNodeText={this.state.treeNodeText}
                            visible={this.state.isTreeNodeAttrModalShow}
                            hideModal={() => this.hideTreeNodeAttrModal()}
                            changeData={(obj) => this.changeData(obj)}
                        ></TreeNodeAttrModal>
                    </div>
                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }
