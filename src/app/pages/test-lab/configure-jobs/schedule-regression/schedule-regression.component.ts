import { UntypedFormGroup, UntypedFormControl, Validators, FormGroup, FormControl } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {  MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from "./../../../../@core/services/data.service";
import { ReservationService } from "./../../../../@core/services/reservation.service";
import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ElementRef
} from "@angular/core";
import { Router } from "@angular/router";
import { TestLabService } from "src/app/@core/services/test-lab.service";


@Component({
  selector: "app-schedule-regression",
  templateUrl: "./schedule-regression.component.html",
  styleUrls: ["./schedule-regression.component.scss"]
})
export class ScheduleRegressionComponent implements OnInit {
  selectedTestbedIds = [];
  checkFlag = false;
  testbedAvailable = false;
  reservationForm: UntypedFormGroup;
  allReservationName = [];
  formSubmitted = false;
  date = new Date(new Date().getTime() + 4 * 60000);
  testbedName = "Testbed";
  sub1;
  sub2;
  sub3;
  sub4;
  sub5;
  sub6;
  sub8;
  loadingText = `Checking ${this.testbedName} availibility.Wait a moment !!`;
  @ViewChild("check") check: ElementRef;
  @ViewChild("path") path: ElementRef;
  @ViewChild("cross") cross: ElementRef;
  createJiraFl: boolean = false;
  selectedTeam: any;
  sub7: any;
  daysFlag: any = '';
  range = new FormGroup({
    start: new FormControl(null, Validators.required),
    end: new FormControl(null, Validators.required),
  });
  startDate: any;
  endDate: any;
  min: any;
  max: any;
  tag_name: any;
  originalTagName: string = '';
  showerr: boolean = false;
  updateJira = false;
   estimatedTimeRequired: number = 0;
  bufferTime: number = 0;
  constructor(
    private reservationService: ReservationService,
    private dataService: DataService,
    public dialogRef: MatDialogRef<ScheduleRegressionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private router: Router,
    private testLabService: TestLabService,
  ) { }

  ngOnInit(): void {
     this.dataService.fetchSystemConfig();
    this.dataService.systemConfig.subscribe(config => {
      if (config && config.additional_time_for_reservation_value) {
        this.bufferTime = Number(config.additional_time_for_reservation_value) || 0;
        // console.log(this.bufferTime, "Buffer Time");

      }
    });
    console.log('this.data => ', this.data);
    const date1 = new Date();
    date1.setDate(date1.getDate() + 9);
    this.startDate = new Date(new Date().getTime() + 4 * 60000);
    this.endDate = date1;
    this.range.get("start")?.setValue(new Date(this.startDate));
    this.range.get("end")?.setValue(new Date(this.endDate));

    let allJobs = this.data.allJobs;
    let devName;
    this.updateJira = this.data.updateJira;
    let tfwNodes = [];
    let ontModel = null
    if (this.data.quickScheduler) {
      devName = allJobs[0].allDevices.find((dev) => dev._id == allJobs[0].selectedTestBed[0].dutId);
      tfwNodes = allJobs[0].selectedTestBed[0].nodes.filter((node) => node.tfw === true);
      if (allJobs[0].selectedTestBed[0].testBedName.indexOf('XGSPON') !== -1 && devName && devName['ONT Model (if XGSPON)']) {
        ontModel = devName['ONT Model (if XGSPON)'];
      }
    } else {
      devName = allJobs[0].allDevices.find((dev) => dev._id == allJobs[0].selectedTestBed.dutId);
      tfwNodes = allJobs[0].selectedTestBed.nodes.filter((node) => node.tfw === true);
      if (allJobs[0].selectedTestBed.testBedName.indexOf('XGSPON') !== -1 && devName && devName['ONT Model (if XGSPON)']) {
        ontModel = devName['ONT Model (if XGSPON)'];
      }
    }
    let tfwId = tfwNodes.length > 0 ? tfwNodes[0].deviceId : null;
    let tfwDevice = tfwId ? allJobs[0].allDevices.find((dev) => dev._id == tfwId) : null;
    // Device FW first; use CM Firmware only when Device FW is absent.
    const deviceFwRaw = devName ? devName["deviceFWVersion"] : undefined;
    const deviceFwRawStr = (deviceFwRaw === undefined || deviceFwRaw === null || deviceFwRaw === 'NA') ? '' : String(deviceFwRaw).trim();
    const cmFwRaw = devName ? devName["CM Firmware Version"] : undefined;
    const cmFwRawStr = (cmFwRaw === undefined || cmFwRaw === null) ? '' : String(cmFwRaw).trim();
    const cmFwForTag = (deviceFwRawStr !== '') ? deviceFwRaw : (cmFwRawStr !== '' ? cmFwRaw : 'NA');
    if (tfwDevice) {
      var tagName = devName?.deviceName + (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
        ("_" + cmFwForTag + "_") +
        (tfwDevice["deviceFWVersion"] != undefined ? tfwDevice["deviceFWVersion"] + "_" : "NA_") +
        allJobs[0]?.selectedTestcase[0]?.testSuiteName?.split(' ').join('_').split('_')[0];
    } else {
      var tagName = devName?.deviceName + (ontModel && ontModel != null && ontModel != undefined && ontModel.toLowerCase() != "na" ? "_" + ontModel : "") +
        ("_" + cmFwForTag + "_") +
        allJobs[0]?.selectedTestcase[0]?.testSuiteName?.split(' ').join('_').split('_')[0];
    }

    //let tagName= devName.deviceName+(devName["CM Firmware Version"]!=undefined?"_"+devName["CM Firmware Version"]+"_":"_NA_")+allJobs[0].checkedTestsuite[0].testSuiteName.slice(0, 4)+"_"+new Date().toISOString().replace(/T/g, "_").replace(/:|\.|Z/g, "");
    //  let tagName= devName.deviceName+(devName["CM Firmware Version"]!=undefined?"_"+devName["CM Firmware Version"]+"_":"_NA_") + (devName["deviceFWVersion"] != undefined ? "_" + devName["deviceFWVersion"] + "_" : "_NA_") + allJobs[0].selectedTestcase[0].testSuiteName.split(' ').join('_').split('_')[0];
    let multiIteration = false;
    for (let index = 0; index < allJobs.length; index++) {
      if (allJobs[index].noIterations && allJobs[index].noIterations > 1) {
        multiIteration = true;
        break;
      }
    }
    let multiJob = this.data.quickScheduler ? allJobs[0].selectedTestBed.length > 1 : allJobs.length > 1;

    if (multiIteration && multiJob) {
      tagName += "_ITR_MJ";
    } else if (multiIteration) {
      tagName += "_ITR";
    } else if (multiJob) {
      tagName += "_MJ";
    }
    this.tag_name = tagName;
    this.originalTagName = tagName;
    this.selectedTestbedIds = this.data["selectedTestbeds"];
    if (this.selectedTestbedIds.length > 1) {
      this.testbedName = "Testbeds";
    }
    this.reservationForm = new UntypedFormGroup({
      type: new UntypedFormControl("once", Validators.required),
      reservationName: new UntypedFormControl(tagName, Validators.required),
      users: new UntypedFormControl(
        [this.dataService.getCurrentUser()],
        Validators.required
      ),
      reserveAt: new UntypedFormControl("later", Validators.required),
      releaseAt: new UntypedFormControl(
        new Date(this.date.getTime() + this.data["maxTimeRequired"] * 60000),
        Validators.required
      ),
      reserveTime: new UntypedFormControl(this.date),
      testbedIds: new UntypedFormControl(this.selectedTestbedIds),
      days: new UntypedFormControl('single'),
      daterangeTime: new UntypedFormControl([this.startDate, this.endDate])
    });

    this.sub1 = this.reservationService
      .getAllReservationName()
      .subscribe((data: any) => {
        if (data) {
          this.allReservationName = data;
        }
      });

    this.sub2 = this.reservationForm.get("reserveAt").valueChanges.subscribe((value: any) => {
      if (value === "now") {
        this.reservationForm.get("reserveTime").clearValidators();
        this.reservationForm.get("reserveTime").setValue(new Date());
      } else if (value === "later") {
        this.reservationForm
          .get("reserveTime")
          .setValidators(Validators.required);
      }
    });

    this.sub3 = this.reservationForm
      .get("reservationName")
      .valueChanges.subscribe((value: any) => {
        if (this.allReservationName.indexOf(value) !== -1) {
          this.reservationForm
            .get("reservationName")
            .setErrors({ duplicate: true });
        } else if (
          this.reservationForm.get("reservationName").hasError("required")
        ) {
          this.reservationForm.get("reservationName").setErrors(null);
          this.reservationForm
            .get("reservationName")
            .setErrors({ required: true });
        } else {
          this.reservationForm.get("reservationName").setErrors(null);
        }
      });

    this.sub4 = this.reservationForm.get("reserveTime").valueChanges.subscribe(time => {
      this.checkFlag = false;
      this.testbedAvailable = false;
      this.loadingText = `Checking  ${this.testbedName
        }  availibility.Wait a moment !!`;
      this.loadingText = `${this.testbedName}  available on selected time.`;
      const d = new Date(time.getTime() + this.data["maxTimeRequired"] * 60000);
      this.reservationForm.get("releaseAt").setValue(d);
    });

    this.sub7 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    this.daysFlag = 'single';
  }

  /**
   * Check Availability Function
   */
  multySchedularData: any = [];
  multySchedularData_res: any = [];
  selectdateerr: boolean = false;
  checkAvailibility() {
    //console.log('inside checkAvailibility ')
    this.showerr = false;
    this.multySchedularData_res = [];
    this.selectdateerr = false;
    //console.log('this.reservationForm => ', this.reservationForm.value);
    if (this.reservationForm.value.days == 'single') {
      this.checkFlag = true;
      this.sub5 = this.reservationService.checkTestbedAvailability({
        ...this.reservationForm.value,
        loggedInUser: this.dataService.getCurrentUser()
      }).subscribe(data => {
        if (data) {
          this.setSuccess();
          this.testbedAvailable = true;
          this.loadingText = `Testbed(s) available on selected time.`;
        }
      }, err => {
        this.setFail();
        this.testbedAvailable = false;
        if (err.error.errorDetail.includes("Reservations Overlapping")) {
          const date = new Date(err.error.details.nextPossibleReservation);
          this.loadingText = ` ${this.testbedName
            } Unavailable. Next Available at ${date.toLocaleString()}`;
        } else if(err.error.reservationNames && err.error.reservationNames.length > 0
          && err.error.reservationNames[0].includes("Testbed Devices are in use")
        ) {
          const date = new Date(err.error.details.nextPossibleReservation);
          this.loadingText = ` ${this.testbedName} Unavailable. Next Available at ${date.toLocaleString()}`;
        } else {
          this.loadingText = "Reservation Failed. Try Again";
        }
      });
    } else if (this.reservationForm.value.days == 'multiple') {
      //console.log('inside else ');
      if (!this.reservationForm.value.daterangeTime[0] || !this.reservationForm.value.daterangeTime[1]) {
        //console.log('inside if date');
        this.selectdateerr = true;
        return
      }
      this.checkFlag = true;
      this.tag_name = this.reservationForm.value.reservationName;
      var name = this.reservationForm.value.reservationName;
      var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      var firstDate: any = new Date(this.reservationForm.value.daterangeTime[0]);
      var secondDate: any = new Date(this.reservationForm.value.daterangeTime[1]);
      var diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
      //console.log('diffDays => ', diffDays);
      var formdata: any = this.reservationForm.value
      for (let i = 0; i <= diffDays; i++) {
        //this.multySchedularData[i]=formdata;
        if (this.data.maxTimeRequired > 2880) {
          this.showerr = true;
          break;
        }
        var formVal: any = {}
        //setTimeout(() => {
        formVal = {};
        formVal = formdata;
        var date = new Date(formVal.daterangeTime[0]);
        var da1: any = date.setDate(date.getDate() + i);
        formVal.reserveTime = new Date(da1)
        formVal.releaseAt = new Date(new Date(da1).getTime() + this.data["maxTimeRequired"] * 60000)
        formVal.reservationName = name + '_' + (new Date(da1)).toDateString();
        formVal.reservationName.replace('(India Standard Time)', '')
        this.sub8 = this.reservationService
          .checkTestbedAvailability({
            ...formVal,
            loggedInUser: this.dataService.getCurrentUser()
          }).subscribe(data => {
            if (data) {
              // console.log('j => ', j);
              //this.setSuccess();
              this.multySchedularData_res.push(data);
              this.testbedAvailable = true;
              this.loadingText = `Testbed(s) available on selected time.`;
            }
          }, err => {
            // console.log('err => ', err);
            if (err.error.details && err.error.details.reservationNames && err.error.details.reservationNames.length) {
              this.multySchedularData_res.push({ available: false, name: 'Reservations Overlapping with ' + err.error.details.reservationNames[0] });
            } else if (err.error.reservationNames && err.error.reservationNames && err.error.reservationNames.length) {
              this.multySchedularData_res.push({ available: false, name: 'Reservations Overlapping with ' + err.error.reservationNames[0] });
            } else if (err.error.error) {
              this.multySchedularData_res.push({ available: false, name: err.error.error });
            } else {
              this.multySchedularData_res.push({ available: false, name: err.error.errorDetail });
            }
            //this.setFail();
            this.testbedAvailable = false;
            if (this.multySchedularData_res.length > 0) {
              for (let k = 0; k < this.multySchedularData_res.length; k++) {
                if (this.multySchedularData_res[k].available == true) {
                  this.testbedAvailable = true;
                  break;
                }
              }
            }

            if (err.error.errorDetail.includes("Reservations Overlapping")) {
              const date = new Date(err.error.details.nextPossibleReservation);
              this.loadingText = ` ${this.testbedName
                } Unavailable. Next Available at ${date.toLocaleString()}`;
            } else {
              this.loadingText = "Reservation Failed. Try Again";
            }
          });
        //}, 1);
        if (this.data.maxTimeRequired > 1440 && this.data.maxTimeRequired < 2880) {
          i++;
        }
      }

      setTimeout(() => {
        //console.log('Please Check Time Again ')
        this.checkFlag = false;
        this.changeDaysSel();
      }, 3 * 60 * 1000);
    }
  }

  /**
   * Close dialogue function
   */

  close() {
    this.dialogRef.close();
  }

  calculateMaxJobTime(jobDetails) {
    let maxJobTime = 0;
    let iteration = 1;
    for (let i = 0; i < jobDetails.job.length; i++) {
      iteration = jobDetails.job[i].numOfIteration;
      let tempTime = jobDetails.job[i].timeRequired * iteration;
      if (maxJobTime == 0 || (maxJobTime < tempTime)) {
        maxJobTime = tempTime;
      }
    }
    return maxJobTime;
  }

  updateTimeRequired(jobDetails) {
    for (let i = 0; i < jobDetails.job.length; i++) {
      jobDetails.job[i].timeRequired = jobDetails.job[i].timeRequired * jobDetails.job[i].numOfIteration;
    }
    return jobDetails;
  }


  sheduledResrvedDevice() {
    this.formSubmitted = true;
    var formdata: any = this.reservationForm.value
    // if(this.data.jobDetails.jira.update == true && this.data.jobDetails.jira.ueId == ''){
    //   this.createJiraFl = true;
    //   const startTime = new Date(this.data.jobDetails.startTime);
    //   let summaryName = this.generateSummaryName(this.data.jobDetails, startTime);
    //   var labels = [];

    //     for (let i = 0; i < this.data.jobDetails.job.length; i++) {
    //       if(this.data.jobDetails.job[i].testBedName){
    //         labels.push(this.data.jobDetails.job[i].testBedName.replace(/ /g,"_"));
    //       }

    //       if(this.data.jobDetails.job[i].environment_type){
    //         labels.push(this.data.jobDetails.job[i].environment_type.replace(/ /g,"_"));
    //       }

    //       if(this.data.jobDetails.job[i].firmwareVersion){
    //         labels.push(this.data.jobDetails.job[i].firmwareVersion.replace(/ /g,"_"));
    //       }
    //     }
    //   const jiraData = { summary: summaryName, tests: this.data.jobDetails.selectedIssueKey, team: this.selectedTeam, labels:labels };
    //   this.testLabService.createJiraTestcase(jiraData).subscribe(
    //     dataResult => {
    //       this.data.jobDetails['jira'].ueId = dataResult['issueId'];
    //       this.data.jobDetails['run_id'] = summaryName;
    //       this.data.jobDetails['jira'].key = dataResult['issueKey'];
    //       if(this.reservationForm.value.days == 'single'){
    //         this.reserveDevices();
    //       } else if(this.reservationForm.value.days == 'multiple'){
    //         var name = this.tag_name;
    //         var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    //         var firstDate:any = new Date(this.reservationForm.value.daterangeTime[0]);
    //         var secondDate:any = new Date(this.reservationForm.value.daterangeTime[1]);
    //         var diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    //         let maxJobTime = this.calculateMaxJobTime(this.data.jobDetails);
    //         for (let i = 0; i <= diffDays; i++) {
    //           if(this.data.maxTimeRequired > 2880) {
    //             break;
    //           }
    //           var formVal:any = {};
    //           var jobDetails:any = {}
    //           formVal = formdata;
    //           jobDetails = this.data.jobDetails;
    //           var date = new Date(formVal.daterangeTime[0]);
    //           var da1:any = date.setDate(date.getDate() + i);
    //           formVal.reserveTime = new Date(da1)
    //           var nameCh = '';
    //           nameCh = name + '_' + (new Date(da1)).toDateString();
    //           nameCh.replace('(India Standard Time)','')
    //           for (let j = 0; j < this.multySchedularData_res.length; j++) {
    //             if(this.multySchedularData_res[j].name == nameCh && this.multySchedularData_res[j].available == true){
    //               //formVal.releaseAt= new Date(new Date(da1).getTime() + this.data["maxTimeRequired"] * 60000)
    //               //formVal.releaseAt = new Date(da1);
    //               let dateValue = new Date(da1);
    //               dateValue.setMinutes(dateValue.getMinutes() + Number(maxJobTime));
    //               if ( j == 0 ) {
    //                 jobDetails = this.updateTimeRequired(this.data.jobDetails);
    //               }
    //               formVal.releaseAt = dateValue;
    //               formVal.reservationName =  this.multySchedularData_res[j].name;
    //               this.formSubmitted = true;
    //               jobDetails.startTime = formVal.reserveTime;
    //               //jobDetails.tagName=this.multySchedularData_res[j].name
    //               if(this.reservationForm.get('reservationName').value==null||this.reservationForm.get('reservationName').value==''){
    //                 this.reservationForm.get('reservationName').setValue(this.generateSummaryName(this.data.jobDetails,new Date(this.reservationForm.get('reserveTime').value)))
    //                 jobDetails.tagName=""
    //               }
    //               else{
    //                 jobDetails.tagName=this.multySchedularData_res[j].name //this.reservationForm.get('reservationName').value==this.generateSummaryName(this.data.jobDetails,new Date(this.reservationForm.get('reserveTime').value))?"":this.reservationForm.get('reservationName').value
    //               }
    //               jobDetails.run_id = this.generateSummaryName(jobDetails, dateValue);
    //               this.sub6=this.reservationService.addScheduledReservation( {
    //                 jobDetails: jobDetails, reservation: formVal, loggedInUser: this.dataService.getCurrentUser()
    //               }).subscribe((data: any) => {
    //                 this.createJiraFl = false;
    //                 if (data.status) {
    //                   this.snackBar.open("Reservation scheduled Successfully", "OK", {
    //                     duration: 5000
    //                   });
    //                 } else {
    //                   this.snackBar.open("Reservation Failed", "Try Again", {
    //                     duration: 5000
    //                   });
    //                 }
    //                 this.dialogRef.close();
    //                 this.router.navigateByUrl('/pages/dashboard');
    //               }, err => {
    //                 //console.log(err);
    //                 this.createJiraFl = false;
    //                 this.snackBar.open("Reservation Failed", "Try Again", {
    //                   duration: 5000
    //                 });
    //                 this.dialogRef.close();
    //                 this.router.navigateByUrl('/pages/dashboard');
    //               });
    //             break;
    //             }
    //           }
    //           if(this.data.maxTimeRequired > 1440 && this.data.maxTimeRequired < 2880){
    //             i++;
    //           }
    //         }
    //       }
    //     },
    //     err => {
    //       this.dataService.loading.next(false);
    //       this.snackBar.open(err && err.error && err.error.error ? err.error.error : 'Jira Create Cycle Failed.', 'Try Again', { duration: 5000 });
    //     }
    //   );
    // } else {
    if (this.reservationForm.value.days == 'single') {
      this.reserveDevices();
    } else if (this.reservationForm.value.days == 'multiple') {
      var name = this.tag_name;
      var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
      var firstDate: any = new Date(this.reservationForm.value.daterangeTime[0]);
      var secondDate: any = new Date(this.reservationForm.value.daterangeTime[1]);
      var diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
      let maxJobTime = this.calculateMaxJobTime(this.data.jobDetails);
      for (let i = 0; i <= diffDays; i++) {
        if (this.data.maxTimeRequired > 2880) {
          break;
        }
        var formVal: any = {};
        var jobDetails: any = {}
        formVal = formdata;
        jobDetails = this.data.jobDetails;
        var date = new Date(formVal.daterangeTime[0]);
        var da1: any = date.setDate(date.getDate() + i);
        formVal.reserveTime = new Date(da1)
        var nameCh = name + '_' + (new Date(da1)).toDateString();
        nameCh.replace('(India Standard Time)', '')
        for (let j = 0; j < this.multySchedularData_res.length; j++) {
          if (this.multySchedularData_res[j].name == nameCh && this.multySchedularData_res[j].available == true) {
            //console.log('da1 => ', i ,' i => ', da1);
            //console.log(new Date(new Date(da1).getTime() + this.data["maxTimeRequired"] * 60000));
            //formVal.releaseAt= new Date(new Date(da1).getTime() + this.data["maxTimeRequired"] * 60000);
            //formVal.releaseAt = new Date(da1).getTime();
            let dateValue = new Date(da1);
            dateValue.setMinutes(dateValue.getMinutes() + Number(maxJobTime));
            if (j == 0) {
              jobDetails = this.updateTimeRequired(this.data.jobDetails);
            }
            formVal.releaseAt = dateValue;
            formVal.reservationName = this.multySchedularData_res[j].name;
            jobDetails.startTime = formVal.reserveTime;
            this.formSubmitted = true;
            //jobDetails.tagName=this.multySchedularData_res[j].name
            if (this.reservationForm.get('reservationName').value == null || this.reservationForm.get('reservationName').value == '') {
              this.reservationForm.get('reservationName').setValue(this.generateSummaryName(this.data.jobDetails, new Date(this.reservationForm.get('reserveTime').value)))
              jobDetails.tagName = ""
              jobDetails.isTagEdited = false;
            } else {
              jobDetails.tagName = this.multySchedularData_res[j].name //this.reservationForm.get('reservationName').value==this.generateSummaryName(this.data.jobDetails,new Date(this.reservationForm.get('reserveTime').value))?"": this.reservationForm.get('reservationName').value
              jobDetails.isTagEdited = this.reservationForm.get('reservationName').value !== this.originalTagName;
            }
            jobDetails.run_id = this.generateSummaryName(this.data.jobDetails, formVal.reserveTime);

            this.sub6 = this.reservationService.addScheduledReservation({
              jobDetails: jobDetails, reservation: formVal, loggedInUser: this.dataService.getCurrentUser()
            }).subscribe((data: any) => {
              this.createJiraFl = false;
              if (data.status) {
                this.snackBar.open("Reservation scheduled Successfully", "OK", {
                  duration: 5000
                });
              } else {
                this.snackBar.open("Reservation Failed", "Try Again", {
                  duration: 5000
                });
              }
              this.dialogRef.close();
              this.router.navigateByUrl('/pages/dashboard');
            }, err => {
              //console.log(err);
              this.createJiraFl = false;
              this.snackBar.open("Reservation Failed", "Try Again", {
                duration: 5000
              });
              this.dialogRef.close();
              this.router.navigateByUrl('/pages/dashboard');
            });
            break;
          }
        }
        if (this.data.maxTimeRequired > 1440 && this.data.maxTimeRequired < 2880) {
          i++;
        }
      }
    }
    // }
  }
  /**
   * Reserve devices for regression
   */

  reserveDevices() {
    this.formSubmitted = true;
    if (this.reservationForm.get('reservationName').value == null || this.reservationForm.get('reservationName').value == '') {
      this.reservationForm.get('reservationName').setValue(this.generateSummaryName(this.data.jobDetails, new Date(this.reservationForm.get('reserveTime').value)))
      this.data.jobDetails.tagName = this.reservationForm.get('reservationName').value;
      this.data.jobDetails.isTagEdited = false;
    }
    else {
      this.data.jobDetails.tagName = this.reservationForm.get('reservationName').value == this.generateSummaryName(this.data.jobDetails, new Date(this.reservationForm.get('reserveTime').value)) ? "" : this.reservationForm.get('reservationName').value
      this.data.jobDetails.isTagEdited = this.reservationForm.get('reservationName').value !== this.originalTagName;
    }
    let maxJobTime = this.calculateMaxJobTime(this.data.jobDetails);
    let dateValue = new Date(this.reservationForm.value.reserveTime);
    dateValue.setMinutes(dateValue.getMinutes() + Number(maxJobTime));
    this.reservationForm.value.releaseAt = dateValue;
    this.data.jobDetails = this.updateTimeRequired(this.data.jobDetails);
    this.data.jobDetails.startTime = this.reservationForm.value.reserveTime;
    const scheduledStartTime = new Date(this.data.jobDetails.startTime);
    for (let job of this.data.jobDetails.job) {
      const jobTimeRequired = Number(job.timeRequired) || 0;
      console.log(jobTimeRequired, "jobTimeRequired");
      job.jobStartTime = scheduledStartTime.toISOString();
      console.log("jobStartTime", job.jobStartTime);
      const jobEstimatedEndDate = new Date(scheduledStartTime.getTime() + (jobTimeRequired + this.bufferTime) * 60 * 1000);
      job.estimatedEndTime = jobEstimatedEndDate.toISOString();
      console.log(job.estimatedEndTime, "job.estimatedEndTime");
      
    }
    this.data.jobDetails.run_id = this.generateSummaryName(this.data.jobDetails, dateValue);
    this.sub6 = this.reservationService
      .addScheduledReservation({
        jobDetails: this.data.jobDetails,
        reservation: this.reservationForm.value,
        loggedInUser: this.dataService.getCurrentUser()
      })
      .subscribe(
        (data: any) => {
          this.createJiraFl = false;
          if (data.status) {
            this.snackBar.open("Reservation scheduled Successfully", "OK", {
              duration: 5000
            });
          } else {
            this.snackBar.open("Reservation Failed", "Try Again", {
              duration: 5000
            });
          }
          this.dialogRef.close();
          this.router.navigateByUrl('/pages/dashboard');
        },
        err => {
          console.log(err);
          this.createJiraFl = false;
          this.snackBar.open("Reservation Failed", "Try Again", {
            duration: 5000
          });
          this.dialogRef.close();
          this.router.navigateByUrl('/pages/dashboard');
        }
      );
  }

  /**
   * Set Success function for successfull regression
   */

  setSuccess() {
    this.check.nativeElement.classList.remove("danger");
    this.path.nativeElement.classList.remove("danger");
    this.check.nativeElement.classList.add("check-complete");
    this.path.nativeElement.classList.add("path-complete");
    this.check.nativeElement.classList.add("success");
    this.path.nativeElement.classList.add("success");
  }

  /**
   * Set Fail function for Failed regression
   */

  setFail() {
    this.check.nativeElement.classList.remove("check-complete");
    this.check.nativeElement.classList.remove("success");
    this.cross.nativeElement.classList.remove("success");
    this.path.nativeElement.classList.remove("success");
    this.cross.nativeElement.classList.add("cross-complete");
    this.path.nativeElement.classList.add("path-complete");
    this.cross.nativeElement.classList.add("danger");
    this.path.nativeElement.classList.add("danger");
  }

  /**
   * Reset Regression details
   */

  reset() {
    this.check.nativeElement.classList.remove("check-complete");
    this.check.nativeElement.classList.remove("success");
    this.check.nativeElement.classList.remove("danger");
    this.path.nativeElement.classList.remove("check-complete");
    this.path.nativeElement.classList.remove("success");
    this.path.nativeElement.classList.remove("danger");
    this.cross.nativeElement.classList.remove("check-complete");
    this.cross.nativeElement.classList.remove("success");
    this.cross.nativeElement.classList.remove("danger");
  }
  ngOnDestroy() {
    if (this.sub1) {
      this.sub1.unsubscribe();
    }
    if (this.sub2) {
      this.sub2.unsubscribe();
    }
    if (this.sub3) {
      this.sub3.unsubscribe();
    }
    if (this.sub4) {
      this.sub4.unsubscribe();
    }
    if (this.sub5) {
      this.sub5.unsubscribe();
    }
    if (this.sub6) {
      this.sub6.unsubscribe();
    }
  }

  generateSummaryName(regressionData, startTime) {
    let runId = '';
    if (regressionData) {
      runId = regressionData.job[0].module + '_' + regressionData.job[0].regressionType + '_' + this.dataService.getCurrentUser()['username'] + '_' +
        regressionData.job[0].schedulerType + '_' + startTime.toISOString().replace(/T/g, '_').replace(/:|\.|Z/g, '');
    }
    return runId;
  }

  changeDaysSel() {
    //console.log('inside changeDaysSel');
    //console.log(this.daysFlag);

    if (this.daysFlag == 'single') {
      this.checkFlag = false;
      var date = new Date(new Date().getTime() + 4 * 60000);
      this.reservationForm.patchValue({
        days: this.daysFlag,
        reserveTime: date,
      })
    } else if (this.daysFlag == 'multiple') {
      this.checkFlag = false;
      const date1 = new Date();
      date1.setDate(date1.getDate() + 9);
      this.startDate = new Date(new Date().getTime() + 4 * 60000);
      this.endDate = date1;
      this.range.get("start")?.setValue(new Date(this.startDate));
      this.range.get("end")?.setValue(new Date(this.endDate));
      this.reservationForm.patchValue({
        days: this.daysFlag,
        daterangeTime: [this.startDate, this.endDate]
      })
    }
  }

  onChange(event) {
    this.checkFlag = false;
  }

}
