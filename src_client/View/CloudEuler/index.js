import 'bootstrap';
import React from 'react';
import { Tree, Button } from 'antd';
import { BiShow, BiHide, BiPointer, BiMinus } from 'react-icons/bi'
const { TreeNode } = Tree;
//antd样式
import 'antd/dist/antd.css';
//渲染窗口
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
//坐标轴
import vtkAxesActor from 'vtk.js/Sources/Rendering/Core/AxesActor';
//旋转控制控件
import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';

import { physikaLoadConfig } from '../../IO/LoadConfig'
import { physikaUploadConfig } from '../../IO/UploadConfig'
import { PhysikaTreeNodeAttrModal } from '../TreeNodeAttrModal'
import {physikaLoadVti} from '../../IO/LoadVti'

class CloudEulerSimulation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

            data: [],
            isTreeNodeAttrModalShow: false,
            treeNodeAttr: {},
            treeNodeText: "",
            treeNodeKey: -1

        };
    }

    componentDidMount() {
        //---------初始化渲染窗口
        this.fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
            background: [0, 0, 0],
            rootContainer: geoViewer,
            containerStyle: { height: '100%', width: '100%', position: 'absolute' }
        });
        this.renderer = this.fullScreenRenderer.getRenderer();
        this.renderWindow = this.fullScreenRenderer.getRenderWindow();
        //curScene={{source, mapper, actor},...}
        this.curScene = {};
        //frameSeq保存了每帧场景，用于实现动画
        this.frameSeq = [];

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

    load = () => {
        physikaLoadConfig('fluid')
            .then(res => {
                console.log("成功获取初始化配置");
                let options = this.extractURL(res);
                return Promise.all([physikaLoadVti(options), res]);
            })
            .then(res=>{
                //---------
            })
    }

    //从配置文件中提取模型的url
    extractURL = (data) => {
        for (const item of data[0].children) {
            if (item.tag == 'Path') {
                const url = item._text;
                const ext = url.substring(url.lastIndexOf('.') + 1);
                return { fileURL: url, ext: ext };
            }
        }
        console.log("throw error");
    }

}
