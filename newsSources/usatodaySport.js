/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable import/extensions */
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';
import convert from 'xml-js';
import connectDatabase from '../connectDatabase.js';
import baseXML from '../components/baseXML.js';
import ZabbixSender from 'node-zabbix-sender';
let Sender = new ZabbixSender({host: '127.0.0.1'});

dotenv.config();

let pathToDataBase = '';
const db = connectDatabase('usatodaySport.json').then((path) => {
  pathToDataBase = path;
});

const getNews = new Promise((resolve, reject) => {
  const news = [];
  
  axios
  .get('https://www.usatoday.com/sports/')
  .then((response) => {
    const $ = cheerio.load(response.data);
    const article = $('.gnt_m_flm_a');
    
    article.filter((i, el) => {
      if (el.attribs.href !== undefined) {
        if (
          !el.attribs.href.includes('in-depth') &&
          !el.attribs.href.includes('usatodayspecial') &&
          !el.attribs.href.includes('admeter')
          ) {
            news.push({
              link: `https://www.usatoday.com${$(el).attr('href')}`,
              image: $(el).find('img').attr('data-gl-src')
              ? $(el)
              .find('img')
              .attr('data-gl-src')
              .replace('width=120&height=120', 'width=1000&height=1000')
              : null,
              title: $(el).text(),
              pubDate: new Date().toString(),
            });
          }
        }
      });
    })
    .then(() => {
      resolve(news);
    })
    .catch((error) => {
      throw error;
    });
  })
  .then(async (data) => {
    // console.log(data);
    for (const item of data) {
      if (item.link !== undefined && !item.link.includes('in-depth')) {
        const { data } = await axios.get(item.link);
        
        const $ = cheerio.load(data);
        // const article = $('.gnt_ar_b');
        
        $('aside').remove();
        $('figure').remove();
        $('.gnt_em').remove();
        $('.gnt_ar_s').remove();
        $('.gnt_em_gl_vg').remove();
        $('img').remove();
        $('p:contains("Contributing")').remove();
        $('p:contains("WATCH")').remove();
        $('p:contains("MORE")').remove();
        $('p:contains("NFL NEWSLETTER")').remove();
        $('p:contains("Editor\'s note")').remove();
        $('p:contains("NEVER MISS")').remove();
        
        $('p:has(a)').filter(function () {
          // check links to others news inside article
          if ($(this).contents().length === 2) {
            $(this).remove();
          }
        });
        
        $('a').contents().unwrap();
        const html = $('.gnt_ar_b').html();
        
        if (
          item.image === null ||
          item.image === undefined ||
          item.image.length <= 1
          ) {
            continue;
          }
          const parts = item.image.split("?");
          item.image = parts[0];
          if (item.image.startsWith("/")) {
            item.image = "https://www.usatoday.com"+item.image;
      }
          
          if (html === null || html === undefined || html.length <= 100) {
            continue;
          }
          
          item.description = `<img src='${item.image}' />${html.replace(
            /"/g,
            "'",
            )}<br><div>This post appeared first on USA TODAY</div>`;
          }
        }
        
        return data;
      })
      .then(async (data) => {
        const adapter = new JSONFile(pathToDataBase);
        const dataBase = new Low(adapter);
        await dataBase.read();
        const { item } = dataBase.data;
        const prevQuantityPosts = item.length;
        let quantityNewPosts = 0;
        data.forEach((el) => delete el.image);
        
        if (item.length <= 0) {
          // add new news if there is no news in database
          item.unshift(...data);
          await dataBase.write();
        } else {
          data.filter((news) =>
          !item.map((el) => el.title).includes(news.title)
          ? item.unshift(news)
          : null,
          );
          quantityNewPosts += (item.length - prevQuantityPosts);
        }
        // remove news if it is more than 100
        for (let i = 0; i < item.length; i += 1) {
          if (i > 100) {
            item.splice(i);
          }
        }
        
        await dataBase.write();
        return quantityNewPosts;
      })
      .then(async (quantity) => {
        const xml = baseXML(
          'https://www.usatoday.com/sports/',
          'USA TODAY Sports',
          'Get the latest news from USATODAY Sports',
          );
          
          const jsonNews = fs.readFileSync(pathToDataBase, 'utf8');
          
          const xmlNews = convert.json2xml(jsonNews, {
            compact: true,
            ignoreComment: false,
            ignoreText: false,
            spaces: 4,
            indentAttributes: true,
            indentCdata: true,
          });
          fs.writeFile(
            // change it before sending to server
            // '/home/godzillanewz/public_html/usaTodaySports.xml',
            // './xml/usaTodaySports.xml',
            `${process.env.PATHTOXML}usaTodaySports.xml`,
            `${xml} ${xmlNews} </channel></rss>`,
            (err) => {
              if (err) throw err;
              console.log(
                `The file has been saved! ${new Date().toLocaleDateString('en-uk', {
                  // weekday: 'long',
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`,
                );
                Sender.addItem('Zabbix server', 'usatoday', quantity);
                Sender.send(function(err, res) {
                  if (err) {
                    throw err;
                  }
                  
                  // print the response object
                  //console.dir(res);
                });
              },
              );
            })
            .catch((err) => {
              throw err;
            });
            