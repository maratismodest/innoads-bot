const sequelize = require("../db");
const {DataTypes} = require("sequelize");

const Tg = sequelize.define("tg", {
    username: {type: DataTypes.STRING, unique: true},
    photo_url: {type: DataTypes.STRING},
    first_name: {type: DataTypes.STRING},
    last_name: {type: DataTypes.STRING},
    id: {type: DataTypes.INTEGER, primaryKey: true, unique: true},
    role: {type: DataTypes.STRING, defaultValue: "USER"},
    auth_date: {type: DataTypes.INTEGER},
    hash: {type: DataTypes.STRING},
});

module.exports = {
    Tg,
};
