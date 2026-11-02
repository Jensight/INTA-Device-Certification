import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { DatePipe, formatDate } from '@angular/common';
import { TestLabService } from '../../../@core/services/test-lab.service';
import { LocalDataSource, Cell } from 'angular2-smart-table';
import { StatusDisplayComponent } from '../regression-list/status-display/status.display.component';
// import { Cell } from 'angular2-smart-table';
import { RegressionDisplayComponent } from '../regression-list/regression-name-display/regression-name-display.component';
import { ToolTipDisplayComponent } from 'src/app/@shared/components/tooltip-component/tooltip.component';
import { MatDialog } from '@angular/material/dialog';
import { UpdateRegressionReviewComponent } from './update-regression-review/update-regression-review.component';
import { NavigationStart, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TableStateService } from 'src/app/@core/services/table-state.service';

@Component({
  selector: 'app-regression-result-analysis',
  templateUrl: './regression-result-analysis.component.html',
  styleUrls: ['./regression-result-analysis.component.scss']
})
export class RegressionResultAnalysisComponent implements OnInit {
  selectedTeam
  allYears = [];
  selectedTimeFrame: any;
  sub1;
  sub2;
  startdt: any;
  enddt: any;
  currYrStart: any;
  currYrEnd: any;
  selectedStatus: any;
  source: LocalDataSource = new LocalDataSource();
  allRegressions: any[];
  userList: any[];
  reviewerList: any[];
  currentUserName: any;
  private savedTableState: any = null;
  private tableStateKey: string = 'resultAnalysisTableState';
  public settings = {
    attr: {
      class: 'text-center'
    },
    noDataMessage: 'No Regressions Found',
    pager: {
      perPage: 10
    },
    actions: {
      add: false,
      edit: false,
      delete: false,
      custom: [],
      width: '100px',
      position: 'right',
      class: 'text-center'
    },
    columns: {
      tagName: {
        title: 'Regression Name',
        type: 'custom',
        class: 'text-center',
        editable: false,
        renderComponent: RegressionDisplayComponent,
        componentInitFunction: (instance: RegressionDisplayComponent, cell: Cell) => {
          RegressionDisplayComponent.componentInit(instance, cell, 60, 'regression-result-analysis');
        },
        valuePrepareFunction: (cell, row) => {
          return row.tagName ? row.tagName : row.run_id;
        }
      },
      user: {
        title: 'Triggered By',
        type: 'html',
        width: '100px',
        editable: false,
        filter: {
          type: 'list',
          config: {
            selectText: 'Select',
            list: [

            ],
          },
        },
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 10);
        }
      },
      startTime: {
        title: 'Start Time (UTC)',
        type: 'string',
        width: '120px',
        class: 'text-center',
        sortDirection: 'desc',
        valuePrepareFunction: data => {
          return formatDate(data, 'dd, MMM, yyyy h:mm:ss a', 'en_US')
        }, filterFunction: (data?: any, search?: any) => {
          if (formatDate(data, 'dd, MMM, yyyy h:mm:ss a', 'en_US').toLowerCase().indexOf(search.toLowerCase()) > -1) {
            return true;
          } else {
            return false;
          }
        }
      },
      // startTime: {
      //   sortDirection: 'desc',
      //   hide: true
      // },
      regStatus: {
        title: 'Status',
        type: 'custom',
        editable: false,
        class: 'text-center',
        renderComponent: StatusDisplayComponent,
        componentInitFunction: StatusDisplayComponent.componentInit,
      },
      reviewedBy: {
        title: 'Reviewed By',
        type: 'html',
        editor: {
          type: 'list',
          config: {
            list: null
          },
        }
      },
      reviewdOn: {
        title: 'Reviewed On',
        editable: false,
        valuePrepareFunction: (date) => {
          const datePipe = new DatePipe('en-US');
          return datePipe.transform(date, 'dd, MMM, yyyy hh:mm:ss a', 'GMT+0530');
        }
      },
      failureCategory: {
        title: 'Failure Category',
        type: 'html',
        editor: {
          type: 'list',
          config: {
            list: [],
          },
        }
      },
      freeTextRemarks: {
        title: 'Remarks',
        width: '200px',
        editor: {
          type: 'textarea'
        }

      }

    }
  };
  constructor(private dataService: DataService, private tlService: TestLabService, private tableStateService: TableStateService,
private dialog: MatDialog, private router: Router, private activatedRoute: ActivatedRoute) {
    this.sub1 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
        this.selectedStatus = 'No';
        this.currYrStart = new Date();
        this.currYrStart.setFullYear(this.currYrStart.getFullYear() - 1);
        this.currYrEnd = new Date();
        this.currYrEnd.setDate(this.currYrEnd.getDate() + 1);
        this.startdt = this.currYrStart;
        this.enddt = this.currYrEnd;
        this.getAllRegression(this.currYrStart, this.currYrEnd);
      }
    });
    if (!this.allYears || this.allYears.length === 0) {
      this.dataService.getAllYears().subscribe(data => {
        this.allYears = data;
      });
    }
    this.dataService.getSettingsData().subscribe((settingsdata: any) => {
      if (settingsdata) {
        const data = settingsdata.users.filter(ele => {
          return (ele.role !== 'ThirdPartyUser' && ele.teams.includes(this.selectedTeam))
        })
        const users = data.map(ele => { return ele.username });
        this.reviewerList = users.map(user => {
          return { 'value': user, 'title': user }
        });
        this.settings.columns.reviewedBy.editor.config.list = this.reviewerList;
        const dt = this.dataService.getCurrentUser();
        if (dt && dt.username) {
          this.currentUserName = dt.username;
        }
      }
    });
    this.dataService.getRegressionData().subscribe(data => {
      if (data) {
        this.allRegressions = data;
        this.userList = this.allRegressions.map(function (el) { return el.user; }).filter(function (item, index, inputArray) {
          return inputArray.indexOf(item) == index;
        });
        this.userList.forEach((el, index) => {
          if (el == 'null' || el == null) {
            this.userList.splice(index, 1);

          }
        });
        this.userList.sort((a, b) => {
          if (a.toLowerCase() > b.toLowerCase()) {
            return 1;
          }
          if (a.toLowerCase() < b.toLowerCase()) {
            return -1;
          }
          return 0;
        });
        this.userList = this.userList.map(data => {
          return { 'value': data, 'title': data }
        });
        this.settings.columns.user.filter.config.list = this.userList;
        this.settings = Object.assign({}, this.settings);
        this.allRegressions.forEach((regData, index) => {
          regData['sNo'] = index + 1;
          regData.reg_download_id = regData.run_id;
          // Set firstJobId from the first job's job_id for HTML logs view
          if (regData.job && regData.job.length > 0 && regData.job[0].job_id) {
            regData.firstJobId = regData.job[0].job_id;
          }
          // if (regData.hasOwnProperty('tagName') && regData.tagName != '') {
          //   regData['run_id'] = regData.tagName;
          // }
        });
      const key = 'regressionAnalysisTableState';
        const { filterState, currentPage } = this.tableStateService.getState(key);
        this.source.load(this.allRegressions).then(() => {
            this.source.setPaging(currentPage, this.source.getPaging().perPage, true);
        });
        if (filterState.length > 0) {
            this.source.setFilter(filterState, true);
        }
        // this.source.load(this.allRegressions);
      }
    });
    const sortData = this.dataService.getRegressionSort();
  }

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (
          !event.url.startsWith('/pages/regression/analysis') &&
          !event.url.startsWith('/pages/regression/detail')
        ) {
          const key = 'regressionAnalysisTableState';
          this.tableStateService.clearState(key);
        }
      }
    });
   
    this.selectedTimeFrame = 'current';
    this.selectedStatus = 'No';
    this.settings.actions.custom.push(
      {
        name: 'List',
        title: `<span class="custom-list-icon" title="Job Data"><i class="fa fa-list"></i></span>`
      },
      {
        name: 'Edit',
        title: `<span class="custom-edit-icon" title="Edit"><i class="fa fa-pencil"></i></span>`
      }
    );
  }
  
  onCustom(event): void {
    if (event.action === 'Edit') {
      const datePipe = new DatePipe('en-US');
      const reviewedOnData = event.data.reviewdOn ? event.data.reviewdOn : new Date();
      const formattedReviewedOnData = datePipe.transform(reviewedOnData, 'dd, MMM, yyyy hh:mm:ss a', 'IST');
      const regresionName = event.data.tagName ? event.data.tagName : event.data.run_id;
      const dialogRef = this.dialog.open(UpdateRegressionReviewComponent, {
        width: '700px',
        height: '90vh',
        data: {
          id: event.data._id, regName: regresionName, user: event.data.user, status: event.data.regStatus, reviewer: this.currentUserName,
          reviewedOn: formattedReviewedOnData, failureCategory: event.data.failureCategory, remarks: event.data.freeTextRemarks,
          isReviewed: event.data.isReviewed
        },
        panelClass: 'dynamic-theme',
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result && result.data) {
          if (result.data.success) {
            this.onTimeFrameChange();
          } else {

          }
        }
      });
    }
    else if (event.action === 'List') {
      const key = 'regressionAnalysisTableState';
        if (this.source) {
            const filters = this.source.getFilter();
            const page = this.source.getPaging().page;
            this.tableStateService.saveState(key, filters, page);
        }
      if (event.data.regStatus && event.data.regStatus !== 'Scheduled') {
        this.router.navigate(
          ['/pages/regression/detail', event.data['_id']],
          { state: { fromScreen: 'analysis' } }
        );
      }
    }
  }

  onTimeFrameChange(): void {
    if (this.selectedTimeFrame === 'current') {
      this.getAllRegression(this.currYrStart, this.currYrEnd);
    }
    else if (this.selectedTimeFrame === new Date().getFullYear().toString()) {
      this.startdt = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
      this.enddt = new Date();
      this.enddt.setDate(this.enddt.getDate() + 1);
      this.getAllRegression(this.startdt, this.enddt);
    }
    else {
      this.startdt = new Date(parseInt(this.selectedTimeFrame), 0, 1);
      this.startdt.setHours(0, 0, 0, 0);
      this.enddt = new Date(parseInt(this.selectedTimeFrame), 11, 31);
      this.enddt.setHours(0, 0, 0, 0);
      this.getAllRegression(this.startdt, this.enddt);
    }

  }


  getAllRegression(startDate, endDate): void {
    this.dataService.loading.next(true);
    const stDate = new DatePipe('en-US').transform(startDate, 'yyyy-MM-ddTHH:mm:ss');
    const eDate = new DatePipe('en-US').transform(endDate, 'yyyy-MM-ddTHH:mm:ss');
    let isReviewed = 'All';
    if (this.selectedStatus === 'No') {
      isReviewed = 'No';
    } else if (this.selectedStatus === 'Yes') {
      isReviewed = 'Yes';
    }
    this.sub2 = this.tlService.getRegressionData(stDate, eDate, isReviewed).subscribe(regressionData => {
      if (regressionData) {
        console.log('regressionData', regressionData);
        if (Array.isArray(regressionData)) {
          const dataFiltered = regressionData.filter(data => data.regStatus == 'completed' || data.regStatus == 'aborted' || data.regStatus == 'partial' || data.regStatus == 'stopped');
          this.dataService.getRegressionData().next(dataFiltered);
        }
      }
      this.dataService.loading.next(false);
    });

  }

  /**
      * Set Sort Data
      */

  setSortData() {
    this.dataService.storeRegressionSort(this.source.getSort());
  }

  ngOnDestroy() {
    if (this.sub1) {
      this.sub1.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }

}
