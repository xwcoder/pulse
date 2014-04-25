pulse
=====
 
自动化压缩 ftp上传工具

## 配置 ##

### 全局配置 ###

<pre>

    // 字典文件匹配规则
    mapFiles : [ /(^|\/)kao\./, /(^|\/)dict\./, /(^|\/)inc\./, /(^|\/)gg\.seed\./ ],

    // 压缩服务配置
    compressor : {

        // 上线文件名不变的文件，目前与mapFiles相同
        excludes : [ /(^|\/)kao\./, /(^|\/)dict\./, /(^|\/)inc\./, /(^|\/)gg\.seed\./ ],
    },
    
    // 编码检查配置
    hinter : {

        // js文件检查配置, 即jshint的配置
        js : {

            // 错误阀值, 超过这个阈值jshint不再向下检查，提示错误太多
            maxerr : 100,

            // 如果为真，JSHint会在发现首个错误后停止检查。
            passfail : false,

            // 强制每行分号结尾
            asi : false,

        },
        
        // 目前未使用
        css : {
            
        }
    }
</pre>

全局配置: 详见setting.js

### 个人配置 ###

<pre>

    // 作者, 会出现在压缩文件的banner里
    author : 'creep',

    // 项目根目录, 相对或绝对路径
    root : '/home/xwcoder/code/tv',
    
    // build目录, 相对或绝对路径
    build_dir : '/home/xwcoder/code/online/build',

    // 日志文件, 相对或绝对路径
    logFile : '/home/xwcoder/code/online/log.txt',

    // 待处理文件清单, 相对或绝对路径 (可通过git命令导出，也可手动编辑)
    listFile : '/home/xwcoder/code/online/list.txt',
    
    // 上传文件清单, 相对或据对路径 (最好不手动编辑，压缩命令会生成此文件)
    pListFile : '/home/xwcoder/code/online/plist.txt',
    
    // ftp上传配置，端口默认是21
    uploader : {
        ftp : {
            host : 'localhost', //ftp服务器地址
            port : 21, //ftp服务端口
            user : 'ftp1', //用户名
            password : 'ftp1', //密码
        }
    }
</pre>

个人配置: 详见config.js

## 清单文件 list.txt ##

清单文件是纯文本文件，每个文件名(文件路径)占一行。可通过git命令导出, 如
<code>git log master.. --name-only --pretty=format:"" | sort -u | uniq > ~/list.txt</code>

<pre>

list.txt:

js/site/pad/inc.js
js/site/pad/play.js
js/site/pad/video.js
</pre>

## 使用&命令  ##

<pre>

    cd pulse // pulase根目录

    npm install // 安装依赖包

    node pulse.js <命令>
        
         -m : 压缩
         -p : ftp上传到文件服务器
         -l : jshint
         -h : help info
         -f : 指定本地配置文件, 默认是pulse.js同目录下的config.js
         -m -p(-mp, -pm) : 压缩并上传(-m和-p的组合)
</pre>
