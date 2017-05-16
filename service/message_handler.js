const _ = require('lodash');
const moment = require("moment");
const model = require('../data')
const config = require('../config.js');
const decives_parser = require('./decives_parser');

const sessionContext = {
    //chat_id : {
    //    
    //}
};
const orders = {
    help: /^帮助\s*/,
    del: /^删除\s*(\d{0,2})/,
    query: /^查看\s*(\S{0,2})/,
    save: /^保存\s*(.*)/
}

const mentioned = (room, msg) => {
    if (!room) {
        return [];

    }
    // define magic code `8197` to identify @xxx
    const AT_SEPRATOR = String.fromCharCode(8197)
    const atList = msg.split('@')
    if (atList.length === 0) return [];
    // Using `filter(e => e.indexOf('@') > -1)` to filter the string without `@`
    const rawMentionedList = atList
        .filter(str => str.includes(AT_SEPRATOR))
        .map(str => str.trim().replace(AT_SEPRATOR, ''))
        .filter(str => !!str) // filter blank string

    const members = room.memberList();
    return _.map(rawMentionedList, (one) => {
        const mm = _.find(members, (member) => {
            return member.name() === one;
        });
        return mm && mm.id
    })
}


class MessageHandler {
    constructor() {

    }

    executeCommand(commandMsg, callback) {
        const chat_id = commandMsg.room ? commandMsg.room.id : commandMsg.from;
        sessionContext[chat_id] = sessionContext[chat_id] || {};
        const ready_delete = sessionContext[chat_id]['ready_delete'];
        sessionContext[chat_id]['ready_delete'] = '';
        let isSummary = false;
        switch (true) {
            case orders.del.test(commandMsg.order):
                const index = commandMsg.order.match(orders.del)[1];
                if (_.isEmpty(index)) {
                    if (ready_delete) {
                        model.runningInfo.findByIdAndRemove(ready_delete, (error) => {
                            if (error) {
                                callback(`删除失败`)
                                console.log(error);
                            } else {
                                callback(`已删除`)
                            }
                        })
                    } else {
                        sessionContext[chat_id]['ready_delete'] = '';
                        callback(`没有指定要删除的记录`)
                    }
                } else {
                    if (sessionContext[chat_id]['lastList'] && sessionContext[chat_id]['lastList'][index * 1 - 1]) {
                        model.runningInfo.findByIdAndRemove(sessionContext[chat_id]['lastList'][index * 1 - 1], (error) => {
                            if (error) {
                                callback(`删除失败`)
                                console.log(error);
                            } else {
                                callback(`已删除`)
                            }
                        })
                    } else {
                        callback(`找不到指定条目`)
                    }
                }
                break;
            case orders.help.test(commandMsg.order):
                callback(`查看 [本周|上周|本月|上月|汇总] \n    可以@某些人来指定查看对象，默认本周\n    举例：查看 本周 @张三@李四\n\n删除 [最近列表中ID]\n\n 保存 时间|距离\n\n帮助`);
                break;
            case orders.query.test(commandMsg.order):
                const param = commandMsg.order.match(orders.query)[1];
                const condition = {};
                // if (commandMsg.room) {
                //     condition.group = commandMsg.room.id;
                // } else {
                //     condition.runner_id = commandMsg.from;
                // }

                switch (param) {
                    case '本月':
                        condition.run_date = {
                            $gte: moment().startOf('month').valueOf(),
                            $lte: moment().endOf('month').valueOf()
                        }
                        break;
                    case '今日':
                        condition.run_date = {
                            $gte: moment().startOf('day').valueOf(),
                            $lte: moment().endOf('day').valueOf()
                        }
                        break;
                    case '昨日':
                        condition.run_date = {
                            $gte: moment().add(-1, 'day').startOf('day').valueOf(),
                            $lte: moment().add(-1, 'day').endOf('day').valueOf()
                        }
                        break;
                    case '上周':
                        condition.run_date = {
                            $gte: moment().add(-1, 'week').startOf('isoweek').valueOf(),
                            $lte: moment().add(-1, 'week').endOf('isoweek').valueOf()
                        }
                        break;
                    case '上月':
                        condition.run_date = {
                            $gte: moment().add(-1, 'month').startOf('month').valueOf(),
                            $lte: moment().add(-1, 'month').endOf('month').valueOf()
                        }
                        break;
                    case '汇总':
                        isSummary = true;
                    case '本周':
                    default:
                        condition.run_date = {
                            $gte: moment().startOf('isoweek').valueOf(),
                            $lte: moment().endOf('isoweek').valueOf()
                        }
                }

                const mentionList = mentioned(commandMsg.room, commandMsg.order);
                if (mentionList.length > 0) {
                    condition.runner_id = {
                        $in: mentionList
                    }
                }

                model.runningInfo
                    .find(condition)
                    .sort('-run_date runner_id')
                    .exec((error, data) => {
                        if (error || data.length === 0) {
                            callback(`没有获取到数据记录`)
                            console.log(error);
                        } else {
                            if (data.length > 30 || isSummary) {
                                //大于30条 进行数据汇总显示
                                const summary = {};
                                _.forEach(data, (one) => {
                                    summary[one.runner_id] = summary[one.runner_id] || {
                                        name: one.runner
                                    };
                                    summary[one.runner_id].times++;
                                    summary[one.runner_id].total_distance += one.total_distance;
                                    summary[one.runner_id].total_time += one.total_time;
                                })
                                callback(_.map(summary, (one) => {
                                    const duration = moment.duration(one.total_time);
                                    return `${one.name} 跑步 ${one.times}次 共 ${one.total_distance} KM 总用时 ${duration.get('hours')}:${duration.get('minutes')}:${duration.get('seconds')}`;
                                }).join('\n'))
                            } else {
                                sessionContext[chat_id]['lastList'] = _.map(data, '_id');
                                const sendMsg = _.map(data, (one, index) => {
                                    const duration = moment.duration(one.total_time);
                                    return `编号(${index + 1})  ${one.runner} 在${moment(one.run_date).format('MM-DD')} 跑步 ${one.total_distance}KM，用时 ${duration.get('hours')}:${duration.get('minutes')}:${duration.get('seconds')}`;
                                })
                                callback(sendMsg.join('\n'))
                            }
                        }
                    })
                break;
            case orders.save.test(commandMsg.order):
                const runInfo = commandMsg.order.match(orders.save)[1];
                this.executeParseUrl({
                    room: commandMsg.room && commandMsg.room.id,
                    from: commandMsg.from,
                    from_name: commandMsg.from_name,
                    url: 'manual ' + runInfo
                }, callback);
                break;
            default:
                callback(`我不知道你要我干什么，\n@我 附带【帮助】指令查看可用指令`)
        }
    }

    executeParseUrl(urlMsg, callback) {
        decives_parser.getDataFromURL(urlMsg.url, (error, data) => {
            if (error) {
                callback();
            } else {
                const instance = new model.runningInfo(data);
                if (!instance.ref_share_id) {
                    return callback();
                }
                instance.group = urlMsg.room || "";
                instance.runner_id = urlMsg.from;
                instance.runner = urlMsg.from_name;
                instance.create_date = moment().valueOf();
                instance.is_deleted = 0
                model.runningInfo.findOne({
                    ref_share_id: instance.ref_share_id
                }, (error, exist) => {
                    if (exist) {
                        const chat_id = urlMsg.room || urlMsg.from;
                        sessionContext[chat_id] = sessionContext[chat_id] || {};
                        sessionContext[chat_id]['ready_delete'] = exist._id;
                        return callback(`已存在：${exist.runner} | ${exist.total_distance} 公里(刪除直接@我 附带【删除】指令)`)
                    }
                    instance.save((error, saved) => {
                        if (!error && saved) {
                            callback(`已保存：${saved.runner} | ${saved.total_distance} 公里`)
                        }
                    });
                })
            }
        });
    }
}

module.exports = new MessageHandler();