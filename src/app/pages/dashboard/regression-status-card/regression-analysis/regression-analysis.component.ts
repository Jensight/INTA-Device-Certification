import { Component, OnInit ,ViewChild} from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DataService } from './../../../../@core/services/data.service';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { TestLabService } from '../../../../@core/services/test-lab.service';
import * as _ from 'lodash';
import { WeekRegressionsDataComponent } from './week-regressions-data/week-regressions-data.component';
import jsPDF  from 'jspdf';
import { NgxCaptureService } from 'ngx-capture';
import autoTable from 'jspdf-autotable';
import { UntypedFormControl } from '@angular/forms';

import {ExcelService} from "../excel-service";
@Component({
    selector: 'app-regression-analysis',
    templateUrl: './regression-analysis.component.html',
    styleUrls: ['./regression-analysis.component.scss']
})
export class RegressionAnalysisComponent implements OnInit {
    @ViewChild('screen', { static: true }) screen: any;
    columns :any[];
    user: any = null;
    allUsers: any = [];
    selectedUser: any;
    allUserNames: any = [];
    dataSubscription: any;
    selectedTeam: any;
    subscribedData: any;
    allRegressions: any = [];
    regressionsOfSelectedUser: any = [];
    chartInstance = null;
    testCasesChart = 'testCasesChart';
    regressionChart = 'regressionChart';
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/regression-analysis',
            label: 'Regression Analysis'
        }
    ];
    dateRangeArray = [{ label: '1W', value: 'Current Week', attr: '0' },
    { label: 'L1W', value: 'Last Week', attr: '1' },
    { label: 'L2W', value: 'Last 2 Weeks', attr: '2' }, { label: 'L3W', value: 'Last 3 Weeks', attr: '3' },
    { label: 'L4W', value: 'Last 4 Weeks', attr: '4' }, { label: '1M', value: 'This Month', attr: '0' },
    { label: 'L1M', value: 'Last Month', attr: '1' }, { label: 'L2M', value: 'Last 2 Months', attr: '2' },
    { label: 'L3M', value: 'Last 3 Months', attr: '3' }, { label: 'L4M', value: 'Last 4 Months', attr: '4' },
    { label: 'L6M', value: 'Last 6 Months', attr: '6' }, { label: 'L12M', value: 'Last 12 Months', attr: '12' },
    { label: 'Q1', value: 'Q1', attr: '1' }, { label: 'Q2', value: 'Q2', attr: '2' },
    { label: 'Q3', value: 'Q3', attr: '3' }, { label: 'Q4', value: 'Q4', attr: '4' }];
    selectedDateRange: any;
    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    startDate: any;
    endDate: any;
    currentWeekStartDt: any;
    currentWeekEndDt: any;
    filteredRegressions: any;
    noData = false;
    weeklyData = {};
    xLabelName = 'X Label Name';
    selectedModel: any = 1;
    allModels: any = [];
    modelArray: any = [];
    formattedData: any = [];
    filteredData: any = [];
    selectedDateRangeTxt: any;
    showNoDataTxt = false;
    pdfHeight: number;
    loading = true;
    sub1: any;
    defaultVendor = ["All", "Ignite", "Legacy"];
    selectedVendor: any = "Ignite";
    selectedRegStatus: any;
    selectRegFormControl = new UntypedFormControl();
    regStatus = ["Completed", "Aborted", "Stopped"];
	showNoRun = false;
    showError: boolean = false;
    imgBase64: string;
    constructor(private captureService: NgxCaptureService,private dashboardService: DashboardService,
        private dInventoryService: DeviceInventoryService, private dataService: DataService,
        private tlService: TestLabService,private excel:ExcelService) {
        this.user = this.dataService.getCurrentUser();
        this.selectedUser = this.user.username;
        this.dataService.loading.next(true);
        this.selectedDateRange = this.dateRangeArray[0].label;
        this.selectedDateRangeTxt = this.dateRangeArray[0].value;
        this.currentWeekStartDt  = this.getStartOfWeek(new Date());
        this.currentWeekEndDt = this.getEndOfWeek(new Date());
        this.startDate = this.currentWeekStartDt;
        this.endDate = this.currentWeekEndDt;
        // this.getAllModels();
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                this.defaultRegstatus();

            }
        });
        if (this.selectedTeam) {
            this.dataService.getSettingsData().subscribe(data => {
                if (data) {
                    this.allUsers = _.sortBy(data.users, 'username');
                    this.allUsers.sort((a, b) => {
                        if (a.username.toLowerCase() > b.username.toLowerCase()) {
                          return 1;
              
                        }
                        if (a.username.toLowerCase() < b.username.toLowerCase()) {
                          return -1;
              
                        }
              
                        return 0;
                      });
                    console.log("data.users", data.users);
                    console.log("allusers>>>>>>>>", this.allUsers);
                    this.allUsers.forEach(element => {
                        if (element.teams.includes(this.selectedTeam)) {
                            this.allUserNames.push(element.username);
                            console.log("allusernames>>>>>>>", this.allUserNames);
                        }
                    });
                    // this.allUserNames = this.allUserNames.toLocaleString().split(',');
                    // this.allUserNames.sort();
                }
            });
        }
        this.allUserNames = this.allUserNames.map((data: any) => {
            return { value: data, title: data };
        });
        this.dataService.getAllModels().subscribe(model => {
            if (model) {
                const filteredmodel = _.filter(model, obj => {
                    return (
                        obj.dut === true || obj['deviceVendor'] == "Sercomm" || obj['deviceVendor'] == "Comcast" 
                    );
                });
                this.allModels = _.sortBy(filteredmodel, 'modelName');
                this.modelArray = this.allModels;
                this.getAllRegressionsDayWise();
            } else {
                this.dInventoryService
                    .getAllData()
                    .subscribe((data) => {
                        if (data) {
                            this.dataService.getDeviceInventoryData().next(data);
                            this.dataService.getAllModels().subscribe(mdl => {
                                if (mdl) {
                                    const filteredmodel = _.filter(mdl, obj => {
                                        return (
                                            obj.dut === true  || obj['deviceVendor'] == "Sercomm" || obj['deviceVendor'] == "Comcast"
                                        );
                                    });
                                    this.allModels = _.sortBy(filteredmodel, 'modelName');
                                    this.modelArray = this.allModels;
                                    this.getAllRegressionsDayWise();
                                }
                            });

                        }
                    });
                   
            }
           
          //  console.log("this.modelArray in constructor >>>>", this.modelArray)
        });
        

    }

  ngOnInit(): void {
  }

  defaultRegstatus() {
    // To make regression status as default selected with options
    // let settingsData = this.dataService.getSettingsData().value;
    let enableCompletedRegressions = false;
    var config = this.dataService.getTeamDashBoardConfig(this.selectedTeam);
    enableCompletedRegressions = config.enable_completed_regression ? config.enable_completed_regression : false;
    if(enableCompletedRegressions) {        
        this.selectRegFormControl.setValue([this.regStatus[0]]);
        this.selectedRegStatus = [this.regStatus[0]];
    } else {
        this.selectRegFormControl.setValue(this.regStatus);
        this.selectedRegStatus = this.regStatus;
    }
  }

  getStartOfWeek(date): void {
    date.setHours(0, 0, 0, 0);
    date.setDate((date.getDate() - date.getDay()) + 1);
    return date;
  }
  getEndOfWeek(date): void {
    date = this.getStartOfWeek(date);
    date.setDate(date.getDate() + 6);
    return date;
  }
  getAllModels(): void {
    this.dataService.getAllModels().subscribe(model => {
        if (model) {
           const filteredmodel = _.filter(model, obj => {
            return (
               obj.dut === true
            );
        });
           this.allModels = _.sortBy(filteredmodel, 'modelName');
        }else{
           this.dInventoryService
            .getAllData()
            .subscribe((data) => {
              if (data) {
                this.dataService.getDeviceInventoryData().next(data);
                this.dataService.getAllModels().subscribe(mdl => {
                    if (mdl) {
                       const filteredmodel = _.filter(mdl, obj => {
                        return (
                           obj.dut === true
                        );
                    });
                       this.allModels = _.sortBy(filteredmodel, 'modelName');

                                }
                            });

                        }
                    });
            }
        });
    }
    filterBasedOnUser(): void {
        this.getAllRegressionsDayWise();
    }

    filterBasedOnRegStatus(): void {
        this.selectRegFormControl.valueChanges.subscribe(e => {
            this.selectedRegStatus = e;
            this.showError = false;
            if(this.selectedRegStatus.length == 1) {
                this.showError = true;
            }
            this.getAllRegressionsDayWise();
        });
    }
    
    filterBasedOnModel(): void {
        const tmpData = this.filteredData;
      //  console.log("filteredData inside filterBasedOnModel>>>", this.filteredData);
      //  console.log("this.allModels inside filterBasedOnModel>>>", this.allModels);
        if (this.selectedModel && this.selectedModel !== 1) {
            const modelData = tmpData?.map((element: any) => element).filter((element) => {
                return element.model === this.selectedModel;
            });
            this.formattedData = this.formatData(modelData);
          
            this.setData(this.formattedData);
        } else if (this.selectedModel && this.selectedModel === 1) {
            let filteredModel = [];           
            this.filteredData.forEach(e => {
                this.allModels.forEach(d => {
                    if(d.modelName == e.model) {
                        filteredModel.push(e);
                    }
                });
            });
            this.formattedData = this.formatData(filteredModel);
           // console.log("this.formattedData>>>",this.formattedData);
            this.setData(this.formattedData);
        }
    }

    formatData(data: any): any {
        let finalData = {};
        const dailyData = this.groupByDate(data);
        this.showNoDataTxt = dailyData.length === 0 ? true : false;
        const dateRangeDetails = [{ startDate: this.startDate, endDate: this.endDate, desc: this.selectedDateRangeTxt }];
        finalData = { ...finalData, dailyData };
        finalData = { ...finalData, dateRangeDetails };
        return finalData;
    }

    groupByDate(data: any): any {
        let dailyOutput = {};
        const regressonList = [];
        let filteredRegressions;
        if (this.startDate.getFullYear() === this.endDate.getFullYear()){
            if (this.endDate.getMonth() !== this.startDate.getMonth() && this.startDate.getDate() > this.endDate.getMonth()) {
                filteredRegressions = data?.map((element: any) => element).filter((element) => {
                    return (element.year === this.startDate.getFullYear()
                     && ((element.month === this.startDate.getMonth() + 1 &&
                     element.day >= this.startDate.getDate()) ||
                     (element.month === this.endDate.getMonth() + 1 &&
                     element.day <= this.endDate.getDate())));
                });
            } else {
                filteredRegressions = data?.map((element: any) => element).filter((element) => {
                    return (element.year === this.startDate.getFullYear()
                     && ((element.month >= this.startDate.getMonth() + 1 &&
                     element.day >= this.startDate.getDate()) &&
                     (element.month <= this.endDate.getMonth() + 1 &&
                     element.day <= this.endDate.getDate())));
                });
            }

        } else {
            filteredRegressions = data?.map((element: any) => element).filter((element) => {
                return ((element.year === this.startDate.getFullYear()
                 && element.month >= this.startDate.getMonth() + 1 &&
                  element.day >= this.startDate.getDate()) ||
                  (element.year === this.endDate.getFullYear()
                 && element.month <= this.endDate.getMonth() + 1 &&
                  element.day <= this.endDate.getDate())) ;
                });
        }

        filteredRegressions?.forEach(d => {
            if (dailyOutput[d.year] && dailyOutput[d.year][d.month] && dailyOutput[d.year][d.month][d.day]) {
                const exis = dailyOutput[d.year][d.month][d.day];
                let exisAlltc = [];
                exisAlltc = dailyOutput[d.year][d.month][d.day].allTC;
                exis.allTC.push(d);
                const completed = d.regStatus === 'completed' ? dailyOutput[d.year][d.month][d.day].completed + 1
                    : dailyOutput[d.year][d.month][d.day].completed;
                const aborted = d.regStatus === 'aborted' ? dailyOutput[d.year][d.month][d.day].aborted + 1
                    : dailyOutput[d.year][d.month][d.day].aborted;
                const stopped = d.regStatus === 'stopped' ? dailyOutput[d.year][d.month][d.day].stopped + 1
                    : dailyOutput[d.year][d.month][d.day].stopped;
                const tmp = {
                    totalTC: d.totalTC + exis.totalTC,
                    passTC: d.passTC + exis.passTC,
                    failTC: d.failTC + exis.failTC,
                    norunTC: d.norunTC + exis.norunTC,
                    totalReg: ++exis.totalReg,
                    year: d.year,
                    month: d.month,
                    day: d.day,
                    allTC: exis.allTC,
                    startTime: d.regStartedAt,
                    regStatus: d.regStatus,
                    aborted,
                    completed,
                    stopped
                };
                dailyOutput[d.year][d.month][d.day] = tmp;
            } else {
                const tmp = {
                    totalTC: d.totalTC,
                    passTC: d.passTC,
                    failTC: d.failTC,
                    norunTC: d.norunTC,
                    totalReg: 1,
                    year: d.year,
                    month: d.month,
                    day: d.day,
                    allTC: [d],
                    startTime: d.regStartedAt,
                    regStatus: d.regStatus,
                    completed: d.regStatus === 'completed' ? 1 : 0,
                    stopped: d.regStatus === 'stopped' ? 1 : 0,
                    aborted: d.regStatus === 'aborted' ? 1 : 0
                };
                if (!dailyOutput[d.year]) {
                    dailyOutput[d.year] = {};
                }
                if (!dailyOutput[d.year][d.month]) {
                    dailyOutput[d.year][d.month] = {};
                }
                if (!dailyOutput[d.year][d.month][d.day]) {
                    dailyOutput[d.year][d.month][d.day] = {};
                }

                regressonList.push(d.run_id);
                dailyOutput[d.year][d.month][d.day] = tmp;
            }

        });
        dailyOutput = this.addAlldata(dailyOutput);
        return dailyOutput;
    }

    addAlldata(d): any {
        const firstLevelKey = Object.keys(d);
        const array = [];
        // tslint:disable-next-line:prefer-for-of
        for (let index = 0; index < firstLevelKey.length; index++) {
            const element = firstLevelKey[index];
            const secondLevelKey = Object.keys(d[element]);

            // tslint:disable-next-line:prefer-for-of
            for (let j = 0; j < secondLevelKey.length; j++) {
                const thirdLevelKey = Object.keys(d[element][secondLevelKey[j]]);

                // tslint:disable-next-line:prefer-for-of
                for (let k = 0; k < thirdLevelKey.length; k++) {
                    array.push(d[element][secondLevelKey[j]][thirdLevelKey[k]]);
                }
            }

        }
        return array;
    }

    getAllRegressionsDayWise(): void {
       
        this.dataService.loading.next(true);        
        // this.filteredData = [];
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
     //   console.log("this.selectedRegStatus>>>", this.selectedRegStatus);
        const regDt = this.dataService.allRegressionDetails.subscribe(data => {
            if (data) {
                console.log("before modification >>>>>", data);
                let statusFiltered = [] ;
                
                if(this.selectedRegStatus && this.selectedRegStatus.length > 0){ 
                    console.log("selectedRegStatus", this.selectedRegStatus);
                    this.showNoRun = (this.selectedRegStatus.length == 1 && this.selectedRegStatus.includes('Completed'))?  false : true;              
                    // console.log("showNoRun in reg analysis>>>", this.showNoRun );
                    for (let i = 0; i < this.selectedRegStatus.length; i++) {
                        data.forEach((res) => {
                            if (res.regStatus == this.selectedRegStatus[i].toLowerCase()) {
                                statusFiltered.push(res);
                            }
                        });
                    }
                    // console.log("statusFiltered >>>>", statusFiltered);
                    this.subscribedData = statusFiltered;
                    // console.log("subscribedData after reg status>>>>", this.subscribedData);                    
                } else{
                    this.subscribedData   = data; 
                }
                   
                console.log("reg status subscribedData >>>>>", this.subscribedData);
                const tmpData = this.subscribedData;
                console.log("reg status tmpData >>>>>", tmpData);
                this.filteredData = tmpData;
                if (this.selectedUser && this.selectedUser !== 1) {
                    this.filteredData = tmpData?.map((element: any) => element).filter((element) => {
                        return element.user === this.selectedUser;
                    });
                    // this.formattedData = this.formatData(this.filteredData);
                    // this.setData(this.formattedData);
                   
                    this.filterBasedOnVendor();
                } else {
                     this.filteredData = this.subscribedData;
                    // this.formattedData = this.formatData(this.filteredData);
                    // this.setData(this.formattedData);
                    console.log("else filteredData>>>>", this.filteredData);
                    this.filterBasedOnVendor();
                }
            } else {
                this.dataService.regressionNoData.next(true);
                this.dataService.loading.next(false);
                this.showNoDataTxt = true;
            }
        });
    }

    setData(data: any): void {
        this.dataService.regressionAnalysisDetails.next(data);
        this.dataService.regressionNoData.next(false);
        this.dataService.loading.next(false);
        this.loading = false;
    }

    onDateRangeSelected(event: any): void {
        const sDtRange = this.dateRangeArray.filter(ele => {
            return ele.label === event.value;
        });
        this.selectedDateRange = sDtRange[0].label;
        this.selectedDateRangeTxt = sDtRange[0].value;
        const selectedDays: string = sDtRange[0].value;
        if (selectedDays.includes('Week')) {
            this.setDateRangeForWeeks(sDtRange[0]);
        } else if (selectedDays.includes('Month')) {
            this.setDateRangeForMonths(sDtRange[0]);
        } else if (selectedDays.includes('Q1')) {
            this.startDate = new Date(new Date().getFullYear(), 0, 1);
            this.endDate = new Date(new Date().getFullYear(), 3, 0);
        } else if (selectedDays.includes('Q2')) {
            this.startDate = new Date(new Date().getFullYear(), 3, 1);
            this.endDate = new Date(new Date().getFullYear(), 6, 0);
        } else if (selectedDays.includes('Q3')) {
            this.startDate = new Date(new Date().getFullYear(), 6, 1);
            this.endDate = new Date(new Date().getFullYear(), 9, 0);
        } else if (selectedDays.includes('Q4')) {
            this.startDate = new Date(new Date().getFullYear(), 9, 1);
            this.endDate = new Date(new Date().getFullYear(), 12, 0);
        }
        this.filterBasedOnModel();
    }

  // set date range for week selection
    setDateRangeForWeeks(sDtRange: any): void {
        if (sDtRange.attr === '0') {
            this.startDate = this.currentWeekStartDt;
            this.endDate = this.currentWeekEndDt;
        } else {
            const NoOfDays = 7 * sDtRange.attr;
            this.startDate = new Date(this.currentWeekStartDt - NoOfDays * 24 * 60 * 60 * 1000);
            this.endDate = new Date(this.currentWeekEndDt - 7 * 24 * 60 * 60 * 1000);
        }
    }

    // set date range for month selection
    setDateRangeForMonths(sDtRange: any): void {
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const dt = new Date();
        if (sDtRange.attr === '0') {
            this.startDate = firstDayOfMonth;
            this.endDate = dt;
        } else {
            firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() - parseInt(sDtRange.attr, 0));
            this.startDate = firstDayOfMonth;
            this.endDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
        }
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
    this.captureService
      .getImage(this.screen.nativeElement, true)
      .subscribe((img) => {
        this.imgBase64 = img;
            this.downloadReport(type);
        
      });
    setTimeout(() => {
      }, 0);
  }

async downloadPdfReports(): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.text('Regression Jobs Analysis Report', 75, 10);
    doc.setFontSize(10);
    doc.text('Type', 20, 20);
    doc.text(': ' + 'Regression Analysis(' + (this.selectedDateRangeTxt + '-' + this.startDate.toDateString()
    + '-' + this.endDate.toDateString()) + ')', 43, 20);
    doc.text(`Report Date`, 20, 25);
    doc.text(`:  ${new Date()}`, 43, 25);
    doc.text(`Generated By`, 20, 30);
    doc.text(`:  ${this.user.username}`, 43, 30);
    doc.text(`User Selected`, 20, 35);
    doc.text(`:  ${(this.selectedUser == 1)? 'All': this.selectedUser}`, 43, 35);
    doc.text(`Model Selected`, 20, 40);
    doc.text(`:  ${(this.selectedModel == 1)? 'All': this.selectedModel}`, 43, 40);
    doc.text(`Regression Status`, 20, 45); doc.text(` : ${this.selectedRegStatus.join(",")}`, 48, 45); 
    doc.line(0, 50, 300, 50);
    this.pdfHeight = 45;
        this.pdfHeight += 8;
        await doc.addImage(
            this.imgBase64,
            'png',
            5,
            this.pdfHeight,
            210,
            200,
            '',
            'FAST'
        );
        this.pdfHeight += 130;
        if (this.pdfHeight >= 251) {
            doc.addPage();
            this.pdfHeight = 20;
        }
    await doc.save('iCAT-Regression-Analysis-Report(' + (this.selectedDateRangeTxt + '-' + this.startDate.toDateString() +
     '-' + this.endDate.toDateString()) + ').pdf');
    this.dataService.loading.next(false);
}

/* converts the data into excelsheet */
downloadExcelReport(): void{ 
    let details ={
        "Type": 'Regression Analysis(' + (this.selectedDateRangeTxt + '-' + this.startDate.toDateString()+ '-' + this.endDate.toDateString()) + ')',
        "Report Date" : `${new Date()}`,
        "Generated By" : `${this.user.username}`,
        "User Selected" : `${this.selectedUser}`,
        "Device Type": this.selectedVendor,
        "Model Selected": this.selectedModel == 1 ?"All":this.selectedModel,
        "Regression Status": this.selectedRegStatus.toString()
    };
    this.excel.exportAsExcelFile("Regression Jobs Analysis Report",details,'ICAT-Regression-Analysis-Report(' + (this.selectedDateRangeTxt + '-' + this.startDate.toDateString() +
    '-' + this.endDate.toDateString()) + ')',"Regression Analysis",this.imgBase64)
    this.dataService.loading.next(false);
}


    filterBasedOnVendor() {
        this.selectedModel = 1;
        if (this.selectedVendor == "Ignite") {
            this.allModels = []
            this.modelArray.forEach((res) => {
                if (["Technicolor", "Arris", "Comcast", "Sercomm"].includes(res.deviceVendor)) {
                    this.allModels.push(res);
                }
            });
            this.filterBasedOnModel();
        } else if(this.selectedVendor == "Legacy") {
            this.allModels = []
            this.modelArray.forEach((res) => {
                if (res.deviceVendor == "Hitron") {
                    this.allModels.push(res);
                }
            });
            this.filterBasedOnModel();
        } else {
            this.allModels = this.modelArray;
            this.filterBasedOnModel();
        }
    }

    triggerEvent(ev) {
        if(!ev) {
            this.showError = false;
        }
    }

}
