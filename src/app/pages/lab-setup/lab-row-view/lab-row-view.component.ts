import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataService } from 'src/app/@core/services/data.service';
import { AddTestbedDetailsLabComponent } from '../add-testbed-details-lab/add-testbed-details-lab.component';
import { ViewTestbedDetailsComponent } from '../view-testbed-details/view-testbed-details.component';
import { ConfigureTestbedApiComponent } from '../configure-testbed-api/configure-testbed-api.component';
import { ApiService } from 'src/app/@core/services/api.service';

@Component({
  selector: 'app-lab-row-view',
  templateUrl: './lab-row-view.component.html',
  styleUrls: ['./lab-row-view.component.scss']
})
export class LabRowViewComponent implements OnInit, OnChanges {
@Input() labsetupArray: any;
@Input() viewType: string;
@Input() rackData: any;
public sub1;
  public sub2;
  selectTeam: String;
  allDevices: any;
  chamberData = [];
  dutData = [];
  isCTRView = true;
  testbedData = [];
  teamAccess = false;
  existingColumns = [];
  showOriginalColumn = false;
  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private apiService: ApiService,
    
  ) { }

  ngOnInit(): void {
    this.sub1 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        const teamChanged = this.selectTeam && this.selectTeam !== team;
        this.selectTeam = team;
        // If team changed and we have labsetup data, refresh testbed data and update view
        if (teamChanged && this.labsetupArray && this.labsetupArray.length > 0) {
          this.apiService.getTestBed().subscribe(
            (testbedlist: any) => {
              if (testbedlist && Array.isArray(testbedlist)) {
                this.testbedData = testbedlist;
                this.dataService.getTestBed().next(testbedlist);
              }
              setTimeout(() => {
                this.updatechamberName();
              }, 100);
            },
            (error) => {
              console.error('Error fetching testbeds on team change:', error);
              setTimeout(() => {
                this.updatechamberName();
              }, 100);
            }
          );
        }
      }
    });
    this.dataService.getTestBed().subscribe((testbed) => {
     // console.log('Subscribed testbed data in lab-row-view => ', testbed);
      if (testbed && testbed.length > 0) {
        this.testbedData = testbed;
     //   console.log('testbed data in lab-row-view => ', testbed);
        setTimeout(() => {
          this.updatechamberName();
        }, 200);
      } else {
        this.apiService.getTestBed().subscribe(
      (testbedlist: any) => {
        // console.log('Testbed API response:', testbedlist);
        if (testbedlist) {
          if (Array.isArray(testbedlist)) {
            this.testbedData = testbedlist;
            this.dataService.getTestBed().next(testbedlist);
          }
        }
        setTimeout(() => {
          this.updatechamberName();
        }, 200);
      },
      (error) => {
        console.error('Error fetching testbeds:', error);
        setTimeout(() => {
          this.updatechamberName();
        }, 200);
      });
    }
    });
    this.sub2 = this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        this.allDevices = device;
       
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {

    console.log('changes in lab-row-view => ', changes);
    if ((changes['viewType'] && !changes['viewType'].firstChange ) || (changes['labsetupArray'] && !changes['labsetupArray'].firstChange)) {
    //  console.log('viewType changed => ', this.viewType, this.labsetupArray);
      setTimeout(() => {
      this.updatechamberName();
      }, 200);
    }
  }


  updatechamberName() {
    const previousShowContentState = {};
    this.chamberData.forEach(ch => {
      previousShowContentState[ch.chamberName] = ch.showContent;
    });

    this.chamberData = [];
    this.existingColumns = [];
    this.labsetupArray.forEach(ch => {
    let chamber = [];
    let dutDetails = [];
    let chamberName = ch.rackId + '-' + ch.selfName;
    let showContent = previousShowContentState[chamberName] || false;
    this.teamAccess = ch.teams && this.selectTeam && ch.teams.includes(this.selectTeam.toString()) ? true : false;
    ch. rowSettings.forEach(ele => {
      let name = ch.rackId + '-' + ch.selfName + '-' + ele.columnName;
      this.existingColumns.push(name);
      let available = ele.available;
      let device = ele.deviceDetails ? ele.deviceDetails.deviceName : null;
      let dut = ele.columnName.toLowerCase().includes('dut') ? true : false;
     // console.log('ele in rowSettings => ', ele);
      const testbed = ele.testbedId ? this.testbedData.find(tb => tb._id.toString() == ele.testbedId.toString()) : null;
     // console.log('testbed found => ', testbed);
      let teamName = ele.teamName;
      let testbedId = ele.testbedId || '';
      let originalColumn = ele.originalColumn || '';
      let virtual = ele.virtual || false;
      if(dut){
        dutDetails.push({name, available, device, dut, testbed, teamName, testbedId, originalColumn, virtual});
      } else {
        chamber.push({ name, available, device, dut, testbed, teamName, testbedId, originalColumn, virtual });
      }
    });
    this.chamberData.push({chamberName, chamber, dutDetails, showContent });
    });
    console.log('chamberData => ', this.chamberData);
  }

  addTestBed(element: any, chamberName: string) {
   // console.log('Add Test Bed clicked', element, chamberName);
    const nameParts = element.name.split('-');
    const rackId = nameParts[0] || '';
    const selfName = nameParts[1] || '';
    const columnName = nameParts[2] || '';
    
    // Find the rack data from rackData array
    let selectedRack = null;
    if (this.rackData && Array.isArray(this.rackData)) {
      selectedRack = this.rackData.find(rack => (rack.rackId || '').toUpperCase().replace(' ', '') === rackId.toUpperCase().replace(' ', '') ||(rack.rackName || '').toUpperCase().replace(' ', '') === rackId.toUpperCase().replace(' ', '')
      );
    }
    let existingColumns = this.existingColumns.filter(col => col !== element.name);
    existingColumns = existingColumns.filter(col => {
      const parts = col.split('-');
      return parts[0] === rackId && parts[1] === selfName;
    });
    
    const dialogRef = this.dialog.open(AddTestbedDetailsLabComponent, {
      width: '600px',
      disableClose: false,
      data: {
        rackId: rackId,
        selfName: selfName,
        columnName: columnName,
        teamName: this.selectTeam,
        element: element,
        rackData: selectedRack,
        existingColumns: existingColumns
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && (result.status === 'Paired' || result.status === 'Updated' || result.status === 'Unpaired')) {
        console.log(`Testbed ${result.status.toLowerCase()} successfully:`, result);
        
        // Reload testbed data from API to get fresh data
        this.apiService.getTestBed().subscribe(
          (testbedlist: any) => {
            if (testbedlist && Array.isArray(testbedlist)) {
              this.testbedData = testbedlist;
              this.dataService.getTestBed().next(testbedlist);
            }
            // Update chamber view with fresh data
            setTimeout(() => {
              this.labsetupArray.forEach(ch => {
                ch.rowSettings.forEach((ele) => {
                  if (ele.columnName === columnName && ch.rackId === rackId && ch.selfName === selfName) {
                    ele.testbedId = result.data.testbedId;
                    ele.available = result.data.available;
                    ele.testbed = null;
                    ele.teamName = result.data.teamName;
                    ele.virtual = result.data.virtual || false;
                    ele.originalColumn = result.data.originalColumn || '';
                  }
                });
              });
              this.updatechamberName();
            }, 200);
          },
          (error) => {
            console.error('Error reloading testbeds:', error);
            // Still update the view even if reload fails
            setTimeout(() => {
              this.labsetupArray.forEach(ch => {
                ch.rowSettings.forEach((ele) => {
                  if (ele.columnName === columnName && ch.rackId === rackId && ch.selfName === selfName) {
                    ele.testbedId = result.data.testbedId;
                    ele.available = result.data.available;
                    ele.testbed = null;
                    ele.teamName = result.data.teamName;
                    ele.virtual = result.data.virtual || false;
                    ele.originalColumn = result.data.originalColumn || '';
                  }
                });
              });
              this.updatechamberName();
            }, 200);
          }
        );
      }
    });
  }

  viewTestBed(element: any) {
      const nameParts = (element.name || '').split('-');
      const rackId = nameParts[0] || '';
      const selfName = nameParts[1] || '';
      const columnName = nameParts[2] || '';

      let selectedRack = null;
      if (this.rackData && Array.isArray(this.rackData)) {
        selectedRack = this.rackData.find(rack =>
          (rack.rackId || '').toUpperCase().replace(' ', '') === rackId.toUpperCase().replace(' ', '') ||
          (rack.rackName || '').toUpperCase().replace(' ', '') === rackId.toUpperCase().replace(' ', '')
        );
      }

      const dialogRef = this.dialog.open(ViewTestbedDetailsComponent, {
      width: '800px',
      disableClose: false,
      data: {
        element: element,
        rackData: selectedRack,
        rackId: rackId,
        selfName: selfName,
        columnName: columnName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
    });

  }

  configureTestBed(element: any) {
    const nameParts = (element.name || '').split('-');
    const rackId = nameParts[0] || '';
    const selfName = nameParts[1] || '';
    const columnName = nameParts[2] || '';

    let selectedRack = null;
    if (this.rackData && Array.isArray(this.rackData)) {
      selectedRack = this.rackData.find(rack =>
        (rack.rackId || '').toUpperCase().replace(' ', '') === rackId.toUpperCase().replace(' ', '') ||
        (rack.rackName || '').toUpperCase().replace(' ', '') === rackId.toUpperCase().replace(' ', '')
      );
    }

    const dialogRef = this.dialog.open(ConfigureTestbedApiComponent, {
      width: '750px',
      disableClose: false,
      data: {
        element: element,
        rackData: selectedRack,
        rackId: rackId,
        selfName: selfName,
        columnName: columnName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Configure Testbed API result => ', result);
      }
    });
  }

  refreshTestBed(element: any) {
    console.log('Refresh Test Bed clicked', element);
  }

  ngOnDestroy(): void {
    if (this.sub1) {
      this.sub1.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
  }
}
