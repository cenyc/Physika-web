import { Modal, Button, Form, Col, Row } from 'react-bootstrap';
import 'bootstrap';
import React from 'react';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
//vtkActor用于表示渲染场景中的实体
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
//抽象类，用于指定数据和图形基元之间的接口
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
//坐标轴
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
//旋转控制控件
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';

//面片选取
import vtkCellPicker from 'vtk.js/Sources/Rendering/Core/CellPicker';

import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';

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

const Field = [
    { _attributes: { name: "mass", class: "Real" }, _text: "1.0" },
    { _attributes: { name: "dt", class: "Real" }, _text: "0.1" },
    { _attributes: { name: "gravity", class: "vector3f" }, _text: "0.0 -9.8 0.0" }
]

function fieldConfig(index) {
    /*
    //index对应不同模块中应含有的field属性
    */
    let res = [];
    switch (index) {
        case 0:
            res.push(Field[1]);
            res.push(Field[2]);
            break;
        case 1:
            res.push(Field[0]);
            break;
    }
    //为保证其他组件在更改field属性值时不影响Field中的属性值，所以需要进行深拷贝！
    return deepCopy(res);
}

//secene属性配置
class SceneConfigModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            class: "",
            Field: []
        }

        this.onModalEnter = this.onModalEnter.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.clickConfirm = this.clickConfirm.bind(this);
    }

    //每次打开时按照对应sceneConfig初始化组件
    onModalEnter() {
        console.log("enter");
        const sceneConfig = this.props.sceneConfig;
        this.setState({
            name: sceneConfig['name'],
            class: sceneConfig['class'],
            Field: sceneConfig['Field']
        }, () => {
            console.log("初始化sceneConfig：", this.state);
        })
    }

    handleChange(e) {
        const target = e.target;
        const val = target.value;
        const name = target.name;
        console.log("123", Field);

        if (name === "class") {
            switch (val) {
                case "SB":
                    this.setState({ Field: fieldConfig(0) });
                    break;
                case "X":
                    this.setState({ Field: fieldConfig(1) });
                    break;
            }
        }

        this.setState({ [name]: val }, () => {
            console.log(this.state);
        });
    }

    handleFieldChange(e) {
        const target = e.target;
        const val = target.value;
        const name = target.name;
        let tmp = this.state.Field;
        tmp.find((object, index) => {
            if (object._attributes.name === name) {
                tmp[index]._text = val;
            }
        });
        this.setState({ Field: tmp }, () => {
            console.log(this.state.Field);
        });
    }

    showField() {
        return this.state.Field.map((field, index) =>
            <div key={index}>
                <Form.Group as={Row} controlId="formHorizontalField">
                    <Form.Label column sm={2}>{field['_attributes']['name']}</Form.Label>
                    <Col sm={5}>
                        <Form.Control type="text" name={field['_attributes']['name']} value={field['_text']} onChange={this.handleFieldChange} />
                    </Col>
                </Form.Group>
            </div>
        );
    }

    //返回sceneConfig
    clickConfirm() {
        let res = this.state;
        this.props.changeSceneConfigModal(res);
        this.props.onHide();
    }

    render() {
        let hasChoosedSceneClass = (this.state.class === "choose a scene class...") ? false : true;
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} onEnter={this.onModalEnter}>
                <Modal.Header closeButton>
                    <Modal.Title>场景属性设置</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>

                        <Form.Group controlId="sceneNameInput">
                            <Form.Label>场景名字</Form.Label>
                            <Form.Control type="text" name="name" value={this.state.name} onChange={this.handleChange} />
                        </Form.Group>

                        <Form.Group controlId="selectSceneClass">
                            <Form.Label>选择场景类</Form.Label>
                            <Form.Control as="select" name="class" value={this.state.class} onChange={this.handleChange}>
                                <option disabled>choose a scene class...</option>
                                <option value="SB">固体边界</option>
                                <option value="X">未知</option>
                            </Form.Control>
                        </Form.Group>

                        {
                            hasChoosedSceneClass &&
                            <Form.Group>
                                <Form.Label>场量设置</Form.Label>
                                {this.showField()}
                            </Form.Group>
                        }

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.clickConfirm}>确认</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
//-------------

//-----NodeConfigModal---------
class NodeConfigModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            class: "",
            Field: []
        }

        this.onModalEnter = this.onModalEnter.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.clickConfirm = this.clickConfirm.bind(this);
    }

    onModalEnter() {
        console.log("enter");
        const nodeArray = this.props.nodeArray;
        const nodeIndex = this.props.nodeIndex;
        if (nodeIndex === -1) {
            this.setState({
                name: "default",
                class: "choose a node class..."
            }, () => {
                console.log("初始化node：", this.state);
            })
        }
        else {
            this.setState({
                name: nodeArray[nodeIndex]['_attributes']['name'],
                class: nodeArray[nodeIndex]['_attributes']['class'],
                Field: nodeArray[nodeIndex]['Field']
            }, () => {
                console.log("初始化node：", this.state);
            })
        }
    }

    handleChange(e) {
        const target = e.target;
        const val = target.value;
        const name = target.name;

        if (name === "class") {
            switch (val) {
                case "PEB":
                    this.setState({ Field: fieldConfig(1) });
                    break;
                case "X":
                    this.setState({ Field: fieldConfig(0) });
                    break;
            }
        }

        this.setState({ [name]: val }, () => {
            console.log(this.state);
        });
    }

    handleFieldChange(e) {
        const target = e.target;
        const val = target.value;
        const name = target.name;
        let tmp = this.state.Field;
        tmp.find((object, index) => {
            if (object._attributes.name === name) {
                tmp[index]._text = val;
            }
        });
        this.setState({ Field: tmp });
    }

    clickConfirm() {
        const nodeArray = this.props.nodeArray;
        const nodeIndex = this.props.nodeIndex;
        if (nodeIndex === -1) {
            let node = {};
            node['_attributes'] = {};
            node['_attributes']['name'] = this.state.name;
            node['_attributes']['class'] = this.state.class;
            node['Field'] = this.state.Field;
            node['Module'] = [];
            nodeArray.push(node);
        }
        else {
            nodeArray[nodeIndex]['_attributes']['name'] = this.state.name;
            nodeArray[nodeIndex]['_attributes']['class'] = this.state.class;
            nodeArray[nodeIndex]['Field'] = this.state.Field;
        }
        this.props.changeNodeConfigModal(nodeArray);
        this.props.onHide();
    }

    showField() {
        return this.state.Field.map((field, index) =>
            <div key={index}>
                <Form.Group as={Row} controlId="formHorizontalField">
                    <Form.Label column sm={2}>{field['_attributes']['name']}</Form.Label>
                    <Col sm={5}>
                        <Form.Control type="text" name={field['_attributes']['name']} value={field['_text']} onChange={this.handleFieldChange} />
                    </Col>
                </Form.Group>
            </div>
        );
    }

    render() {
        let hasChoosedNodeClass = (this.state.class === "choose a node class...") ? false : true;
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} onEnter={this.onModalEnter}>
                <Modal.Header closeButton>
                    <Modal.Title>节点属性设置</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>

                        <Form.Group>
                            <Form.Label>节点名字</Form.Label>
                            <Form.Control type="text" name="name" value={this.state.name} onChange={this.handleChange} />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>选择节点类</Form.Label>
                            <Form.Control as="select" name="class" value={this.state.class} onChange={this.handleChange}>
                                <option disabled>choose a node class...</option>
                                <option value="PEB">粒子弹性体</option>
                                <option value="X">未知</option>
                            </Form.Control>
                        </Form.Group>

                        {
                            hasChoosedNodeClass &&
                            <Form.Group>
                                <Form.Label>场量设置</Form.Label>
                                {this.showField()}
                            </Form.Group>
                        }

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.clickConfirm}>确认</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
//-------------

//-----ModuleConfigModal---------
class ModuleConfigModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            class: "",
            type: "",
            Field: []
        }

        this.onModalEnter = this.onModalEnter.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleFieldChange = this.handleFieldChange.bind(this);
        this.clickConfirm = this.clickConfirm.bind(this);
    }

    onModalEnter() {
        console.log("enter");
        const moduleArray = this.props.node['Module'];
        const moduleIndex = this.props.moduleIndex;
        if (moduleIndex === -1) {
            this.setState({
                name: "default",
                class: "choose a module class...",
                type: "none"
            }, () => {
                console.log("初始化module：", this.state);
            })
        }
        else {
            this.setState({
                name: moduleArray[moduleIndex]['_attributes']['name'],
                class: moduleArray[moduleIndex]['_attributes']['class'],
                type: moduleArray[moduleIndex]['_attributes']['type'],
                Field: moduleArray[moduleIndex]['Field']
            }, () => {
                console.log("初始化module：", this.state);
            })
        }
    }

    handleChange(e) {
        const target = e.target;
        const val = target.value;
        const name = target.name;

        if (name === "class") {
            switch (val) {
                case "PRM":
                    this.setState({ Field: fieldConfig(1) });
                    break;
                case "EM":
                    this.setState({ Field: fieldConfig(0) });
                    break;
            }
        }

        this.setState({ [name]: val }, () => {
            console.log(this.state);
        });
    }

    handleFieldChange(e) {
        const target = e.target;
        const val = target.value;
        const name = target.name;
        let tmp = this.state.Field;
        tmp.find((object, index) => {
            if (object._attributes.name === name) {
                tmp[index]._text = val;
            }
        });
        this.setState({ Field: tmp });
    }

    clickConfirm() {
        const moduleArray = this.props.node['Module'];
        const moduleIndex = this.props.moduleIndex;
        if (moduleIndex === -1) {
            let module = {};
            module['_attributes'] = {};
            module['_attributes']['name'] = this.state.name;
            module['_attributes']['class'] = this.state.class;
            module['_attributes']['type'] = this.state.type;
            module['Field'] = this.state.Field;
            moduleArray.push(module);
        }
        else {
            moduleArray[moduleIndex]['_attributes']['name'] = this.state.name;
            moduleArray[moduleIndex]['_attributes']['class'] = this.state.class;
            moduleArray[moduleIndex]['_attributes']['type'] = this.state.type;
            moduleArray[moduleIndex]['Field'] = this.state.Field;
        }
        this.props.changeModuleConfigModal(moduleArray);
        this.props.onHide();
    }

    showField() {
        return this.state.Field.map((field, index) =>
            <div key={index}>
                <Form.Group as={Row} controlId="formHorizontalField">
                    <Form.Label column sm={2}>{field['_attributes']['name']}</Form.Label>
                    <Col sm={5}>
                        <Form.Control type="text" name={field['_attributes']['name']} value={field['_text']} onChange={this.handleFieldChange} />
                    </Col>
                </Form.Group>
            </div>
        );
    }

    render() {
        let hasChoosedNodeClass = (this.state.class === "choose a module class...") ? false : true;
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} onEnter={this.onModalEnter}>
                <Modal.Header closeButton>
                    <Modal.Title>模组属性设置</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>

                        <Form.Group>
                            <Form.Label>模组名字</Form.Label>
                            <Form.Control type="text" name="name" value={this.state.name} onChange={this.handleChange} />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>模组类型</Form.Label>
                            <Form.Control type="text" name="type" value={this.state.type} onChange={this.handleChange} />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>选择模组类</Form.Label>
                            <Form.Control as="select" name="class" value={this.state.class} onChange={this.handleChange}>
                                <option disabled>choose a module class...</option>
                                <option value="PRM">点渲染模组</option>
                                <option value="EM">弹性模组</option>
                            </Form.Control>
                        </Form.Group>

                        {
                            hasChoosedNodeClass &&
                            <Form.Group>
                                <Form.Label>场量设置</Form.Label>
                                {this.showField()}
                            </Form.Group>
                        }

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.clickConfirm}>确认</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
//-------------------------------

class ClothSimulation2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            sceneConfig: {
                name: "default",
                class: "choose a scene class...",
                Field: []
            },
            isSceneConfigModalShow: false,

            nodeArray: [],
            nodeIndex: -1,
            isAddNodeButtonShow: false,
            isNodeConfigModalShow: false,

            nodeIndexForModules: -1,
            moduleIndex: -1,
            isModuleConfigModalShow: false,
        };
    }

    componentDidMount() {
        this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            background: [0, 0, 0],
            rootContainer: geoViewer,
            containerStyle: { height: '100%', width: '100%', position: 'absolute' }
        });
        this.renderer = this.fullScreenRenderer.getRenderer();
        this.renderWindow = this.fullScreenRenderer.getRenderWindow();

        /*
        //添加坐标轴：X：红，Y：黄，Z: 绿
        this.axesActor = vtkAxesActor.newInstance();
        this.renderer.addActor(this.axesActor);
        */

        //添加旋转控制控件
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

        this.renderer.resetCamera();
        this.renderWindow.render();
    }
    /*
        componentWillUnmount() {
            console.log('子组件将卸载');
        }
    */

    //----最外层场景Node配置涉及函数
    clickShowSceneConfigModal() {
        this.setState({ isSceneConfigModalShow: true });
    }
    hideSceneConfigModal() {
        this.setState({ isSceneConfigModalShow: false });
    }
    changeSceneConfigModal(val) {
        console.log(val);
        this.setState({
            sceneConfig: val,
            isAddNodeButtonShow: true
        }, () => {
            console.log(this.state.sceneConfig);
            /*
            //测试返回的val是引用还是值
            this.setState(prevState=>({
                scene:prevState.scene.concat(this.state.sceneConfig)
            }),()=>{
                console.log(this.state.scene);
            });
            */
        });
    }
    /*
    //测试返回的val是引用还是值
    createSceneButton() {
        return this.state.scene.map((val, i) =>
            <div key={i}>
                <button >{i}</button>
            </div>
        );
    }
    */
    /*
    changeSceneConfigModal(e) {
        const { name, value } = e.target;

        this.setState({ [name]: value }, () => {
            console.log("name: ", this.state.name, "\n",
                "class: ", this.state.class);
        })
    }
    */
    //----------------------------

    //-------子结点（Node）创建及相关函数设置
    clickAddNode() {
        this.showNodeConfigModal(-1);
    }
    showNodeConfigModal(i) {
        this.setState({
            nodeIndex: i,
            isNodeConfigModalShow: true
        });
    }
    hideNodeConfigModal() {
        this.setState({ isNodeConfigModalShow: false });
    }
    changeNodeConfigModal(val) {
        this.setState({
            nodeArray: val
        }, () => {
            console.log("返回node", this.state.nodeArray);
        })
    }
    deleteNode(i) {
        console.log("删除节点前", this.state.nodeArray);
        let nodeArray = [...this.state.nodeArray];
        nodeArray.splice(i, 1);
        console.log("节点splice后", this.state.nodeArray);
        this.setState({
            nodeArray: nodeArray
        }, () => {
            console.log("删除节点后", this.state.nodeArray);
        })
    }
    setNodeIndexForModules(i) {
        this.setState({ nodeIndexForModules: i });
    }
    createNodeButton() {
        return this.state.nodeArray.map((node, i) =>
            <div key={i}>
                <button onClick={() => this.setNodeIndexForModules(i)}>{node['_attributes']['name']}</button>
                <button onClick={() => this.showNodeConfigModal(i)}>属性</button>
                <button onClick={() => this.deleteNode(i)}>X</button>
            </div>
        );
    }
    //-------------------------------------

    //-------材料属性Module及相关函数设置
    clickAddModule() {
        this.showModuleConfigModal(-1);
    }
    showModuleConfigModal(i) {
        this.setState({
            moduleIndex: i,
            isModuleConfigModalShow: true
        });
    }
    hideModuleConfigModal() {
        this.setState({ isModuleConfigModalShow: false });
    }
    changeModuleConfigModal(val) {
        let nodeArray = this.state.nodeArray;
        let nodeIndex = this.state.nodeIndexForModules;
        nodeArray[nodeIndex]['Module']=val;
        this.setState({
            nodeArray: nodeArray
        }, () => {
            console.log("返回node", this.state.nodeArray);
        })
    }
    deleteModule(i) {
        console.log("删除模块前", this.state.nodeArray);
       let nodeIndex = this.state.nodeIndexForModules;
       //js展开符号无法深拷贝this.state.nodeArray中Module数组。
       //为了保证在进行setState操作前不改变this.state.nodeArray数组，
       //所以先对this.state.nodeArray数组进行深拷贝再对其拷贝对象nodeArray进行操作,
       //最后再用nodeArray覆盖原this.state.nodeArray。
       let nodeArray = deepCopy(this.state.nodeArray);
       let nodeModule = [...nodeArray[nodeIndex]['Module']]
        nodeModule.splice(i, 1);
        console.log("splice之后，", this.state.nodeArray);
        nodeArray[nodeIndex]['Module']=nodeModule;
        this.setState({
            nodeArray: nodeArray
        }, () => {
            console.log("删除模块后", this.state.nodeArray);
        })
       
    }
    createModuleButton() {
        return this.state.nodeArray[this.state.nodeIndexForModules]['Module'].map((module, i) =>
            <div key={i}>
                <button onClick={() => this.showModuleConfigModal(i)}>{module['_attributes']['name']}</button>
                <button onClick={() => this.deleteModule(i)}>X</button>
            </div>
        );
    }
    //---------------------


    //面片拾取
    cellPicker = () => {
        console.log("开始选取");

        const picker = vtkCellPicker.newInstance();
        picker.setPickFromList(1);
        picker.setTolerance(0);
        picker.initializePickList();
        //注意！不能同时添加两个actor？
        picker.addPickList(this.cubicActor);

        this.renderWindow.getInteractor().onRightButtonPress((callData) => {

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
            } else {
                const pickedCellId = picker.getCellId();
                console.log('Picked cell: ', pickedCellId);
                const pickedPoints = picker.getPickedPositions();
                for (let i = 0; i < pickedPoints.length; i++) {
                    const pickedPoint = pickedPoints[i];
                    console.log(`Picked: ${pickedPoint}`);
                }
            }
            //this.renderWindow.render();
        });
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
        config['Node']['Node']['0'] = this.state.eachNode;


        //-----最外层场景Node配置
        config['Node']['_attributes']['name'] = this.state.sceneConfig['name'];
        config['Node']['_attributes']['class'] = this.state.sceneConfig['class'];
        config['Node']['Field'] = this.state.sceneConfig['Field'];
        //----------------------
        //-----内部Node配置
        config['Node']['Node']=this.state.nodeArray;
        //----------------------


        fetch('/config', {
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
        let hasChoosedNode = (this.state.nodeIndexForModules === -1) ? false : true;
        return (
            <div className="w-100">
                <div className="card border rounded-0"><span className="text-center m-1">布料仿真</span>
                    <hr className="m-0" />
                    <div className="card-body pt-2">
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={() => this.clickShowSceneConfigModal()}><span className="glyphicon glyphicon-plus">场景</span></button>
                        {
                            this.state.isAddNodeButtonShow &&
                            <button onClick={() => this.clickAddNode()}>+添加Node</button>
                        }
                        <div id="nodeTree" className="pt-2">
                            {this.createNodeButton()}
                        </div>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" ><span className="glyphicon glyphicon-plus">材料属性</span></button>

                        {
                            hasChoosedNode &&
                            <div id="moduleTree" className="pt-2">
                                <p>{this.state.nodeArray[this.state.nodeIndexForModules]['_attributes']['name']}的Modules</p>
                                <button onClick={() => this.clickAddModule()}>+添加Module</button>
                                {this.createModuleButton()}
                            </div>
                        }

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.cellPicker}><span className="glyphicon glyphicon-plus">边界条件</span></button>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.uploadConfigPara}><span className="glyphicon glyphicon-plus">上传</span></button>

                    </div>
                    <div >
                        <SceneConfigModal
                            show={this.state.isSceneConfigModalShow}
                            sceneConfig={this.state.sceneConfig}
                            changeSceneConfigModal={(val) => this.changeSceneConfigModal(val)}
                            onHide={() => this.hideSceneConfigModal()}
                        ></SceneConfigModal>

                        <NodeConfigModal
                            show={this.state.isNodeConfigModalShow}
                            nodeArray={this.state.nodeArray}
                            nodeIndex={this.state.nodeIndex}
                            changeNodeConfigModal={(val) => this.changeNodeConfigModal(val)}
                            onHide={() => this.hideNodeConfigModal()}
                        ></NodeConfigModal>

                        <ModuleConfigModal
                            show={this.state.isModuleConfigModalShow}
                            node={this.state.nodeArray[this.state.nodeIndexForModules]}
                            moduleIndex={this.state.moduleIndex}
                            changeModuleConfigModal={(val) => this.changeModuleConfigModal(val)}
                            onHide={() => this.hideModuleConfigModal()}
                        ></ModuleConfigModal>
                    </div>
                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }
