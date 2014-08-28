var fs = require( 'fs' );
var readline = require( 'readline' );
var path = require( 'path' );
var Emitter = require( 'events' ).EventEmitter;


var FTPClient = require( 'ftp' );
var appUtil = require( './util' );


var ftpClient = new FTPClient();
var emitter = new Emitter();

var defaultConnConfig = {
    port : 21
};

var uploader = {

    init : function ( config, setting ) {

        this.config = config || {};
        this.setting = setting || {};
    },
    
    ftpUpload : function ( fileNames ) {
        
        if ( !Array.isArray( fileNames ) ) {
            fileNames = [ fileNames ];
        }

        fileNames = fileNames.map( function ( fileName ) {

            return fileName.replace( this.config.build_dir, '' ).replace( /^\//, '' );

        }.bind( this ) );

        fileNames = appUtil.unique( fileNames );
        
        //最后上传字典文件
        fileNames.sort( function ( f1, f2 ) {

            if ( appUtil.isMatch( f1, this.setting.mapFiles ) &&
                    !appUtil.isMatch( f2, this.setting.mapFiles ) ) {

                return 1;
            } else {
                return -1;
            }
        }.bind( this ) );

        var uploadedN = 0;
        
        var connConfig = appUtil.applyIf( this.config.uploader.ftp || {}, defaultConnConfig );

        ftpClient.connect( connConfig );

        ftpClient.on( 'ready', function () {

            console.log( 'ftp连接成功...' ); 

            var i = 1, len = fileNames.length;
            var fileName = fileNames[ 0 ];

            emitter.on( 'success', function () {

                if ( i < len ) {

                    fileName = fileNames[ i++ ];
                    this.ftpUploadOne( fileName );

                } else {
                    ftpClient.end();

                    console.log( 'ftp断开连接成功...' ); 

                    emitter.emit( 'done' );
                }
            }.bind( this ) );

            this.ftpUploadOne( fileName );

        }.bind( this ) );
    },

    tFtpUpload : function ( fileNames ) {
    
        if ( !Array.isArray( fileNames ) ) {
            fileNames = [ fileNames ];
        }

        fileNames = fileNames.map( function ( fileName ) {

            return fileName.replace( this.config.build_dir, '' ).replace( /^\//, '' );

        }.bind( this ) );

        fileNames = appUtil.unique( fileNames );
        
        //最后上传字典文件
        fileNames.sort( function ( f1, f2 ) {

            if ( appUtil.isMatch( f1, this.setting.mapFiles ) &&
                    !appUtil.isMatch( f2, this.setting.mapFiles ) ) {

                return 1;
            } else {
                return -1;
            }
        }.bind( this ) );

        var uploadedN = 0;
        
        var connConfig = appUtil.applyIf( this.config.uploader.tFtp || {}, defaultConnConfig );

        ftpClient.connect( connConfig );

        ftpClient.on( 'ready', function () {

            console.log( 'ftp连接成功...' ); 

            ftpClient.cwd( connConfig.cwd, function () {

                var i = 1, len = fileNames.length;
                var fileName = fileNames[ 0 ];

                emitter.on( 'success', function () {

                    if ( i < len ) {

                        fileName = fileNames[ i++ ];
                        this.ftpUploadOne( fileName );

                    } else {
                        ftpClient.end();
                        console.log( 'ftp断开连接成功...' ); 
                        emitter.emit( 'done' );
                    }
                }.bind( this ) );

                this.ftpUploadOne( fileName );

            }.bind( this ) );

        }.bind( this ) );
    },

    ftpUploadOne : function ( fileName ) {

        var realeseFileName = path.resolve( this.config.build_dir, fileName );
        var dir = path.dirname( fileName );

        dir = path.join( dir, '/' );
        
        ftpClient.mkdir( dir, true, function ( err ) {

            if ( err ) {
                console.log( err );
                ftpClient.end();
                process.exit( 1 );
            }

            //ftpClient.put( fs.readFileSync( realeseFileName ), fileName, function ( err ) {
            ftpClient.put( fs.createReadStream( realeseFileName ), fileName, function ( err ) {

                if ( err ) {
                    console.log( err );
                    ftpClient.end();
                    process.exit( 1 );
                }
                console.log( fileName + ' 上传成功' );
                emitter.emit( 'success' );
            } );
        } );
    }
};

module.exports = uploader;
