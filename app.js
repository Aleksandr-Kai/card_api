// const config = require('config')
const logger = require("./logger").app;
const db = require("./db/db");
const config = require("config");
const express = require("express");
const jwt = require("jsonwebtoken");
const { dirname } = require("path");

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

app.use("/auth", (request, response, next) => {
    if (!request.body.login || !request.body.password) {
        response
            .status(400)
            .json({ error: "Required field 'login' or 'password' not found" });
    } else next();
});

app.post("/auth", async (request, response) => {
    const { login, password, create } = request.body;

    if (create) {
        const created = await db.CreateUser(login, password);
        if (!created) {
            response.status(409).json({ error: "Login already taken" });
            return;
        }

        logger.info(`New user registred: ${login}`);

        response.json({ Registration: "OK" });
        return;
    }

    const user = await db.FindUser(login, password);

    if (user === null) {
        logger.warn(`Authentication failed for user '${login}'`);
        response.status(401).json({ error: "Incorrect login or password" });
        return;
    }

    logger.info(`User '${login}' authenticated`);

    const token = jwt.sign(user, signature);
    response.json({ token: token });
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
            request.user = user;
            next();
        }
    );
});
//********************************************************************** */
app.get("/", (_, response) => {
    response.json({});
});

app.use((_, response) => {
    response.status(404).json({ Page: "Not found" });
});
//********************************************************************** */
app.listen(config.Server.port, () => {
    logger.info(
        `Server started at ${config.Server.host}:${config.Server.port}`
    );
});

// db.CreateUser("user", "pass")
//     .then((err) => {
//         logger.debug("User created");
//     })
//     .catch((err) => {
//         logger.error(err.message);
//     });

// db.FindUser("user", "pass")
//     .then((user) => {
//         if (user != null) logger.info(user.id);
//         else logger.trace("User not found");
//     })
//     .catch((err) => {
//         logger.error(err.message);
//     });

// db.AddWordsToList("user", "list2", [
//     {
//         word: "word5",
//         translation: "слово5",
//         studied: false,
//     },
//     {
//         word: "word5",
//         translation: "слово5",
//         studied: false,
//     },
// ]);

// db.GetWords("user","list1")
//     .then((words) => {
//         logger.info(words);
//     })
//     .catch((error) => logger.error(error));

// db.GetList(3)
//     .then((lists) => {
//         logger.info(lists);
//     })
//     .catch((error) => logger.error(error));

// db.GetListsOfUser("user")
//     .then((user) => logger.info(user))
//     .catch((error) => logger.error(error));

// db.DeleteList(1)
//     .then(() => logger.info('Deleted'))
//     .catch((error) => logger.error(error));
