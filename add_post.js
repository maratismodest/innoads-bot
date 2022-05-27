const {Scenes, Markup} = require('telegraf');
const {WizardScene} = Scenes
const axios = require('axios')
const slug = require("slug");
const {options} = require("./uitls/constants");
const {getLink, postUser} = require("./uitls/functions");
const {Post, Tg} = require("./models/models");

const PHOTO_LIMIT_COUNT = 4;
const START = '/start'
const DONATE = '/donate'
const PROFILE = '/profile'

const getButtons = (i18n) => [i18n.t('categories.sell'), i18n.t('categories.estate'), i18n.t('categories.buy'), i18n.t('categories.service'), i18n.t('categories.vacation')]

const checkCommands = async (ctx) => {
    const {i18n, message} = ctx;
    if (message && message.text === START) {
        await ctx.replyWithHTML(i18n.t('welcome'))
        return true
    }
    if (message && message.text === DONATE) {
        await ctx.replyWithPhoto('https://gitarist.shop/uploads/test/donate.jpg')
        await ctx.replyWithHTML(i18n.t('donate'), Markup.inlineKeyboard([[Markup.button.url(i18n.t('donateLink'), 'https://pay.cloudtips.ru/p/b11b52b4')],]))
        return true
    }
    if (message && message.text === PROFILE) {
        const posts = await Post.findAll({
            where: {
                tgId: ctx.chat.id
            }
        });
        const res = posts.map(post => [Markup.button.url(post.title, `https://innoads.ru/post/${post.slug}`)])
        await ctx.replyWithHTML('Мои объявления', Markup.inlineKeyboard(res))
        return true
    }
    return false
}

const addPost = new WizardScene('send-post', //Category
    async (ctx) => {
        const {wizard, i18n, session, chat, message, scene} = ctx;

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }

        if (!chat.username) {
            return ctx.replyWithHTML('Не могу создать объявление, пока у тебя не появится алиас!')
        }

        const [user, created] = await Tg.findOrCreate({
            where: {id: chat.id}, defaults: {
                ...chat
            },
        });
        if (user.role === 'BAN') {
            await scene.leave()
            return ctx.replyWithHTML('Не могу создать объявление: вы забанены!')
        }
        session.image = []
        const buttons = getButtons(i18n)
        session.buttons = buttons

        await ctx.replyWithHTML(i18n.t('category'), Markup.inlineKeyboard([[Markup.button.callback(buttons[0], buttons[0])], [Markup.button.callback(buttons[1], buttons[1])], [Markup.button.callback(buttons[2], buttons[2])], [Markup.button.callback(buttons[3], buttons[3])], [Markup.button.callback(buttons[4], buttons[4])]]))
        return wizard.next()
    }, //Title
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

        const buttons = session.buttons

        if (message || !callbackQuery || !callbackQuery.data || !buttons.includes(callbackQuery.data)) {
            return ctx.reply('Внимание: выберите одну из категорий!')
        }

        session.category = callbackQuery.data
        await ctx.replyWithHTML(`Категория: #${session.category} \n${i18n.t('title')}`)
        return wizard.next()
    }, //Description
    async (ctx) => {
        const {
            wizard, session, i18n, message, scene
        } = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }
        const {text} = message

        if (!text) {
            return await ctx.replyWithHTML(i18n.t('title'))
        }

        session.title = text
        await ctx.replyWithHTML(`${i18n.t('description')}`)
        return wizard.next()
    }, //Price
    async (ctx) => {
        const {wizard, session, message, i18n, chat, scene} = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }
        if (+chat.id < 0) {
            return
        }

        const {text} = message
        if (!text) {
            return await ctx.replyWithHTML(i18n.t('description'))
        }
        session.description = text

        await ctx.replyWithHTML(i18n.t('price'))
        return wizard.next()
    }, //Image
    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, chat} = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }

        if (+chat.id < 0) {
            return
        }

        if (!message.text || isNaN(+message.text)) {
            return ctx.replyWithHTML(i18n.t('price'))
        }

        session.price = message.text
        await ctx.replyWithHTML(i18n.t('image'))

        return wizard.next()
    },

    async (ctx) => {
        const {
            wizard, session, message, i18n, scene
        } = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }

        const {media_group_id, photo} = message
        if (media_group_id) {
            if (session.media_group_id && session.media_group_id === media_group_id) {
                return
            }
            session.media_group_id = media_group_id
            return ctx.replyWithHTML('Добавлять можно только по одной фотографии. Добавьте фотографию')
        }
        if (!photo || !photo.length || photo.length === 0) {
            return ctx.replyWithHTML('Что-то пошло не так. Попробуйте еще раз добавить изображение')
        }

        const getPhoto = photo.find(x => ((x.width <= 800) && (x.width >= 400))) || photo[photo.length - 1]

        session.image = [...session.image, getPhoto.file_id]

        await ctx.replyWithHTML(i18n.t('buttons.photo.add') + '?', Markup.inlineKeyboard([[Markup.button.callback(i18n.t('buttons.photo.add'), i18n.t('buttons.photo.add'))], [Markup.button.callback(i18n.t('buttons.photo.stop'), i18n.t('buttons.photo.stop'))]]))
        return wizard.next()
    },

    //Add More Photo
    async (ctx) => {
        const {wizard, i18n, callbackQuery, session, message, scene} = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }
        if (message && message.text) {
            return await ctx.replyWithHTML(i18n.t('buttons.photo.add') + '?', Markup.inlineKeyboard([[Markup.button.callback(i18n.t('buttons.photo.add'), i18n.t('buttons.photo.add'))], [Markup.button.callback(i18n.t('buttons.photo.stop'), i18n.t('buttons.photo.stop'))]]))
        }

        if (session.image.length === PHOTO_LIMIT_COUNT) {
            await ctx.replyWithHTML('Лимит фото достигнут')
            await ctx.replyWithHTML(i18n.t('confirm') + '?', Markup.inlineKeyboard([[Markup.button.callback(i18n.t('yes'), i18n.t('yes'))], [Markup.button.callback(i18n.t('no'), i18n.t('no'))]]))
            return wizard.next()
        }

        if (message && message.text) {
            return ctx.replyWithHTML('Что-то пошло не так!')
        }


        if (callbackQuery.data === i18n.t('buttons.photo.add')) {
            await ctx.replyWithHTML(i18n.t('image')), Markup.removeKeyboard()
            return wizard.back()
        }

        await ctx.replyWithHTML(i18n.t('confirm') + '?', Markup.inlineKeyboard([[Markup.button.callback(i18n.t('yes'), i18n.t('yes'))], [Markup.button.callback(i18n.t('no'), i18n.t('no'))]]))
        return wizard.next()
    },

    async (ctx) => {
        const {
            scene, session, message, i18n, replyWithHTML, telegram, callbackQuery, chat: {username, id}
        } = ctx

        const shouldLeave = await checkCommands(ctx)
        if (shouldLeave) {
            return await scene.leave()
        }


        await ctx.editMessageReplyMarkup({
            reply_markup: {remove_keyboard: true}
        })


        const cb = callbackQuery.data
        // console.log("CB", cb)
        if (cb === i18n.t('no')) {
            await ctx.replyWithHTML('Объявление не опубликовано')
            return scene.leave()
        }

        await postUser(ctx.chat)

        await telegram.sendMediaGroup(process.env.BOT_CHAT, session.image.map((img, index) => {
            if (index === 0) {
                return {
                    "type": "photo", "media": img, "caption": i18n.t('newPost', {
                        category: session.category,
                        title: session.title,
                        description: session.description,
                        price: session.price,
                        alias: username
                    })
                }
            }
            return {
                "type": "photo", "media": img,
            }
        }))

        await ctx.replyWithHTML(i18n.t('donate'), Markup.inlineKeyboard([[Markup.button.url(i18n.t('donateLink'), 'https://pay.cloudtips.ru/p/b11b52b4')], [Markup.button.url(i18n.t('goToChannel'), 'https://t.me/innoads')]]))

        const asyncRes = await Promise.all(session.image.map(async (file_id) => {
            const res = await getLink(file_id)
            return res;
        }));

        const slugTitle = slug(session.title) + "-" + Math.floor(Math.random() * 100)

        const formData = {
            title: session.title,
            body: session.description,
            price: session.price,
            preview: asyncRes[0],
            images: asyncRes.join('||'),
            slug: slugTitle,
            telegram: username,
            tgId: id,
            categoryId: options.find(x => x.label == session.category).value
        }

        await axios.post(`${process.env.BOT_BACKEND}/post`, formData)
        await scene.leave()
    })

module.exports = addPost