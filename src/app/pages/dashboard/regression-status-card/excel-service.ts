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
        // table heading
        reportHeading: string,
        // model
        reportSubHeading: any,
        //file name
        excelFileName: string,
        // worksheet name
        sheetName: string,
        //chart 
        chart: any,
 
    ) {
        /* Create workbook and worksheet */
        const workbook = new Workbook();
        workbook.creator = 'Sysadmin';
        workbook.lastModifiedBy = 'Sysadmin';
        workbook.created = new Date();
        workbook.modified = new Date();
        const worksheet = workbook.addWorksheet(sheetName);
         /* Add Header Row */
        worksheet.addRow([]);
        worksheet.mergeCells('A1:B2');
        worksheet.getCell('A1').value = reportHeading;
        worksheet.getCell('A1').fill =  {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0070C0" },
            bgColor: { argb: "FF0070C0" },
        };
        worksheet.getCell('A1').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };
        worksheet.getColumn(2).width = 80
        
        //Display chart image
        worksheet.addRow([]);
        var image = workbook.addImage({ 
            base64: chart,
            extension: 'png',
        });
        worksheet.mergeCells('A10:B40');
        worksheet.addImage(image, `A10:B40`);

        /* Add Summary */
        let details = Object.keys(reportSubHeading);
        let index = 3;
        details.forEach((detail) => {
            worksheet.addRow([]);
            worksheet.getColumn(1).width = 50;
            worksheet.getColumn(2).width = 80;
            worksheet.getCell(`A${index}`).value = detail ;
            worksheet.getCell(`A${index}`).fill =  {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "92D050" },
                bgColor: { argb: "92D050" },
            };
            worksheet.getCell(`B${index}`).fill =  {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "92D050" },
                bgColor: { argb: "92D050" },
            };
            worksheet.getCell(`B${index++}`).value = reportSubHeading[detail];
          })
        
        /*Save Excel File*/
        workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
            const blob = new Blob([data], { type: EXCEL_TYPE });
            fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
        });
    }
}