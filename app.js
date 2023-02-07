// const config = require('config')
const logger = require("./logger").app;
const db = require("./db/db");
const config = require("config");
const express = require("express");
const jwt = require("jsonwebtoken");
const { dirname } = require("path");
const md5 = require("md5");

const appDir = dirname(require.main.filename);
const signature = "qwerty";

logger.debug("Start application");

const app = express();

app.use(express.json());

app.use((request, response, next) => {
    if (!request.body) {
        response.status(400).json({ error: "Undefined body" });
        logger.error(`Undefined body: ${request.url}`);
    } else next();
});

app.use("/api/auth", (request, response, next) => {
    if (!request.body.login || !request.body.password) {
        response
            .status(400)
            .json({ error: "Required field 'login' or 'password' not found" });
    } else next();
});
//********************************************************************** */

app.post("/api/auth", async (request, response) => {
    const { login, password, newpassword, create } = request.body;

    if (create) {
        const created = await db.CreateUser(login, password);
        if (!created) {
            response.status(409).json({ error: "Login already taken" });
            return;
        }

        logger.info(`New user registred: ${login}`);

        response.json({ status: "User registred" });
        return;
    }

    const user = await db.FindUser(login, password);

    if (user === null) {
        logger.warn(`Authentication failed for user '${login}'`);
        response.status(401).json({ error: "Incorrect login or password" });
        return;
    }

    logger.info(`User '${login}' authenticated`);

    if (newpassword) {
        db.UpdateUserPassword(user.login, newpassword)
            .then(() => {
                response.json({ status: "Password changed" });
            })
            .catch((error) =>
                response.status(400).json({ error: error.message })
            );
    } else {
        const token = jwt.sign(user, signature);
        response.json({ token: token });
    }
});

//********************************************************************** */
app.use((request, response, next) => {
    if (!request.headers.authorization) {
        response.status(401).json({ error: "Token is not provided" });
        return;
    }
    jwt.verify(
        request.headers.authorization,
        signature,
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
    response.json({});
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
    const list = await db.FindListOfUser(
        request.params.listid,
        request.user.id
    );
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
            response
                .status(500)
                .json({ error: `List '${listName}' can not be created` });
        });
});

app.put("/api/lists/:listid", async (request, response) => {
    const list = await db.FindListOfUser(
        request.params.listid,
        request.user.id
    );
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
    const list = await db.FindListOfUser(
        request.params.listid,
        request.user.id
    );
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

app.put("/api/lists/:listid/words/:wordid", async (request, response) => {
    const list = await db.FindListOfUser(
        request.params.listid,
        request.user.id
    );
    if (list === null) {
        response.status(406).json({ error: `List not found` });
        return;
    }

    db.UpdateWord(request.params.wordid, request.body.word)
        .then(() => {
            response.json({ status: "Updated" });
        })
        .catch((error) => {
            logger.error(error.message);
            response.status(500).json({ error: `Can not be updated` });
        });
});

app.delete("/api/lists/:listid/words/:wordid", async (request, response) => {
    const list = await db.FindListOfUser(
        request.params.listid,
        request.user.id
    );
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
    const list = await db.FindListOfUser(
        request.params.listid,
        request.user.id
    );
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
    response
        .status(404)
        .json({ error: `Not found: ${request.method} ${request.url}` });
});
//********************************************************************** */
app.listen(config.Server.port, () => {
    logger.info(
        `Server started at ${config.Server.host}:${config.Server.port}`
    );
});