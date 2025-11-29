import moment from 'moment';

export const capitalize = (str) => {
    str = str.toLowerCase();
    return str.replace(/\b\w/g, c => c.toUpperCase());
}

export const getDepartureTime = (date) => {
    let departureTime = moment(date, 'HH:mm:ss');
    if (departureTime.hours() === 24) {
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

    const timeRemaining = Math.floor(difference / 60000);
    const secondsRemaining = Math.floor((difference % 60000) / 1000);
    return `${timeRemaining}:${secondsRemaining < 10 ? '0' : ''}${secondsRemaining}`;
}