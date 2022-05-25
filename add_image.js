const {Scenes, Markup} = require('telegraf');
const {WizardScene} = Scenes
const {getLink, postUser} = require("./uitls/functions");

const START = '/start'


const addImage = new WizardScene('add-image',
    //Image
    async (ctx) => {
        const {
            wizard,
            session,
            message,
            i18n,
            scene
        } = ctx

        if (message && message.text === START) {
            await ctx.replyWithHTML(i18n.t('welcome'))
            return ctx.scene.leave()
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

        session.image = [getPhoto.file_id]

        await ctx.replyWithHTML(
            i18n.t('buttons.photo.add') + '?',
            Markup.inlineKeyboard([
                    [Markup.button.callback(i18n.t('buttons.photo.add'), i18n.t('buttons.photo.add'))],
                    [Markup.button.callback(i18n.t('buttons.photo.stop'), i18n.t('buttons.photo.stop'))]
                ]
            )
        )
        return wizard.next()
    },

    async (ctx) => {
        const {
            scene,
            session,
            message,
            i18n,
            telegram,
            callbackQuery,
            chat: {username, id}
        } = ctx

        if (message && message.text === START) {
            await ctx.replyWithHTML(i18n.t('welcome'))
            await ctx.scene.leave()
        }


        await ctx.editMessageReplyMarkup({
            reply_markup: {remove_keyboard: true}
        })


        const cb = callbackQuery.data
        // console.log("CB", cb)
        if (cb === i18n.t('no')) {
            await ctx.replyWithHTML(
                'Объявление не опубликовано'
            )
            return scene.leave()
        }

        await telegram.sendMediaGroup(
            process.env.BOT_CHAT, session.image.map((img, index) => {
                if (index === 0) {
                    return {
                        "type": "photo",
                        "media": img,
                        "caption": i18n.t(
                            'newPost', {
                                category: session.category,
                                title: session.title,
                                description: session.description,
                                price: session.price,
                                alias: username
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

        const asyncRes = await Promise.all(session.image.map(async (file_id) => {
            const res = await getLink(file_id)
            return res;
        }));

        console.log("asyncRes", asyncRes)

        await scene.leave()
    }
)

module.exports = addImage

// Категория: #${session.category} \n\nОписание: ${session.description} \n\nЦена: ${session.price}