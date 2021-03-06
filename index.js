require("dotenv").config();
const {Telegraf, Scenes, Markup, session} = require('telegraf')
const {Stage} = Scenes
const path = require('path')
const addPost = require('./add_post')
const search = require('./search')
const TelegrafI18n = require('telegraf-i18n')
const sequelize = require("./db");
const {Post, Tg} = require("./models/models");


// Markup.keyboard([[i18n.t('buttons.addPost')]]).resize()

const i18n = new TelegrafI18n({
    defaultLanguage: 'ru', allowMissing: false, directory: path.resolve(__dirname, 'locales'), locale: 'ru'
})

const bot = new Telegraf(process.env.BOT_TOKEN)

const stage = new Stage()
stage.register(addPost)
stage.register(search)
bot.use(i18n.middleware())
bot.use(session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
    const {i18n, chat} = ctx
    await sequelize.authenticate();
    await sequelize.sync()
    try {
        await Tg.findOrCreate({
            where: {id: chat.id}, defaults: {
                ...chat
            },
        });
    } catch (e) {
        console.log('ERROR', e)
    }
    await ctx.replyWithHTML(i18n.t('welcome'), {
        reply_markup: {
            remove_keyboard: true
        }
    })
    await ctx.replyWithHTML('Чтобы подать объявление, нажмите кнопку', Markup.inlineKeyboard([
        [Markup.button.callback('Подать объявление', 'add')]
    ]).resize())
})

bot.action('add', (ctx) => {
    return ctx.scene.enter('send-post')
})

bot.hears('/add', (ctx) => {
    return ctx.scene.enter('send-post')
})


bot.hears('/donate', async (ctx) => {
    const {i18n} = ctx
    return ctx.replyWithHTML(i18n.t('donate'), Markup.inlineKeyboard([[Markup.button.url(i18n.t('donateLink'), 'https://pay.cloudtips.ru/p/b11b52b4')],]))
})

bot.hears(('/about'), (ctx) => {
    const {i18n} = ctx
    return ctx.replyWithHTML(i18n.t('about'))
})

bot.hears(('/image'), (ctx) => {
    return ctx.scene.enter('add-image')
})

bot.hears(('/search'), (ctx) => {
    return ctx.scene.enter('search')
})

bot.hears(('/profile'), async (ctx) => {
    const posts = await Post.findAll({
        where: {
            tgId: ctx.chat.id
        }
    });
    const res = posts.map(post => [Markup.button.url(post.title, `https://innoads.ru/post/${post.slug}`)])
    await ctx.replyWithHTML('Мои объявления', Markup.inlineKeyboard(res))
    return ctx.replyWithHTML('Для создания, редактирования, повторной публикации ваших объявлений можете зайти в личный кабинет на сайте', Markup.inlineKeyboard([Markup.button.url('Личный кабинет', `https://innoads.ru/profile`)]))
})

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.launch()