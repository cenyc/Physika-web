import 'react-bootstrap';
import 'bootstrap';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import 'normalize.css';
import $ from 'jquery';

//import { Test } from './test'
import {Test} from './CloudEuler'
import { PhysikaClothSimulation } from './Cloth'

class LeftNav extends Component {

    /**
     * 创建仿真按钮触发事件
     */
    click_create_simulation() {
        $("#selectSimModal").modal();
    }

    /**
     * 选择仿真场景触发事件
     */
    click_select_simulation = () => {
        let index = $("#simSelect option:selected").val();

        let right_container = document.getElementById("content-wrapper");

        if (index == 1) {
            console.log("布料仿真");
            if (document.getElementById("geoViewer")) {
                right_container.removeChild(document.getElementById("geoViewer"));
            }
            right_container.innerHTML = '<div className="container-fluid p-0" id="geoViewer"></div>';
            ReactDOM.render(<PhysikaClothSimulation />, document.getElementById("createTree"));
        }
        else if (index == 2) {
            console.log("流体模拟");
            if (document.getElementById("geoViewer")) {
                right_container.removeChild(document.getElementById("geoViewer"));
            }
            //注意style样式，决定了volumeController的位置
            right_container.innerHTML = '<div className="container-fluid p-0" id="geoViewer" style="height: 100%; width: 100%; position: absolute; cursor: pointer;"></div>';
            //right_container.innerHTML = '<div className="container-fluid p-0" id="geoViewer"></div>';
            ReactDOM.render(<Test />, document.getElementById("createTree"));
        }
    }

    render() {

        return (

            <nav className="navbar navbar-light align-items-start sidebar sidebar-dark accordion p-0" style={{ backgroundColor: "rgb(174, 188, 197)" }}>
                <div className="container-fluid d-flex flex-column p-0">
                    <a className="navbar-brand d-flex justify-content-center align-items-center m-0" href="#">
                        <div className="sidebar-brand-icon rotate-n-15"></div>
                        <div className="sidebar-brand-text mx-3"><span>云景仿真平台</span></div>
                    </a>
                    <hr className="sidebar-divider my-0" />
                    <div className="container">
                        <div className="modal fade" id="selectSimModal" role="dialog">
                            <div className="modal-dialog">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h4 className="modal-title">选择仿真情景</h4>
                                        <button type="button" className="close" data-dismiss="modal">&times;</button>
                                    </div>
                                    <div className="modal-body">
                                        <form role="form">
                                            <div className="form-group">
                                                <select className="form-control" id="simSelect">
                                                    <option value="1">布料仿真</option>
                                                    <option value="2">流体模拟</option>
                                                </select>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-default" data-dismiss="modal" onClick={this.click_select_simulation}>确定</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="container p-2">
                        <button className="btn btn-danger btn-sm btn-lg btn-block" type="button" onClick={this.click_create_simulation}>创建仿真</button>
                    </div>
                    <div id="createTree" className="container p-2"></div>
                </div>
            </nav>

        );
    }
}

/**
 * 首页初始化
 */
function init() {
    window.onload = function () {
        //首页左边布局
        //let container = document.getElementById("wrapper");
        //let x=document.getElementById("sidebar");
        //render(<LeftNav />, x);
        //首页右边布局
        //let viewer = document.createElement("div");
        //viewer.id = "content-wrapper";
        //viewer.setAttribute("class", "d-flex flex-column")
        //container.appendChild(viewer);
        //render(<GeoViewer />, viewer);

        //let right_container = document.getElementById("content-wrapper");
        //ReactDOM.render(<GeoViewer />, right_container);
        //let geoViewer = document.getElementById("geoViewer");
        /*
                const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
                    background: [0, 0, 0],
                    rootContainer: geoViewer,
                    containerStyle: { height: '100%', width: '100%', position: 'absolute' },
                });
        */
        let left_container = document.getElementById("sidebar");
        ReactDOM.render(<LeftNav />, left_container);

    }
}

export { init }

