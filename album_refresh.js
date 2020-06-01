// アルバム情報を全部初期化する

const apis = require('./google_photo_apis.js');

const execute = async () => {
    await apis.init();
    await apis.refrashAlbumTokenList();
};

execute().then(res=>{
    console.log("updeted");
}).catch(e=>{
    console.log(e);
});
