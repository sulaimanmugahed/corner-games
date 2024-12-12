const { Telegraf } = require('telegraf');

require('dotenv').config();
const game = require('./game');

const bot = new Telegraf(process.env.BOT_TOKEN);


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

bot.launch();
console.log('✅ Bot is running...');
