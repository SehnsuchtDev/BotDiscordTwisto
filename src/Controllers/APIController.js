import pkg from 'superagent';
const { get , query, use, end} = pkg;

const BASE_URL = "https://data.twisto.fr/api/explore/v2.1/catalog/datasets/horaires-tr/records?"

export const getRealTimeSchedule = (line, stop, callback) =>
{
    // https://data.twisto.fr/api/explore/v2.1/catalog/datasets/horaires-tr/records?where=ligne%3D%2723%27%20and%20nom_de_l_arret_stop_name%20like%20%27%25Creully%27&order_by=nom_de_l_arret_stop_name&limit=20
    get(BASE_URL)
    .query({
        where: `ligne='${line}' and nom_de_l_arret_stop_name like '%${stop}%'`,
        order_by: 'horaire_depart_theorique',
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