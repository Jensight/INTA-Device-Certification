import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import * as _ from 'lodash';
import { DashboardService } from 'src/app/@core/services/dashboard.service';
import { TestCaseInventoryService } from 'src/app/@core/services/testcase-inventory.service';

@Component({
  selector: 'app-failure-category-detail',
  templateUrl: './failure-category-detail.component.html',
  styleUrls: ['./failure-category-detail.component.scss']
})
export class FailureCategoryDetailComponent implements OnInit, OnChanges {

  chartInput: any;
  chartInstance: any;
  currentData: any;
  @Input() dataType = null;
  @Input() selectedDay = null;
  @Input() selectedMonth = null;
  @Input() selectedYear = null;
  @Input() detailData: any;
  @Input() quarter: any;
  @Input() hasFilter: any;
  @Output() categoryMapsEvent: EventEmitter<Object> = new EventEmitter<any>();
  @Output() reasonMapsEvent : EventEmitter<any> = new EventEmitter<any>();
  categoryMap : any;
  reasonMap: any;
  themeSubscription;
  failbyCat = new Map();
  allTestgroups = [];
  selectedTeam: any;
  failByReason = new Map();
  failreasonChartInput: any;
  ErrorCodeDetails = new Map();
  showErrorChart = false;
  tcAnalysis: true;
  constructor(public dataService: DataService, public dashboardService: DashboardService,
              public tcService: TestCaseInventoryService) {

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dataType || changes.detailData) {
      const errCodes = this.dataService.getErrorCodes().slice();

      errCodes.forEach(errCode => {
        this.ErrorCodeDetails.set(errCode.errorCode, errCode.errorDesc);
      });
      this.dataService.selectedTeam.subscribe(team => {
        if (team) {
          this.selectedTeam = team;
          this.dataService.getTestGroup().subscribe(testGroups => {
                testGroups.forEach(testGroup => {
                  this.allTestgroups.push(testGroup.testGroupName);
                });
              });
          if (this.allTestgroups.length > 0){
                if (changes.detailData || changes.dataType) {
                  if ((changes.dataType && changes.dataType.currentValue === 'tcAnalysis') || this.dataType === 'tcAnalysis'){
                    this.dataService.loading.next(true);
                    this.currentData = this.detailData;
                  } else {
                    this.setChartData(this.detailData);
                  }

                } else {
                  this.currentData = [];
                  this.failbyCat.clear();
                  this.failByReason.clear();
                  this.currentData = this.detailData;
                }
             
              }
              this.processData();
        }
      });
    }
  }

  onChartInit(event: any): void {
    this.chartInstance = event;
}

setChartData(data: any): void {
      if (data){
      if (this.selectedDay && this.selectedMonth && this.selectedYear){
        // setting day data after selecting day
        this.currentData = data?.map((element: any) => element).filter(element => {
          return (element.day === this.selectedDay && element.month === this.selectedMonth && element.year === this.selectedYear);
        });
      } else if (this.selectedMonth && this.selectedYear){
        // setting daily data after selecting month
        this.currentData = data?.map((element: any) => element).filter((element: { month: any; year: any; }) => {
          return (element.month === this.selectedMonth && element.year === this.selectedYear);
      });
      } else if (this.selectedYear){
        // setting monthly data after selecting quarter
        const index = _.findIndex(data, { _id: this.selectedYear });
        if (index >= 0 && this.quarter) {
          const yearData = data[index].monthlyData;
          this.currentData = yearData?.map((element: any) => element).filter(element => {
            return (element.quarter === this.quarter);
          });
        }
      }
    }
}

  processData(): void {
    this.failbyCat = new Map();
    this.failByReason = new Map();
    if (this.dataType === 'tcAnalysis') {
      this.currentData[0]?.tcGrpDetail?.forEach((value: any, key: any) => {
        this.failbyCat.set(key, value ? value.length : 0);
        });

      this.currentData[0]?.errorCodes?.forEach((val: any, key1: any) => {
          this.failByReason.set(this.ErrorCodeDetails.get(key1), val);
        });
    } else {
      this.currentData?.forEach(element => {
        element.failByCategory?.forEach((value: any, key: any) => {
          this.failbyCat.size > 0 ? this.failbyCat.has(key) ? this.failbyCat.set(key,
            this.failbyCat.get(key) + value) : this.failbyCat.set(key, value)
            : this.failbyCat.set(key, value);
        });

        element.errorCodes?.forEach((value: any, key: any) => {
          this.failByReason.size > 0 ? this.failByReason.has(this.ErrorCodeDetails.get(key))
            ? this.failByReason.set(this.ErrorCodeDetails.get(key),
              this.failByReason.get(this.ErrorCodeDetails.get(key)) + value) : this.failByReason.set(this.ErrorCodeDetails.get(key), value)
            : this.failByReason.set(this.ErrorCodeDetails.get(key), value);
        });
      });
    }
    this.showErrorChart = this.failByReason.size > 0 ? true : false;
    if (!this.hasFilter){
    this.allTestgroups.forEach(testGroup => {
      if (!([... this.failbyCat.keys()].includes(testGroup))) {
       this.failbyCat.set(testGroup , 0);
      }
    });
   }
    this.categoryMap = new Map([...this.failbyCat].sort((a, b) => a[1] - b[1]));
    this.categoryMapsEvent.emit(new Map([...this.failbyCat].sort((a, b) => b[1] - a[1])));
    this.reasonMap = new Map([...this.failByReason].sort((a, b) => a[1] - b[1]));
    this.reasonMapsEvent.emit(new Map([...this.failByReason].sort((a, b) => b[1] - a[1])));
    this.dataService.loading.next(false);
    this.chartInput = {
        color: '#17a2b8',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '4%',
          right: '4%',
          bottom: '10%',
          top: '15%',
          containLabel: true,
        },
        yAxis: [{
          type: 'category',
          name: 'Failed By TestGroup',
          axisLabel: {
           overflow: 'breakAll',
           width: 150
          },
          data: [...this.categoryMap.keys()],

          axisTick: {
            alignWithLabel: true,
        },
        }
        ],
        xAxis: {
          type: 'value',
          name: 'Number of Failed Testcases',
          nameLocation: 'center',
          nameTextStyle: { padding: 20 },
          splitLine: { show: false },
          axisLine: {
            show: true,
          },
        },
        series: [{
          type: 'bar',
          barMinHeight: 5,
          barMaxWidth: 40,
          data : [ ...this.categoryMap.values() ]
      }],
      };

    this.failreasonChartInput = {
      color: '#17a2b8',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '4%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      yAxis: [{
        type: 'category',
        name: 'Failed by Reason',
        nameTextStyle: { padding: 10 },

        data: [...this.reasonMap.keys()],

        axisTick: {
          alignWithLabel: true,
      }
      }
      ],
      xAxis: {
        type: 'value',
        name: 'Number of Failed APIs',
        nameLocation: 'center',
        nameTextStyle: { padding: 20 },
        splitLine: { show: false },
        axisLine: {
          show: true,
          
        },
      },
      series:  [{
        type: 'bar',
        barMinHeight: 5,
        barMaxWidth: 40,
        data : [ ...this.reasonMap.values() ]
     }]
    };
  }

  getFailByCategoryData(): any{
    return [ ...this.failbyCat.entries() ];
  }

}
