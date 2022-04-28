const WizardScene = require('telegraf/scenes/wizard')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const data = require('./data')

const addPost = new WizardScene('add-post',
    //Category
    (ctx) => {
        const {wizard, i18n, replyWithHTML, session} = ctx;
        const buttons = [i18n.t('categories.sell'), i18n.t('categories.buy'), i18n.t('categories.service'), i18n.t('categories.rent')]
        session.image = []
        session.buttons = buttons
        replyWithHTML(
            i18n.t('category'),
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.callbackButton(buttons[0], buttons[0])],
                    [Markup.callbackButton(buttons[1], buttons[1])],
                    [Markup.callbackButton(buttons[2], buttons[2])],
                    [Markup.callbackButton(buttons[3], buttons[3])]
                ]))
        )
        return wizard.next()
    },
    //Description
    async (ctx) => {
        const {wizard, session, i18n, replyWithHTML, callbackQuery, editMessageReplyMarkup, message, scene} = ctx
        if (!message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }
        if (message && message.text == '/start') {
            return scene.enter('add-post')
        }
        const buttons = session.buttons
        if (!callbackQuery || !callbackQuery.data || !buttons.includes(callbackQuery.data)) {
            return
        }
        session.category = callbackQuery.data
        replyWithHTML(
            `Категория: #${session.category} \n${i18n.t('description')}`, Extra
                .markup(Markup.removeKeyboard(true))
        )
        return wizard.next()
    },
    //Price
    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, chat} = ctx

        if (message && message.text == '/start') {
            return scene.enter('add-post')
        }

        if (+chat.id < 0) {
            return
        }

        if (!message.text) {
            return replyWithHTML(i18n.t('description'))
        }
        session.description = message.text
        replyWithHTML(
            i18n.t('price'), Extra
                .markup(Markup.removeKeyboard(true))
        )
        return wizard.next()
    },
    //Description
    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, chat} = ctx

        if (message.text == '/start') {
            return scene.enter('add-post')
        }

        if (+chat.id < 0) {
            return
        }

        if (!message.text) {
            return replyWithHTML(i18n.t('price'))
        }
        session.price = message.text
        replyWithHTML(
            i18n.t('image'), Extra
                .markup(Markup.removeKeyboard(true))
        )

        return wizard.next()
    },

    async (ctx) => {
        const {wizard, session, scene, message, i18n, replyWithHTML, editMessageReplyMarkup} = ctx
        if (!message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }
        if (message.text == '/start') {
            return scene.enter('add-post')
        }
        if (message.media_group_id) {
            if (session.media_group_id && session.media_group_id === message.media_group_id) {
                return
            }
            session.media_group_id = message.media_group_id
            return replyWithHTML('Добавлять можно только по одной фотографии. Добавьте фотографию')
        }
        if (!message.photo || !message.photo.length || message.photo.length === 0) {
            return
        }
        const currentImage = message.photo[0].file_id
        session.image = [...session.image, currentImage]

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
        const {wizard, scene, message, i18n, replyWithHTML, callbackQuery, editMessageReplyMarkup} = ctx
        if (!message) {
            await editMessageReplyMarkup({
                reply_markup: {remove_keyboard: true},
            })
        }

        if (message && message.text == '/start') {
            return scene.enter('add-post')
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
        // console.log("chat",chat)
        await editMessageReplyMarkup({
            reply_markup: {remove_keyboard: true},
        })
        const cb = callbackQuery.data
        // console.log("CB", cb)
        if (cb === i18n.t('no')) {
            replyWithHTML(
                'Объявление не опубликовано',
                Extra
                    .markup(Markup.removeKeyboard(true))
            )
            return scene.leave()
        }
        replyWithHTML(
            i18n.t('thanks'),
            Extra
                .markup(Markup.removeKeyboard(true))
        )

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

        scene.leave()
    }
)

module.exports = addPost

// Категория: #${session.category} \n\nОписание: ${session.description} \n\nЦена: ${session.price}