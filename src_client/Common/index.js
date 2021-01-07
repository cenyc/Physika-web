//深拷贝
function deepCopy(obj) {
    var newobj = obj.constructor === Array ? [] : {};
    if (typeof obj !== 'object') {
        return;
    }
    for (var i in obj) {
        //title成员中含有的dom标签在深拷贝时有很多问题！！！！
        if (i !== 'title') {
            newobj[i] = (typeof obj[i] === 'object' && obj[i] !== null) ? deepCopy(obj[i]) : obj[i];
        }
    }
    return newobj;
}

//判断输入对象是否为Object
const isObject = (object) => {
    return Object.prototype.toString.call(object) === '[object Object]';
}

//添加拾取的面片对应的树节点
function addPickedCell(cellId, node) {
    //添加pick对象
    let hasPickObj = false;
    if (!node.hasOwnProperty('children')) {
        node.children = [];
    }
    let pickObjIndex = node.children.length;
    node.children.forEach((item, index) => {
        if (item.tag == 'Pick') {
            hasPickObj = true;
            pickObjIndex = index;
        }
    });
    if (!hasPickObj) {
        let pickOBj = {
            children: [],
            key: `${node.key}-${node.children.length}`,
            tag: 'Pick',
            _attributes: {
                class: 'Pick',
                name: '面片拾取'
            }
        };
        node.children.push(pickOBj);
    }
    //添加面对象
    const pickObj = node.children[pickObjIndex];
    let hasCellObj = false;
    let cellObjIndex = pickObj.children.length;
    pickObj.children.forEach((item, index) => {
        if (item._attributes.name == `cell-${cellId}`) {
            hasCellObj = true;
            cellObjIndex = index;
        }
    });
    if (!hasCellObj) {
        let cellObj = {
            children: [],
            key: `${pickObj.key}-${pickObj.children.length}`,
            tag: 'Cell',
            _attributes: {
                class: 'Cell',
                name: `cell-${cellId}`
            }
        };
        pickObj.children.push(cellObj);
    }
    const cellObj = pickObj.children[cellObjIndex];
    if (cellObj.children.length === 0) {
        let fieldeObj = {
            key: `${cellObj.key}-0`,
            tag: 'Field',
            _text: '0.0 0.0 0.0',
            _attributes: {
                class: 'Vector3f',
                name: '施加力'
            }
        };
        cellObj.children.push(fieldeObj);
    }
    return cellObj.children[0];
}

function parseSimulationResult(data) {
    let simRunObj;
    for (let i = 0; i < data[0].children.length; i++) {
        if (data[0].children[i].tag === 'SimulationRun') {
            simRunObj = data[0].children[i];
            data[0].children.splice(i, 1);
        }
    }
    const resultInfo = {
        fileName: '',
        frameSum: 0,
        animation: false,
        description: []
    }
    for (const item of simRunObj.children) {
        if (item.tag === 'FileName') {
            resultInfo.fileName = item._text;
        }
        if (item.tag === 'FrameSum') {
            resultInfo.frameSum = item._text;
        }
        if (item.tag === 'Animation') {
            resultInfo.animation = (item._text === 'true');
        }
        resultInfo.description.push(
            {
                name: item._attributes.name,
                content: item._text
            }
        );
    }
    return resultInfo;
}

export { deepCopy, isObject, parseSimulationResult, addPickedCell };