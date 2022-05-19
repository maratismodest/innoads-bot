require("dotenv").config();
const {Telegraf, Scenes, Markup, session} = require('telegraf')
const {Stage} = Scenes
const path = require('path')
const addPost = require('./add_post')
const TelegrafI18n = require('telegraf-i18n')
const sequelize = require("./db");
const {Tg} = require("./models/models");


const i18n = new TelegrafI18n({
    defaultLanguage: 'ru',
    allowMissing: false,
    directory: path.resolve(__dirname, 'locales'),
    locale: 'ru'
})

const bot = new Telegraf(process.env.BOT_TOKEN)

const stage = new Stage()
stage.register(addPost)
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

bot.hears('/donate', async (ctx) => {
    const {i18n} = ctx
    await ctx.replyWithPhoto('https://innoads.ru/icons/icon-256x256.png')
    return ctx.replyWithHTML(
        i18n.t('donate'),
        Markup.inlineKeyboard([
                [Markup.button.url(i18n.t('donateLink'), 'https://pay.cloudtips.ru/p/b11b52b4')],
            ]
        ))
})

bot.hears(('/about'), (ctx) => {
    const {i18n} = ctx
    return ctx.replyWithHTML(
        i18n.t('about'))
})

bot.hears(('/profile'), async (ctx) => {
    const post = await Tg.findOne({
        where: {
            id: ctx.chat.id
        }
    });
    return ctx.replyWithHTML(post.photo_url)
})

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch()
