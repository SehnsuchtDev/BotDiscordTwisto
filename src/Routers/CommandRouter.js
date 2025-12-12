import { getAbout, getHelp, getNextArrival, getUnknownCommand } from "../Controllers/CommandController.js";

export const useRoute = (query, channel) =>
{
    console.log(query.split(" "));
    let args = query.split(" ");
    let command = args[1].toLowerCase();

    switch (command) 
    {
        case "passage":
            getNextArrival(args.slice(2), channel);
            break;
        case "help":
            getHelp(channel);
            break;
        case "about":
            getAbout(channel);
            break;
        default:
            getUnknownCommand(channel);
            break;
    }
}