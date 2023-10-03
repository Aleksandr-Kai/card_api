const { DataTypes, Sequelize } = require("sequelize");

module.exports = (sequelize) => {
	return sequelize.define(
		"Word",
		{
			word: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "N/A",
			},
			translation: {
				type: DataTypes.STRING,
				allowNull: false,
				defaultValue: "N/A",
			},
			studied: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
			},
		},
		{
			timestamps: false,
		}
	);
};
