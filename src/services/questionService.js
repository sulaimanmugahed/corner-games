const Questions = require('../database/models/Question')
const { Sequelize, Op } = require('sequelize');
const getQuestions = async (topicId) =>
{
    return await Questions.findAll({
        where: { topicId },
        order: Sequelize.literal('RANDOM()')
    })
}

const addQuestion = async (topicId, question, options, correct) =>
{
    return await Questions.create({
        question,
        options,
        correct,
        topicId
    })
}


module.exports = { getQuestions, addQuestion }