import { OnInit, Component, ViewChild, ViewChildren, QueryList, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
  selector: 'app-detail-summary',
  templateUrl: './detail-summary.component.html',
  styleUrls: ['./detail-summary.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DetailSummaryComponent implements OnInit, OnChanges {

  @ViewChild('outerSort', { static: true }) sort: MatSort;
  @ViewChildren('innerSort') innerSort: QueryList<MatSort>;
  @ViewChildren('innerTables') innerTables: QueryList<MatTable<ModelFWVersion>>;
  @ViewChildren('paginator1') paginator1: QueryList<MatPaginator>;
  @ViewChild('paginator', {static: true}) paginator: MatPaginator;
  @Input()
  quarterDetails: any;
  @Input()
  dataType: any;
  @Input()
  showNoRun: any;
  dataSource: MatTableDataSource<QuarterData>;
  usersData: QuarterData[] = [];
  columnsToDisplay = [];
  columnNamesToDisplay = {};
  innerDisplayedColumns = ['Model', 'FirmwareVersions'];
  expandedElement: QuarterData | null;
  jira_domain: any;

  constructor(
    private cd: ChangeDetectorRef,
    private tlService: TestLabService,
    private dataService: DataService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
     this.dataService.getSettingsData().subscribe((settingsdata: any) => {
            if (!settingsdata) {
                this.userService.getAllusers().subscribe((data: any) => {
                    this.dataService.saveSettingData(data[0]);
                    settingsdata = data;
                });
            }
            this.jira_domain = settingsdata.jiraConfig[0].jiraIP
        });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dataType || changes.showNoRun || changes.quarterDetails) {
       if (this.dataType === 'yearly'){
        this.processYearlyData();
       } else if (this.dataType === 'monthly'){
        this.processMonthlyData();
       } else if (this.dataType === 'daily'){
        this.processDailyData();
       } else if (this.dataType === 'day'){
        this.processDayData();
       }
    }
  }

  processYearlyData(): void {
    this.columnsToDisplay = ['q', 'totalReg', 'totalFWVersionCount', 'totalTC', 'totalPass', 'totalFail', 'totalAbort', 'totalWarn'];
    this.columnNamesToDisplay = {
      q: 'Quarter', totalReg: 'Total Regression Jobs', totalFWVersionCount: 'Total Unique FW Versions',
      totalTC: 'Total Tc', totalPass: 'Pass TC', totalFail: 'Fail TC', totalAbort: 'Abort TC', totalWarn: 'Warn TC', totalNorun: 'No Run Tc'
    };
    this.usersData = [];
    if (this.showNoRun){
      this.columnsToDisplay = ['q', 'totalReg', 'totalFWVersionCount', 'totalTC', 'totalPass', 'totalFail', 'totalAbort', 'totalWarn', 'totalNorun'];
    }
    this.processQuarterData();
  }

  processMonthlyData(): void {
    this.columnsToDisplay = ['monthName', 'totalReg', 'totalFWVersionCount', 'totalTC', 'passTC', 'failTC', 'abortTC', 'warnTC'];
    this.columnNamesToDisplay = {
      monthName: 'Month', totalReg: 'Total Regression Jobs', totalFWVersionCount: 'Total Unique FW Versions',
      totalTC: 'Total Tc', passTC: 'Pass TC', failTC: 'Fail TC', abortTC: 'Abort TC', warnTC: 'Warn TC', norunTC: 'No Run TC'
    };
    this.usersData = [];
    if (this.showNoRun){
      this.columnsToDisplay = ['monthName', 'totalReg', 'totalFWVersionCount', 'totalTC', 'passTC', 'failTC', 'abortTC', 'warnTC', 'norunTC'];
    }
    this.processData();
  }

  processData(): void {
    this.quarterDetails.forEach(qtr => {
      qtr.totalFWVersionCount = qtr.firmwareVersion ? qtr.firmwareVersion.length : 0;
      if (qtr.modelFWVersionlist && Array.isArray(qtr.modelFWVersionlist) && qtr.modelFWVersionlist.length > 0) {
        qtr.modelFWVersionlist.forEach(modelFw => {
          modelFw.FirmwareVersions = modelFw.FirmwareVersion.join(', ');
        });
        this.usersData = [...this.usersData, { ...qtr, modelFWVersion: new MatTableDataSource(qtr.modelFWVersionlist) }];
      }
      else {
        this.usersData = [...this.usersData, qtr];
      }
    });
    this.dataSource = new MatTableDataSource(this.usersData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  processDailyData(): void {
    this.columnsToDisplay = ['formattedData', 'totalReg', 'totalFWVersionCount', 'totalTC', 'passTC', 'failTC', 'abortTC', 'warnTC'];
    this.columnNamesToDisplay = {
      formattedData: 'Date', totalReg: 'Total Regression Jobs', totalFWVersionCount: 'Total Unique FW Versions',
      totalTC: 'Total Tc', passTC: 'Pass TC', failTC: 'Fail TC', abortTC: 'Abort TC', warnTC: 'Warn TC', norunTC: 'No Run TC'
    };
    this.usersData = [];
    if (this.showNoRun){
      this.columnsToDisplay = ['formattedData', 'totalReg', 'totalFWVersionCount', 'totalTC', 'passTC', 'failTC', 'abortTC', 'warnTC', 'norunTC'];
    }
    this.processData();
  }

  processDayData(): void {
    this.columnsToDisplay = ['run_id', 'deviceName', 'jiraKey', 'firmwareVersion', 'model', 'totalTC', 'passTC', 'failTC', 'abortTC', 'warnTC'];
    this.columnNamesToDisplay = {
      run_id: 'Run ID', deviceName: 'Device Name', jiraKey: 'Jira Key', firmwareVersion: 'Firmware Version', model: 'Model Name',
      totalTC: 'Total Tc', passTC: 'Pass TC', failTC: 'Fail Tc', abortTC: 'Abort TC', warnTC: 'Warn TC', norunTC: 'No Run Tc'
    };
    this.usersData = [];
    if (this.showNoRun){
      this.columnsToDisplay = ['run_id', 'deviceName', 'jiraKey', 'firmwareVersion', 'model', 'totalTC', 'passTC', 'failTC', 'abortTC', 'warnTC', 'norunTC'];
    }
    this.processData();
  }

   processQuarterData(): void {
    this.quarterDetails.forEach(qtr => {
      qtr.totalFWVersionCount = qtr.firmwareVersion ? qtr.firmwareVersion.length : 0;
      if (qtr.modelFWVersion && Array.isArray(qtr.modelFWVersion) && qtr.modelFWVersion.length > 0) {
        qtr.modelFWVersion.forEach(modelFw => {
          modelFw.FirmwareVersions = modelFw.FirmwareVersion.join(', ');
        });
        this.usersData = [...this.usersData, { ...qtr, modelFWVersion: new MatTableDataSource(qtr.modelFWVersion) }];
      } else {
        delete qtr.modelFWVersion;
        this.usersData = [...this.usersData, qtr];
      }
    });
    this.dataSource = new MatTableDataSource(this.usersData);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  toggleRow(element: QuarterData, column : any): void {
    console.log('element', element, column);
    let openjobLogs = (element['jiraKey'] && column !== 'jiraKey') || !element['jiraKey']; 
    element.modelFWVersion && (element.modelFWVersion as MatTableDataSource<ModelFWVersion>).data.length ?
    (this.expandedElement = this.expandedElement === element ? null : element) : null;
    this.cd.detectChanges();
    this.innerTables.forEach((table, index) => {
     (table.dataSource as MatTableDataSource<any>).paginator = this.paginator1.toArray()[index];
     (table.dataSource as MatTableDataSource<ModelFWVersion>).sort = this.innerSort.toArray()[index];
    });
    if (this.dataType === 'day' && openjobLogs) {
      let regressionData = null;
          let stDate = new Date(element['regStartedAt']);
          stDate.setHours(0, 0, 0, 0);
          let eDate = new Date(element['regStartedAt']);
          eDate.setHours(23, 59, 59, 999);
          console.log('stDate', stDate, 'eDate', eDate);
          this.tlService.getRegressionData(stDate, eDate, 'All').subscribe(data => {
           if (data && Array.isArray(data)) {
              regressionData = data.find(reg => reg._id === element['regId']);
               console.log('regressionData', regressionData);
              this.tlService.viewHTMLLogsForJob(element['job_id'], regressionData ? regressionData.run_id : null);
            }
          });
    }
  }

  applyFilter(filterValue: string): void {
    this.innerTables.forEach((table, index) => (table.dataSource as MatTableDataSource<ModelFWVersion>).filter
    = filterValue.trim().toLowerCase());
  }
}

export interface ModelFWVersion {
  model: string;
  firmwareVersions: string;
}

export interface QuarterData {
  q: string;
  totalReg: string;
  firmwareVersion: string;
  totalTC: string;
  totalPass: string;
  totalFail: string;
  totalAbort: string;
  totalWarn: string;
  totalNorun: string;
  modelFWVersion?: ModelFWVersion[] | MatTableDataSource<ModelFWVersion>;
}



