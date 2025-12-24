import pkg from 'superagent';
const { get } = pkg;

const BASE_URL_TWISTO = "https://data.twisto.fr/api/explore/v2.1/catalog/datasets/horaires-tr/records?"
const BASE_URL_EDT = "https://edtapi.antoninhuaut.fr/v2/1/"

export const getRealTimeSchedule = (line, stop, callback) =>
{
    line = Buffer.from(line, 'utf8').toString('latin1').replace(/'/g, "\\'");
    stop = Buffer.from(stop, 'utf8').toString('latin1').replace(/'/g, "\\'");

    get(BASE_URL_TWISTO)
    .query({
        where: `ligne='${line}' and nom_de_l_arret_stop_name like '%${stop}%'`,
        order_by: 'destination_stop_headsign, horaire_depart_theorique',
        limit: 50,
        timezone: "Europe/Paris"
    })
    .end((err, res) => {
        if (err) {
            console.error(err);
            callback(null);
        } else {
            callback(res.body);
        }
    });
}

export const getResourcesList = (callback) =>
{
    get(BASE_URL_EDT)
    .query()
    .end((err, res) => {
        if (err) {
            console.error(err);
            callback(null);
        } else {
            callback(res.body);
        }
    });
}

export const getScheduleForResource = (resourceId, callback) =>
{
    get(`${BASE_URL_EDT}${resourceId}/json`)
    .query()
    .end((err, res) => {
        if (err) {
            console.error(err);
            callback(null);
        } else {
            callback(res.body);
        }
    });
}