const Telegraf = require('telegraf')
const path = require('path')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const data = require('./data')
const addPost = require('./add_post')
const sendPost = require('./send_post')
const TelegrafI18n = require('telegraf-i18n')

const i18n = new TelegrafI18n({
    defaultLanguage: 'ru',
    allowMissing: false,
    directory: path.resolve(__dirname, 'locales'),
    locale: 'ru'
})

const bot = new Telegraf(data.token)
const stage = new Stage()
// stage.register(addPost)
stage.register(sendPost)

bot.use(i18n.middleware())
bot.use(session())
bot.use(stage.middleware())

bot.start(({i18n, replyWithHTML}) => {
    return replyWithHTML(
        i18n.t('welcome'),
        Extra
            .markup(Markup.keyboard([
                [i18n.t('buttons.addPost'), i18n.t('buttons.site')]
            ]).resize().oneTime())
    )
})

bot.hears(TelegrafI18n.match('buttons.contacts'), ({i18n, replyWithHTML}) => {
    replyWithHTML(i18n.t('ourNumber'))
})

bot.hears(TelegrafI18n.match('buttons.addPost'), (ctx) => {
    ctx.scene.enter('add-post')
})

bot.hears(TelegrafI18n.match('buttons.site'), (ctx) => {
    ctx.scene.enter('send-post')
})

bot.launch()