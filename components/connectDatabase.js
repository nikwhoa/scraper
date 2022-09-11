import { join } from 'path';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';



const connectDatabase = async (filename) => {
    let path = '';

    if (!fs.existsSync(`./dataBase/${filename}`)) {
        const file = join('./dataBase/', filename);
        const adapter = new JSONFile(file);
        const db = new Low(adapter);
        await db.read();

        // if database is empty, create base for it
        if (!db.data) {
            db.data = {
                item: [],
            };
            await db.write();
        }

        path = `./dataBase/${filename}`;
    }
    path = `./dataBase/${filename}`;
    return path;
};


export default connectDatabase;