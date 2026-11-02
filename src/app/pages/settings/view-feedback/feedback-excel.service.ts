import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as _ from 'lodash';



const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
  providedIn: 'root'
})
export class FeedbackExcelService {

  constructor() { }

  public exportAsExcelFile(
    reportHeading: string,
    reportSubHeading: any,
    headersArray: any[],
    json: any[],
    regData: any,
    excelFileName: string,
    sheetName: string,
    type:string
) {
    const header = headersArray;
    const data = json;
    
    /* Create workbook and worksheet */
    const workbook = new Workbook();
    workbook.creator = 'Sysadmin';
    workbook.lastModifiedBy = 'Sysadmin';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(sheetName);

    /* Add Header Row */
    worksheet.addRow([]);
    worksheet.mergeCells('A1:' + this.numToAlpha(header.length - 1) + '1');
    worksheet.getCell('A1').value = reportHeading
    worksheet.getCell('A1').fill =  {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0070C0" },
        bgColor: { argb: "FF0070C0" },
        
    };
    worksheet.getCell('A1').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    if (reportSubHeading !== '') {
        worksheet.addRow([]);
        worksheet.mergeCells('A2:' + this.numToAlpha(header.length - 1) + '2');
        worksheet.getCell('A2').value = reportSubHeading
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.getCell('A2').font = { size: 12, bold: true };
    }

    /* Add Header Row */
    const headerRow = worksheet.addRow(header);

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
        worksheet.getColumn(index).width =35;
    });

    // Add Data and Conditional Formatting
    console.log(data,header,"2132131")
    let column=["pageName","priority","feedbackDescription","userCreated","status"]
    data.forEach((element: any) => {

        const eachRow = [];
        column.forEach((column) => {
            eachRow.push(element[column]);
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
