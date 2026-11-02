import { Component, OnInit } from '@angular/core';
import { Cell, LocalDataSource } from 'angular2-smart-table';
import { ToolTipDisplayComponent } from '../../../@shared/components/tooltip-component/tooltip.component';
import { TestLabService } from 'src/app/@core/services/test-lab.service';
import { DataService } from 'src/app/@core/services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RegressionDisplayComponent } from '../../regression/regression-list/regression-name-display/regression-name-display.component';
import { Router } from '@angular/router';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-auto-regression-result',
  templateUrl: './auto-regression-result.component.html',
  styleUrls: ['./auto-regression-result.component.scss']
})
export class AutoRegressionResultComponent implements OnInit {
  settings = {
    attr: {
      class: 'text-center'
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

      TestBed: {
        title: 'TestBed',
        width: '400px',
        type: 'html',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 80);
        },
      },
      TestSuites: {
        title: 'TestSuites',
        width: '600px',
        type: 'html',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 120);
        },
      },

      DUTName: {
        title: 'DUTName',
        type: 'html',
        width: '250px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 50);
        },
      },
      FW_Community: {
        title: 'FW Community',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        },
      },
      FW_Upgraded: {
        title: 'FW Upgraded',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        },
      },
      Regression_Trigger_Status: {
        title: 'Regression Trigger Status',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 40);
        },
      },
      Remarks: {
        title: 'Remarks',
        type: 'custom',
        width: '350px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 80);
        },
      },
      Old_FW_Version: {
        title: 'Old FW Version',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        }
      },
      New_FW_Version: {
        title: 'New FW Version',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        },
      },
      Regression_Name: {
        title: 'Regression Name',
        type: 'custom',
        width: '350px',
        class: 'text-center',
        renderComponent: RegressionDisplayComponent,
        componentInitFunction: (instance: RegressionDisplayComponent, cell: Cell) => {
          instance.rowData = cell.getRow().getData();
          instance.source = this.source;
          RegressionDisplayComponent.componentInit(instance, cell, 120, 'auto-regression-result');
        }
      },
      Last_Updated: {
        title: 'Last Updated',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 40);
        },
      }
    }
  };
  consolidatedSettings = {
    attr: {
      class: 'text-center'
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

      Total_No_of_DUTs: {
        title: 'Total No.of DUTs',
        width: '200px',
        type: 'html',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 80);
        }
      },
      FW_Upgrade_observed_DUTs: {
        title: 'FW Upgrade observed DUTs',
        width: '180px',
        type: 'html',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 120);
        }
      },

      NO_FW_upgrade_DUTs: {
        title: 'NO FW upgrade DUTs',
        type: 'html',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 50);
        }
      },
      Failed_to_fetch_FW_due_to_CM_OFFLINE_NoResponse_NotExist_DUTs: {
        title: 'Failed to fetch FW due to CM OFFLINE_NoResponse_NotExist_DUTs',
        type: 'custom',
        width: '180px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        }
      },
      FW_Upgrade_observed_on_internal_community_DUTs: {
        title: 'FW Upgraded - internal community DUTs',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        }
      },
      FW_Upgrade_observed_on_prod_community_DUTs: {
        title: 'FW Upgrade - prod community DUTs',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        }
      },
      Regression_scheduled_now_DUTs: {
        title: 'Regression scheduled now DUTs',
        type: 'custom',
        width: '180px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 80);
        }
      },
      Regression_scheduled_later_DUTs: {
        title: 'Regression scheduled later DUTs',
        type: 'custom',
        width: '180px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        }
      },
      Failed_to_trigger_regression_DUTs: {
        title: 'Failed to trigger regression DUTs',
        type: 'custom',
        width: '180px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        }
      },
      Last_Updated: {
        title: 'Last Updated',
        type: 'custom',
        width: '200px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 40);
        }
      }
    }
  };

  source: LocalDataSource;
  consolidatedSource: LocalDataSource;
  data: any;
  result: any;
  allTestsuite: any;
  allDevices: any;
  path: any;
  selectedTeam: any;
  fwUpgradedFilter: string = 'YES';
  testSetFilter = false;
  consolidatedResult: boolean = false;
  hasUnSavedData = false;
  autoRegressionDbData: any;
  allRegressionData: any = []; // To store all regression data for lookup
  constructor(private dataService: DataService, private testLabService: TestLabService, public snackBar: MatSnackBar, private router: Router) { }

  ngOnInit(): void {
    this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
        this.dataService.loading.next(true);

        // First fetch all regression data for lookup
        this.fetchAllRegressionData().then(() => {
          this.testLabService.getRegressionResultDATA({ teamName: team }).subscribe({
            next: (dt) => {
              this.result = dt;
              this.data = this.result['data'];
              // const filtered = this.data.filter(row => row.FW_Upgraded === 'YES');
              const resultRecords = this.data.filter(rec => rec.type !== 'start_reg_result');
              console.log('resultRecords289', resultRecords);

              // Transform data to include required fields for navigation
              const transformedData = this.transformDataForNavigation(resultRecords);

              const filtered = transformedData.filter(row => row.FW_Upgraded === 'YES');
              this.fwUpgradedFilter = 'YES';
              this.source = new LocalDataSource(filtered);
              let regResult = this.data.filter(row => row.type === 'start_reg_result');
              this.consolidatedSource = new LocalDataSource(regResult);
              this.updateColumnVisibility();
              this.dataService.loading.next(false);
            },
            error: (error) => {
              this.snackBar.open('Error loading regression result data', 'Close', { duration: 3000 });
              this.dataService.loading.next(false);
            }
          });
        });
      } else {
        this.dataService.loading.next(false);
      }
    });
  }

  onFWUpgradedFilterChange() {
    let filtered;
    const resultRecords = this.data.filter(rec => rec.type !== 'start_reg_result');

    // Transform data to include required fields for navigation
    const transformedData = this.transformDataForNavigation(resultRecords);

    if (this.fwUpgradedFilter === 'ALL') {
      filtered = transformedData;
    } else {
      filtered = transformedData.filter(row => row.FW_Upgraded === this.fwUpgradedFilter);
    }
    this.source.load(filtered);
    this.updateColumnVisibility();
  }

  private async fetchAllRegressionData(): Promise<void> {
    try {
      // Fetch last year's regression data to match against
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const stDate = startDate.toISOString().slice(0, 19);
      const eDate = endDate.toISOString().slice(0, 19);

      const regressionData = await this.testLabService.getRegressionData(stDate, eDate, 'All').toPromise();
      this.allRegressionData = Array.isArray(regressionData) ? regressionData : [];
    } catch (error) {
      console.error('Error fetching regression data for lookup:', error);
      this.allRegressionData = [];
    }
  }

  private isRawDateValue(val: any): boolean {
    if (val instanceof Date) return true;
    if (typeof val === 'string') {
      return /^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/.test(val);
    }
    return false;
  }

  private transformDataForNavigation(records: any[]): any[] {
    return records.map(record => {
      // Fix existing DB records where Old_FW_Version and Last_Updated are swapped
      // (Old_FW_Version has a date/timestamp, Last_Updated is null)
      if (!record._dataFixed) {
        if (this.isRawDateValue(record.Old_FW_Version) && !record.Last_Updated) {
          record.Last_Updated = record.Old_FW_Version;
          record.Old_FW_Version = null;
        }

        // Format Last_Updated properly if it's a raw date string
        if (record.Last_Updated && this.isRawDateValue(record.Last_Updated)) {
          record.Last_Updated = this.formatDateToUTC(String(record.Last_Updated));
        }

        // If Last_Updated is still empty, use processedAt as fallback
        if (!record.Last_Updated && record.processedAt) {
          record.Last_Updated = this.formatDateToUTC(String(record.processedAt));
        }

        record._dataFixed = true;
      }

      // If Regression_Name contains a regression ID or name, try to find the matching regression
      if (record.Regression_Name && record.Regression_Name.trim() !== '') {
        // Try to find the regression by name in the all regression data
        const matchingRegression = this.allRegressionData.find(reg =>
          reg.run_id === record.Regression_Name ||
          reg.tagName === record.Regression_Name ||
          (reg.run_id && reg.run_id.includes(record.Regression_Name)) ||
          (reg.tagName && reg.tagName.includes(record.Regression_Name))
        );

        if (matchingRegression) {
          record._id = matchingRegression._id;
          record.regStatus = matchingRegression.regStatus || 'Completed';
          record.run_id = matchingRegression.run_id || record.Regression_Name;
          record.reg_download_id = matchingRegression.reg_download_id || matchingRegression._id;
          record.hasMatchingRegression = true;

          // Replace Last_Updated with Start Time UTC when regression matches
          if (matchingRegression.startTime) {
            record.Last_Updated = this.formatDateToUTC(matchingRegression.startTime);
          }
        } else {
          // If no matching regression found, set default values and flag
          record._id = record.Regression_Name; // Use name as fallback
          record.regStatus = 'Completed';
          record.run_id = record.Regression_Name;
          record.hasMatchingRegression = false;
        }
      }
      return record;
    });
  }

  private formatDateToUTC(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      // Use the exact same formatting as regression list: 'dd, MMM, yyyy h:mm:ss a'
      return formatDate(date, 'dd, MMM, yyyy h:mm:ss a', 'en_US');
    } catch (error) {
      return 'Invalid Date';
    }
  }

  updateColumnVisibility() {
    // Always rebuild columns in the correct order to prevent reordering issues
    const showExtraColumns = this.fwUpgradedFilter === 'YES' || this.fwUpgradedFilter === 'ALL';
    const baseColumns: any = {
      TestBed: this.settings.columns.TestBed,
      TestSuites: this.settings.columns.TestSuites,
      DUTName: this.settings.columns.DUTName,
      FW_Community: this.settings.columns.FW_Community,
      FW_Upgraded: this.settings.columns.FW_Upgraded,
      Regression_Trigger_Status: this.settings.columns.Regression_Trigger_Status,
      Remarks: this.settings.columns.Remarks,
    };

    if (showExtraColumns) {
      baseColumns.Old_FW_Version = {
        title: 'Old FW Version',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        },
      };
      baseColumns.New_FW_Version = {
        title: 'New FW Version',
        type: 'custom',
        width: '150px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 30);
        },
      };
      baseColumns.Regression_Name = {
        title: 'Regression Name',
        type: 'custom',
        width: '350px',
        class: 'text-center',
        renderComponent: RegressionDisplayComponent,
        componentInitFunction: (instance: RegressionDisplayComponent, cell: Cell) => {
          instance.rowData = cell.getRow().getData();
          instance.source = this.source;
          RegressionDisplayComponent.componentInit(instance, cell, 120, 'auto-regression-result');
        }
      };
    }

    baseColumns.Last_Updated = {
      title: 'Last Updated',
      type: 'custom',
      width: '200px',
      class: 'text-center',
      renderComponent: ToolTipDisplayComponent,
      componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
        ToolTipDisplayComponent.componentInit(instance, cell, 40);
      }
    };

    this.settings = {
      ...this.settings,
      columns: baseColumns
    };
    this.settings = { ...this.settings };
  }
}
