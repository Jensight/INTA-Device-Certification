import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as _ from 'lodash';

const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Injectable({
    providedIn: 'root'
})
export class ExcelServiceMonthly {

    constructor() { }

    public exportAsExcelFile(
        // table heading
        reportHeading: string,
        // model
        reportSubHeading: any,
        // heading of table
        headersArray: any[],
        //table source
        json: any[],
        //file name
        excelFileName: string,
        // worksheet name
        sheetName: string,
        //chart 
        chart: any,
 
    ) {
        const header = headersArray;
        const data = _.cloneDeep(json)
    
 
  
         
        
        

        
        /* Create workbook and worksheet */
        const workbook = new Workbook();
        workbook.creator = 'Sysadmin';
        workbook.lastModifiedBy = 'Sysadmin';
        workbook.created = new Date();
        workbook.modified = new Date();
        const worksheet = workbook.addWorksheet(sheetName);
        const idCol = worksheet.getColumn(1);
        console.log(idCol,"idcol")
        // const worksheet1 = workbook.addWorksheet("Chart");
       worksheet.addRow([]);
       var image = workbook.addImage({ 
        base64: chart,
        extension: 'png',
     });
    //  worksheet1.addImage(image, {
    //     tl: { col: 0, row: 0 },
    //     ext: { width: 1000, height: 500 }
    //   });
      worksheet.mergeCells('A1:G29');
      worksheet.addImage(image, `A1:G29`)
      
         /* Add Header Row */
        worksheet.addRow([]);
        worksheet.mergeCells('A30:' + this.numToAlpha(header.length - 1) + '30');
        worksheet.getCell('A30').value = reportHeading
        worksheet.getCell('A30').fill =  {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0070C0" },
            bgColor: { argb: "FF0070C0" },
            
        };
        worksheet.getCell('A30').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
        worksheet.getCell('A30').alignment = { horizontal: 'center' };

        if (reportSubHeading !== '') {
            worksheet.addRow([]);
            worksheet.mergeCells('A31:' + this.numToAlpha(header.length - 1) + '31');
             worksheet.getCell('A31').value ="Selected Date Range:("+reportSubHeading.date+")   Selected Model:("+reportSubHeading.model+") and Selected firmware:("+reportSubHeading.firmware+")";
            worksheet.getCell('A31').alignment = { horizontal: 'center' };
            worksheet.getCell('A31').font = { size: 12, bold: true };
        }

        /* Add Header Row */
        const headerRow = worksheet.addRow(header);

        // Cell Style : Fill and Border
        worksheet.getColumn(2).width = 45
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
            if( index !=2){
                worksheet.getColumn(index).width = 27;
            }
            
           
        });
       

        // Get all columns from JSON
         let arr=['totalJobCount','job_id',"model","firmwareVersion","passTC","failTC","regStartedAt"]
        // Add Data and Conditional Formatting
        data.forEach((element: any) => {
      
           element.regStartedAt = new Date(element.regStartedAt).toDateString()
   
            const eachRow = [];
            arr.forEach((column) => {
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