import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';


function loadOBj(options) {
    const frameSeq = [];

    if (options.file) {
        if (options.ext === 'obj') {
            const reader = new FileReader();
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
                }
            };
            reader.readAsText(options.file);
        }
        else{
            
        }
    }
}