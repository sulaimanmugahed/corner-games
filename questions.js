const { Markup } = require('telegraf');
const { gameData, resetGame } = require('./gameData');



async function askQuestion(bot, ctx, questionIndex, players, currentPlayerIndex, topic)
{
    if (players.length === 1)
    {
        await ctx.reply(`🎉 اللعبة انتهت! الفائز هو: <b>${players[0].name}</b> 🏆`, { parse_mode: 'HTML' });
        resetGame();
        return;
    }

    const question = gameData.topics[topic][questionIndex];
    const currentPlayer = players[currentPlayerIndex];

    await ctx.reply(
        `🔔 دور ${currentPlayer.name}: ${question.question}`,
        {
            ...Markup.inlineKeyboard(
                question.options.map((opt, i) => [{ text: opt, callback_data: `answer:${questionIndex}:${i}:${currentPlayer.id}:${topic}` }])
            ),
        }
    );

    if (gameData.currentQuestionTimeout)
    {
        clearTimeout(gameData.currentQuestionTimeout);
    }

    gameData.currentQuestionTimeout = setTimeout(async () =>
    {
        await ctx.reply(`❌ انتهى الوقت ! تم استبعاد ${currentPlayer.name}.`);
        players.splice(currentPlayerIndex, 1);

        if (players.length > 0)
        {
            const nextPlayerIndex = currentPlayerIndex % players.length;
            const nextQuestionIndex = (questionIndex + 1) % gameData.topics[topic].length;
            await askQuestion(bot, ctx, nextQuestionIndex, players, nextPlayerIndex, topic);
        }
    }, gameData.questionTime * 1000);

    bot.action(/^answer:(\d+):(\d+):(\d+):(\w+)$/, async (ctx) =>
    {
        clearTimeout(gameData.currentQuestionTimeout);
        const [qIndex, optionIndex, playerId, selectedTopic] = ctx.match.slice(1).map((val, i) => (i === 0 || i === 1 ? Number(val) : val));

        const currentPlayer = players.find(p => p.id === Number(playerId));
        if (!currentPlayer || selectedTopic !== topic) return;

        const correctAnswer = gameData.topics[selectedTopic][qIndex].correct;

        if (optionIndex === correctAnswer)
        {
            await ctx.reply(`✅ إجابة صحيحة! استمر يا ${currentPlayer.name}.`);
        } else
        {
            await ctx.reply(`❌ إجابة خاطئة! تم استبعاد ${currentPlayer.name}.`);
            players.splice(players.indexOf(currentPlayer), 1);
        }

        if (players.length > 0)
        {
            const nextPlayerIndex = (players.indexOf(currentPlayer) + 1) % players.length;
            const nextQuestionIndex = (qIndex + 1) % gameData.topics[selectedTopic].length;
            await askQuestion(bot, ctx, nextQuestionIndex, players, nextPlayerIndex, selectedTopic);
        }
    });
}


module.exports = { askQuestion };
