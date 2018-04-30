import fs = require('fs');
import * as Papa from "papaparse";
import { ListingInfo } from './classes_interfaces';

// add an auto create csv if file does not exists

// This const will be used when the csv is open and it's possible to overwrite it.
const DEFAULT_ERROR_PATH = './csv/backup.csv';

export function csvToJson(path: string){
        var file = fs.readFileSync(path,"utf8");
        var jsonResult = Papa.parse(file,{
            delimiter: "",	// auto-detect
            newline: "",	// auto-detect
            quoteChar: '"',
            header: true,
            dynamicTyping: true, // Recognizes the type
            preview: 0,
            encoding: "",
            worker: false,
            comments: false,
            step: undefined,
            complete: undefined,
            error: undefined,
            download: false,
            skipEmptyLines: true,
            chunk: undefined,
            fastMode: undefined,
            beforeFirstChunk: undefined,
            withCredentials: undefined
        });
        fs.close;
        return jsonResult.data;
}

// Returns an array containing the content of the file in json format. First row in the file is considered as headers.
export function csvToJsonManual(path: string){
    // Create a new file if it does not exits
    if(!fs.existsSync(path)){
        var newFile = fs.createWriteStream(path,"w");
        // add headers
        newFile.close();
    }
        var str = fs.readFileSync(path, 'utf8');
        // str will look like that: ["fname, lname, uid, phone, address","John, Doe, 1, 444-555-6666, 34 dead rd",...]
        var csarr = [] = str.split('\n');
        var jsonObj = [];
        var headers = csarr[0].split(',');
        for(var i = 1; i < csarr.length; i++) {
            var data = csarr[i].split(',');
            var obj = {};
            for(var j = 0; j < data.length; j++) {
                obj[headers[j].trim()] = data[j].trim();
        }
            jsonObj.push(obj);
    }
        JSON.stringify(jsonObj);
        // return jsonObj as Array<ProductInfo>; // Check if this works
        return jsonObj;
}

// Exporting an array in json format to a csv file in specified path
export function exportArrToCSV(jsonArr, path: string){
    var parsed = Papa.unparse(jsonArr);
    fs.writeFile(path, parsed, (err)=>{
    if (err) {
        if (err.code === 'EBUSY'){
            exportArrToCSV(jsonArr, DEFAULT_ERROR_PATH);
            console.log('because the file is currently open, a backup file was saved to: ', DEFAULT_ERROR_PATH);
            return; // exiting from the function
        }
        throw err;
    }
    // this condition is used to make sure the message won't be printed when an EBUSY occurs
    if(path != DEFAULT_ERROR_PATH)
        console.log("File Successfully Exported to: ", path);
    });
}