const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define(
        "List",
        {
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            timestamps: false,
        }
    );
};
