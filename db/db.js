const logger = require("../logger").db;
const loggersql = require("../logger").sql;
const config = require("config").DataBase;
const { Sequelize } = require("sequelize");
const PostgresResponseCodes = require("postgres-response-codes");
const md5 = require("md5");
const { isInteger } = require("../tools/validators");

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

sequelize
	.authenticate()
	.then(() => {
		User.hasMany(List, {
			onDelete: "CASCADE",
		});
		List.Words = List.hasMany(Word, {
			onDelete: "CASCADE",
		});
		return Promise.all([User.sync(), List.sync(), Word.sync(), sequelize.sync()]);
	})
	.catch((error) => logger.debug(error));

//********************************************************************************** */
module.exports.CreateUser = async (login, password) => {
	return User.create({
		login: login,
		password: password,
		hash: md5(Date.now().toString()),
	}).catch((error) => {
		if (
			error.original &&
			error.original.code === PostgresResponseCodes.UNIQUE_VIOLATION
		)
			return Promise.reject("Login already taken");
		logger.debug(error);
		return Promise.reject(error);
	});
};

module.exports.FindUser = async (login, password) => {
	const where = {
		login: login,
	};
	if (password) where.password = password;
	return User.findOne({
		attributes: ["id", "login", "admin", "hash"],
		where: where,
	})
		.then((user) => {
			logger.debug(`Find user: ${user ? "OK" : "FAIL"}`);
			return JSON.parse(JSON.stringify(user));
		})
		.catch((error) => {
			logger.debug(error);
			return { error };
		});
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
		await User.update(
			{
				password: password,
				hash: md5(Date.now().toString()),
			},
			{
				where: {
					login: login,
				},
			}
		);
	} catch (e) {
		logger.debug(e);
		throw e;
	}
};
//********************************************************************************** */
module.exports.CreateList = async (listName, userID) => {
	try {
		await List.create({
			name: listName,
			UserId: userID,
		});
	} catch (error) {
		logger.debug(e);
		throw e;
	}
};

module.exports.FindListOfUser = async (listID, userID) => {
	if (!isInteger(listID, userID)) {
		logger.error(`invalid type of value`);
		return null;
	}
	try {
		const list = await List.findOne({
			where: {
				id: listID,
				UserId: userID,
			},
		});
		return JSON.parse(JSON.stringify(list));
	} catch (e) {
		logger.error(e);
		throw e;
	}
};

module.exports.AddWordsToList = async (words, listID) => {
	try {
		const list = await List.findByPk(listID);
		if (list === null) throw new Error("List not found");

		words.forEach((word) => {
			word.ListId = list.id;
		});
		Word.bulkCreate(words);

		return true;
	} catch (e) {
		logger.debug(e);
		throw e;
	}
};

module.exports.GetWords = async (listID) => {
	try {
		const words = await Word.findAll({
			where: {
				ListId: listID,
			},
		});
		return JSON.parse(JSON.stringify(words));
	} catch (e) {
		logger.debug(e);
		throw e;
	}
};

module.exports.CountWords = async (listID) => {
	try {
		const words = await Word.findAll({
			group: ["studied"],
			attributes: [
				"studied",
				[Sequelize.fn("COUNT", Sequelize.col("studied")), "count"],
			],
			where: {
				ListId: listID,
			},
		});
		return JSON.parse(JSON.stringify(words));
	} catch (e) {
		logger.debug(e);
		throw e;
	}
};

module.exports.GetLists = async (userID) => {
	try {
		const lists = await List.findAll({
			where: {
				UserId: userID,
			},
		});
		return JSON.parse(JSON.stringify(lists));
	} catch (e) {
		logger.debug(e);
		throw e;
	}
};
//********************************************************************************** */
module.exports.UpdateWord = async (id, word) => {
	console.log(word);
	try {
		await Word.update(word, {
			where: {
				id: id,
			},
		});
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
module.exports.RenameList = async (id, newName) => {
	try {
		await List.update(
			{
				name: newName,
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
