const Topic = require('../database/models/Topic')


const getAllTopics = async () =>
{
    return await Topic.findAll();
}


const getTopic = async (id) =>
{
    return await Topic.findOne({
        where: {
            id: id
        }
    });
}


module.exports = { getAllTopics, getTopic }
