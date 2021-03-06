const config = {
    bot_name: /^@小白\s*/,
    device: {
        manual: {
            index: 1,
            is_load: true,
            path_regex: /^(manual)\s*(.*)/
        }, //手动输入
        codoon: {
            index: 2,
            path_regex: /^http:\/\/www.codoon.com\/h5\/route_detail\/index.html\?share_id=(.+)[&]/,
            is_load: true
        }, //咕咚
        thejoyrun: {
            index: 3,
            path_regex: /^https?:\/\/wap.thejoyrun.com\/(.+).html/,
            is_load: true
        }, //悦跑圈
        garmin:{
            index:4,
            path_regex:/^https:\/\/connect.garmin.\S{0,3}\/modern\/activity\/(.+)/,
            is_load:true
        }
    }
}
module.exports = config;