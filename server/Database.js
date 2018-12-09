const mysql = require('mysql');

class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.connection.connect(err => {
                if (err) reject(err);
                console.log("MySQL Connected!");
                module.exports = this.connection
                resolve();
            });
        })
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err){
                    console.error(err);
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}

module.exports = Database;