import { Modal, Button, Form, Col, Row } from 'react-bootstrap';
import 'bootstrap';
import React from 'react';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

//坐标轴
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
//旋转控制控件
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';

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

class ClothSimulation2 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            Node: {}

        };

        //this.analyzeInitConfig=this.analyzeInitConfig.bind(this);
        this.renderNode=this.renderNode.bind(this);
    }

    componentDidMount() {
        let reqInitConfig = {
            simType: 0,
            log: "Request cloth simulation initialization file..."
        };

        this.initConfig;
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
                this.initConfig = JSON.parse(res);
                console.log(this.initConfig);
                this.setState({
                    Node: deepCopy(this.initConfig.Node)
                }, () => {
                    console.log(this.state.Node);
                });
            });
        //--------------------------

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

    //插入的dom结点最后需要用数组返回
    renderNode(node) {
        let dom=[];
        Object.keys(node).map((nodeKey, index) => {
            if (nodeKey === '_attributes') {
                if (Object.keys(node).includes('_text')) {
                    dom.push(
                        <div key={index}>
                            <Button variant="outline-danger">{node[nodeKey].name}</Button>
                        </div>
                    )
                }
                else {
                    dom.push(
                        <div key={index}>
                            <Button variant="outline-primary">{node[nodeKey].name}</Button>
                        </div>
                    )
                }
            }
            else if (nodeKey === '_text') {
                console.log("_text:", node[nodeKey]);
            }
            else {
                
                if (Array.isArray(node[nodeKey])) {

                    node[nodeKey].map((obj, index) => {
                        dom.push(this.renderNode(obj));

                    })
                    
                }
                else if (isObject(node[nodeKey])) {
                    
                    dom.push(this.renderNode(node[nodeKey]));
                    
                }
            }
        });
        console.log(dom);
        return dom;
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
        //console.log("render");
        return (
            <div className="w-100">
                <div className="card border rounded-0"><span className="text-center m-1">布料仿真</span>
                    <hr className="m-0" />
                    <div className="card-body pt-2">
                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" ><span className="glyphicon glyphicon-plus">场景</span></button>
                        <div id="nodeTree" className="pt-2">
                            {this.renderNode(this.state.Node)}
                        </div>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" ><span className="glyphicon glyphicon-plus">材料属性</span></button>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" ><span className="glyphicon glyphicon-plus">边界条件</span></button>

                        <button className="btn btn-danger btn-sm p-0 btn-block" type="button" onClick={this.uploadConfigPara}><span className="glyphicon glyphicon-plus">上传</span></button>

                    </div>
                    <div >

                    </div>
                </div>
            </div>
        );
    }
}

export { ClothSimulation2 }