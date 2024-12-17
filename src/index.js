const { Telegraf } = require('telegraf');
const { sequelize } = require('./database/config');
require('dotenv').config();
const { startGame, manageTopics } = require('./game');
const { setupAnswerHandler } = require('./questions');
const { gameData } = require('./gameData');


//const seedDatabase = require('./database/data/seed');

const bot = new Telegraf(process.env.BOT_TOKEN);

// (async () =>
// {
//     try
//     {
//         console.log('🌱 Starting the application...');
//         await seedDatabase();
//         console.log('✅ Application started successfully.');
//     } catch (error)
//     {
//         console.error('❌ Application error:', error);
//     }
// })();



bot.command('startgame', (ctx) =>
{
    if (ctx.chat.type.includes('group'))
    {
        startGame(ctx, bot);
    } else
    {
        ctx.reply('❌ يمكن تشغيل اللعبة فقط في المجموعات.');
    }
});

bot.command('manage_topics', async (ctx) =>
{
    await manageTopics(bot, ctx)
});

setupAnswerHandler(bot, gameData.players);

bot.launch();
console.log('✅ Bot is running...');
