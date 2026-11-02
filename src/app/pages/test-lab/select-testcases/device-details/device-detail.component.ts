import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '../../../../@core/services/data.service';
import * as _ from 'lodash';
import { ReservationService } from 'src/app/@core/services/reservation.service';
import{ ConfirmationDiaogComponent } from 'src/app/@shared/components/confirmation-dialog/confirmation-dialog.component';
@Component({
  selector: 'app-device-detail',
  templateUrl: './device-detail.component.html',
  styleUrls: ['./device-detail.component.scss'],
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  allDevices = [];
  selectedDevice;
  selectedDeviceKeys;
  noDeviceMapped = false;
  allReservations = [];
  sub1;
  sub2;
  sub3;
  sub4;
  disableunlockButton = false;
  selectedTeam;
  sub5: any;
  constructor(
    public dialog: MatDialog,
    public dataService: DataService,
    private reservationService: ReservationService,
    public dialogRef: MatDialogRef<DeviceDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

  ) {
    this.sub3 = this.dataService.selectedTeam.subscribe((team) => {
      if (team) {
        this.selectedTeam = team;
      }
    });
    const user = this.dataService.getCurrentUser();
    this.sub1 = this.dataService.getAllDevices().subscribe((device) => {
      if (device) {
        try {
          this.allDevices = device;
          this.selectedDevice = _.find(this.allDevices, {
            _id: data['deviceId'],
          });

          if(this.selectedDevice.reservedBy == user.username){
this.disableunlockButton=true;
          }
          this.selectedDeviceKeys = Object.keys(this.selectedDevice);
          let unavailableKeys = this.selectedDeviceKeys.filter((key) => {
            if (this.selectedDevice[key]) {
              return false;
            }
            return true;
          });
          _.remove(this.selectedDeviceKeys, function (keyValue) {
            return (
              _.indexOf(
                [
                  '_id',
                  'profileId',
                  'available',
                  'createdAt',
                  'updatedAt',
                  ...unavailableKeys,
                ],
                keyValue
              ) !== -1
            );
          });
        } catch (e) {
          this.noDeviceMapped = true;
        }
      }
    });
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
  }
  unlockDevice() {
    //  this.dialogRef.close({data:this.selectedDevice._id});
    this.openConfirmationDialog();
  }
  openConfirmationDialog() {
    let filteredList = this.allReservations.filter(data => data.active == true);
    //  let stringFilteredArray  = filteredList.map(data => data.deviceIds.map( device => device.toString()));
    const stringFilteredArray = filteredList.filter((reservation) => {
      return reservation.deviceIds
        .map(deviceId => deviceId.toString())
        .includes(this.selectedDevice._id.toString())
    })
    //  data?.deviceIds?.includes(this.selectedDevice._id) &&
    let text = "";
    for (let i = 0; i < filteredList.length; i++) {
      text = "Reservation Name: " + filteredList[i].reservationName + "\n" + "Reservation Type: " + filteredList[i].reservationType + "\n";
    }

    const dialogRef = this.dialog.open(ConfirmationDiaogComponent, {
      width: '900px',

      data: {
        name: 'Reservation',
        text:
          "This will cancel all schedules and release devices associated with this. This action can't be reversed. Are you sure you want to proceed?" + "\n Used in Reservations: \n" + text,
        action: 'Cancel',
        isTable: true,
        usedReservations: filteredList,
      },
      panelClass: 'app-full-bleed-dialog'
    });
    this.sub5 = dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        if (filteredList && filteredList.length > 0) {
          for (let i = 0; i < filteredList.length; i++) {
            if (filteredList[i].reservationType == ("TESTBED" || "REGRESSION")) {
              this.cancelReservation(filteredList[i]._id);
            }
            else if (filteredList[i].reservationType == ("DEVICES")) {
              if (filteredList[i].deviceIds.length == 1) {
                this.cancelReservation(filteredList[i]._id);
              }
              else if (filteredList[i].deviceIds.length > 1) {
                let data = {
                  id: this.selectedDevice._id
                }
                this.reservationService.removeUnlockDeviceFromReservation(filteredList[i]._id, data).subscribe((data: any) => {
                  if (data) {
                    this.dialogRef.close({ data: this.selectedDevice._id });
                    this.dataService.loading.next(false);
                  }
                });

              }

            }
          }

        }
      }
    });
  }



  cancelReservation(id) {
    this.reservationService.cancelReservation( id).subscribe((data: any) => {
      if (data) {
        this.dialogRef.close({ data: this.selectedDevice._id });
        this.dataService.loading.next(false);

      }
    });
  }
  ngOnInit() {
    this.sub2 = this.reservationService.getAllReservations().subscribe((data: any) => {
      // console.log("data", data);
      if (data) {
        this.allReservations = data;
        this.dataService.allReservation.next(data)
      }
      this.dataService.loading.next(false);
    });
  }
}
