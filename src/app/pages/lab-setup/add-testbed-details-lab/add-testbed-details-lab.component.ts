import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from 'src/app/@core/services/api.service';
import { DataService } from 'src/app/@core/services/data.service';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
  selector: 'app-add-testbed-details-lab',
  templateUrl: './add-testbed-details-lab.component.html',
  styleUrls: ['./add-testbed-details-lab.component.scss']
})
export class AddTestbedDetailsLabComponent implements OnInit {
  allTestbeds: any[] = [];
  testbedsList: any[] = [];
  selectedTestbed: any = null;
  loading: boolean = false;
  testbedEdit: boolean = false;
  assignedTestbedName: string = '';
  selectedTeam: String;
  showPairedTestbeds: boolean = false;
  showInactiveTestbeds: boolean = true;
  virtual: boolean = false;
  existingColumns = [];
  selectedColumn: string = null;
  constructor(
    public dialogRef: MatDialogRef<AddTestbedDetailsLabComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
    private dataService: DataService,
    private deviceService: DeviceInventoryService,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) { }

  private settingsLoaded = false;

  ngOnInit(): void {
    this.testbedEdit = !!(this.data && this.data.element && this.data.element.testbedId);
    console.log('inside add testbed:', this.data);
    this.existingColumns = this.data.existingColumns || [];
    this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    
    if (!this.settingsLoaded) {
      this.settingsLoaded = true;
      this.userService.getAllusers().subscribe((settings: any) => {
        // Read from LabSetUp instead of dashboardConfig
        if (settings && settings[0] && settings[0].LabSetUp) {
          const labSetUpConfig = Array.isArray(settings[0].LabSetUp) 
            ? settings[0].LabSetUp[0] 
            : settings[0].LabSetUp;
        console.log('LabSetUp config:', labSetUpConfig);
          if (labSetUpConfig) {
            this.showPairedTestbeds = !!labSetUpConfig.show_paired_testbeds;
            // Default to true if not set
            this.showInactiveTestbeds = labSetUpConfig.show_inactive_testbeds !== undefined 
              ? !!labSetUpConfig.show_inactive_testbeds 
              : true;
          }
        }
        this.loadTestbeds();
      }, (error) => {
        const cachedData = this.dataService.getSettingsData().getValue();
        if (cachedData && cachedData.LabSetUp) {
          const labSetUpConfig = Array.isArray(cachedData.LabSetUp) 
            ? cachedData.LabSetUp[0] 
            : cachedData.LabSetUp;
          if (labSetUpConfig) {
            this.showPairedTestbeds = !!labSetUpConfig.show_paired_testbeds;
            this.showInactiveTestbeds = labSetUpConfig.show_inactive_testbeds !== undefined 
              ? !!labSetUpConfig.show_inactive_testbeds 
              : true;
          }
        }
        this.loadTestbeds();
      });
    }
  }

  loadTestbeds() {
    this.loading = true;
    this.apiService.getTestBed().subscribe((response: any) => {
      this.loading = false;
      console.log('Testbed API response:', response);
      let testbeds = [];
      if (response) {
        if (Array.isArray(response)) {
          testbeds = response;
        }
      }
      this.allTestbeds = testbeds.filter(tb => tb.testBedName);

      // Exclude dynamic-enabled testbeds (used only in Dynamic Scheduler)
      this.allTestbeds = this.allTestbeds.filter(tb => !tb.dynamic);
      
      // Filter inactive testbeds if showInactiveTestbeds is false
      if (!this.showInactiveTestbeds) {
        this.allTestbeds = this.allTestbeds.filter(tb => tb.status !== 'inactive');
      }
      
      this.loadPairedTestbedIds();
      this.testbedsList = [...this.allTestbeds];
      console.log('All testbeds:', this.allTestbeds);

      // If in edit mode (testbedId exists), find and display the assigned testbed
      if (this.testbedEdit && this.data.element && this.data.element.testbedId) {
        const testbedExist = this.allTestbeds.find(tb => {
          const tbId = tb._id || tb.testBedId;
          return tbId === this.data.element.testbedId;
        });

        if (testbedExist) {
          this.selectedTestbed = testbedExist;
          this.assignedTestbedName = testbedExist.testBedName;
          this.virtual = this.data.element.virtual || false;
          this.selectedColumn = this.data.element.originalColumn || null;
          console.log('Found assigned testbed:', this.assignedTestbedName);
        } else {
          console.warn('Testbed not found for ID:', this.data.element.testbedId);
        }
      }

    },
      (error) => {
        this.loading = false;
        console.error('Error loading testbeds:', error);
        this.snackBar.open('Failed to load testbeds. Please try again.', 'Close', {
          duration: 5000
        });
      }
    );
  }

  pairedTestbedIds: string[] = [];

  loadPairedTestbedIds() {
    this.pairedTestbedIds = [];

    this.userService.getLabSetDetails().subscribe((labSetData: any) => {
      if (labSetData && Array.isArray(labSetData)) {
        labSetData.forEach((rack: any) => {
          if (rack.design && Array.isArray(rack.design)) {
            rack.design.forEach((shelf: any) => {
              if (Array.isArray(shelf)) {
                shelf.forEach((slot: any) => {
                  if (slot.testbedId && slot.testbedId !== '') {
                    // Check if this is the current slot being edited
                    const currentRackId = this.data.rackId ? this.data.rackId.toUpperCase().replace(' ', '') : '';
                    const slotRackId = rack.rackId ? rack.rackId.toUpperCase().replace(' ', '') : '';
                    const slotRackName = rack.rackName ? rack.rackName.toUpperCase().replace(' ', '') : '';
                    
                    const isCurrentSlot = this.testbedEdit && 
                      this.data.element && 
                      slot.testbedId === this.data.element.testbedId &&
                      slot.shelf === this.data.selfName &&
                      slot.coloum === this.data.columnName && 
                      (slotRackId === currentRackId || slotRackName === currentRackId);
                    
                    if (!isCurrentSlot) {
                      // Avoid duplicate entries
                      if (!this.pairedTestbedIds.includes(slot.testbedId)) {
                        this.pairedTestbedIds.push(slot.testbedId);
                      }
                    }
                  }
                });
              }
            });
          }
        });
      }
      console.log('Paired testbed IDs:', this.pairedTestbedIds);
      this.applyTestbedFilter();
    }, (error) => {
      console.error('Error loading lab set details:', error);
      this.applyTestbedFilter();
    });
  }

  applyTestbedFilter() {
    if (this.showPairedTestbeds) {
      this.testbedsList = [...this.allTestbeds];
      const pairedInList = this.testbedsList.filter(tb => {
        const tbId = tb._id || tb.testBedId;
        return this.pairedTestbedIds.includes(tbId);
      });
    } else {
      this.testbedsList = this.allTestbeds.filter(tb => {
        const tbId = tb._id || tb.testBedId;
        if (this.testbedEdit && this.data.element && this.data.element.testbedId === tbId) {
          return true;
        }
        return !this.pairedTestbedIds.includes(tbId);
      });
    }
  }

  isTestbedPaired(testbed: any): boolean {
    const tbId = testbed._id || testbed.testBedId;
    if (this.testbedEdit && this.data.element && this.data.element.testbedId === tbId) {
      return false;
    }
    return this.pairedTestbedIds.includes(tbId);
  }

  getTestbedTooltip(testbed: any): string {
    if (this.isTestbedPaired(testbed)) {
      return `${testbed.testBedName} (Already Paired - Unpair first to use)`;
    }
    return testbed.testBedName;
  }

  filterTestbeds(event: any) {
    const searchValue = event.target.value.toLowerCase();
    let baseList = this.allTestbeds;
    if (!this.showPairedTestbeds) {
      baseList = this.allTestbeds.filter(tb => {
        const tbId = tb._id || tb.testBedId;
        if (this.testbedEdit && this.data.element && this.data.element.testbedId === tbId) {
          return true;
        }
        return !this.pairedTestbedIds.includes(tbId);
      });
    }
    
    if (searchValue) {
      this.testbedsList = baseList.filter(tb =>
        tb.testBedName && tb.testBedName.toLowerCase().includes(searchValue)
      );
    } else {
      this.testbedsList = [...baseList];
    }
  }

  onSearchKeydown(event: KeyboardEvent) {
    event.stopPropagation();
  }

  onUnpair() {
    if (!this.data.element || !this.data.element.testbedId) {
      this.snackBar.open('No testbed to unpair', 'OK', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.dataService.loading.next(true);
    const oldTestbedId = this.data.element.testbedId;
    const clearOldTestbedPayload = {
      _id: oldTestbedId,
      selfName: '',
      columnName: '',
      rackId: '',
      labIndex: ''
    };
    console.log('Clearing old testbed lab details:', clearOldTestbedPayload);
    this.deviceService.pairDeviceToTestbed(clearOldTestbedPayload).subscribe(
      (response: any) => {
        console.log('Old testbed cleared:', response);
        const rackData = this.data.rackData;
        let labsetUpTemp: any = null;
        let availableRack = false;
        if (rackData.design && Array.isArray(rackData.design)) {
          for (let j = 0; j < rackData.design.length; j++) {
            for (let k = 0; k < rackData.design[j].length; k++) {
              if (rackData.design[j][k].shelf === this.data.selfName &&
                rackData.design[j][k].coloum === this.data.columnName) {
                rackData.design[j][k].available = true;
                rackData.design[j][k].testbedId = '';
                rackData.design[j][k].teamName = '';
                rackData.design[j][k].virtual = false;
                rackData.design[j][k].originalColumn = '';

                if (rackData.design[j][k].deviceId) {
                  delete rackData.design[j][k].deviceId;
                }
                availableRack = true;
                break;
              }
            }
            if (availableRack) break;
          }
        }
        labsetUpTemp = rackData;

        // Update lab setup config
        this.userService.updateLabSetConf(labsetUpTemp).subscribe(
          (data: any) => {
            this.loading = false;
            this.dataService.loading.next(false);
           // this.dataService.getSettingsData().next(data[0]);
            this.snackBar.open('Testbed unpaired successfully', 'OK', {
              duration: 5000
            });
            this.data.element.testbedId = '';
            this.data.element.available = true;
            this.data.element.testbed = null;
            this.data.element.teamName = null;
            this.data.element.virtual = false;
            this.data.element.originalColumn = '';
            console.log('Lab setup updated after unpairing:', this.data.element);
            this.dialogRef.close({ status: 'Unpaired', data : this.data.element });
          },
          (error) => {
            this.loading = false;
            this.dataService.loading.next(false);
            console.error('Error updating lab setup:', error);
            this.snackBar.open('Error updating lab setup', 'Try Again', {
              duration: 5000
            });
          }
        );
      },
      (error) => {
        this.loading = false;
        this.dataService.loading.next(false);
        console.error('Error clearing old testbed:', error);
        this.snackBar.open('Error clearing old testbed', 'Try Again', {
          duration: 5000
        });
      }
    );
  }

  onConfirm() {
    if (this.selectedTestbed) {
      this.loading = true;
      this.dataService.loading.next(true);
      const newTestbedId = this.selectedTestbed._id || this.selectedTestbed.testBedId;
      const oldTestbedId = this.testbedEdit && this.data.element ? this.data.element.testbedId : null;
      const isChangingTestbed = this.testbedEdit && oldTestbedId && oldTestbedId !== newTestbedId;
      const data_list = {
        _id: newTestbedId,
        selfName: this.data.selfName || '',
        columnName: this.data.columnName || '',
        rackId: this.data.rackId || '',
        labIndex: this.data.rackId ? `${this.data.rackId}_${this.data.selfName}_${this.data.columnName}` : ''
      };

      console.log(this.testbedEdit ? 'Updating testbed payload:' : 'Pairing testbed payload:', data_list);
      console.log('Is changing testbed:', isChangingTestbed, 'Old:', oldTestbedId, 'New:', newTestbedId);
      if (isChangingTestbed) {
        const clearOldTestbedPayload = {
          _id: oldTestbedId,
          selfName: '',
          columnName: '',
          rackId: '',
          labIndex: ''
        };

        console.log('Clearing old testbed before update:', clearOldTestbedPayload);

        this.deviceService.pairDeviceToTestbed(clearOldTestbedPayload).subscribe(
          (clearResponse: any) => {
            console.log('Old testbed cleared:', clearResponse);
            this.pairNewTestbed(data_list);
          },
          (error) => {
            console.error('Error clearing old testbed:', error);
            // this.pairNewTestbed(data_list);
          }
        );
      } else {
        this.pairNewTestbed(data_list);
      }
    }
  }

  pairNewTestbed(data_list: any) {
    this.deviceService.pairDeviceToTestbed(data_list).subscribe(
      (response: any) => {
        console.log(this.testbedEdit ? 'Updated testbed response:' : 'Paired testbed response:', response);
        this.updateLabSetupConfig(data_list);
      },
      (error) => {
        this.loading = false;
        this.dataService.loading.next(false);
        console.error('Error pairing testbed:', error);
        this.snackBar.open(this.testbedEdit ? 'Error updating testbed' : 'Error pairing testbed', 'Try Again', {
          duration: 5000
        });
      }
    );
  }

  updateLabSetupConfig(payload: any) {
    const rackData = this.data.rackData;
    
    let labsetUpTemp: any = null;
    const payloadRackId = (payload.rackId || '').toUpperCase().replace(' ', '');
    let availableRack = false;
    
    if (rackData.design && Array.isArray(rackData.design)) {
      for (let j = 0; j < rackData.design.length; j++) {
        for (let k = 0; k < rackData.design[j].length; k++) {
          
          if (rackData.design[j][k].shelf === payload.selfName &&
            rackData.design[j][k].coloum === payload.columnName) {
            rackData.design[j][k].available = false;
            rackData.design[j][k].testbedId = payload._id;
            rackData.design[j][k].teamName = this.selectedTeam || '';
            rackData.design[j][k].virtual = this.virtual;
            if (this.virtual && this.selectedColumn) {
              rackData.design[j][k].originalColumn = this.selectedColumn;
            } else {
              rackData.design[j][k].originalColumn = '';
            }
            
            availableRack = true;
            break;
          }
        }
        if (availableRack) break;
      }
    }
    
    labsetUpTemp = rackData;

    // Call update lab setup API
    this.userService.updateLabSetConf(labsetUpTemp).subscribe(
      (data: any) => {
        this.loading = false;
        this.dataService.loading.next(false);
        this.dataService.getSettingsData().next(data[0]);
        const successMessage = this.testbedEdit ? 'Testbed updated successfully' : 'Testbed paired successfully';
        const statusMessage = this.testbedEdit ? 'Updated' : 'Paired';
        this.snackBar.open(successMessage, 'OK', {
          duration: 5000
        });
        this.data.element.testbedId = this.selectedTestbed._id;
        this.data.element.available = false;
        this.data.element.testbed = null;
        this.data.element.teamName = this.selectedTeam;
        this.data.element.virtual = this.virtual;
        this.data.element.originalColumn = this.virtual ? this.selectedColumn : '';
        this.dialogRef.close({ status: statusMessage, data: this.data.element });
      },
      (error) => {
        this.loading = false;
        this.dataService.loading.next(false);
        console.error('Error updating lab setup:', error);
        this.snackBar.open('Error updating lab setup', 'Try Again', {
          duration: 5000
        });
      }
    );
  }

  toggleButtonChange() {
    console.log("togglebutton", this.virtual);
    if (!this.virtual) {
      this.selectedColumn = null;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

}
