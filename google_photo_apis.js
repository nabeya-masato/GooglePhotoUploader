// apiを纏めたmodule

require('dotenv').config();
var album_list = {}
try{
    Object.assign(album_list, require(process.env.albumListPath))
}catch(_){
    // none
}
const logger = require('./logger.js');


const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process')

var access_token;
//　共通ヘッダー定義
const init = async () => {
    let param = {
        refresh_token: process.env.refreshToken,
        client_id: process.env.clientId,
        client_secret: process.env.clientSecret,
        grant_type: "refresh_token"
    }

    try {
        let res = await axios.post("https://www.googleapis.com/oauth2/v4/token", param)
        access_token = res.data.access_token;
        return true;;
    } catch (e) {
        logger.error(e);
        process.exit(-1);
    }
}

// 指定されたアルバム名のトークンを返す
const getAlbumToken = async (album_title) => {
    // リストにidがあればそれを返す
    if (album_list[album_title]) return album_list[album_title];

    const headers = {
        'Content-type': 'application/json',
        Authorization: `Bearer ${access_token}`
    };

    // リストになければアルバムを作成する。
    let param = { "album": { "title": album_title } };

    try {
        let res = await axios.post('https://photoslibrary.googleapis.com/v1/albums', param, { headers: headers })
        album_list[album_title] = res.data.id;
        // リストを更新する
        fs.writeFileSync(process.env.albumListPath, JSON.stringify(album_list));
        return album_list[album_title];
    } catch (e) {
        logger.error(e);
        process.exit(-1);
    }
}

// アルバムリストのリフレッシュ
const refrashAlbumTokenList = async () => {
    let options = {};
    album_list = {};
    const func = async (pageToken)=>{
        options.headers = {
            Authorization: `Bearer ${access_token}`
        }
        if(pageToken){
            options.params = {pageToken};
        } 
        try {
            res = await axios.get('https://photoslibrary.googleapis.com/v1/albums',options);
            res.data.albums.forEach(album=>{
                album_list[album.title] = album.id;
            })
            if(res.data.nextPageToken){
                await func(res.data.nextPageToken);
            }
        } catch (e) {
            logger.error(e);
            process.exit(-1);
        }
    }
    await func();
    fs.writeFileSync('./album.json', JSON.stringify(album_list));

}


const getAlbumItemList = async (albumToken, pageToken) => {
    let mediaItems = [];
    let params = {
        "albumId": albumToken
    };
    const headers = {
        'Content-type': 'application/json',
        Authorization: `Bearer ${access_token}`
    };
    if (pageToken) {
        params.pageToken = pageToken;
    }
    let res = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:search', params, { headers });
    if(res.data.mediaItems) mediaItems.push(...res.data.mediaItems.map(({filename})=>filename));
    if(res.data.nextPageToken){
        mediaItems.push(...await getAlbumItemList(albumToken,res.data.nextPageToken));
    }
    return mediaItems;
}

const fileUpload = async (album_token, file_path, description, size) => {
    let params;
    let config;
    let upload_file_token;
    let file_name = path.basename(file_path);
    // if(is_windows) file_name = escape(file_name)

    // config = {
    //     headers: {
    //         'Content-type': 'application/octet-stream',
    //         Authorization: `Bearer ${access_token}`,
    //         'X-Goog-Upload-Protocol': 'raw',
    //         "X-Goog-Upload-File-Name": encodeURIComponent(file_name)
    //     },
    //     maxContentLength: Infinity,
    //     maxBodyLength: Infinity
    // };
    // params = new FormData();
    // params.append('file', fs.createReadStream(file_path), file_name);
    try {
        // ファイルをアップロードしてアイテムトークンを作成する。
        upload_file_token = execSync(`curl -s -X POST -H "Authorization: Bearer ${access_token}" -H "Content-type: application/octet-stream" -H "X-Goog-Upload-Protocol: raw" --data-binary @"${file_path}" https://photoslibrary.googleapis.com/v1/uploads`).toString()
    } catch (e) {
        logger.error(e);
        process.exit(-1);
    }

    let headers = {
        'Content-type': 'application/json',
        Authorization: `Bearer ${access_token}`
    }
    params = {
        albumId: album_token,
        newMediaItems: [{
	    description:description,
            simpleMediaItem: {
                uploadToken: upload_file_token,
                fileName: file_name
            }
        }]
    }

    try {
        // アイテムトークンからmediaを作成する
        let res = await axios.post('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate',params,{headers:headers})
    } catch (e) {
        logger.error(e);
        process.exit(-1);
    }
}


module.exports = {
    init,
    refrashAlbumTokenList,
    getAlbumToken,
    getAlbumItemList,
    fileUpload
};

