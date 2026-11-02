import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as _ from 'lodash';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {

    constructor() { }

    public exportAsExcelFile(
        reportHeading: string,
        reportSubHeading: any,
        headersArray: any[],
        json: any[],
        regData: any,
        excelFileName: string,
        sheetName: string,
        type:string,
        typePer
    ) {
        const header = headersArray;
        const data = json;
        let conarr2=_.cloneDeep(headersArray)
        conarr2.shift()
        conarr2.shift()
        let arr1=['Regression Name'].concat(conarr2)
        
        /* Create workbook and worksheet */
        const workbook = new Workbook();
        workbook.creator = 'Sysadmin';
        workbook.lastModifiedBy = 'Sysadmin';
        workbook.created = new Date();
        workbook.modified = new Date();
        //const worksheetReg=workbook.addWorksheet("Regression Details");
        const worksheet = workbook.addWorksheet(sheetName);

       
        // Get all columns from JSON
        let columnsArray1: any[];
        let conarr1=_.cloneDeep(headersArray)
        conarr1.shift()
        conarr1.shift()
        let regArr=['RegressionName']
        columnsArray1=regArr.concat(conarr1)
        // Add Data and Conditional Formatting
        /*regData.forEach((element: any) => {

            const eachRow = [];
            columnsArray1.forEach((column) => {
                eachRow.push(element[column]);
            });

            if (element.isDeleted === 'Y') {
                const deletedRow = worksheetReg.addRow(eachRow);
                deletedRow.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.font = { name: 'Calibri', family: 4, size: 11, bold: false, strike: true };
                    cell.fill={  type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                    bgColor: { argb: "FFCCFFCC" }}
                });
            } else {
                let cells=worksheetReg.addRow(eachRow);
                cells.eachCell((cell,index)=>{
                    if(index!=1){
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.fill={  type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                    bgColor: { argb: "FFCCFFCC" }}
                    }else{
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.fill={
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFFF00' },
                        bgColor: { argb: 'FF0000FF' }
                    };
                    cell.font={size:12,bold:true}
                    }
                })
            }
        });*/

        // worksheet.addRow([]);

        /* Add Header Row */
        worksheet.addRow([]);
        worksheet.mergeCells('A1:' + this.numToAlpha(header.length - 1) + '1');
        worksheet.getCell('A1').value = reportHeading+"'s Usecases"
        worksheet.getCell('A1').fill =  {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0070C0" },
            bgColor: { argb: "FF0070C0" },
            
        };
        worksheet.getCell('A1').font = { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        if (reportSubHeading !== '') {
            worksheet.addRow([]);
            worksheet.mergeCells('A2:' + this.numToAlpha(header.length - 1) + '2');
            worksheet.getCell('A2').value =type=="twoReg"?"Selected Regressions ("+reportSubHeading+")":"Selected Model ("+reportSubHeading+")";
            worksheet.getCell('A2').alignment = { horizontal: 'center' };
            worksheet.getCell('A2').font = { size: 12, bold: true };
        }

        /* Add Header Row */
        var header1 = [] = header;
        //console.log('header 120 => ', header);
        for (let k = 0; k < typePer.length; k++) {
            header1[k+2] = header[k+2]+' (' + typePer[k].pers +')';        
        }
        /*header1[2] = header[2]+' (' + typePer[0].pers +')';
        header1[3] = header[3]+' (' + typePer[1].pers +')';
        header1[4] = header[4]+' (' + typePer[2].pers +')';*/
        //console.log('header1 127 => ', header1);

        const headerRow = worksheet.addRow(header1);

        // Cell Style : Fill and Border
        headerRow.eachCell((cell, index) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' },
                bgColor: { argb: 'FF0000FF' }
            };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.font = { size: 12, bold: true,};
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getColumn(index).width =type=="twoReg"?51.8: 29.5;
        });

        // Get all columns from JSON
        let columnsArray: any[];
        let conarr=_.cloneDeep(headersArray)
        conarr.shift()
        conarr.shift()
        let arr=['tcId','tcName'] //, 'Production Build', 'Test Build on Production', 'Test Build on Pre-Production'
        typePer.forEach(ele => {
            arr.push(ele.type)
        });
        //console.log('arr 154 => ', arr);
        //arr.concat(conarr)
        //console.log( arr.concat(conarr),"arr")
        columnsArray=arr//.concat(conarr)
    
        // Add Data and Conditional Formatting
        data.forEach((element: any) => {
            const eachRow = [];
            columnsArray.forEach((column) => {
                var flag = false;
                var count = 0;
                typePer.forEach(ele => {
                    count++;
                    if(column == ele.type) {
                        flag = true;
                        if(element[column] == 'Not Executed'){
                            eachRow.push(element[column]);
                        } else {
                            eachRow.push(element[column] + ' | ' + element[column + '_last_Execution']);
                        }
                        //console.log('count => ', count);
                    }
                    if(count == typePer.length && flag == false){
                        eachRow.push(element[column]);
                    }
                });
                /*if(column == 'Production Build' || column == 'Test Build on Production' || column == 'Test Build on Pre-Production'){
                    if(element[column] == 'Not Executed'){
                        eachRow.push(element[column]);
                    } else {
                        eachRow.push(element[column] + ' | ' + element[column + '_last_Execution']);
                    }
                } else {
                    eachRow.push(element[column]);
                }*/
            });

            if (element.isDeleted === 'Y') {
                const deletedRow = worksheet.addRow(eachRow);
                deletedRow.eachCell((cell) => {
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.font = { name: 'Calibri', family: 4, size: 11, bold: false, strike: true };
                    cell.fill={  type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                    bgColor: { argb: "FFCCFFCC" }}
                });
            } else {
                let cells=worksheet.addRow(eachRow);
                cells.eachCell((cell)=>{
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    cell.fill={  type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                    bgColor: { argb: "FFCCFFCC" }}
                })
            }
        });

        worksheet.addRow([]);

        /*Save Excel File*/
        workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
            const blob = new Blob([data], { type: EXCEL_TYPE });
            fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
        });
    }

    private numToAlpha(num: number) {

        let alpha = '';

        for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
            alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
        }

        return alpha;
    }
}