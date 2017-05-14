const request = require('request');
const moment = require("moment");
const BaseParser = require('./base');
const config = require('../../config.js');

class Codoon extends BaseParser {
    constructor(urlInfo) {
        super(urlInfo)
        this.device = config.device.codoon;
        this.apiPath = `http://www.codoon.com/www/gps_data_server/gps_route_share_ride?share_id=${this.share_id}`;
    }

    fetchData(callback) {
        const self = this;
        request(self.apiPath, function (error, response, body) {
            if (error) {
                return callback(`get error when requet data from ${self.url}`);
            }
            body = JSON.parse(body);
            if (body && body.status === "OK" && body.data) {
                const fodder = body.data;
                if (fodder.sports_type !== 1) {
                    return callback(`get data but not running info`);
                }
                const instance = {
                    device: config.device.codoon.index,
                    position: "",
                    total_distance: fodder.total_distance * 1,
                    total_time: moment.duration(fodder.total_time).asMilliseconds(),
                    total_calories: fodder.total_calories * 1,
                    run_date: moment(fodder.end_date).valueOf(),
                    ref_url: self.url,
                    ref_share_id: self.share_id,
                    ref_id: fodder.user_id,
                    ref_name: fodder.nick
                };
                return callback(null, instance)
            } else {
                return callback(`get nothing request from  ${self.url}`);
            }
        });
    }
}

module.exports = Codoon;