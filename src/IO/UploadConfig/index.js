import { deepCopy } from '../../Common'
import { buildDataStructure } from '../BuildDataStructure'

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
function uploadConfig(data, simType) {
    console.log("开始上传");
    //jsonObj为导出xml的json对象
    let jsonObj = {};
    let obj = {};
    //必须用deepcopy，因为在深拷贝中会将html标签省略掉！！
    //如果不去掉html，将会产生循环引用
    buildJson(obj, deepCopy(data));
    jsonObj._declaration = {
        _attributes: {
            version: "1.0",
            encoding: "utf-8"
        },
        Scene: {}
    }
    jsonObj.Scene = obj.Scene;
    console.log(jsonObj);
    //reqBody为传入后端的请求对象
    let reqBody = {
        "simType": simType,
        "jsonObj": jsonObj
    };

    //fetch是异步操作，
    //需要使用promise保证该函数能返回正确的data值
    return new Promise((resolve, reject) => {
        fetch('/uploadconfig', {
            method: 'POST',
            body: JSON.stringify(reqBody),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.text())
            .catch(error => console.error('Error:', error))
            .then(res => {
                let resConfig = JSON.parse(res);
                resolve(buildDataStructure(resConfig));
                console.log("上传完成,返回模拟数据");
            });
    });
}

export {
    uploadConfig as physikaUploadConfig
};