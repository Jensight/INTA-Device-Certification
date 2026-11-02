import { Component, OnInit } from '@angular/core';
import { FormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DataService } from 'src/app/@core/services/data.service';
import { ApiService } from 'src/app/@core/services/api.service';
import { UserService } from 'src/app/@core/services/user.service';
import { TestBedService } from 'src/app/@core/services/test-bed.service';
import { EncryptPassword } from 'src/app/@shared/pipes/encrypt-password.pipe';
import { DecryptPassword } from 'src/app/@shared/pipes/decrypt-password.pipe';
 import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
 
@Component({
  selector: 'app-dashboard-config',
  templateUrl: './dashboard-config.component.html',
  styleUrls: ['./dashboard-config.component.scss'],
  providers: [
    DecryptPassword,
    EncryptPassword
  ]
})
export class DashboardConfigComponent implements OnInit {
 
  public dashboard_config: UntypedFormGroup;
  public dashboard_config_team: UntypedFormGroup;
  public teamConfig: UntypedFormGroup;
  public jira_config: UntypedFormGroup;
  public multi_delete_regression: UntypedFormGroup;
  dashboard_extra_config: any = [];
  selectedTeam: any;
  sub1: any;
  teams:any = [];
  updateAPiGrpUrls = false;
  primaryURL = null;
  secondaryURL = null;
  selectedConfig = 'DashboardConfig';
  numbersList = [5,10,15,20,25,30];
  hasTeamConfig = false;
  extraSysConfig: any = {} ;
  mappingDetails: any = [];
  jiraTeamsDetail: any = [];
  deleteMapDetails: any = [];
  // delete_extra_config :any = [];
  deleteRegDetails: any;
  cmtsNodeOptions: any[] = [];
  jiraDetails: any;
  settingsData: any;
  deleteRegInp: UntypedFormGroup;
  deleteRegressionData: any; // Declare the missing property
  selectedDashboard = 'configration';
  cmtsSearchControl = new FormControl('');
  filteredCmtsNodes!: Observable<any[]>;
  currentDate: Date = new Date();
  constructor(private userService: UserService, private apiService: ApiService, private snackBar: MatSnackBar,
     private dataServices: DataService, private formBuilder: FormBuilder,
     private encryptPassword: EncryptPassword, private decryptPassword: DecryptPassword,
     private testBedService: TestBedService) { }
 
  ngOnInit(): void {

    this.filteredCmtsNodes = this.cmtsSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterCmts(value || ''))
    );
    this.teamConfig = new UntypedFormGroup({
      name: new UntypedFormControl(''),
      test_set_filter: new UntypedFormControl(false),
      is_TestBedProfile_TestSet_Mapped: new UntypedFormControl(false)
    });
    this.jira_config = new UntypedFormGroup({
      jiraIntegration : new UntypedFormControl(false),
      jiraIP : new UntypedFormControl(null, Validators.required),
      jiraTokenExpiry:new UntypedFormControl(null,Validators.required),
      jiraToken:new UntypedFormControl(null,Validators.required),
      jiraEmail:new UntypedFormControl(null, [Validators.email, Validators.required]),
      jiraWarningAfter: new UntypedFormControl(10,Validators.required)
    });
    this.userService.getAllusers().subscribe((data:any)=>{
      console.log('data', data);
      this.jiraTeamsDetail = [];
      this.extraSysConfig = data[0].extraSystemConfig;
      this.deleteRegDetails = data && data.length > 0 && data[0].regressionConfig && data[0].regressionConfig.length > 0 ?
      data[0].regressionConfig[0] : null;
      data[0].teams.forEach(el => {
        this.jiraTeamsDetail.push({'teamname': el.name, 'jira_project_id':'', 'jiraIntegration' : false})
      });
 
      if(data[0].jiraConfig && data[0].jiraConfig[0].teams){
        for (let i = 0; i < this.jiraTeamsDetail.length; i++) {
          for (let j = 0; j < data[0].jiraConfig[0].teams.length; j++) {
            if(this.jiraTeamsDetail[i].teamname == data[0].jiraConfig[0].teams[j].teamname && data[0].jiraConfig[0].teams[j].jira_project_id) {
              this.jiraTeamsDetail[i].jira_project_id = data[0].jiraConfig[0].teams[j].jira_project_id
              break;
            }
          }
        }
      }
 
      if (data[0].extraSystemConfig[0].teams &&  data[0].extraSystemConfig[0].teams.length > 0) {
        this.mappingDetails = data[0].extraSystemConfig[0].teams;
        this.mappingDetails.forEach(team => {
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
     
    });  
    this.sub1 = this.dataServices.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.dashboard_config = new UntypedFormGroup({
      device_append_labsetup: new UntypedFormControl(""),
    });
 
    this.dashboard_config_team = new UntypedFormGroup({
      name:new UntypedFormControl(''),
      enable_completed_regression: new UntypedFormControl(false),
      enable_latest_info: new UntypedFormControl(false),
      enable_team_count: new UntypedFormControl(false),
      show_cpe_analysis_Specific_clients: new UntypedFormControl(false),
    });
   
    this.multi_delete_regression = new UntypedFormGroup({
      multi_delete_regressions: new UntypedFormControl(false),
      deleteInProgressReg: new UntypedFormControl(false),
      show_only_paired_testbeds: new UntypedFormControl(false),
      show_dynamic_scheduler: new UntypedFormControl(false),
      exclusive_clients: new UntypedFormControl(false),
      cmts_network_element: new UntypedFormControl(''),
      restrict_testbed_to_user: new UntypedFormControl(false)
    });
   
    // CMTS network element options for the Regression Config dropdown (nodes whose
    // name identifies them as a CMTS, sourced from the shared testbed profile nodes).
    // this.dataServices.getNodes().subscribe((nodes: any) => {
    //   this.cmtsNodeOptions = (nodes || []).filter((n: any) => n && n.nodeName && n.nodeName.toLowerCase().includes('cmts'));
    // });
 this.dataServices.getNodes().subscribe((nodes: any) => {
  this.cmtsNodeOptions = nodes || [];
});
    this.getConfigData();
  }

  private filterCmts(searchText: string): any[] {
    const filterValue = searchText.toLowerCase();

    return this.cmtsNodeOptions.filter(node =>
      node.nodeName?.toLowerCase().includes(filterValue)
    );
  }

  handleInput(event: KeyboardEvent) {
    event.stopPropagation();
  }

  onCmtsDropdownChange(opened: boolean) {
    if (!opened) {
      this.cmtsSearchControl.reset();
    }
  }


  setView(view: string) {
    this.selectedConfig = view;
  } 
 
 
  getConfigData() {
    this.teams = [];
    this.userService.getAllusers().subscribe((data: any) => {
      var dashboard_extra_config = [];
      if(data[0].dashboardConfig){
        this.dashboard_extra_config = data[0].dashboardConfig;
        dashboard_extra_config = data[0].dashboardConfig;
      }
     
      var team;
      if(data[0].dashboardConfig && data[0].dashboardConfig[0].teams){
        var checkflag = false;
        var count = 0;
        this.teams = data[0].dashboardConfig[0].teams;
        for (let i = 0; i < data[0].dashboardConfig[0].teams.length; i++) {
          if(data[0].dashboardConfig[0].teams[i].name == this.selectedTeam){
            console.log('data[0].dashboardConfig[0].teams[i] => ',data[0].dashboardConfig[0].teams[i])
            count ++;
            checkflag = true;
            this.dashboard_config_team.patchValue({
              name:this.selectedTeam,
              enable_completed_regression: data[0].dashboardConfig[0].teams[i].enable_completed_regression ? data[0].dashboardConfig[0].teams[i].enable_completed_regression : false,
              enable_latest_info: data[0].dashboardConfig[0].teams[i].enable_latest_info ? data[0].dashboardConfig[0].teams[i].enable_latest_info : false,
              enable_team_count: data[0].dashboardConfig[0].teams[i].enable_team_count ? data[0].dashboardConfig[0].teams[i].enable_team_count : false,
              show_cpe_analysis_Specific_clients:data[0].dashboardConfig[0].teams[i].show_cpe_analysis_Specific_clients ? data[0].dashboardConfig[0].teams[i].show_cpe_analysis_Specific_clients : false,
            });
            break;
          } else {
            count ++;
          }
         
          if(data[0].dashboardConfig[0].teams.length == count && checkflag == false && this.selectedTeam){
            //console.log('inside if(data[0].dashboardConfig.teams.lenght == count && checkflag == false) 69')
            this.teams.push({name:this.selectedTeam})
            this.dashboard_config_team.patchValue({
              name:this.selectedTeam,
              enable_completed_regression: false,
              enable_latest_info: false,
              enable_team_count: false,
              show_cpe_analysis_Specific_clients: false,
            })
          }
        }
      } else if(this.selectedTeam) {
        this.dashboard_config_team.patchValue({
          name:this.selectedTeam,
          enable_completed_regression: false,
          enable_latest_info: false,
          enable_team_count: false,
          show_cpe_analysis_Specific_clients: false,
        })
      }  
     
       
        this.userService.getAllusers().subscribe((data: any) => {
          console.log("data312", data);
  
          if (data[0].regressionConfig && data[0].regressionConfig.length > 0) {
              this.deleteRegDetails = data[0].regressionConfig[0];
              console.log('deleteRegDetails', this.deleteRegDetails);
  
              // Retrieve the specific team's configuration
              const teamConfig = this.deleteRegDetails.teams.find((team: any) => team.name === this.selectedTeam);
  
              if (teamConfig) {
                  console.log('Team Config:', teamConfig);
  
                  // Patch the values for the selected team
                  if (this.multi_delete_regression) {
                      this.multi_delete_regression.patchValue({
                          multi_delete_regressions: teamConfig.multi_delete_regressions || false,
                          deleteInProgressReg: teamConfig.deleteInProgressReg || false,
                          show_only_paired_testbeds: teamConfig.show_only_paired_testbeds || false,
                          show_dynamic_scheduler: teamConfig.show_dynamic_scheduler || false,
                          exclusive_clients: teamConfig.exclusive_clients || false,
                          cmts_network_element: teamConfig.cmts_network_element || '',
                          restrict_testbed_to_user: teamConfig.restrict_testbed_to_user || false,
                      });
                  }
              } else {
                  console.warn('No configuration found for the selected team:', this.selectedTeam);

                  // Set default values if no configuration exists for the selected team
                  if (this.multi_delete_regression) {
                      this.multi_delete_regression.patchValue({
                          multi_delete_regressions: false,
                          deleteInProgressReg: false,
                          show_only_paired_testbeds: false,
                          show_dynamic_scheduler: false,
                          exclusive_clients: false,
                          cmts_network_element: '',
                          restrict_testbed_to_user: false,
                      });
                  }
              }
          }
      });
      // });
      //console.log('line 81 => ', this.dashboard_extra_config, this.teams);
      if (dashboard_extra_config && dashboard_extra_config.length > 0) {
        this.dashboard_config.patchValue({
            device_append_labsetup: dashboard_extra_config[0].device_append_labsetup
        });
      }
 
      // Jira Config
      if (data[0].jiraConfig && data[0].jiraConfig.length > 0) {
        this.jiraDetails = data[0].jiraConfig[0];
        console.log('jira details', this.jiraDetails);
        const tempTcData = this.jiraDetails.teams?.map((element: any) => element).filter(element => {
          return (element.teamname === this.selectedTeam);
        });
        this.jira_config.patchValue({
          jiraIntegration : tempTcData[0]?.jiraIntegration,
          jiraIP : this.jiraDetails.jiraIP,
          jiraTokenExpiry:this.jiraDetails.jiraTokenExpiry,
          jiraToken:this.decryptPassword.transform(this.jiraDetails.jiraToken),
          jiraEmail:this.jiraDetails.jiraEmail,
          jiraWarningAfter: this.jiraDetails.jiraWarningAfter
        });
      }
    });
  }
 
  setConfig() {
    if (!this.dashboard_config.valid) {
      return
    } else {
      if (this.dashboard_extra_config && this.dashboard_extra_config.length > 0 && this.dashboard_extra_config[0]._id) {
        for (let j = 0; j < this.teams.length; j++) {
          if (this.teams[j].name == this.dashboard_config_team.value.name && this.teams[j].name == this.selectedTeam) {
            this.teams[j].show_cpe_analysis_Specific_clients = this.dashboard_config_team.value.show_cpe_analysis_Specific_clients;
            this.teams[j].enable_completed_regression = this.dashboard_config_team.value.enable_completed_regression;
            this.teams[j].enable_latest_info = this.dashboard_config_team.value.enable_latest_info;
            this.teams[j].enable_team_count = this.dashboard_config_team.value.enable_team_count;
          }
        }
        setTimeout(() => {
          this.updateExConfig();
        });
      } else {
        for (let j = 0; j < this.teams.length; j++) {
          if (this.teams[j].name == this.dashboard_config_team.value.name && this.teams[j].name == this.selectedTeam) {
            this.teams[j].show_cpe_analysis_Specific_clients = this.dashboard_config_team.value.show_cpe_analysis_Specific_clients;
            this.teams[j].enable_completed_regression = this.dashboard_config_team.value.enable_completed_regression;
            this.teams[j].enable_latest_info = this.dashboard_config_team.value.enable_latest_info;
            this.teams[j].enable_team_count = this.dashboard_config_team.value.enable_team_count;
          }
        }
       
        setTimeout(() => {
          this.addExConfig();
        });
      }
    }
  }

  deleteRegressionConfig(): void {
    if (!this.multi_delete_regression.valid) {
      return;
    }

    let snackRef: MatSnackBarRef<any>;

    // Capture the toggle's previous saved state (before we mutate deleteRegDetails
    // below) so we can re-seed the access matrix ONLY on an OFF -> ON transition.
    const prevTeamCfg = this.deleteRegDetails && Array.isArray(this.deleteRegDetails.teams)
      ? this.deleteRegDetails.teams.find((team: any) => team.name === this.selectedTeam)
      : null;
    const wasRestricted = !!(prevTeamCfg && prevTeamCfg.restrict_testbed_to_user);
    const nowRestricted = !!this.multi_delete_regression.value.restrict_testbed_to_user;

    // Prepare the team configuration object
    const teamConfig = {
      name: this.selectedTeam,
      multi_delete_regressions: this.multi_delete_regression.value.multi_delete_regressions ? this.multi_delete_regression.value.multi_delete_regressions : false,
      deleteInProgressReg: this.multi_delete_regression.value.deleteInProgressReg ? this.multi_delete_regression.value.deleteInProgressReg : false,
      show_only_paired_testbeds: this.multi_delete_regression.value.show_only_paired_testbeds ? this.multi_delete_regression.value.show_only_paired_testbeds : false,
      show_dynamic_scheduler: this.multi_delete_regression.value.show_dynamic_scheduler ? this.multi_delete_regression.value.show_dynamic_scheduler : false,
      exclusive_clients: !!(this.multi_delete_regression.value.show_dynamic_scheduler && this.multi_delete_regression.value.exclusive_clients),
      cmts_network_element: this.multi_delete_regression.value.show_dynamic_scheduler ? (this.multi_delete_regression.value.cmts_network_element || '') : '',
      restrict_testbed_to_user: this.multi_delete_regression.value.restrict_testbed_to_user ? this.multi_delete_regression.value.restrict_testbed_to_user : false,
    };


    if (this.deleteRegDetails && this.deleteRegDetails._id) {
      if (!this.deleteRegDetails.teams) {
        this.deleteRegDetails.teams = [];
      }
      const existingTeamIndex = this.deleteRegDetails.teams.findIndex(
        (team: any) => team.name === this.selectedTeam
      );

      if (existingTeamIndex !== -1) {
        this.deleteRegDetails.teams[existingTeamIndex] = {
          ...this.deleteRegDetails.teams[existingTeamIndex],
          ...teamConfig, // Update the values
        };
      } else {
        this.deleteRegDetails.teams.push(teamConfig);
      }

      // Update operation
      this.userService.updateMultiDeleteRegressions(this.deleteRegDetails).subscribe(
        (data: any) => {
          this.dataServices.setSettingsData(data[0]);
          this.getConfigData();
          // OFF -> ON: reset the access matrix fresh so every testbed is mapped
          // (checked) to all active users except Guest for this team.
          if (nowRestricted && !wasRestricted) {
            this.seedDefaultAccessMatrix(data[0]);
          }
          snackRef = this.snackBar.open('Regression Config Updated Successfully', '', {
            duration: 5000,
          });
        },
        (err) => {
          snackRef = this.snackBar.open('Something Went Wrong, Unable to Update', '', {
            duration: 5000,
          });
        }
      );
    } else {

      // Create a new deleteRegConfig object
      const newDeleteRegConfig = {
        teams: [teamConfig],
      };

      // Add operation
      this.userService.addMultiDeleteRegressions(newDeleteRegConfig).subscribe(
        (data: any) => {
          this.dataServices.setSettingsData(data[0]);
          this.getConfigData();
          // First-time creation with the toggle ON also seeds the matrix fresh.
          if (nowRestricted && !wasRestricted) {
            this.seedDefaultAccessMatrix(data[0]);
          }
          snackRef = this.snackBar.open('Delete Regression Config Added Successfully', '', {
            duration: 5000,
          });
        },
        (err) => {
          snackRef = this.snackBar.open('Something Went Wrong, Unable to Add', '', {
            duration: 5000,
          });
        }
      );
    }
  }
  /**
   * Seed the User - TestBed Access Matrix FRESH for the selected team.
   * Called when "Restrict Test Bed to User" transitions OFF -> ON. Delegates to a
   * dedicated backend API that maps every testbed (active & inactive) to all active
   * users except Guest, OVERWRITING this team's previous slice while preserving
   * every other team's slice. Building the matrix server-side keeps the client
   * light and guarantees a single source of truth.
   */
  private seedDefaultAccessMatrix(settings: any): void {
    if (!this.selectedTeam) { return; }
    this.userService.seedUserTestbedAccessMatrix(this.selectedTeam).subscribe(
      (data: any) => {
        const updated = Array.isArray(data) ? data[0] : data;
        if (updated) {
          this.dataServices.setSettingsData(updated);
          // Broadcast so any open matrix/scheduler screens re-apply immediately.
          this.dataServices.notifyUserTestbedAccessMatrixChanged(updated.userTestbedAccessMatrix || {});
        }
      },
      () => {
        this.snackBar.open('Regression Config saved, but failed to seed default TestBed access.', '', { duration: 5000 });
      }
    );
  }

  addExConfig(){
    let snackRef: MatSnackBarRef<any>;
    var dashboard_config_temp = this.dashboard_config.value
    dashboard_config_temp['teams'] = this.teams;
    // dashboard_config_temp['deleteRegInp'] = this.deleteRegInp.value;
    this.userService.addDashboardConf(dashboard_config_temp).subscribe((data:any)=>{
      this.getConfigData();
      snackRef = this.snackBar.open('System Config Added Successfully', '', {
        duration: 5000
      });
      // To Update settings data, which will also reflect to dashboard
      this.dataServices.saveSettingData(data[0]);
      this.dataServices.setSettingsData(data[0]);
    }, err =>{
      snackRef = this.snackBar.open('Something Went Wrong, unable to add', '', {
        duration: 5000
      });
    })
  }
 
  updateExConfig() {
    let snackRef: MatSnackBarRef<any>;
    var con = this.dashboard_config.value;
    con['_id'] = this.dashboard_extra_config[0]._id;
    con['teams'] = this.teams;
    this.userService.updateDashboardConf(con).subscribe((data:any)=>{
      this.getConfigData();
      snackRef = this.snackBar.open('System Config Updated Successfully', '', {
        duration: 5000
      });
      // To Update settings data, which will also reflect to dashboard
      this.dataServices.saveSettingData(data[0]);
      this.dataServices.setSettingsData(data[0]);
    }, err =>{
      snackRef = this.snackBar.open('Something Went Wrong, unable to update', '', {
        duration: 5000
      });
    })
  }
 
  saveJiraConfig() {
    var con: any;
    let snackRef: MatSnackBarRef<any>;
   // if (this.jira_config.get('jiraIntegration').value){
    this.jiraTeamsDetail.forEach(team => {
      if (team.teamname === this.selectedTeam) {
        team.jiraIntegration = this.jira_config.get('jiraIntegration').value;
      }
    });
      con = this.jira_config.value;
      con['teams'] = this.jiraTeamsDetail;
      const encryptToken = this.encryptPassword.transform(this.jira_config.get('jiraToken').value);
      con['jiraToken'] = encryptToken;
 
    console.log('inside set jira config', con);
    if(this.jiraDetails){
      con['_id'] = this.jiraDetails._id;
      this.userService.updateJiraConfig(con).subscribe((data:any)=>{
        this.getConfigData();
        snackRef = this.snackBar.open('Jira Config Updated Successfully', '', {
          duration: 5000
        });
        console.log('jira details', data[0]);
        // To Update settings data, which will also reflect to dashboard
        this.dataServices.saveSettingData(data[0]);
        this.dataServices.setSettingsData(data[0]);
        this.setJiraDetails();
      }, err =>{
        snackRef = this.snackBar.open('Something Went Wrong, unable to update', '', {
          duration: 5000
        });
      })
    } else {
      const encryptToken = this.encryptPassword.transform(this.jira_config.get('jiraToken').value);
      con['jiraToken'] = encryptToken;
      this.userService.addJiraConfig(con).subscribe((data:any)=>{
       
        this.getConfigData();
        snackRef = this.snackBar.open('Jira Config Added Successfully', '', {
          duration: 5000
        });
        console.log('jira details', data[0]);
        // To Update settings data, which will also reflect to dashboard
        this.dataServices.saveSettingData(data[0]);
        this.dataServices.setSettingsData(data[0]);
        this.saveJiraConfig();
      }, err =>{
        snackRef = this.snackBar.open('Something Went Wrong, unable to add', '', {
          duration: 5000
        });
      })
    }
  }
 
  setJiraDetails() {
     // Jira Config
     this.dataServices.getSettingsData().subscribe((settingsdata: any) => {
      if (!settingsdata) {
          this.userService.getAllusers().subscribe((data: any) => {
              this.dataServices.saveSettingData(data[0]);
              settingsdata = data;
              this.settingsData = data;
 
          });
      } else {
          const temp = [];
          temp.push(settingsdata);
          this.settingsData = temp;
 
      }
      setTimeout(() => {
    if (this.settingsData[0].jiraConfig && this.settingsData[0].jiraConfig[0] && this.settingsData[0].jiraConfig[0].jiraIntegration
      && this.settingsData[0].jiraConfig[0].jiraTokenExpiry) {
          if(this.settingsData[0].jiraConfig[0].teams){
              this.dataServices.selectedTeam.subscribe((team) => {
                  if (team) {
                      const teamJiraDetails = this.settingsData[0].jiraConfig[0].teams.filter(ele => {
                          return (ele.teamname === team);
                        });
                        console.log('team jira Deatils', teamJiraDetails);
                        if(teamJiraDetails && teamJiraDetails.length > 0 && teamJiraDetails[0].jiraIntegration && teamJiraDetails[0].jira_project_id){
                          this.dataServices.isJiraEnabled.next(true);
                        } else {
                          this.dataServices.isJiraEnabled.next(true);
                        }
                  }
                });
             
          }
      }
      });
    })
  }
 
  testBedTestSetMapping(){
    if (this.hasTeamConfig){
      this.mappingDetails.forEach(team => {
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
      this.mappingDetails.push(temp);
    }
    if(this.extraSysConfig && this.extraSysConfig.length > 0 && this.extraSysConfig[0]._id){
      this.updateMappingDetails();
    } else {
      this.addMappingDetails();
    }
   
  }
 
  addMappingDetails(){
     let other_config = new UntypedFormGroup({
      // jira_option : new UntypedFormControl(false),
      cpe_telemetry : new UntypedFormControl(false),
      automated_mail: new UntypedFormControl(false),
      test_suite_popup: new UntypedFormControl(false),
      add_error_codes: new UntypedFormControl(false),
      additional_time_for_reservation_value: new UntypedFormControl(false),
    });
    let snackRef: MatSnackBarRef<any>;
    const config = other_config.value;
    config['teams'] = this.mappingDetails;
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
  updateMappingDetails() {
    let snackRef: MatSnackBarRef<any>;
    var con = this.extraSysConfig[0];
    con['_id'] = this.extraSysConfig[0]._id;
    con['teams'] = this.mappingDetails;
    this.userService.updateExtraSystemConf(con).subscribe((data:any)=>{
      this.getConfigData();
      snackRef = this.snackBar.open('System Config Updated Successfully', '', {
        duration: 5000
      });
      console.log('settings data', data[0]);
      // To show and hide Add Error Codes Tab
      this.dataServices.setSettingsData(data[0]);
    }, err =>{
      snackRef = this.snackBar.open('Something Want Wrong, unable to update', '', {
        duration: 5000
      });
    })
  }
}
 