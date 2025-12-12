import moment from 'moment';

export const capitalize = (str) => {
    str = str.toLowerCase();
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

export const getDepartureTime = (date, theoricalDate) => {

    let departureTime = moment(date, 'HH:mm:ss');

    if (theoricalDate == date)
    {
        return departureTime.format('HH:mm:ss');
    }

    if (departureTime.hours() === 24)
    {
        departureTime.hours(0);
    }
    departureTime.add(1, 'hour');
    return departureTime.format('HH:mm:ss');
}

export const getCurrentTime = () => {
    return moment().format('HH:mm:ss');
}

export const getRemainingTimeString = (departureTime, currentTime, differentDays) => {
    console.log(departureTime, currentTime);
    
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