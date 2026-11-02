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
        // heading of table
        headersArray: any[],
        //table source
        json: any[],
        //table header keys in order
        jsonKeys : any[],
        //file name
        excelFileName: string,
        // worksheet name
        sheetName: string,
        //chart 
        chart: any,
        //failed by test group
        chartFailedByTG: any = {},
        //
        categoryMap: any = {},
        //
        reasonMap:any,
    ) {
        
        const header = headersArray;
        const data = _.cloneDeep(json);
        /* Create workbook and worksheet */
        const workbook = new Workbook();
        workbook.creator = 'Sysadmin';
        workbook.lastModifiedBy = 'Sysadmin';
        workbook.created = new Date();
        workbook.modified = new Date();

        const worksheet1 = workbook.addWorksheet("Summary Chart");
        /* Add Header Row */
        worksheet1.addRow([]);
        worksheet1.mergeCells('A1:B2');
        worksheet1.getCell('A1').value = reportHeading;
        worksheet1.getCell('A1').fill =  {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0070C0" },
            bgColor: { argb: "FF0070C0" },
        };
        worksheet1.getCell('A1').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
        worksheet1.getCell('A1').alignment = { horizontal: 'center' };
        worksheet1.getColumn(2).width = 80;

        /* Add Summary */
        let details = Object.keys(reportSubHeading);
        let index = 3;
        details.forEach((detail) => {
            worksheet1.addRow([]);
            worksheet1.getColumn(1).width = 50;
            worksheet1.getColumn(2).width = 80;
            worksheet1.getCell(`A${index}`).value = detail ;
            worksheet1.getCell(`A${index}`).fill =  {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "92D050" },
                bgColor: { argb: "92D050" },
            };
            worksheet1.getCell(`B${index}`).fill =  {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "92D050" },
                bgColor: { argb: "92D050" },
            };
            worksheet1.getCell(`B${index++}`).value = reportSubHeading[detail];
          })


        worksheet1.addRow([]);
        var image = workbook.addImage({ 
            base64: chart,
            extension: 'png',
        });
        worksheet1.getColumn(1).width = 80;
        worksheet1.mergeCells('A10:B29');
        worksheet1.addImage(image, `A10:B29`)
        const worksheet = workbook.addWorksheet(sheetName);
          
         /* Add Header Row */
        worksheet.addRow([]);
        if(sheetName == 'Day Regression Jobs Summary') {
            worksheet.mergeCells('A1:H2');
        } else {
            worksheet.mergeCells('A1:F2');
        }
        worksheet.getCell('A1').value = reportHeading
        worksheet.getCell('A1').fill =  {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF0070C0" },
            bgColor: { argb: "FF0070C0" },
            
        };
        worksheet.getCell('A1').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        /* Add Header Row */
        const headerRow = worksheet.addRow(header);
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
        });
        // let monthobj={1:"Jan", 2:"Feb", 3:"Mar", 4:"April", 5:"May", 6:"Jun",7:"Jul", 8:"Aug", 9:"Sep", 10:"Oct", 11:"Nov", 12:"Dec"}
       let  monthobj={1:"January", 2:"February", 3:"March", 4:"April", 5:"May", 6:"June",
        7:"July", 8:"August", 9:"September", 10:"October", 11:"November", 12:"December"}
        // table data filling with json data
        
        json.forEach((element: any,key:any) => {
            if(sheetName == 'Daily Regression Jobs Summary') {
                element.date = element.day+'-'+monthobj[element.month]+'-'+element.year;
            }
            element.totalfirmware = typeof element.firmwareVersion == "undefined" ? 0:element.firmwareVersion.length;
            if(sheetName == 'Day Regression Jobs Summary') {
                element.totalfirmware = typeof element.firmwareVersion == "undefined" ? 'NA':element.firmwareVersion;
            }
            
            const eachRow = [];
            jsonKeys.forEach((column) => {
                eachRow.push(element[column]);
            });
            let cells = worksheet.addRow(eachRow);
            cells.eachCell((cell,index)=>{
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.fill={  type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFCCFFCC" },
                bgColor: { argb: "FFCCFFCC" }}
                if(sheetName == 'Day Regression Jobs Summary') {
                    worksheet.getColumn(index).width = (index == 1)? 65: (index >= 5 ? 20:27);
                } else {
                    worksheet.getColumn(index).width = 27;
                }
            })
            
        });
        
        worksheet.addRow([]);
       if(chartFailedByTG != '') {
            const worksheet3 = workbook.addWorksheet("Failed By Chart");
            worksheet3.addRow([]);
            var image = workbook.addImage({ 
                base64: chartFailedByTG,
                extension: 'png',
            });
            worksheet3.getColumn(1).width = 80;
            worksheet3.mergeCells('A1:B29');
            worksheet3.addImage(image, `A1:B29`);
        }
        if(sheetName != 'Yearly Regression Jobs Summary'){
            const worksheet4 = workbook.addWorksheet("Failed By Summary");
            worksheet4.mergeCells('A1:B2');
            worksheet4.getCell('A1').value = 'Failed By Test Group Summary';
            worksheet4.mergeCells('D1:E2');
            worksheet4.getCell('D1').value = 'Failed By Reason Summary';
            worksheet4.getCell('A1').fill =  {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF0070C0" },
                bgColor: { argb: "FF0070C0" },
                
            };
            worksheet4.getCell('D1').fill =  {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF0070C0" },
                bgColor: { argb: "FF0070C0" },
                
            };
            worksheet4.getCell('A1').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
            worksheet4.getCell('A1').alignment = { horizontal: 'center' };
            worksheet4.getCell('D1').font =  { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
            worksheet4.getCell('D1').alignment = { horizontal: 'center' };
            worksheet4.getColumn(3).width = 30;
            if(categoryMap.size !== 0 ) {
                for (var [key, value] of categoryMap.entries()) {
                    const eachRow = [];
                    eachRow.push(key);
                    eachRow.push(value);
                    let cells = worksheet4.addRow(eachRow);
                    cells.eachCell((cell,index)=>{
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        cell.fill={  type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFCCFFCC" },
                        bgColor: { argb: "FFCCFFCC" }}
                        worksheet4.getColumn(index).width = 30;
                    })
                }
            } else {
                worksheet4.getCell('A3').value = 'No Data Available';
                worksheet4.mergeCells('A3:B3');
                worksheet4.getCell('A3').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                worksheet4.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                worksheet4.getCell('A3').fill = {  type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                    bgColor: { argb: "FFCCFFCC" }};
            }
            worksheet4.getColumn(5).width = 30;
            if(reasonMap.size !== 0){
                let row = 3;
                for (var [key, value] of reasonMap.entries()) {
                    worksheet4.getCell('D'+row).value = key;
                    worksheet4.getCell('D'+row).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    worksheet4.getCell('D'+row).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    worksheet4.getCell('D'+row).fill={  type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFCCFFCC" },
                        bgColor: { argb: "FFCCFFCC" }}
                    worksheet4.getColumn(4).width = 30;
                    worksheet4.getCell('E'+row).value = value;
                    worksheet4.getCell('E'+row).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    worksheet4.getCell('E'+row).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    worksheet4.getCell('E'+row).fill={  type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFCCFFCC" },
                        bgColor: { argb: "FFCCFFCC" }}
                    row++;
                }
            } else{
                worksheet4.getCell('D3').value = 'No Data Available';
                worksheet4.mergeCells('D3:E3');
                worksheet4.getCell('D3').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                worksheet4.getCell('D3').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                worksheet4.getCell('D3').fill = {  type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFCCFFCC" },
                    bgColor: { argb: "FFCCFFCC" }};
            }
        }
       
        /*Save Excel File*/
        workbook.xlsx.writeBuffer().then((data: ArrayBuffer) => {
            const blob = new Blob([data], { type: EXCEL_TYPE });
            fs.saveAs(blob, excelFileName + EXCEL_EXTENSION);
        });
    }
   
}