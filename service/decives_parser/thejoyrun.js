const request = require('request');
const moment = require("moment");
const BaseParser = require('./base');
const cheerio = require('cheerio');
const config = require('../../config.js');

class Codoon extends BaseParser {
    constructor(urlInfo) {
        super(urlInfo)
        this.device = config.device.thejoyrun;
    }

    fetchData(callback) {
        const self = this;
        request(self.url, function (error, response, body) {
            if (error) {
                return callback(`get error when requet data from ${self.url}`);
            }

            const $ = cheerio.load(body);
            if (body) {
                const $data = $('#DataShow');

                const instance = {
                    device: self.device.index,
                    position: "",
                    total_distance: $data.find('.distance h1').text() * 1,
                    total_time: moment.duration($data.find('.time h1').text()).asMilliseconds(),
                    total_calories: $data.find('.calorie h2').text() * 1,
                    run_date: self.autoYear(moment($('#endtime').text(), "MM年DD日 HH:mm")).valueOf(),
                    ref_url: self.url,
                    ref_share_id: self.share_id,
                    ref_id: $data.find('.id h2').text(),
                    ref_name: $data.find('.id h1').text()
                };
                return callback(null, instance)
            } else {
                return callback(`get nothing request from  ${self.url}`);
            }
        });
    }
}

module.exports = Codoon;