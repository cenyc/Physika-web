import { deepCopy, isObject } from '../../Common'

//构建符合ant Tree数据结构第一步（通过递归将每层对象的成员组织成数组形式）
//其中node为当前遍历的对象，tag为当前对象的标签名
function buildNode(node, tag) {
    let childNode = [];
    Object.keys(node).map((nodeKey, index) => {
        if (nodeKey === '_attributes') {
            //如果存在'_text'属性，则为叶子结点
            if (Object.keys(node).includes('_text')) {
                childNode.push(
                    {
                        _attributes: node._attributes,
                        _text: node._text,
                        tag: tag
                    }
                );
            }
            else {
                childNode.push(
                    {
                        _attributes: node._attributes,
                        tag: tag
                    }
                );
            }
        }
        else if (nodeKey === '_text') {
            //空过
            //console.log("_text:", node[nodeKey]);
        }
        else {
            if (Array.isArray(node[nodeKey])) {
                node[nodeKey].map((obj, index) => {
                    childNode.push(buildNode(obj, nodeKey));
                })
            }
            else if (isObject(node[nodeKey])) {
                if (nodeKey === '_attributes') {
                    //如果nodeKey为'_attributes'，
                    //则表明即将存储当前tag的属性，所以应将当前的tag名作为tag
                    childNode.push(buildNode(node[nodeKey], tag));
                }
                else {
                    //如果nodeKey不为'_attributes'，
                    //则表明即将存储当前tag的孩子的属性，所以应将nodeKey名作为tag
                    childNode.push(buildNode(node[nodeKey], nodeKey));
                }
            }
            else {
                console.log("buildNode有问题:", node[nodeKey]);
            }
        }
    });
    return childNode;
}

//构建符合ant Tree数据结构data
function buildDataStructure(config) {
    //注意传入buildNode函数中的对象为initConfig.Node!（初始化传入的是根节点的tag）
    let childNode = buildNode(config.Scene, 'Scene');
    console.log(childNode);

    //每一层都含有一个包含当前结点属性的对象，
    //通过递归将每一层除了当前结点属性的对象以外的其他成员全部作为当前结点的子结点，
    //并将其他成员插入到当前结点属性的对象中的children数组中。
    const traverseNode = (node, key) => {
        //如果node长度为1，则该node只包含一个叶子结点（即当前结点属性的Object）
        if (node.length === 1) {
            node[0].key = key;
            return node[0];
        }
        else {
            //fatherIndex用于存储当前层的包含当前结点属性的对象的索引
            //childNode用于存储当前层的结点
            let fatherIndex;
            let childNode = {};
            node.map((item, index) => {
                if (isObject(item)) {
                    fatherIndex = index;
                    childNode = item;
                    childNode.key = key;
                    childNode.children = [];
                }
            });
            //找到包含当前结点属性的对象后，从当前node删除它，然后再遍历其他子结点成员
            node.splice(fatherIndex, 1);
            node.map((item, index) => {
                childNode.children.push(traverseNode(item, key + '-' + index));
            });
            return childNode;
        }

    };
    let data = [];
    data.push(traverseNode(deepCopy(childNode), '0'));
    console.log(data);
    return data;
}

export {
    buildDataStructure
};