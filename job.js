import schedule from 'node-schedule';
import getNews from './getNews.js'

const job = schedule.scheduleJob('20 * * * *', function(){
    getNews();
});