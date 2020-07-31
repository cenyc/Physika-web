import { Modal, Button, Form, Col, Row } from 'react-bootstrap';
import 'bootstrap';
import React from 'react';
import $ from 'jquery';
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

class SceneConfigModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            scene: { sceneName: "defaultScene", sceneCreationMethod: "choose a scene creation method..." }
        }
    }

    //每次打开时按照对应scene初始化组件
    onModalEnter = () => {
        console.log("enter");
        console.log("sceneShow : " + this.props.sceneShow);
        if (this.props.sceneShow === -1) {
            let initialScene = {};

            initialScene['sceneName'] = "defaultScene";
            initialScene['sceneCreationMethod'] = "choose a scene creation method...";

            this.setState({ scene: initialScene });
        }
        else {
            //开始判断各种存在的属性来生成对应的控件
            this.setState({ scene: this.props.sceneShow });
        }
    }

    //Todo：判断是否添加场景obj，来删除或增添场景名称及属性
    sceneConfigChange = (e) => {
        let newScene = this.state.scene;

        const target = e.target;
        const val = target.value;
        const name = target.name;

        switch (name) {
            case "sceneCreationMethod":
                newScene['sceneCreationMethod'] = val;
                if (val === "simple") {
                    newScene['simpleConfig'] = {};
                    newScene['simpleConfig']['sceneObj'] = "choose a geometry...";
                    delete newScene['importConfig'];
                }
                else if (val === "import") {
                    newScene['importConfig'] = {};
                    newScene['importConfig']['path'] = "C://";
                    delete newScene['simpleConfig'];
                }
                break;
            case "sceneObj":
                newScene['simpleConfig']['sceneObj'] = val;
                if (val === "rectangle") {
                    newScene['simpleConfig']['property'] = { xLength: 1.0, yLength: 1.0, zLength: 1.0 };
                    //如何设置x,y,z的属性？多三个分支判断还是拆分成子组件？
                }
                break;
            default:
                newScene[name] = val;
        }
        console.log(newScene);
        this.setState({ scene: newScene });
    }

    render() {
        const hasSceneObj = this.state.scene.hasOwnProperty('simpleConfig');
        const sceneObjIsRectangle = (hasSceneObj && (this.state.scene['simpleConfig']['sceneObj'] === "rectangle"));

        return (
            <Modal show={this.props.show} onHide={this.props.onHide} onEnter={this.onModalEnter}>
                <Modal.Header closeButton>
                    <Modal.Title>场景属性设置</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>

                        <Form.Group controlId="sceneNameInput">
                            <Form.Label>场景名字</Form.Label>
                            <Form.Control type="text" name="sceneName" value={this.state.scene['sceneName']} onChange={this.sceneConfigChange} />
                        </Form.Group>

                        <Form.Group controlId="selectSceneCreationMethod">
                            <Form.Label>选择场景创建方式</Form.Label>
                            <Form.Control as="select" name="sceneCreationMethod" value={this.state.scene['sceneCreationMethod']} onChange={this.sceneConfigChange}>
                                <option disabled>choose a scene creation method...</option>
                                <option value="simple">简单场景创建</option>
                                <option value="import">外部场景导入</option>
                            </Form.Control>
                        </Form.Group>

                        {
                            hasSceneObj &&
                            <Form.Group controlId="default1">
                                <Form.Label>简单场景导入</Form.Label>
                                <Form.Control as="select" name="sceneObj" value={this.state.scene['simpleConfig']['sceneObj']} onChange={this.sceneConfigChange}>
                                    <option disabled>choose a geometry...</option>
                                    <option value="rectangle">rectangle</option>
                                    <option value="sphere">sphere</option>
                                </Form.Control>
                            </Form.Group>
                        }

                        {
                            sceneObjIsRectangle &&
                            <Form.Row>
                                <Form.Group as={Col} controlId="x">
                                    <Form.Label>x</Form.Label>
                                    <Form.Control name="xLength" />
                                </Form.Group>

                                <Form.Group as={Col} controlId="y">
                                    <Form.Label>y</Form.Label>
                                    <Form.Control name="yLength" />
                                </Form.Group>

                                <Form.Group as={Col} controlId="z">
                                    <Form.Label>z</Form.Label>
                                    <Form.Control name="zLength" />
                                </Form.Group>
                            </Form.Row>
                        }

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.onConfirm}>确认</Button>
                    <Button onClick={this.props.deleteScene}>删除场景</Button>
                </Modal.Footer>
            </Modal>
        )
    }
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
class SceneConfig extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            sceneName: "123",
            sceneClass: "choose a scene class...",
            sceneField: []
        }
    }

    //每次打开时按照对应sceneConfig初始化组件
    onModalEnter = () => {
        console.log("enter");
        const sceneConfig = this.props.sceneConfig;
        this.setState({
            sceneName: sceneConfig['sceneName'],
            sceneClass: sceneConfig['sceneClass'],
            sceneField: sceneConfig['sceneField']
        }, () => {
            console.log("初始化sceneConfig：", this.state);
        })
    }

    handleChange = (e) => {
        //const {name,val}=e.target;
        const target = e.target;
        const val = target.value;
        const name = target.name;
        console.log("123",Field);
        
        if (name === "sceneClass") {
            switch (val) {
                case "SB":
                    this.setState({ sceneField: fieldConfig(0) });
                    break;
                case "X":
                    this.setState({ sceneField: fieldConfig(1) });
                    break;
            }
        }

        this.setState({ [name]: val }, () => {
            console.log(this.state);
        });
    }

    handleFieldChange = (e) => {
        const target = e.target;
        const val = target.value;
        const name = target.name;
        let tmp = this.state.sceneField;
        tmp.find((object, index) => {
            if (object._attributes.name === name) {
                tmp[index]._text = val;
            }
        });
        this.setState({ sceneField: tmp }, () => {
            console.log(this.state.sceneField);
            console.log("321",Field);
        });
    }

    showField() {
        return this.state.sceneField.map((field, index) =>
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
    clickConfirm = () => {
        let res = this.state;
        this.props.changeSceneConfigModal(res);
        this.props.onHide();
    }

    render() {
        let hasChoosedSceneClass = (this.state.sceneClass === "choose a scene class...") ? false : true;
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} onEnter={this.onModalEnter}>
                <Modal.Header closeButton>
                    <Modal.Title>场景属性设置</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>

                        <Form.Group controlId="sceneNameInput">
                            <Form.Label>场景名字</Form.Label>
                            <Form.Control type="text" name="sceneName" value={this.state.sceneName} onChange={this.handleChange} />
                        </Form.Group>

                        <Form.Group controlId="selectSceneClass">
                            <Form.Label>选择场景类</Form.Label>
                            <Form.Control as="select" name="sceneClass" value={this.state.sceneClass} onChange={this.handleChange}>
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

class ClothSimulation2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            sceneConfig: {
                sceneName: "default",
                sceneClass: "choose a scene class...",
                sceneField: []
            },
            isSceneConfigModalShow: false,


            scene: [],
            sceneConfigValue: [],
            sceneShow: 0,
            isSonNodeConfigModalShow: false,

            allNode: [],
            eachNode: {
                Field: [
                    { _attributes: { name: "mass" }, _text: "1.0" },
                    { _attributes: { name: "dt" }, _text: "0.0 -9.8 0.0" }
                ],
                Module: [
                    {
                        _attributes: { name: "load", class: "ML" },
                        Field: [
                            {
                                _attributes: { name: "path" },
                                _text: "c:/"
                            }]
                    },
                    {
                        _attributes: { name: "ela", class: "PRM" }
                    }
                ],
                _attributes: { class: "PE", name: "" }
            }

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
        this.setState({ sceneConfig: val }, () => {
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
            console.log("sceneName: ", this.state.sceneName, "\n",
                "sceneClass: ", this.state.sceneClass);
        })
    }
    */
    //----------------------------




    //在render中调用事件函数，render()中的this.createSceneButton后面必须加括号!
    createSceneButton() {
        return this.state.scene.map((val, i) =>
            <div key={i}>
                <button onClick={() => this.showSceneConfigModal(i)}>{val}</button>
                <button onClick={() => this.deleteSceneClick(i)}>x</button>
            </div>
        );
    }


    //隐藏场景配置模态框
    hideSceneConfigModalModal() {
        this.setState({ isSonNodeConfigModalShow: false });
    }

    //显示场景配置模态框
    showSceneConfigModal(i) {
        if (i === -1) {
            this.setState({
                isSonNodeConfigModalShow: true,
                sceneShow: -1
            }, () => {
                console.log(this.state.sceneShow);
            });
        }
        else {
            this.setState({
                isSonNodeConfigModalShow: true,
                sceneShow: this.state.sceneConfigValue[i]
            }, () => {
                console.log("显示已生成场景的配置模态框");
                console.log(this.state.sceneShow);
            });
        }
    }

    //主控件接收SceneConfigModal子控件传回的新场景配置
    setScenceVal() {
        this.setState({ isSonNodeConfigModalShow: false });

        //concat返回的是浅拷贝，所以需要先将新scene进行一次深拷贝，否则新的scene会改变旧scene中的值
        let tmp = deepCopy(this.refs.sceneConfig.state.scene);

        this.setState(prevState => ({
            scene: [...prevState.scene, this.refs.sceneConfig.state.scene['sceneName']],
            sceneConfigValue: prevState.sceneConfigValue.concat(tmp)
        }), () => {
            console.log("根据配置设置场景");
            console.log(this.state.sceneConfigValue);
            //
        });

    }

    //删除对应场景
    deleteSceneClick(i) {
        console.log(this.state.scene, this.state.sceneConfigValue);

        let scene = [...this.state.scene];
        scene.splice(i, 1);
        this.setState({ scene: scene });

        console.log(eval("this." + this.state.sceneConfigValue[i]['actor']));
        //删除actor，eval将字符串转化为js代码
        this.renderer.removeActor(eval("this." + this.state.sceneConfigValue[i]['actor']));
        this.renderWindow.render();
        let sceneConfigValue = [...this.state.sceneConfigValue];
        sceneConfigValue.splice(i, 1);
        this.setState({ sceneConfigValue: sceneConfigValue }, () => {
            console.log(this.state.sceneConfigValue);
        });
    }

    //增添新场景
    clickAddScene = () => {
        this.showSceneConfigModal(-1);
    }

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
        config['Node']['_attributes']['name'] = this.state.sceneConfig['sceneName'];
        config['Node']['_attributes']['class'] = this.state.sceneConfig['sceneClass'];
        config['Node']['Field'] = this.state.sceneConfig['sceneField'];
        //-----
        

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
        //------

        return (
            <div className="w-100">
                <div className="card border rounded-0"><span className="text-center m-1">布料仿真</span>
                    <hr className="m-0" />
                    <div className="card-body pt-2">
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={() => this.clickShowSceneConfigModal()}><span className="glyphicon glyphicon-plus">场景</span></button>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.clickAddScene}><span className="glyphicon glyphicon-plus">材料属性</span></button>
                        <div id="scene_tree" className="pt-2">
                            {this.createSceneButton()}
                        </div>
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.cellPicker}><span className="glyphicon glyphicon-plus">边界条件</span></button>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.uploadConfigPara}><span className="glyphicon glyphicon-plus">上传</span></button>

                    </div>
                    <SceneConfig
                        show={this.state.isSceneConfigModalShow}
                        sceneConfig={this.state.sceneConfig}
                        changeSceneConfigModal={(val) => this.changeSceneConfigModal(val)}
                        onHide={() => this.hideSceneConfigModal()}
                    ></SceneConfig>
                    <div>

                    </div>

                    <div>
                        <SceneConfigModal ref="sceneConfig" show={this.state.isSonNodeConfigModalShow} sceneShow={this.state.sceneShow}
                            onHide={() => this.hideSceneConfigModalModal()} onConfirm={() => this.setScenceVal()} deleteScene={() => this.deleteScene()}></SceneConfigModal>
                    </div>

                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }
