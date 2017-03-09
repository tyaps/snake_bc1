/**
 * Created by U_M0UW8 on 08.03.2017.
 */

var snake = new Object();

snake.playgroundSize=10;
snake.playground = new Array(snake.playgroundSize);

snake.item = {x:2, y:2, score:50, type: 1};

snake.player = new Object();
snake.player.name=null;
snake.player.score = 0;

snake.player.snakeBody = new Array(1);

snake.history = new Array(); //история ходов (при загрузке из блокчейна)


Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};

snake.init = function()
{
    for(var i=0; i<this.playgroundSize; i++)
        snake.playground[i] = new Array(snake.playgroundSize)

    snake.player.snakeBody[0] = {x:5, y:5};
}

snake.showItem = function(){
    //почистить
    $("#playground td.item").removeClass("item");

    if(snake.item!=null)
    {
        p=snake.item;
        $("#playground tr:eq("+ (this.playgroundSize - 1 - p.y)+") td:eq("+p.x+")").addClass("item");
    }

}

snake.showPlayground = function()
{
    var tdString = "";
    for(var i=0; i<this.playgroundSize; i++) {
        tdString+="<td></td>";

    }

    for (var j = 0; j < this.playgroundSize; j++)
        $("#playground").append("<tr>"+tdString+"</tr>")
    //alert(3);


}

snake.showPlayer = function()
{
    for(var i=0; i<snake.player.snakeBody.length; i++)
    {
        var p = snake.player.snakeBody[i];
        //Отрисовка с учетом инверсии Y
        $("#playground tr:eq("+ (this.playgroundSize -1 - p.y)+") td:eq("+p.x+")").addClass("pl");
    }


}

snake.movePlayer = function(e)
{
    if(snake.player.name==null)
    {
        console.log("movePlayer() - game is not started yet");
        return;
    }

    var dx=0;
    var dy=0;

    switch (event.which)
    {
        //down
        case 40:{dy=-1; break}
        //up
        case 38:{ dy=1; break }
        //left
        case 37:{dx=-1; break}
        //right
        case 39:{dx=1; break}
    }

    //проверка на Сожрали ли итем
    var playerHead=snake.player.snakeBody[0];
    var snakeTail = snake.player.snakeBody[snake.player.snakeBody.length - 1];

    if(playerHead.x + dx == snake.item.x && playerHead.y + dy==snake.item.y)
    {
        snake.item.x=8;
        snake.item.y=8;
        snake.showItem();

        //нарастить змейку (сделать копию хвоста)
        var newTail = {x: snakeTail.x, y: snakeTail.y};
        snake.doMovement(snakeTail, snake.player.snakeBody,dx ,dy)
        snake.player.snakeBody.push(newTail)
    }
    else {
        snake.doMovement(snakeTail, snake.player.snakeBody,dx ,dy)
    }
    snake.showPlayer();
    //сохраняем в чейн
    //snake.saveState();

}

snake.doMovement = function(snakeTail, snakeBody,dx ,dy)
{
    //перемещаем змейку методом перекидывания хвоста к голове
    snakeTail.x = snake.player.snakeBody[0].x + dx;
    snakeTail.y = snake.player.snakeBody[0].y + dy;

    //прозрачные границы
    if(snakeTail.x==-1)                     snakeTail.x=snake.playgroundSize-1;
    if(snakeTail.x==snake.playgroundSize)   snakeTail.x=0;
    if(snakeTail.y==-1)                     snakeTail.y=snake.playgroundSize-1;
    if(snakeTail.y==snake.playgroundSize)   snakeTail.y=0;

    snake.player.snakeBody.move(snake.player.snakeBody.length - 1, 0);
}


snake.clearPlayground = function(){

    //$("#playground td").removeClass("pl");
    $("#playground td.pl").removeClass("pl");
    //$("#playground td.item").removeClass("item");
}

snake.start = function(playerName)
{
    snake.player.name = playerName;
    snake.player.score = 0;

    $("#tbPlayerName, #btnStart").attr("disabled","true");

    var data = {player: snake.player, item: snake.item }; //item нужен, чтобы 0-й ход залогировать
    snake.ajaxPost("/saveNewPlayer", data, function (data, textStatus, jqXHR) {
        console.log("/saveNewPlayer result:" + data);
    });
}

//Сохранить состояние в блокчейн
snake.saveState = function(){

    var data = {player: snake.player, item: snake.item };

    snake.ajaxPost("/saveState", data, function (data, textStatus, jqXHR) {
        console.log("/saveState result:" + data);
    });

    
}

snake.loadHistory = function (playerName){
    //Загружаем данные по игроку - сколько он сделал ходов.
    //потом по-одному грузим эти ходы (в nodeJS можно await-ом потом сделать)
    snake.ajaxPost("/getPlayerTurnCount", {playerName: playerName}, function (data, textStatus, jqXHR) {
        console.log("/getPlayerTurnCount result:" + data);

        snake.history = new Array();
        var turnCount = JSON.parse(data).turnCount;

        $("#divHistory").children().remove();
        for(var i=0; i<= turnCount; i++)
        {
            snake.ajaxPost("/getPlayerTurnData", {playerName: playerName, turn: i}, function (data, textStatus, jqXHR) {
                snake.history.push(JSON.parse(data));
                $("#divHistory").append("<div>" + data + "</div>")
            });
        }
    });



}

snake.sortHistory = function()
{
    snake.history.sort(historyRowsComparator);
    $("#divHistory").children().remove();
    for(var i=0; i< snake.history.length; i++)
    {
        $("#divHistory").append("<div>" + JSON.stringify(snake.history[i]) + "</div>")

    }

}

function historyRowsComparator(a,b) {
    if (a.player.turn < b.player.turn)
        return -1;
    if (a.player.turn > b.player.turn)
        return 1;
    return 0;
}

snake.playHistory = function() {

    var i=0;
    var historyIntervalId = setInterval(function(){
        console.log(i)


        var hostoryTurn = snake.history[i];
        snake.item = hostoryTurn.item;
        snake.player = hostoryTurn.player;
        snake.clearPlayground();
        snake.showItem();
        snake.showPlayer();

        i++;
        if(i==snake.history.length)
            clearInterval(historyIntervalId);
    }, 1000)
}


snake.ajaxPost = function(url, data, successFunction, errorFuntion)
{
    //дефолтные функции
    if(!successFunction)
        successFunction=function (data, textStatus, jqXHR) {
            console.log("ajax success");
        };

    if(!errorFuntion)
        errorFuntion=function (xhr, status, err) {
            console.log("ajax error");
        };
    
    $.ajax({
        url: url,
        dataType: 'text',               //приходится объявлять text, а не json, потому что хер как работает bodyParser

        data: {data: JSON.stringify(data)},
        //data: {data: data},
        type: 'POST',
        success: successFunction,
        error: errorFuntion
    });
}

$(document).ready(function(){
    snake.init();
    snake.showPlayground();
    snake.showPlayer();
    snake.showItem();

    $( "body" ).keydown(function(e) {

        snake.movePlayer(e);
        snake.clearPlayground(e);
        snake.showPlayer();

    });
});