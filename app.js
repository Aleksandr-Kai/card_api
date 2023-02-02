// const config = require('config')
const logger = require("./logger").app;
const db = require("./db/db");
const config = require("config");

logger.debug("Start application");
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

// db.GetWords("user","list")
//     .then((words) => {
//         logger.info(words);
//     })
//     .catch((error) => logger.error(error));

// db.GetList(3)
//     .then((lists) => {
//         logger.info(lists);
//     })
//     .catch((error) => logger.error(error));

db.GetListsOfUser("user")
    .then((user) => logger.info(user))
    .catch((error) => logger.error(error));
