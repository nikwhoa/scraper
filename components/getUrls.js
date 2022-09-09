import axios from "axios";
import * as cheerio from "cheerio";

const getNewsUrls = async (url, selector) => {
    try {
        const { data } = await axios.get(url);

        const $ = cheerio.load(data);
        const urls = $(selector)
            .map((i, el) => $(el).attr("href"))
            .get();

        return urls;
    } catch (err) {
        console.error(err);
    }
};

export default getNewsUrls;
