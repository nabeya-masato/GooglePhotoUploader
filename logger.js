// const log4js = require('log4js');
// require('dotenv').config();

// // logger定義
// log4js.configure({
//     appenders : {
//       system : {
//           type : 'dateFile', 
//           filename : process.env.logPath,
//           pattern: '-yyyy-MM-dd',
//           backups: 30,
//           compress: false
//       },
//       console: { type: 'console' }
//     },
//     categories : {
//       default : {appenders : ['system', 'console'], level : 'debug'},
//     }
// });

// module.exports = log4js.getLogger('system');

module.exports = {
  error(e){console.log(e)},
  info(e){console.log(e)}
}