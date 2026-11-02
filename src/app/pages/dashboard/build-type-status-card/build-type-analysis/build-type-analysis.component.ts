import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { DataService } from '../../../../@core/services/data.service';
import { DashboardService } from '../../../../@core/services/dashboard.service';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';
import { formatDate } from '@angular/common';
import { LocalDataSource } from 'angular2-smart-table';
import  jsPDF  from 'jspdf';
import { NgxCaptureService } from 'ngx-capture';
import {ExcelService} from "../excel-service";
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-build-type-analysis',
  templateUrl: './build-type-analysis.component.html',
  styleUrls: ['./build-type-analysis.component.scss']
})

export class BuildTypeAnalysisComponent implements OnInit, AfterViewInit{
    @ViewChild('screen', { static: true }) screen: any;
    @ViewChild('screen2', { static: true }) screen2: any;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    user: any = null;
    //allUsers: any = [];
    selectedUser: any;
    //allUserNames: any = [];
    //dataSubscription: any;
    selectedTeam: any;
    //subscribedData: any;
    //allRegressions: any = [];
    //regressionsOfSelectedUser: any = [];
    //firmware = [];
    //check = true

    //modelArry = []
    //testCasesChart = 'testCasesChart';
    //regressionChart = 'regressionChart';
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/environment-analysis',
            label: 'Environment Analysis'
        }
    ];
   
    selectedDateRange: any = '';
    // days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    startDate: any;
    endDate: any;
    currentWeekStartDt: any;
    currentWeekEndDt: any;
    //first: any;
    //last: any;
    //filteredRegressions: any;
    today = new Date();
    noData = false;
    //weeklyData = {};
    //selectedModel: any;
    //allModels: any = [];
    //formattedData: any = [];
    //filteredData: any = [];
    selectedFirmware: any = [];
    //selectedFirmware1: any = [];
    selectedDateRangeTxt: any;
    //showNoDataTxt = false;
    //currentData = [];
    firmwareVersion = [];//'41.0.21'
    sub1: any;
    allPlatform: any = [];
    platformType: any = [];
    //platformType1: any = [];
    sub2: any;
    //allModules:any = [];
    columns: any[];
    public lastThreeRegression = [];
    public orgLastFive;
    tableReady = false;
    summaryTableReady = false;
    regression_1_data = null;
    regression_2_data = null;
    public excelData = null;
    source: LocalDataSource = new LocalDataSource();
    source1: LocalDataSource = new LocalDataSource();
    displayedColumns: string[] = [];
    dataSource: MatTableDataSource<any[]>;
    resultsLength: any = 0;
    loading: boolean = true;
    dataList: any = [];
    
    pdfHeight: number;
    imgBase64: any = '';
    imgBase642: any = '';
    selectedRegStatus: any = [];
    cusstyle: any = '42%';
    constructor(private dInventoryService: DeviceInventoryService, private dataService: DataService, private dashboardService: DashboardService, private tcInventoryService: TestCaseInventoryService, 
        private captureService: NgxCaptureService, private excel:ExcelService) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.loadAllData(team);
            }
        });
        /*this.sub2 = this.dataService.getTCModules().subscribe(data => {
            if (data) {
                this.allModules = data;
            }
        });*/
        this.user = this.dataService.getCurrentUser();
        this.selectedUser = this.user.username;
        this.dataService.loading.next(true);
        //this.selectedDateRange = this.dateRangeArray[0].label;
        //this.selectedDateRangeTxt = this.dateRangeArray[0].value;
        // this.first = this.today.getDate() - this.today.getDay(); // First day of the week
        // this.last = this.first + 6; // last day of the week
        //this.currentWeekStartDt = new Date(this.today.setDate(this.first + 1));
        //this.currentWeekEndDt = new Date(this.today.setDate(this.last + 1));
        //const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const date = new Date();
        date.setDate(date.getDate() - 7);
        this.startDate = date;
        this.endDate = new Date()
        this.range.get("start")?.setValue(new Date(this.startDate))
        this.range.get("end")?.setValue(new Date(this.endDate))
        // this.getAllModels();
        //this.getAllRegressionsDayWise();

        this.dataService.getAllDevices().subscribe(dev => {
            //console.log('getAllDevices => 118', dev);
            if (dev) {
                this.allPlatform = [];
                //console.log('getAllDevices => 121', dev);
                dev.forEach(el => {
                    this.allPlatform.push({deviceName:el.deviceName, id:el._id});
                });
                
                /*const filteredmodel = _.filter(model, obj => {
                    return (
                        obj.dut === true
                    );
                });
                this.dataService.loading.next(true);
                this.modelArry = _.sortBy(filteredmodel, 'modelName');
                this.dataService.loading.next(false);*/
                if (this.selectedTeam) {
                    this.dataSource = new MatTableDataSource([]);
                    this.dataList = [];
                    this.loading = true;
                    this.resultsLength = 0;
                    //this.dataSource.paginator = this.paginator;
                    this.getResultBuildAnalysis();
                }
            } else {
                this.dInventoryService
                 .getAllData()
                 .subscribe((data) => {
                    //console.log('data => ', data);
                    if (data) {
                        this.dataService.getDeviceInventoryData().next(data);
                        setTimeout(() => {
                            this.dataService.getAllDevices().subscribe(mdl => {
                                if (mdl) {
                                    //console.log(mdl);
                                    this.allPlatform = [];
                                    mdl.forEach(el => {
                                        this.allPlatform.push({deviceName:el.deviceName, id:el._id});
                                    });
                                    /*const filteredmodel = _.filter(mdl, obj => {
                                        return (
                                            obj.dut === true
                                        );
                                    });*/

                                    this.dataService.loading.next(true);
                                    //this.modelArry = _.sortBy(filteredmodel, 'modelName');
                                    this.dataService.loading.next(false);
                                    if (this.selectedTeam) {
                                        this.dataSource = new MatTableDataSource([]);
                                        this.dataList = [];
                                        this.loading = true;
                                        this.resultsLength = 0;
                                        //this.dataSource.paginator = this.paginator;
                                        this.getResultBuildAnalysis();
                                    }
                                } else {
                                    //console.log('inside else');
                                    this.allPlatform = [];
                                    data.forEach(el => {
                                        if(el.deviceName){
                                            //console.log(el.deviceName, el._id);
                                            this.allPlatform.push({deviceName:el.deviceName, id:el._id});
                                        }
                                    });
                                    if (this.selectedTeam) {
                                        this.dataSource = new MatTableDataSource([]);
                                        this.dataList = [];
                                        this.loading = true;
                                        this.resultsLength = 0;
                                        //this.dataSource.paginator = this.paginator;
                                        this.getResultBuildAnalysis();
                                    }
                                }
                            });
                        }, 1);
                    }
                });
            }
            this.dataService.loading.next(false);
        });
        // this.selectedVendor =["Legacy","Ignite"]
    }
    ngAfterViewInit(): void {
        // console.log('inside this.paginator ngAfterViewInit => ', this.paginator)
        // if(this.paginator != undefined && this.dataSource){
        //     this.dataSource.paginator = this.paginator;
        // }
    }

    range = new FormGroup({
        start: new FormControl(null, Validators.required),
        end: new FormControl(null, Validators.required),
    });

    ngOnInit(): void {
    }

    sub3:any;
    loadAllData(team) {
        this.sub3 = this.tcInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getTcInventoryData().next(data);
            }
        });
    }

    sub4:any;
    typePer: any = [];
    private getResultBuildAnalysis(): void {
        this.loading = true;
        this.typePer = [];
        this.displayedColumns =[];
        
        if(this.platformType.length == 0){
            //this.platformType = this.allPlatform[0].id;
            this.platformType.push(this.allPlatform[0].id);
            //this.selectedFirmware = this.firmwareVersion[0];
        } 
        
        this.sub4 = this.dashboardService.getEnvirmentAnalysisData({regStartDate: formatDate(new Date(this.startDate), 'yyyy-MM-dd', 'en_US'), 
            regEndDate: formatDate(new Date(this.endDate), 'yyyy-MM-dd', 'en_US'), platFormType:this.platformType, selectedFirmware:this.selectedFirmware})
        .subscribe((data: any) => {
            //console.log('getRegressions => ', data);
            if(data.tcPer && this.displayedColumns.length == 0){
                this.displayedColumns = ['usecase-id', 'usecase-name'];
                data.tcPer.forEach(el => {
                    this.displayedColumns.push(el.type)
                });
            }
            if (data && data.allData.length > 0) {
                this.lastThreeRegression = data['allData'];
                this.typePer = data['tcPer'];
                this.summaryTableDataConversion(data);
                this.orgLastFive = data;
                //this.testcaseTableDataConversion(data);
                this.tableReady = true;
                this.dataSource = new MatTableDataSource(data['tcData']);
                this.dataList = data['tcData'];
                //console.log('data["tcData"].length => ', data['tcData'].length);
                this.resultsLength = data['tcData'].length;
                if(this.paginator != undefined) {
                    this.dataSource.paginator = this.paginator;
                } else {
                    setTimeout(() => {
                        //console.log('this.paginator => ', this.paginator)
                        this.dataSource.paginator = this.paginator;
                    }, 100);
                }
                //console.log('this.paginator => ', this.paginator)
                this.firmwareVersion = data['firmwareVersion'];
                // if(data.allData.length == 3){
                //     this.cusstyle = '42%';
                // } else if(data.allData.length == 2){
                //     this.cusstyle = '51%';
                // } else if(data.allData.length == 1){
                //     this.cusstyle = '68%';
                // }
                setTimeout(() => {
                    //console.log('this.displayedColumns => ', this.displayedColumns);
                    this.noData = false;
                }, 1);
                this.loading = false;
            } else {
                this.noData = true;
                this.firmwareVersion = data['firmwareVersion']
                this.dataSource = new MatTableDataSource([]);
                this.dataList = [];
                this.resultsLength = 0;
                //this.dataSource.paginator = this.paginator;
                this.loading = false;
            }
        }, err=> {
            this.dataSource = new MatTableDataSource([]);
            this.dataList = [];
            this.loading = false;
            this.resultsLength = 0;
            //this.dataSource.paginator = this.paginator;
        });
    }

    onSave(): void {
        this.startDate = this.range.get("start")?.value
        this.endDate = this.range.get('end')?.value
        this.selectedDateRange = ""
        this.selectedDateRangeTxt = "Customized Date range";
        this.dataSource = new MatTableDataSource([]);
        this.dataList = [];
        this.loading = true;
        this.resultsLength = 0;
        //this.dataSource.paginator = this.paginator;
        this.getResultBuildAnalysis();
    }

    setData(data: any): void {
        this.dataService.regressionAnalysisDetails.next(data);
        this.dataService.regressionNoData.next(false);
        this.dataService.loading.next(false);
    }

    setDateRangeForWeeks(sDtRange: any): void {
        if (sDtRange.attr === '0') {
            this.startDate = this.currentWeekStartDt;
            this.endDate = this.currentWeekEndDt;
        } else {
            const NoOfDays = 7 * sDtRange.attr;
            this.startDate = new Date(this.currentWeekStartDt - NoOfDays * 24 * 60 * 60 * 1000);
            this.endDate = new Date(this.currentWeekEndDt - 7 * 24 * 60 * 60 * 1000);
            this.range.get("start")?.setValue(new Date(this.startDate));
            this.range.get("end")?.setValue(new Date(this.endDate));
        }
    }

    setDateRangeForMonths(sDtRange: any): void {
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const dt = new Date();
        if (sDtRange.attr === '0'){
            this.startDate = firstDayOfMonth;
            this.endDate = dt;
        } else {
            firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() - parseInt(sDtRange.attr, 0));
            this.startDate = firstDayOfMonth;
            this.endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
        }
        this.range.get("start")?.setValue(new Date(this.startDate))
        this.range.get("end")?.setValue(new Date(this.endDate))
    }

    saveplatform(platform){  
        this.selectedFirmware = [];
        this.dataSource = new MatTableDataSource([]);
        this.dataList = [];
        this.resultsLength = 0;
        //this.dataSource.paginator = this.paginator;
        if(platform.length > 0){
            this.loading = true;
            this.getResultBuildAnalysis();
        }
        
    }

    savefirmwareversion(flag){
        //console.log('inside savefirmwareversion => ', this.selectedFirmware);
        if(flag == 'false'){
            this.selectedFirmware = [];
        }
        this.dataSource = new MatTableDataSource([]);
        this.dataList = [];
        this.loading = true;
        this.resultsLength = 0;
        //this.dataSource.paginator = this.paginator;
        this.getResultBuildAnalysis();
    }

    /* converts the data into table format */
    summaryTableDataConversion(data) {
        let tcDataExcel = [];
        tcDataExcel = _.map(data['tcData'], _.partialRight(_.omit, '_id'));
        //console.log('tcDataExcel => ', tcDataExcel);
        this.excelData = {
            //allData: arr_data, regressionNames: data['regressionNames'],
            tcData: tcDataExcel
        };
    }

    /* downloads all the selected data */
    downloadReport(type): void {
        this.dataService.loading.next(true);
        setTimeout(() => {
            if(type == 'excel'){
                this.downloadExcelReport();
            }else{
                this.downloadPdfReports();
            }
        }, 200);

    }

    capture(type): void {
        /*this.captureService
        .getImage(this.screen.nativeElement, true)
        .subscribe((img) => {
            this.imgBase64 = img;
            //this.downloadReport(type);
        });*/
        this.captureService
          .getImage(this.screen2.nativeElement, true)
          .subscribe((img) => {
            this.imgBase642 = img;
            this.downloadReport(type)
        });
        setTimeout(() => {
        }, 0);
    }

    async downloadPdfReports(): Promise<void> {
        var headData = ['Usecase ID', 'Usecase Name']
        this.typePer.forEach(el => {
            headData.push(el.type + ' (' + el.pers + ')')
        });
        //console.log('headData => ', headData);
        var head = (this.noData)? [headData]:[headData]; 
        //[['Usecase ID', 'Usecase Name', 'Production Build (' + this.typePer[0].pers + ')', 'Test Build on Production (' + this.typePer[1].pers + ')', 'Test Build on Pre-Production (' + this.typePer[2].pers + ')']] : [['Usecase ID', 'Usecase Name', 'Production Build (' + this.typePer[0].pers + ')', 'Test Build on Production (' + this.typePer[1].pers + ')', 'Test Build on Pre-Production (' + this.typePer[2].pers + ')']]
        var body = []
        var platform = "";
        
        //console.log('allPlatform => ', this.allPlatform)
        this.allPlatform.forEach(el => {
            this.platformType.forEach((ele, index) => {
                if(el.id == ele){
                    if(this.platformType.length > 1 && index != 0) {
                        platform = platform + ', ' + el.deviceName;
                    } else {
                        platform = el.deviceName;
                    }
                }
            })
        });
        //console.log('platform => ', platform);
        var selectedFirmware = '';
        this.selectedFirmware.forEach((elem,index) => {
            if(this.selectedFirmware.length > 1 && index != 0){
                selectedFirmware = selectedFirmware + ', ' + elem;
            } else {
                selectedFirmware = elem;
            }
        });
        const doc = new jsPDF('p', 'mm', 'a4');
        
        this.dataList.forEach((row)=>{
            //console.log(row)
            let temp=[row.tcId, row.tcName];
            this.typePer.forEach(el => {
                temp.push(row[el.type] != 'Not Executed'? row[el.type] + ' | ' + row[el.type + '_last_Execution']:row[el.type])
            });
            //let temp=[row.tcId, row.tcName, row['Production Build'] != 'Not Executed'? row['Production Build'] + ' | ' + row['Production Build_last_Execution']:row['Production Build'],row['Test Build on Production'] != 'Not Executed'? row['Test Build on Production'] + ' | ' + row['Test Build on Production_last_Execution']:row['Test Build on Production'], row['Test Build on Pre-Production'] != 'Not Executed'? row['Test Build on Pre-Production'] + ' | ' + row['Test Build on Pre-Production_last_Execution']:row['Test Build on Pre-Production']]
            body.push(temp)
        })
        
        doc.text('Environment Analysis Report', 75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + 'Environment Analysis(' + (this.startDate.toDateString() + '-' + this.endDate.toDateString()) + ')', 43, 20);
        doc.text(`Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`, 43, 25);
        doc.text(`Platform`, 20, 30);
        doc.text(`:  ${ platform }`, 43, 30);
        doc.text(`App Version`, 20, 35);
        doc.text(`:  ${(selectedFirmware == '')? 'All': selectedFirmware}`, 43, 35);
        /*doc.text(`Model Selected`, 20, 40);
        doc.text(`:  ${(this.selectedModel == 1)? 'All': this.selectedModel}`, 43, 40);*/
        doc.line(0, 42, 300, 42);
        this.pdfHeight = 45;
            this.pdfHeight += 8;
            autoTable(doc,{ head: head, body: body,theme:'grid',startY:50,tableLineColor: 150,tableLineWidth: 0,styles: {overflow:'linebreak',cellWidth:'auto',font: 'arial',fontSize: 9,},})
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
            /*this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }*/
        await doc.save('iCAT-Environment-Analysis-Report(' + (this.startDate.toDateString() +
        '-' + this.endDate.toDateString() + '_' + new Date()) + ').pdf');
        this.dataService.loading.next(false);
    }

    /* converts the data into excelsheet */
    downloadExcelReport(): void{ 
        var platform ='';
        this.allPlatform.forEach(el => {
            this.platformType.forEach((ele, index) => {
                if(el.id == ele){
                    if(this.platformType.length > 1 && index != 0) {
                        platform = platform + ', ' + el.deviceName;
                    } else {
                        platform = el.deviceName;
                    }
                }
            })
        });
        //console.log('platform => ', platform);
        var selectedFirmware = '';
        this.selectedFirmware.forEach((elem, index) => {
            if(this.selectedFirmware.length > 1 && index != 0){
                selectedFirmware = selectedFirmware + ', ' + elem;
            } else {
                selectedFirmware = elem;
            }
        });
        if(this.selectedFirmware.length == 0){
            selectedFirmware = 'All'
        }
        //var allData = this.excelData.tcData;
        
        this.columns=['TC ID','Testcase Name']; //.concat(this.excelData.regressionNames)  (' + this.typePer[0].pers + ')
        this.typePer.forEach(el => {
            this.columns.push(el.type)
        });
        //console.log('this.columns => ', this.columns);
        this.excel.exportAsExcelFile('Environment Analysis of Regressions',"" && platform!=null && selectedFirmware!=null?[platform,selectedFirmware]: (platform + ' : ' + selectedFirmware), this.columns, this.excelData.tcData,this.excelData['allData'],"Environment Analysis of Regressions - "+ new Date() , 'UseCase Details',"", this.typePer);
        this.dataService.loading.next(false);
    }

    applyFilter(filterValue: string) {
        filterValue = filterValue.trim(); // Remove whitespace
        filterValue = filterValue.toLowerCase(); // MatTableDataSource defaults to lowercase matches
        this.dataSource.filter = filterValue;
    }

}
