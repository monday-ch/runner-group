const _ = require('lodash');
const moment = require("moment");
const BaseParser = require('./base');
const config = require('../../config.js');

class Codoon extends BaseParser {
    constructor(urlInfo) {
        super(urlInfo)
        this.device = config.device.manual;
    } 

    fetchData(callback) {
        if (_.isEmpty(this.addition)) {
            return callback(`get error when parse data for ${this.url}`);
        }
        //持续时间: 1:12:36
        //8.99 千米
        //热量: 647 千卡

        //时间 | 距离

        let time = ""
        let distance = "";
        let calories = 0;
        const format = /(\d{1,2}:\d{1,2}:\d{1,2})[\|\s](\d+\.?\d*)/;
        const timeRegex = /\d{0,2}:?\d{1,2}:\d{1,2}/;
        const distanceRegex = /(\d+\.?\d*)\s*(千米|KM|公里)/
        const caloriesRegex = /(\d+\.?\d*)\s*(千卡|大卡)/
        if (format.test(this.addition)) {
            const matchResult = this.addition.match(format);
            time = matchResult[1]
            distance = matchResult[2]
        } else {
            if (timeRegex.test(this.addition) && distanceRegex.test(this.addition)) {
                time = this.addition.match(timeRegex)[0];
                time.split(':').length === 2 && (time = '0:' + time)
                distance = this.addition.match(distanceRegex)[1];
                calories = this.addition.match(caloriesRegex)[1];
            } else {
                return callback('invalided input');
            }
        }

        const instance = {
            device: this.device.index,
            position: "",
            total_distance: distance * 1,
            total_time: moment.duration(time).asMilliseconds(),
            total_calories: calories * 1,
            run_date: moment().valueOf(),
            ref_url: this.url,
            ref_share_id: moment().valueOf(),
            ref_id: "",
            ref_name: ""
        };

        return callback(null, instance)
    }
}

module.exports = Codoon;