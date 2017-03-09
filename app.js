/**
 * Created by U_M0UW8 on 25.01.2017.
 */

var config = require('config');

var http = require('http');
var express = require('express');
var bodyParser = require('body-parser')


var utils = require('./utils')
var blockchain = require('./blockchain')




var app = express();

// this will make Express serve your static files
app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname +  '/public')); //папка со статическим содержимым
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded
app.use(bodyParser.json()) // parse application/json

var port = config.get('nodeJsServerPort');

var server          = app.listen(port);


console.log('Web-server started on port ' + port);



//region Основной функционал

//Основная форма с фотками по распознаванию
app.get('/', function(req, res) {

    res.send("ok");
});


app.post('/saveNewPlayer', function(req, res) {

    var d = JSON.parse(req.body.data);
    if(!d.player.name)
    {
        res.send({res:"playerName not set"});
        return;
    }

    d.player.turn = 0; //Счетчик ходов будет только на стороне блокчейна (для интереса)

    var playerKey=getPlayerKey(d.player.name);
    var playerValue = d.player;

    blockchain.write(playerKey, playerValue, function(success){

        //пишем лог 0 хода (снимки player + item)
        var playerTurnKey = getPlayerTurnKey(d.player.name, d.player.turn);
        var playerTurnData = {player: d.player, item: d.item};

        blockchain.write(playerTurnKey, playerTurnData, function(success){
            res.send({res:success});
        });



    })





});

app.post('/saveState', function(req, res) {

    var d = JSON.parse(req.body.data);

    if(!d.player.name)
    {
        res.send({res:"playerName not set"});
        return;
    }

    var playerKey=getPlayerKey(d.player.name);
    //var playerValue = d.player;

    //читаем текущее состояние игрока (отдельно интересен номер хода - turn)
    blockchain.read(playerKey, function(result){

        if(result==null){
            res.send({res:"no player has been found"});
            return;
        }

        var playerTurnCount = JSON.parse(result).turn;


        var playerValue = d.player;
        playerValue.turn = playerTurnCount+1; //добавляем в измененные данные игрока (он ведь шевельнулся) - номер хода

        //Пишем текущее состояние
        blockchain.write(playerKey, playerValue, function(success){

            //пишем лог ходов (снимки player + item)
            var playerTurnKey = getPlayerTurnKey(d.player.name, d.player.turn);
            var playerTurnData = {player: d.player, item: d.item};

            blockchain.write(playerTurnKey, playerTurnData, function(success){
                res.send({res:success});
            });
        });
    })
});

getPlayerKey = function(playerName)
{
    return "player_" + playerName;
}

getPlayerTurnKey = function(playerName, playerTurn)
{
    return "player_" + playerName + "_" + playerTurn;
}




app.post('/getPlayerTurnCount', function(req, res) {

    var d = JSON.parse(req.body.data);

    var playerKey=getPlayerKey(d.playerName);

    //читаем текущее состояние игрока (отдельно интересен номер хода - turn)
    blockchain.read(playerKey, function(result){

        if(result==null){
            res.send({res:"no player has been found"});
            return;
        }

        res.send({turnCount: JSON.parse(result).turn});

    })
});


app.post('/getPlayerTurnData', function(req, res) {

    var d = JSON.parse(req.body.data);

    var playerKey=getPlayerTurnKey(d.playerName, d.turn);

    //читаем текущее состояние игрока (отдельно интересен номер хода - turn)
    blockchain.read(playerKey, function(result){

        if(result==null){
            res.send({res:"no player has been found"});
            return;
        }

        res.send(result);

    })
});

app.get('/getPlayers', function(req, res) {
    var players=["p1","p2","p3"];
    res.send(players);
    // var camId = req.query.camId;
    // var vendorId = req.query.vendorId;
    //
    // databaseLayer.getVisitorsList(camId, vendorId, function (result) {
    //     res.send(result);
    // });
});


