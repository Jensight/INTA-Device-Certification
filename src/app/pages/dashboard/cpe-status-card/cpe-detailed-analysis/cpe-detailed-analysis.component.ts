import { OnDestroy } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { DataService } from './../../../../@core/services/data.service';
import { DashboardService } from './../../../../@core/services/dashboard.service';
import { Component, OnInit } from '@angular/core';
import  jsPDF  from 'jspdf';

@Component({
    selector: 'app-cpe-detailed-analysis',
    templateUrl: './cpe-detailed-analysis.component.html',
    styleUrls: ['./cpe-detailed-analysis.component.scss']
})
export class CPEDetailedAnalysisComponent implements OnInit, OnDestroy {
    timeFrame = 1;
    data = {};
    dataSubscription;
    reservationTrendData = {};
    reservationStatusData = {};
    deviceReservationData ={};
    testbedReservation = {};
    deviceStreak ={};
    testbedStreak ={};
    selectedDevice = null;
    selectedTestbed = null;
    allCharts = {};
    pdfHeight = 0;
    user = null;
    subscription;
    loading= false;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/dashboard/reservation-analysis',
            label: 'Reservation Analysis'
        }
    ]
    constructor(private dashboardService: DashboardService, private dataService: DataService) {
        this.user = this.dataService.getCurrentUser()
        this.dataSubscription = this.dataService.selectedTeam.pipe(
            mergeMap(team => {
                if(team){
                    return this.dashboardService.getReservationAnalysisData()
                }else {
                    return Observable.create(null)
                }
            })
        ).subscribe(data => {
            this.data = data;
            this.loadTrendData();
            this.loadStatusData();
            this.loadDeviceData();
            this.loadTestbedData();
            this.loadDeviceStreak();
            this.loadTestbedStreak();
            this.selectedDevice = this.data['deviceData'][0];
            this.selectedTestbed = this.data['testbedData'][0];

        })
     }

    ngOnInit(): void {

     }

     ngOnDestroy() {
         if(this.dataSubscription){
             this.dataSubscription.unsubscribe()
         }
         
     }
/* loads all the trend data */
     loadTrendData() {
         const temp = {};
         temp['sevenDays'] = this.data['reservationTrend_7'];
         temp['thirtyDays'] = this.data['reservationTrend_30'];
         temp['allDays'] = this.data['reservationTrend'];
         const details = {};
         details['xAxisName'] = 'Days Of Week';
         details['yAxisName'] = 'No. of Reservations';
         details['keys'] = ['bookingCount','started', 'ended'];
         details['legends'] = ['No of Reservation','Reservation Started', 'Reservation Ended'];
         details['seriesDetails'] = [{
            name: 'No of Reservation',
            type: 'bar',

            data: [],
            barMinHeight: 2,
          },
          {
            name: 'Reservation Started',
            type: 'bar',

            data: [],
            barMinHeight: 2,
          },
          {
            name: 'Reservation Ended',
            type: 'bar',

            data: [],
            barMinHeight: 2,
          }]
         this.reservationTrendData = {data:temp, details};
     }
/* loads all the status data */
     loadStatusData() {
        const temp = {};
        temp['sevenDays'] = this.data['reservationStatus_7'];
        temp['thirtyDays'] = this.data['reservationStatus_30'];
        temp['allDays'] = this.data['reservationStatus'];
        const details = {};
         details['xAxisName'] = 'Days Of Week';
         details['yAxisName'] = 'No. of Reservations';
         details['keys'] = ['bookingCount','deviceCount', 'testbedCount'];
         details['legends'] = ['No of Reservation','Device Reservation','Testbed Reservation'];
         details['seriesDetails'] = [{
            name: 'No of Reservation',
            type: 'bar',

            data: [],
            barMinHeight: 2,
          },
          {
            name: 'Device Reservation',
            type: 'bar',

            data: [],
            barMinHeight: 2,
          },
          {
            name: 'Testbed Reservation',
            type: 'bar',

            data: [],
            barMinHeight: 2,
          }]
         this.reservationStatusData = {data:temp, details};
     }
/* loads all the device data */
     loadDeviceData() {
        const temp = {};
        temp['sevenDays'] = this.data['deviceReservation_7'];
        temp['thirtyDays'] = this.data['deviceReservation_30'];
        temp['allDays'] = this.data['deviceReservation'];
        const details = {};
         details['xAxisName'] = 'Device Names';
         details['yAxisName'] = 'No. of Reservations/ Duration(Min)';
         details['keys'] = ['noOfReservation', 'duration', 'utlizedPercentage'];
         details['legends'] = ['No of Reservation','Duration(Hours)','Utilization(%)'];
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
         this.deviceReservationData = {data:temp, details};
     }
/* loads all the testbed data */
     loadTestbedData() {
        const temp = {};
        temp['sevenDays'] = this.data['testbedReservation_7'];
        temp['thirtyDays'] = this.data['testbedReservation_30'];
        temp['allDays'] = this.data['testbedReservation'];
        const details = {};
         details['xAxisName'] = 'Testbed Names';
         details['yAxisName'] = 'No. of Reservations/ Duration(Hour)';
         details['keys'] = ['noOfReservation', 'duration', 'utlizedPercentage'];
         details['legends'] = ['No of Reservation','Duration(Hours)','Utilization(%)'];
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
         this.testbedReservation = {data:temp, details};
     }

     loadDeviceStreak() {
         const temp = {};
         temp['sevenDays'] = this.data['deviceStreak'];
         temp['thirtyDays'] = this.data['deviceStreak'];
         temp['allDays'] = this.data['deviceStreak'];
         this.deviceStreak = {data:temp};
     }

     loadTestbedStreak() {
        const temp = {};
        temp['sevenDays'] = this.data['testbedStreak'];
        temp['thirtyDays'] = this.data['testbedStreak'];
        temp['allDays'] = this.data['testbedStreak'];
        this.testbedStreak = {data:temp};
     }

     updateCharts(event){
        this.allCharts = {...this.allCharts, ...event};
     }
/* downloads the particular record */
     downloadReport(){
        this.dataService.loading.next(true);
        setTimeout(()=> {
            this.downloadReports();
        },200)

     }

     async downloadReports() {

         let time = null;
         if(this.timeFrame == 7){
            time = "Last 7 Days";
         }else if (this.timeFrame == 30){
            time = "Last 30 Days";
         }else {
             time = "All Time";
         }
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.text('Reservation Analysis Report',75, 10);
        doc.setFontSize(10);
        doc.text('Timeframe',20, 20);
        doc.text(': ' + time,43, 20);
        doc.text( `Report Date`,20, 25);
        doc.text(`:  ${new Date()}`,43, 25);
        doc.text( `Generated By`, 20, 30);
        doc.text(`:  ${this.user.username}`,43, 30);
        doc.line(0, 32, 300, 32);
        this.pdfHeight = 45;
        if(this.allCharts['reservationTrend']){
            doc.text( 'Reservation Trend',90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['reservationTrend'].getDataURL({pixelRatio:2}),
                'png',
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

        if(this.allCharts['reservationStatus']){
            doc.text('Reservation Status',90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['reservationStatus'].getDataURL({pixelRatio:2}),
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

        if(this.allCharts['deviceUtilization']){
            doc.text('Device Utilization',90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['deviceUtilization'].getDataURL({pixelRatio:2}),
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
        if(this.allCharts['testbedUtilization']){
            doc.text('Testbed Utilization',90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['testbedUtilization'].getDataURL({pixelRatio:2}),
                'JPEG',
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
        if(this.allCharts['unusedDevice']){
            doc.text( 'Un Used Device',90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['unusedDevice'].getDataURL({pixelRatio:2}),
                'JPEG',
                15,
                this.pdfHeight,
                190,
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
        if(this.allCharts['unusedTestbed']){
            doc.text( 'Un Used Testbed',90, this.pdfHeight);
            this.pdfHeight += 3;
            await doc.addImage(
                this.allCharts['unusedTestbed'].getDataURL({pixelRatio:2}),
                'JPEG',
                15,
                this.pdfHeight,
                190,
                100,
                '',
                'FAST'
            );
            this.pdfHeight += 130;
        }

        await doc.save('iCAT-Reservation-Report.pdf');
        this.dataService.loading.next(false);

     }


}


