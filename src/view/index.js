import 'react-bootstrap';
import 'bootstrap';
import React, {Component} from 'react';
import ReactDOM, { render } from 'react-dom';
import 'normalize.css';
import $ from 'jquery';
import 'ajax';

// import paraviewweb lib
import GitTreeWidget from 'paraviewweb/src/React/Widgets/GitTreeWidget';
import GeometryRenderer from "paraviewweb/src/React/Renderers/GeometryRenderer";
import GeometryDataModel from "paraviewweb/src/IO/Core/GeometryDataModel";
import VTKGeometryDataModel from "paraviewweb/src/IO/Core/VTKGeometryDataModel";
import VTKGeometryBuilder from "paraviewweb/src/Rendering/Geometry/VTKGeometryBuilder";
import LookupTableManager from "paraviewweb/src/Common/Core/LookupTableManager";
import PipelineState from "paraviewweb/src/Common/State/PipelineState";
import QueryDataModel from "paraviewweb/src/IO/Core/QueryDataModel";
import ImageRenderer from "paraviewweb/src/React/Renderers/ImageRenderer";

//
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkActor from "vtk.js/Sources/Rendering/Core/Actor";
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import file from "paraviewweb/src/IO/Girder/CoreEndpoints/file";

// require('bootstrap/dist/css/bootstrap.custom.min.css');
// var React = require('react');
// var Component = React.Component;
// var render = require('react-dom');

var pipeline_node = [];
var fullScreenRenderer
class ClothSimulation extends Component {


    componentWillMount() {
        console.log('App-页面即将加载')
    }

    componentDidMount() {
        console.log('App-页面加载完成')
        let sq_btn = document.getElementById('add_scene_btn');
        // sq_btn.innerHTML = `<form id="uploadForm" enctype="multipart/form-data"><input type="file" accept=".zip,.obj" style="display: none;" name="file" value=""/></form>`;
        // let input_geo_file = sq_btn.querySelector('input');
        let input_geo_file = document.getElementById('input_geo_file_a')
        // input_geo_file.addEventListener('change', function (event) {
        //     if (!event)
        //         event = window.event;
        //     input_geo_file_handle(event, fullScreenRenderer)
        // });
        sq_btn.addEventListener('click', (e) => input_geo_file.click());
    }

    aa(event) {
       console.log(event.target) 
       input_geo_file_handle(event, fullScreenRenderer)
    }

    render() {
        return (<div className="w-100">
            <div className="card border rounded-0"><span className="text-center m-1">布料仿真根结点</span>
                <hr className="m-0" />
                <form id="uploadForm_a" style={{display: "none"}} encType="multipart/form-data"><input id="input_geo_file_a" type="file" accept=".zip,.obj" name="file" value="" onChange={this.aa.bind(this)}/></form>
                <div className="card-body pt-2">
                    <button id="add_scene_btn" className="btn btn-danger btn-sm p-0 btn-block" type="button"><span className="glyphicon glyphicon-plus">➕场景</span></button>
                    <div id="scene_tree" className="pt-2"></div>
                    <button className="btn btn-danger btn-sm p-0 btn-block" type="button"><span className="glyphicon glyphicon-plus">➕材料属性</span></button>
                    <button className="btn btn-danger btn-sm p-0 btn-block" type="button"><span className="glyphicon glyphicon-plus">➕边界条件</span></button>
                </div>
            </div>
        </div>);
    }
}

class LeftNav extends Component {

    /**
     * 创建仿真按钮触发事件
     */
    click_create_simulation() {
        $("#myModal").modal();
    }

    /**
     * 选择仿真场景触发事件
     */
    click_select_simulation() {
        let index=$("#simSelect option:selected").val();
        if(index==1){
            console.log("布料仿真")
            render(<ClothSimulation />, document.getElementById("createTree"))
        }
        else if(index==2){
            console.log("流体模拟");
        }
    }

    render() {
        return <nav className="navbar navbar-light align-items-start sidebar sidebar-dark accordion p-0"
                    style={{backgroundColor: "rgb(174, 188, 197)"}}>
            <div className="container-fluid d-flex flex-column p-0">
                <a className="navbar-brand d-flex justify-content-center align-items-center m-0" href="#">
                    <div className="sidebar-brand-icon rotate-n-15"></div>
                    <div className="sidebar-brand-text mx-3"><span>Physika Web</span></div>
                </a>
                <hr className="sidebar-divider my-0"/>
                <div className="container">
                    <div className = "modal fade" id="myModal" role="dialog">
                        <div className = "modal-dialog">
                            <div className = "modal-content">
                                <div className = "modal-header">
                                    <h4 className = "modal-title">选择仿真情景</h4>
                                    <button type="button" className = "close" data-dismiss="modal">&times;</button>
                                </div>
                            <div className = "modal-body">
                                <form role="form">
                                    <div className = "form-group">
                                        <select className = "form-control" id="simSelect">
                                            <option value="1">布料仿真</option>
                                            <option value="2">流体模拟</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className = "modal-footer">
                                <button type="button" className = "btn btn-default" data-dismiss="modal" onClick={this.click_select_simulation}>确定</button>
                            </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
                    <div className="container p-2">
                        <button className="btn btn-danger btn-sm btn-lg btn-block" type="button" onClick={this.click_create_simulation}>创建仿真</button>
                    </div>
                    <div id="createTree" className = "container p-2"></div>
                
                <div className="container">
                    <button className ="btn btn-danger btn-sm btn-lg btn-block" type="button">执行仿真</button>
                    <div id="performTree" ></div>
                </div>
                <div className="text-center d-none d-md-inline">
                    <button className="btn rounded-circle border-0" id="sidebarToggle" type="button"></button>
                </div>
            </div>
        </nav>;
    }
}

class GeoViewer extends Component{
    render() {
        return (
            <div id="content">
                <div className = "container-fluid p-0" id={"geoViewer"}></div>
            </div>
            );
    }
}


/**
 * 加载模型响应事件
 * @param event
 * @param fullScreenRenderer
 */
function input_geo_file_handle(event, fullScreenRenderer) {
    // event.preventDefault();
    const geo_file = event.target.files;

    if (geo_file.length == 1) {
        const ext = geo_file[0].name.split('.').slice(-1)[0];
        console.log('loading geometry file successfully, is name '+geo_file[0].name+' and ext is '+ext+'.');
        load(fullScreenRenderer, {file: geo_file[0], ext});
    }
    console.log(geo_file);
}

/**
 * 加载显示几何体
 * @param options
 */
function load(fullScreenRenderer, options) {
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    // 加载obj
    if (options.file && options.ext === 'obj') {
        console.log('loading obj... '+options.file.name);
        const reader = new FileReader();
        reader.onload = function (event) {

            $.ajax({
                url: '/upload',
                type: 'POST',
                data: new FormData($('#uploadForm')[0]),
                processData: false,
                contentType: false
            }).done(function (response) {
                console.log('success');
            }).fail(function (response) {
                console.log('failed');
            });



            const objReader = vtkOBJReader.newInstance();
            objReader.parseAsText(reader.result);
            const nbOutputs = objReader.getNumberOfOutputPorts();
            console.log('nbOutputs is '+nbOutputs);
            for (let idx = 0; idx < nbOutputs; idx++) {
                const source = objReader.getOutputData(idx);
                const mapper = vtkMapper.newInstance();
                const actor = vtkActor.newInstance();
                actor.setMapper(mapper);
                mapper.setInputData(source);
                renderer.addActor(actor);
            }
            console.log('rendering geo...'+options.file.name)
            renderer.resetCamera();
            renderWindow.render();

            const pipeline_node_length = pipeline_node.length;
            let node;
            // if (pipeline_node_length == 0) {
            //     node = { name: options.file.name, visible: true, id: '1', parent: '0' };
            // }else {
            //     node = { name: options.file.name, visible: true, id: pipeline_node_length+1, parent: pipeline_node_length-1 };
            // }
            const object_id = typeof(pipeline_node_length)=="undefined"? 1:pipeline_node_length+1;
            if (object_id == 1) {
                node = { name: options.file.name, visible: true, id: object_id, parent: '0' };
            }else {
                node = { name: options.file.name, visible: true, id: object_id, parent: object_id-1 };
            }

            function onChange(event) {
                console.log(event);
            }
            pipeline_node.push(node);
            render(
                <GitTreeWidget nodes={pipeline_node} onChange={onChange}/>,
                document.querySelector('#scene_tree')
            );
        };
        reader.readAsText(options.file);
    }
}



/**
 * 首页初始化
 */
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

        //-------------
        //Todo 待优化 start
        // function onChange(event) {
        //     console.log(event);
        // }
        // function onChange(event) {
        //     console.log(event);
        // }
        // render(
        //     <GitTreeWidget nodes={pipeline_node} onChange={onChange}/>,
        //     document.querySelector('#')
        // );
        //end 待优化

        let geoViewer = document.getElementById("geoViewer");
        fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            background: [0, 0, 0],
            rootContainer: geoViewer,
            containerStyle: { height: '100%', width: '100%', position: 'absolute' },
        });
        let sq_btn = document.getElementById('sidebarToggle');
        sq_btn.innerHTML = `<form id="uploadForm" enctype="multipart/form-data"><input type="file" accept=".zip,.obj" style="display: none;" name="file" value=""/></form>`;
        let input_geo_file = sq_btn.querySelector('input');
        input_geo_file.addEventListener('change', function (event) {
            if (!event)
                event = window.event;
            input_geo_file_handle(event, fullScreenRenderer)
        });
        sq_btn.addEventListener('click', (e) => input_geo_file.click());
        //-------------
        //render(<CreatDialog />);
        //模态控制
        
        // objReader.readAsText('/static/geo/mujia.obj');
        // fileReader.onload = function(event) {
        //     console.log('this is onload event');
        // };
        // fileReader.readAsText('/static/geo/mujia.obj');


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