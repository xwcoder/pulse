/**
 * 配置文件
 */
var settings = {
    
    // 字典文件
    mapFiles : [ /(^|\/)kao\./, /(^|\/)dict\./, /(^|\/)inc\./, /(^|\/)gg\.seed\./ ],

    // 压缩服务器配置
    compressor : {

        //不做版本号替换
        excludes : [ /(^|\/)kao\./, /(^|\/)dict\./, /(^|\/)inc\./, /(^|\/)gg\.seed\./ ],
    },

    hinter : {

        //jshint
        js : {

            // 错误阀值, 超过这个阈值jshint不再向下检查，提示错误太多
            maxerr : 100,

            // 如果为真，JSHint会在发现首个错误后停止检查。
            passfail : false,

            // 强制每行分号结尾
            asi : false,

            // 禁用位运算符
            bitwise : false,

            // 允许 if for while 里有赋值语句
            boss : true,
            
            // if while 语句必须要有{}, 哪怕只有一行
            curly : true,
            
            // 禁止debugger出现
            debug : false,
            
            /**
             * 如果为真，JSHint要求匿名函数的调用如下：
             *  ( function () {
             *      //
             *  }() );
             *
             *  而不是
             *  ( function () {
             *      //
             *  } )();
             *
             *  设置为关闭，不然几乎所有文件都通不过
             */
            immed : false,
            
            // 所有构造器函数首字母大写
            newcap : true,
            
            // 禁止arguments.caller和arguments.callee的使用
            noarg : true,
            
            // 禁止出现空的代码块（没有语句的代码块）
            noempty : true,
            
            // 允许带下划线的变量名
            nomen : false,
            
            // 期望函数只被var的形式声明一遍
            onevar : true,
            
            // 如果为真，JSHint会禁用自增运算和自减运算
            plusplus : false,
            
            // 如果为真，JSHint会不允许使用.和[^...]的正则，
            regexp : false,
            
            // 如果为真，要求所有的非全局变量，在使用前都被声明
            undef : true,
            
            // 如果为真，JSHint会允许各种形式的下标来访问对象
            // 通常只有属性名是关键字才允许下标访问
            sub : false,
            
            // 严格模式
            strict : false,
            
            // 如果为true，JSHint会依据严格的空白规范检查你的代码
            white : false
        }
    }
};

module.exports = settings;
