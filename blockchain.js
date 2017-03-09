/**
 * Created by U_M0UW8 on 08.03.2017.
 */

var request = require('request');
var config = require('config');

const BLOCKCHAIN_NODE_URL = config.get("BLOCKCHAIN_NODE_URL");
const BLOCKCHAIN_SECURE_CONTEXT = config.get("BLOCKCHAIN_SECURE_CONTEXT");
const BLOCKCHAIN_CHAINCODE_ID = config.get("BLOCKCHAIN_CHAINCODE_ID");

const blockchain = new Object();


blockchain.read = function(key, callback){

    var cc_functionName = "read";
    bc_request  =
    {
        "jsonrpc": "2.0",
        "method": "query",
        "params": {
            "type": 1,
            "chaincodeID": {
                "name": BLOCKCHAIN_CHAINCODE_ID
            },
            "ctorMsg": {
                "function": cc_functionName,
                "args": [
                    key
                ]
            },
            "secureContext": BLOCKCHAIN_SECURE_CONTEXT
        },
        "id": 0
    }

    //Запрос к блокчейну
    request({
        url: BLOCKCHAIN_NODE_URL,
        // proxy: "http://127.0.0.1:8888",
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(bc_request)

    }, function (error, response, body) {
        if(error)
            console.error("blockChain read - error" + JSON.stringify(error));


        callback(body==null ? null : JSON.parse(body).result.message);

    } );

}



blockchain.write = function(key, value, callback){

    var cc_functionName = "write";
    var cc_value = JSON.stringify(value);

    bc_request  =
    {
        "jsonrpc": "2.0",
        "method": "invoke",
        "params": {
            "type": 1,
            "chaincodeID": {
                "name": BLOCKCHAIN_CHAINCODE_ID
            },
            "ctorMsg": {
                "function": cc_functionName,
                "args": [
                    key, cc_value
                ]
            },
            "secureContext": BLOCKCHAIN_SECURE_CONTEXT
        },
        "id": 0
    }

    //Запрос к блокчейну
    request({
        url: BLOCKCHAIN_NODE_URL,
        // proxy: "http://127.0.0.1:8888",
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(bc_request)

    }, function (error, response, body) {
        if(error)
            console.error("blockChain write - error" + JSON.stringify(error));

        //если message=null- то что-то не так. Обычно должен вернуться номер транзакции
        callback(body==null ? null : JSON.parse(body).result.message!=null);

    } );

}

module.exports = blockchain;