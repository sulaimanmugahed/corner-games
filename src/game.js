const { Markup } = require('telegraf');
const { askQuestion } = require('./questions');
const { getAllTopics, getTopic } = require('./services/topicService')
const { gameData, resetGame } = require('./gameData');
const { showAlert, sendAndDelete } = require('./utils')
const { getQuestions, addQuestion } = require('./services/questionService')

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
        return ` بدا لعبة جديدة 🎮\n
- الموضوع: ${gameData?.topic?.name ? `(${gameData?.topic?.name}) => ${gameData?.topic?.description}` : 'لم يتم الاختيار'}
- حد الوقت للانضمام: ${gameData.timeLimit} ثانية
- المكافأة: ${gameData.reward || 'لا يوجد'}
- وقت كل سؤال: ${gameData.questionTime} ثانية`
    }

    let message = await ctx.reply(getOrUpdateStartGameMessage(), {
        ...Markup.inlineKeyboard([
            [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
            [Markup.button.callback(' اختر موضوع', 'setTopic')],
            [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
            [Markup.button.callback(' إعادة تعيين', 'reset')],
            [Markup.button.callback(' تعيين المكافأة', 'setReward')],
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

        await ctx.deleteMessage(message.message_id)

        message = await ctx.reply(getOrUpdateStartGameMessage(), {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
                [Markup.button.callback(' اختر موضوع', 'setTopic')],
                [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
                [Markup.button.callback(' إعادة تعيين', 'reset')],
                [Markup.button.callback(' تعيين المكافأة', 'setReward')],
                [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
            ])
        });
        await ctx.deleteMessage();

    });

    bot.action(/^setReward$/, async (ctx) =>
    {
        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير المكافأة. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        await sendAndDelete(ctx, '✏️ قم بكتابة نص المكافأة التي ستُعرض للفائز:');

        bot.on('message', async (messageCtx) =>
        {
            if (!gameData.isGameRunning && !gameData.isJoiningAllowed)
            {
                const rewardMessage = messageCtx.message.text;

                if (rewardMessage)
                {
                    gameData.reward = rewardMessage; // حفظ المكافأة في بيانات اللعبة
                    await sendAndDelete(ctx, '✅ تم تعيين المكافأة بنجاح!');
                } else
                {
                    await sendAndDelete(ctx, '❌ لم يتم تحديد مكافأة صالحة. حاول مرة أخرى.');
                }
                await ctx.deleteMessage(message.message_id)
                message = await ctx.reply(getOrUpdateStartGameMessage(), {
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
                        [Markup.button.callback(' اختر موضوع', 'setTopic')],
                        [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
                        [Markup.button.callback(' إعادة تعيين', 'reset')],
                        [Markup.button.callback(' تعيين المكافأة', 'setReward')],
                        [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
                    ])
                });
            }
        });
    });

    bot.action(/^setTopic$/, async (ctx) =>
    {
        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ لا يمكنك تغيير الموضوع. فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

        const topics = await getAllTopics()

        await ctx.reply('📚 اختر موضوع اللعبة:', {
            ...Markup.inlineKeyboard(
                topics.map((topic) => [{ text: topic.name, callback_data: `topic:${topic.id}` }])
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
                [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
                [Markup.button.callback(' اختر موضوع', 'setTopic')],
                [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
                [Markup.button.callback(' إعادة تعيين', 'reset')],
                [Markup.button.callback(' تعيين المكافأة', 'setReward')],
                [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
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

        await ctx.deleteMessage(message.message_id)
        message = await ctx.reply(getOrUpdateStartGameMessage(), {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
                [Markup.button.callback(' اختر موضوع', 'setTopic')],
                [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
                [Markup.button.callback(' إعادة تعيين', 'reset')],
                [Markup.button.callback(' تعيين المكافأة', 'setReward')],
                [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
            ])
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

        const selectedTopicId = ctx.match[1];
        const selectedTopic = await getTopic(selectedTopicId)
        if (!selectedTopic)
        {
            await showAlert(ctx, '❌no topic found');
            return;
        }


        gameData.topic = selectedTopic;
        await ctx.deleteMessage(message.message_id)


        message = await ctx.reply(getOrUpdateStartGameMessage(), {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
                [Markup.button.callback(' اختر موضوع', 'setTopic')],
                [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
                [Markup.button.callback(' إعادة تعيين', 'reset')],
                [Markup.button.callback(' تعيين المكافأة', 'setReward')],
                [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
            ])
        });
        await ctx.deleteMessage();
    });

    bot.action(/^reset$/, async (ctx) =>
    {

        if (gameData.isGameRunning || gameData.isJoiningAllowed)
        {
            await showAlert(ctx, 'اللعبة بدات بالفعل');
            return;
        }

        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }
        await ctx.deleteMessage(message.message_id)

        message = await ctx.reply(getOrUpdateStartGameMessage(), {
            ...Markup.inlineKeyboard([
                [Markup.button.callback(' حد الوقت للانضمام', 'setTimeLimit')],
                [Markup.button.callback(' اختر موضوع', 'setTopic')],
                [Markup.button.callback(' وقت كل سؤال', 'setQuestionTime')],
                [Markup.button.callback(' إعادة تعيين', 'reset')],
                [Markup.button.callback(' تعيين المكافأة', 'setReward')],
                [Markup.button.callback('السماح بالانضمام وبدا اللعبة', 'startJoin')]
            ])
        });

    })

    bot.action(/^startJoin$/, async (ctx) =>
    {
        if (ctx.from.id !== gameData.startedBy)
        {
            await showAlert(ctx, '❌ فقط المستخدم الذي بدأ اللعبة يمكنه ذلك.');
            return;
        }

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

        const questions = await getQuestions(gameData.topic.id)
        if (questions.length === 0)
        {
            await showAlert(ctx, 'no questions found for this topic');
            return;
        }

        gameData.questions = questions

        gameData.isJoiningAllowed = true;
        const joinMessage = await ctx.reply(
            `⏳ لديك ${gameData.timeLimit} ثانية للانضمام.\n\n📋 تفاصيل اللعبة:\n
        - الموضوع: ${gameData?.topic?.name || 'لم يتم الاختيار'}
        - وقت كل سؤال: ${gameData.questionTime} ثانية
        - المكافأة: ${gameData.reward || 'لا يوجد'}`,
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

                await askQuestion(bot, ctx, 0, gameData.players, 0);
            }, 5000);
        }, gameData.timeLimit * 1000);
    })



    bot.action('join_game', async (ctx) =>
    {
        await joinPlayer(ctx);
    });
}

const manageTopics = async (bot, ctx) =>
{
    const topics = await getAllTopics();
    if (topics.length === 0)
    {
        await showAlert(ctx, 'No topics found.');
        return;
    }

    const topicButtons = topics.map(topic => Markup.button.callback(topic.name, `select_topic:${topic.id}`));
    await ctx.reply('📚 Available Topics:', Markup.inlineKeyboard(topicButtons));

    bot.action(/^select_topic:(\d+)$/, async (ctx) =>
    {
        const topicId = ctx.match[1];
        const topic = await getTopic(parseInt(topicId))

        if (!topic)
        {
            await showAlert(ctx, '❌ Topic not found.');
            return;
        }

        await ctx.reply(`🛠️ Manage Topic: ${topic.name}`, Markup.inlineKeyboard([
            [Markup.button.callback('Add Question', `add_question:${topic.id}`)],
            [Markup.button.callback('Edit Name', `edit_name:${topic.id}`)],
            [Markup.button.callback('Back to Topics', 'view_topics')]
        ]));
    });

    bot.action(/^add_question:(\d+)$/, async (ctx) =>
    {
        const topicId = ctx.match[1];
        await ctx.reply('📜 Send the question and option with pool');

        bot.on('message', async (ctx) =>
        {
            if (ctx.message.poll)
            {

                console.log(ctx.message.poll)
                const poll = ctx.message.poll;


                if (!poll || !poll.options || poll.options.length < 2)
                {
                    await ctx.reply('❌ Poll data is invalid or incomplete.');
                    return;
                }

                const questionText = poll.question;
                const options = poll.options.map(opt => opt.text.trim());

                try
                {
                    await addQuestion(topicId, questionText, options, 0);

                    await ctx.reply('✅ Question added successfully!');
                } catch (error)
                {
                    console.error('Error adding question:', error);
                    await ctx.reply('❌ Failed to add the question. Please try again.');
                }
            }

        });
    })



}

module.exports = { joinPlayer, startGame, manageTopics };
