/**
 * Created by U_M0UW8 on 30.01.2017.
 */

var adminBankPersonsJs = new Object();
adminBankPersonsJs.selectedClientId = 0; //текущий выбранный клиент


var dotTeplateFunctions = new Object();



adminBankPersonsJs.init = function()
{


    //настройка doT-шаблонов
    dotTeplateFunctions.fn_BankPersonsList = doT.template($("#dot_BankPersonsList").text());


    //вешаем события
    // $(".itemList").on("click", " .item", function () {
    //     //displayVisitorCard($(this));
    //
    // })

    //Загрузка фотки (тут привязка к форме. Как отдельно закинуть файл - разберемся потом)
    // $('#uploadForm').submit(function() {
    //     $("#status").empty().text("File is uploading...");
    //
    //     $(this).ajaxSubmit({
    //
    //         error: function(xhr) {
    //             $("#status").text('Error: ' + xhr.status);
    //         },
    //
    //         success: function(response) {
    //             console.log(response)
    //             $("#status").empty().text(response);
    //         }
    //     });
    //
    //     return false;
    // });


}



adminBankPersonsJs.search = function(clientName) {


    //получить в список все события за последний день по этой камере
    $.ajax({
        url: "/getBankPersonsList",
        dataType: 'json',
        data: {clientName: clientName},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            var htmlResult = dotTeplateFunctions.fn_BankPersonsList(data);
            $("#results").html(htmlResult);



        },
        error: function (xhr, status, err) {
            console.error("ajax error");

            //console.error(this.props.url, status, err.toString());
        }
    });

}

//форма добавления-изменения данных клиента
adminBankPersonsJs.showEditForm = function(clientId) {

    adminBankPersonsJs.selectedClientId = clientId;

    $("#uplPhoto").val("");
    //для нового пользователя - чистая форма
    if(clientId==0)
    {


        $("#divClientForm input").val("");
        $("#divClientForm #ddlFinConsultant").val("0");

        $("#divClientForm").show();
        return;
    }

    // изменить данные пользователя
    $.ajax({
        url: "/getBankPersonInfo",
        dataType: 'json',
        data: {clientId: clientId},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            //заполняем форму

            $("#divClientForm #tbName").val(data.bankPersonName);
            $("#divClientForm #tbCus").val(data.cus);
            $("#divClientForm #ddlFinConsultant").val(data.finConsultant_id);
            $("#divClientForm").show();



        },
        error: function (xhr, status, err) {
            console.error("ajax error");

            //console.error(this.props.url, status, err.toString());
        }
    });

}

adminBankPersonsJs.savePerson = function(clientName, clientCus, finConsultantId)
{

    var userPhotoSelected = $("#uplPhoto").val().length>0;
    if(adminBankPersonsJs.selectedClientId == 0 && !userPhotoSelected)
    {
        alert("Для нового клиента необходимо указать фотографию")
        return;
    }

    //в принципе можно попробовать за 1 раз загрузить все (если в форме эти контролы разместить)
    if(userPhotoSelected) {

        $("#status").empty().text("File is uploading...");
        $("#uploadForm").ajaxSubmit({

            error: function (xhr) {
                $("#status").text('Error: ' + xhr.status);
            },

            success: function (response) {
                console.log(response)
                $("#status").empty().text(response);

                adminBankPersonsJs.savePerson_internal(clientName, clientCus, finConsultantId, userPhotoSelected)


            }
        });
    }
    else
    {
        //просто update данных клиента
        adminBankPersonsJs.savePerson_internal(clientName, clientCus, finConsultantId, userPhotoSelected)
    }


}
adminBankPersonsJs.savePerson_internal = function(clientName, clientCus, finConsultantId, userPhotoSelected)
{
    //после загрузки картинки идем сохранять пользователя
    $.ajax({
        url: "/savePerson",
        dataType: 'json',
        data: {clientId: adminBankPersonsJs.selectedClientId, clientName: clientName, clientCus:clientCus,
            finConsultantId:finConsultantId, userPhotoSelected: userPhotoSelected},
        type: 'GET',
        success: function (data, textStatus, jqXHR) {
            console.log("ajax success");

            $("#divClientForm").hide();
            adminBankPersonsJs.search($('#tbBankPersonName').val());

            alert(adminBankPersonsJs.selectedClientId == 0 ? 'Клиент успешно добавлен' : 'Клиент успешно обновлен');



        },
        error: function (xhr, status, err) {
            console.error("ajax error");

            //console.error(this.props.url, status, err.toString());
        }
    });
}

