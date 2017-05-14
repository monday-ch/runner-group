const QrcodeTerminal = require('qrcode-terminal');
const finis = require('finis');
const config = require('./config');
const messageHandler = require('./service/message_handler');
const wechaty = require('wechaty');

const log = wechaty.log;


const welcome = `
auth: zhaoli
desc: collection the running data send to wehcat group 
date: 2017-5-14
thanks  https://github.com/zixia/wechaty 
`
console.log(welcome)
const bot = wechaty.Wechaty.instance({
    profile: wechaty.Config.DEFAULT_PROFILE
})

bot
    .on('logout', user => log.info('Bot', `${user.name()} logouted`))
    .on('login', user => {
        log.info('Bot', `${user.name()} logined`)
        bot.say(`Bot login`)
    })
    .on('error', e => {
        log.info('Bot', 'error: %s', e)
        bot.say('Bot error: ' + e.message)
    })
    .on('scan', (url, code) => {
        if (!/201|200/.test(String(code))) {
            const loginUrl = url.replace(/\/qrcode\//, '/l/')
            QrcodeTerminal.generate(loginUrl)
        }
        console.log(`${url}\n[${code}] Scan QR Code in above url to login: `)
    })
    .on('message', m => {
        try {
            const room = m.room()
            console.log((room ? '[' + room.topic() + ']' : '') +
                '<' + m.from().name() + '>' +
                ':' + m.toStringDigest()
            )
            if (m.self()) {
                return;
            }
            if ((!room && !m.obj.url) || (room && config.bot_name.test(m.obj.content))) {
                // 私人聊天  或者 群聊@时候  command           
                const command = {
                    room: room,
                    from: m.obj.from,
                    from_name: m.from().name(),
                    order: m.obj.content.replace(config.bot_name, '')
                }
                messageHandler.executeCommand(command, (message) => {
                    message && m.say(message);
                })
            }
            if (m.obj.url) {
                const urlMessage = {
                    room: m.obj.room,
                    from: m.obj.from,
                    from_name: m.from().name(),
                    url: m.obj.url
                }
                messageHandler.executeParseUrl(urlMessage, (message) => {
                    message && m.say(message);
                })
            }
        } catch (e) {
            log.error('Bot', 'on(message) exception: %s', e)
        }
    })

bot.init()
    .catch(e => {
        log.error('Bot', 'init() fail: %s', e)
        bot.quit()
        process.exit(-1)
    })

finis((code, signal) => {
    const exitMsg = `Bot exit ${code} because of ${signal} `
    console.log(exitMsg)
    bot.say(exitMsg)
})