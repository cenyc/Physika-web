import JSZip from 'jszip';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';

function test(frameSeq) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let obj = {
                test: 1
            };
            console.log("111");
            //frameSeq.push(obj);
            resolve(frameSeq);
        }, 2000);
    });
}

function loadOBj(options) {
    const frameSeq = [];

    return new Promise((resolve, reject) => {
        if (options.file) {
            if (options.ext === 'obj') {
                const reader = new FileReader();
                //处理load事件，该事件在读取操作完成时触发
                reader.onload = function onload(e) {
                    const objReader = vtkOBJReader.newInstance();
                    objReader.parseAsText(reader.result);
                    const nbOutputs = objReader.getNumberOfOutputPorts();
                    for (let i = 0; i < nbOutputs; i++) {
                        const polydata = reader.getOutputData(i);
                        const mapper = vtkMapper.newInstance();
                        const actor = vtkActor.newInstance();
                        let name = polydata.get('name').name;
                        if (!name) {
                            name = i;
                        }

                        actor.setMapper(mapper);
                        mapper.setInputData(polydata);

                        const curFrame = {};
                        curFrame[name] = { polydata, mapper, actor };
                    }
                    frameSeq.push(curFrame);
                    resolve(frameSeq);
                };
                //开始读取指定的Blob中的内容
                reader.readAsText(options.file);
            }
            else {
                console.log("6666");
                test(frameSeq)
                    .then(res => {
                        if (res.length==0) {
                            //此处发出的reject由loadOBj接收处理
                            reject("frameSeq is null!");
                        }
                        resolve(frameSeq);
                    })
                    .catch(res => {
                        //此处的catch处理loadZipContent发出的异常
                        console.log("zip处理失败: ",res);
                    });
            }
        }
        else if (options.fileURL) {
            console.log("url");
            resolve([]);
        }
        else {
            reject("不支持该文件格式！");
        }
    });
}

async function loadOBj(options){
    const frameSeq = [];

    if (options.file) {
        if (options.ext === 'obj') {
            const reader = new FileReader();
            //处理load事件，该事件在读取操作完成时触发
            reader.onload = function onload(e) {
                const objReader = vtkOBJReader.newInstance();
                objReader.parseAsText(reader.result);
                const nbOutputs = objReader.getNumberOfOutputPorts();
                for (let i = 0; i < nbOutputs; i++) {
                    const polydata = reader.getOutputData(i);
                    const mapper = vtkMapper.newInstance();
                    const actor = vtkActor.newInstance();
                    let name = polydata.get('name').name;
                    if (!name) {
                        name = i;
                    }

                    actor.setMapper(mapper);
                    mapper.setInputData(polydata);

                    const curFrame = {};
                    curFrame[name] = { polydata, mapper, actor };
                }
                frameSeq.push(curFrame);
                return await Promise.resolve(frameSeq);
            };
            //开始读取指定的Blob中的内容
            reader.readAsText(options.file);
        }
        else {
            console.log("6666");
            test(frameSeq)
                .then(res => {
                    if (res.length==0) {
                        //此处发出的reject由loadOBj接收处理
                        reject("frameSeq is null!");
                    }
                    resolve(frameSeq);
                })
                .catch(res => {
                    //此处的catch处理loadZipContent发出的异常
                    console.log("zip处理失败: ",res);
                });
        }
    }
    else if (options.fileURL) {
        console.log("url");
        resolve([]);
    }
    else {
        reject("不支持该文件格式！");
    }
}

export {
    loadOBj as physikaLoadObj
};

function loadZipContent(zipContent, renderWindow, renderer) {
    const fileContents = { obj: {}, mtl: {}, img: {} };
    const zip = new JSZip();
    zip.loadAsync(zipContent).then(() => {
        let workLoad = 0;

        function done() {
            if (workLoad !== 0) {
                return;
            }

            // Attach images to MTLs
            const promises = [];
            Object.keys(fileContents.mtl).forEach((mtlFilePath) => {
                const mtlReader = fileContents.mtl[mtlFilePath];
                const basePath = mtlFilePath
                    .split('/')
                    .filter((v, i, a) => i < a.length - 1)
                    .join('/');
                mtlReader.listImages().forEach((relPath) => {
                    const key = basePath.length ? `${basePath}/${relPath}` : relPath;
                    const imgSRC = fileContents.img[key];
                    if (imgSRC) {
                        promises.push(mtlReader.setImageSrc(relPath, imgSRC));
                        console.log('register promise');
                    }
                });
            });

            Promise.all(promises).then(() => {
                console.log('load obj...');
                // Create pipeline from obj
                Object.keys(fileContents.obj).forEach((objFilePath) => {
                    const mtlFilePath = objFilePath.replace(/\.obj$/, '.mtl');
                    const objReader = fileContents.obj[objFilePath];
                    const mtlReader = fileContents.mtl[mtlFilePath];

                    const size = objReader.getNumberOfOutputPorts();
                    for (let i = 0; i < size; i++) {
                        const source = objReader.getOutputData(i);
                        const mapper = vtkMapper.newInstance();
                        const actor = vtkActor.newInstance();
                        const name = source.get('name').name;

                        actor.setMapper(mapper);
                        mapper.setInputData(source);
                        renderer.addActor(actor);

                        if (mtlReader && name) {
                            mtlReader.applyMaterialToActor(name, actor);
                        }
                    }
                });
                renderer.resetCamera();
                renderWindow.render();
            });
        }

        zip.forEach((relativePath, zipEntry) => {
            if (relativePath.match(/\.obj$/i)) {
                workLoad++;
                zipEntry.async('string').then((txt) => {
                    const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
                    reader.parseAsText(txt);
                    fileContents.obj[relativePath] = reader;
                    workLoad--;
                    done();
                });
            }
            if (relativePath.match(/\.mtl$/i)) {
                workLoad++;
                zipEntry.async('string').then((txt) => {
                    const reader = vtkMTLReader.newInstance({
                        interpolateTextures: !userParams.noInterpolation,
                    });
                    reader.parseAsText(txt);
                    fileContents.mtl[relativePath] = reader;
                    workLoad--;
                    done();
                });
            }
            if (relativePath.match(/\.jpg$/i) || relativePath.match(/\.png$/i)) {
                workLoad++;
                zipEntry.async('base64').then((txt) => {
                    const ext = relativePath.slice(-3).toLowerCase();
                    fileContents.img[relativePath] = `data:image/${ext};base64,${txt}`;
                    workLoad--;
                    done();
                });
            }
        });
    });
}