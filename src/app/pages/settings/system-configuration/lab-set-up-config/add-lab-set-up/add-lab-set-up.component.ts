import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';
import * as _ from 'lodash';
import { DeviceInventoryService } from 'src/app/@core/services/device-inventory.service';
import { ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
@Component({
  selector: 'app-add-lab-set-up',
  templateUrl: './add-lab-set-up.component.html',
  styleUrls: ['./add-lab-set-up.component.scss']
})
export class AddLabSetUpComponent implements OnInit, OnDestroy {
  showErrorMessage: boolean;
  teamList: any;
  originalShelfValue: any;

  constructor(public userServices: UserService, public dialogRef: MatDialogRef<AddLabSetUpComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any, public dataService: DataService, private dInventoryService: DeviceInventoryService, 
    public snackBar: MatSnackBar, public dialog: MatDialog,
    public deviceService : DeviceInventoryService) { }
  public add_lab_setup: UntypedFormGroup;
  labSetUp: any = {rackFor:'Chamber', NoChamber:1};
  chamberDownValue: any = [1,2,3,4,5,6,7,8];
  dutDownValue:any = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  clientDownValue: any = [1,2,3,4,5,6,7,8,9,10];
  shelfDownValue: any = [1,2,3,4,5,6,7,8];
  columnDownValue: any = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
  columnCount = 15;
  allDevices: any = [];
  editFlag: boolean = false;
  sub1: any;
  selectedTeam: any;
  ctrTestBedCount = 2;
  teamListNames
  isTeamSelected: boolean = false;
  existingRackNames: any = [];
  existingLabSetup: any = {};
  ngOnInit(): void {
    this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.add_lab_setup = new UntypedFormGroup({
      rackName: new UntypedFormControl('', [Validators.required]),
      rackId : new UntypedFormControl('CTR' + (this.data.ctrCount ? this.data.ctrCount + 1 : 1)),
      rackFor: new UntypedFormControl('Chamber', [Validators.required]),
      chamber: new UntypedFormControl(false),
      DUT: new UntypedFormControl(''),
      Client: new UntypedFormControl(''),
      Data: new UntypedFormControl(false),
      Shelf: new UntypedFormControl(''),
      Column: new UntypedFormControl(''),
      NoChamber: new UntypedFormControl(1),
      teams: new UntypedFormControl([], [Validators.required])
    })
    this.add_lab_setup.controls['Shelf'].valueChanges.subscribe(value => {
      this.syncDetails('shelf', value);
    });
    this.add_lab_setup.controls['NoChamber'].valueChanges.subscribe(value => {
      this.syncDetails('chamber', value);
    });
    if (this.data) {
      this.labSetUp.rackId = 'CTR' + (this.data.ctrCount ? this.data.ctrCount + 1 : 1);
      if (this.data.data && this.data.data._id) {
        this.existingLabSetup = JSON.parse(JSON.stringify(this.data.data));
;
        this.labSetUp = {};
        this.editFlag = true;
        this.labSetUp = JSON.parse(JSON.stringify(this.data.data));
        this.isTeamSelected = this.labSetUp.teams && this.labSetUp.teams.length > 0 ? true : false;
        this.add_lab_setup.patchValue({
          rackName: this.labSetUp.rackName,
        });
        this.add_lab_setup.get('rackId')?.disable({ emitEvent: false });
        if (this.editFlag) {
        if (this.labSetUp.teams) {
          this.add_lab_setup.get('teams').setValue([...this.labSetUp.teams]);
        }
        this.originalShelfValue =  this.labSetUp.rackFor === 'Chamber' ? this.labSetUp.NoChamber || 1 : this.labSetUp.Shelf || 1;
        let shelfOrChamberCount = this.labSetUp.rackFor === 'Chamber' ? this.labSetUp.NoChamber : this.labSetUp.Shelf;
        this.syncDetails(this.labSetUp.rackFor === 'Chamber' ? 'chamber' : 'shelf', shelfOrChamberCount);
      }
        this.sub1 = this.dataService.getAllDevices().subscribe((data: any) => {
          this.allDevices = data;
        }, err => {
        })
      }
      if (this.data.existingRackNames) {
        this.existingRackNames = this.data.existingRackNames;
      }
    }
    this.add_lab_setup.get('rackId')?.disable({ emitEvent: false });
    this.dataService.getSettingsData().subscribe(data => {
      if (data && Array.isArray(data.teams)) {
        this.teamList = data.teams;
        const temp = [];
        for (let i = 0; i < this.teamList.length; i++) {
          temp.push({
            name: this.teamList[i].name,
            status: false
          });
        }
        this.teamListNames = temp;
      } else {
        this.teamListNames = [];
      }
      if (this.editFlag && this.labSetUp.teams) {
        this.add_lab_setup.get('teams').setValue([...this.labSetUp.teams]);
      }
  });
    this.add_lab_setup.get('rackName').valueChanges.subscribe(d => {
      this.add_lab_setup.get('rackName').setErrors(null);
      if (!Boolean(this.add_lab_setup.get('rackName').value)) {
        this.add_lab_setup.get('rackName').setErrors({ required: true });
      }
      const currentName = this.editFlag && this.labSetUp && this.labSetUp.rackName
        ? this.labSetUp.rackName.toLowerCase()
        : null;
      if (
        this.existingRackNames &&
        this.existingRackNames.length > 0 &&
        this.existingRackNames
          .filter(name => name.toLowerCase() !== currentName)
          .some(name => name.toLowerCase() === d?.toLowerCase())
      ) {
        this.add_lab_setup.get('rackName').setErrors({ 'duplicateName': true });
      }
    });
  }

  selectRackFor() {
    if (this.labSetUp.rackFor == 'Chamber') {
      this.labSetUp.chamber = true;
      this.labSetUp.Data = false;
      this.labSetUp.NoChamber = 1;
      this.labSetUp.Shelf = null;
      this.labSetUp.shelfDetails = null;
      this.labSetUp.rackId = 'CTR' + (this.data.ctrCount ? this.data.ctrCount + 1 : 1);
      this.add_lab_setup.patchValue({
        chamber: true,
        Data: false,
        Shelf: null,
        rackId: this.labSetUp.rackId
      });

    } else if (this.labSetUp.rackFor == 'Data') {
      this.labSetUp.chamber = false;
      this.labSetUp.Data = true;
      this.labSetUp.Shelf = 1;
      this.labSetUp.NoChamber = null;
      this.labSetUp.chamberDetails = null;
      this.labSetUp.rackId = 'DTR' + (this.data.dtrCount ? this.data.dtrCount + 1 : 1);
      this.add_lab_setup.patchValue({
        chamber: false,
        Data: true,
        NoChamber: null,
        rackId: this.labSetUp.rackId
      });
    }
  }


  syncDetails(type: 'shelf' | 'chamber', count: number) {
    const desired = Number(count) || 0;
    if (!this.labSetUp) { this.labSetUp = {}; }
    const key = type === 'shelf' ? 'shelfDetails' : 'chamberDetails';
    const namePrefix = type === 'shelf' ? 'S' : 'CH';
    if (!Array.isArray(this.labSetUp[key])) { this.labSetUp[key] = []; }
    while (this.labSetUp[key].length < desired) {
      this.labSetUp[key].push({
        [type === 'shelf' ? 'shelfName' : 'chamberName']: namePrefix + (this.labSetUp[key].length + 1),
        column: 1
      });
    }
    while (this.labSetUp[key].length > desired) {
      this.labSetUp[key].pop();
    }
  }

  shelfArray: any = [];
  chamberArray: any = [];
  columnArray: any = [];
  ctrColumnArray: any = [];
  dtrColumnArray: any = [];

  addRack(){
    var temp:any = {};
    temp.rackName = this.labSetUp.rackName;
    temp.rackId = this.labSetUp.rackId;
    temp.rackFor = this.labSetUp.rackFor;
    if (this.labSetUp.rackFor == 'Chamber') {
      this.chamberArray = [];
      this.ctrColumnArray = [];
      for (let j = 1; j <= parseInt(this.labSetUp.NoChamber); j++) {
        this.chamberArray.push('CH' + j);
      }
      this.labSetUp.chamberDetails.forEach(chamber => {
        let row = [];
        for (let k = 1; k <= parseInt(chamber.column); k++) {
          row.push('C' + k);
        }
        this.ctrColumnArray.push({ chamberName: chamber.chamberName, rows: row })
      });
      temp.Client = '';
      temp.NoChamber = this.labSetUp.NoChamber;
      temp.Shelf = '';
      temp.chamberDetails = this.labSetUp.chamberDetails;
      temp.design = [];
      temp.teams = this.add_lab_setup.get('teams').value;
      var design = [];
      for (let i = 0; i < this.chamberArray.length; i++) {
        design.push([]);
        for (let j = 0; j < this.ctrColumnArray[i].rows.length; j++) {
          design[i].push({ available: true, shelf: this.chamberArray[i], coloum: this.ctrColumnArray[i].rows[j] });
        }
      }
      temp.design = design;
    }
    else if (this.labSetUp.rackFor == 'Data') {
      this.shelfArray = [];
      this.dtrColumnArray = [];
      for (let j = 1; j <= parseInt(this.labSetUp.Shelf); j++) {
        this.shelfArray.push('S' + j);
      }
      this.labSetUp.shelfDetails.forEach(shelf => {
        let row = [];
        for (let k = 1; k <= parseInt(shelf.column); k++) {
          row.push('C' + k);
        }
        this.dtrColumnArray.push({ shelfName: shelf.shelfName, rows: row })
      });
      temp.Client = '';
      temp.NoChamber = '';
      temp.Shelf = this.labSetUp.Shelf;
      temp.shelfDetails = this.labSetUp.shelfDetails;
      temp.design = [];
      temp.teams = this.add_lab_setup.get('teams').value;
      var design = [];
      for (let i = 0; i < this.shelfArray.length; i++) {
        design.push([]);
        for (let j = 0; j < this.dtrColumnArray[i].rows.length; j++) {
          design[i].push({ available: true, shelf: this.shelfArray[i], coloum: this.dtrColumnArray[i].rows[j] });
        }
      }
      temp.design = design;
    }

    this.userServices.addLabSetConf(temp).subscribe((data: any) => {
      console.log('data added', data);
      // this.dataService.setLabSetup(data);
      this.snackBar.open('Data Added Successfully', 'OK', {
        duration: 4000
      });
      this.dialogRef.close();
    }, err => {
      //console.log(err);
    })

  }

  updateRack() {
    var temp: any = {};
    temp.rackName = this.labSetUp.rackName;
    temp.rackId = this.labSetUp.rackId;
    temp._id = this.labSetUp._id;
    temp.rackFor = this.labSetUp.rackFor;
    temp.teams = this.add_lab_setup.get('teams').value;

    this.shelfArray = [];
    this.columnArray = [];

    if (this.labSetUp.rackFor == 'Chamber') {
      for (let j = 1; j <= parseInt(this.labSetUp.NoChamber); j++) {
        this.shelfArray.push('CH' + j);
      }
      this.labSetUp.chamberDetails.forEach(chamber => {
        let row = [];
        for (let k = 1; k <= parseInt(chamber.column); k++) {
          row.push('C' + k);
        }
        this.columnArray.push({ chamberName: chamber.chamberName, rows: row });
      });

      temp.DUT = '';
      temp.Client = '';
      temp.NoChamber = this.labSetUp.NoChamber;
      temp.Shelf = '';
      temp.Column = '';
      temp.chamberDetails = this.labSetUp.chamberDetails;
      temp.design = [];
      var design = [];
      for (let i = 0; i < this.shelfArray.length; i++) {
        design.push([]);
        for (let j = 0; j < this.columnArray[i]?.rows.length; j++) {
          design[i].push({
            available: true,
            shelf: this.shelfArray[i],
            coloum: this.columnArray[i].rows[j]
          });
        }
      }
      temp.design = design;
    } else if (this.labSetUp.rackFor == 'Data') {      
      for (let j = 1; j <= parseInt(this.labSetUp.Shelf); j++) {
        this.shelfArray.push('S' + j);
      }
      this.labSetUp.shelfDetails.forEach(shelf => {
        let row = [];
        for (let k = 1; k <= parseInt(shelf.column); k++) {
          row.push('C' + k);
        }
        this.columnArray.push({ shelfName: shelf.shelfName, rows: row });
      });

      temp.Client = '';
      temp.NoChamber = '';
      temp.Shelf = this.labSetUp.Shelf;
      temp.shelfDetails = this.labSetUp.shelfDetails;
      temp.design = [];
      var design = [];
      for (let i = 0; i < this.shelfArray.length; i++) {
        design.push([]);
        for (let j = 0; j < this.columnArray[i]?.rows.length; j++) {
          design[i].push({
            available: true,
            shelf: this.shelfArray[i],
            coloum: this.columnArray[i].rows[j]
          });
        }
      }
      temp.design = design;
    }

    if (!this.labSetUp.design) {
      this.userServices.addLabSetConf(temp).subscribe((data: any) => {
        this.snackBar.open('Data Edited Successfully', 'OK', {
          duration: 4000
        });
        this.dialogRef.close();
      }, err => {
        console.log(err)
      })
    } else {


      if (this.labSetUp.rackFor === 'Data') {
        this.syncDesignAvailability(this.labSetUp.design, temp.design, temp.design);
        this.handleColumnReduction(
          this.existingLabSetup.shelfDetails || [],
          this.labSetUp.shelfDetails || [],
          this.labSetUp.design,
          'shelfName'
        );
      }

      if (this.labSetUp.rackFor === 'Chamber') {
        this.syncDesignAvailability(this.labSetUp.design, temp.design, temp.design);
        this.handleColumnReduction(
          this.existingLabSetup.chamberDetails || [],
          this.labSetUp.chamberDetails || [],
          this.labSetUp.design,
          'chamberName'
        );
      }

      setTimeout(() => {
        this.userServices.updateLabSetConf(temp).subscribe(
          (data: any) => {
        this.snackBar.open('Data Edited Successfully', 'OK', {
          duration: 4000
        });
        this.dialogRef.close();
          },
          err => {
        console.log(err);
          }
        );
      }, 10);
    }
  }

  clearTestbed (testBedId: string) {
        const clearOldTestbedPayload = {
          _id: testBedId,
          selfName: '',
          columnName: '',
          rackId: '',
          labIndex: ''
        };
        this.deviceService.pairDeviceToTestbed(clearOldTestbedPayload).subscribe();
      }

      syncDesignAvailability(oldDesign, newDesign, tempDesign){
        for (let i = 0; i < oldDesign.length; i++) {
          for (let j = 0; j < oldDesign[i].length; j++) {
        if (
          tempDesign[i] &&
          tempDesign[i][j] &&
          oldDesign[i][j].shelf === tempDesign[i][j].shelf &&
          oldDesign[i][j].coloum === tempDesign[i][j].coloum
        ) {
          if (oldDesign[i][j].available === false) {
            tempDesign[i][j].available = false;
            tempDesign[i][j].testbedId = oldDesign[i][j].testbedId;
            tempDesign[i][j].teamName = oldDesign[i][j].teamName;
          }
        }
          }
        }
      }

     handleColumnReduction(originalDetails, currentDetails, design, keyName)  {
        originalDetails.forEach(origItem => {
          const currItem = currentDetails.find(item => item[keyName] === origItem[keyName]);
          const originalColumns = parseInt(origItem.column) || 0;
          const currentColumns = currItem ? parseInt(currItem.column) || 0 : 0;
          if (currItem) {
        if (currentColumns < originalColumns) {
          for (let colIndex = currentColumns + 1; colIndex <= originalColumns; colIndex++) {
            const removedColumnName = 'C' + colIndex;
            design.forEach(itemDesign => {
          itemDesign.forEach((designItem: any) => {
            if (
              designItem.shelf === origItem[keyName] &&
              designItem.coloum === removedColumnName &&
              designItem.available === false
            ) {
              this.clearTestbed(designItem.testbedId);
            }
          });
            });
          }
        }
          } else {
        // Item removed entirely
        design.forEach(itemDesign => {
          itemDesign.forEach((designItem: any) => {
            if (
          designItem.shelf === origItem[keyName] &&
          designItem.available === false
            ) {
          this.clearTestbed(designItem.testbedId);
            }
          });
        });
          }
        });
      }


  ngOnDestroy() {
    if (this.sub1) {
      this.sub1.unsubscribe();
    }
  }

  updateConformation(editData){
    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '400px',
      data: {
          name: 'Lab Set Up',
          text: "Edit will do the changes in Rack" + this.labSetUp.rackName  + ". This will delete partition and may release those paired test bed during any reduction in shelf column size.",
          action: 'Submit'
      },
      panelClass: 'app-full-bleed-dialog'
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result == true){
        this.updateRack();
      } else {
        this.labSetUp = this.data.data
        this.dialogRef.close();
      }
    })

  }

   getNewLabel(index: number) {
      const temp = this.labSetUp.shelfDetails ? this.labSetUp.shelfDetails : [];
     for (let i = 1; i <= index; i++) {

       temp.push({
         shelfName: 'S' + i,
         column: 1
       });
     }
      this.labSetUp.shelfDetails = temp;
  
    }
    deleteVendor(index: number): void {
      const vendorArray = this.add_lab_setup.get('shelfDetails') as UntypedFormArray;
      if (vendorArray.length === 1) {
        this.showErrorMessage = true;
        return;
      }
      this.showErrorMessage = false;
      vendorArray.removeAt(index);
    }
    get vendorArrayLength(): number {
      return (this.add_lab_setup.get('shelfDetails') as UntypedFormArray).length;
    }

  teamSelect(item, checked) {
    const ctl = this.add_lab_setup.get('teams');
    let current = Array.isArray(ctl.value) ? [...ctl.value] : [];
    if (checked) {
      if (!current.includes(item)) current.push(item);
      this.isTeamSelected = true;
    } else {
      current = current.filter(x => x !== item);
      this.isTeamSelected = current.length > 0;
    }
    ctl.setValue(current);
    ctl.markAsDirty();
    ctl.updateValueAndValidity();
  }

}
