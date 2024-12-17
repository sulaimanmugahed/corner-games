const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');


const PlayerWin = sequelize.define('PlayerWin', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    playerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    topicId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
});



module.exports = PlayerWin;