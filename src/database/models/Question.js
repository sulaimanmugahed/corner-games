const { sequelize } = require('../config');
const { DataTypes } = require('sequelize');
const Topic = require('./Topic');

const Question = sequelize.define('Question', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    question: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    topicId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'Topics',
            key: 'id',
        },
        allowNull: false,
    },
    options: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    correct: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

});

Question.belongsTo(Topic, { foreignKey: 'topicId' });
Topic.hasMany(Question, { foreignKey: 'topicId' });

module.exports = Question;
