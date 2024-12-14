const { Markup } = require('telegraf');
const questions = require('./questions');

const { gameData, resetGame } = require('./gameData');
const { showAlert, sendAndDelete } = require('./utils')

async function joinPlayer(ctx)
{
    if (!gameData.isJoiningAllowed)
    {
        await showAlert(ctx, '❌ لا يمكنك الانضمام الآن. انضمام اللاعبين مسموح فقط أثناء فترة الانضمام.');
        return;
    }

    const playerId = ctx.from.id;
    const playerName = ctx.from.first_name;

    if (gameData.players.some((player) => player.id === playerId))
    {
        await showAlert(ctx, `❌ لقد انضميت بالفعل .`);
        return;
    }

    gameData.players.push({ id: playerId, name: playerName });
    await sendAndDelete(ctx, `✅ ${playerName} انضم إلى اللعبة.\n عدد اللاعبين: ${gameData.players.length}`);
}

async function startGame(ctx, bot)
{
    if (gameData.isGameRunning)
    {
        await showAlert(ctx, '❌ اللعبة قيد التشغيل بالفعل.');
        return;
    }

    gameData.startedBy = ctx.from.id;




    const getOrUpdateStartGameMessage = () =>
    {
        const settingsMessage = `
        إعدادات اللعبة:
        - الموضوع: ${gameData.topic || 'لم يتم الاختيار'}
        - حد الوقت للانضمام: ${gameData.timeLimit} ثانية
        - وقت كل سؤال: ${gameData.questionTime} ثانية
    `;
        return `🎮 بدا لعبة جديدة:\n\n${settingsMessage}`
    }



    let message = await ctx.reply(getOrUpdateStartGameMessage(), {
        ...Markup.inlineKeyboard([
            [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
            [Markup.button.callback(' اختر موضوع', 'setTopic')],
            [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
            [Markup.button.callback(' إعادة تعيين', 'reset')],
            [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
        ])
    });


    bot.action(/^setTimeLimit$/, async (ctx) =>
    {
        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الوقت. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

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


        if (gameData.isGameRunning || gameData.isJoiningAllowed)
        {
            await showAlert(ctx, 'اللعبة بدات بالفعل');
            return;
        }


        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الوقت. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        gameData.timeLimit = parseInt(ctx.match[1], 10);

        await ctx.editMessageText(getOrUpdateStartGameMessage(), {
            message_id: message.message_id,
            reply_markup: message.reply_markup,

        });
        await ctx.deleteMessage();

    });

    bot.action(/^setTopic$/, async (ctx) =>
    {
        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الموضوع. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        await ctx.reply('📚 اختر موضوع اللعبة:', {
            ...Markup.inlineKeyboard(
                Object.keys(gameData.topics).map((topic) => [{ text: topic, callback_data: `topic:${topic}` }])
            ),
        });
    });

    bot.action(/^setQuestionTime$/, async (ctx) =>
    {
        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الوقت. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        await ctx.reply('⏰ حدد الوقت لكل سؤال (بالثواني):', {
            ...Markup.inlineKeyboard([
                [{ text: '5 ثواني', callback_data: 'questionTime:5' }],
                [{ text: '10 ثواني', callback_data: 'questionTime:10' }],
                [{ text: '15 ثانية', callback_data: 'questionTime:15' }],
                [{ text: '30 ثانية', callback_data: 'questionTime:30' }]
            ])
        });
    });

    bot.action(/^questionTime:(\d+)$/, async (ctx) =>
    {
        if (gameData.isGameRunning || gameData.isJoiningAllowed)
        {
            await showAlert(ctx, 'اللعبة بدات بالفعل');
            return;
        }


        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الوقت. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        gameData.questionTime = parseInt(ctx.match[1], 10);

        await ctx.editMessageText(getOrUpdateStartGameMessage(), {
            message_id: message.message_id,
            reply_markup: message.reply_markup
        });
        await ctx.deleteMessage();
    });

    bot.action(/^topic:(\w+)$/, async (ctx) =>
    {
        if (gameData.isGameRunning || gameData.isJoiningAllowed)
        {
            await showAlert(ctx, 'اللعبة بدات بالفعل');
            return;
        }


        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الموضوع. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        const selectedTopic = ctx.match[1];
        if (!gameData.topics[selectedTopic])
        {
            await showAlert(ctx, '❌ الموضوع غير متوفر.');
            return;
        }

        gameData.topic = selectedTopic;
        await ctx.editMessageText(getOrUpdateStartGameMessage(), {
            message_id: message.message_id,
            reply_markup: message.reply_markup
        });
        await ctx.deleteMessage();
    });

    bot.action(/^startJoin$/, async (ctx) =>
    {
        if (!gameData.topic)
        {
            await showAlert(ctx, 'يجب اختيار موضوع اولا');
            return;
        }

        if (gameData.isGameRunning || gameData.isJoiningAllowed)
        {
            await showAlert(ctx, 'اللعبة بدات بالفعل');
            return;
        }

        await ctx.deleteMessage(message.message_id);

        gameData.isJoiningAllowed = true;
        const joinMessage = await ctx.reply(
            `⏳ لديك ${gameData.timeLimit} ثانية للانضمام.\n\n📋تفاصيل اللعبة:\n- الموضوع: ${gameData.topic || 'لم يتم الاختيار'}\n- وقت كل سؤال: ${gameData.questionTime} ثانية`,
            Markup.inlineKeyboard([
                [Markup.button.callback('انضم للعبة', 'join_game')]
            ])
        );

        setTimeout(async () =>
        {
            await ctx.deleteMessage(joinMessage.message_id)
            gameData.isJoiningAllowed = false;
            if (gameData.players.length < 2)
            {
                await sendAndDelete(ctx, '❌ اللعبة تحتاج إلى لاعبين اثنين على الأقل. أعد المحاولة باستخدام /startgame.');
                resetGame();
                return;
            }

            const playersInfo = gameData.players
                .map((player, index) => `${index + 1}. ${player.name}`)
                .join('\n');

            await sendAndDelete(ctx, `🚨اللعبة ستبدأ خلال ثوانٍ... ! \n\n📋 قائمة اللاعبين:\n${playersInfo}\n البدابة من عند ${gameData.players[0].name} استعد !!`);

            setTimeout(async () =>
            {

                await sendAndDelete(ctx, `🚀 بدأت اللعبة!.`);
                gameData.isGameRunning = true;

                await questions.askQuestion(bot, ctx, 0, gameData.players, 0, gameData.topic);
            }, 5000);
        }, gameData.timeLimit * 1000);
    })



    bot.action('join_game', async (ctx) =>
    {
        await joinPlayer(ctx);
    });
}

module.exports = { joinPlayer, startGame };
