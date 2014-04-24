var fs = require( 'fs' );
var path = require( 'path' );

var jshint = require( 'jshint' );

var appUtil = require( './util' );

var hinter = {

    init : function ( config, setting ) {

        this.config = config || {};
        this.setting = setting || {};

        this.jshintOptions = this.setting.hinter.js || {}; 

    },

    hint : function ( fileNames ) {

        fileNames = fileNames.map( function ( filename ) {
            return path.resolve( this.config.root, filename );
        }.bind( this ) );

        fileNames = appUtil.unique( fileNames );
        
        fileNames.forEach( function ( fileName ) {
            if ( appUtil.isScript( fileName ) ) {
                this.jshint( fileName );
            }
        }.bind( this ) );
    },

    jshint : function ( fileNames ) {

        if ( !Array.isArray( fileNames ) ) {
            fileNames = [ fileNames ];
        }
        
        var logInfo = '';

        fileNames.forEach( function ( fileName ) {
            console.info( 'hint:' + fileName );
            logInfo = logInfo + 'hint:' + fileName + '\n'; 

            var content = appUtil.readFile( fileName );
            var r = jshint.JSHINT( content, this.jshintOptions );
            if ( r ) {
                console.info( 'pass' );
                logInfo = logInfo + 'pass' + '\n';
            } else {
                console.info( jshint.JSHINT.errors );
                logInfo = logInfo + 'errors:' + jshint.JSHINT.errors.length + '\n';
                logInfo = logInfo + JSON.stringify( jshint.JSHINT.errors, null, 4 );
                logInfo = logInfo + '\n' + '*********************' + '\n';
            }
            console.info();
        }.bind( this ) );
        
        appUtil.appendFile( this.config.logFile, logInfo );
    }
};

module.exports = hinter;
