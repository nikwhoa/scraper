import { Low, JSONFile } from 'lowdb';
import connectDatabase from '../connectDatabase.js';
import ZabbixSender from 'node-zabbix-sender';
let Sender = new ZabbixSender({ host: '127.0.0.1' });

const addNewsToDB = async (data, pathToFile) => {
  try {
    let pathToDataBase = '';
    const db = await connectDatabase(`${pathToFile}`).then((path) => {
      pathToDataBase = path;
    });

    const adapter = new JSONFile(pathToDataBase);
    const dataBase = new Low(adapter);
    await dataBase.read();
    const { item } = dataBase.data;
    const prevQuantityPosts = item.length;
    let quantityNewPosts = 0;

    if (item.length <= 0) {
      // add new news if there is no news in the database
      item.unshift(...data);
      quantityNewPosts += data.length;
    } else {
      // filter out duplicates and add new news based on title or link
      const uniqueNews = data.filter((news) => !item.some((el) => el.title.toLowerCase() === news.title.toLowerCase() || el.link === news.link));
      item.unshift(...uniqueNews);
      quantityNewPosts += uniqueNews.length;
    }

    // remove news if it is more than 100
    if (item.length > 100) {
      item.splice(100);
    }

    await dataBase.write();
    console.log('New posts:', quantityNewPosts);
    Sender.addItem('Zabbix server', pathToFile.slice(0, -5), quantityNewPosts);
    await Sender.send();

    return db;
  } catch (error) {
    console.error('Error:', error);
  }
};

export default addNewsToDB;
