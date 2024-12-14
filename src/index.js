const { Telegraf } = require('telegraf');
//const { sequelize } = require('./database/config');
require('dotenv').config();
const game = require('./game');
const { setupAnswerHandler } = require('./questions');
const { gameData } = require('./gameData');
//const { findOrCreateUser, isAdmin } = require('./services/userService');

const bot = new Telegraf(process.env.BOT_TOKEN);

// (async () =>
// {
//     try
//     {
//         await sequelize.sync({ ...sequelize.syncOptions, alter: true });
//         console.log('Database synchronized.');
//     } catch (error)
//     {
//         console.error('Database synchronization failed:', error);
//         process.exit(1); // Exit the process with failure
//     }
// })();


// bot.use(async (ctx, next) =>
// {
//     if (ctx.message)
//     {
//         const { id, username } = ctx.message.from;
//         await findOrCreateUser(id, username);
//     }
//     return next();
// });


bot.command('startgame', (ctx) =>
{
    if (ctx.chat.type.includes('group'))
    {
        game.startGame(ctx, bot);
    } else
    {
        ctx.reply('❌ يمكن تشغيل اللعبة فقط في المجموعات.');
    }
});

setupAnswerHandler(bot, gameData.players, gameData.topic);

bot.launch();
console.log('✅ Bot is running...');
