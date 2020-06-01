// 対象ディレクトリのmp4動画をすべてアップロードする

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const apis = require('./google_photo_apis.js');

const limit_size = Number(process.env.MaximumOnce);
const target_dir = path.resolve(process.env.uploadAllOfFileTarget);
const album_list = fs.readdirSync(target_dir, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(({ name }) => name);
var Processed = 0;

const execute = async () => {
    await apis.init();
    for (let album of album_list) {
        // アルバムトークンの取得
        console.log(album)
        const albumToken = await apis.getAlbumToken(album);

        // アルバムにアップロードされているファイル名一覧の取得
        const uploadedFileList = await apis.getAlbumItemList(albumToken);

        // 対象のフォルダに格納されているファイル名一覧の取得(.mp4のみ)
        const media_list = fs.readdirSync(path.resolve(`${target_dir}/${album}`), { withFileTypes: true })
            .filter(dirent => dirent.isFile() && dirent.name.match(/.mp4$/))
            .map(({ name }) => name);

        // アップロード済みのファイルは対象外
        let targetList = media_list.filter(media => uploadedFileList.indexOf(media) == -1);
        targetList.sort((a,b)=>{
            let A = a.replace(/.[m,M][p,P]4$/,"").split(" ")[0].replace(/^#/,"");
            let B = b.replace(/.[m,M][p,P]4$/,"").split(" ")[0].replace(/^#/,"");
            if(!isNaN(A) && !isNaN(B)){
                A = Number(A);
                B = Number(B);
            }
            
            if(isNaN(A) == isNaN(B)){
                if(A<B) return -1
                if(A>B) return 1
                return 0
            }

            if(isNaN(A)) return 1
            if(isNaN(B)) return -1
            return 0
        })


        for (let media of targetList) {
            const target = path.resolve(`${target_dir}/${album}/${media}`);
            const file_size = size = fs.statSync(target).size;

            // 処理限度サイズを超えるなら飛ばす
            if (limit_size < Processed + file_size) return;

            await apis.fileUpload(albumToken, target, "", file_size);
            Processed += file_size; 
            console.log(`${album} ${media}`)
            console.log(Processed)
        }
    }

}


execute().then(res => {
    console.log("updeted");
}).catch(e => {
    console.log(e);
});