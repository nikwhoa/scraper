import http from 'http';
import childProcess from 'child_process';
// const hostname = 'godzillanewz.com';
const hostname = 'localhost';
const port = 3011;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World! NodeJS \n');
});

import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

function runScript(scriptPath, callback) {
    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

cron.schedule('0 * * * *', function () {
    // */2 * * * *
    // 0 0 * * *
    //console.log('running a task every 10 minutes');

    runScript('./foxNews.js', function (err) {
        if (err) throw err;
        console.log('finished foxNews.js');
    });

    // runScript('./washingtonpost.js', function (err) {
    //     if (err) throw err;
    //     console.log('finished running washingtonpost.js');
    // });
    // runScript('./getNews.js', function (err) {
    //     if (err) throw err;
    //     console.log('finished running washingtonpost.js');
    // });
    //console.log('success!');
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
