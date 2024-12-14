const User = require('../database/models/User');

async function findOrCreateUser(telegramId, username)
{
    return await User.findOrCreate({
        where: { telegramId },
        defaults: { username },
    });
}

async function isAdmin(telegramId)
{
    const user = await User.findOne({ where: { telegramId } });
    return user ? user.isAdmin : false;
}

module.exports = { findOrCreateUser, isAdmin };
