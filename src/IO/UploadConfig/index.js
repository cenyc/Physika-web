import {deepCopy} from '../../Common'

const buildJson = (father, children) => children.map(item => {
    if (!father.hasOwnProperty(item.tag)) {
        father[item.tag] = [];
    }
    father[item.tag].push(item);
    if (item.hasOwnProperty('children')) {
        buildJson(item, item.children);
        delete item.children;
    }
    delete item.key;
    delete item.tag;
});

//上传数据到服务器
function uploadConfigPara(data){
    console.log("开始上传");
    let json = {};
    let obj = {};
    buildJson(obj, deepCopy(data));
    json._declaration = {
        _attributes: {
            version: "1.0",
            encoding: "utf-8"
        },
        Scene: {}
    }
    json.Scene = obj.Scene;
    console.log(json);


    fetch('/uploadconfig', {
        method: 'POST',
        body: JSON.stringify(json),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    }).then(res => res.text())
        .catch(error => console.error('Error:', error))
        .then(res => {
            console.log('Success:');
            let result = JSON.parse(res);
            console.log(result);
            console.log("上传完成");
        });
}

export {
    uploadConfigPara as physikaUploadConfig
}