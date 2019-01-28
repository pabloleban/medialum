const mysql = require('mysql');

const connection = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME
});

exports.connect = async () => {
    return new Promise((resolve, reject) => {
        connection.connect(err => {
            if (err) {
                reject(err);
                return;
            } 
            console.log("MySQL Connected!");
            resolve();
        });
    })
}

exports.query = (sql, args) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, args, (err, rows) => {
            if (err){
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
}

exports.close = () => {
    return new Promise((resolve, reject) => {
        connection.end(err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}