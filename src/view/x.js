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
    //点击按钮后打开场景选择模态框
    clickAddScene() {
        $("#selectSceneModal").modal();
    }

    //点击确认按钮后添加并生成对应场景
    clickSelectScene = () => {
        let index = $("#sceneSelect option:selected").val();
        if (index == 1) {

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

                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }
