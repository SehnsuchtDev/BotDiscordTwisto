import { getHelp, getNextArrival } from "../Controllers/CommandController.js";

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
    }
}