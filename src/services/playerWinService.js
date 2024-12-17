const PlayerWin = require('../database/models/PlayerWin')

async function addWin(playerId, topicId)
{
    const [win, created] = await PlayerWin.findOrCreate({
        where: {
            playerId,
            topicId,
        },
        defaults: {
            wins: 1,
        },
        individualHooks: true,
    });

    if (!created)
    {
        win.wins += 1;
        await win.save();
    }

    return win;
}

module.exports = { addWin }