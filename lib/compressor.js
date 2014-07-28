var fs = require( 'fs' );
var path = require( 'path' );
var crypto = require( 'crypto' );
var url = require( 'url' );
var Emitter = require( 'events' ).EventEmitter;

var UglifyJS = require( 'uglify-js' );
var CleanCSS = require( 'clean-css' );
var jschardet = require( 'jschardet' );
var iconvLite = require( 'iconv-lite' );
var Iconv = require( 'iconv' ).Iconv;
var mkdirp = require( 'mkdirp' );

var appUtil = require( './util' );


var emitter = new Emitter();

var defaultConfig = {
    author : 'f2e'
};

var defaultSetting = {
    stampFormat : 'yyyy-MM-dd hh:mm:ss'
};

var compressor = {

    init : function ( config, setting ) {
        this.config = appUtil.applyIf( config || {}, defaultConfig );
        this.setting = appUtil.applyIf( setting || {}, defaultSetting );

        this.localSetting = this.setting.compressor || {};

        if ( this.config.root == '.' || this.config.root == './' ) {
            this.config.root = '';
        }

        this.minFileNames = [];

        this.isExecModify = false;
    },

    compress : function ( fileNames ) {

        fileNames = fileNames.map( function ( filename ) {
            return path.resolve( this.config.root, filename );
        }.bind( this ) );

        fileNames = appUtil.unique( fileNames );

        this.miniNormalJSFileNames = [];

        var fileName = '';
        for ( var i = 0, len = fileNames.length; i < len; i++ ) {

            fileName = fileNames[ i ];

            var minFileName = this.compressOne( fileName);

            if ( this.minFileNames.indexOf( minFileName ) == -1 ) {
                this.minFileNames.push( minFileName );
            }
        }
        
        if ( this.miniNormalJSFileNames.length && !this.isExecModify ) {

            this.modifyMapFile();

        } else {

            this.minFileNames.sort( function ( f1, f2 ) {

                var ext1 = path.extname( f1 ).toLowerCase();
                var ext2 = path.extname( f2 ).toLowerCase();
                
                if ( ( ext1 == '.js' && ext2 != '.js' )
                    || ( ext1 == '.css' && ext2 != '.js' && ext2 != '.css' ) ) {
                    return -1;
                }
                
                if ( ( ext1 == '.js' && ext2 == '.js' )
                    || ( ext1 == '.css' && ext2 == '.css' )
                    || ( ext1 != '.js' && ext1 != '.css' && ext2!= '.js' && ext2 != '.css' ) ) {
                        return 0;
                }

                return 1;
            } );

            this.log();

            this.emit( 'done' );
        }
    },

    compressOne : function ( fileName ) {

        fileName = path.resolve( this.config.root, fileName );

        var minFileName = '';

        if ( appUtil.isScript( fileName ) ) {

            minFileName = this.compressJS( fileName );

        } else if ( appUtil.isCss( fileName ) ) {

            minFileName = this.compressCSS( fileName );

        } else {
            minFileName = this.compressOther( fileName );
        }
        return minFileName;
    },

    compressJS : function ( fileName ) {
        
        //获得utf-8 buffer
        var buffer = fs.readFileSync( fileName );

        //var encoding = ( jschardet.detect( buffer ).encoding || '' ).toLowerCase();
        //console.log( encoding );
        //if ( encoding !== 'utf-8' ) {
        //    var iconv = new Iconv( 'GBK', 'UTF-8');
        //    buffer = iconv.convert( buffer );
        //}
        //
        ////获得文件内容并压缩文件
        //var content = iconvLite.decode( buffer, 'utf8' );

        var content = iconvLite.decode( buffer, 'utf-8' );

        if ( content.indexOf( '�' ) != -1 ) {
            content = iconvLite.decode( buffer, 'gbk' );
        }

        var minContent = UglifyJS.minify( content, {
            fromString: true,
            output: {
                ascii_only : true,
                max_line_len : null
            }
        } ).code;
        
        //获得sha1签名
        var shasum = crypto.createHash( 'sha1' );
        var signature = shasum.update( buffer ).digest( 'hex' ).slice( 0, 6 );
        
        //banner
        var author = this.config.author;
        var timestamp = appUtil.dateFormat( new Date(), this.setting.stampFormat );
        var banner = '\/* @author ' + author + ' ' + timestamp + ' ' + signature + ' *\/';
        
        //最终文件
        minContent = banner + '\n' + minContent;

        var relativeFileName = fileName.replace( this.config.root, '' ).replace( /^\//, '' );

        if ( !this.localSetting.excludes || !appUtil.isExclude( relativeFileName, this.localSetting.excludes ) ) {

            relativeFileName = path.join( path.dirname( relativeFileName), path.basename( relativeFileName, '.js' ) + '_' + signature + '.js' );  

            this.miniNormalJSFileNames.push( relativeFileName );
        }

        var buildFileName = path.resolve( this.config.build_dir, relativeFileName );

        appUtil.writeFile( buildFileName, minContent );

        return relativeFileName;
    },
    
    compressCSS : function ( fileName ) {
    
        var content = appUtil.readFile( fileName )
        var minContent = new CleanCSS( {
            keepSpecialComments : 0, //* for keeping all (default), 1 for keeping first one only, 0 for removing all
            noAdvanced : true, //set to true to disable advanced optimizations - selector & property merging, reduction, etc.
            compatibility : true, //Force compatibility mode to ie7 or ie8. Defaults to not set.
        } ).minify( content );

        //banner
        var author = this.config.author;
        var timestamp = appUtil.dateFormat( new Date(), this.setting.stampFormat );
        var banner = '\/* @author ' + author + ' ' + timestamp + ' *\/';
        
        //最终文件
        minContent = banner + '\n' + minContent;

        var relativeFileName = fileName.replace( this.config.root, '' ).replace( /^\//, '' );
        var buildFileName = path.resolve( this.config.build_dir, relativeFileName );

        appUtil.writeFile( buildFileName, minContent );

        return relativeFileName;
    },
    
    //其他文件只做拷贝
    compressOther : function ( fileName ) {

        var relativeFileName = fileName.replace( this.config.root, '' ).replace( /^\//, '' );
        var buildFileName = path.resolve( this.config.build_dir, relativeFileName );

        mkdirp.sync( path.dirname( buildFileName ) );
        fs.createReadStream( fileName ).pipe( fs.createWriteStream( buildFileName ) );    

        return relativeFileName;
    },

    modifyMapFile : function () {
        var walk = function ( dir, done ) {
            var results = [];
            fs.readdir( dir, function ( err, list ) {
                if ( err ) {
                    return done( err );
                } 
                var i = 0;
                ( function next() {
                    var file = list[ i++ ];
                    if ( !file ) {
                        return done( null, results );
                    } 
                    file = dir + '/' + file;
                    fs.stat( file, function( err, stat ) {
                        if ( stat && stat.isDirectory() ) {
                            walk( file, function ( err, res ) {
                                results = results.concat( res );
                                next();
                            } );
                        } else {
                            results.push( file );
                            next();
                        }
                    } );
                } )();
            });
        };

        this.isExecModify = true;

        walk( path.resolve( this.config.root, 'js' ), function ( placeholder, results ) {
            this._modifyMapFile( results );
        }.bind( this ) );
    },
    
    _modifyMapFile : function ( fileNames ) {

        var minNormalFileNames = this.miniNormalJSFileNames.map( function ( fileName ) {
            fileName = fileName.replace( /^js\//, '' )
            if ( fileName.indexOf( '/' ) == -1 ) {
                fileName = '/' + fileName;
            }
            return fileName;
            //return fileName.replace( /^js\//, '' );
        } );

        var regs = minNormalFileNames.map( function ( fileName ) {

            if ( fileName.split( '_' ).length > 2 ) {
                fileName = fileName.split( '_' ).slice( 0, -1 ).join( '_' );
                fileName = fileName.replace( '/', '\\\/' ) + '((_\\w+)|(_\\d+))?\\.js';
            } else {
                fileName = fileName.replace('/', '\\\/').replace(/_\w+\.js/, '((_\\w+)|(\\d+))?\\.js');
            }
            return new RegExp( fileName );
        } );

        var includePattern = this.setting.mapFiles;

        mapFileNames = fileNames.filter( function ( fileName ) {
            return appUtil.isMapFile( fileName, includePattern );
        } );

        var modifiedMapFileNames = [];

        mapFileNames.forEach( function ( mapFileName ) {

            var content = appUtil.readFile( mapFileName );
            
            var isModyfied = false;

            minNormalFileNames.forEach( function ( minFileName, index ) {
                var reg = regs[ index ];
                if ( reg && reg.test( content ) ) {
                    isModyfied = true;
                    content = content.replace( reg, minFileName );
                }
            } );

            if ( isModyfied ) {
                modifiedMapFileNames.push( mapFileName );
                appUtil.writeFile( mapFileName, content );
            }
            
        }.bind( this ) );
        
        this.compress( modifiedMapFileNames );
    },

    log : function () {

        var jsReg = /^js\//;
        var cssReg = /^css\//;
        var imgReg = /^img\//;

        var urls = this.minFileNames.map( function ( fileName ) {

            if ( jsReg.test( fileName ) ) {
                return url.resolve( 'http://js.tv.itc.cn', fileName.replace( jsReg, '' ) );
            }

            if ( cssReg.test( fileName ) ) {
                return url.resolve( 'http://css.tv.itc.cn', fileName.replace( cssReg, '' ) );
            }

            if ( imgReg.test( fileName ) ) {
                return url.resolve( 'http://css.tv.itc.cn', fileName.replace( imgReg, '' ) );
            }
        } );

        var content = this.minFileNames.join( '\n' );
        var urlContent = urls.join( '\n' );

        console.info( 'compress:' );
        console.info( content + '\n\n' + urlContent );

        appUtil.writeFile( this.config.logFile, content + '\n\n' + urlContent );
        
        var pListFile = this.config.pListFile;

        if ( !pListFile ) {
            pListFile = path.resolve( path.dirname( this.config.listFile ), 'plist.txt' );
        }
        
        console.log( '\n生成上传文件清单：' + pListFile + '\n' );
        appUtil.writeFile( pListFile, content );

    },

    on : function ( topic, handler ) {
        emitter.on( topic, handler );
    },

    emit : function ( topic ) {
        emitter.emit( topic );
    }
};

module.exports = compressor;
