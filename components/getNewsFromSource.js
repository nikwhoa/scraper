import axios from 'axios';
import * as cheerio from 'cheerio';

const getNewsFromSource = async (url, selector) => {
    const response = await axios.get(url).then((response) => {
        const $ = cheerio.load(response.data);
        const data = $(selector);
        return data;
    });

    return new Promise((resolve, reject) => {
        if (response.length <= 0) {
            throw new Error();
        }
        resolve(response);
        reject(new Error('Class in news sources is not found or changed'))
    })
};

export default getNewsFromSource;
