const mysql = require('mysql');
class Database {
    constructor(config) {
        this.connection = mysql.createConnection(config);

        this.connection.connect(function(err) {
            if (err) throw err;
            console.log("MySQL Connected!");
        });
    }

    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows) => {
                if (err)
                    return reject(err);
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