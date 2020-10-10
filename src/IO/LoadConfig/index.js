import { buildDataStructure } from '../BuildDataStructure'

function loadConfig(simType) {
    let reqBody = {
        "simType": simType
    };
    console.log(reqBody);

    //fetch是异步操作，
    //需要使用promise保证该函数能返回正确的data值
    return new Promise((resolve, reject) => {
        //-------从服务器获取初始配置
        fetch('/loadConfig', {
            method: 'POST',
            body: JSON.stringify(reqBody),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.text())
            .catch(error => console.error('Error:', error))
            .then(res => {
                let initConfig = JSON.parse(res);
                resolve(buildDataStructure(initConfig));
                console.log("成功获取初始化配置");
            });
    });
}

export {
    loadConfig as physikaLoadConfig,
};

