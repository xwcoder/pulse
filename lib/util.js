var util = require( 'util' );
var path = require( 'path' );
var fs = require( 'fs' );
var jschardet = require( 'jschardet' );
var iconvLite = require( 'iconv-lite' );
var Iconv = require( 'iconv' ).Iconv;
var mkdirp = require( 'mkdirp' );

var appUtil = {

    applyIf : function ( o, c ) {
        if ( o && c && typeof c == 'object' ) {
            for ( var p in c ) {
                if ( typeof o[ p ] == 'undefined' ) {
                    o[ p ] = c[ p ];
                }
            }
        }
        return o;
    },

    sleep : function ( m ) {
        var time = m + Date.now();
        while ( Date.now() < time ) { }
    },

    log : function ( msg ) {
        console.log( msg );
        this.sleep( 100 );
    },

    isScript : function ( filename ) {
        return path.extname( filename ) == '.js';
    },

    isCss : function ( filename ) {
        return path.extname( filename ) == '.css';
    },

    isImage : function ( filename ) {
        var extName = path.extname( filename ).toLowerCase();
        var imageExtNames = [ 'png', 'ico', 'jpg', 'gif', 'jpeg' ];
        return imageExtNames( extName ) != -1;
    },

    dateFormat : function ( date, f ) {
        if ( {}.toString.call( date ) != '[object Date]' ) {
            date = new Date( parseInt( date ) );
        }
        var map = {
            'y+' : date.getFullYear(),
            'M+' : date.getMonth() + 1,
            'd+' : date.getDate(),
            'h+' : date.getHours(),
            'm+' : date.getMinutes(),
            's+' : date.getSeconds()
        };
        for ( var p in map ) {
            if ( new RegExp ( '(' + p + ')' ).test( f ) ) {
                f = f.replace( RegExp.$1, ( '00' + map[ p ] ).substr( ~RegExp.$1.length + 1 ) );
            }
        }
        return f;
    },

    isMatch : function ( fileName, patterns ) {
    
        if ( !util.isArray( patterns ) ) {
            excludes = [ patterns ];
        }

        var  isMatch = false;

        var matchOne = function ( filename, rule ) {

            if ( this.isString( rule ) ) {

                return filename == rule;

            } else if ( util.isRegExp( rule ) ) {

                return rule.test( filename );

            } else if ( this.isFunction( rule ) ) {

                return !!rule( filename );
            }

            return false;

        }.bind( this );

        for ( var i = 0, len = patterns.length; i < len; i++ ) {

            if ( matchOne( fileName, patterns[ i ] ) ) {

                isMatch = true;
                break;
            }
        }
        return isMatch;
    },

    isExclude : function ( filename, excludes ) {

        if ( !util.isArray( excludes ) ) {
            excludes = [ excludes ];
        }

        var isExclude = false;
        var tp = this;
        var matchOne = function ( filename, rule ) {
            if ( tp.isString( rule ) ) {
                return filename == rule;
            } else if ( util.isRegExp( rule ) ) {
                return rule.test( filename );
            } else if ( tp.isFunction( rule ) ) {
                return !!rule( filename );
            }
            return false;
        };

        for ( var i = 0, len = excludes.length; i < len; i++ ) {
            if ( matchOne( filename, excludes[ i ] ) ) {
                isExclude = true;
                break;
            }
        }
        return isExclude;
    },

    isMapFile : function ( filename, includes ) {
        if ( !util.isArray( includes ) ) {
            includes = [ includes ];
        }

        var isMap = false;
        var matchOne = function ( filename, rule ) {
            if ( this.isString( rule ) ) {
                return filename == rule;
            } else if ( util.isRegExp( rule ) ) {
                return rule.test( filename );
            } else if ( this.isFunction( rule ) ) {
                return !!rule( filename );
            }
            return false;
        }.bind( this );

        for ( var i = 0, len = includes.length; i < len; i++ ) {
            if ( matchOne( filename, includes[ i ] ) ) {
                isMap = true;
                break;
            }
        }
        return isMap;
    },
 
    isString : function ( s ) {
        return Object.prototype.toString.call( s ) === '[object String]';
    },

    isFunction : function ( f ) {
        return Object.prototype.toString.call( f ) === '[object Function]';
    },

    unique : function ( array ) {
        var ret = [];
        for ( var i = 0; i < array.length; i++ ) {
            var item = array[ i ];
            if ( ret.indexOf( item ) === -1 ) {
                ret.push( item );
            }
        }
         
        return ret;
    },

    readFile : function ( fileName ) {

        var buffer = fs.readFileSync( fileName );
        var encoding = ( jschardet.detect( buffer ).encoding || '' ).toLowerCase();
        if ( encoding !== 'utf-8' ) {
            var iconv = new Iconv( 'GBK', 'UTF-8');
            buffer = iconv.convert( buffer );
        }
        
        var content = iconvLite.decode( buffer, 'utf8' );

        return content;
    },
    
    writeFile : function ( fileName, content ) {

        mkdirp.sync( path.dirname( fileName ) );
        fs.writeFileSync( fileName, content, { encoding : 'utf-8' } );
    },

    appendFile : function ( fileName, content ) {

        mkdirp.sync( path.dirname( fileName ) );
        fs.appendFileSync( fileName, content, { encoding : 'utf-8' } );
    },

    clean : function ( dir ) {

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

        walk( dir, function ( p, files ) {

            files.forEach( function ( file ) {
                fs.unlinkSync( file );
            } );
        } );
    }
};

module.exports = appUtil;
