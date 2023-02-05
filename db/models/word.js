const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define(
        "Word",
        {
            word: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            translation: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            studied: {
                type: DataTypes.BOOLEAN,
            },
        },
        {
            timestamps: false,
        }
    );
};
