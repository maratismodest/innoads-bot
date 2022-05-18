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

const getInvoice = (id) => {
    const invoice = {
        chat_id: id, // Уникальный идентификатор целевого чата или имя пользователя целевого канала
        provider_token: process.env.PROVIDER_TOKEN, // токен выданный через бот @SberbankPaymentBot
        start_parameter: 'get_access', //Уникальный параметр глубинных ссылок. Если оставить поле пустым, переадресованные копии отправленного сообщения будут иметь кнопку «Оплатить», позволяющую нескольким пользователям производить оплату непосредственно из пересылаемого сообщения, используя один и тот же счет. Если не пусто, перенаправленные копии отправленного сообщения будут иметь кнопку URL с глубокой ссылкой на бота (вместо кнопки оплаты) со значением, используемым в качестве начального параметра.
        title: 'InnoAds', // Название продукта, 1-32 символа
        description: 'Доска объявлений города Иннополис', // Описание продукта, 1-255 знаков
        currency: 'RUB', // Трехбуквенный код валюты ISO 4217
        prices: [{label: 'Сумма', amount: 100 * 60}], // Разбивка цен, сериализованный список компонентов в формате JSON 100 копеек * 100 = 100 рублей
        photo_url: 'https://innoads.ru/icons/icon-512x512.png', // URL фотографии товара для счета-фактуры. Это может быть фотография товара или рекламное изображение услуги. Людям больше нравится, когда они видят, за что платят.
        photo_width: 512, // Ширина фото
        photo_height: 512, // Длина фото
        payload: { // Полезные данные счета-фактуры, определенные ботом, 1–128 байт. Это не будет отображаться пользователю, используйте его для своих внутренних процессов.
            unique_id: `${id}_${Number(new Date())}`,
            provider_token: process.env.PROVIDER_TOKEN
        }
    }

    return invoice
}

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

bot.hears('pay', (ctx) => {
    return ctx.replyWithInvoice(getInvoice(ctx.from.id)) //  метод replyWithInvoice для выставления счета
})
bot.on('pre_checkout_query', (ctx) => ctx.answerPreCheckoutQuery(true)) // ответ на предварительный запрос по оплате

bot.on('successful_payment', async (ctx, next) => { // ответ в случае положительной оплаты
    await ctx.reply('SuccessfulPayment')
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
