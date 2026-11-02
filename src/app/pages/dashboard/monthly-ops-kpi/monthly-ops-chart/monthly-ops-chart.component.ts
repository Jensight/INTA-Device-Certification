import { Component, OnInit, OnDestroy,ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { DataService } from '../../../../@core/services/data.service';
import jsPDF  from 'jspdf';
import * as _ from 'lodash';
import { NgxCaptureService } from 'ngx-capture';
import autoTable from 'jspdf-autotable';
import { LogsDisplayComponent } from '../logs-display/logs-display.component';
import { TestLabService } from '../../../../@core/services/test-lab.service';
import {ExcelServiceMonthly} from "../excel-service-montly";
@Component({
  selector: 'app-monthly-ops-chart',
  templateUrl: './monthly-ops-chart.component.html',
  styleUrls: ['./monthly-ops-chart.component.scss']
})
export class MonthlyOpsChartComponent implements OnInit {
    @ViewChild('screen', { static: true }) screen: any;
    columns :any[];
    chartDetails = {};
    allData: any = {};
    currentData = [];
    chartInput: any = {};
    chartInstance = null;
    tableData=[]
    sub1;
    sub2;
    chartInputPIE = {};
    chartInstancePIE = null;
    user;
    selectedDate;
    pdfHeight = 0;
    maxYear = new Date().getFullYear();
    loading = true;
    selectedModel :any;
    selectedFirmware:any;
   @Input() showNoDataTxt = false;
    // source: any;
    source: LocalDataSource = new LocalDataSource();
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    dateRangeDetails: any;
    devicesCol:any={
        totalJobCount : {
            width:"80px",
            title: 'Total Regression Jobs',
            type: "html",
            sort :false,
          },
        job_id: {
         title: 'Run ID',
         sort :false,
         type: 'custom',
         width:"200px",
         renderComponent: LogsDisplayComponent,
        componentInitFunction: (instance: LogsDisplayComponent, cell: Cell) => {
            LogsDisplayComponent.componentInit(instance, cell, 60);
          },
      },
      model:{
        title:"Device Model",
        sort :false,
        width:"100px",
      },
      firmwareVersion:{
        title:"Firmware Version",
        sort :false,
        width:"110px",
      },
      passTC : {
         title: 'Pass Tc',
         sort :false,
         type: "html",
         width:"100px",
      },
      failTC : {
         title: 'Fail Tc',
         sort :false,
         type: "html",
         width:"100px",     
      },
      regStartedAt:{
        title:"Date",
        sort:false,
        width:"100px",
        valuePrepareFunction:(Cell)=>{    
            // return Cell.toDateString()
            return new Date(Cell).toDateString()
        }
      }
     }
     public settings = {
         attr: {
             class: 'text-center'
         },
         noDataMessage: 'No Data Found', 
         hideSubHeader: true,
         pager: {
            perPage :5,
         },
         mode: 'external',
         actions: {
             add: false,
             edit: false,
             delete: false,
             position: 'right',
             custom: [
             ],
           },
         columns: {}
     };
    imgBase64: string;

    constructor(public dataService: DataService, private router: Router,private captureService: NgxCaptureService,private tlService: TestLabService,private excel:ExcelServiceMonthly) {
    }

    ngOnInit(): void {
        this.settings.columns=this.devicesCol;
        this.user = this.dataService.getCurrentUser();
       
        this.sub2 = this.dataService.regressionAnalysisDetails.subscribe(data => {
            if (data) {
       
                this.dataService.loading.next(true);
                console.log(data)
                if(data.dailyData[0]==undefined){
                    this.currentData =[];
                }else{
                    this.currentData = data.dailyData;
                }
                
      
                this.selectedModel = data.model
                this.selectedFirmware = data.firm
                this.selectedDate = data.dateRangeDetails
                if(data.allData == undefined || data.allData.length == 0){
                    this.tableData = [];
                    this.dataService.regressionNoData.next(true);
                }else{
                    this.tableData = data.allData
                }
    
                this.source.load(this.tableData)
                this.dateRangeDetails = data.dateRangeDetails;
                this.dataService.loading.next(false);
                
                this.processData();
                // this.source = (this.processSummaryData(this.currentData));
       
                this.loading = false;
            }

        });

    }
    //pdf download option
    capture() {
        
       
      
            this.downloadReport()
      
     
      }

      downloadReport() {
        this.dataService.loading.next(true);
        setTimeout(() => {
            this.downloadReports();
        }, 200)

    }

    async downloadReports() {
   
        var head = [["Total Regression Jobs",'Run ID','Device Model','Firmware Version',"Pass TC","Fail TC"]]
        var body = []
        const doc = new jsPDF('p', 'mm', 'a4');
        this.tableData.forEach((res)=>{
            let temp =[res.totalJobCount,res.job_id,res.model,res.firmwareVersion,res.passTC,res.failTC]
            body.push(temp)
           })
        doc.text('Monthly  OPS KPI', 75, 10);
        doc.setFontSize(10);
        doc.text( `Selected Date`,20,20);
        doc.text(`: ${this.selectedDate[0].startDate.toDateString() +"  " +"to"+ "  "+ this.selectedDate[0].endDate.toDateString()}`,45,20);
        doc.text(`Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`, 43, 25);
        doc.text(`Generated By`, 20, 30);
        doc.text(`:  ${this.user.username}`, 44, 30);
        doc.text(`Model Selected`, 20, 35);
        doc.text(`:  ${this.selectedModel ==1?"All":this.selectedModel}`, 46, 35);
        doc.text(`Firmware Selected`, 20, 40);
        doc.text(`:  ${this.selectedFirmware ==1?"All":this.selectedFirmware}`, 52, 40);
        doc.line(0, 42, 300, 42);
        this.pdfHeight = 45;
        if (this.chartInstance) {
            doc.text('Regression has highest Fail TestCase', 85, this.pdfHeight);
            this.pdfHeight += 8;
            await doc.addImage(
                this.chartInstance.getDataURL({ pixelRatio: 2 }),
                'png',
                15,
                this.pdfHeight,
                150,
                90,
                '',
                'FAST'
            );
    
        }
        let  option= {

            0: {cellWidth:12},

            1: {cellWidth: 95},

            2: {cellWidth: 20},

            3: {cellWidth: 30},

           4: {cellWidth: 10},

           5: {cellWidth: 10},

        

          };
        doc.text( 'Detailed Summary', 85, 170);
        autoTable(doc,{ head: head, body: body,theme:'grid',startY:180,tableLineColor: 150,tableLineWidth: 0,styles: {overflow:'linebreak',cellWidth:'auto',font: 'arial',fontSize: 10,},columnStyles:option})
        this.pdfHeight += 130;
        if (this.pdfHeight >= 251) {
            doc.addPage();
            this.pdfHeight = 20;
        }
        doc.save('ICAT-Monthly-OPS-KPI-Report.pdf');
        this.dataService.loading.next(false);
    }
    onChartInit(event): void {
        this.chartInstance = event;
    }

    /* based on data performs the action to generate report */

    processData(): void {
        const xAxis = [];
        const yAxis = [{ name: 'Pass', stack: 'a', data: [], type: 'bar',
             barMinHeight: 2, barMaxWidth: 80 },
             { name: 'Fail', stack: 'a', data: [], type: 'bar',
             barMinHeight: 2, barMaxWidth: 80 },
              ];
        this.currentData.forEach(element => {
                if(element.firmwareVersion == "NA" || element.firmwareVersion == "NIL"|| element.firmwareVersion ==""){
                    xAxis.push(element.model);
                }else{
                    xAxis.push(element.model+"-"+element.firmwareVersion);
                }
             
                yAxis[0].data.push(element.passTC);
                yAxis[1].data.push(element.failTC);
                
          
             

            });
        const colorsList =  ["#24a148", '#fa4d56',"#f1c21b" ];
        this.chartInput = {
                title: { show: false },
                color: colorsList,
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                    formatter: (params, ticket, callback) => {
                     
                        let temp = ``;
                        let head = ``;
                        let total = 0;
                        if (params[0] && params[0].axisValue) {
                            total += params[0].value;
                            head += `<div class="text-center" style="width:100%">${params[0].axisValue}</div>`;
                            temp += `<div class="row">
                                    <div class="col-sm-6">${params[0].seriesName}</div>
                                    <div class="col-sm-6">: ${params[0].value}</div>
                                </div>`;
                        }
                        if (params[1] && params[1].axisValue) {
                            total += params[1].value;
                            temp += `<div class="row">
                        <div class="col-sm-6">${params[1].seriesName}</div>
                        <div class="col-sm-6">: ${params[1].value}</div>
                    </div>`;
                        }
                        if (params[2] && params[2].axisValue) {
                            total += params[2].value;
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[2].seriesName}</div>
                        <div class="col-sm-6">: ${params[2].value}</div>
                    </div>`;
                        }
                        const finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`;
                        return head + finaltotal + temp;

                    }
                    
                },
                legend: {
                    show: true,
                    data: ['Pass', 'Fail', 'No run'] ,
                    itemGap: 5,
                    textStyle: {
                        color: '#0d0d0d'
                    }
                },
                grid: {
                    left: '4%',
                    right: '4%',
                    bottom: '10%',
                    top: '15%',
                    containLabel: true,
                },
                xAxis: [
                    {
                        type: 'category',
                        data: xAxis,
                        name: 'Model-Firmware ',
                        nameLocation: 'center',
                        nameTextStyle: { padding: 70 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                        axisLabel: {
                            interval: xAxis.length > 30 ? 15 : xAxis.length > 15 ? 5 : 0,
                            rotate: 45
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: 'No Of Testcases',
                        nameLocation: 'center',
                        nameTextStyle: { padding: 20 },
                        minInterval: 1,
                        splitLine: {
                            lineStyle: {
                                color: '#f2f2f2',
                            },
                        },
                        axisLine: {
                            show: true,
                            
                          },
                    },
                ],
                series: yAxis,
            };


        const legends = ['Completed', 'Aborted', 'Stopped'] ;

        let completed = 0;
        let aborted = 0;
        let stopped = 0;
        this.currentData.forEach(element => {
            completed += element.completed;
            aborted += element.aborted;
            stopped += element.stopped;
            });

        const series = [
                {
                    name: 'Completed',
                    value: completed
                },
                {
                    name: 'Aborted',
                    value: aborted
                },
                {
                    name: 'Stopped',
                    value: stopped
                }

            ];




    }

    processSummaryData(data: any): any {
        const tmpData = [{
            dateRange: this.dateRangeDetails[0].desc,
            totalReg: 0,
            totalTC: 0,
            completed: 0,
            aborted: 0,
            stopped: 0,
         }];
        if (data){
            data.forEach(element => {
            tmpData[0].totalReg =  tmpData[0].totalReg + element.totalReg;
            tmpData[0].totalTC =  tmpData[0].totalTC + element.totalTC;
            tmpData[0].completed =  tmpData[0].completed + element.completed;
            tmpData[0].aborted =  tmpData[0].aborted + element.aborted;
            tmpData[0].stopped =  tmpData[0].stopped + element.stopped;
        });
    }

        return tmpData;

    }
   
        /* converts the data into excelsheet */
    excelSheet(): void{
       
        let modelandfirm ={
            model:this.selectedModel ==1 ?"All":this.selectedModel,
            firmware:this.selectedFirmware ==1 ?"All":this.selectedFirmware,
            date:this.selectedDate[0].startDate.toDateString() +" to "+this.selectedDate[0].endDate.toDateString()
        }
  
         
        
              
             
        
    


        this.columns =["Total Job","Run ID","Device Model", "Firmware Version", "Pass TC", "Fail TC","Date"]
        this.excel.exportAsExcelFile("Regression has highest Fail TC",modelandfirm,this.columns,this.tableData,"Monthly OPS KPI","Highest Fail Details",this.chartInstance.getDataURL({ pixelRatio: 2 }))
    }
  
   
    ngOnDestroy(): void {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }

}
