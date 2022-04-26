const WizardScene = require('telegraf/scenes/wizard')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const data = require('./data')

const addPost = new WizardScene('add-post',

    async ({wizard, i18n, replyWithHTML, telegram, ctx}) => {

        replyWithHTML(
            i18n.t('category'),
            Extra
                .markup(Markup.removeKeyboard(true))
        )
        return wizard.next()
    },

    ({wizard, session, scene, message, chat, i18n, replyWithHTML}) => {
        if (message.text == '/start') {
            return scene.enter('add-post')
        }

        if (+chat.id < 0) {
            return
        }

        if (!message.text && session.category) {
            return replyWithHTML(i18n.t('category'))
        }

        replyWithHTML(
            i18n.t('description'),
            // Extra
            //   .markup(Markup.keyboard([
            //     [Markup.contactRequestButton(i18n.t('buttons.sendNumber'))]
            //   ]).resize().oneTime())
        )

        session.category = message.text
        return wizard.next()
    },

    ({wizard, session, scene, message, i18n, replyWithHTML}) => {
        if (message.text == '/start') {
            return scene.enter('add-post')
        }

        if (!message.text && !message.description) {
            return replyWithHTML(i18n.t('description'))
        }

        replyWithHTML(
            i18n.t('price'),
            // Extra
            //   .markup(Markup.keyboard([
            //     [Markup.locationRequestButton(i18n.t('buttons.sendLocation'))]
            //   ]).resize().oneTime())
        )

        session.description = String(message.text);
        return wizard.next()
    },


    ({wizard, session, scene, message, i18n, replyWithHTML}) => {
        if (message.text == '/start') {
            return scene.enter('add-post')
        }

        if (!message.text) {
            return replyWithHTML(i18n.t('price'))
        }

        replyWithHTML(
            i18n.t('image'),
            // Extra
            //   .markup(Markup.keyboard([
            //     [Markup.locationRequestButton(i18n.t('buttons.sendLocation'))]
            //   ]).resize().oneTime())
        )
        session.price = Number(message.text)
        return wizard.next()
    },

    async (ctx) => {
        const {scene, session, message, i18n, replyWithHTML, telegram,} = ctx
        let res = []
        // console.log("image", ctx)

        if (message.text == '/start') {
            return scene.enter('add-post')
        }


        if (message.photo.length === 0) {
            return replyWithHTML(
                i18n.t('image'),
                // Extra
                //   .markup(Markup.keyboard([
                //     [Markup.locationRequestButton(i18n.t('buttons.sendLocation'))]
                //   ]).resize().oneTime())
            )
        }
        session.image = message.photo[0].file_id

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
            ),
            // Extra
            //   .markup(Markup.inlineKeyboard([
            //     [Markup.callbackButton(i18n.t('getLocation'), `loc_${message.location.latitude}_${message.location.longitude}`)]
            //   ]))
        )


        await telegram.sendPhoto(
            data.chatId, session.image
        )


        // await telegram.sendMediaGroup(
        //     data.chatId, [{
        //         "type": "photo",
        //         "media": res[0]
        //     }, {
        //         "type": "photo",
        //         "media": res[1]
        //     }]
        // )

        scene.leave()
    }
)

module.exports = addPost