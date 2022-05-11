const axios = require("axios");
const data = require("../data");
const {storageModule} = require("../firebaseConfig");
const {Tg} = require("../models/models");
const getLink = async (file_id) => {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${data.token}/getFile?file_id=${file_id}`)
        const aLink = `https://api.telegram.org/file/bot${data.token}/${res.data.result.file_path}`
        const response = await axios.get(aLink, {responseType: 'arraybuffer'})
        const image = storageModule.ref().child((+new Date()).toString());
        await image.put(response.data);
        const imageLink = await image.getDownloadURL();
        // console.log('imageLink', imageLink)
        return imageLink
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

module.exports = {
    getLink, postUser
}