export const getChannel = async (client, channelId) =>
{
    console.log("Fetching channel with ID " + channelId);
    let channel = null;
    try {
        channel = await client.channels.fetch(channelId);
        console.log("Reloading timetable loop for channel " + channel.name);
    } catch (error) {
        try {
            channel = await client.users.fetch(channelId);
            console.log("Reloading timetable loop for user " + channel.username);
        } catch (userError) {
            console.error(`Failed to fetch channel with ID ${channelId}:`, userError);
        }
    }

    return channel;
}