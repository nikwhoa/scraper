import axios from 'axios';
import * as cheerio from 'cheerio';

const getNewsUrls = async (url, selector) => {
    try {
        const { data } = await axios.get(url);

        const $ = cheerio.load(data);

        const linksToNews = $(selector);

        const newsUrls = [];

        linksToNews.each((i, link) => {
            newsUrls.push($(link).attr('href'));
        });

        return newsUrls;
    } catch (err) {
        console.error(err);
    }
};

export default getNewsUrls;
