import axios from 'axios';
import * as cheerio from 'cheerio';
import baseXML from '../components/baseXML.js';
import generateDate from '../components/generateDate.js';
import getNewsFromSource from '../components/getNewsFromSource.js';
import checkImage from '../components/checkImage.js';
import cleanHTML from '../components/cleanHTML.js';
import checkTitle from '../components/checkTitle.js';
import addNewsToDB from '../components/addNewsToDB.js';
import generateXML from '../components/generateXML.js';

new Promise((resolve, reject) => {
  getNewsFromSource('https://www.geekwire.com/', 'article.teaser')
    .then((data) => {
      const links = [];

      data.filter((i, el) => {
        const $ = cheerio.load(el);

        /* It has to be change for others source */
        if (
          !$(el).find('a').attr('href').includes('geekwire-') &&
          !$(el).find('a').attr('href').includes('sponsor-post')
        ) {
          links.push($(el).find('a').attr('href'));
        }
      });

      return links;
    })
    .then((urls) => {
      if (urls.length <= 0) throw new Error();
      resolve(urls);
      reject(new Error('Links not found'));
    });
})
  .then(async (data) => {
    const news = [];

    for (const item of data) {
      const { data } = await axios.get(item);
      const $ = cheerio.load(data);
      const article = $('.entry-content');

      const title = $('h1').text();

      /* Check if title is empty or contains stop words */
      const checkingTitle = checkTitle(title);

      if (checkingTitle === 'no title' || checkingTitle === 'stop word') {
        continue;
      }

      const image = $(article)
        .find('figure.wp-block-image')
        .find('img')
        .attr('src');

      if (checkImage(image) === 'no image') {
        continue;
      }

      const description = cleanHTML(article.html(), {
        '.wp-block-pullquote': 'remove',
        '.wp-block-image': 'remove',
        '#ad-300x250_mid_mobile': 'remove',
        '#ad-300x250_mobile_article_bottom': 'remove',
        '#ad-300x250_mobile': 'remove',
        figure: 'remove',
        figcaption: 'remove',
        a: 'unwrap',
      });

      news.push({
        title,
        link: item,
        pubDate: generateDate(),
        description: `<img src=${image} /> ${description.replace(
          /\n/g,
          '',
        )}<br><div>This post appeared first on fool.com</div>`,
      });
    }

    return news;
  })
  .then(async (news) => {
    addNewsToDB(news, 'geekwire.json');
  })
  .then(() => {
    const xml = baseXML(
      'https://www.fool.com/investing/',
      'INVESTING NEWS FROM THE MOTLEY FOOL',
      'Get the latest news from the Motley Fool',
    );

    generateXML(
      'geekwire.json',
      xml,
    //   'xml/geekwire.xml',
        '/home/godzillanewz/public_html/geekwire.xml',
    );
  })
  .catch((error) => {
    console.log(error);
  });
