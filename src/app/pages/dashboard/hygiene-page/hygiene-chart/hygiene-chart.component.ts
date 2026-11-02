import { Component, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardService } from 'src/app/@core/services/dashboard.service';
import { formatDate } from '@angular/common';
import { DataService } from 'src/app/@core/services/data.service';
import * as fileSaver from 'file-saver';


@Component({
  selector: 'app-hygiene-chart',
  templateUrl: './hygiene-chart.component.html',
  styleUrls: ['./hygiene-chart.component.scss']
})
export class HygieneChartComponent implements OnInit {
  chartInput: any = {};
  lineChartInput: any = {};
  dateForm: FormGroup;
  breadcrumbs = [
    {
      link: '#/pages/dashboard',
      label: 'Dashboard'
    },
    {
      link: '#/pages/dashboard/hygiene-charts',
      label: 'Server Monitor page'
    }
  ];

  chartData: any = [];
  infoLogPath: any;
  chartDetails: any = {};
  serverIP = '';
  latestChartData;
  serverList = [];
  selectedTabIndex = 0;
  date_limit: any;
  infoLogIndex: any;
  errorLogIndex: any;
  constructor(private dashboardService: DashboardService,
    private snackBar: MatSnackBar,
    private dataService: DataService) { }

  ngOnInit(): void {
    let date = new Date();
    this.dateForm = new FormGroup({
      date: new FormControl(new Date())
    })
    this.getHygieneChartData(date);
    // this.getInfoLogPath();
  }

  getInfoLogPath() {
    this.dashboardService.getInfoLogPath().subscribe((res: any) => {
      this.infoLogPath = res.replace(/\\/g, "/"); // Replace is used to change "\\" to "/"
      // console.log("res", this.infoLogPath);
    }, (err: any) => {
      console.log("Err", err);
    });
  }

  openInfoLogs(): void {
    this.dataService.loading.next(true);
    this.dashboardService.getInfoLogs(this.infoLogIndex).subscribe(
      data => {
        if (data) {
          console.log('inside if');
          const txtBlob = new Blob([data]);
          const blobUrl = URL.createObjectURL(txtBlob);
          console.log('blob url', blobUrl);
          window.open(blobUrl, '_blank');
        } else {
          console.log('inside else');
          this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
        }
        this.dataService.loading.next(false);
      },
      err => {
        console.log('inside err');
        this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
        this.dataService.loading.next(false);
      }
    );
  }

  openErrorLogs(): void {
    this.dataService.loading.next(true);
    this.dashboardService.getErrorLogs(this.errorLogIndex).subscribe(
      data => {
        if (data) {
          const txtBlob = new Blob([data]);
          const blobUrl = URL.createObjectURL(txtBlob);
          window.open(blobUrl, '_blank');
        } else {
          this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
        }
        this.dataService.loading.next(false);
      },
      err => {
        this.snackBar.open('Failed getting  Logs', 'Try Again', { duration: 5000 });
        this.dataService.loading.next(false);
      }
    );
  }

  DownloadInfoLogs(): void {
    this.dashboardService.getInfoLogs(this.infoLogIndex).subscribe(
      data => {
        if (data) {
          const txtBlob = new Blob([data]);
          fileSaver.saveAs(txtBlob, `infoLogs.txt`);
        } else {
          this.snackBar.open('Failed getting  jLogs', 'Try Again', { duration: 5000 });
        }
      });
  }

  openAPIPlugin(): void {
    const url = 'http://' + this.serverIP + ':5001/apidocs';
    window.open(url);

  }

  setHygieneDataInDateOrder() {
    this.chartData ?.sort(function compare(itemA, itemB) {
      let dateA = new Date(itemA.hygiene_data[0].time);
      let dateB = new Date(itemB.hygiene_data[0].time);
      return (dateB.valueOf() - dateA.valueOf());
    });
  }

  getHygieneChartData(date) {
    this.dashboardService.getHygieneData(date).subscribe((res: any) => {
      if (res.hygieneData && res.hygieneData.length > 0) {
        this.chartData = res.hygieneData;
        this.date_limit = res.date_limit;
        res.hygieneData.forEach(element => {
          const serverDetails = { id: null, name: null };
          serverDetails.id = element._id;
          serverDetails.name = element?.hygiene_data[element.hygiene_data.length - 1].hostName;
          this.serverList.push(serverDetails);
        });
        this.selectedTabIndex = 0;
        this.setHygieneDataInDateOrder();
        this.setChartData(0);
        this.setLineChartData(0);
      }
      else {
        this.setChartData(null);
        this.setLineChartData(null);
      }
    }, (err: any) => {
      console.log(err);
    });
  }

  getDateFormatting(dateVal: any): any {
    return formatDate(dateVal, 'dd, MMM ,yyyy h:mm:ss a', 'en_US');7
  }

  setChartData(index) {
    const data = this.chartData[index];
    // replace is used to remove space's in between the string
    let latestDate = new Date(Math.max(...data.hygiene_data ?.map((el: any) => new Date(el.time.replace(/\s/g, ''))))).toISOString();
    this.latestChartData = data.hygiene_data.find((el: any) => el.time.replace(/\s/g, '') === latestDate);
    this.chartDetails["time"] = this.getDateFormatting(this.latestChartData.time);
    // this.chartDetails["serverName"] = latestChartData.serverName? latestChartData.serverName : "XYZ";
    this.chartDetails["serverIp"] = this.latestChartData.serverIP ? this.latestChartData.serverIP : 'NA';
    this.serverIP = this.latestChartData.serverIP ? this.latestChartData.serverIP : 'NA';
    const gaugeData = [
      {
        value: parseInt(this.latestChartData.cpu),
        name: 'CPU',
        title: {
          offsetCenter: ['-35%', '-35%']
        },
        detail: {
          valueAnimation: true,
          offsetCenter: ['25%', '-35%']
        }
      },
      {
        value: parseInt(this.latestChartData.memory.memory_percentage),
        name: 'Memory',
        title: {
          offsetCenter: ['-35%', '-15%']
        },
        detail: {
          valueAnimation: true,
          offsetCenter: ['25%', '-15%']
        }
      },
      {
        value: parseInt(this.latestChartData.diskutilization.disk_percentage),
        name: 'Disk Utilization',
        title: {
          offsetCenter: ['-35%', '5%']
        },
        detail: {
          valueAnimation: true,
          offsetCenter: ['25%', '5%']
        }
      }
    ];
    this.chartInput = {
      color: ['#5470c6', '#73c0de', '#FFBF00'],
      series: [
        {
          data: gaugeData,
          type: 'gauge',
          startAngle: 180,
          endAngle: 360,
          radius: '100%',
          center: ['50%', '70%'],
          pointer: {
            show: false
          },
          progress: {
            show: true,
            overlap: false,
            roundCap: true,
            clip: false,
            itemStyle: {
              borderWidth: 1,
              borderColor: '#464646'
            }
          },
          axisLine: {
            lineStyle: {
              width: 40
            }
          },
          splitLine: {
            show: false,
            distance: 0,
            length: 10
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            show: true,
            distance: -30
          },
          title: {
            fontSize: 14
          },
          detail: {
            width: 50,
            height: 14,
            fontSize: 14,
            color: 'inherit',
            borderColor: 'inherit',
            borderRadius: 20,
            borderWidth: 1,
            formatter: '{value}%'
          }
        }
      ]
    };
  }

  filterByDate(data: any) {
    let selectedDate = new Date(this.dateForm.get('date').value);
    let formattedDate: any = `${selectedDate.getFullYear()}-${((selectedDate.getMonth() + 1) < 10) ? "0" + (selectedDate.getMonth() + 1) : (selectedDate.getMonth() + 1)}-${(selectedDate.getDate() < 10) ? "0" + selectedDate.getDate() : selectedDate.getDate()}`;

    const lowerDate = new Date(this.date_limit.lowerdate);
    const upperDate = new Date(this.date_limit.upperdate);
    const selectedFormattedDate = new Date(formattedDate);

    if (selectedFormattedDate < lowerDate || selectedFormattedDate > upperDate) {
      this.getHygieneChartData(selectedDate);
    } else {
      let filteredData = data.filter((el: any) => el.time.includes(formattedDate));
      return filteredData;
    }
  }

  tabChange(event): void {
    this.selectedTabIndex = event.index;
    this.setChartData(event.index);
    this.setLineChartData(event.index);
  }
  getTime(time: any) {
    let hours = new Date(time).getUTCHours();
    let minutes = new Date(time).getUTCMinutes();
    if (hours > 12) {
      return `${hours - 12}:${(minutes < 10) ? "0" + minutes : minutes} PM`;
    } else {
      return `${hours}:${(minutes < 10) ? "0" + minutes : minutes} AM`;
    }
  }

  setLineChartData(index) {
    let chartClonedData = [...this.chartData];
    //console.log(" chartClonedData>>>", chartClonedData);
    let filteredData = this.filterByDate(chartClonedData[index].hygiene_data);
      filteredData?.sort(function compare(itemA, itemB) {
      let dateA = new Date(itemA.time);
      let dateB = new Date(itemB.time);
      return (dateA.valueOf() - dateB.valueOf());
    });
    let times = filteredData ?.map((el) => this.getTime(el.time.replace(/\s/g, '')));

    this.lineChartInput = {
      title: {
        show: filteredData ?.length === 0,
        textStyle: {
          color: "grey",
          fontSize: 20
        },
        text: "No data available for specific date",
        left: "center",
        top: "center"
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params, ticket, callback) => {
          let temp = ``;
          let head = ``;
          if (params[0] && params[0].axisValue) {
            head += `<div class="text-center" style="width:100%"><b>${params[0].axisValue}</b></div>`;
            temp += `<div class="row">
                      <div class="col-sm-1">${params[0].marker}</div>
                      <div class="col-sm-6">${params[0].seriesName}</div>
                      <div class="col-sm-4 ml-2">: ${params[0].value}%</div>
                    </div>`;
          }
          if (params[1] && params[1].axisValue) {
            temp += `<div class="row">
                      <div class="col-sm-1">${params[1].marker}</div>
                      <div class="col-sm-6">${params[1].seriesName}</div>
                      <div class="col-sm-4 ml-2">: ${params[1].value}%</div>
                    </div>`;
          }
          if (params[2] && params[2].axisValue) {
            temp += `<div class="row">
                        <div class="col-sm-1">${params[2].marker}</div>
                        <div class="col-sm-6">${params[2].seriesName}</div>
                        <div class="col-sm-4 ml-2">: ${params[2].value}%</div>
                    </div>`;
          }
          if (params[3] && params[3].axisValue) {
            temp += `<div class="row">
                      <div class="col-sm-1">${params[3].marker}</div>
                      <div class="col-sm-6">${params[3].seriesName}</div>
                      <div class="col-sm-4 ml-2">: ${params[3].value}</div>
                    </div>`;
          }
          if (params[4] && params[4].axisValue) {
            temp += `<div class="row">
                      <div class="col-sm-1">${params[4].marker}</div>
                      <div class="col-sm-6">${params[4].seriesName}</div>
                      <div class="col-sm-4 ml-2">: ${params[4].value}</div>
                    </div>`;
          }
          return head + temp;
        }
      },
      legend: {
        data: ['CPU', 'Disk Utilization', 'Memory', 'User Logged In', 'Regression Running']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      toolbox: {
        feature: {
          saveAsImage: {}
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLabel: {
          interval: 0,
          rotate: -70,
          inside: false
        },
        axisTick: {
          interval: 0,
        },
        data: times
      },
      yAxis: {
        type: 'value',
        data: ['CPU', 'Disk Utilization', 'Memory', 'User Logged In', 'Regression Running']
      },
      series: [
        {
          name: 'CPU',
          type: 'line',
          smooth: true,
          data: filteredData ?.map((el) => parseInt(el.cpu.slice(0, -1)))
        },
        {
          name: 'Disk Utilization',
          type: 'line',
          smooth: true,
          data: filteredData ?.map((el) => parseInt(el?.diskutilization.disk_percentage.slice(0, -1)))
        },
        {
          name: 'Memory',
          type: 'line',
          smooth: true,
          data: filteredData ?.map((el) => parseInt(el.memory.memory_percentage.slice(0, -1)))
        },
        {
          name: 'User Logged In',
          type: 'line',
          smooth: true,
          data: filteredData ?.map((el) => el.userLoggedin.length)
        },
        {
          name: 'Regression Running',
          type: 'line',
          smooth: true,
          data: filteredData ?.map((el) => el.regressionRunning.length)
        }
      ]
    };
  
}

}
