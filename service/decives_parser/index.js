const config = require('../../config.js');
const _ = require("lodash");


const getDataFromUrl = function (url, callback) {
    const urlInfo = {
        url: url,
        share_id: "",
        device: ""
    };

    for (const key in config.device) {
        if (config.device[key].is_load && config.device[key].path_regex.test(url)) {
            urlInfo.share_id = url.match(config.device[key].path_regex)[1];
            urlInfo.addition = url.match(config.device[key].path_regex)[2];
            urlInfo.device = key;
            break;
        }
    }

    if (_.isEmpty(urlInfo.device)) {
        return callback(null)
    }
    const DeviceClass = require(`./${urlInfo.device}`);
    const deviceParser = new DeviceClass(urlInfo);

    deviceParser.fetchData((error, instance) => {
        callback(error, instance);
    })
}

module.exports = {
    getDataFromURL: getDataFromUrl
}