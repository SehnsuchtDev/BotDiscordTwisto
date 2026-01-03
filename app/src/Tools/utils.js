import moment from 'moment';
import tz from 'moment-timezone';

export const capitalize = (str) => {
    str = str.toLowerCase();
    return str.replace(/^(.)|(?<=\s)(.)/g, c => c.toUpperCase());
}

export const formatString = (str) => {
    str = str.replace(/[-\s]/g, '');
    str = capitalize(str);
    return str;
}

export const getTime = (hour, minute, offset) => {
    if (hour || minute)
    {
        let date = moment();
        date.hours(hour ? hour : 0);
        date.minutes(minute ? minute : 0);
        date.seconds(0);

        if (offset)
        {
            date = moment(date, 'HH:mm').add(offset, 'minutes');
        }

        return date;
    }

    return getCurrentTime(offset);
}

export const getCurrentTime = (offset) => {
    let date = moment().tz('Europe/Paris');

    if (offset)
    {
        date = date.add(offset, 'minutes');
    }

    return date;
}

export const getRemainingTimeString = (departureTime, currentTime, differentDays) => {
    
    //departureTime = new Date(`1970-01-01T${departureTime.format('HH:mm:ss')}`);
    //currentTime = new Date(`1970-01-01T${currentTime.format('HH:mm:ss')}`);

    let difference = departureTime - currentTime;
    console.log(departureTime, currentTime, difference);

    if (differentDays) {
        difference = (departureTime.toDate().getTime() + 24 * 60 * 60 * 1000) - currentTime.toDate().getTime();
    }

    const hoursRemaining = Math.floor(difference / 3600000);
    if (hoursRemaining > 0) {
        difference -= hoursRemaining * 3600000;
        
    }
    const timeRemaining = Math.floor(difference / 60000);
    return `${hoursRemaining > 0 ? hoursRemaining + "h " : ""}${timeRemaining} min`;
}

export const getPlural = (count, singular, plural) => {
    return count > 1 ? plural : singular;
}