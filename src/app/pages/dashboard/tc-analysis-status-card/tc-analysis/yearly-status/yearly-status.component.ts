import { DataService } from './../../../../../@core/services/data.service';
import { Component, OnInit, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-tc-yearly-status',
  templateUrl: './yearly-status.component.html',
  styleUrls: ['./yearly-status.component.scss']
})
export class TCYearlyStatusComponent implements OnInit, OnChanges {
  sub1;
  chartInstance;
  @Input() chartData = {};
  @Input() chartName = null;
  @Output() chart = new EventEmitter();
  @Input() noData = false;
  @Input() xLableName = ' Testgroups'
  chartInput = {};
  data;
  @Output() someEvent = new EventEmitter();

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.sub1 = this.dataService.sideBarOnToggle.subscribe(data => {
      if (data && this.chartInstance) {
        let idCount = 0;
        const id = setInterval(() => {
          idCount++;
          if (this.chartInstance) {
            this.chartInstance.resize();
          }
          if (idCount > 5) {
            idCount = 0;
            clearInterval(id)
          }
        }, 100)
      }
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chartData']) {
      this.data = changes['chartData'].currentValue
      this.processData()
    }
  }

  onChartInit(event) {
    this.chartInstance = event;
    const temp = {};
    temp[this.chartName] = event;
    this.chart.emit(temp)
  }
  /* based on data performs the action to generate report */
  processData() {
      const xAxis = this.data['xLabel'] || [];
      const colorsList = ['#24a148', '#fa4d56', '#f1c21b',  '#0275d8', '#800080'];
      this.chartInput = {
        color: colorsList,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          show: !this.noData
        },
        title: {
          text: 'No Data Available',
          left: '37%',
          top: '45%',
          show: this.noData
        },
        legend: {
          show: true,
          data: null,
          itemGap: 5,
          textStyle: {
            color: '#0d0d0d'
          }
        },
        grid: {
          left: '7%',
          right: '4%',
          bottom: '10%',
          top: '15%',
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            name: this.xLableName,
            data: xAxis,
            nameLocation: "center",
            nameTextStyle: { padding: 11 },
            axisTick: {
              alignWithLabel: true,
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            name: "Total No of Testcase Executions",
            nameLocation: "center",
            nameTextStyle: { padding: 35 },
            minInterval: 1,
            splitLine: {
              lineStyle: {
                color: '#f2f2f2',
              },
            },
          },
        ],
        dataZoom: [
          {
            show: xAxis.length > 7 ? true : false,
            start: 0,
            end: 100
          },
          {
            type: 'inside',
            start: 24,
            end: 100
          },
          {
            show: false,
            yAxisIndex: 0,
            filterMode: 'empty',
            width: 30,
            height: '80%',
            showDataShadow: false,
            left: '93%'
          }
        ],
        series: this.data['series'],
      };
  }

  yearSelected(event): void {
    this.someEvent.next(event);
  }

  ngOnDestroy() {
    if (this.sub1) {
      this.sub1.unsubscribe()
    }
  }
}
