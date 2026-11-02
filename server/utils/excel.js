let logger =require('./logger')
const Excel = require("exceljs");
const errLogger = require('./errorLogger');

const border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
};

// Info Styles, Alignment and Fonts
const infoStyle = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0070C0" },
    bgColor: { argb: "FF0070C0" }
};
const infoAlignment = { vertical: "middle", horizontal: "center" ,wrapText:true};
const infoFonts = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };

const tableHeadingStyle = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFCCFF99" },
    bgColor: { argb: "FFCCFF99" }
};

const tableFont = { bold: false, color: { argb: "FF000000" }, size: 12 };
const wrapTextAlign = { wrapText: true };

const tableBodyStyle = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFCCFFCC" },
    bgColor: { argb: "FFCCFFCC" }
};

// Testsuite Font,style
const testSuiteStyle = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF89B0FF" },
    bgColor: { argb: "FF89B0FF" }
};

module.exports.createExcelReportForJob = async (job, groupByTs, path, rerunCount, jiraId) => {
    var jobId = job.job_id;
    var testBed =JSON.parse(job.testbedData)
    let devHeader=[]
    // testBed.devices.forEach((dev)=>{
    //     devHeader.push(dev.deviceName)
    // })
    for(let i=0; i<testBed.devices.length; i++) {
        devHeader.push(testBed.devices[i].deviceName)

    }
    var startTime = job.jobStartTime
        .slice(0, 19)
        .split("T")
        .join(" ");
    var endTime = job.jobEndTime
        .slice(0, 19)
        .split("T")
        .join(" ");
    var duration = await findDuration(new Date(job.jobEndTime) - new Date(job.jobStartTime));
    var totalTC = job.totalTC;
    var passTC = job.passTC;
    var failTC = job.failTC;
    var warnTC = job.warnTC;
    var excludedTC = job.excludedTC
    var norunTC = job.norunTC;
    var rerun =rerunCount;
    var firmwareVersion=job.firmwareVersion;
    var noOfIteration = job.numOfIteration;    
    var environmentType = job.environment_type;
    var jiraID = jiraId;
    
    var testSuites = Object.keys(groupByTs);
    var workbook = await addJobHeader();
    const worksheetTestbedData=workbook.addWorksheet("Testbed Details");

    worksheetTestbedData.addRow([]);
    worksheetTestbedData.mergeCells('A1:'+numToAlpha(devHeader.length*3)+'1');
    worksheetTestbedData.getCell('A1').value = "Testbed Details"
    worksheetTestbedData.getCell('A1').fill =infoStyle;
    worksheetTestbedData.getCell('A1').font ={ bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    worksheetTestbedData.getCell('A1').alignment = infoAlignment;
    worksheetTestbedData.mergeCells('A2:'+numToAlpha(devHeader.length*3)+'2');
    worksheetTestbedData.getCell('A2').value ="Selected Testbed("+job.testbed.testBedName+")"
    worksheetTestbedData.getCell('A2').alignment = infoAlignment;
    worksheetTestbedData.getCell('A2').font = { size: 14, bold: true };

    let count=0
    //devHeader.forEach((head,index)=>{
        for(let index=0; index<devHeader.length; index++) {  

        let len=4
        worksheetTestbedData.mergeCells(numToAlpha(index+count)+"3:"+numToAlpha(index+count+1)+"3");
        worksheetTestbedData.getCell(numToAlpha(index+count)+"3").value = devHeader[index]
        worksheetTestbedData.getCell(numToAlpha(index+count)+"3").fill =infoStyle;
        worksheetTestbedData.getCell(numToAlpha(index+count)+"3").font =  infoFonts;
        worksheetTestbedData.getCell(numToAlpha(index+count)+"3").alignment = infoAlignment;
        worksheetTestbedData.getColumn(index+1).width=30
   
        let header=Object.keys(testBed.devices[index])
        let value1=Object.values(testBed.devices[index])
        //header.forEach((hea,index1)=>{
            for(let i=0; i<header.length; i++) {  

            worksheetTestbedData.getCell(numToAlpha(index+count)+len).value = header[i]
            worksheetTestbedData.getCell(numToAlpha(index+count)+len).fill ={
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' },
                bgColor: { argb: 'FF0000FF' }
            };
            worksheetTestbedData.getCell(numToAlpha(index+count)+len).font ={size:12,bold:true}
            worksheetTestbedData.getCell(numToAlpha(index+count)+len).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheetTestbedData.getCell(numToAlpha(index+count)+len).border={ top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            worksheetTestbedData.getCell(numToAlpha(index+count+1)+len).value = header[i]!="shareDevice"?(value1[i]==null?"NULL":value1[i]):(value1[i]==false||value1[i]==null?"NO":"YES")
            worksheetTestbedData.getCell(numToAlpha(index+count+1)+len).fill =tableBodyStyle
            worksheetTestbedData.getCell(numToAlpha(index+count+1)+len).font ={size:12}
            worksheetTestbedData.getCell(numToAlpha(index+count+1)+len).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheetTestbedData.getCell(numToAlpha(index+count+1)+len).border={ top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            len++
        }
        
        count+=2
     }

     let index=1
     while (index<=devHeader.length*3) {
        if(index%3!=0){
            worksheetTestbedData.getColumn(index).width=30
        }
        else{
            worksheetTestbedData.getColumn(index).width=8
        }
        index++
     }

   
    // worksheetTestbedData.addRow([]);
    // worksheetTestbedData.mergeCells('A1:W1');
    // worksheetTestbedData.getCell('A1').value = "Testbed Details"
    // worksheetTestbedData.getCell('A1').fill =infoStyle;
    // worksheetTestbedData.getCell('A1').font ={ bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    // worksheetTestbedData.getCell('A1').alignment = infoAlignment;
    //  worksheetTestbedData.mergeCells('A2:W2');
    //  worksheetTestbedData.getCell('A2').value ="Selected Testbed("+job.testbed.testBedName+")"
    //  worksheetTestbedData.getCell('A2').alignment = infoAlignment;
    //  worksheetTestbedData.getCell('A2').font = { size: 14, bold: true };


    // let len=4
    //  testBed.devices.forEach((dev,index)=>{
    //     // if(index==0){
    //     worksheetTestbedData.mergeCells('A'+len+':B'+len);
    //     worksheetTestbedData.getCell('A'+len).value = dev.deviceName
    //     worksheetTestbedData.getCell('A'+len).fill =infoStyle;
    //     worksheetTestbedData.getCell('A'+len).font =  infoFonts;
    //     worksheetTestbedData.getCell('A'+len).alignment = infoAlignment;
    //     // }
    //     let row=[]
    //     let devHead=Object.keys(dev)
    //     let value= Object.values(dev)
    //     console.log(len,"123213")
    //     len=Object.keys(dev).length+len+3
    //     devHead.forEach((key,index)=>{
    //      row=[]
    //      row.push(key)   
    //      if(key=="shareDevice"){
    //         row.push(value[index]==null||value[index]==false?"NO":"YES")
    //      }
    //      else{
    //         row.push(value[index])
    //      }
       
       
    //     let cells=worksheetTestbedData.addRow(row);
    //          cells.eachCell((cell,index)=>{
    //              if(index!=1){
    //              cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    //              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    //             //  cell.fill={  type: "pattern",
    //             //  pattern: "solid",
    //             //  fgColor: { argb: "FFCCFFCC" },
    //             //  bgColor: { argb: "FFCCFFCC" }}
    //              }else{
    //                  cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    //              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    //             //  cell.fill={
    //             //      type: 'pattern',
    //             //      pattern: 'solid',
    //             //      fgColor: { argb: 'FFFFFF00' },
    //             //      bgColor: { argb: 'FF0000FF' }
    //             //  };
    //              cell.font={size:12,bold:true}
    //              }
    //              worksheetTestbedData.getColumn(index).width=30
    //          })
    //     })
       
    //     worksheetTestbedData.addRow([]);
    //  })
   


    var worksheet = await addJobData(workbook, [jobId, startTime, endTime, duration, totalTC, passTC, failTC, norunTC, excludedTC, warnTC, rerun,firmwareVersion, noOfIteration, environmentType, jiraID]);
    await addTableHeader(worksheet);
    for (let index = 0; index < testSuites.length; index++) {
        const element = testSuites[index];
        await addDataForATestsuite(worksheet, element, groupByTs[element]);
    }
    try {
        await workbook.xlsx.writeFile(`${path}/${job.job_id}.xlsx`)
    } catch (error) {
        errLogger.error('Failed Creating Excel Report %s',jobId);
        throw new Error('Failed Creating Excel Report')
    }
};

async function addJobHeader() {
    var workbook = new Excel.Workbook();
    var worksheet = workbook.addWorksheet("vAUTO TESTCASE STATUS", {
        pageSetup: { paperSize: 1, orientation: "landscape" }
    });
    worksheet.addRow();
    worksheet.mergeCells("A1:M1");
    worksheet.getCell("A1").value = "JOB SUMMARY";
    worksheet.getCell("A1").alignment = infoAlignment;
    worksheet.getCell("A1").fill = infoStyle;
    worksheet.getCell("A1").font = infoFonts;

    var jobDetailRow = worksheet.addRow([
        "Job Name",
        "Start Time",
        "Stop Time",
        "Time Duration",
        "Total TC",
        "Passed Count",
        "Failed Count",
        "No Run Count",
        "Excluded Count",
        "Warning Count",
        "Re-Run Count",
        "Firmware Version",
        "Iterations",
        "Environment Type",
        "Jira Id"
    ]);
    jobDetailRow.eachCell(cell => {
        cell.fill = tableHeadingStyle;
        cell.font = { ...tableFont, bold: true };
        cell.border = border;
        cell.alignment =infoAlignment
    });

    worksheet.columns = [
        { key: "jobName", width: 50 },
        { key: "startTime", width: 21 },
        { key: "stopTime", width: 20 },
        { key: "duration", width: 23 },
        { key: "totalTC", width: 20 },
        { key: "passTC", width: 10 },
        { key: "failTC", width:  21},
        { key: "excludedTC", width: 21},
        { key: "warnTC", width: 21},
        { key: "noRunTC", width: 11},
        { key: "rerunTc", width: 10},
        { key:"firmwareVersion", width:20},
        { Key: "noOfIteration", width:10},
        { key: "environmentType", width:20},
        { key: "jiraID",  width:20}
    ];
    return workbook;
}

async function addJobData(workbook, data = []) {
    var worksheet = workbook.getWorksheet(1);
    var jobData = worksheet.addRow(data);
    jobData.eachCell(cell => {
        cell.fill = tableBodyStyle;
        cell.font = tableFont;
        cell.border = border;
        cell.alignment = { ...infoAlignment, ...wrapTextAlign };
    });
    worksheet.addRow();
    worksheet.addRow();
    worksheet.mergeCells("A6:G6");
    worksheet.getCell("A6").value = "TEST CASE DETAILS";
    worksheet.getCell("A6").alignment = { ...infoAlignment, ...wrapTextAlign };
    worksheet.getCell("A6").font = infoFonts;
    worksheet.getCell("A6").fill = infoStyle;
    return worksheet;
}

async function addTableHeader(worksheet) {
    var row = worksheet.addRow(["TS ID", "Test Case Name", "Status", "Start Time", "Stop Time", "Time Duration", "Failed Reason"]);
    row.eachCell(cell => {
        cell.font = { ...tableFont, bold: true };
        cell.border = border;
        cell.fill = tableHeadingStyle;
        cell.alignment = infoAlignment
    });

    worksheet.columns = [
        { key: "jobName", width: 50 },
        { key: "startTime", width: 21 },
        { key: "stopTime", width: 20 },
        { key: "duration", width: 23 },
        { key: "totalTC", width: 20 },
        { key: "passTC", width: 10 },
        { key: "failTC", width:  21},
        { key: "excludedTC", width: 21},
        { key: "warnTC", width: 21},
        { key: "noRunTC", width: 11},
        { key: "rerunTc", width: 10},
        { key: "firmwareVersion", width:20},
        { Key: "noOfIteration", width:10},
        { key: "environmentType", width:20},
        { key: "jiraID",  width:20}
    ];
}

async function addDataForATestsuite(worksheet, testSuite, testCases) {
    var testSuiteRow = worksheet.addRow();
    testSuiteRow.height = 24;
    worksheet.mergeCells(`A${testSuiteRow.number}:G${testSuiteRow.number}`);
    testSuiteRow.eachCell(cell => {
        cell.fill = testSuiteStyle;
        cell.font = tableFont;
        cell.alignment = { ...wrapTextAlign, vertical: "middle" };
        cell.value = `Testsuite : ${testSuite}`;
        cell.font = { ...tableFont, bold: true };
        cell.border = border;
    });

    for (var index = 0; index < testCases.length; index++) {
        var element = testCases[index];
        var startTime;
        var endTime;
        try {
            startTime = element.tcStartTime
                .slice(0, 19)
                .split("T")
                .join(" ");
            startTime = startTime == "" || startTime == null ? "NA" : startTime;
        } catch (e) {
            startTime = "NA";
        }

        try {
            endTime = element.tcStopTime
                .slice(0, 19)
                .split("T")
                .join(" ");
            endTime = endTime == "" || endTime == null ? "NA" : endTime;
        } catch (e) {
            endTime = "NA";
        }

        var row = worksheet.addRow([
            element.tcId == "" || element.tcId == null ? "NA" : element.tcId,
            element.tcName == "" || element.tcName == null ? "NA" : element.tcName,
            element.tcStatus == "" || element.tcStatus == null ? "NA" : element.tcStatus,
            startTime,
            endTime,
            await findDuration(new Date(element.tcStopTime).setMilliseconds(0) - new Date(element.tcStartTime).setMilliseconds(0)),
            element.failReason == "" || element.failReason == null ? "NA" : element.failReason
        ]);
        row.eachCell(cell => {
            cell.fill = tableBodyStyle;
            cell.border = border;
            if(cell.value == 'Pass'){
                cell.font = {...tableFont,color: { argb: "FF00B04F" },bold: true};
            }else if(cell.value == 'Fail'){
                cell.font = {...tableFont,color: { argb: "FFFF0000" },bold: true};
            }else {
                cell.font = tableFont;
            }

            cell.alignment = { ...infoAlignment, ...wrapTextAlign };
        });
    }
}

async function findDuration(seconds) {
    var msec = seconds;
    var hh = Math.floor(msec / 1000 / 60 / 60);
    msec -= hh * 1000 * 60 * 60;
    var mm = Math.floor(msec / 1000 / 60);
    msec -= mm * 1000 * 60;
    var ss = Math.floor(msec / 1000);
    msec -= ss * 1000;
    return `${String(hh).length == 1 ? "0" + hh : hh}:${String(mm).length == 1 ? "0" + mm : mm}:${String(ss).length == 1 ? "0" + ss : ss}`;
}

function numToAlpha(num) {

    let alpha = '';

    for (; num >= 0; num = parseInt((num / 26).toString(), 10) - 1) {
        alpha = String.fromCharCode(num % 26 + 0x41) + alpha;
    }

    return alpha;
}