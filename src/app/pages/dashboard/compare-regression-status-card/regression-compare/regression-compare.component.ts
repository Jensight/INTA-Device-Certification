import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TestCaseInventoryService } from './../../../../@core/services/testcase-inventory.service';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import { DataService } from './../../../../@core/services/data.service';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { LocalDataSource } from 'angular2-smart-table';
// import { MatSnackBar, MatDialog } from '../../../../../../node_modules/@angular/material';
import { SelectRegressionComponent } from './select-regression/select-regression.component';
import * as _ from 'lodash';
import * as XLSX from 'xlsx';
// import * as XlsxPopulate from "xlsx-populate/browser/xlsx-populate";
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
import { ExcelService } from '../excel-service';
import { formatDate } from '@angular/common';
import { UserService } from 'src/app/@core/services/user.service';
import { NgxCaptureService } from 'ngx-capture';
import  jsPDF  from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
    selector: 'app-regression-compare',
    templateUrl: './regression-compare.component.html',
    styleUrls: ['./regression-compare.component.scss']
})
export class CompareRegressionComponent implements OnInit, OnDestroy {
    @ViewChild('screen', { static: true }) screen: any;
    @ViewChild('screen2', { static: true }) screen2: any;
    columns: any[];
    public compareType = 'fiveReg';
    public moduleType = 'all';
    public tcStatusType = 'All';
    public lastFiveRegression = [];
    public orgLastFive;
    tableReady = false;
    summaryTableReady = false;
    regression_1_data = null;
    regression_2_data = null;
    public excelData = null;
    noData = false;
    selectedTeam;
    source: LocalDataSource = new LocalDataSource();
    source1: LocalDataSource = new LocalDataSource();
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    selectedModule = 'all';
    allModules = [];
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/compare-regressions',
            label: 'Compare Regressions'
        }
    ]
    public regressionDataSettings = {

    };

    regAttributes = {
        actions: false,
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Records Found',
        pager: {
            perPage: 5
        },
        mode: 'external',
        columns: {}
    };
    public regColumns = {
        tcId: {
            title: 'Testcase Id',
            type: 'string',
            sort:false,
            class: 'text-center',
            width: '8%'
        },
        tcName: {
            title: 'Testcase Name',
            type: 'string',
            sort:false,
            class: 'text-center',
            width: '15%'
        }
    };
    public summaryDataSettings = {

    };

    summary_table_attributes = {
        hideSubHeader: true,
        actions: false,
        attr: {
            class: 'text-center'
        },
        noDataMessage: 'No Records Found',
        mode: 'external',
        columns: {}
    };
    public summary_table_columns = {
        RegressionName: {
            title: 'Regression Name',
            type: 'html',
            filter: false,
            class: 'text-center',
            sort:false,
            width: '10%',
            valuePrepareFunction: (data) => {
                if (data === 'Testbed Name') {
                    return '<b >' + data + '</b>';
                } else if (data === 'Firmware Version') {
                    return '<b>' + data + '</b>';
                } else if (data === 'Start Date') {
                    return '<b>' + data + '</b>';
                } else if (data === 'Total Count') {
                    return '<b>' + data + '</b>';
                } else if (data === 'Pass Count') {
                    return '<b >' + data + '</b>';
                }
                else if (data === 'Warning Count') {
                    return '<b >' + data + '</b>';
                }
                else if (data === 'Fail Count') {
                    return '<b>' + data + '</b>';
                } else if (data === 'NoRun Count') {
                    return '<b>' + data + '</b>';
                } else {
                    return '<b>' + data + '</b>';
                }

            }
        }
    };
    allModels: any;
    sub7: any;
    sub8: any;
    minDate = new Date(2000, 0, 1);
    maxDate = new Date();
    dateValue = formatDate(new Date(), 'yyyy-MM-dd', 'en_US');
    enable_environment_type_selection: boolean = false;
    environment_type:any = [];
    env_type:any = 'All Environment';
    constructor(
        private dataService: DataService,
        private excel: ExcelService,
        private dashboardService: DashboardService,
        private dInventoryService: DeviceInventoryService,
        private tcInventoryService: TestCaseInventoryService,
        private dialog: MatDialog,
        private userService: UserService,
        private matsnack: MatSnackBar, private captureService: NgxCaptureService) {

        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.environment_type.push('All Environment')
                var confd = this.dataService.getTeamDashBoardConfig(team);
                if(confd.enable_environment_type_selection && confd.enable_environment_type_selection == true){
                    this.enable_environment_type_selection = true;
                    this.environment_type.push(...confd.environment_value_array);
                }
                this.loadAllData(team);
            }
        });
        this.sub2 = this.dataService.getTCModules().subscribe(data => {
            if (data) {
                this.allModules = data;
            }
        });

    }
    /* loads all the regression data */
    loadAllData(team) {
        this.sub3 = this.tcInventoryService.getAllData().subscribe(data => {
            if (data) {
                this.dataService.getTcInventoryData().next(data);
            }
        });
        this.getFiveRegressions();
    }

    private getFiveRegressions(): void {
        this.sub4 = this.dashboardService.getLastFiveRegression( {regStartDate: this.dateValue})
        .subscribe((data: any) => {
            if (data && data.allData.length > 0) {
                this.lastFiveRegression = data['allData'];
                this.summaryTableDataConversion(data);
                this.orgLastFive = data;
                this.testcaseTableDataConversion(data);
                this.tableReady = true;
            } else {
                this.noData = true;
            }
        });
    }

    onDateChange(event): void {
        console.log('on date change', event);
        if (this.dateValue){
            this.dateValue = formatDate(this.dateValue, 'yyyy-MM-dd', 'en_US');
        
            if (this.selectedModule === 'all'){
            this.getFiveRegressions();
            } else {
                this.getRegsOnModel();
            }
        }

    }
    /* converts the data into excelsheet */
    excelSheet() {
        // const ws = XLSX.utils.json_to_sheet(this.excelData['tcData']);
        // const ws1 = XLSX.utils.json_to_sheet(this.excelData['allData']);
        // const wb = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(wb, ws1, 'Regression');
        // XLSX.utils.book_append_sheet(wb, ws, 'Test Case Details');
        // XLSX.writeFile(wb, 'regression.xlsb');
        this.columns=['TC ID','Testcase Name'].concat(this.excelData.regressionNames)
        this.excel.exportAsExcelFile(this.compareType=="fiveReg"?'Comparison of Last Five Regression':"Comparison of Two Regressions",this.compareType=="twoReg" && this.regression_1_data!=null && this.regression_2_data!=null?[this.regression_1_data?.regressionNames[0],this.regression_2_data?.regressionNames[0]]: (this.selectedModule=="all"?"All Models":this.selectedModule), this.columns, this.excelData.tcData,this.excelData['allData'],this.compareType=="fiveReg"?'Comparison of Last 5 Regression Executed in '+this.selectedModule:"Comparison of Two Regressions" , 'TestCase Details',this.compareType)
    }
    /* converts the data into table format */
    datapdf:any = [];
    summaryTableDataConversion(data) {
        
        this.datapdf = data;
        let obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8, obj9, obj10;
        const arr_data = [];
        obj1 = this.iterationFunc(data['allData'], 'tagName', 'Tag Name');
        obj2 = this.iterationFunc(data['allData'], 'testbedName', 'Testbed Name');
        obj3 = this.iterationFunc(data['allData'], 'firmwareVersion', 'Firmware Version');
        obj4 = this.iterationFunc(data['allData'], 'jobStartTime', 'Start Date');
        obj5 = this.iterationFunc(data['allData'], 'totalTC', 'Total Count');
        obj6 = this.iterationFunc(data['allData'], 'passTC', 'Pass Count');
        obj7 = this.iterationFunc(data['allData'], 'failTC', 'Fail Count');
        obj8 = this.iterationFunc(data['allData'], 'norunTC', 'NoRun Count');
        // obj10 = this.iterationFunc(data['allData'], 'warnTC', 'Warning Count');

        arr_data.push(obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8);
        if(this.enable_environment_type_selection == true){
            obj9 = this.iterationFunc(data['allData'], 'environment_type', 'Environment Type');
            arr_data.push(obj9);
        }
        let summarycolNames = {};
        summarycolNames = { ... this.summary_table_columns };
        for (let index = 0; index < data['regressionNames'].length; index++) {
            const element = data['regressionNames'][index];
            summarycolNames[element] = { title: element, type: 'string', filter: false,sort:false, class: 'text-center', width: '15%' };
        }
        this.summary_table_attributes.columns = { ...summarycolNames };
        this.summaryDataSettings = { ... this.summary_table_attributes };
     
        this.source1.load(arr_data);
        this.summaryTableReady = true;
        let tcDataExcel = [];
        tcDataExcel = _.map(data['tcData'], _.partialRight(_.omit, '_id'));
        this.excelData = {
            allData: arr_data, regressionNames: data['regressionNames'],
            tcData: tcDataExcel
        };
    }

    iterationFunc(data, name, titleName) {
        const obj = {};
        data.forEach(element => {
            obj['RegressionName'] = titleName;
            obj[(element['jobName'])] =  element[name];
        });
        return obj;
    }
    /* converts the testcase data  */
    testcaseTableDataConversion(data) {
        let colNames = {};
        colNames = { ... this.regColumns };
        for (let index = 0; index < data['regressionNames'].length; index++) {
            const element = data['regressionNames'][index];
            colNames[element] = { title: element, type: 'string', class: 'text-center',sort:false, width: '15%' };
        }
        this.regAttributes.columns = { ...colNames };
        this.regressionDataSettings = { ... this.regAttributes };
        this.source.load(data['tcData']);
    }
    saveModule(value) {
        this.selectedModule = value;
        this.getRegDataBasedOnModule(event);
    }
    /* gets the regression details */
    getRegression(event) {
        this.summaryTableReady = false;
        this.noData = false;
        this.regression_1_data = null;
        this.regression_2_data = null;
        this.env_type = 'All Environment'
        if (this.compareType === 'fiveReg') {
            this.selectedModule = 'all';
            this.getRegDataBasedOnModule(event);
        } else if (this.compareType === 'twoReg') {
            this.tableReady = false;
            this.noData = false;

        }
    }
    /* gets the regression data based on module */
    getRegDataBasedOnModule(event) {
        if (this.selectedModule === 'all' && this.env_type == 'All Environment') {
            if (this.orgLastFive && this.orgLastFive['allData'].length > 0) {
                this.noData = false;
                this.summaryTableDataConversion(this.orgLastFive);
                this.testcaseTableDataConversion(this.orgLastFive);
                if (this.compareType === 'twoReg') {
                    this.tableReady = false;
                } else {
                    this.tableReady = true;
                }
            } else {
                this.noData = true;
            }

        } else {
            this.getRegsOnModel();
        }
    }

    private getRegsOnModel(): void {
        this.sub5 = this.dashboardService.getRegDataBasedOnModule(this.selectedModule,
            { regStartDate: this.dateValue, env_type:this.env_type })
            .subscribe((data: any) => {
                if (data && data.allData.length > 0) {
                    this.noData = false;
                    this.summaryTableDataConversion(data);
                    this.testcaseTableDataConversion(data);
                    if (this.compareType === 'twoReg') {
                        this.tableReady = false;
                    } else {
                        this.tableReady = true;
                    }
                } else {
                    this.noData = true;
                }
            });
    }

    selectReg(value) {
        const refObj = {
            selectedTeam: this.selectedTeam,
            regName: value,
            filter:value=="Regression1"&&this.regression_1_data==null?this.regression_2_data?.filter:(value=="Regression1"&&this.regression_1_data!=null?this.regression_1_data?.filter:(value=="Regression2"&&this.regression_2_data==null?this.regression_1_data?.filter:this.regression_2_data?.filter))
        };
        const dialogref = this.dialog.open(SelectRegressionComponent, {
            width: '55%',
            minHeight: '50%',
            data: refObj,
        });
        this.sub6 = dialogref.afterClosed().subscribe(data => {
            if (data) {

                this.noData = false;
                if (data.regName === 'Regression1') {
                    this.regression_1_data = data;
                } else if (data.regName === 'Regression2') {
                    this.regression_2_data = data;
                }
                if ((this.regression_1_data) && (!this.regression_2_data)) {
                    this.summaryTableDataConversion(this.regression_1_data);
                    this.testcaseTableDataConversion(this.regression_1_data);
                    this.tableReady = true;
                } else if ((!this.regression_1_data) && (this.regression_2_data)) {
                    this.summaryTableDataConversion(this.regression_2_data);
                    this.testcaseTableDataConversion(this.regression_2_data);
                    this.tableReady = true;
                } else if ((this.regression_1_data) && (this.regression_2_data)) {
                    const combineAllData = [];
                    let combineRegressionNames = [];
                    combineAllData.push(this.regression_1_data['allData'][0]);
                    combineAllData.push(this.regression_2_data['allData'][0]);
                    combineRegressionNames = combineAllData.map(reg => reg.jobName);
                    let allTestcases = [];
                    let uniqueTC = [];
                    for (let index = 0; index < combineAllData.length; index++) {
                        const element = combineAllData[index];
                        const allTc = element.onExecution;
                        element.onExecution = allTc.map(tc => {
                            return { ...tc, id: element['jobName'] };
                        });
                        allTestcases = [...allTestcases, ...element.onExecution];
                    }
                    uniqueTC = _.uniqBy(allTestcases, '_id');
                    const groupByTC = _.groupBy(allTestcases, '_id');
                    uniqueTC = _.map(uniqueTC, _.partialRight(_.pick, ['tcId', 'tcName', '_id']));
                    for (let index = 0; index < uniqueTC.length; index++) {
                        const element = uniqueTC[index];
                        groupByTC[element['_id']].forEach(tcgroupId => {
                            element[tcgroupId['id']] = tcgroupId['tcStatus'];
                        });
                    }
     
                    uniqueTC.map(tc => {
                        combineRegressionNames.forEach(regName => {
                            if (!tc[regName]) {
                                tc[regName] = 'Not Executed';
                            }
                        });
                    });
                    this.summaryTableDataConversion({ allData: combineAllData, tcData: uniqueTC, regressionNames: combineRegressionNames });
                    this.testcaseTableDataConversion({ allData: combineAllData, tcData: uniqueTC, regressionNames: combineRegressionNames });
                    this.tableReady = true;
                }


            } else {
                // console.log(data);
            }
        });
    }


    ngOnInit(): void { 

        this.sub7=this.dataService.getAllModels().subscribe(model => {
            if (model) {
               
               const filteredmodel = _.filter(model, obj => {
                return (
                   obj['dut'] == true
                     
                );
            });
            this.allModels=_.sortBy(filteredmodel, 'modelName');
           
            }else{
                this.sub8 = this.dInventoryService
                .getAllData()
                .subscribe((data) => {
                  if (data) {
                    this.dataService.getDeviceInventoryData().next(data);

                    const models = _.filter(data, function (obj) {
                        return (
                            obj['modelName'] !== undefined &&
                            obj['deviceVendor'] !== undefined &&
                            obj['profileName'] !== undefined
                        );
                    });                          
                           const filteredmodel = _.filter(models, obj => {
                            return (
                               obj['dut'] == true
                                 
                            );
                        });
                        //console.log(filteredmodel,":asd")
                        this.allModels=_.sortBy(filteredmodel, 'modelName');
                    }
                });
            }
        });
    }

    filterOnEnv(event){
        this.env_type = event;
        this.getRegDataBasedOnModule(event);
                  }
    imgBase642: any = '';
    pdfSheet() {
        this.captureService
          .getImage(this.screen.nativeElement, true)
          .subscribe((img) => {
            this.imgBase642 = img;
            this.downloadpdfReport()
        });
    }

    typePer:any = [];
    dataList:any = [];
    startDate:any
    endDate:any
    pdfHeight: number;
    async downloadpdfReport() {
        this.typePer = this.source1;
        this.dataList = this.source;
        var headData = ['Usecase ID', 'Usecase Name']
        var headData1 = ['Regression Name']
        this.datapdf.regressionNames.forEach(el => {
            headData.push(el);
            headData1.push(el);
        });
        //console.log('headData => ', headData);
        var head = (this.noData)? [headData]:[headData];
        var head1 = (this.noData)? [headData1]:[headData1]; 
        //[['Usecase ID', 'Usecase Name', 'Production Build (' + this.typePer[0].pers + ')', 'Test Build on Production (' + this.typePer[1].pers + ')', 'Test Build on Pre-Production (' + this.typePer[2].pers + ')']] : [['Usecase ID', 'Usecase Name', 'Production Build (' + this.typePer[0].pers + ')', 'Test Build on Production (' + this.typePer[1].pers + ')', 'Test Build on Pre-Production (' + this.typePer[2].pers + ')']]
        var body = []
        var body1 = [];
        var platform = this.env_type;
        
        //console.log('allPlatform => ', this.allPlatform)
        let cellWi:any = 'auto'
        var moduleName = this.selectedModule;
        var doc:any;
        if(this.compareType == 'twoReg'){
            cellWi = 47
            doc = new jsPDF('p', 'mm', 'a4');
            if(this.regression_1_data.filter.model == this.regression_2_data.filter.model) {
                moduleName = this.regression_1_data.filter.model
            } else {
                moduleName = this.regression_1_data.filter.model + ',  ' + this.regression_2_data.filter.model
            }
            if(this.regression_1_data.filter.environment == this.regression_2_data.filter.environment) {
                platform = this.regression_1_data.filter.environment
            } else {
                platform = this.regression_1_data.filter.environment + ',  ' + this.regression_2_data.filter.environment
            }
        } else {
            cellWi = 40
            doc = new jsPDF('l', 'mm', 'a4');
        }
        
        let temp= [];
        let temp1= [];
        
        this.typePer.data.forEach(el => {
            temp1=[el.RegressionName];
            this.datapdf.regressionNames.forEach(ele => {
                temp1.push(el[ele])
            });
            body1.push(temp1)
        });

        
        this.dataList.data.forEach((row)=>{
            //console.log(row)
            temp=[row.tcId, row.tcName];
            this.datapdf.regressionNames.forEach(el => {
                temp.push(row[el])
            });
            //let temp=[row.tcId, row.tcName, row['Production Build'] != 'Not Executed'? row['Production Build'] + ' | ' + row['Production Build_last_Execution']:row['Production Build'],row['Test Build on Production'] != 'Not Executed'? row['Test Build on Production'] + ' | ' + row['Test Build on Production_last_Execution']:row['Test Build on Production'], row['Test Build on Pre-Production'] != 'Not Executed'? row['Test Build on Pre-Production'] + ' | ' + row['Test Build on Pre-Production_last_Execution']:row['Test Build on Pre-Production']]
            body.push(temp)
        })
        
        doc.text('Compare Regressions', 75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + 'Compare Regressions(' + (this.dateValue) + ')', 43, 20);
        doc.text(`Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`, 43, 25);
        doc.text(`Module Type`, 20, 30);
        doc.text(`:  ${ moduleName }`, 43, 30);
        if(this.enable_environment_type_selection == true) {
            doc.text(`Environment`, 20, 35);
            doc.text(`:  ${(platform == '')? 'All': platform}`, 43, 35);
        }
        
        /*doc.text(`Model Selected`, 20, 40);
        doc.text(`:  ${(this.selectedModel == 1)? 'All': this.selectedModel}`, 43, 40);*/
        doc.line(0, 42, 500, 42);
        this.pdfHeight = 45;
            this.pdfHeight += 8;
            autoTable(doc,{ head: head1, body: body1,theme:'grid',startY:50,tableLineColor: 150,tableLineWidth: 0,styles: {overflow:'linebreak',cellWidth:cellWi,font: 'arial',fontSize: 9,},})
            autoTable(doc,{ head: head, body: body,theme:'grid',startY:150,tableLineColor: 150,tableLineWidth: 0,styles: {overflow:'linebreak',cellWidth:cellWi,font: 'arial',fontSize: 9,},})
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
        await doc.save('Compare-Analysis-Report(' + (this.dateValue + '_' +new Date()) + ').pdf');
        this.dataService.loading.next(false);
    }

    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.sub3) {
            this.sub3.unsubscribe();
        }
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
        if (this.sub6) {
            this.sub6.unsubscribe();
        }
        if (this.sub7) {
            this.sub7.unsubscribe();
        }
        if (this.sub8) {
            this.sub8.unsubscribe();
        }

    }
}
