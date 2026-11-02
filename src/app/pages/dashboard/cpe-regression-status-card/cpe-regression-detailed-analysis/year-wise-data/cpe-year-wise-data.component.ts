import { Router } from '@angular/router';
import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit } from '@angular/core';
import jsPDF  from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as _ from 'lodash';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
    selector: 'app-cpe-year-wise-analysis',
    templateUrl: './cpe-year-wise-data.component.html',
    styleUrls: ['./cpe-year-wise-data.component.scss']
})
export class CPEYearWiseAnalysisComponent implements OnInit {
    user;
    allData = {};
    monthlyData = {};
    currentData;
    loading = true;
    viewBy = 'vendors'
    timeFrame = 'allData';
    oldTimeFrame = 'allData';
    pieChartType = 'totalTC';
    chartLabel = { totalTC: 'Total TC', passTC: 'Pass TC', failTC: 'Fail TC', norunTC: 'No Run' }
    chartInput;
    chartInputPIE;
    colors;
    chartInstance;
    chartInstancePIE;
    allYears = [];
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    sub6;
    sub7;
    pdfHeight = 0;
    vendorData;
    originalVendorData;
    vendorChartData = {};
    modelData;
    originalModelData;
    modelChartData = {};
    yearWiseModelData;
    yearWiseVendorData;
    monthWiseModelData;
    monthWiseVendorData;
    showDeviceUtilizationChart: boolean = true;
    themeSubscription;
    allCharts = {};
    dataName = 'vendor';
    xAxisName = "Vendor Name";
    selectedVendor = "All";
    selectedModel = "All";
    selectedVendorDevice: any = "All";
    selectedModelDevice: any = "All";
    devicesInTable;
    finalDeviceData;
    showTable: boolean = false;
    showBackButton = 0;
    allModels = [];
    allVendors;
    allDevices;
    allDeviceNames= [];
    allModelNames = [];
    allVendorNames= [];
    allProfiles= [];
    
    finalCreatedDate;
    maxDate: any;
    minDate: any;
    minEndDate: any;
    filteredEndMonth: any;
    filteredEndYear: any;
    filteredMonth: any;
    filteredYear: any;
    finalMonthData = {};
    finalVendorMonthData = [];
    finalModelMonthData = [];
    monthNames = [null, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    selectedTeam: String;
    is_cpe_analysis_Specific_clients: boolean = false;
    constructor( public dataService: DataService, private router: Router,private dInventoryService: DeviceInventoryService,  private userService: UserService) {
        this.user = this.dataService.getCurrentUser();
        this.sub4 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
                var config= this.dataService.getTeamDashBoardConfig(team);
                if(config.show_cpe_analysis_Specific_clients && config.show_cpe_analysis_Specific_clients == true){
                    this.is_cpe_analysis_Specific_clients = true;
                } 
                console.log("this.selectedTeam>>>>",this.selectedTeam, this.is_cpe_analysis_Specific_clients);    
            }
           
        });
        
        this.sub2 = this.dataService.CPERegressionAnalysisData.subscribe(data => {
            if (data) {
                this.allData = data['yearlyData'];
                this.monthlyData = data['monthlyData'];
                this.vendorData = data['vendorData'];
                this.originalVendorData = data['vendorData'];
                this.modelData = data['modelData'];
                this.originalModelData = data['modelData'];
                this.monthWiseModelData = data['monthWiseModelData'];
                this.monthWiseVendorData = data['monthWiseVendorData'];
                this.yearWiseModelData = data['yearWiseModelData'];
                this.yearWiseVendorData = data['yearWiseVendorData'];
                this.getYears()
                this.processData();
                this.loadVendorDeviceData();
                this.loading = false;
            }
        })
        
        
        this.sub3 = this.dataService.getAllModels().subscribe(model => {
            if (model) {
                this.allModelNames = [];
                this.allModels = _.sortBy(model, 'modelName');
                let models = [];
                if(this.is_cpe_analysis_Specific_clients && this.allModels.length > 0) {
                    this.sub6 = this.dataService.getAllProfiles().subscribe((profiles) => {
                        if (profiles) {
                            this.allProfiles = _.filter(profiles, obj => {
                                return obj && obj['connected_clients'] && obj['connected_clients'] == true 
                            });
                            let temp = [];
                            this.allProfiles.forEach(profile => {
                               temp = [];
                               temp = this.allModels.filter(ele => {
                                return ele.profileName === profile.profileName;
                               });
                               models = [...models, ...temp];

                            });
                            this.allModels = models;
                            this.allModels.forEach((mdl) => {
                                this.allModelNames.push(mdl.modelName);
                            });
                        }
                    });
                } else {
                    this.allModels.forEach((mdl) => {
                        this.allModelNames.push(mdl.modelName);
                    });
                    if (!this.allModelNames.includes('All')) {
                        this.allModelNames.splice(0, 0, 'All');
                    }
                }
                console.log("this.allModels in if>>>>",this.allModels);
                this.getConnectedClientsVendorModel();
            } else {
                this.allModelNames = [];
                this.sub3 = this.dInventoryService
                    .getAllData()
                    .subscribe((data) => {
                        if (data) {
                            this.dataService.getDeviceInventoryData().next(data);
                            this.dataService.getAllModels().subscribe(models => {
                                if (models) {
                                    this.allModels = _.sortBy(models, 'modelName');
                                    const tempModels = [];
                                    if (this.is_cpe_analysis_Specific_clients) {
                                        this.sub6 = this.dataService.getAllProfiles().subscribe((profiles) => {
                                            if (profiles) {
                                                this.allProfiles = _.filter(profiles, obj => {
                                                    return obj && obj['connected_clients'] && obj['connected_clients'] == true
                                                });
                                                let temp = [];
                                                this.allProfiles.forEach(profile => {
                                                    temp = [];
                                                    temp = this.allModels.filter(ele => {
                                                        return ele.profileName === profile.profileName;
                                                    });
                                                    tempModels.push(temp);
                                                });
                                                this.allModels = tempModels;
                                                this.allModels.forEach((mdl) => {
                                                    this.allModelNames.push(mdl.modelName);
                                                });
                                            }

                                        });

                                    } else {
                                        this.allModels.forEach((mdl) => {
                                            this.allModelNames.push(mdl.modelName);
                                        });
                                        if (!this.allModelNames.includes('All')) {
                                            this.allModelNames.splice(0, 0, 'All');
                                        }
                                    }

                                }
                            });
                        }
                    });
                    console.log("this.allModels i else>>>>",this.allModels);
                    this.getConnectedClientsVendorModel();
            }
            console.log("this.allModels>>>>",this.allModels);
           
        });

        
        this.sub5 = this.dataService
            .getAllDevices()
            .subscribe((devices) => {
                if (devices) {
                    this.allDevices = devices;
                    this.allDevices.forEach((device) => {
                        this.allDeviceNames.push(device.deviceName);
                    });
                }
            });
        
    }


    ngOnInit(): void {
        this.selectedVendor = 'All';
        this.selectedModel = 'All';
        this.selectedVendorDevice = 'All';
        this.sub1 = this.dataService.sideBarOnToggle.subscribe(data => {
            if (data && this.chartInstance) {
                let idCount = 0;
                const id = setInterval(() => {
                    idCount++;
                    if (this.chartInstance) {
                        this.chartInstance.resize();
                    }
                    if (this.chartInstancePIE) {
                        this.chartInstancePIE.resize()
                    }
                    if (idCount > 5) {
                        idCount = 0;
                        clearInterval(id)
                    }
                }, 100)
            }
        });
        
       
    }

    // Method that is called when start month is changed in the month picker
    public monthChanged(value: any, picker: any, input: any): void {
        const array = value.toString().split(' ');
        const year = Number(array[3]);
        const month = ('0' + (this.monthNames.indexOf(array[1])).toString()).slice(-2);
        this.filteredYear = year;
        this.filteredMonth = this.monthNames.indexOf(array[1]);
        input.value = month + '/' + year;

        if ((!this.filteredEndMonth && !this.filteredEndYear) || (this.filteredEndMonth < this.filteredMonth
            && !(this.filteredYear < this.filteredEndYear)) || (this.filteredYear > this.filteredEndYear)) {
            const endMonth = document.getElementById('pickerInput2') as HTMLInputElement | null;
            endMonth.value = month + '/' + year;
            this.filteredEndMonth = this.filteredMonth;
            this.filteredEndYear = this.filteredYear;
        }
        picker.close();
        this.fetchFilteredMonthsData();
        this.processData();
    }

    // Method that is called when end month is changed in the month picker
    public endMonthChanged(value: any, picker: any, input: any): void {
        const array = value.toString().split(' ');
        this.filteredEndYear = Number(array[3]);
        this.filteredEndMonth = this.monthNames.indexOf(array[1]);
        const month = ('0' + (this.monthNames.indexOf(array[1])).toString()).slice(-2);
        const year = Number(array[3]);
        input.value = month + '/' + year;
        picker.close();
        this.fetchFilteredMonthsData();
        this.processData();
    }

    // Method to combine data for specified months in specified year
    fetchFilteredMonthsData() {
        let startMonth = this.filteredMonth ? this.filteredMonth : 1;
        let endMonth = this.filteredEndMonth ?this.filteredEndMonth : 12;
        let year = this.filteredYear ? this.filteredYear : this.timeFrame;
        let view = (this.viewBy == "models") ? "model" : "vendor";
        let data = this.monthlyData[view][year];
        let keys = Object.keys(this.monthlyData[view][year]);
        this.finalMonthData = {};
        this.finalMonthData[year] = {};
        //Calculation for CPE Regression Analysis chart
        for (let i = 0; i < keys.length; i++) {
            let result = data[keys[i]];
            let passCount = 0;
            let failCount = 0;
            let norunCount = 0;
            let totalCount = 0;
            for (let j = startMonth; j <= endMonth; j++) {
                let monthData = result[j];
                passCount = passCount + monthData['passTC'];
                failCount = failCount + monthData['failTC'];
                norunCount = norunCount + monthData['norunTC'];
                totalCount = totalCount + monthData['totalTC'];
            }
            if (totalCount > 0) {
                this.finalMonthData[year][keys[i]] = { passTC: passCount, failTC: failCount, norunTC: norunCount, totalTC: totalCount };
            }
        }
        //Calculation for Vendor Chart
        if (this.monthWiseVendorData[year]) {
            data = this.monthWiseVendorData[year];
            keys = Object.keys(this.monthWiseVendorData[year]);
            this.finalVendorMonthData = [];
            for (let i = 0; i < keys.length; i++) {
                let result = data[keys[i]];
                let totalUtilizedHours = 0;
                let totalDiffHours = 0;
                let totalDuration = 0;
                let totalNoOfReservations = 0;
                for (let j = startMonth; j <= endMonth; j++) {
                    let monthData = result[j];
                    totalUtilizedHours = totalUtilizedHours + Number(monthData['totalUtilizedHours']);
                    totalDiffHours = totalDiffHours + Number(monthData['totalDiffHours']);
                    totalDuration = totalDuration + Number(monthData['totalDuration']);
                    totalNoOfReservations = totalNoOfReservations + Number(monthData['totalNoOfReservations']);
                }
                if (totalNoOfReservations > 0) {
                    this.finalVendorMonthData.push({
                        "vendor": keys[i],
                        "totalUtilizedHours": totalUtilizedHours,
                        "totalDiffHours": totalDiffHours,
                        "totalDuration": Number(totalDuration.toFixed(2)),
                        "totalNoOfReservations": totalNoOfReservations,
                        "totalUtlizedPercentage": Number(((totalUtilizedHours / totalDiffHours) * 100).toFixed(2))
                    });
                }
            }
        }
        //Calculation for Model Chart
        if (this.monthWiseModelData[year]) {
            data = this.monthWiseModelData[year];
            keys = Object.keys(this.monthWiseModelData[year]);
            this.finalModelMonthData = [];
            for (let i = 0; i < keys.length; i++) {
                let result = data[keys[i]];
                let totalUtilizedHours = 0;
                let totalDiffHours = 0;
                let totalDuration = 0;
                let totalNoOfReservations = 0;
                for (let j = startMonth; j <= endMonth; j++) {
                    let monthData = result[j];
                    totalUtilizedHours = totalUtilizedHours + Number(monthData['totalUtilizedHours']);
                    totalDiffHours = totalDiffHours + Number(monthData['totalDiffHours']);
                    totalDuration = totalDuration + Number(monthData['totalDuration']);
                    totalNoOfReservations = totalNoOfReservations + Number(monthData['totalNoOfReservations']);
                }
                if (totalNoOfReservations > 0) {
                    this.finalModelMonthData.push({
                        "model": keys[i],
                        "totalUtilizedHours": totalUtilizedHours,
                        "totalDiffHours": totalDiffHours,
                        "totalDuration": totalDuration,
                        "totalNoOfReservations": totalNoOfReservations,
                        "totalUtlizedPercentage": Number(((totalUtilizedHours / totalDiffHours) * 100).toFixed(2))
                    });
                }
            }
        }
        //this.processData();
    }

    // Method to clear selected months from the picker
    onClear() {
        const input = document.getElementById('pickerInput') as HTMLInputElement | null;
        input.value = null;
        const input2 = document.getElementById('pickerInput2') as HTMLInputElement | null;
        input2.value = null;
        this.filteredEndYear = null;
        this.filteredEndMonth = null;
        this.filteredYear = null;
        this.filteredMonth = null;
        this.processData();
    }

    // Method to set min and max month in the month picker based on the year selected
    private setMinMaxValues(): void {
        this.minDate = new Date(Number(this.timeFrame), 0, 1);
        this.minEndDate = new Date(Number(this.timeFrame), 0, 1);
        this.maxDate = Number(this.timeFrame) === new Date().getFullYear() ? new Date() : new Date(Number(this.timeFrame), 11, 31);
    }

    // Method to calulate diffHours and utilizationPercentage for specified months in specified year
    calculateDiffHoursAndUtilizationPercentage(originalData) {
        let startMonth = this.filteredMonth ? this.filteredMonth : null;
        let endMonth = this.filteredEndMonth ? this.filteredEndMonth : this.filteredMonth;
        let data = JSON.parse(JSON.stringify(originalData));
        let currentDate = new Date();
        let finalCheckDate;
        let tempStartCheckDate;
        //Setting some intial start date and end date
        if (this.timeFrame != 'allData') {
            if (startMonth && endMonth) {
                tempStartCheckDate = new Date(Number(this.timeFrame), startMonth-1, 1);
                finalCheckDate = new Date(Number(this.timeFrame), endMonth-1, 31);
            } else {
                tempStartCheckDate = new Date(Number(this.timeFrame), 0, 1);
                finalCheckDate = new Date(Number(this.timeFrame), 11, 31);
            }
        } else {
            tempStartCheckDate = new Date(Number(currentDate.getFullYear()), 0, 1);
            finalCheckDate = new Date(Number(currentDate.getFullYear()), 11, 31);
        }
        if (!(startMonth && endMonth)) {
            if ((currentDate.getFullYear() == finalCheckDate.getFullYear())) {
                finalCheckDate = currentDate;
            }
        }
        let totalWiseUtilizedHours = 0;
        let totalWiseDiffHours = 0;
        let totalDuration = 0;
        let totalReservations = 0;
        for(let i = 0; i < data.length; i++) {
            totalWiseUtilizedHours = 0;
            totalWiseDiffHours = 0;
            totalDuration = 0;
            totalReservations = 0;
            let result = data[i].devices;
            if (this.timeFrame != 'allData') {
                if (startMonth && endMonth) {
                    result = data[i].devices.filter(obj => (obj.year == this.timeFrame) && ((obj.month >= startMonth) && (obj.month <= endMonth)));
                } else {
                    result = data[i].devices.filter(obj => obj.year == Number(this.timeFrame));
                }
            }
            for(let j = 0; j < result.length; j++) {
                //Setting final start date based on the created date
                let startCheckDate = new Date(result[j].createdAt);
                if (this.timeFrame != 'allData') {
                    if (startCheckDate.getFullYear() != tempStartCheckDate.getFullYear()) {
                        startCheckDate = tempStartCheckDate;
                    }
                }
                if (startCheckDate > finalCheckDate) {
                    continue;
                }
                let temp = Math.ceil((Math.abs(startCheckDate.getTime() - finalCheckDate.getTime())) / (1000 * 3600));
                result[j].diffHours = temp;
                result[j].utlizedPercentage = Number(((result[j].utilizedHours / temp) * 100).toFixed(2));
                totalWiseUtilizedHours = totalWiseUtilizedHours + Number(result[j].utilizedHours);
                totalWiseDiffHours = totalWiseDiffHours + Number(result[j].diffHours);
                totalDuration = totalDuration + Number(result[j].duration);
                totalReservations = totalReservations + Number(result[j].noOfReservation);
            }
            data[i].devices = result;
            data[i].totalUtilizedHours = totalWiseUtilizedHours;
            data[i].totalDiffHours = totalWiseDiffHours;
            data[i].totalDuration = Number(totalDuration.toFixed(2));
            data[i].totalNoOfReservations = totalReservations;
            data[i].totalUtlizedPercentage = Number(((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2));
        }
        data = data.filter(obj => obj.totalNoOfReservations>0);
        return data;
    }

    // Method to show vendor wise data in Vendor Device Utilization chart
    loadVendorDeviceData() {
        this.showBackButton = 0;
        this.xAxisName = "Vendor Name";
        const temp = {};
        temp['sevenDays'] = [];
        temp['thirtyDays'] = [];
        temp['allDays'] = [];
        if ( this.timeFrame == 'allData') {
            temp['allDays'] = this.calculateDiffHoursAndUtilizationPercentage(this.originalVendorData);
        } else {
            if (this.finalVendorMonthData && this.finalVendorMonthData.length) {
                this.finalVendorMonthData = this.calculateDiffHoursAndUtilizationPercentage(this.originalVendorData);
                temp['allDays'] = this.finalVendorMonthData;
            } else {
                if (this.yearWiseVendorData[this.timeFrame] && (Object.values(this.yearWiseVendorData[this.timeFrame])).length) {
                    temp['allDays'] = this.calculateDiffHoursAndUtilizationPercentage(this.originalVendorData);
                    this.vendorData = temp['allDays'];
                }
            }
        }
        if (temp['allDays'] && temp['allDays'].length) {
            this.showDeviceUtilizationChart = true;
        } else {
            this.showDeviceUtilizationChart = false;
        }
        const details = {};
        details['xAxisName'] = 'Vendor Names';
        details['yAxisName'] = 'No. of Reservations/ Duration(Hours)';
        details['keys'] = ['totalNoOfReservations', 'totalDuration', 'totalUtlizedPercentage'];
        details['legends'] = ['No of Reservation', 'Duration(Hours)', 'Utilization(%)'];
        details['seriesDetails'] = [{
            name: 'No of Reservation',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        },
        {
            name: 'Duration(Hours)',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        },
        {
            name: 'Utilization(%)',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        }]
        this.vendorChartData = { data: temp, details };
    }

    // Method to show model wise data in Model Device Utilization chart
    loadModelDeviceData() {
        this.showBackButton = 0;
        this.xAxisName = "Model Name";
        const temp = {};
        temp['sevenDays'] = [];
        temp['thirtyDays'] = [];
        temp['allDays'] = [];
        if ( this.timeFrame == 'allData' ) {
            temp['allDays'] = this.calculateDiffHoursAndUtilizationPercentage(this.originalModelData);
        } else {
            if (this.finalModelMonthData && this.finalModelMonthData.length) {
                this.finalModelMonthData = this.calculateDiffHoursAndUtilizationPercentage(this.originalModelData);
                temp['allDays'] = this.finalModelMonthData;
            } else {
                if (this.yearWiseModelData[this.timeFrame] && (Object.values(this.yearWiseModelData[this.timeFrame])).length) {
                    temp['allDays'] = this.calculateDiffHoursAndUtilizationPercentage(this.originalModelData);
                    this.modelData = temp['allDays'];
                }
            }
        }
        if (temp['allDays'] && temp['allDays'].length) {
            this.showDeviceUtilizationChart = true;
        } else {
            this.showDeviceUtilizationChart = false;
        }
        const details = {};
        details['xAxisName'] = 'Model Names';
        details['yAxisName'] = 'No. of Reservations/ Duration(Hours)';
        details['keys'] = ['totalNoOfReservations', 'totalDuration', 'totalUtlizedPercentage'];
        details['legends'] = ['No of Reservation', 'Duration(Hours)', 'Utilization(%)'];
        details['seriesDetails'] = [{
            name: 'No of Reservation',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        },
        {
            name: 'Duration(Hours)',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        },
        {
            name: 'Utilization(%)',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        }]
        this.modelChartData = { data: temp, details };
    }

    // Method to show monthwise data in chart for selected model/vendor in Vendor/Model Device Utilization chart
    loadModelOrVendorDevicesData(data) {
        this.xAxisName = "Months";
        const temp = {};
        temp['sevenDays'] = [];
        temp['thirtyDays'] = [];
        temp['allDays'] = data;
        if (temp['allDays'] && temp['allDays'].length) {
            this.showDeviceUtilizationChart = true;
        } else {
            this.showDeviceUtilizationChart = false;
        }
        const details = {};
        details['xAxisName'] = 'Months';
        details['yAxisName'] = 'No. of Reservations/ Duration(Hours)';
        details['keys'] = ['totalNoOfReservations', 'totalDuration', 'totalUtlizedPercentage'];
        details['legends'] = ['No of Reservation', 'Duration(Hours)', 'Utilization(%)'];
        details['seriesDetails'] = [{
            name: 'No of Reservation',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        },
        {
            name: 'Duration(Hours)',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        },
        {
            name: 'Utilization(%)',
            type: 'bar',
            data: [],
            barMinHeight: 2,
        }]
        if (this.viewBy==='models') {
            this.modelChartData = { data: temp, details };
        } else {
            this.vendorChartData = { data: temp, details };
        }
    }

    // Method to format data to monthwise data when months are selected for chart for selected model/vendor in Vendor/Model Device Utilization chart
    updateCharts(event){
        let startMonth = this.filteredMonth ? this.filteredMonth : null;
        let endMonth = this.filteredEndMonth ? this.filteredEndMonth : this.filteredMonth;
        if (event.name) {
            let monthData;
            if (startMonth && endMonth) {
                if (this.viewBy==='models') {
                    monthData = this.finalModelMonthData.filter(obj => obj.model == event.name);
                    this.selectedModel = event.name;
                } else {
                    monthData = this.finalVendorMonthData.filter(obj => obj.vendor == event.name);
                    this.selectedVendor = event.name;
                }
                if (monthData) {
                    let data = monthData[0].devices;
                    let finalMonthData = {};
                    for (let i = 0; i < data.length; i++) {
                        if (!finalMonthData[data[i].month]) {
                            finalMonthData[data[i].month] = {
                                "totalNoOfReservations": Number(data[i].noOfReservation),
                                "totalDuration": Number(data[i].duration),
                                "totalUtilizedHours": Number(data[i].utilizedHours),
                                "totalDiffHours": Number(data[i].diffHours),
                                "totalUtlizedPercentage": ((Number(data[i].utilizedHours) / Number(data[i].diffHours)) * 100).toFixed(2)
                            };
                        } else {
                            finalMonthData[data[i].month] = {
                                "totalNoOfReservations": finalMonthData[data[i].month].totalNoOfReservations + Number(data[i].noOfReservation),
                                "totalDuration": Number((finalMonthData[data[i].month].totalDuration + Number(data[i].duration)).toFixed(2)),
                                "totalUtilizedHours": finalMonthData[data[i].month].totalUtilizedHours + Number(data[i].utilizedHours),
                                "totalDiffHours": finalMonthData[data[i].month].totalDiffHours + Number(data[i].diffHours),
                                "totalUtlizedPercentage": ((finalMonthData[data[i].month].totalUtilizedHours + Number(data[i].utilizedHours)) / (finalMonthData[data[i].month].totalDiffHours + Number(data[i].diffHours)) * 100).toFixed(2)
                            }
                        }
                    }
                    let monthobj = {
                        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
                        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
                    }
                    let keys = Object.keys(finalMonthData)
                    for(let i = 0 ; i< keys.length; i++) {
                        finalMonthData[keys[i]]['month'] = monthobj[keys[i]];
                    }
                    this.dataName = 'month';
                    this.showBackButton = 1;
                    this.changeDeviceData();
                    this.loadModelOrVendorDevicesData(Object.values(finalMonthData));
                }
            } else {
                if (this.viewBy==='models') {
                    monthData = this.monthWiseModelData[this.timeFrame][event.name];
                    this.selectedModel = event.name;
                } else {
                    monthData = this.monthWiseVendorData[this.timeFrame][event.name];
                    this.selectedVendor = event.name;
                }
                if (monthData) {
                    let monthobj = {
                        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
                        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
                    }
                    let keys = Object.keys(monthData)
                    for(let i = 0 ; i< keys.length; i++) {
                        monthData[keys[i]]['month'] = monthobj[i+1];
                    }
                    this.dataName = 'month';
                    this.showBackButton = 1;
                    this.changeDeviceData();
                    this.loadModelOrVendorDevicesData(Object.values(monthData));
                }
            }
        }
        this.allCharts = {...this.allCharts, ...event};
    }

    // Method to get all devices that belong to selected model/vendor in Device Utilization card
    changeDeviceData() {
        let result = this.allDevices;
        let uniqueDevices; 
        this.devicesInTable = [];
        this.finalDeviceData = {};
        this.selectedVendorDevice = 'All';
        this.selectedModelDevice = 'All';
        this.showTable = false;
        if (this.viewBy === 'models') {
            result = this.allDevices.filter(obj => obj.model == this.selectedModel);
            uniqueDevices = [...new Set(result.map(obj => obj.deviceName))];
        } else {
            result = this.allDevices.filter(obj => obj.vendor == this.selectedVendor);
            uniqueDevices = [...new Set(result.map(obj => obj.deviceName))];
        }
        uniqueDevices.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
        this.devicesInTable = uniqueDevices;
        if ((this.selectedModel && this.selectedModel != "All" ) || (this.selectedVendor && this.selectedVendor != "All")) {
            this.calculateConsolidatedDeviceData();
        }
    }

    /* 
        Method to calculate utlization for selected model/vendor in Device Utilization card
        If no device is selected then consolidated utilization of all the devices is calculated
        If specific year is selected, devices are filtered based year, if specific months are selected, devices are filtered based on specified months in selected year
    */
    calculateConsolidatedDeviceData() {
        let startMonth = this.filteredMonth ? this.filteredMonth : null;
        let endMonth = this.filteredEndMonth ? this.filteredEndMonth : this.filteredMonth;
        let deviceName;
        let result;
        if (this.viewBy === 'models') {
            deviceName = this.selectedModelDevice;
            let modelDevices = this.originalModelData.filter(obj => obj.model == this.selectedModel)[0];
            if (modelDevices) {
                if (this.timeFrame != "allData") {
                    if (startMonth && endMonth) {
                        result = modelDevices.devices.filter(obj => (obj.year == this.timeFrame) && ((obj.month >= startMonth) && (obj.month <= endMonth)));
                    } else {
                        result = modelDevices.devices.filter(obj => obj.year == this.timeFrame);
                    }
                    if (!deviceName || (deviceName == "All")) {
                        deviceName = "All Devices";
                    } else {
                        result = result.filter(obj => obj.deviceName == deviceName);
                    }
                } else {
                    if (!deviceName || (deviceName == "All")) {
                        deviceName = "All Devices";
                        result = modelDevices.devices;
                    } else {
                        result = modelDevices.devices.filter(obj => obj.deviceName == deviceName);
                    }
                }
            }
        } else {
            deviceName = this.selectedVendorDevice;
            let vendorDevices = this.originalVendorData.filter(obj => obj.vendor == this.selectedVendor)[0];
            if (vendorDevices) {
                if (this.timeFrame != "allData") {
                    if (startMonth && endMonth) {
                        result = vendorDevices.devices.filter(obj => (obj.year == this.timeFrame) && ((obj.month >= startMonth) && (obj.month <= endMonth)));
                    } else {
                        result = vendorDevices.devices.filter(obj => obj.year == this.timeFrame);
                    }
                    if (!deviceName || (deviceName == "All")) {
                        deviceName = "All Devices";
                    } else {
                        result = result.filter(obj => obj.deviceName == deviceName);
                    }
                } else {
                    if (!deviceName || (deviceName == "All")) {
                        deviceName = "All Devices";
                        result = vendorDevices.devices;
                    } else {
                        result = vendorDevices.devices.filter(obj => obj.deviceName == deviceName);
                    }
                }
            }
        }
        if (result) {
            let currentDate = new Date();
            let finalCheckDate;
            let tempStartCheckDate;
            //Setting some intial start date and end date
            if (this.timeFrame != 'allData') {
                if (startMonth && endMonth) {
                    tempStartCheckDate = new Date(Number(this.timeFrame), startMonth-1, 1);
                    finalCheckDate = new Date(Number(this.timeFrame), endMonth-1, 31);
                } else {
                    tempStartCheckDate = new Date(Number(this.timeFrame), 0, 1);
                    finalCheckDate = new Date(Number(this.timeFrame), 11, 31);
                }
            } else {
                tempStartCheckDate = new Date(Number(currentDate.getFullYear()), 0, 1);
                finalCheckDate = new Date(Number(currentDate.getFullYear()), 11, 31);
            }
            if (!(startMonth && endMonth)) {
                if ((currentDate.getFullYear() == finalCheckDate.getFullYear())) {
                    finalCheckDate = currentDate;
                }
            }
            let totalWiseUtilizedHours = 0;
            let totalWiseDiffHours = 0;
            let totalWiseDuration = 0;
            let totalReservations = 0;
            for(let j = 0; j < result.length; j++) {
                //Setting final start date based on the created date
                let startCheckDate = new Date(result[j].createdAt);
                if (this.timeFrame != 'allData') {
                    if (startCheckDate.getFullYear() != tempStartCheckDate.getFullYear()) {
                        startCheckDate = tempStartCheckDate;
                    }
                }
                if (startCheckDate > finalCheckDate) {
                    continue;
                }
                let temp = Math.ceil((Math.abs(startCheckDate.getTime() - finalCheckDate.getTime())) / (1000 * 3600));
                result[j].diffHours = temp;
                result[j].utlizedPercentage = Number(((result[j].utilizedHours / temp) * 100).toFixed(2));
                totalWiseUtilizedHours = totalWiseUtilizedHours + Number(result[j].utilizedHours);
                totalWiseDiffHours = totalWiseDiffHours + Number(result[j].diffHours);
                totalWiseDuration = totalWiseDuration + Number(result[j].duration);
                totalReservations = totalReservations + Number(result[j].noOfReservation);
            }
            //let totalNoOfReservations = result.reduce((n, { noOfReservation }) => n + noOfReservation, 0);
            //let totalDuration = result.reduce((n, { duration }) => n + duration, 0);
            //let totalDiffHours = result.reduce((n, { diffHours }) => n + diffHours, 0);
            //let totalutilizedHours = result.reduce((n, { utilizedHours }) => n + utilizedHours, 0).toFixed(2);
            let totalUtlizedPercentage = !isNaN(totalWiseUtilizedHours) && !isNaN(totalWiseDiffHours) && totalWiseUtilizedHours > 0 && totalWiseDiffHours > 0 ? ((totalWiseUtilizedHours / totalWiseDiffHours) * 100).toFixed(2) : 0;        
            this.finalDeviceData = { "deviceName": deviceName, "totalDuration": totalWiseDuration, "totalNoOfReservations": totalReservations, "totalDiffHours": totalWiseDiffHours, "totalutilizedHours": totalWiseUtilizedHours.toFixed(2), "totalUtlizedPercentage": totalUtlizedPercentage };
            this.showTable = true;
        }
    }

    return(): void {
        if (this.viewBy==='models') {
            this.dataName = 'model';
            this.showBackButton = 0;
            this.loadModelDeviceData();
        } else {
            this.dataName = 'vendor';
            this.showBackButton = 0;
            this.loadVendorDeviceData();
        }
    }

    // Changes data based on selection type vendor or model. Landing value is vendor
    viewByChange() {
        console.log("viewByChange",this.viewBy,  this.allModelNames, this.allVendorNames);
        if (this.filteredEndMonth || this.filteredMonth) {
            this.onClear();
        }
        if (this.viewBy==='models') {
            this.dataName = 'model';
            this.showBackButton = 0;
            this.loadModelDeviceData();
        } else {
            this.dataName = 'vendor';
            this.showBackButton = 0;
            this.loadVendorDeviceData();
        }
        console.log("viewByChange111", this.allModelNames);
        this.processData();
    }
    /* gets all the years of data */
    getYears() {
        let allYears = Object.keys(this.allData);
        this.allYears = allYears;
    }
    /* based on selected data process the value */
    processData() {
        this.allModelNames = this.allModelNames.filter(element => {
            return element !== undefined;
         });
        if (this.timeFrame != 'allData') {
            this.setMinMaxValues();
        } else {
            this.finalMonthData = {};
        }
        if ((this.oldTimeFrame != this.timeFrame) && (this.filteredMonth || this.filteredEndMonth)) {
            const input = document.getElementById('pickerInput') as HTMLInputElement | null;
            input.value = null;
            const input2 = document.getElementById('pickerInput2') as HTMLInputElement | null;
            input2.value = null;
            this.filteredEndYear = null;
            this.filteredEndMonth = null;
            this.filteredYear = null;
            this.filteredMonth = null;
        }
        this.selectedVendorDevice = 'All';
        this.selectedModelDevice = 'All';
        this.devicesInTable = [];
        this.finalDeviceData = {};
        this.selectedModel = "All";
        this.selectedVendor = "All";
        this.showTable = false;
            const xAxis = [];
            const yAxis = [{ name: 'Passed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }, { name: 'Failed TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }, { name: 'No Run TC', stack: 'a', data: [], type: 'bar', barMinHeight: 2, barMaxWidth: 80 }]
            if (this.filteredMonth || this.filteredEndMonth) {
                this.fetchFilteredMonthsData();
            }
            if (Object.keys(this.finalMonthData).length && (this.filteredMonth || this.filteredEndMonth)) {
                Object.keys(this.finalMonthData[this.timeFrame]).forEach(key => {
                    xAxis.push(key)
                    yAxis[0]['data'].push(this.finalMonthData[this.timeFrame][key]['passTC'])
                    yAxis[1]['data'].push(this.finalMonthData[this.timeFrame][key]['failTC'])
                    yAxis[2]['data'].push(this.finalMonthData[this.timeFrame][key]['norunTC'])
                })
            } else {
                Object.keys(this.allData[this.timeFrame][this.viewBy]).forEach(key => {
                    xAxis.push(key)
                    yAxis[0]['data'].push(this.allData[this.timeFrame][this.viewBy][key]['passTC'])
                    yAxis[1]['data'].push(this.allData[this.timeFrame][this.viewBy][key]['failTC'])
                    yAxis[2]['data'].push(this.allData[this.timeFrame][this.viewBy][key]['norunTC'])
                })
            }
            const colorsList = ['#20c997', '#ff4d88', '#ffc107'];
            this.chartInput = {
                title: { show: false },
                color: colorsList,
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                    },
                    formatter: (params, ticket, callback) => {
                        var temp = ``;
                        var head = ``;
                        var total = 0;
                        if (params[0] && params[0]['axisValue']) {
                            total += params[0]['value'];
                            head += `<div class="text-center" style="width:100%">${params[0]['axisValue']}</div>`
                            temp += `<div class="row">
                                    <div class="col-sm-6">${params[0]['seriesName']}</div>
                                    <div class="col-sm-6">: ${params[0]['value']}</div>
                                </div>`
                        }
                        if (params[1] && params[1]['axisValue']) {
                            total += params[1]['value'];
                            temp += `<div class="row">
                        <div class="col-sm-6">${params[1]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[1]['value']}</div>
                    </div>`
                        }
                        if (params[2] && params[2]['axisValue']) {
                            total += params[2]['value'];
                            temp += ` <div class="row">
                        <div class="col-sm-6">${params[2]['seriesName']}</div>
                        <div class="col-sm-6">: ${params[2]['value']}</div>
                    </div>`
                        }
                        var finaltotal = ` <div class="row">
                    <div class="col-sm-6">Total</div>
                    <div class="col-sm-6">: ${total}</div>
                </div>`
                        return head + finaltotal + temp;

                    }
                },
                legend: {
                    show: true,
                    data: ['Passed TC', 'Failed TC', 'No Run TC'],
                    itemGap: 5,
                    textStyle: {
                        color: '#0d0d0d'
                    },

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
                        name: this.viewBy[0].toUpperCase() + this.viewBy.slice(1),
                        nameLocation: "center",
                        nameTextStyle: { padding: 11 },
                        axisTick: {
                            alignWithLabel: true,
                        },
                        axisLine: {
                            lineStyle: {
                                color: '#606060',
                            },
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: "No Of Testcases",
                        nameLocation: "center",
                        nameTextStyle: { padding: 40 },
                        minInterval: 1,
                        splitLine: {
                            lineStyle: {
                                color: '#f2f2f2',
                            },
                        },
                    },
                ],
                series: yAxis,
            };
            this.loadPIEChart();
            if (this.viewBy==='models') {
                this.dataName = 'model';
                this.loadModelDeviceData();
            } 
            if (this.viewBy==='vendors'){
                this.dataName = 'vendor';
                this.loadVendorDeviceData();
            }
            this.oldTimeFrame = this.timeFrame;
    }
    /* loads the pie chart of all data */
    loadPIEChart() {
        var legends = [];
        var series = [];
        if (Object.keys(this.finalMonthData).length && (this.filteredMonth || this.filteredEndMonth)) {
            Object.keys(this.finalMonthData[this.timeFrame]).forEach(key => {
                series.push({
                    name: key,
                    value: this.finalMonthData[this.timeFrame][key][this.pieChartType]
                })
            })
        } else {
            Object.keys(this.allData[this.timeFrame][this.viewBy]).forEach(key => {
            // legends.push(key)
            series.push({
                name: key,
                value: this.allData[this.timeFrame][this.viewBy][key][this.pieChartType]
            })
            })
        }
        this.chartInputPIE = {
            tooltip: {
                trigger: 'item',
                formatter: (params, ticket, callback) => {
                    var temp = ``;
                    var head = ``;
                    head += `<div class="text-center" style="width:100%">${params['data']['name']}(${params['percent']}%)</div>`
                    temp += `<div class="row">
                            <div class="col-sm-5">${this.chartLabel[this.pieChartType]}</div>
                            <div class="col">: ${params['data']['value']}</div>
                        </div>`
                    return head + temp;
                }
            },

            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 0,
                top: 20,
                bottom: 20,
                data: legends,
                textStyle: {
                    color: '#0d0d0d'
                }
            },
            series: [
                {
                    name: this.pieChartType,
                    type: 'pie',
                    radius: '55%',
                    center: ['50%', '50%'],
                    data: series,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    label: {
                        show: true,
                        align: 'right',
                        fontSize: 8
                    }
                }
            ]
        }
    }
    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
        if (this.themeSubscription) {
            this.themeSubscription.unsubscribe();
        }

    }
    viewByType() {
        this.loadPIEChart()
    }

   

    onChartInit(event) {
        this.chartInstance = event;
    }

    onChartInitPIE(event) {
        this.chartInstancePIE = event;
    }

    /* 
        based on selected value performs the process
        If months are selected, send them as queryParams to show specific months data on click of CPE Regressions Analysis chart
    */
    yearSelected(event) {
        if (this.timeFrame === 'allData') {
            let allYears = Object.keys(this.monthlyData[this.viewBy.slice(0, -1)])
            allYears = allYears.sort().reverse().filter(obj=>obj!=='null');
            let maxYear = null;
            let count = 0;
            while (!maxYear) {
                if (this.monthlyData[this.viewBy.slice(0, -1)][allYears[count]][event.name]) {
                    maxYear = allYears[count];
                }
                count++;
            }console.log(maxYear);
            this.router.navigateByUrl(`/pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.name}/year/${maxYear}`)
        } else {
            if (this.filteredMonth) {
                this.filteredEndMonth = this.filteredEndMonth ? this.filteredEndMonth : this.filteredMonth;
                this.router.navigate([`/pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.name}/year/${this.timeFrame}`], {queryParams: {"filteredMonth": this.filteredMonth, "filteredEndMonth": this.filteredEndMonth}});
            } else {
                this.router.navigateByUrl(`/pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.name}/year/${this.timeFrame}`);
            }
            //this.router.navigateByUrl(`/pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.name}/year/${this.timeFrame}`)
        }
    }

    /* 
        based on selected value displays pie chart 
        If months are selected, send them as queryParams to show specific months data on click of Testcase Execution Status chart
    */
    yearSelectedPie(event) {
        if (this.timeFrame === 'allData') {
            let allYears = Object.keys(this.monthlyData[this.viewBy.slice(0, -1)])
            allYears = allYears.sort().reverse().filter(obj=>obj!=='null');
            let maxYear = null;
            let count = 0;
            while (!maxYear) {
                if (this.monthlyData[this.viewBy.slice(0, -1)][allYears[count]][event.name]) {
                    maxYear = allYears[count];
                }
                count++;
            }
            this.router.navigateByUrl(`/pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.data.name}/year/${maxYear}`)
        } else {
            if (this.filteredMonth) {
                this.filteredEndMonth = this.filteredEndMonth ? this.filteredEndMonth : this.filteredMonth;
                this.router.navigate([`/pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.data.name}/year/${this.timeFrame}`], {queryParams: {"filteredMonth": this.filteredMonth, "filteredEndMonth": this.filteredEndMonth}});
            } else {
                this.router.navigateByUrl(`pages/dashboard/cpe-analysis/${this.viewBy.slice(0, -1)}/${event.data.name}/year/${this.timeFrame}`)
            }
        }

    }

    /* downloads the selected data */
    downloadReport() {
        this.dataService.loading.next(true);
        setTimeout(() => {
            this.downloadReports();
        }, 200)

    }

    async downloadReports() {
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.text(` ${this.viewBy[0].toLocaleUpperCase() + this.viewBy.slice(1)} Analysis Report`, 75, 10);
        doc.setFontSize(10);
        doc.text('Type', 20, 20);
        doc.text(': ' + ` ${this.viewBy[0].toLocaleUpperCase() + this.viewBy.slice(1)} Regressions(${this.timeFrame === 'allData' ? 'All Years' : this.timeFrame})`, 43, 20);
        doc.text(`Report Date`, 20, 25);
        doc.text(`:  ${new Date()}`, 43, 25);
        doc.text(`Generated By`, 20, 30);
        doc.text(`:  ${this.user.username}`, 43, 30);
        doc.line(0, 32, 300, 32);
        this.pdfHeight = 45;

        if (this.chartInstance) {
            doc.text('Regression Summary', 85, this.pdfHeight,);
            this.pdfHeight += 8;
            await doc.addImage(
                this.chartInstance.getDataURL({ pixelRatio: 2 }),
                'png',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 110;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        if (this.chartInstancePIE) {
            doc.text(`${this.pieChartType[0].toLocaleUpperCase() + this.pieChartType.slice(1, -2)} ${this.pieChartType.slice(-2)} Summary`, 90, this.pdfHeight,);
            this.pdfHeight += 3;
            await doc.addImage(
                this.chartInstancePIE.getDataURL({ pixelRatio: 2 }),
                'png',
                30,
                this.pdfHeight,
                150,
                100,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        if(this.viewBy==='vendors' && this.allCharts['vendorDeviceUtilization']) {
            let vendorTitle = 'Vendor Device Utilization';
            if (this.selectedVendor && this.showBackButton) {
                vendorTitle = this.selectedVendor + ' - ' + vendorTitle;
            }
            doc.text(vendorTitle ,80 , this.pdfHeight);
            this.pdfHeight += 8;
            await doc.addImage(
                this.allCharts['vendorDeviceUtilization'].getDataURL({pixelRatio:2}),
                'PNG',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        if(this.viewBy==='models' && this.allCharts['modelDeviceUtilization']) {
            let modelTitle = 'Model Device Utilization';
            if (this.selectedModel && this.showBackButton) {
                modelTitle = this.selectedModel + ' - ' + modelTitle;
            } 
            doc.text(modelTitle, 80, this.pdfHeight);
            this.pdfHeight += 8;
            await doc.addImage(
                this.allCharts['modelDeviceUtilization'].getDataURL({pixelRatio:2}),
                'PNG',
                15,
                this.pdfHeight,
                190,
                90,
                '',
                'FAST'
            );
            this.pdfHeight += 100;
            if (this.pdfHeight >= 251) {
                doc.addPage();
                this.pdfHeight = 20;
            }
        }
        if (this.showTable && this.finalDeviceData) {
            let deviceTitle = 'Device Utilization';
            var head = [["Name", 'Reservations', 'Utilized Hours', 'Utilization Percentage']];
            const body = [[this.finalDeviceData.deviceName, this.finalDeviceData.totalNoOfReservations, this.finalDeviceData.totalutilizedHours, this.finalDeviceData.totalUtlizedPercentage]];
            if (this.viewBy === 'models' && this.selectedModel) {
                deviceTitle = this.selectedModel + ' Model' + ' - ' + deviceTitle;
            } else if (this.viewBy === 'vendors' && this.selectedVendor) {
                deviceTitle = this.selectedVendor + ' Vendor' + ' - ' + deviceTitle;
            }
            doc.text(deviceTitle, 80, 150);
            autoTable(doc, { head: head, body: body, theme: 'grid', startY: 180, tableLineColor: 150, tableLineWidth: 0, styles: { overflow: 'linebreak', cellWidth: 'auto', font: 'helvetica', fontSize: 10 } });
        }
        await doc.save(`${this.viewBy[0].toUpperCase() + this.viewBy.slice(1)}-Regression-Report(${this.timeFrame === 'allData' ? 'All-Years' : this.timeFrame}).pdf`);
        this.dataService.loading.next(false);
    }


    getConnectedClientsVendorModel() {
        this.sub4 = this.dataService.getAllVendors().subscribe((vendors) => {
            console.log("is_cpe_analysis_Specific_clients>>>>",this.is_cpe_analysis_Specific_clients, vendors);
            if (vendors && !this.is_cpe_analysis_Specific_clients) {
                console.log(" if_is_cpe_analysis_Specific_clients>>>>",this.is_cpe_analysis_Specific_clients);
                this.allVendorNames = _.sortBy([...vendors]);
                this.allVendorNames.splice(0, 0, 'All');
            }else if(vendors && this.is_cpe_analysis_Specific_clients){
                console.log("else_is_cpe_analysis_Specific_clients>>>>",this.is_cpe_analysis_Specific_clients);
                this.allModelNames = [];
                this.allVendorNames = [];
                console.log("all this.allModels>>>>",this.allModels);
                this.sub6 = this.dataService.getAllProfiles().subscribe((profiles) => {
                    if (profiles) {
                        this.allProfiles = _.filter(profiles, obj => {
                            return obj && obj['connected_clients'] && obj['connected_clients'] == true
                        });

                        this.allModels.forEach((model) => {
                            if (model && model.profileName) {
                                this.allProfiles.forEach((profile) => {
                                    if (profile && profile.profileName && profile.profileName === model.profileName) {
                                        this.allModelNames.push(model.modelName);
                                        this.allVendorNames.push(model.deviceVendor);
                                    }
                                });
                            }
                        });
                        this.allModelNames = _.uniq(this.allModelNames);
                        this.allVendorNames = _.uniq(this.allVendorNames);
                        this.allVendorNames = _.sortBy([...this.allVendorNames]);
                        this.allModelNames = _.sortBy([...this.allModelNames]);
                    }
                });
                if (!this.allModelNames.includes('All')) {
                    this.allModelNames.splice(0, 0, 'All');
                }

                if (!this.allVendorNames.includes('All')){
                    this.allVendorNames.splice(0, 0, 'All');
                }
                console.log("all vendors>>>>", this.allVendorNames);
                console.log("all allModelNames>>>>", this.allModelNames);
            }
        });
    }

}
