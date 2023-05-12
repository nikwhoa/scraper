import { Low, JSONFile } from 'lowdb';
import connectDatabase from '../connectDatabase.js';
import ZabbixSender from 'node-zabbix-sender';
let Sender = new ZabbixSender({host: '127.0.0.1'});

const addNewsToDB = async (data, pathToFile) => {
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
    // add new news if there is no news in database
    item.unshift(...data);
    await dataBase.write();
  } else {
    data.filter((news) =>
    !item.map((el) => el.title).includes(news.title)
    ? item.unshift(news)
    : null,
    );
  }
  // remove news if it is more than 100
  for (let i = 0; i < item.length; i += 1) {
    if (i > 100) {
      item.splice(i);
    }
  }
  
  await dataBase.write().then(() => {
    console.log('New posts:', quantityNewPosts);
    Sender.addItem('Zabbix server', pathToFile.slice(0, -5), quantityNewPosts);
    Sender.send(function(err, res) {
      if (err) {
        throw err;
      }
      
    });
  });
  return db;
};

export default addNewsToDB;
