const WizardScene = require('telegraf/scenes/wizard')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const data = require('./data')

const addPost = new WizardScene('add-post',
    ({wizard, i18n, replyWithHTML, telegram, ctx}) => {
        replyWithHTML(
            i18n.t('category'),
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.callbackButton(i18n.t('categories.sell'), i18n.t('categories.sell')), Markup.callbackButton(i18n.t('categories.buy'), i18n.t('categories.buy'))],
                    [Markup.callbackButton(i18n.t('categories.service'), i18n.t('categories.service')), Markup.callbackButton(i18n.t('categories.rent'), i18n.t('categories.rent'))]
                ]))
        )
        return wizard.next()
    },
    ({wizard, session, scene, message, chat, i18n, replyWithHTML}) => {
        session.image = []

        if (message.text == '/start') {
            return scene.enter('add-post')
        }

        if (+chat.id < 0) {
            return
        }
        replyWithHTML(
            i18n.t('image'), Extra
                .markup(Markup.removeKeyboard(true))
        )
        return wizard.next()
    },

    async ({wizard, session, scene, message, i18n, replyWithHTML, chat}) => {
        if (!message.photo) {
            return replyWithHTML(i18n.t('image')), Extra
                .markup(Markup.removeKeyboard(true))
        }
        const currentImage = message.photo[0].file_id
        session.image = [...session.image, currentImage]

        replyWithHTML(
            i18n.t('buttons.addPhoto') + '?',
            Extra
                .markup(Markup.inlineKeyboard([
                    [Markup.callbackButton(i18n.t('buttons.addPhoto'), i18n.t('buttons.addPhoto'))],
                    [Markup.callbackButton(i18n.t('buttons.stop'), i18n.t('buttons.stop'))]
                ]))
        )


        return wizard.next()
    },


    async ({wizard, session, scene, message, i18n, replyWithHTML, callbackQuery, editMessageReplyMarkup}) => {
        if (message && message.text == '/start') {
            return scene.enter('add-post')
        }
        await editMessageReplyMarkup({
            reply_markup: {remove_keyboard: true},
        })

        const cb = callbackQuery.data
        console.log("CB", cb)
        if (cb === i18n.t('buttons.addPhoto')) {
            replyWithHTML(i18n.t('image'))
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
        const {scene, session, message, i18n, replyWithHTML, telegram, callbackQuery, editMessageReplyMarkup} = ctx
        await editMessageReplyMarkup({
            reply_markup: {remove_keyboard: true},
        })
        const cb = callbackQuery.data
        console.log("CB", cb)
        if (cb === i18n.t('no')) {
            replyWithHTML(
                'NEXT TIME!',
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

        await telegram.sendMessage(
            data.chatId,
            i18n.t(
                'newPost', {
                    category: session.category,
                    description: session.description,
                    price: session.price,
                }
            )
        )

        await telegram.sendMediaGroup(
            data.chatId, session.image.map((img) => {
                return {
                    "type": "photo",
                    "media": img
                }
            })
        )

        scene.leave()
    }
)

module.exports = addPost