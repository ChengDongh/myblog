//数据库配置信息
module.exports = {
    cookieSecret:'zcd',//加密cookie使用的字符串
    db:'blog',//数据库的名称
    host:'localhost',//数据库的地址
    port:27017 //数据库的端口号
}
//我们把数据库的配置信息写在这里，是为了在连接数据库的时候，一旦数据库的地址或者是名称或者是端口号发生改变的时候，我们只需要
//改这里就行了