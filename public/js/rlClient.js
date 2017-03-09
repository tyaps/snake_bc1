/**
 * Created by U_M0UW8 on 30.01.2017.
 */


var webSocketConnection = new Object();
webSocketConnection.connectionId=null; //идентификатор клиента веб-сокета (будет задаваться серверм при первом обращении)

var output;

var dotTeplateFunctions = new Object();

var rlClient = new Object();


rlClient.currentLogId=null;
rlClient.currentEmploee = null;
rlClient.currentVendorId = null;
rlClient.currentBranchId = 1; //пока хардкодим



$(document).ready(function(){
    rlClient.init();
});

rlClient.init = function()
{

    //зацепиться за наши веб сокеты
    rlWebSocket.start();

    //настройка doT-шаблонов
    dotTeplateFunctions.fn_clientCard = doT.template($("#dot_ClientCard").text());
    dotTeplateFunctions.fn_clientListItem = doT.template($("#dot_Item").text());
    dotTeplateFunctions.fn_clientListItems = doT.template($("#dot_ItemList").text());
    dotTeplateFunctions.fn_actionLog = doT.template($("#dot_ActionLog").text());
    dotTeplateFunctions.fn_flashMessagesItem = doT.template($("#dot_FlashMessagesItem").text());
    dotTeplateFunctions.fn_RoomItems = doT.template($("#dot_RoomItems").text());



    //вешаем события на список слева
    $(".itemList").on("click", " .item", function () {
        rlClient.displayVisitorCard($(this));
    })


}

//показать каротчку клиента
rlClient.displayVisitorCard = function(selectedNode)
{
    var logId = selectedNode.attr("data-id");

    selectedNode.parent().children().removeClass("active");
    selectedNode.addClass("active");




    $.ajax({
        url: "/getVisitorInfo",
        dataType: 'json',
        data: {logId: logId},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            //карта клиента
            var resultHtml = dotTeplateFunctions.fn_clientCard(data);
            $("#divClientCard").html(resultHtml);

            //обновить список комнат (у них названия "Забронировать Терехов - Иванов" привязаны к клиенту)
            //пока не будем так делать
            rlClient.getRoomList(rlClient.currentBranchId);

            if(data.recognized)
            {
                $(".statButtons button").attr("disabled",true).removeClass("set");
                $(".statButtons #btnRecognized"+data.recognized).addClass("set");
            }
            else
            {
                $(".statButtons button").removeAttr("disabled").removeClass("set");
            }

            rlClient.currentLogId = data.logId;

            //Получить табличку по действиям по этому событию
            rlClient.get_actionLog(rlClient.currentLogId);

        },
        error: function (xhr, status, err) {
            console.error("ajax error");

            //console.error(this.props.url, status, err.toString());
        }
    });
}


 rlClient.onMessage_VisitorAppeared=function()
{
    var camId = $("#ddlCamera").val();
    var vendorId = $("#ddlVendors").val();
    rlClient.getVisitorsListByCamera(camId, vendorId, function(clientData){

        var showupWindowNotFoundMessage = "Внимание! Пришел посетитель " + clientData.firstName + " "
        + clientData.lastName + " (" + clientData.similarity + "%). Комментарий: " + clientData.comments
        + "\r\n\r\n Не могу открыть chrome, т.к. вкладка не активна!"
        showUpClient.showMeUp(showupWindowNotFoundMessage);});




}


rlClient.onMessage_ManagerIsCalled = function(clientData)
{
    var empId= $("#ddlEmployee").val();
    rlClient.getVisitorsListByEmployee(empId, function(){

        var showupWindowNotFoundMessage = "Внимание! Вызван финансовый менеджер!"
            + "\r\n\r\n Не могу открыть chrome, т.к. вкладка не активна!"
        showUpClient.showMeUp(showupWindowNotFoundMessage);

    });

}


rlClient.onMessage_DepositaryManagerIsCalled = function(clientData)
{
    var empId= $("#ddlEmployee").val();

    ////////////////// BY DEPOSITARY_CALL
    alert("alarma!")

    rlClient.getVisitorsListByDepositaryCall(function(){

        var showupWindowNotFoundMessage = "Внимание! Вызван менеджер депозитария!"
            + "\r\n\r\n Не могу открыть chrome, т.к. вкладка не активна!"
        showUpClient.showMeUp(showupWindowNotFoundMessage);

    });

}


rlClient.onMessage_BroadcastMessage = function(data)
{

    switch (data.actionTypeId) //заменить на enumActions
    {
        //пришло бродкастом, что Менеджер нажал "Сейчас подойду" -
        case enums.enumActionTypes.finManagerAcceptedClient:
        case enums.enumActionTypes.finManagerIsCalled:
        case enums.enumActionTypes.depositaryManagerIsCalled:
        case enums.enumActionTypes.depositaryAcceptedClient:
            //для зацепленных на камеру пользователей смотрим, есть ли в их событиях требуемое, и если есть,
            //то оповещаем, что Фин.Менеджер ответил на запрос
            var logId=data.logId;
            if($(".event_history .item[data-id="+logId+"]").length==1)
            {
                rlClient.addFlashMessage(data.message);
                if(rlClient.currentLogId == logId)
                {
                    rlClient.get_actionLog(rlClient.currentLogId);
                }
            }
            break;

        // //прищло бродкастом, что вызвали фин менеджера (это когда одна из 2 девушек на ресепшне вызывает Менеджера,
        // // то 2-й тоже должно прийти это сообщение - и у нее обновился лог)
        // case enums.enumActionTypes.finManagerIsCalled:
        //
        //     var logId=data.logId;
        //     if($(".event_history .item[data-id="+logId+"]").length==1)
        //     {
        //         rlClient.addFlashMessage(data.message);
        //         if(rlClient.currentLogId == logId)
        //         {
        //             rlClient.get_actionLog(rlClient.currentLogId);
        //         }
        //     }
        //     break;

        case enums.enumActionTypes.roomIsAssigned:
        case enums.enumActionTypes.roomIsFree:
            //обновить состояние комнат
            rlClient.getRoomList(rlClient.currentBranchId)
            break;

        default:
            console.log("onMessage_BroadcastMessage: не обрабатывается data.actionTypeId = " + data.actionTypeId);
    }
}

 rlClient.addFlashMessage = function(message) {

    var resultHtml = dotTeplateFunctions.fn_flashMessagesItem({message: message});
    $("#divFlashMessages").prepend(resultHtml);

}

rlClient.onMessage_SetConnectionId = function(connectionId) {
    webSocketConnection.connectionId = connectionId;
    console.log("connectionId set as " + connectionId);
    $("#connectionToRLServerStatus").text("Подкл.").removeClass("bad").addClass("ok");;
}







 rlClient.bindToCamera = function() {

    var camId = $("#ddlCamera").val();
     var vendorId = $("#ddlVendors").val();
    var userId = rlClient.currentEmploee.id; //это будет для проверки того, что определенные пользователи могут коннектиться к определенным камерам (чтобы избежать ошибок)
    //connectionId - клиент webSocket-а, чтобы как-то идентифицировать веб-сокет
     rlWebSocket.send(JSON.stringify({type:"bindToCamera", camId: camId, vendorId: vendorId, userId: userId, connectionId: webSocketConnection.connectionId }));


     //меняем title окна, чтобы его поднимал chromeShowUp (для теста нужно, чтобы 2 окна могли быть одновременно в хроме. вообще же будет только одно - потом удалить)
     document.title = 'FaceRecognitionPilot_Camera';

     rlClient.getVisitorsListByCamera(camId, vendorId);

}

rlClient.getVisitorsListByCamera = function(camId, vendorId,  callback) //callback = вызов chromeShowUp
{
    //получить в список все события за последний день по этой камере (и нажать на первого чел-ка в списке)
    $.ajax({
        url: "/getVisitorsList",
        dataType: 'json',
        data: {camId: camId, vendorId:vendorId},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            var htmlResult = dotTeplateFunctions.fn_clientListItems(data);
            $("#divVisitorsList").html(htmlResult);

            $("#divVisitorsList .item:eq(0)").click(); //нажать на первого в списке


            if(callback) {
                var clientData = new Object();
                var tmpName = data[0].visitorName.split(' ');
                    if (tmpName.length > 0)
                        clientData.lastName = tmpName[0];
                    if (tmpName.length > 1)
                        clientData.firstName = tmpName[1];
                    if (tmpName.length > 2)
                        clientData.middleName = tmpName[2];

                clientData.similarity = data[0].similarity;
                clientData.comments = "В прошлый раз был 01.01.2017"

                callback(clientData);
            }


        },
        error: function (xhr, status, err) {
            console.error("ajax error");
        }
    });
}


rlClient.bindToEmployee = function() {
    //var camId = $("#tbCamId").val();
    var empId = rlClient.currentEmploee.id; //$("#ddlEmployee").val();
    var userId = rlClient.currentEmploee.id; //это будет для проверки того, что определенные пользователи могут коннектиться к определенным камерам (чтобы избежать ошибок)
    //connectionId - клиент webSocket-а, чтобы как-то идентифицировать веб-сокет
    websocket.send(JSON.stringify({type:"bindToEmployee", empId: empId, userId: userId, connectionId: webSocketConnection.connectionId }));

    document.title = 'FaceRecognitionPilot_Employee';

    rlClient.getVisitorsListByEmployee(empId);


}

rlClient.getVisitorsListByEmployee=function(empId, callback){
    //получить в список все события за последний день по этой камере (Есть копипаст)
    $.ajax({
        url: "/getVisitorsListByEmployee",
        dataType: 'json',
        data: {empId: empId},
        type: 'GET',

        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            var htmlResult = dotTeplateFunctions.fn_clientListItems(data);
            $("#divVisitorsList").html(htmlResult);

            $("#divVisitorsList .item:eq(0)").click();

            if(callback)
                callback();



        },
        error: function (xhr, status, err) {
            console.error("ajax error");

            //console.error(this.props.url, status, err.toString());
        }
    });
}



rlClient.getVisitorsListByDepositaryCall=function(callback){
    //получить в список все события за последний день, по которым был вызван менеджер депохитария
    $.ajax({
        url: "/getVisitorsListByDepositaryCall",
        dataType: 'json',
        data: {},
        type: 'GET',

        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            var htmlResult = dotTeplateFunctions.fn_clientListItems(data);
            $("#divVisitorsList").html(htmlResult);

            $("#divVisitorsList .item:eq(0)").click();

            if(callback)
                callback();



        },
        error: function (xhr, status, err) {
            console.error("ajax error");

            //console.error(this.props.url, status, err.toString());
        }
    });
}


rlClient.getRoomList=function(branchId){
    //получить состояние комнат
    $.ajax({
        url: "/getRoomList",
        dataType: 'json',
        data: {branchId: branchId},
        type: 'GET',

        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            var htmlResult = dotTeplateFunctions.fn_RoomItems(data);
            $("#divRoomList").html(htmlResult);
        },
        error: function (xhr, status, err) {
            console.error("ajax error");
        }
    });
}



///////////////////////Всякая кнопочная хрень - вынести отдельно в monitoringPage.js

//срач. Надо бы отдельно заведение в лог и отдельно получение из лога (а то дублируется)

//КОПИПАСТ в employeeNotifier
 rlClient.do_bank_persons_action = function(actionTypeId, jsonData) {
    //Занести в базу сообщение о том, что с неким пользователем было проведено оперделенное действие (вызван Менеджер)
    //Цепляемся именно к LogId
    if(rlClient.currentLogId==null)
    {
        alert("Не выбран посетитель")
        return;
    }

    if(jsonData!=null)
        jsonData = JSON.stringify(jsonData);

    $.ajax({
        url: "/log_bankPersonAction",
        dataType: 'json',
        data: {logId: rlClient.currentLogId, empId: rlClient.currentEmploee.id,  actionTypeId: actionTypeId, jsonData: jsonData},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            rlClient.get_actionLog(rlClient.currentLogId);
            //
            // if(data.length>0) {
            //     var htmlResult = dotTeplateFunctions.fn_actionLog(data);
            //     $("#divActionLog").html(htmlResult).show();
            // }
            // else
            //     $("#divActionLog").hide();

        },
        error: function (xhr, status, err) {
            console.error("ajax error");
        }
    });
}

  rlClient.get_actionLog = function(logId, jsonData) {

    $.ajax({
        url: "/get_ActionLog",
        dataType: 'json',
        data: {logId: logId},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            if(data.length>0) {
                var htmlResult = dotTeplateFunctions.fn_actionLog(data);
                $("#divActionLog").html(htmlResult).show();
            }
            else
                $("#divActionLog").hide();

        },
        error: function (xhr, status, err) {
            console.error("ajax error");
        }
    });
}




rlClient.selectVendor = function(id)
{
    rlClient.currentVendorId = id;
}


rlClient.selectEmployee = function(id)
{
    //список всех сотрудников хранится в employeeList, отрендерившемся на странице
    rlClient.currentEmploee = employeeList[i];
    for(var i=0; i<employeeList.length; i++)
    {
        if(employeeList[i].id==id)
        {
            rlClient.currentEmploee=employeeList[i];
            break;
        }
    }

    $("#ddlCamera, #ddlVendors").hide();

    //сразу же относительно роли формируем панели кнопок
    $(".commandButtons > div, .statButtons").hide(); //скрыли все дивы дочерние

    switch (rlClient.currentEmploee.role_id)
    {



        case enumRoles.reception:
            $("#divRoleName").text("Ресепшн")
            $("#ddlCamera, #ddlVendors").show();

            $("#panel_receptionButtons, .statButtons").show();

            break;
        case enumRoles.cachbox:
            $("#divRoleName").text("Кассир")
            $("#ddlCamera, #ddlVendors").show();


            $("#panel_cashboxButtons, .statButtons").show();
            break;
        case enumRoles.finManager:
            $("#divRoleName").text("Фин. менеджер")
            $("#panel_finManagerButtons").show();
            break;
        case enumRoles.depositaryManager:
            $("#divRoleName").text("Менеджер депозирария")
            $("#panel_depositaryManagerButtons").show();
            break;
        default:
            alert("Не распознана роль сотрудника: " + rlClient.currentEmploee.role_id)
    }
}


//Эмуляция залогиненного пользователя (+ подключение к камере слежения, если необходимо для данной роли)
rlClient.loginAndConnect = function () {

    var role_id = rlClient.currentEmploee.role_id;
    switch (rlClient.currentEmploee.role_id)
    {
        case enumRoles.reception:
        case enumRoles.cachbox:
            rlClient.bindToCamera();
            break;

        case enumRoles.finManager:
        case enumRoles.depositaryManager:
            rlClient.bindToEmployee();
            break;

        default:
            alert("loginAndConnect: не распознана роль")
    }

    //выключаем возможность выбора сотрудника
    $("#ddlCamera, #ddlEmployee, #ddlVendors").attr("disabled","true");
    $("#btnConnectToCamera").attr("disabled","true");

    //включаем панель с кнопками
    $(".buttons").show();

}