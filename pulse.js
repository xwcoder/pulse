var fs = require( 'fs' );
var path = require( 'path' );
var readline = require('readline');

var setting = require( './setting' );
//var config = require( './config' );

var compressor = require( './lib/compressor' );
var uploader = require( './lib/uploader' );
var appUtil = require( './lib/util' );
var hinter = require( './lib/hinter' );

// 处理命令行参数 命令行状态机
var commonds = {};
var args = process.argv.slice( 2 );

var configFilePath = './config';

args.forEach( function ( arg, index ) {
    if ( arg == '-f' && args[ index + 1 ] ) {
        console.log( 'xxxx' );
        configFilePath = args[ index + 1 ];
    } else {
        if ( /^-/.test( arg ) ) {
            arg = arg.replace( '-', '' ).split( '' );
            arg.forEach( function ( arg ) {
                commonds[ '-' + arg ] = true;
            } );
        } else {
            commonds[ arg ] = true;
        }
    }
} );

if ( /^[^\.\/]/.test( configFilePath ) ) {
    configFilePath = './' + configFilePath;
}

var config = require( configFilePath );

// 去掉默认命令 强制指明某个命令
if ( !commonds[ '-m' ] &&
        !commonds[ '-p' ] &&
        !commonds[ '-l' ] &&
        !commonds[ '-c' ] ) {
    commonds[ '-h' ] = true;
}

// 读取文件清单 listFile
function readListFileNames () {
    var fileNames = fs.readFileSync( config.listFile, { encoding : 'utf-8' } );

    fileNames = fileNames.split( '\n' );
    fileNames = fileNames.filter( function ( filename ) {
        return filename && filename.trim();
    } );

    return fileNames;
}

//压缩并上传 指令: -m -p; -mp; -pm; -p -m
function compressAndUpload () {

    compress();
    
    compressor.on( 'done', function () {
        upload();
    } );
}

//压缩并上传到测试机 指令: -m -t; -mt; -tm; -t -m
function compressAndTupload () {
    compress();
    
    compressor.on( 'done', function () {
        tUpload();
    } );
}

//压缩 指令: -m
function compress () {

    compressor.init( config, setting );

    compressor.compress( readListFileNames() );
}

// 上传 指令: -p
function upload () {

    uploader.init( config, setting );

    var pListFile = config.pListFile;

    if ( !pListFile ) {
        pListFile = path.resolve( path.dirname( config.listFile ), 'plist.txt' );
    }

    var fileNames = fs.readFileSync( pListFile, { encoding : 'utf-8' } );

    fileNames = fileNames.split( '\n' );
    fileNames = fileNames.filter( function ( filename ) {

        return filename && filename.trim();

    } );
    fileNames = appUtil.unique( fileNames );

    console.log( '上线文件清单：' );
    console.log( fileNames.join( '\n' ) );
    console.log();

    process.stdin.setEncoding('utf8');
    var rl = readline.createInterface( {
      input : process.stdin,
      output : process.stdout
    } );

    rl.question( 'Are you sure to upload those files(y/n)?', function ( data ) {

        data = data.trim();

        if ( data == 'n' || data == 'y' ) {
            rl.close();
        }

        if ( data == 'y' ) {
            uploader.ftpUpload( fileNames );
        }
    } );
}

// 上传到测试机 指令: -t 直接copy upload 需优化
function tUpload () {

    uploader.init( config, setting );

    var pListFile = config.pListFile;

    if ( !pListFile ) {
        pListFile = path.resolve( path.dirname( config.listFile ), 'plist.txt' );
    }

    var fileNames = fs.readFileSync( pListFile, { encoding : 'utf-8' } );

    fileNames = fileNames.split( '\n' );
    fileNames = fileNames.filter( function ( filename ) {

        return filename && filename.trim();

    } );
    fileNames = appUtil.unique( fileNames );


    uploader.tFtpUpload( fileNames );

}

// jshint 指令: -l
function hint () {

    hinter.init( config, setting );
    hinter.hint( readListFileNames() );
}

function init () {
    appUtil.writeFile( config.logFile, '' );
}

init();

/**
 * 有限状态机
 *  -m : 压缩
 *  -t : 上传到测试机
 *  -p : 上传到正式文件服务器
 *  -m -t : 压缩并上传到测试机
 *  -m -p : 压缩并上传
 *  -l : jshint
 *  -h : help
 */
if ( commonds[ '-m' ] && commonds[ '-p' ] ) {

    compressAndUpload();

} else if ( commonds[ '-m' ] && commonds[ '-t' ] ) {

    compressAndTupload();

} else if ( commonds[ '-p' ] ) {

    upload();

} else if ( commonds[ '-t' ] ) {
    tUpload();
} else if ( commonds[ '-l' ] ) {

    hint();

} else if ( commonds[ '-m' ] ) {

    compress();

} else if ( commonds[ '-c' ] ) {
    appUtil.clean( config.build_dir );
} else if ( commonds[ '-h' ] ) {

    var content = '支持命令：\n' +
         '-m : 压缩\n' +
         '-p : ftp上传到文件服务器\n' +
         '-t : ftp上传到测试服务器\n' +
         '-l : jshint\n' +
         '-h : help info\n' +
         '-f : 指定配置文件' +
         '-m -p(-mp, -pm) : 压缩并上传(-m和-p的组合)\n' +
         '-m -t(-mt, -tm) : 压缩并上传到测试机(-m和-t的组合)\n';

    console.info( content );
}
