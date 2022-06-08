const axios = require("axios");
const {Tg} = require("../models/models");
const FormData = require('form-data');
const SECRET = 'secret'

const getLink = async (file_id) => {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${file_id}`)
        const aLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${res.data.result.file_path}`
        const response = await axios.get(aLink, {responseType: 'arraybuffer'})
        const formData = new FormData();
        formData.append("image", response.data, `${Date.now()}.jpg`);
        const result = await axios.post('https://chamala.tatar/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Secret': SECRET
            }
        })
        return result.data.link
    } catch (e) {
        console.log(e)
    }
}

const postUser = async (req) => {
    let {first_name, id, last_name, username} =
        req;
    const [user, created] = await Tg.findOrCreate({
        where: {id: id},
        defaults: {
            ...req,
        },
    });
    if (user.id == id) {
        await Tg.update({first_name, last_name, username}, {where: {id: id}});
    }
}

const randomInteger = (min, max) => {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

module.exports = {
    getLink, postUser, randomInteger
}
