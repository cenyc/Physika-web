import 'bootstrap/dist/css/bootstrap.custom.min.css';
import 'react-bootstrap';
import React, {Component} from 'react';
import ReactDOM, { render } from 'react-dom';
import 'normalize.css';
import GeometryRenderer from "paraviewweb/src/React/Renderers/GeometryRenderer";
import GeometryDataModel from "paraviewweb/src/IO/Core/GeometryDataModel";
import VTKGeometryDataModel from "paraviewweb/src/IO/Core/VTKGeometryDataModel";
import VTKGeometryBuilder from "paraviewweb/src/Rendering/Geometry/VTKGeometryBuilder";
import LookupTableManager from "paraviewweb/src/Common/Core/LookupTableManager";
import PipelineState from "paraviewweb/src/Common/State/PipelineState";
import QueryDataModel from "paraviewweb/src/IO/Core/QueryDataModel";
import ImageRenderer from "paraviewweb/src/React/Renderers/ImageRenderer";

// require('bootstrap/dist/css/bootstrap.custom.min.css');
// var React = require('react');
// var Component = React.Component;
// var render = require('react-dom');

class LeftNav extends Component {
    render() {
        return <nav className="navbar navbar-light align-items-start sidebar sidebar-dark accordion p-0"
                    style={{backgroundColor: "rgb(77, 114, 223)"}}>
            <div className="container-fluid d-flex flex-column p-0">
                <a className="navbar-brand d-flex justify-content-center align-items-center m-0" href="#">
                    <div className="sidebar-brand-icon rotate-n-15"></div>
                    <div className="sidebar-brand-text mx-3"><span>Physika-web</span></div>
                </a>
                <hr className="sidebar-divider my-0"/>
                <ul className="nav navbar-nav text-light" id="accordionSidebar">
                    <li className="nav-item" role="presentation"><a className="nav-link active" href="index.html"><i
                        className="fas fa-tachometer-alt"></i><span>Dashboard</span></a></li>
                    <li className="nav-item" role="presentation"><a className="nav-link" href="profile.html"><i
                        className="fas fa-user"></i><span>Profile</span></a></li>
                    <li className="nav-item" role="presentation"><a className="nav-link" href="table.html"><i
                        className="fas fa-table"></i><span>Table</span></a></li>
                    <li className="nav-item" role="presentation"><a className="nav-link" href="login.html"><i
                        className="far fa-user-circle"></i><span>Login</span></a></li>
                    <li className="nav-item" role="presentation"><a className="nav-link" href="register.html"><i
                        className="fas fa-user-circle"></i><span>Register</span></a></li>
                </ul>
                <div className="text-center d-none d-md-inline">
                    <button className="btn rounded-circle border-0" id="sidebarToggle" type="button"></button>
                </div>
            </div>
        </nav>;
    }
}
// //
class GeoViewer extends Component{
    render() {
        return <div id="content">
            <nav className="navbar navbar-light navbar-expand bg-white shadow mb-4 topbar static-top">
                <div className="container-fluid">
                    <button className="btn btn-link d-md-none rounded-circle mr-3" id="sidebarToggleTop" type="button">
                        <i className="fas fa-bars"></i></button>
                    <form
                        className="form-inline d-none d-sm-inline-block mr-auto ml-md-3 my-2 my-md-0 mw-100 navbar-search">
                        <div className="input-group"><input className="bg-light form-control border-0 small" type="text"
                                                            placeholder="Search for ..."/>
                            <div className="input-group-append">
                                <button className="btn btn-primary py-0" type="button"><i className="fas fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <ul className="nav navbar-nav flex-nowrap ml-auto">
                        <li className="nav-item dropdown d-sm-none no-arrow"><a className="dropdown-toggle nav-link"
                                                                                data-toggle="dropdown"
                                                                                aria-expanded="false" href="#"><i
                            className="fas fa-search"></i></a>
                            <div className="dropdown-menu dropdown-menu-right p-3 animated--grow-in" role="menu"
                                 aria-labelledby="searchDropdown">
                                <form className="form-inline mr-auto navbar-search w-100">
                                    <div className="input-group"><input className="bg-light form-control border-0 small"
                                                                        type="text" placeholder="Search for ..."/>
                                        <div className="input-group-append">
                                            <button className="btn btn-primary py-0" type="button"><i
                                                className="fas fa-search"></i></button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </li>
                        <li className="nav-item dropdown no-arrow mx-1" role="presentation">
                            <div className="nav-item dropdown no-arrow"><a className="dropdown-toggle nav-link"
                                                                           data-toggle="dropdown" aria-expanded="false"
                                                                           href="#"><span
                                className="badge badge-danger badge-counter">3+</span><i
                                className="fas fa-bell fa-fw"></i></a>
                                <div
                                    className="dropdown-menu dropdown-menu-right dropdown-list dropdown-menu-right animated--grow-in"
                                    role="menu">
                                    <h6 className="dropdown-header">alerts center</h6>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="mr-3">
                                            <div className="bg-primary icon-circle"><i
                                                className="fas fa-file-alt text-white"></i></div>
                                        </div>
                                        <div><span className="small text-gray-500">December 12, 2019</span>
                                            <p>A new monthly report is ready to download!</p>
                                        </div>
                                    </a>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="mr-3">
                                            <div className="bg-success icon-circle"><i
                                                className="fas fa-donate text-white"></i></div>
                                        </div>
                                        <div><span className="small text-gray-500">December 7, 2019</span>
                                            <p>$290.29 has been deposited into your account!</p>
                                        </div>
                                    </a>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="mr-3">
                                            <div className="bg-warning icon-circle"><i
                                                className="fas fa-exclamation-triangle text-white"></i></div>
                                        </div>
                                        <div><span className="small text-gray-500">December 2, 2019</span>
                                            <p>Spending Alert: We&#39;ve noticed unusually high spending for your
                                                account.</p>
                                        </div>
                                    </a><a className="text-center dropdown-item small text-gray-500" href="#">Show All
                                    Alerts</a></div>
                            </div>
                        </li>
                        <li className="nav-item dropdown no-arrow mx-1" role="presentation">
                            <div className="nav-item dropdown no-arrow"><a className="dropdown-toggle nav-link"
                                                                           data-toggle="dropdown" aria-expanded="false"
                                                                           href="#"><i
                                className="fas fa-envelope fa-fw"></i><span
                                className="badge badge-danger badge-counter">7</span></a>
                                <div
                                    className="dropdown-menu dropdown-menu-right dropdown-list dropdown-menu-right animated--grow-in"
                                    role="menu">
                                    <h6 className="dropdown-header">alerts center</h6>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="dropdown-list-image mr-3"><img className="rounded-circle"
                                                                                       src="avatars/avatar4.jpeg"/>
                                            <div className="bg-success status-indicator"></div>
                                        </div>
                                        <div className="font-weight-bold">
                                            <div className="text-truncate"><span>Hi there! I am wondering if you can help me with a problem I&#39;ve been having.</span>
                                            </div>
                                            <p className="small text-gray-500 mb-0">Emily Fowler - 58m</p>
                                        </div>
                                    </a>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="dropdown-list-image mr-3"><img className="rounded-circle"
                                                                                       src="avatars/avatar2.jpeg"/>
                                            <div className="status-indicator"></div>
                                        </div>
                                        <div className="font-weight-bold">
                                            <div className="text-truncate"><span>I have the photos that you ordered last month!</span>
                                            </div>
                                            <p className="small text-gray-500 mb-0">Jae Chun - 1d</p>
                                        </div>
                                    </a>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="dropdown-list-image mr-3"><img className="rounded-circle"
                                                                                       src="avatars/avatar3.jpeg"/>
                                            <div className="bg-warning status-indicator"></div>
                                        </div>
                                        <div className="font-weight-bold">
                                            <div className="text-truncate"><span>Last month&#39;s report looks great, I am very happy with the progress so far, keep up the good work!</span>
                                            </div>
                                            <p className="small text-gray-500 mb-0">Morgan Alvarez - 2d</p>
                                        </div>
                                    </a>
                                    <a className="d-flex align-items-center dropdown-item" href="#">
                                        <div className="dropdown-list-image mr-3"><img className="rounded-circle"
                                                                                       src="avatars/avatar5.jpeg"/>
                                            <div className="bg-success status-indicator"></div>
                                        </div>
                                        <div className="font-weight-bold">
                                            <div className="text-truncate"><span>Am I a good boy? The reason I ask is because someone told me that people say this to all dogs, even if they aren&#39;t good...</span>
                                            </div>
                                            <p className="small text-gray-500 mb-0">Chicken the Dog · 2w</p>
                                        </div>
                                    </a><a className="text-center dropdown-item small text-gray-500" href="#">Show All
                                    Alerts</a></div>
                            </div>
                            <div className="shadow dropdown-list dropdown-menu dropdown-menu-right"
                                 aria-labelledby="alertsDropdown"></div>
                        </li>
                        <div className="d-none d-sm-block topbar-divider"></div>
                        <li className="nav-item dropdown no-arrow" role="presentation">
                            <div className="nav-item dropdown no-arrow"><a className="dropdown-toggle nav-link"
                                                                           data-toggle="dropdown" aria-expanded="false"
                                                                           href="#"><span
                                className="d-none d-lg-inline mr-2 text-gray-600 small">Valerie Luna</span><img
                                className="border rounded-circle img-profile" src="avatars/avatar1.jpeg"/></a>
                                <div
                                    className="dropdown-menu shadow dropdown-menu-right animated--grow-in" role="menu">
                                    <a className="dropdown-item" role="presentation" href="#"><i
                                        className="fas fa-user fa-sm fa-fw mr-2 text-gray-400"></i> Profile</a><a
                                    className="dropdown-item" role="presentation" href="#"><i
                                    className="fas fa-cogs fa-sm fa-fw mr-2 text-gray-400"></i> Settings</a>
                                    <a
                                        className="dropdown-item" role="presentation" href="#"><i
                                        className="fas fa-list fa-sm fa-fw mr-2 text-gray-400"></i> Activity log</a>
                                    <div className="dropdown-divider"></div>
                                    <a className="dropdown-item" role="presentation" href="#"><i
                                        className="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i> Logout</a>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </nav>
            <div className="container-fluid" id={"geoViewer"}>

            </div>
        </div>;
    }
}
function init() {
    window.onload = function() {
        //首页左边布局
        let container = document.getElementById("wrapper");
        render(<LeftNav />, container);
        //首页右边布局
        let viewer = document.createElement("div");
        viewer.id = "content-wrapper";
        viewer.setAttribute("class", "d-flex flex-column")
        container.appendChild(viewer);
        render(<GeoViewer />, viewer);
        // let geoViewer = document.getElementById("geoViewer");
        // let componentA = render(<ImageRenderer />, geoViewer);
        // componentA.renderImage({
        //     url:
        //         'http://www.paraview.org/wp-content/uploads/2015/03/LANL_ClimateExample.jpg',
        // });

        // let geoViewer = document.getElementById("geoViewer");
        // render(<GeoViewer />, geoViewer);


        var lutMgr = new LookupTableManager();
        var geometryDataModel = new GeometryDataModel('/static/geo/');
        var vtkGeometryDataModel = new VTKGeometryDataModel('/static/geo/');
        // function aa() {console.log("this is aa")};
        // vtkGeometryDataModel.onGeometryReady(aa);
        // vtkGeometryDataModel.geometryReady(aa);
        vtkGeometryDataModel.loadField('mujia.obj', 'mujia');

        // let vtkGeometryBuilder = new VTKGeometryBuilder(lutMgr, geometryDataModel, pipelineState, );

        // var json_a = {
        //     "CompositePipeline": {
        //         "layers": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
        //         "dimensions": [ 500, 500 ],
        //         "fields": {
        //             "A": "salinity",
        //             "B": "temperature",
        //             "C": "bottomDepth"
        //         },
        //         "layer_fields": {
        //             "A": [ "C" ],
        //             "B": [ "B", "A" ],
        //             "C": [ "B", "A" ],
        //             "D": [ "B", "A" ],
        //             "E": [ "B", "A" ],
        //             "F": [ "B", "A" ],
        //             "G": [ "B", "A" ],
        //             "H": [ "B", "A" ],
        //             "I": [ "B", "A" ],
        //             "J": [ "B", "A" ],
        //             "K": [ "B", "A" ]
        //         },
        //         "offset": {
        //             "AC": 1,  "BA": 3,  "BB": 2,  "CA": 5,  "CB": 4,  "DA": 7,  "DB": 6,
        //             "EA": 9,  "EB": 8,  "FA": 11, "FB": 10, "GA": 13, "GB": 12, "HA": 15,
        //             "HB": 14, "IA": 17, "IB": 16, "JA": 19, "JB": 18, "KA": 21, "KB": 20
        //             "pipeline": [
        //                 {
        //                     "ids": [ "A" ],
        //                     "name": "Earth core",
        //                     "type": "layer"
        //                 },
        //                 {
        //                     "children": [
        //                         {
        //                             "ids": [ "B" ],
        //                             "name": "t=5.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "C" ],
        //                             "name": "t=10.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "D" ],
        //                             "name": "t=15.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "E" ],
        //                             "name": "t=20.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "F" ],
        //                             "name": "t=25.0",
        //                             "type": "layer"
        //                         }
        //                     ],
        //                     "ids": [ "B", "C", "D", "E", "F" ],
        //                     "name": "Contour by temperature",
        //                     "type": "directory"
        //                 },
        //                 {
        //                     "children": [
        //                         {
        //                             "ids": [ "G" ],
        //                             "name": "s=34.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "H" ],
        //                             "name": "s=35.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "I" ],
        //                             "name": "s=35.5",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "J" ],
        //                             "name": "s=36.0",
        //                             "type": "layer"
        //                         },
        //                         {
        //                             "ids": [ "K" ],
        //                             "name": "s=36.5",
        //                             "type": "layer"
        //                         }
        //                     ],
        //                     "ids": [ "G", "H", "I", "J", "K" ],
        //                     "name": "Contour by salinity",
        //                     "type": "directory"
        //                 }
        //             ]
        //         }
        //     }};
        // var pipelineState = new PipelineState(json_a);

        // var geometryDataModel = new GeometryDataModel('./static/geo/mujia.obj');
        // let vtkGeometryBuilder = new VTKGeometryBuilder(lutMgr, geometryDataModel, pipelineState, );

        // geometryDataModel.geometryReady(function(){
        //
        //
        //     console.log("geometryDataModelCounterAA: ");
        // });
        // render(<GeometryRenderer geometryBuilder={vtkGeometryBuilder}/>, geoViewer);
    }
}

export {init}
















//
// document.body.id = "page-top";
// document.body.appendChild(container);
// // const con = new ReactContainer();
//
//
// class HelloMessage extends Component {
//     render() {
//         return <div>Hello~ {this.props.name}</div>;
//     }
// }
// const div = React.createElement('h1');

// render(
//     <div className="todoListMain">
//         <div className="header">
//             <form> <input placeholder="enter task"> </input>
//                 <button type="submit">add</button>
//             </form>
//         </div>
//     </div>, container
// );

//
// con.setContainer(HelloMessage);
// con.render();

// 加载组件到 DOM 元素 mountNode <HelloMessage name="John" />
// render(div, container);