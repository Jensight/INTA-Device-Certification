import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';


interface IselfSetting {
  rackId: string;
  selfName: string;
  teams?: string[];
  rowSettings: IrowSetting[];
}
interface IrowSetting {
  columnName: string;
  available: boolean;
  testbedId?: string;
  teamName?: string;
  originalColumn?: string;
  virtual?: boolean;
}

@Component({
  selector: 'app-lab-view',
  templateUrl: './lab-view.component.html',
  styleUrls: ['./lab-view.component.scss'],
})
export class LabViewComponent implements OnInit, OnDestroy {
  selectedConfig = 'CTR';
  rackData: any[];
  selectedrack: any;
  allDevices;
  totalSelfs = [];
  totalRows = [];
  showRackView = false;
  filteredData = [];
  public labsetupArray: IselfSetting[] = [];
    tabs = [
   'CTR','DTR',
    ];
  chamberRacks: any[];
  dataRacks: any[];
  selectedTeam: string;
  private teamSub: any;
  overView = false;
  constructor(private dataService: DataService,
      public userService: UserService,
    public cd: ChangeDetectorRef,
  ) { 

  }

  ngOnInit(): void {
    this.rackData = [];
    
    // Subscribe to team changes to refresh rack data
    this.teamSub = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        const teamChanged = this.selectedTeam && this.selectedTeam !== team;
        this.selectedTeam = team.toString();
        // If team changed and we already have rack data, refresh the view
        if (teamChanged && this.rackData && this.rackData.length > 0) {
          this.userService.getLabSetDetails().subscribe((labSetData: any) => {
            if (labSetData) {
              this.rackData = labSetData;
              this.filterdata();
              if (this.filteredData && this.filteredData.length > 0) {
                this.selectedrack = this.filteredData[0];
                this.onCTRChange(this.filteredData[0]);
              }
              this.cd.detectChanges();
            }
          });
        }
      }
    });
    
   this.userService.getLabSetDetails().subscribe((labSetData:any)=>{
        if(labSetData){
          this.rackData = labSetData
   console.log(this.rackData);
   this.filterdata();
   this.selectedrack = this.filteredData[0];
   console.log('selectedrack => ', this.selectedrack);
   this.cd.detectChanges();
        this.selectedConfig = 'CTR';
        this.onCTRChange(this.filteredData[0]);
  }
});

  }

   private generateLabSetup(rackId): void {
    console.log('inside generateLabSetup', rackId)
    this.dataService.loading.next(true);
    var rcda = this.rackData;
    this.labsetupArray = [];
    var design = [];
    var teams = [];
    console.log('this.rackData => ', this.rackData);
    this.rackData.forEach(ele => {
      if(ele.rackId.toUpperCase().replace(" ", "") == rackId){
        design = ele.design;
      }
    });
    rcda.forEach(rd=>{
      if(rd.rackId.toUpperCase().replace(" ", "") == rackId){
        //design = ele.design;
        //console.log('rd => ', rd.design )
        console.log('rd => ', rd );
        design = rd.design;
        teams = rd.teams;
      }
    })

    //console.log('design => ', design);
    console.log('totalSelfs => ', this.totalSelfs);
    console.log('totalRows => ', this.totalRows);
    if(this.selectedConfig === 'CTR') {
    this.totalSelfs.forEach((selfName, index) => {
      const rowSettingItems: IrowSetting[] = [];
      // Check if totalRows has the new chamberDetails structure (array of objects with rows)
      const rowsArray = this.totalRows[index] && this.totalRows[index].rows 
        ? this.totalRows[index].rows 
        : this.totalRows;
      
      rowsArray.forEach((columnName, ind) => {
        const labId = rackId + '_' + selfName + '_' + columnName;
       // const device = this.allDevices.find((x) => x.labIndex === labId);
        //if(device && design[index][ind].available == true){
          //design[index][ind].available = false;
        //}

        const rowsetting: IrowSetting = {
          columnName,
         // deviceDetails: device,
          available: design[index] && design[index][ind] ? design[index][ind].available : true,
          testbedId: design[index] && design[index][ind] ? design[index][ind].testbedId : null, 
          teamName: design[index] && design[index][ind] ? design[index][ind].teamName : null,
          originalColumn: design[index] && design[index][ind] ? design[index][ind].originalColumn : null,
          virtual: design[index] && design[index][ind] ? design[index][ind].virtual : false,
        };
       console.log('rowsetting => ', rowsetting);
        rowSettingItems.push(rowsetting);
      });
      console.log('rowSettingItems => ', rowSettingItems);
      const selfSetting: IselfSetting = {
        rackId,
        selfName,
        teams,
        rowSettings: rowSettingItems,
      };
      console.log('selfSetting => ', selfSetting);
      this.labsetupArray.push(selfSetting);
      this.cd.detectChanges();
    });
  } else if(this.selectedConfig === 'DTR') {
    this.totalSelfs.forEach((selfName, index) => {
      const rowSettingItems: IrowSetting[] = [];
      this.totalRows[index].rows.forEach((columnName, ind) => {
        const labId = rackId + '_' + selfName + '_' + columnName;
        const rowsetting: IrowSetting = {
          columnName,
          available: design[index][ind].available,
          testbedId: design[index][ind].testbedId,
          teamName: design[index][ind].teamName,
          originalColumn: design[index][ind].originalColumn ? design[index][ind].originalColumn : null,
          virtual: design[index][ind].virtual ? design[index][ind].virtual : false,
        };
       console.log('rowsetting => ', rowsetting);
        rowSettingItems.push(rowsetting);
      });
      console.log('rowSettingItems => ', rowSettingItems);
      const selfSetting: IselfSetting = {
        rackId,
        selfName,
        teams,
        rowSettings: rowSettingItems,
      };
      console.log('selfSetting => ', selfSetting);
      this.labsetupArray.push(selfSetting);
      this.cd.detectChanges();
    });
  }
    this.dataService.loading.next(false);
  }

setView(event){
  console.log('tab changed => ', event);
  //let viewType = event.tab.textLabel;
  this.overView = false;
  this.selectedConfig = event;
  this.filterdata();
  this.onCTRChange(this.filteredData[0]);

}

loadOverview(){
  this.overView = true;
}

  filterdata(){
    let filteredData = [];
    console.log('selectedView => ', this.selectedConfig);
    console.log('data before filter => ', this.rackData);
    const teamracks = this.rackData.filter(item => item.teams && item.teams.includes(this.selectedTeam));
     if (this.selectedConfig === 'CTR') {
      filteredData = teamracks.filter(item => item.rackFor && item.rackFor === 'Chamber');
      console.log('filteredData @ 318 => ', filteredData);
      this.filteredData = filteredData;
    } else if (this.selectedConfig === 'DTR') {
      filteredData = teamracks.filter(item => item.rackFor && item.rackFor === 'Data');
      console.log('filteredData @ 322 => ', filteredData);
      this.filteredData = filteredData;
    }
  }

onCTRChange(rack: any){
  console.log('rack changed  inside on ctr change=> ', rack);
  if (!rack) {
    return;
  }
  this.selectedrack = rack;
  this.totalRows = [];
  this.totalSelfs = [];
  if (rack.rackFor == 'Data') {
    for (let j = 1; j <= parseInt(rack.Shelf); j++) {
      this.totalSelfs.push('S' + j);
    }
    rack.shelfDetails.forEach(shelf => {
      let row = [];
      for (let k = 1; k <= parseInt(shelf.column); k++) {
        row.push('C' + k);
      }
      this.totalRows.push({shelfName: shelf.shelfName, rows: row})
    });

  } else if (rack.rackFor == "Chamber") {
    for (let j = 1; j <= parseInt(rack.NoChamber); j++) {
      this.totalSelfs.push('CH' + j);
    }
    // Use chamberDetails if available, otherwise fallback to Column
    if (rack.chamberDetails && Array.isArray(rack.chamberDetails) && rack.chamberDetails.length > 0) {
      rack.chamberDetails.forEach(chamber => {
        let row = [];
        for (let k = 1; k <= parseInt(chamber.column); k++) {
          row.push('C' + k);
        }
        this.totalRows.push({chamberName: chamber.chamberName, rows: row});
      });
    } else {
      // Fallback to old Column property
      for (let k = 1; k <= parseInt(rack.Column); k++) {
        this.totalRows.push('C' + k);
      }
    }
  }
  this.generateLabSetup(this.selectedrack.rackId.toUpperCase().replace(" ", ""));

}

rackChange(event, viewChanged: boolean) {
  console.log('rack changed => ', event);
  this.selectedrack = this.rackData.find(item => item.rackId === event.tab.textLabel);
 // this.selectedConfig = viewType;
  this.onCTRChange(this.selectedrack);
}

valueChange() {
}

ngOnDestroy(): void {
  if (this.teamSub) {
    this.teamSub.unsubscribe();
  }
}

}
