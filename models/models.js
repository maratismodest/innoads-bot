const sequelize = require("../db");
const {DataTypes} = require("sequelize");

const Tg = sequelize.define("tg", {
    username: { type: DataTypes.STRING, unique: true },
    photo_url: { type: DataTypes.STRING },
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true },
    role: { type: DataTypes.STRING, defaultValue: "USER" },
    auth_date: { type: DataTypes.INTEGER },
    hash: { type: DataTypes.STRING },
});

const Post = sequelize.define("post", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING },
    body: { type: DataTypes.STRING },
    price: { type: DataTypes.INTEGER, defaultValue: 0 },
    preview: { type: DataTypes.STRING, allowNull: false },
    images: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, unique: true },
    telegram: { type: DataTypes.STRING },
    vector: {type: DataTypes.TSVECTOR}
});

const Category = sequelize.define("category", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
});

const User = sequelize.define("user",{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    first_name: { type: DataTypes.STRING, defaultValue: null },
    last_name: { type: DataTypes.STRING, defaultValue: null },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    token: { type: DataTypes.STRING },
});

const Count = sequelize.define("count",{
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    price: { type: DataTypes.INTEGER, defaultValue: 0 },
});

// User.hasMany(Post)
Tg.hasMany(Post);
// Post.belongsTo(User)
Post.belongsTo(Tg);
Category.hasMany(Post);
Post.belongsTo(Category);

module.exports = {
    Post,
    Category,
    Tg,
    User,
    Count
};
