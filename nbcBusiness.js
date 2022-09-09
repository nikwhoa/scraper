/* eslint-disable semi */
/* eslint-disable no-unused-vars */
import axios from "axios";
import * as cheerio from "cheerio";

import { join, dirname } from "path";
import { Low, JSONFile } from "lowdb";

import { fileURLToPath } from "url";

import convert from "xml-js";
import fs from "fs";

import baseXML from "./components/baseXML.js";

import { DOMParser } from "@xmldom/xmldom";
import { JSDOM } from "jsdom";

// create and connect to database
const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, "./dataBase/nbcBusiness.json"); // path to database
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

const gettingNews = new Promise((resolve, reject) => {
    const getNewsUrls = async () => {
        const basedUrls = [];
        // {
        // item: {
        // image: 'src',
        // link: 'link'
        // }
        // }
        const items = {
            item: [{
                image: "",
                link: "",
            }],
        }
        try {
            const { data } = await axios.get(
                "https://www.nbcnews.com/business"
            );
            const $ = cheerio.load(data);

            const teaseCard = $(".tease-card");

            teaseCard.each((i, el) => {
                const image = $(el).find("img").attr("src");
                const link = $(el).find("a").attr("href");

                items.item += {image, link};


            // const urls = $(
            //     ".multi-up__articles > .multi-up__article > article > .tease-card__info > h2.tease-card__headline > a"
            // )
            //     .map((i, el) => $(el).attr("href"))
            //     .get();

            // urls.forEach((el) => el.includes("business") && basedUrls.push(el));

            // return basedUrls;
        } catch (err) {
            throw new Error(err);
        }


    };



    resolve(getNewsUrls());
}).then((data) => {
    // console.log(data);
});
//     .then((data) => {
//         const changedUrls = [];
//         data.forEach((el) => el.includes("business") && changedUrls.push(el));
//         return changedUrls;
//     })
//     .then(async (data) => {
//         const newNews = [];

//         // get news from urls
//         // eslint-disable-next-line no-restricted-syntax
//         for (const item of data) {
//             // eslint-disable-next-line no-await-in-loop, no-shadow
//             const { data } = await axios.get(item);
//             const $ = cheerio.load(data);
//             const title = $("h1").text();

//             newNews.push({
//                 title,
//                 link: item,
//             });
//         }
//         console.log(newNews);
//     });
