const logger = require("./logger").app;
const db = require("./db/db");
const config = require("config");
const express = require("express");
const jwt = require("jsonwebtoken");
const {
	setSignature,
	checkLoginPassword,
	createUser,
	authUser,
	setUserPassword,
	deleteUser,
} = require("./controllers/auth");
const { cors } = require("./controllers/cors");

const app = express();

setSignature(config.signature);

app.use(cors);

app.use(express.json());

app.use((request, response, next) => {
	logger.info(`${request.method} ${request.url}`);
	next();
});

const CheckBody = (request, response, next) => {
	if (Object.keys(request.body).length === 0) {
		response.status(400).json({ error: "Undefined body" });
		logger.error(`Undefined body: ${request.url}`);
	} else next();
};

const ObjToString = (obj) => {
	return JSON.stringify(obj).replaceAll('"', "'");
};

app.post("/api/auth/signup", createUser);
app.use("/api/auth", checkLoginPassword);

app.post("/api/auth/login", authUser);
app.post("/api/auth/password", setUserPassword);
app.delete("/api/users", deleteUser);

//********************************************************************** */
app.use((request, response, next) => {
	if (!request.headers.authorization) {
		response.status(401).json({ error: "Token is not provided" });
		return;
	}
	jwt.verify(
		request.headers.authorization,
		config.signature,
		async (error, payload) => {
			if (error) {
				logger.error(`Verify token fail: ${error.message}`);
				response.status(403).json({ error: error.message });
				return;
			}
			const user = await db.FindUser(payload.login);
			if (user === null) {
				response.status(403).json({ error: "User not found" });
				return;
			}
			if (payload.hash !== user.hash) {
				response.status(403).json({ error: "Bad token" });
				return;
			}
			request.user = user;
			next();
		}
	);
});
//********************************************************************** */
app.get("/", (request, response) => {
	response.json({ note: "Use '/api' as root node" });
});

app.get("/api/lists", (request, response) => {
	db.GetLists(request.user.id)
		.then((lists) => response.json({ Lists: lists }))
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `Can not get lists` });
		});
});

app.get("/api/lists/:listid/words", async (request, response) => {
	const listId = parseInt(request.params.listid, 10);
	const list = await db.FindListOfUser(listId, request.user.id);
	if (list === null) {
		response.status(406).json({ error: `List not found` });
		return;
	}
	db.GetWords(list.id)
		.then((words) => {
			response.json({ Words: words });
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `Can not get words` });
		});
});

app.post("/api/lists", (request, response) => {
	const { listName } = request.body;
	db.CreateList(listName, request.user.id)
		.then(() => {
			response.json({ status: `List '${listName}' created` });
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `List '${listName}' can not be created` });
		});
});

app.put("/api/lists/:listid", async (request, response) => {
	const list = await db.FindListOfUser(request.params.listid, request.user.id);
	if (list === null) {
		response.status(406).json({ error: `List not found` });
		return;
	}

	const { listName } = request.body;
	db.RenameList(list.id, listName)
		.then(() => {
			response.json({ status: `List renamed` });
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `List can not be renamed` });
		});
});

app.post("/api/lists/:listid/words", async (request, response) => {
	const list = await db.FindListOfUser(+request.params.listid, request.user.id);
	if (list === null) {
		response.status(406).json({ error: `List not found` });
		return;
	}

	const { words } = request.body;
	db.AddWordsToList(words, list.id)
		.then(() => {
			response.json({ status: `Created` });
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `Can not be created` });
		});
});

app.put("/api/lists/:listid/words/:wordid", CheckBody, async (request, response) => {
	const list = await db.FindListOfUser(+request.params.listid, request.user.id);
	if (list === null) {
		response.status(406).json({ error: `List not found` });
		return;
	}

	db.UpdateWord(request.params.wordid, request.body.Word)
		.then(() => {
			response.json({
				status: "Updated", // with: " + ObjToString(request.body.Word),
				data: request.body.Word,
			});
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `Can not be updated` });
		});
});

app.delete("/api/lists/:listid/words/:wordid", async (request, response) => {
	const list = await db.FindListOfUser(+request.params.listid, request.user.id);
	if (list === null) {
		response.status(406).json({ error: `List not found` });
		return;
	}

	db.DeleteWord(request.params.wordid)
		.then(() => {
			response.json({ status: "Deleted" });
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `Can not be deleted` });
		});
});

app.delete("/api/lists/:listid", async (request, response) => {
	const list = await db.FindListOfUser(+request.params.listid, request.user.id);
	if (list === null) {
		response.status(406).json({ error: `List not found` });
		return;
	}

	db.DeleteList(list.id)
		.then(() => {
			response.json({ status: "Deleted" });
		})
		.catch((error) => {
			logger.error(error.message);
			response.status(500).json({ error: `Can not be deleted` });
		});
});

app.use((request, response) => {
	response.status(404).json({ error: `Not found: ${request.method} ${request.url}` });
});
//********************************************************************** */
app.listen(config.Server.port, () => {
	logger.info(`Server started on port: ${config.Server.port}`);
});
