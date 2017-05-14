const moment = require("moment");

class BaseParser {
    constructor(urlInfo) {
        this.url = urlInfo.url;
        this.share_id = urlInfo.share_id;
        this.addition = urlInfo.addition;
    }

    autoYear(data) {
        if (moment().isBefore(data)) {
            return moment(data).add(-1, 'year');
        } else {
            return data;
        }
    }
}

module.exports = BaseParser