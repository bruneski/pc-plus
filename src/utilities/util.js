export async function gatherScores(data, dest) {
    await Promise.all(data.map( (m, index) => {
        console.log(`https://raider.io/api/v1/characters/profile?region=us&realm=mal-ganis&name=${encodeURI(m)}&fields=mythic_plus_scores_by_season:current`);
        return axios.get(`https://raider.io/api/v1/characters/profile?region=us&realm=mal-ganis&name=${encodeURI(m)}&fields=mythic_plus_scores_by_season:current`);
    })).then(raiders => {
        //console.log("Payload", raiders);
        raiders.map((record) => {
            console.log("Record", record.data);
            dest.push({
                "name": record.data.name,
                "score": record.data.mythic_plus_scores_by_season[0].scores.all
            })
        })
        return dest;
    }).catch(e => {
        console.error("gatherScores() Error -> ", e.response.data.message);
    });
}