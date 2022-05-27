// const getLink = async (file_id) => {
//     try {
//         const res = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${file_id}`)
//         const aLink = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${res.data.result.file_path}`
//         const response = await axios.get(aLink, {responseType: 'arraybuffer'})
//         const image = storageModule.ref().child((+new Date()).toString());
//         await image.put(response.data);
//         const imageLink = await image.getDownloadURL();
//         // console.log('imageLink', imageLink)
//         return imageLink
//     } catch (e) {
//         console.log(e)
//     }
// }