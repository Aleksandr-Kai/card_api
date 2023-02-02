const log4js = require("log4js");
log4js.configure({
    appenders: {
        console: { type: "console" },
        app: { type: "file", filename: "logs/app.log" },
        db: { type: "file", filename: "logs/db.log" },
    },
    categories: {
        default: { appenders: ["console", "app", "db"], level: "all" },
        app: { appenders: ["console", "app"], level: "all" },
        db: { appenders: ["console", "db"], level: "all" },
        sql: { appenders: ["db"], level: "all" },
    },
});

module.exports.app = log4js.getLogger("app");
module.exports.db = log4js.getLogger("db");
module.exports.sql = log4js.getLogger("sql");
