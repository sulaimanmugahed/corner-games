const { Markup } = require('telegraf');
const { gameData, resetGame } = require('./gameData');
const { showAlert, sendAndDelete } = require('./utils')


async function askQuestion(bot, ctx, questionIndex, players, currentPlayerIndex, topic)
{
    if (players.length === 1)
    {
        await sendAndDelete(ctx, `🎉 اللعبة انتهت! الفائز هو: <b>${players[0].name}</b> 🏆`, { parse_mode: 'HTML' });
        resetGame();
        return;
    }

    const question = gameData.topics[topic][questionIndex];
    const currentPlayer = players[currentPlayerIndex];
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.players.length;
    const nextPlayer = gameData.players[nextPlayerIndex];

    const questionMessage = await ctx.reply(
        `دور : ${currentPlayer.name}\nاللاعب التالي: ${nextPlayer.name}\n\n${question.question}.`,
        Markup.inlineKeyboard(
            question.options.map((opt, i) => [
                Markup.button.callback(opt, `answer:${questionIndex}:${i}:${currentPlayer.id}:${topic}`),
            ])
        )
    );

    if (gameData.currentQuestionTimeout)
    {
        clearTimeout(gameData.currentQuestionTimeout);
    }

    gameData.currentQuestionTimeout = setTimeout(async () =>
    {
        await sendAndDelete(ctx, `❌ انتهى الوقت! تم استبعاد ${currentPlayer.name}.`);
        players.splice(currentPlayerIndex, 1);

        if (players.length > 0)
        {
            const nextQuestionIndex = (questionIndex + 1) % gameData.topics[topic].length;
            await askQuestion(bot, ctx, nextQuestionIndex, players, nextPlayerIndex, topic);
        }
    }, gameData.questionTime * 1000);

    setTimeout(async () =>
    {
        await ctx.deleteMessage(questionMessage.message_id);
    }, 30000);
}

function setupAnswerHandler(bot, players, topic)
{
    bot.action(/^answer:(\d+):(\d+):(\d+):(\w+)$/, async (ctx) =>
    {
        const [qIndex, optionIndex, playerId, selectedTopic] = ctx.match.slice(1).map((val, i) => (i < 2 ? Number(val) : val));

        const currentPlayer = players.find((player) => player.id === parseInt(playerId));
        if (!currentPlayer)
        {
            await ctx.answerCbQuery('🚫 هذا ليس دورك للإجابة!', { show_alert: true });
            return;
        }

        if (ctx.from.id !== currentPlayer.id)
        {
            await ctx.answerCbQuery('🚫 هذا ليس دورك للإجابة!', { show_alert: true });
            return;
        }

        clearTimeout(gameData.currentQuestionTimeout);

        const question = gameData.topics[selectedTopic][qIndex];
        const correctAnswer = question.correct;



        if (optionIndex === correctAnswer)
        {
            await sendAndDelete(ctx,
                `✅ إجابة صحيحة!\n` +
                `الإجابة: ${question.options[optionIndex]}.\n` +
                `استمر يا ${currentPlayer.name}.`
            );
        } else
        {
            await sendAndDelete(ctx,
                `❌ إجابة خاطئة.\n` +
                `اخترت: ${question.options[optionIndex]}.\n` +
                `الإجابة الصحيحة هي: ${question.options[correctAnswer]}.`
            );
            players.splice(players.indexOf(currentPlayer), 1);
        }



        if (players.length > 0)
        {
            const nextPlayerIndex = (players.indexOf(currentPlayer) + 1) % players.length;
            const nextQuestionIndex = (qIndex + 1) % gameData.topics[selectedTopic].length;
            await askQuestion(bot, ctx, nextQuestionIndex, players, nextPlayerIndex, selectedTopic);
        } else
        {
            await sendAndDelete(ctx, `🎉 اللعبة انتهت! الفائز هو: <b>${players[0]?.name || 'لا أحد'}</b> 🏆`, { parse_mode: 'HTML' });
            resetGame();
        }
    });
}



module.exports = { askQuestion, setupAnswerHandler };
