const WizardScene = require('telegraf/scenes/wizard')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const data = require('./data')
const axios = require('axios')
const slug = require("slug");
const {options} = require("./uitls/constants");
const {getLink, postUser} = require("./uitls/functions");

const PHOTO_LIMIT_COUNT = 4;
const START = '/start'

const getButtons = (i18n) => [i18n.t('categories.sell'), i18n.t('categories.estate'), i18n.t('categories.buy'), i18n.t('categories.service'), i18n.t('categories.vacation')]

const handleStart = (ctx) => {
    const {message, scene, i18n, replyWithHTML} = ctx
    if (message && message.text == START) {
        scene.leave()
        return replyWithHTML(
            i18n.t('welcome'),
            Extra
                .markup(Markup.keyboard([
                    [i18n.t('buttons.addPost')]
                ]).resize())
        )
    }
}
const handleSend = (ctx) => {
    const {message, i18n, scene} = ctx;

    if (message && message.text == i18n.t('buttons.addPost')) {
        return scene.enter('send-post')
    }
}

const addPost = new WizardScene('send-post',
    //Category
    (ctx) => {
        const {wizard, i18n, replyWithHTML, session, chat, message} = ctx;
        handleStart(ctx)
        if (!chat.username) {
            return replyWithHTML('Не могу создать объявление, пока у тебя не появится алиас!')
        }
        session.image = []
        const buttons = getButtons(i18n)
        session.buttons = buttons

        replyWithHTML(
            i18n.t('category'),
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.callbackButton(buttons[0], buttons[0])],
                    [Markup.callbackButton(buttons[1], buttons[1])],
                    [Markup.callbackButton(buttons[2], buttons[2])],
                    [Markup.callbackButton(buttons[3], buttons[3])],
                    [Markup.callbackButton(buttons[4], buttons[4])]
                ]))
        )
        return wizard.next()
    },
    //Description
    async (ctx) => {
        const {wizard, session, i18n, replyWithHTML, callbackQuery, editMessageReplyMarkup, message, scene} = ctx
        handleStart(ctx)
        handleSend(ctx)

        if (!message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }

        const buttons = session.buttons

        if (message || !callbackQuery || !callbackQuery.data || !buttons.includes(callbackQuery.data)) {
            return ctx.reply('Внимание: выберите одну из категорий!')
        }

        session.category = callbackQuery.data
        replyWithHTML(
            `Категория: #${session.category} \n${i18n.t('description')}`
        )
        return wizard.next()
    },
    //Price
    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, chat} = ctx

        handleStart(ctx)
        handleSend(ctx)

        if (+chat.id < 0) {
            return
        }

        if (!message.text) {
            return replyWithHTML(i18n.t('description'))
        }
        session.description = message.text
        replyWithHTML(
            i18n.t('price')
        )
        return wizard.next()
    },
    //Description
    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, chat} = ctx

        handleStart(ctx)
        handleSend(ctx)

        if (+chat.id < 0) {
            return
        }

        if (!message.text || isNaN(+message.text)) {
            return replyWithHTML(i18n.t('price'))
        }

        session.price = message.text
        replyWithHTML(
            i18n.t('image')
        )

        return wizard.next()
    },

    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, editMessageReplyMarkup} = ctx

        handleStart(ctx)
        handleSend(ctx)

        if (!message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }

        if (message.media_group_id) {
            if (session.media_group_id && session.media_group_id === message.media_group_id) {
                return
            }
            session.media_group_id = message.media_group_id
            return replyWithHTML('Добавлять можно только по одной фотографии. Добавьте фотографию')
        }
        if (!message.photo || !message.photo.length || message.photo.length === 0) {
            return replyWithHTML('Что-то пошло не так. Попробуйте еще раз добавить изображение')
        }
        // console.log('message', message.photo)
        const getPhoto = message.photo.find(x => (x.width < 600) && (x.width > 400)) || message.photo[message.photo.length - 1]
        // const currentImage = message.photo[message.photo.length - 1].file_id
        session.image = [...session.image, getPhoto.file_id]

        replyWithHTML(
            i18n.t('buttons.photo.add') + '?',
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.callbackButton(i18n.t('buttons.photo.add'), i18n.t('buttons.photo.add'))],
                    [Markup.callbackButton(i18n.t('buttons.photo.stop'), i18n.t('buttons.photo.stop'))]
                ]))
        )
        return wizard.next()
    },

    //Add More Photo
    async (ctx) => {
        const {wizard, scene, message, i18n, replyWithHTML, callbackQuery, editMessageReplyMarkup, session} = ctx

        handleStart(ctx)
        handleSend(ctx)

        if (!message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }

        if (message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }

        if (session.image.length === PHOTO_LIMIT_COUNT) {
            replyWithHTML(
                'Лимит фото достигнут'
            )
            replyWithHTML(
                i18n.t('confirm') + '?',
                Extra
                    .markup(Markup.inlineKeyboard([
                        [Markup.callbackButton(i18n.t('yes'), i18n.t('yes'))],
                        [Markup.callbackButton(i18n.t('no'), i18n.t('no'))]
                    ]))
            )
            return wizard.next()
        }

        if (callbackQuery.data === i18n.t('buttons.photo.add')) {
            replyWithHTML(i18n.t('image')), Extra
                .markup(Markup.removeKeyboard(true))
            return wizard.back()
        }

        replyWithHTML(
            i18n.t('confirm') + '?',
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.callbackButton(i18n.t('yes'), i18n.t('yes'))],
                    [Markup.callbackButton(i18n.t('no'), i18n.t('no'))]
                ]))
        )
        return wizard.next()
    },

    async (ctx) => {
        const {
            scene,
            session,
            message,
            i18n,
            replyWithHTML,
            telegram,
            callbackQuery,
            editMessageReplyMarkup,
            chat
        } = ctx

        handleStart(ctx)

        if (message) {
            return replyWithHTML(
                i18n.t('confirm') + '?',
                Extra
                    .markup(Markup.inlineKeyboard([
                        [Markup.callbackButton(i18n.t('yes'), i18n.t('yes'))],
                        [Markup.callbackButton(i18n.t('no'), i18n.t('no'))]
                    ])))
        }
        await editMessageReplyMarkup({
            reply_markup: {remove_keyboard: true},
        })

        const cb = callbackQuery.data
        // console.log("CB", cb)
        if (cb === i18n.t('no')) {
            replyWithHTML(
                'Объявление не опубликовано'
            )
            return scene.leave()
        }

        await postUser(chat)

        await telegram.sendMediaGroup(
            data.chatId, session.image.map((img, index) => {
                if (index === 0) {
                    return {
                        "type": "photo",
                        "media": img,
                        "caption": i18n.t(
                            'newPost', {
                                category: session.category,
                                description: session.description,
                                price: session.price,
                                alias: chat.username
                            }
                        )
                    }
                }
                return {
                    "type": "photo",
                    "media": img,
                }
            })
        )

        replyWithHTML(
            i18n.t('thanks'),
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.urlButton(i18n.t('goToChannel'), 'https://t.me/innoads')],
                ]))
        )

        const asyncRes = await Promise.all(session.image.map(async (file_id) => {
            const res = await getLink(file_id)
            return res;
        }));

        const title = session.description.substring(0, 20)
        const slugTitle = slug(title) + "-" + Math.floor(Math.random() * 100)

        const formData = {
            title: title,
            body: session.description,
            price: session.price,
            preview: asyncRes[0],
            images: asyncRes.join('||'),
            slug: slugTitle,
            telegram: chat.username,
            tgId: chat.id,
            categoryId: options.find(x => x.label == session.category).value
        }

        await axios.post(`${data.backend}/post`, formData)


        scene.leave()
    }
)

module.exports = addPost

// Категория: #${session.category} \n\nОписание: ${session.description} \n\nЦена: ${session.price}