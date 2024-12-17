const User = require('../database/models/User');

async function findOrCreateUser(telegramId, username)
{
    const existingUser = await User.findOne({ where: { telegramId } });

    if (existingUser)
    {
        return existingUser;
    } else
    {
        return await User.create({ telegramId, username });
    }
}

async function isAdmin(telegramId)
{
    const user = await User.findOne({ where: { telegramId } });
    return user ? user.isAdmin : false;
}

module.exports = { findOrCreateUser, isAdmin };
