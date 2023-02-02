const logger = require("../logger").db;
const loggersql = require("../logger").sql;
const config = require("config").DataBase;
const { DataTypes, Sequelize } = require("sequelize");
const PostgresResponseCodes = require("postgres-response-codes");

config.options.logging = (msg) => loggersql.debug(msg);

const sequelize = new Sequelize(
    config.name,
    config.user,
    config.password,
    config.options
);

const User = require(`./models/user`)(sequelize);
const List = require(`./models/list`)(sequelize);
const Word = require(`./models/word`)(sequelize);

(async () => {
    try {
        await sequelize.authenticate();

        User.hasMany(List, {
            onDelete: "CASCADE",
        });
        List.Words = List.hasMany(Word, {
            onDelete: "CASCADE",
        });

        await User.sync();
        await List.sync();
        await Word.sync();

        await sequelize.sync();
    } catch (error) {
        logger.debug(error);
    }
})();

//********************************************************************************** */
module.exports.CreateUser = async (login, password) => {
    try {
        await User.create({
            login: login,
            password: password,
        });
        return true;
    } catch (e) {
        if (
            e.original &&
            e.original.code === PostgresResponseCodes.UNIQUE_VIOLATION
        )
            return false;
        logger.debug(e);
        throw e;
    }
};

module.exports.FindUser = async (login, password) => {
    const where = {
        login: login,
    };
    if (password) where.password = password;
    try {
        const user = await User.findOne({
            attributes: ["id", "login", "admin"],
            where: where,
        });
        return JSON.parse(JSON.stringify(user));
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.DeleteUser = async (login) => {
    try {
        await User.destroy({
            where: {
                login: login,
            },
        });
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.UpdateUserPassword = async (login, password) => {
    try {
        await User.findOne({
            password: password,
            where: {
                login: login,
            },
        });
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};
//********************************************************************************** */
module.exports.AddWordsToList = async (login, listName, words) => {
    try {
        const user = await this.FindUser(login);
        if (user === null) return false;

        const list = await List.findOne({
            where: {
                name: listName,
                UserId: user.id,
            },
        });
        if (list !== null) {
            words.forEach((word) => {
                word.ListId = list.id;
            });
            Word.bulkCreate(words);
            return true;
        }

        await List.create(
            {
                name: listName,
                UserId: user.id,
                Words: words,
            },
            {
                include: [
                    {
                        association: List.Words,
                        // include: [User.Addresses],
                    },
                ],
            }
        );
        return true;
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.GetWords = async (login, listName) => {
    try {
        const user = await this.FindUser(login);
        if (user === null) {
            logger.error(`GetWords fail: user '${login}' not found`);
            return [];
        }

        if (listName === undefined) {
            const lists = await List.findAll({
                where: {
                    UserId: user.id,
                },
            });
            if (lists === null) return [];
            const ids = [];
            lists.forEach((list) => {
                ids.push(list.id);
            });
            const words = await Word.findAll({
                where: {
                    ListId: ids,
                },
            });
            if (words === null) return [];
            return JSON.parse(JSON.stringify(words));
        }

        const list = await List.findOne({
            where: {
                name: listName,
                UserId: user.id,
            },
        });
        if (list === null) return [];
        const words = await Word.findAll({
            where: {
                ListId: list.id,
            },
        });
        if (words === null) return [];
        return JSON.parse(JSON.stringify(words));
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.GetListByID = async (id) => {
    try {
        const lists = await List.findAll({
            where: {
                id: id,
            },
        });
        return JSON.parse(JSON.stringify(lists));
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.GetListsOfUser = async (login) => {
    try {
        const user = await this.FindUser(login);
        if (user === null) return [];

        const lists = await List.findAll({
            where: {
                UserId: user.id,
            },
        });
        return JSON.parse(JSON.stringify(lists));
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.GetListByName = async (login, name) => {
    try {
        const user = await this.FindUser(login);
        if (user === null) return null;

        return await List.findOne({
            where: {
                name: name,
                UserId: user.id,
            },
        });
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};
//********************************************************************************** */
module.exports.MarkWord = async (id, studied) => {
    try {
        await Word.update(
            {
                studied: studied,
            },
            {
                where: {
                    id: id,
                },
            }
        );
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.SetWordTranslation = async (id, translation) => {
    try {
        await Word.update(
            {
                translation: translation,
            },
            {
                where: {
                    id: id,
                },
            }
        );
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.DeleteWord = async (id) => {
    try {
        await Word.destroy({
            where: {
                id: id,
            },
        });
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};
//********************************************************************************** */
module.exports.RenameList = async (id, name) => {
    try {
        await List.update(
            {
                name: name,
            },
            {
                where: {
                    id: id,
                },
            }
        );
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};

module.exports.DeleteList = async (id) => {
    try {
        await List.destroy({
            where: {
                id: id,
            },
        });
    } catch (e) {
        logger.debug(e);
        throw e;
    }
};
//********************************************************************************** */
