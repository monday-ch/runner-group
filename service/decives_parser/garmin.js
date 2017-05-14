const request = require('request');
const moment = require("moment");
const BaseParser = require('./base');
const config = require('../../config.js');

class Garmin extends BaseParser {
    constructor(urlInfo) {
        super(urlInfo)
        this.device = config.device.garmin;
        this.apiPath = `https://connect.garmin.cn/modern/proxy/activity-service/activity/${this.share_id}`;
    }

    fetchData(callback) {
        const self = this;
        request(self.apiPath, function (error, response, body) {
            if (error) {
                return callback(`get error when requet data from ${self.url}`);
            }
            body = JSON.parse(body);
            if (body && body.summaryDTO) {
                const fodder = body.summaryDTO;
                const instance = {
                    device: self.device.index,
                    position: "",
                    total_distance: Math.floor(fodder.distance / 10) / 100,
                    total_time: fodder.duration * 1000,
                    total_calories: Math.floor(fodder.calories),
                    run_date: moment(fodder.startTimeLocal).valueOf(),
                    ref_url: self.url,
                    ref_share_id: self.share_id,
                    ref_id: body.userProfileId,
                    ref_name: body.userInfoDto && body.userInfoDto.fullname
                };
                return callback(null, instance)
            } else {
                return callback(`get nothing request from  ${self.url}`);
            }
        });
    }
}

module.exports = Garmin;