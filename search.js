const {Scenes, Markup} = require('telegraf');
const {WizardScene} = Scenes
const {Post, Tg, Count} = require("./models/models");
const sequelize = require("sequelize");
const {Op} = sequelize;

const START = '/start'
const DONATE = '/donate'
const PROFILE = '/profile'

const checkCommands = async (ctx) => {
    const {i18n, message} = ctx;
    if (message && message.text === START) {
        await ctx.replyWithHTML(i18n.t('welcome'), Markup.keyboard([[i18n.t('buttons.search')]]).resize())
        return true
    }
    if (message && message.text === DONATE) {
        await ctx.replyWithHTML(i18n.t('donate'), Markup.inlineKeyboard([[Markup.button.url(i18n.t('donateLink'), i18n.t('links.donate'))],]))
        return true
    }
    if (message && message.text === PROFILE) {
        const posts = await Post.findAll({
            where: {
                tgId: ctx.chat.id
            }
        });
        const res = posts.map(post => [Markup.button.url(post.title, `https://innoads.ru/post/${post.slug}`)])
        await ctx.replyWithHTML(i18n.t('myAds'), Markup.inlineKeyboard(res))
        return true
    }
    return false
}

const search = new WizardScene('search',
    async (ctx) => {
        const {wizard, i18n, session, chat, telegram, scene} = ctx;

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }


        await ctx.replyWithHTML('Введи слово для поиска')
        return wizard.next()
    },
    async (ctx) => {
        const {wizard, session, i18n, replyWithHTML, callbackQuery, message, scene} = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }


        if (!message) {
            await ctx.editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true}
            })
        }

        const posts = await Post.findAll({
            where: {
                vector: {
                    [Op.match]: sequelize.fn("to_tsquery", "russian", message.text),
                }
            }
        });
        const res = posts.map(post => [Markup.button.url(post.title.substr(0, 10) + ": " + post.price, `https://innoads.ru/post/${post.slug}`)])
        await ctx.replyWithHTML('Мои объявления', Markup.inlineKeyboard(res))
        await ctx.replyWithHTML('done')
        await scene.leave()
    }
)


module.exports = search