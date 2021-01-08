import JSZip from 'jszip';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

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

    /*
    //是否需要对体素进行一些通用的操作？
    const dataArray = source.getPointData().getScalars() || source.getPointData().getArrays()[0];
    const dataRange = dataArray.getRange();
    const lookupTable = vtkColorTransferFunction.newInstance();
    const piecewiseFunction = vtkPiecewiseFunction.newInstance();

    lookupTable.addRGBPoint(0, 85 / 255.0, 0, 0);
    lookupTable.addRGBPoint(95, 1.0, 1.0, 1.0);
    lookupTable.addRGBPoint(225, 0.66, 0.66, 0.5);
    lookupTable.addRGBPoint(255, 0.3, 1.0, 0.5);

    piecewiseFunction.addPoint(0.0, 0.0);
    piecewiseFunction.addPoint(255.0, 1.0);

    const sampleDistance = 0.7 * Math.sqrt(
        source.getSpacing()
            .map(v => v * v)
            .reduce((a, b) => a + b, 0)
    );
    mapper.setSampleDistance(sampleDistance);
    actor.getProperty().setRGBTransferFunction(0, lookupTable);
    actor.getProperty().setScalarOpacity(0, piecewiseFunction);
    actor.getProperty().setInterpolationTypeToLinear();
    //为了更好地查看体积，世界坐标中的绘制距离标量不透明度为1.0
    actor.getProperty().setScalarOpacityUnitDistance(
        0,
        vtkBoundingBox.getDiagonalLength(source.getBounds()) / Math.max(...source.getDimensions())
    );
    //表面边界，max应该在体积的平局梯度附近，或是平均值加上该梯度幅度一个标准偏差
    //（针对间距进行调整，这是世界坐标梯度，而不是像素梯度）
    //max的较好取值大小为：(dataRange[1] - dataRange[0]) * 0.05
    actor.getProperty().setGradientOpacityMinimumValue(0, 0);
    actor.getProperty().setGradientOpacityMaximumValue(0, (dataRange[1] - dataRange[0]) * 0.05);
    //使用基于渐变的阴影
    actor.getProperty().setShade(true);
    actor.getProperty().setUseGradientOpacity(0, true);
    //默认良好设置
    actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
    actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
    */

    actor.getProperty().setAmbient(0.2);
    actor.getProperty().setDiffuse(0.7);
    actor.getProperty().setSpecular(0.3);
    actor.getProperty().setSpecularPower(8.0);


    //后期若实现模型导出功能，则需考虑返回对象中添加reader
    return { source, mapper, actor };
}

function initVti(arraybuffer, ext) {
    return new Promise((resolve, reject) => {
        const vtiReader = vtkXMLImageDataReader.newInstance();
        if (ext === 'vti') {
            vtiReader.parseAsArrayBuffer(arraybuffer);
            resolve(initializeVti(vtiReader));
        }
        else if (ext === 'zip') {
            const zip = new JSZip();
            zip.loadAsync(arraybuffer)
                .then(() => {
                    zip.forEach((relativePath, zipEntry) => {
                        //正则表达式：两个斜杠（/）之间是模式；反斜杠（\）代表转义；$代表匹配结束；i为标志，表示不区分大小写搜索。
                        if (relativePath.match(/\.vti$/i)) {
                            zipEntry.async('arraybuffer')
                                .then(res => {
                                    vtiReader.parseAsArrayBuffer(res);
                                    resolve(initializeVti(vtiReader));
                                })
                                .catch(err => {
                                    reject(err);
                                });
                        }
                        else {
                            return Promise.reject('压缩文件中不是vti文件！')
                        }
                    });
                })
                .catch(err => {
                    console.log("Failed to init vti: ", err);
                })
        }
        else {
            reject('数据格式错误！')
        }
    });
}

export {
    initVti as physikaInitVti
}