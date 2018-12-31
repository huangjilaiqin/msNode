
var crypto = require('crypto');
//查看所有支持的加密方式 const ciphers = crypto.getCiphers(); ['aes-128-cbc', 'aes-128-ccm', ...]
//
function paddingSize(blockSize,textSize){
    return blockSize-textSize%blockSize;
}

function zeroPadding(textBin){
    //console.log("old bin size:",textBin.length);
    let padSize=paddingSize(16,textBin.length);
    //console.log("padSize:",padSize);
    let newBin=Buffer.alloc(textBin.length+padSize,textBin);
    //console.log("oldBin:",newBin.toString());
    for(var i=textBin.length;i<newBin.length;i++)
        newBin[i]=0;
    //console.log("newBin:",newBin.toString(),newBin.length);
    //for(var i=0;i<newBin.length;i++)
    //  console.log(newBin[i]);
    return newBin;
}

function zeroUnPadding(textBin){
    while(1 && textBin.length>0){
        console.log(textBin.length,textBin[textBin.length-1]);
        if(textBin[textBin.length-1]=='\u0000')
            textBin.pop();
        else
            break;
    }
    return textBin;
}

var paddingmodeArray=[0,5,7];

var encrypt = function (data, algorithm, key, paddingmode, iv) {
    console.log(data, algorithm, key, paddingmode, iv);
    if(paddingmodeArray.indexOf(paddingmode)==-1)
      throw new Error("paddingmode must in "+JSON.stringify(paddingmodeArray));

    if(iv)
        var cipher = crypto.createCipheriv(algorithm, key, iv);
    else
        var cipher = crypto.createCipher(algorithm, key);
    /*
    if(paddingmode==0){
        cipher.setAutoPadding(false);
        var databin=new Buffer(data, 'utf8');
        data=zeroPadding(databin).toString();
        //console.log(data.length);
    }
    */
    cipher.setAutoPadding(true);
    var crypted = cipher.update(data, 'utf8', 'binary');
    crypted += cipher.final('binary');
    crypted = new Buffer(crypted, 'binary').toString('base64');
    return crypted;
};

/*
* 解密方法
* @param key      解密的key
* @param iv       向量
* @param crypted  密文
* @returns string
*
*/
var decrypt = function (crypted, algorithm, key, paddingmode, iv) {
    if(paddingmodeArray.indexOf(paddingmode)==-1)
      throw new Error("paddingmode must in "+JSON.stringify(paddingmodeArray));
    var crypted = new Buffer(crypted, 'base64').toString('binary');
    if(iv)
        var decipher = crypto.createDecipheriv(algorithm, key, iv);
    else
        var decipher = crypto.createDecipheriv(algorithm, key);

    /*
    if(paddingmode==0){
        decipher.setAutoPadding(false);
    }
    */

    decipher.setAutoPadding(true);
    var decoded = decipher.update(crypted, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    console.log(typeof(decoded));

    /*
    if(paddingmode==0){
        decoded = zeroUnPadding(decoded);
    }
    */
    return decoded;
};

exports.encrypt_128_cbc = function (data, key, iv, paddingmode=0) {
    return encrypt(data, 'aes-128-cbc', key, paddingmode, iv);
};

exports.decrypt_128_cbc = function (crypted, key, iv, paddingmode=0) {
    return decrypt(crypted, 'aes-128-cbc', key, paddingmode, iv);
};

exports.encrypt_128_ecb = function (data, key, paddingmode=0) {
    return encrypt(data, 'aes-128-ecb', key, paddingmode);
};

exports.decrypt_128_ecb = function (crypted, key, paddingmode=0) {
    return decrypt(crypted, 'aes-128-ecb', key, paddingmode);
};


