import schedule from 'node-schedule';
import {gettingNews} from './getNews.js'
import fs from 'fs';

const job = schedule.scheduleJob('*/2 * * * *', () => {
    gettingNews.then((data) => {

        let xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"
        xmlns:content="http://purl.org/rss/1.0/modules/content/"
        xmlns:wfw="http://wellformedweb.org/CommentAPI/"
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:atom="http://www.w3.org/2005/Atom"
        xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
        xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
        >

    <channel>
        <title>FOX NEWS US</title>
        <atom:link href="https://www.foxnews.com/us" rel="self" type="application/rss+xml" />
        <link>https://www.foxnews.com/us</link>
        <description>Where Hope Finally Made a Comeback</description>
        <lastBuildDate>${new Date()}</lastBuildDate>
        <language>en-US</language>
        <sy:updatePeriod>
        hourly	</sy:updatePeriod>
        <sy:updateFrequency>
        1	</sy:updateFrequency>
        <generator>https://wordpress.org/?v=5.8.4</generator>`;

        fs.writeFile('./home/godzillanewz/public_html/rss.xml', xml+data+'</channel></rss>', (err) => {
            if (err) throw err;
            console.log('Saved!');
        });
    })
});