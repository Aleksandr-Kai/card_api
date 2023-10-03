const logger = require("../logger").app;
const db = require("../db/db");
const jwt = require("jsonwebtoken");
const { getErrorText } = require("../tools/errors");
let signature = "";

function setSignature(_signature) {
	signature = _signature;
}

function checkLoginPassword(request, response, next) {
	if (!request.body.login || !request.body.password) {
		response
			.status(400)
			.json({ error: "Required field 'login' or 'password' not found" });
	} else next();
}

function createUser(request, response) {
	const { login, password } = request.body;
	db.CreateUser(login, password)
		.then(() => {
			logger.info(`New user registred: ${login}`);
			response.json({ status: "User registred" });
		})
		.catch((error) => {
			logger.error(error);
			response.status(409).json({ error: getErrorText(error) });
		});
}

function deleteUser(request, response) {
	const { login, password } = request.body;
	db.FindUser(login, password)
		.then((user) => {
			logger.info(
				`User '${login}:${JSON.stringify(user)}' authenticated for delete`
			);
			return login;
		})
		.then(db.DeleteUser)
		.then(() => {
			logger.info(`User deleted: ${login}`);
			response.json({ status: "User deleted" });
		})
		.catch((error) => {
			logger.error(error);
			response.status(409).json({ error: getErrorText(error) });
		});
}

function authUser(request, response) {
	const { login, password } = request.body;

	db.FindUser(login, password)
		.then((user) => {
			if (user) {
				logger.info(`User '${login}' authenticated`);
				const token = jwt.sign(user, signature);
				response.json({ token: token });
			} else {
				logger.info(`Authentication failed with login '${login}'`);
				response.status(401).json({ error: "Incorrect login or password" });
			}
		})
		.catch((error) => {
			logger.error(error);
			response.status(500).json({ error });
		});
}

function setUserPassword(request, response) {
	const { login, password, newpassword } = request.body;

	db.FindUser(login, password)
		.catch((error) => {
			logger.warn(`Authentication failed for user '${login}'`);
			return Promise.reject({
				status: 401,
				message: "Incorrect login or password",
			});
		})
		.then((user) => {
			logger.info(`User '${login}' authenticated`);
			return db.UpdateUserPassword(user.login, newpassword);
		})
		.then(() => {
			response.json({ status: "Password changed" });
		})
		.catch((error) => {
			if (error.status) {
				response.status(error.status).json({ error: error.message });
				return;
			}
			response.status(400).json({ error: error.message });
		});
}

module.exports = {
	setSignature,
	checkLoginPassword,
	createUser,
	deleteUser,
	authUser,
	setUserPassword,
};
