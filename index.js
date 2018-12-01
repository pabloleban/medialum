const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Database = require('./server/Database');
const database = new Database({host: "localhost", user: "root", password: ""});
const db_methods = require('./server/db_methods')

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});