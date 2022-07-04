import fs from 'fs';

let data = fs.readFileSync('/home/godzillanewz/nodejsapp/dataBase/db.json', 'utf8');
let json = JSON.parse(data);


// console.log(json.item.length);

// console.log(json.item[0]);

// for (let i = 0; i < json.item.length; i++) {
//     if (i >= 100) {
//         json.item.splice(i)
//     }
// }

console.log(json.item.length);

// for (let i = 0; i < json.length; i++) {
//     console.log(json[i].title);
// }