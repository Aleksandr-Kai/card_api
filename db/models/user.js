const { DataTypes, Sequelize } = require('sequelize')

module.exports = (sequelize) => {
    return sequelize.define(
        'User',
        {
            login:{
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            password:{
                type: DataTypes.STRING,
                allowNull: false
            },
            admin:{
                type: DataTypes.BOOLEAN,
            }
        }, {
            timestamps: false
        }
    )
}