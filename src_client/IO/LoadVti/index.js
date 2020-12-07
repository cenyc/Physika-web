import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import HttpDataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';

//vtkColorTransferFunction是RGB或HSV空间中的一种颜色映射
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
//vtkPiecewiseFunction用于定义分段函数映射
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

function initializeVti(vtiReader) {
    const source = vtiReader.getOutputData(0);
    const mapper = vtkVolumeMapper.newInstance();
    const actor = vtkVolume.newInstance();

    mapper.setInputData(source);
    actor.setMapper(mapper);

    //是否需要对体素进行一些通用的操作？
    const dataArray = source.getPointData().getScalars() || source.getPointData().getArrays()[0];
    const dataRange = dataArray.getRange();

    const lookupTable = vtkColorTransferFunction.newInstance();
    const piecewiseFunction = vtkPiecewiseFunction.newInstance();

    //-----

    return { source, mapper, actor };
}

function loadVti(options) {
    const frameSeq = [];
    console.log(options);
    return new Promise((resolve, reject) => {
        if (options.file) {
            if (options.ext === 'vti') {
                const vtiReader = new vtkXMLImageDataReader.newInstance();
                const fileReader = new FileReader();
                fileReader.onload = function onLoad(e) {
                    vtiReader.parseAsArrayBuffer(fileReader.result);
                    frameSeq.push(initializeVti(vtiReader));
                    resolve(frameSeq);
                }
                fileReader.readAsArrayBuffer(options.file);
            }
            else {
                //读取本地包含多个vti文件的zip？
            }
        }
        else if (options.fileURL) {
            if (options.ext === 'vti') {
                const vtiReader = new vtkXMLImageDataReader.newInstance();
                HttpDataAccessHelper.fetchBinary(options.fileURL)
                    .then(res => {
                        vtiReader.parseAsArrayBuffer(res);
                        frameSeq.push(initializeVti(vtiReader));
                        resolve(frameSeq);
                    })
                    .catch(err => {
                        console.log("Failed to fetch .vti through url: ", err);
                    })
            }
            else {
                //读取url包含多个vti文件的zip？
            }
        }
        else {
            reject("不支持该文件格式！");
        }
    });
}

export {
    loadVti as physikaLoadVti
}