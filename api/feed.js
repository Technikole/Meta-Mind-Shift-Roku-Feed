const axios = require('axios');
const xml2js = require('xml2js');

module.exports = (req, res) => {
  axios.get('https://technikole.com/assets/stream/anchor_meta-mind-shift.xml')

    .then(response => {
      const parser = new xml2js.Parser({ attrkey: "ATTR" });

      parser.parseString(response.data, function(error, result) {
        if(error === null) {
          let rokuJson = {
            providerName: "MaxDistro Live",
            lastUpdated: new Date().toISOString(),
            language: "en",
            series: []
          };

          result.rss.channel[0].item.forEach((item) => {
                // For each item, convert the XML to the desired JSON format

                var title = item.title[0];
                var description = item.description[0];
                var pubDate = item.pubDate[0];
                var enclosure;
                if (item.enclosure && item.enclosure[0] && item.enclosure[0].$) {
                    enclosure = item.enclosure[0].$.url;
                } else {
                    console.error('Enclosure is missing for item:', item);
                console.log('Item:', item)
                    // skip this item, or handle this error case as needed
                    return;
                }
                var seasonNumber = parseInt(item["itunes:season"][0]);
                var episodeNumber = parseInt(item["itunes:episode"][0]);

                // Construct the ID for the episode
                var guid = "MDL_MetaMindShift_S" + String(seasonNumber).padStart(3, '0') + "E" + String(episodeNumber).padStart(2, '0');

                var episode = {
                    id: guid,
                    title: title,
                    content: {
                        streamUrl: enclosure,
                        contentType: "mp4",
                        language: "en"
                    },
                    thumbnail: 'https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/26639417/26639417-1683820734531-2dfdeb65c2daf.jpg',
                    releaseDate: new Date(pubDate).toISOString(),
                    shortDescription: description.substring(0, 200),
                    longDescription: description,
                };

                var existingSeries = rokuJson.series.find(series => series.title === "Meta Mind Shift Show");
                if (existingSeries) {
                    var existingSeason = existingSeries.seasons.find(season => season.seasonNumber === seasonNumber);
                    if (existingSeason) {
                        existingSeason.episodes.push(episode);
                    } else {
                        existingSeries.seasons.push({
                            seasonNumber: seasonNumber,
                            episodes: [episode]
                        });
                    }
                } else {
                    rokuJson.series.push({
                        id: "MDL_Meta_Mind_Shift_Bonus",
                        title: "Meta Mind Shift Show",
                        seasons: [{
                            seasonNumber: seasonNumber,
                            episodes: [episode]
                        }],
                        thumbnail: 'https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/26639417/26639417-1683820734531-2dfdeb65c2daf.jpg',
                        shortDescription: "Join NiKole Maxwell, 'Technikole' the Metaverse Goddess, as she explores the latest trends and insights on how to navigate the Metaverse. We discuss everything from process automation to AI, blockchain, and Web3. It's time for your Meta Mind Shift. ",
                        genres: ["technology","sci-fi","gaming","science-fiction","educational"]
                    });
                }
          });
          
          // When you're done, you can send the result back as JSON like this:
          res.status(200).json(rokuJson);
        } else {
          res.status(500).send("Error parsing XML");
        }
      });
    })
    .catch(error => {
        console.error(error);
        res.status(500).send("Error fetching RSS feed: " + error.message);
      });
};
