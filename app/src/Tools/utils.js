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

export const getDepartureTime = (date, realTimeDate) => {
    let departureTime = moment(date, 'HH:mm:ss');

    let dateInRealTime = false;

    if (realTimeDate != undefined && realTimeDate != date)
    {
        let realTime = moment.utc(realTimeDate, 'HH:mm:ss').tz('Europe/Paris');
        console.log("Real-time date:", realTimeDate, "Parsed real-time:", realTime.format('HH:mm:ss'), "Theorical departure:", departureTime.format('HH:mm:ss'));

        if (!departureTime.isSame(realTime))
        {
            dateInRealTime = true;
            departureTime = realTime;
        }
    }

    if (departureTime.hours() === 24)
    {
        departureTime.hours(0);
    }

    return {departureTime: departureTime.format('HH:mm'), realTime: dateInRealTime};
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

        return date.format('HH:mm');
    }

    return getCurrentTime(offset);
}

export const getCurrentTime = (offset) => {
    let date = moment().tz('Europe/Paris');

    if (offset)
    {
        date = date.add(offset, 'minutes');
    }

    return date.format('HH:mm');
}

export const getRemainingTimeString = (departureTime, currentTime, differentDays) => {
    
    departureTime = new Date(`1970-01-01T${departureTime}`);
    currentTime = new Date(`1970-01-01T${currentTime}`);

    let difference = departureTime - currentTime;

    if (differentDays) {
        difference = (departureTime.getTime() + 24 * 60 * 60 * 1000) - currentTime.getTime();
    }

    const hoursRemaining = Math.floor(difference / 3600000);
    if (hoursRemaining > 0) {
        difference -= hoursRemaining * 3600000;
        
    }
    const timeRemaining = Math.floor(difference / 60000);
    return `${hoursRemaining > 0 ? hoursRemaining + "h " : ""}${timeRemaining} min`;
}