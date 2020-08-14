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

function deepCopy(obj) {
    var newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
        return;
    }
    for (var i in obj) {
        newobj[i] = typeof obj[i] === 'object' ? deepCopy(obj[i]) : obj[i];
    }
    return newobj;
}

const isObject = (object) => {
    return Object.prototype.toString.call(object) === '[object Object]';
}

const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
};

const TreeNodeAttrModal = ({ treeNodeAttr, treeNodeText, visible, hideModal }) => {
    const [form] = Form.useForm();
    const formInitialValues = {};

    useEffect(() => {
        if (form && visible) {
            setFormInitialValues();
            form.resetFields();
        }
    }, [visible]);

    function setFormInitialValues() {
        formInitialValues.name = treeNodeAttr.name;
        formInitialValues.class = treeNodeAttr.class;
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

    return (
        <Modal
            title={"结点属性"}
            visible={visible}
            onOk={() => {
                form.validateFields()
                    .then(value => {
                        console.log(value);
                        hideModal();
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
                    <Form.Item name="real" label="Value" >
                        <InputNumber min={0} max={10000} step={0.1} />
                    </Form.Item>
                }
                {
                    (treeNodeAttr.class === 'vector3f') &&
                    <Form.Item label="Value">
                        <Row>
                            <Col span={8}>
                                <Form.Item name="realX" label="X" >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="realY" label="Y" >
                                    <InputNumber min={-10} max={10} step={0.1} />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name="realZ" label="Z" >
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

class ClothSimulation2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [],
            isTreeNodeAttrModalShow: false,
            treeNodeAttr: {
                name: "",
                class: "",
                type: ""
            },
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

    fetchConfig = () => {
        let reqInitConfig = {
            simType: 0,
            log: "Request cloth simulation initialization file..."
        };

        //-------从服务器获取初始配置
        fetch('/loadConfig', {
            method: 'POST',
            body: JSON.stringify(reqInitConfig),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.text())
            .catch(error => console.error('Error:', error))
            .then(res => {
                console.log('Success:');
                let initConfig = JSON.parse(res);
                console.log(initConfig);

                this.buildDataStructure(deepCopy(initConfig));
            });
        //--------------------------
    }

    //构建符合ant Tree数据结构第一步（通过递归将每层对象的成员组织成数组形式）
    buildNode(node) {
        let childNode = [];
        Object.keys(node).map((nodeKey, index) => {
            if (nodeKey === '_attributes') {
                //如果存在'_text'属性，则为叶子结点
                if (Object.keys(node).includes('_text')) {
                    childNode.push(
                        {
                            _attributes: node._attributes,
                            _text: node._text
                        }
                    );
                }
                else {
                    childNode.push(
                        {
                            _attributes: node._attributes
                        }
                    );
                }
            }
            else if (nodeKey === '_text') {
                //空过
                //console.log("_text:", node[nodeKey]);
            }
            else {
                if (Array.isArray(node[nodeKey])) {
                    node[nodeKey].map((obj, index) => {
                        childNode.push(this.buildNode(obj));
                    })
                }
                else if (isObject(node[nodeKey])) {
                    childNode.push(this.buildNode(node[nodeKey]));
                }
            }
        });
        return childNode;
    }

    //构建符合ant Tree数据结构data
    buildDataStructure = (config) => {
        //注意传入buildNode函数中的对象为initConfig.Node!
        let childNode = this.buildNode(config.Node);
        console.log(childNode);

        //每一层都含有一个包含当前结点属性的对象，
        //通过递归将每一层除了当前结点属性的对象以外的其他成员全部作为当前结点的子结点，
        //并将其他成员插入到当前结点属性的对象中的children数组中。
        const traverseNode = (node, key) => {
            //如果node长度为1，则该node只包含一个叶子结点（即当前结点属性的Object）
            if (node.length === 1) {
                node[0].key = key;
                return node[0];
            }
            else {
                //fatherIndex用于存储当前层的包含当前结点属性的对象的索引
                //childNode用于存储当前层的结点
                let fatherIndex;
                let childNode = {};
                node.map((item, index) => {
                    if (isObject(item)) {
                        fatherIndex = index;
                        childNode = item;
                        childNode.key = key;
                        childNode.children = [];
                    }
                });
                //找到包含当前结点属性的对象后，从当前node删除它，然后再遍历其他子结点成员
                node.splice(fatherIndex, 1);
                node.map((item, index) => {
                    childNode.children.push(traverseNode(item, key + index));
                });
                return childNode;
            }

        };
        let data = [];
        data.push(traverseNode(deepCopy(childNode), '1'));
        console.log(data);
        this.setState({
            data: data
        });
    }

    renderTreeNodes = (data) => data.map((item, index) => {
        item.title = (
            <div>
                <Button type="text" onClick={() => this.showTreeNodeAttrModal(item)}>{item._attributes.name}</Button>
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
    })

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
    changeData = () => {

    }

    //上传数据到服务器
    uploadConfigPara = () => {
        console.log("开始上传");
        let config = {
            _declaration: {
                _attributes: {
                    version: "1.0",
                    encoding: "utf-8"
                }
            },
            Node: {
                _attributes: {
                    class: "",
                    name: ""
                },
                Field: [],
                Node: []
            }
        }


        fetch('/loadconfig', {
            method: 'POST',
            body: JSON.stringify(config),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.text())
            .catch(error => console.error('Error:', error))
            .then(res => {
                console.log('Success:');
                let result = JSON.parse(res);
                console.log(result);

            });
        //.then(res => res.json())
    }

    render() {
        console.log("tree:", this.state.data);
        return (
            <div className="w-100">
                <div className="card border rounded-0"><span className="text-center m-1">布料仿真</span>
                    <hr className="m-0" />
                    <div className="card-body pt-2">
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.fetchConfig}><span className="glyphicon glyphicon-plus">加载场景</span></button>
                        <div className="pt-2">
                            <Tree >
                                {this.renderTreeNodes(this.state.data)}
                            </Tree>
                        </div>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.uploadConfigPara}><span className="glyphicon glyphicon-plus">上传</span></button>

                    </div>
                    <div >
                        <TreeNodeAttrModal
                            treeNodeAttr={this.state.treeNodeAttr}
                            treeNodeText={this.state.treeNodeText}
                            visible={this.state.isTreeNodeAttrModalShow}
                            hideModal={() => this.hideTreeNodeAttrModal()}
                        ></TreeNodeAttrModal>
                    </div>
                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }
/*
<TreeNodeAttrModal
    key={this.state.treeNodeKey}
    treeNodeAttr={this.state.treeNodeAttr}
    treeNodeText={this.state.treeNodeText}
    visible={this.state.isTreeNodeAttrModalShow}
    hideModal={() => this.hideTreeNodeAttrModal()}
></TreeNodeAttrModal>
*/