/**
 * Created by U_M0UW8 on 15.11.2016.
 */

const dateFormat = require('date-format');
const fs = require('fs');

const utils = new Object();

utils.getFormattedDate = function(date)
{
    return dateFormat("dd.MM.yyyy hh:mm:ss", date);
}

utils.getHashCode = function(val) {
    var hash = 0, i, chr, len;
    if (val.length === 0) return hash;
    for (i = 0, len = val.length; i < len; i++) {
        chr   = val.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    if(hash<0)
        hash*=-1;
    
    return hash.toString();
};

utils.getXmlNodeText = function(xmlString, nodeName)
{
    //var successMatch  = xmlString.match(new RegExp('<pinEQ>(.+?)</pinEQ>'));
    var successMatch  = xmlString.match(new RegExp('<'+nodeName+'>(.+?)</'+nodeName+'>'));
    if(successMatch!=null) {

        if (successMatch.length==2 && successMatch[1] != null) {
            return successMatch[1].trim();
        }

        return null;
    }
}

// Функция "someString{0}".format("123")
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}


utils.base64_decode = function(base64str, filePath) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(filePath, bitmap);
    console.log('******** File created from base64 encoded string ********');
}


module.exports = utils;
