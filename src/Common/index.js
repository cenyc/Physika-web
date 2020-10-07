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

export {deepCopy, isObject};