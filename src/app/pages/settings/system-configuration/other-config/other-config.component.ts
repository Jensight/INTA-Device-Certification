import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { UserService } from 'src/app/@core/services/user.service';

@Component({
  selector: 'app-other-config',
  templateUrl: './other-config.component.html',
  styleUrls: ['./other-config.component.scss']
})
export class OtherConfigComponent implements OnInit {
  public other_config: UntypedFormGroup;
  selectedTeam: any;
  @Output() getErrorCodesData: any = new EventEmitter();
  teams = [];
  teamConfig: UntypedFormGroup;
  hasTeamConfig = false;
  constructor(private userService: UserService, private snackBar: MatSnackBar, private dataServices: DataService) {
    this.dataServices.selectedTeam.subscribe(team => {
      if (team) {
          this.selectedTeam = team;
      }
  });
   }
  sys_ext_con:any = {}

  ngOnInit(): void {
    this.other_config = new UntypedFormGroup({
      // jira_option : new UntypedFormControl(false),
      cpe_telemetry : new UntypedFormControl(false),
      automated_mail: new UntypedFormControl(false),
      test_suite_popup: new UntypedFormControl(false),
      // test_set_filter: new UntypedFormControl(false),
      // is_TestBedProfile_TestSet_Mapped: new UntypedFormControl(false),
      add_error_codes: new UntypedFormControl(false),
      additional_time_for_reservation_value: new UntypedFormControl(false),
      // jira_option_APIUser: new UntypedFormControl(false)
    });
    this.teamConfig = new UntypedFormGroup({
      name: new UntypedFormControl(''),
      test_set_filter: new UntypedFormControl(false),
      is_TestBedProfile_TestSet_Mapped: new UntypedFormControl(false)
    });

    this.getConfigData();
  }

  getConfigData(){
    this.userService.getAllusers().subscribe((data:any)=>{
      this.sys_ext_con = data[0].extraSystemConfig;
      var sys_ext_con = data[0].extraSystemConfig;
      if(sys_ext_con &&  sys_ext_con.length > 0) {
        this.other_config.patchValue({
         //  jira_option: sys_ext_con[0].jira_option,
          cpe_telemetry: sys_ext_con[0].cpe_telemetry,
          automated_mail: sys_ext_con[0].automated_mail,
          test_suite_popup: sys_ext_con[0].test_suite_popup,
         // test_set_filter: this.teamConfig.get('test_set_filter').value,
         // is_TestBedProfile_TestSet_Mapped: this.teamConfig.get('is_TestBedProfile_TestSet_Mapped').value,
          add_error_codes: sys_ext_con[0].add_error_codes,
          additional_time_for_reservation_value: sys_ext_con[0].additional_time_for_reservation_value,
         // jira_option_APIUser: sys_ext_con[0].jira_option_APIUser
        });
        this.dataServices.systemConfig.next(sys_ext_con[0]);
        if (data[0].extraSystemConfig[0].teams &&  data[0].extraSystemConfig[0].teams.length > 0) {
          this.teams = data[0].extraSystemConfig[0].teams;
          this.teams.forEach(team => {
            if (team.name === this.selectedTeam) {
              this.hasTeamConfig = true;
              this.teamConfig.patchValue({
                name: this.selectedTeam,
                test_set_filter: team.test_set_filter,
                is_TestBedProfile_TestSet_Mapped: team.is_TestBedProfile_TestSet_Mapped
              });
            }
          });
        }
        if (!this.hasTeamConfig) {
          this.teamConfig.patchValue({
            name: this.selectedTeam,
            test_set_filter: true,
            is_TestBedProfile_TestSet_Mapped: false
          });

        }
      }
    })
  }

  setConfig(){
    if(!this.other_config.valid){
      return
    } else {
      if (this.hasTeamConfig){
        this.teams.forEach(team => {
          if (team.name === this.selectedTeam) {
            team.name = this.selectedTeam;
            team.test_set_filter = this.teamConfig.get('test_set_filter').value;
            team.is_TestBedProfile_TestSet_Mapped = this.teamConfig.get('is_TestBedProfile_TestSet_Mapped').value;
          }
        });
      } else {
        const temp = {
          name :  this.selectedTeam,
          test_set_filter:  this.teamConfig.get('test_set_filter').value,
          is_TestBedProfile_TestSet_Mapped:  this.teamConfig.get('is_TestBedProfile_TestSet_Mapped').value
        };
        this.teams.push(temp);
      }
      if(this.sys_ext_con && this.sys_ext_con.length > 0 && this.sys_ext_con[0]._id){
        this.updateExConfig();
      } else {
        this.addExConfig();
      }
    }

  }

  addExConfig(){
    let snackRef: MatSnackBarRef<any>;
    const config = this.other_config.value;
    config['teams'] = this.teams;
    this.userService.addExtraSystemConf(config).subscribe((data:any)=>{
      this.getConfigData();
      snackRef = this.snackBar.open('System Config Added Successfully', '', {
        duration: 5000
      });
    }, err =>{
      snackRef = this.snackBar.open('Something Want Wrong, unable to add', '', {
        duration: 5000
      });
    })
  }

  updateExConfig() {
    let snackRef: MatSnackBarRef<any>;
    var con = this.other_config.value;
    con['_id'] = this.sys_ext_con[0]._id;
    con['teams'] = this.teams;
    this.userService.updateExtraSystemConf(con).subscribe((data:any)=>{
      this.getConfigData();
      snackRef = this.snackBar.open('System Config Updated Successfully', '', {
        duration: 5000
      });

      // To show and hide Add Error Codes Tab
      this.dataServices.setSettingsData(data[0]);
      this.getErrorCodesData.emit(true);
    }, err =>{
      snackRef = this.snackBar.open('Something Want Wrong, unable to update', '', {
        duration: 5000
      });
    })
  }

}
