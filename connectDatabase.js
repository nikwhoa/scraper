import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low, JSONFile } from 'lowdb';
import fs from 'fs';



const connectDatabase = async (filename) => {
    let path = '';
    const __dirname = dirname(fileURLToPath(import.meta.url));

    if (!fs.existsSync(`${__dirname}./dataBase/${filename}`)) {
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
