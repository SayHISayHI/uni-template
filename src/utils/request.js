import { token } from './tool';
import { BASE_URL } from './configs';
import { hex_md5 } from './encrypt-md5';
import store from '../store/index';

function _request({ url = '', method = 'GET', data = {}, success, blank, fail, complete }) {
    let subUrl = url;
    let _token = token.get();
    let header = { Version: 9999 };
    url = BASE_URL + url;
    if (_token) header.token = _token;
    data = _pretreatmentData(data);
    store.commit('handleRequestNum', 1)
    uni.request({
        url,
        method,
        header,
        data: {
            params: JSON.stringify(data)
        },
        success: (res) => {
            // 刷新token
            if (res.header.token) {
                token.set(res.header.token)
            }
            if (_checkCode(res.data)) {
                console.log(subUrl + ' :', res.data.data);
                if (res.data.code == 2000 && typeof success == 'function') success(res.data.data);
                if (res.data.code == 2001 && typeof blank == 'function') blank(res.data.data);
            } else {
                if (typeof fail == 'function') {
                    fail(res.data)
                } else {
                    toast(`请求失败，${res.data.msg},错误码${res.data.code}`)
                }
            }
        },
        fail: (res) => {
            toast(`fail,${res.errMsg},error code${res.statusCode}`);
        },
        complete: (res) => {
            store.commit('handleRequestNum', -1)
            if (typeof complete == 'function') {
                complete(res.data)
            }
        }
    });
}

function _pretreatmentData(data) {
    let encryptionStr = 'NgyEBvJwVaf8pqb9ol5x6lrBjb5aEZ5w';
    let timestamp = ~~(Date.now() / 1000);
    let nonce = _generateString(6);
    data.timestamp = timestamp;
    data.nonce = nonce;
    // console.log('待签名 :', data);
    // console.log('_encodeData(data) :', _encodeData(data));
    data.sign = hex_md5(encryptionStr + _encodeData(data) + encryptionStr);
    return data
}

function _generateString(length) {
    let str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let string = '';
    for (let i = 0; i < length; i++) {
        string += str[Math.floor(Math.random() * str.length)]
    }
    return string
}

function _handleCell (cell, sumStr, key) {
    // console.log('cell :', cell);
    if (typeof cell == 'object') {
        if (Array.isArray(cell)) {
            // 数组
            cell.forEach((e, index) => {
                // sumStr = handleCell(e, sumStr, `${key}%5B${index}%5D`)
                sumStr = _handleCell(e, sumStr, `${key}%5B${index}%5D`)
            })
        } else {
            // 对象
            let keyArr = Object.keys(cell);
            keyArr.forEach((e, index) => {
                sumStr = _handleCell(cell[e], sumStr, `${key}[${e}]`)
            })
        }
    } else {
        sumStr += `${encodeURIComponent(key)}=${encodeURIComponent(cell)}&`
    }
    // console.log('sumStr :', sumStr);
    return sumStr
}

function _encodeData(data) {
    let str = '';
    let arr = Object.keys(data);
    arr.sort();
    // console.log('arr :>> ', arr);
    for (let e of arr) {
        str += _handleCell(data[e], '', e)
    }
    str = str.slice(0, str.length - 1);
    return str
}

function _checkCode(data) {
    switch (data.code) {
        case 2000:
        case 2001:
            return true
        case 4001:
        case 4003:
            token.remove();
            toast('登陆状态失效，请重新登录');
            let timer1 = setTimeout(() => {
                uni.navigateTo({
                    url: '/pages/sign/phone'
                });
                clearTimeout(timer1)
            }, 1200);
            return true
        case 4002:
            toast('请登陆后继续');
            let timer2 = setTimeout(() => {
                uni.navigateTo({
                    url: '/pages/sign/phone'
                });
                clearTimeout(timer2)
            }, 1200);

            return true
        default:
            return false
    }
}


export const request = {
    get: (options) => {
        options.method = 'GET';
        _request(options)
    },
    post: (options) => {
        options.method = 'POST';
        _request(options)
    },
    put: (options) => {
        options.method = 'PUT';
        _request(options)
    },
    del: (options) => {
        options.method = 'DELETE';
        _request(options)
    },
}