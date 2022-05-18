require("dotenv").config();
const {Telegraf, Scenes, Markup, session} = require('telegraf')
const {Stage} = Scenes
const path = require('path')
// const session = require('telegraf/session')
// const Stage = require('telegraf/stage')
// const Extra = require('telegraf/extra')
// const Markup = require('telegraf/markup')
const addPost = require('./add_post')
const TelegrafI18n = require('telegraf-i18n')
const sequelize = require("./db");
const contactDataWizard = require('./test')

const i18n = new TelegrafI18n({
    defaultLanguage: 'ru',
    allowMissing: false,
    directory: path.resolve(__dirname, 'locales'),
    locale: 'ru'
})

const bot = new Telegraf(process.env.BOT_TOKEN_TEST)

const stage = new Stage()
stage.register(addPost)
// stage.register(contactDataWizard)

bot.use(i18n.middleware())
bot.use(session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
    const {i18n} = ctx
    await sequelize.authenticate();
    await sequelize.sync()
    return ctx.replyWithHTML(
        i18n.t('welcome'),
        Markup.keyboard([
            [i18n.t('buttons.addPost')]
        ]).resize())
})

bot.hears(TelegrafI18n.match('buttons.addPost'), (ctx) => {
    return ctx.scene.enter('send-post')
})

bot.hears(('/about'), (ctx) => {
    const {i18n} = ctx
    return ctx.replyWithHTML(
        i18n.t('about'))
})

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch()
