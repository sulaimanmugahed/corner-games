const { Markup } = require('telegraf');
const questions = require('./questions');

const { gameData, resetGame } = require('./gameData');

async function joinPlayer(ctx)
{
    if (!gameData.isJoiningAllowed)
    {
        await ctx.reply('❌ لا يمكنك الانضمام الآن. انضمام اللاعبين مسموح فقط أثناء فترة الانضمام.');
        return;
    }

    const playerId = ctx.from.id;
    const playerName = ctx.from.first_name;

    if (gameData.players.some((player) => player.id === playerId))
    {
        await ctx.reply(`❌ اللاعب ${playerName} موجود بالفعل.`);
        return;
    }

    gameData.players.push({ id: playerId, name: playerName });
    await ctx.reply(`✅ ${playerName} انضم إلى اللعبة. عدد اللاعبين: ${gameData.players.length}`);
}

async function startGame(ctx, bot)
{
    if (gameData.isGameRunning)
    {
        await ctx.reply('❌ اللعبة قيد التشغيل بالفعل.');
        return;
    }

    await ctx.reply('🎮 اختر إعدادات اللعبة:', {
        ...Markup.inlineKeyboard([
            [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
            [Markup.button.callback(' اختر موضوع', 'setTopic')],
            [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
            [Markup.button.callback(' إعادة تعيين', 'reset')]
        ])
    });

    bot.action(/^setTimeLimit$/, async (ctx) =>
    {
        await ctx.reply(' حدد الوقت (بالثواني) للسماح بالانضمام:', {
            ...Markup.inlineKeyboard([
                [{ text: '30 ثانية', callback_data: 'time:30' }],
                [{ text: '60 ثانية', callback_data: 'time:60' }],
                [{ text: '90 ثانية', callback_data: 'time:90' }]
            ])
        });
    });

    bot.action(/^time:(\d+)$/, async (ctx) =>
    {
        gameData.timeLimit = parseInt(ctx.match[1], 10);
        await ctx.reply(`✅ تم تعيين حد الوقت للانضمام إلى ${gameData.timeLimit} ثانية.`);
        await ctx.answerCbQuery();
    });

    bot.action(/^setTopic$/, async (ctx) =>
    {
        await ctx.reply('📚 اختر موضوع اللعبة:', {
            ...Markup.inlineKeyboard(
                Object.keys(gameData.topics).map((topic) => [{ text: topic, callback_data: `topic:${topic}` }])
            ),
        });
    });

    bot.action(/^setQuestionTime$/, async (ctx) =>
    {
        await ctx.reply('⏰ حدد الوقت لكل سؤال (بالثواني):', {
            ...Markup.inlineKeyboard([
                [{ text: '5 ثواني', callback_data: 'question:5' }],
                [{ text: '10 ثواني', callback_data: 'question:10' }],
                [{ text: '15 ثانية', callback_data: 'question:15' }],
                [{ text: '30 ثانية', callback_data: 'question:30' }]
            ])
        });
    });

    bot.action(/^question:(\d+)$/, async (ctx) =>
    {
        gameData.questionTime = parseInt(ctx.match[1], 10);
        await ctx.reply(`✅ تم تعيين وقت كل سؤال إلى ${gameData.questionTime} ثانية.`);
        await ctx.answerCbQuery();
    });

    bot.action(/^topic:(\w+)$/, async (ctx) =>
    {
        const selectedTopic = ctx.match[1];
        if (!gameData.topics[selectedTopic])
        {
            await ctx.reply('❌ الموضوع غير متوفر.');
            return;
        }

        gameData.topic = selectedTopic;
        await ctx.reply(`✅ تم اختيار الموضوع: ${selectedTopic}.`);


        gameData.isJoiningAllowed = true;
        await ctx.reply(
            `⏳ لديك ${gameData.timeLimit} ثانية للانضمام.`,
            Markup.inlineKeyboard([
                [Markup.button.callback('انضم للعبة', 'join_game')]
            ])
        );

        setTimeout(async () =>
        {
            gameData.isJoiningAllowed = false;
            if (gameData.players.length < 2)
            {
                await ctx.reply('❌ اللعبة تحتاج إلى لاعبين اثنين على الأقل. أعد المحاولة باستخدام /startgame.');
                resetGame();
                return;
            }
            const playersInfo = gameData.players
                .map((player, index) => `${index + 1}. ${player.name}`)
                .join('\n');

            await ctx.reply(`🚀 بدأت اللعبة! استعد للسؤال الأول.\n\n📋 قائمة اللاعبين:\n${playersInfo}`);
            gameData.isGameRunning = true;

            await questions.askQuestion(bot, ctx, 0, gameData.players, 0, gameData.topic);
        }, gameData.timeLimit * 1000);
    });

    bot.action('join_game', async (ctx) =>
    {
        await joinPlayer(ctx);
    });
}

module.exports = { joinPlayer, startGame };
