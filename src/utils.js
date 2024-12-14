const showAlert = async (ctx, message) =>
{
    return await ctx.answerCbQuery(message, { show_alert: true })
}

const sendAndDelete = async (ctx, messageText, options = {}, delay = 30000) =>
{
    try
    {
        const sentMessage = await ctx.reply(messageText, options);
        setTimeout(async () =>
        {
            try
            {
                await ctx.deleteMessage(sentMessage.message_id);
            } catch (error)
            {
                console.error("Error deleting message:", error);
            }
        }, delay);
    } catch (error)
    {
        console.error("Error sending message:", error);
    }
}



module.exports = { showAlert, sendAndDelete }