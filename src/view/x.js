import 'react-bootstrap';
import 'bootstrap';
import React from 'react';
import $ from 'jquery';
//vtkActor用于表示渲染场景中的实体
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
//抽象类，用于指定数据和图形基元之间的接口
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';

class ClothSimulation2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fullScreenRenderer: this.props.fullScreenRenderer,
            renderer: null,
            renderWindow: null,
            source: null,
            mapper: null,
            actor: null,

            x_begin: null,
            y_begin: null,
            z_begin: null,
            x_end: null,
            y_end: null,
            z_end: null,

            address: null
        };
    }

    clickAddScene = () => {
        console.log(this.state.fullScreenRenderer);
        $("#selectSceneModal").modal();
    }

    clickSelectScene = () => {
        let index = $("#sceneSelect option:selected").val();
        if (index == 1) {
            this.setState({
                renderer: this.state.fullScreenRenderer.getRenderer(),
                renderWindow: this.state.fullScreenRenderer.getRenderWindow(),
                source: vtkCubeSource.newInstance(),
                mapper: vtkMapper.newInstance(),
                actor: vtkActor.newInstance()
            }, () => {
                this.state.mapper.setInputData(this.state.source.getOutputData());
                this.state.actor.setMapper(this.state.mapper);
                this.state.renderer.addActor(this.state.actor);
                this.state.renderer.resetCamera();
                console.log(this.state.renderWindow);
                this.state.renderWindow.render();

            });

        }
        else if (index == 2) {

            this.setState({
                renderer: fullScreenRenderer.getRenderer(),
                renderWindow: fullScreenRenderer.getRenderWindow(),
                source: vtkSphereSource.newInstance(),
                mapper: vtkMapper.newInstance(),
                actor: vtkActor.newInstance()
            }, () => {
                this.state.mapper.setInputData(this.state.source.getOutputData());
                this.state.actor.setMapper(this.state.mapper);
                this.state.renderer.addActor(this.state.actor);
                this.state.renderer.resetCamera();
                console.log(this.state.renderWindow);
                this.state.renderWindow.render();

            });

        }
    }

    cellPicker = () => {
        console.log("开始选取");

        const picker = vtkCellPicker.newInstance();
        picker.setPickFromList(1);
        picker.setTolerance(0);
        picker.initializePickList();
        picker.addPickList(this.state.actor);


        this.state.renderWindow.getInteractor().onRightButtonPress((callData) => {

            if (this.state.renderer !== callData.pokedRenderer) {
                return;
            }

            const pos = callData.position;
            const point = [pos.x, pos.y, 0.0];
            console.log(`Pick at: ${point}`);
            picker.pick(point, this.state.renderer);

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
            this.state.renderWindow.render();
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
                load1(fullScreenRenderer,res);
                
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
                        <div id="scene_tree" className="pt-2"></div>
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

export {ClothSimulation2}
