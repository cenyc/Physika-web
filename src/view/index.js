import 'react-bootstrap';
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

class LeftNav extends Component {
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
                    <div id="pipeline">
                    </div>
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
        return <div id="content">
            <div className="container-fluid p-0" id={"geoViewer"}>

            </div>
        </div>;
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
                document.querySelector('#pipeline')
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

        //Todo 待优化 start
        // function onChange(event) {
        //     console.log(event);
        // }
        function onChange(event) {
            console.log(event);
        }
        render(
            <GitTreeWidget nodes={pipeline_node} onChange={onChange}/>,
            document.querySelector('#pipeline')
        );
        //end 待优化

        let geoViewer = document.getElementById("geoViewer");
        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
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