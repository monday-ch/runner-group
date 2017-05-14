const mongoose = require('mongoose');

const db = mongoose.createConnection('127.0.0.1', 'runner-group');

db.on('error', (error) => {
    console.log(`connect-error: ${error}`)
});
db.once('open', function () {
    console.log(`connect to db success`)
});

const RunningInfo = new mongoose.Schema({
    group: String, //wechat group
    runner: String, //name in wechat
    runner_id: String,
    device: Number,
    position: String,
    total_distance: Number,
    total_time: Number,
    total_calories: Number,
    run_date: Number,
    ref_url: String,
    ref_share_id: String,
    ref_uid: String,
    ref_name: String, //name in devices
    create_date: Number,
    is_deleted: Number
});



module.exports = {
    runningInfo: db.model('running_info', RunningInfo)
}