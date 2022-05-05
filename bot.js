require("dotenv").config();
const Telegraf = require('telegraf')
const path = require('path')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const data = require('./data')
const sendPost = require('./send_post')
const TelegrafI18n = require('telegraf-i18n')
const sequelize = require("./db");

const i18n = new TelegrafI18n({
    defaultLanguage: 'ru',
    allowMissing: false,
    directory: path.resolve(__dirname, 'locales'),
    locale: 'ru'
})

const bot = new Telegraf(data.token)
const stage = new Stage()
stage.register(sendPost)

bot.use(i18n.middleware())
bot.use(session())
bot.use(stage.middleware())

bot.start(async ({i18n, replyWithHTML}) => {
    await sequelize.authenticate();
    await sequelize.sync();

    return replyWithHTML(
        i18n.t('welcome'),
        Extra
            .markup(Markup.keyboard([
                [i18n.t('buttons.addPost')]
            ]).resize())
    )
})

bot.hears(TelegrafI18n.match('buttons.contacts'), ({i18n, replyWithHTML}) => {
    replyWithHTML(i18n.t('ourNumber'))
})

bot.hears(TelegrafI18n.match('buttons.addPost'), (ctx) => {
    ctx.scene.enter('send-post')
})

bot.hears(TelegrafI18n.match('links.innoads'), ({i18n, replyWithHTML,}) => {
    // ctx.scene.enter('send-post')
    replyWithHTML(
        'Переходим в канал:',
        Extra
            .markup(Markup.inlineKeyboard([
                [Markup.urlButton(i18n.t('links.innoads'), 'https://t.me/innoads')],
            ]))
    )
})

// bot.hears(TelegrafI18n.match('buttons.site'), (ctx) => {
//     ctx.scene.enter('send-post')
// })

bot.launch()