const { Markup } = require('telegraf');
const { gameData, resetGame } = require('./gameData');
const { showAlert, sendAndDelete } = require('./utils')
const { addWin } = require('./services/playerWinService')


async function askQuestion(bot, ctx, questionIndex, players, currentPlayerIndex)
{
    if (gameData.players.length === 1)
    {
        const winner = gameData.players[0];
        const { wins } = await addWin(winner.id, gameData.topic.id)
        await sendAndDelete(
            ctx,
            gameData.reward
                ? `🎉 انتهت اللعبة! الفائز هو: <b>${winner.name}</b> 🏆\nعدد الانتصارات: ${wins}\nالمكافئة :${gameData.reward}`
                : `🎉 انتهت اللعبة! الفائز هو: <b>${winner.name}</b> 🏆\nعدد الانتصارات: ${wins}`,
            { parse_mode: 'HTML' }
        );
        
        resetGame();
        return;
    }

    const { shuffle } = require('lodash');

    const question = gameData.questions[questionIndex];
    const currentPlayer = gameData.players[currentPlayerIndex];
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.players.length;
    const nextPlayer = gameData.players[nextPlayerIndex];

    const shuffledOptions = shuffle(
        question.options.map((option, index) => ({ option, originalIndex: index }))
    );

    gameData.shuffledOptions = shuffledOptions;

    const questionMessage = await ctx.reply(
        `دور : ${currentPlayer.name}\nاللاعب التالي: ${nextPlayer.name}\n\n${question.question}.`,
        Markup.inlineKeyboard(
            shuffledOptions.map(({ option }, i) => [
                Markup.button.callback(option, `answer:${questionIndex}:${i}:${currentPlayer.id}`),
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
        gameData.players.splice(currentPlayerIndex, 1);

        if (gameData.players.length > 0)
        {
            const nextQuestionIndex = (questionIndex + 1) % gameData.questions.length;
            await askQuestion(bot, ctx, nextQuestionIndex, gameData.players, nextPlayerIndex);
        }
    }, gameData.questionTime * 1000);

    setTimeout(async () =>
    {
        await ctx.deleteMessage(questionMessage.message_id);
    }, 30000);
}

function setupAnswerHandler(bot, players)
{

    bot.action(/^answer:(\d+):(\d+):(\d+)$/, async (ctx) =>
    {
        const [qIndex, shuffledIndex, playerId] = ctx.match.slice(1).map((val, i) => (i < 2 ? Number(val) : val));

        const currentPlayer = gameData.players.find((player) => player.id === parseInt(playerId));
        if (!currentPlayer || ctx.from.id !== currentPlayer.id)
        {
            await ctx.answerCbQuery('🚫 هذا ليس دورك للإجابة!', { show_alert: true });
            return;
        }

        clearTimeout(gameData.currentQuestionTimeout);

        const question = gameData.questions[qIndex];
        const shuffledOptions = gameData.shuffledOptions;
        const selectedOption = shuffledOptions[shuffledIndex];
        const originalIndex = selectedOption.originalIndex;
        const correctAnswer = question.correct;

        if (originalIndex === correctAnswer)
        {
            await sendAndDelete(ctx,
                `✅ إجابة صحيحة!\n` +
                `الإجابة: ${selectedOption.option}.\n` +
                `استمر يا ${currentPlayer.name}.`
            );
        } else
        {
            await sendAndDelete(ctx,
                `❌ إجابة خاطئة.\n` +
                `اخترت: ${selectedOption.option}.\n` +
                `الإجابة الصحيحة هي: ${question.options[correctAnswer]}.`
            );
            gameData.players.splice(gameData.players.indexOf(currentPlayer), 1);
        }

        if (gameData.players.length > 0)
        {
            const nextPlayerIndex = (gameData.players.indexOf(currentPlayer) + 1) % gameData.players.length;
            const nextQuestionIndex = (qIndex + 1) % gameData.questions.length;
            await askQuestion(bot, ctx, nextQuestionIndex, gameData.players, nextPlayerIndex);
        }
    });
}



module.exports = { askQuestion, setupAnswerHandler };
