
import { Component, OnInit, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';
import { DataService } from './../../../../@core/services/data.service';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import * as _ from 'lodash';
import { FormGroup, FormControl, Validators } from '../../../../../../node_modules/@angular/forms';
import { DeviceInventoryService } from '../../../../@core/services/device-inventory.service';
@Component({
    selector: 'app-monthly-detailed-analysis',
    templateUrl: './monthly-detailed-analysis.component.html',
    styleUrls: ['./monthly-detailed-analysis.component.scss']
})
export class MonthlyDetailedAnalysisComponent implements OnInit {
    user: any = null;
    allUsers: any = [];
    selectedUser: any;
    allUserNames: any = [];
    dataSubscription: any;
    selectedTeam: any;
    subscribedData: any;
    allRegressions: any = [];
    regressionsOfSelectedUser: any = [];
    firmware = [];
    selectedVendor: any;
    check = true

    defaultVendor = ["All", "Ignite", "Legacy",]
    // to store after vendor filter.

    modelArry = []
    testCasesChart = 'testCasesChart';
    regressionChart = 'regressionChart';
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/regression-analysis',
            label: 'Monthly Ops Kpi'
        }
    ];
    dateRangeArray = [
        { label: 'L1W', value: 'Last Week', attr: '1' },
        { label: 'L2W', value: 'Last 2 Weeks', attr: '2' }, { label: 'L3W', value: 'Last 3 Weeks', attr: '3' },
        { label: 'L4W', value: 'Last 4 Weeks', attr: '4' }, { label: '1M', value: 'This Month', attr: '0' },
        { label: 'L1M', value: 'Last Month', attr: '1' }, { label: 'L2M', value: 'Last 2 Months', attr: '2' },
        { label: 'L3M', value: 'Last 3 Months', attr: '3' },
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
    first: any;
    last: any;
    filteredRegressions: any;
    today = new Date();
    noData = false;
    weeklyData = {};
    xLabelName = 'X Label Name';
    selectedModel: any;
    allModels: any = [];
    formattedData: any = [];
    filteredData: any = [];
    selectedFirmware: any;
    selectedDateRangeTxt: any;
    showNoDataTxt = false;
    currentData = [];
    firmwareVersion = [];
    sub1: any;


    constructor(private dInventoryService: DeviceInventoryService, private dataService: DataService,
    ) {
        this.user = this.dataService.getCurrentUser();

        this.selectedUser = this.user.username;
        this.dataService.loading.next(true);
        this.selectedDateRange = this.dateRangeArray[0].label;
        this.selectedDateRangeTxt = this.dateRangeArray[0].value;
        // this.first = this.today.getDate() - this.today.getDay(); // First day of the week
        // this.last = this.first + 6; // last day of the week
        this.currentWeekStartDt = new Date(this.today.setDate(this.first + 1));
        this.currentWeekEndDt = new Date(this.today.setDate(this.last + 1));
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const date = new Date();
        date.setDate(date.getDate() - 30);
         this.startDate = date;
        this.endDate = new Date()
        this.range.get("start")?.setValue(new Date(this.startDate))
        this.range.get("end")?.setValue(new Date(this.endDate))
        // this.getAllModels();
        this.getAllRegressionsDayWise();
        if (this.selectedTeam) {
            this.dataService.getSettingsData().subscribe(data => {
                if (data) {

                    this.allUsers = data.users;
                    this.allUsers.forEach(element => {
                        if (element.teams.includes(this.selectedTeam)) {
                            this.allUserNames.push(element.username);
                        }
                    });
                    this.allUserNames = this.allUserNames.toLocaleString().toLowerCase().split(',');
                    this.allUserNames.sort();

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
                        obj.dut === true  || obj['deviceVendor'] == "Sercomm" || obj['deviceVendor'] == "Comcast"
                    );
                });
                this.dataService.loading.next(true);
                this.modelArry = _.sortBy(filteredmodel, 'modelName');
                this.dataService.loading.next(false);


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
                                    this.dataService.loading.next(true);
                                    this.modelArry = _.sortBy(filteredmodel, 'modelName');
                                    this.dataService.loading.next(false);
                                  
                                }
                            });

                        }
                    });


            }
            this.dataService.loading.next(false);
        });
        // this.selectedVendor =["Legacy","Ignite"]

    }
    range = new FormGroup({

        start: new FormControl(null, Validators.required),

        end: new FormControl(null, Validators.required),


    });
    ngOnInit(): void {


    }
    onSave(): void {

        this.startDate = this.range.get("start")?.value
        this.endDate = this.range.get('end')?.value
        this.selectedDateRange = ""
        this.selectedDateRangeTxt = "Customized Date range"
        this.filterBasedonVendor()


    }

    getAllModels(): void {
        this.dataService.getAllModels().subscribe(model => {
            if (model) {
                const filteredmodel = _.filter(model, obj => {
                    return (
                        obj.dut === true
                    );
                });


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
                                            obj.dut === true
                                        );
                                    });


                                }
                            });

                        }
                    });
            }
        });
    }
    filterBasedOnUser(): void {
        //  if (this.selectedUser && this.selectedUser !== 1) {
        this.getAllRegressionsDayWise();

        // } else if (this.selectedUser && this.selectedUser === 1) {
        //     this.filteredData = this.subscribedData.js;
        //     // need to add logic all users
        // }
    }
    filterBasedonVendor(): void {
        if (this.selectedVendor == "Ignite") {
            this.allModels = []
            this.modelArry.forEach((res) => {
                if (["Technicolor", "Arris", "Comcast", "Sercomm"].includes(res.deviceVendor)) {
                    this.allModels.push(res.modelName)
                }
            })
            // this.allModels = _.uniq(a)
            this.selectedModel = 1
            this.filterBasedOnModel()

        } else if(this.selectedVendor == "Legacy") {
            this.allModels = []
            this.modelArry.forEach((res) => {
                if (res.deviceVendor == "Hitron") {
                    this.allModels.push(res.modelName)
                }
            })

            // this.allModels = _.uniq(a)
            this.selectedModel = 1
            this.filterBasedOnModel()

        }else {
            this.allModels = []
            this.modelArry.forEach((res) => {
                
                    this.allModels.push(res.modelName)
               
            })

            // this.allModels = _.uniq(a)
            this.selectedModel = 1
            this.filterBasedOnModel()
        }


    }

    filterBasedOnModel(): void {

        if (this.selectedModel && this.selectedModel !== 1) {
            this.check = false
            this.currentData = []
            this.firmware = []

            // this.filteredData = tmpData?.map((element: any) => element).filter((element) => {
            //     return element.model === this.selectedModel;
            // });
            const filteredData = _.filter(this.subscribedData, { model: this.selectedModel })
            this.formattedData = this.formatData(filteredData);


            this.formattedData.dailyData?.forEach((res) => {

                res.allTC.forEach((ress) => {
                if(ress.firmwareVersion && ress.firmwareVersion !== 'NA' && ress.firmwareVersion !== ''){
                    this.firmware.push(ress.firmwareVersion)   
                }
                   
                    this.currentData.push(ress)
                })

            })
            this.firmwareVersion = _.uniq(this.firmware)
            this.selectedFirmware = 1

            this.filterBasedonFirmWare()

        } else if (this.selectedModel && this.selectedModel === 1) {
            this.check = true
            this.currentData = []
            this.firmware = []
            let newarry = []
            let max = []
            let min = []
            let maxx = []
            let max1 = []
            this.formattedData = this.formatData(this.subscribedData);

            this.allModels.forEach((res1) => {
                newarry = []
                min = []
                this.formattedData.dailyData?.forEach((res) => {

                    res.allTC.forEach((ress) => {

                        if (res1 == ress.model) {
                            this.currentData.push(ress)
                       
                            newarry.push(ress)

                            // this.currentData.push(ress)
                        }
                    })

                    // this.firmware.push(ress.firmwareVersion)

                })
                let a = _.maxBy(newarry, 'failTC')

                newarry.forEach((data) => {
                    if (data.failTC == a.failTC) {
                        min.push(data)
                    }

                })
                let b = _.maxBy(min, 'regStartedAt')

                if (b == undefined) {
                    let emptyObj = {
                        totalTC: 0,
                        passTC: 0,
                        failTC: 0,
                        model: "NA",
                        firmwareVersion: "NA",
                        job_id: "NA",


                    }
                    max1.push(emptyObj)
                } else {
                    max.push(b)
                    maxx.push(b)
                }
            })

            console.log("maxx>>>>",maxx);
            max1.forEach((r, index) => {

                if (r.model == "NA" || r.model == undefined) {
                    r.model = this.allModels[index]
                }
            })


            max = max.concat(max1)

  
            let countobj =_.countBy(this.currentData,"model")
    

            let chartData = _.without(max, undefined);      
          
                maxx.forEach((res)=>{
            
                    res.totalJobCount = countobj[res.model]
                   })
            
           
   
            let newobj = { dailyData: chartData, dateRangeDetails: this.formattedData.dateRangeDetails, allData: maxx, model: this.selectedModel, firm: this.selectedFirmware }
            this.setData(newobj);

            this.firmwareVersion = _.uniq(this.firmware)
            this.selectedFirmware = 1
            this.showNoDataTxt = maxx && maxx.length >0 ? false :true;
            this.dataService.loading.next(false);
            // this.filterBasedonFirmWare()
        }

    }

    filterBasedonFirmWare(): void {


     if(this.selectedFirmware &&this.selectedFirmware === 1  ){
   
        let b =[]
        let a =_.maxBy(this.currentData, 'failTC')
        let newArray=[]
        let min = []
        let max =[]
        this.firmwareVersion.forEach((res)=>{
        newArray=[]
        min = []
        this.currentData.forEach((ress)=>{
            if(res == ress.firmwareVersion && this.selectedModel == ress.model){
                newArray.push(ress)
            }
           
            })
            let a = _.maxBy(newArray, 'failTC')
            newArray.forEach((data) => {
                if (data.failTC == a.failTC) {
                    min.push(data)
                }
                let b = _.maxBy(min, 'regStartedAt')
                max.push(b)
        })
    })

    let countobj =_.countBy(this.currentData,"firmwareVersion")
    let tableData = _.without(max, undefined);   
    
         let d = [_.maxBy(b, "regStartedAt")]
         if(tableData[0] !=undefined){
           tableData.forEach((res)=>{
             res.totalJobCount = countobj[res?.firmwareVersion]
                })
            }
         
           let tbData =_.uniqBy(tableData,'firmwareVersion')
        
           this.showNoDataTxt = tbData && tbData.length >0 ? false :true;
            if (d[0] == undefined) {
              let newobj = { dailyData: tbData, dateRangeDetails: this.formattedData.dateRangeDetails, allData: tbData, model: this.selectedModel, firm: this.selectedFirmware }
                 this.setData(newobj);

            } else {
                 let newobj = { dailyData: tbData, dateRangeDetails: this.formattedData.dateRangeDetails, allData: tbData, model: this.selectedModel, firm: this.selectedFirmware }
                this.setData(newobj);
            }


            // b.forEach((res)=>{
            //     this.currentData.forEach((ress)=>{
            //         if(res._id == ress._id){
            //             res.highLight = true
            //         }else{
            //             res.highLight = false
            //         }
            //     })
            // })


            //  let newobj={dailyData:d,dateRangeDetails:this.formattedData.dateRangeDetails,allData:this.currentData,model:this.selectedModel,firm:this.selectedFirmware}

            //  this.setData(newobj);
            max=[]
        } else if (this.selectedFirmware && this.selectedFirmware !== 1) {

            let b = []
            let c = []
            // let a =_.maxBy(this.currentData, 'failTC')
            this.currentData.forEach((res) => {
                // res.highLight = false
                if (res.firmwareVersion == this.selectedFirmware && res.model == this.selectedModel) {
                    // res.highLight = true
                    b.push(res)
                }

            })
            let a = _.maxBy(b, 'failTC')
            let countobj =_.countBy(b,"firmwareVersion")
         
            b.forEach((res) => {
            if (a.failTC == res.failTC) {
                 c.push(res)
                }
            })

            let e = [_.maxBy(c, 'regStartedAt')]
            if(e[0] !=undefined){
                console.log("inside if")
                e.forEach((res)=>{
                    res.totalJobCount = countobj[res?.firmwareVersion]
                })
            }
            this.showNoDataTxt = e && e.length >0 ? false :true;
            if (e[0] == undefined) {
                let newobj = { dailyData: [], dateRangeDetails: this.formattedData.dateRangeDetails, allData: e, model: this.selectedModel, firm: this.selectedFirmware }

                this.setData(newobj);

            } else {
                let newobj = { dailyData: e, dateRangeDetails: this.formattedData.dateRangeDetails, allData: e, model: this.selectedModel, firm: this.selectedFirmware }

                this.setData(newobj);
            }

            // b.forEach((res)=>{
            //     c.forEach((ress)=>{
            //         if(res._id == ress._id){
            //             res.highLight = true
            //         }else{
            //             res.highLight = false
            //         }
            //     })
            // })


        }


    }
    formatData(data: any): any {

        let finalData = {};
        const dailyData = this.groupByDate(data);
        this.showNoDataTxt = dailyData.length == 0 ? true : false;
        const dateRangeDetails = [{ startDate: this.startDate, endDate: this.endDate, desc: this.selectedDateRangeTxt }];
        finalData = { ...finalData, dailyData };
        finalData = { ...finalData, dateRangeDetails };

        return finalData;
    }

    groupByDate(data: any): any {
        let dailyOutput = {};
        const regressonList = [];
        const filteredRegressions = data?.map((element: any) => element).filter((element) => {

            return ((new Date(element.regStartedAt).setHours(0, 0, 0, 0) >= this.startDate.setHours(0, 0, 0, 0))
                && (new Date(element.regStartedAt).setHours(0, 0, 0, 0) <= this.endDate.setHours(0, 0, 0, 0)));
        });
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
        this.selectedModel = 1;
        this.selectedFirmware = 1;
        this.selectedVendor = "Ignite";
        this.filteredData = [];
        this.dataService.loading.next(true);
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        const regDt = this.dataService.allRegressionDetails.subscribe(data => {
            console.log("data>>>", data);
            if (data) {
                this.subscribedData = data;
                console.log("subscribedData>>>", this.subscribedData);
                this.filteredData = this.subscribedData;
                this.formattedData = this.formatData(this.filteredData);
                // this.setData(this.formattedData);
                setTimeout(()=>{
                    this.filterBasedonVendor()
                },10)
              

            } else {
                this.dataService.regressionNoData.next(true);
                this.dataService.loading.next(false);
            }
        });
    }

    setData(data: any): void {
        this.dataService.regressionAnalysisDetails.next(data);
        this.dataService.regressionNoData.next(false);
        this.dataService.loading.next(false);
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
        this.range.get("start")?.setValue(new Date(this.startDate))
        this.range.get("end")?.setValue(new Date(this.endDate))
        this.filterBasedonVendor()
    }

    setDateRangeForWeeks(sDtRange: any): void {
        if (sDtRange.attr === '0') {
            this.startDate = this.currentWeekStartDt;
            this.endDate = this.currentWeekEndDt;



        } else {

            const NoOfDays = 7 * sDtRange.attr;
            this.startDate = new Date(this.currentWeekStartDt - NoOfDays * 24 * 60 * 60 * 1000);
            this.endDate = new Date(this.currentWeekEndDt - 7 * 24 * 60 * 60 * 1000);
            this.range.get("start")?.setValue(new Date(this.startDate))
            this.range.get("end")?.setValue(new Date(this.endDate))

        }
    }

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
        this.range.get("start")?.setValue(new Date(this.startDate))
        this.range.get("end")?.setValue(new Date(this.endDate))
    }


}
