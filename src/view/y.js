import { Modal, Button, Form, Col } from 'react-bootstrap';
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
        newobj[i] = typeof obj[i] === 'object' ? copy(obj[i]) : obj[i];
    }
    return newobj;
}

class SceneConfigModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            xLength: 1.0,
            yLength: 1.0,

            scene: { sceneName: "defaultScene" }
        }
    }

    //每次打开时按照对应scene初始化组件
    onModalEnter = () => {
        console.log("enter");
        console.log("sceneShow : " + this.props.sceneShow);
        if (this.props.sceneShow === -1) {
            let initialScene = {};
            initialScene['sceneName'] = "defaultScene";
            //开始判断各种存在的属性来生成对应的控件
            if (initialScene.hasOwnProperty('sceneObj')) {
                initialScene['zLength'] = 1.0;
            }
            else {

            }
            this.setState({ scene: initialScene });
        }
    }

    //Todo：判断是否添加场景obj，来删除或增添场景名称及属性
    sceneConfigChange = (e) => {
        let newScene = this.state.scene;

        const target = e.target;
        const val = target.value;
        const name = target.name;
        console.log(name, val);

        if (name === "sceneName" && val === "1") {
            newScene['sceneObj'] = "choose a geometry...";
        }
        else {
            newScene[name] = val;
        }


        this.setState({ scene: newScene });
    }

    render() {
        const hasSceneObj = this.state.scene.hasOwnProperty('sceneObj');

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

                        {
                            hasSceneObj &&
                            <Form.Group controlId="sceneSelect">
                                <Form.Label>Example select</Form.Label>
                                <Form.Control as="select" name="sceneObj" value={this.state.scene['sceneObj']} onChange={this.sceneConfigChange}>
                                    <option disabled>choose a geometry...</option>
                                    <option value="rectangle">rectangle</option>
                                    <option value="sphere">sphere</option>
                                </Form.Control>
                            </Form.Group>
                        }

                        <Form.Row>
                            <Form.Group as={Col} controlId="x">
                                <Form.Label>x</Form.Label>
                                <Form.Control name="xLength" onChange={this.sceneConfigChange} value={this.state.xLength} />
                            </Form.Group>

                            <Form.Group as={Col} controlId="y">
                                <Form.Label>y</Form.Label>
                                <Form.Control name="yLength" onChange={this.sceneConfigChange} />
                            </Form.Group>

                            <Form.Group as={Col} controlId="z">
                                <Form.Label>z</Form.Label>
                                <Form.Control name="zLength" onChange={this.sceneConfigChange} />
                            </Form.Group>

                        </Form.Row>
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

class ClothSimulation2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            x_begin: null,
            y_begin: null,
            z_begin: null,
            x_end: null,
            y_end: null,
            z_end: null,

            address: null,

            scene: [],

            isSceneConfigModalShow: false,
            sceneShow: -1,
            scene_val: []

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
        this.setState({ isSceneConfigModalShow: false });
    }

    //显示场景配置模态框
    showSceneConfigModal(i) {
        if (i === -1) {
            this.setState({
                isSceneConfigModalShow: true,
                sceneShow: -1
            }, () => {
                console.log(this.state.sceneShow);
            });
        }
        else {
            this.setState({
                isSceneConfigModalShow: true,
                sceneShow: this.state.scene[i]
            }, () => {
                console.log(this.state.sceneShow);
            });
        }
    }

    //主控件接收SceneConfigModal子控件传回的新场景配置
    setScenceVal() {
        this.setState({ isSceneConfigModalShow: false });

        //concat返回的是浅拷贝，所以需要先将新scene进行一次深拷贝，否则新的scene会改变旧scene中的值
        let tmp = deepCopy(this.refs.sceneConfig.state.scene);

        //this.setState(prevState => ({ scene: [...prevState.scene, this.refs.sceneConfig.state.scene['sceneName']] }));
        //this.setState(prevState => ({ scene_val: prevState.scene_val.concat(tmp) }));

        this.setState(prevState => ({
            scene: [...prevState.scene, this.refs.sceneConfig.state.scene['sceneName']],
            scene_val: prevState.scene_val.concat(tmp)
        }), () => {
            console.log("根据配置设置场景");
        });

    }

    //删除对应场景
    deleteSceneClick(i) {
        console.log(this.state.scene, this.state.scene_val);

        let scene = [...this.state.scene];
        scene.splice(i, 1);
        this.setState({ scene: scene });

        let scene_val = [...this.state.scene_val];
        scene_val.splice(i, 1);
        this.setState({ scene_val: scene_val }, () => {
            console.log(this.state.scene_val);
        });
    }

    //增添新场景
    clickAddScene = () => {
        this.showSceneConfigModal(-1);
    }

    //点击确认按钮后添加并生成对应场景
    clickSelectScene = () => {
        let index = $("#sceneSelect option:selected").val();
        if (index == 1) {

            //----添加场景
            this.setState(prevState => ({ scene: [...prevState.scene, 'cubic' + prevState.scene.length] }));
            this.setState(prevState => ({ scene_val: [...prevState.scene_val, [1.0, 1.0, 1.0]] }));
            /*
            这里不需要显示调用，因为该函数在render()中，一旦state数据发生变化，则会在render()中自动调用this.createSceneButton()
            this.createSceneButton();
            */

            this.cubicSource = vtkCubeSource.newInstance({ xLength: 2.0 });
            this.cubicMapper = vtkMapper.newInstance();
            this.cubicActor = vtkActor.newInstance();

            const outlineFileter = vtkOutlineFilter.newInstance();
            outlineFileter.setInputConnection(this.cubicSource.getOutputPort());
            this.cubicMapper.setInputConnection(outlineFileter.getOutputPort());
            this.cubicActor.setMapper(this.cubicMapper);
            this.renderer.addActor(this.cubicActor);

            this.renderer.resetCamera();
            this.renderWindow.render();

        }
        else if (index == 2) {
            //this.cubicSource.set({xLength: 1.0});

            this.sphereSource = vtkSphereSource.newInstance();
            this.sphereMapper = vtkMapper.newInstance();
            this.sphereActor = vtkActor.newInstance();

            this.sphereMapper.setInputConnection(this.sphereSource.getOutputPort());
            this.sphereActor.setMapper(this.sphereMapper);
            this.renderer.addActor(this.sphereActor);

            this.renderer.resetCamera();
            this.renderWindow.render();

        }
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


    //传入模拟域边界坐标
    sceneBoundaryCoordinatesChange = (e) => {
        const target = e.target;
        const val = target.value;
        const name = target.name;

        this.setState({
            [name]: val
        }, () => {
            console.log(this.state.x_begin, this.state.y_begin, this.state.z_begin, this.state.x_end, this.state.y_end, this.state.z_end);
        });
    }

    //上传数据到服务器
    uploadConfigPara = () => {
        console.log("开始上传");
        let config = {
            x_begin: this.state.x_begin,
            y_begin: this.state.y_begin,
            z_begin: this.state.z_begin,
            x_end: this.state.x_end,
            y_end: this.state.y_end,
            z_end: this.state.z_end
        }

        fetch('/config', {
            method: 'POST',
            body: JSON.stringify(config),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.text())
            .catch(error => console.error('Error:', error))
            .then(res => {
                console.log('Success:', res);
                this.setState({
                    address: res
                });
                load1(fullScreenRenderer, res);

                /*
                fetch(this.state.address).then(response => response.blob())
                .then(res => {
                    console.log(res);
                    load2(fullScreenRenderer,res);
                });
                */
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
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.clickAddScene}><span className="glyphicon glyphicon-plus">场景</span></button>
                        <div id="scene_tree" className="pt-2">
                            {this.createSceneButton()}
                        </div>
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button"><span className="glyphicon glyphicon-plus">材料属性</span></button>
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.cellPicker}><span className="glyphicon glyphicon-plus">边界条件</span></button>

                        <div className="accordion" id="accordionExample">
                            <div className="card">
                                <div id="headingOne">
                                    <button className="btn btn-danger btn-sm p-0 btn-block" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                        场景
                                    </button>
                                </div>

                                <div id="collapseOne" className="collapse" aria-labelledby="headingOne" data-parent="#accordionExample">
                                    <div className="card-body">
                                        <form className="p-0">
                                            <div className="row">
                                                <div className="col">
                                                    <input name="x_begin" type="number" className="form-control" placeholder="x_begin" onChange={this.sceneBoundaryCoordinatesChange} />
                                                    <input name="y_begin" type="number" className="form-control" placeholder="y_begin" onChange={this.sceneBoundaryCoordinatesChange} />
                                                    <input name="z_begin" type="number" className="form-control" placeholder="z_begin" onChange={this.sceneBoundaryCoordinatesChange} />
                                                </div>
                                                <div className="col">
                                                    <input name="x_end" type="number" className="form-control" placeholder="x_end" onChange={this.sceneBoundaryCoordinatesChange} />
                                                    <input name="y_end" type="number" className="form-control" placeholder="y_end" onChange={this.sceneBoundaryCoordinatesChange} />
                                                    <input name="z_end" type="number" className="form-control" placeholder="z_end" onChange={this.sceneBoundaryCoordinatesChange} />
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card border rounded-0" id="headingTwo">
                                    <button className="btn btn-outline-primary btn-sm p-0 btn-block" type="button" data-toggle="collapse" data-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                        属性
                                        </button>
                                </div>
                                <div id="collapseTwo" className="collapse" aria-labelledby="headingTwo" data-parent="#accordionExample">
                                    <div className="card-body">
                                        bb
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card border rounded-0" id="headingThree">
                                    <button className="btn btn-outline-success" type="button" data-toggle="collapse" data-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                        交互
                                        </button>
                                </div>
                                <div id="collapseThree" className="collapse" aria-labelledby="headingThree" data-parent="#accordionExample">
                                    <div className="card-body">
                                        cc
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.uploadConfigPara}><span className="glyphicon glyphicon-plus">上传</span></button>

                    </div>

                    <div className="container">
                        <div className="modal fade" id="selectSceneModal" role="dialog">
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h4 className="modal-title">选择场景</h4>
                                        <button type="button" className="close" data-dismiss="modal">&times;</button>
                                    </div>
                                    <div className="modal-body">
                                        <form role="form">
                                            <div className="form-group">
                                                <select className="form-control" id="sceneSelect">
                                                    <option value="1">立方体</option>
                                                    <option value="2">球体</option>
                                                </select>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.clickSelectScene}>确定</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div>
                        <SceneConfigModal ref="sceneConfig" show={this.state.isSceneConfigModalShow} sceneShow={this.state.sceneShow}
                            onHide={() => this.hideSceneConfigModalModal()} onConfirm={() => this.setScenceVal()} deleteScene={() => this.deleteScene()}></SceneConfigModal>
                    </div>

                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }
