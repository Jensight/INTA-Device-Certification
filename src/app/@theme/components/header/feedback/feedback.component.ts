import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FeedbackService } from 'src/app/@core/services/feedback.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { UserService } from 'src/app/@core/services/user.service';
import * as _ from 'lodash';
// import { setTimeout } from 'timers';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy {
  public feedbackForm: UntypedFormGroup;
  submitted = false;
  currentUrl: any;
  userData;
  sub2;
  sub1;
  dropdownList = [];
  selectedItems = [];
  dropdownSettings: IDropdownSettings = {};
  constructor(private formBuilder: UntypedFormBuilder,
    public dialogRef: MatDialogRef<FeedbackComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    location: Location,
    public dataService: DataService,
    private snackBar: MatSnackBar,
    private feedbackService: FeedbackService
  ) {
    this.currentUrl = this.router.url;
  }

  ngOnInit(): void {

    const userDetails = this.dataService.getCurrentUser();
    this.userData = userDetails;
    this.feedbackForm = this.formBuilder.group({
      pageName: ['', Validators.required],
      users: [''],
      priority: ['', Validators.required],
      feedbackDescription: ['', Validators.required]
    });
    this.feedbackForm.patchValue({
      pageName: this.currentUrl
    });

    const userList = this.dataService.getUsers();
    const userDetail = this.dataService.getCurrentUser();

    // tslint:disable-next-line: prefer-for-of
    //  var count = 0;
    for (let index = 0; index < userList.length; index++) {
      if (userList[index].role !== 'admin' && userList[index].username !== userDetail.username) {
        this.dropdownList.push({ item_id: userList[index]._id, item_text: userList[index].username });
        //  count ++;
        // var list = _.sortBy(this.dropdownList,  'item_text' );

      }

      setTimeout(() => {
        this.dropdownList = _.sortBy(this.dropdownList, 'item_text');
        this.dropdownList.sort((a, b) => {
          if (a.item_text.toLowerCase() > b.item_text.toLowerCase()) {
            return 1;

          }
          if (a.item_text.toLowerCase() < b.item_text.toLowerCase()) {
            return -1;

          }

          return 0;
        });
      }, 1);

    }

    // Multiple Select
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 3,
      allowSearchFilter: true
    };

  }

  get registerFormControl(): any {
    return this.feedbackForm.controls;
  }
  onMyFeedback(): any {
    this.dialogRef.close();
    if (this.userData.role === 'admin') {
      this.router.navigateByUrl('/pages/settings/feedback/view');
    } else {
      this.router.navigateByUrl('/pages/userSetting/feedback/view');
    }
  }
  onSubmit(): any {

    this.submitted = true;
    // stop here if form is invalid
    if (this.feedbackForm.invalid) {
      return;
    }
    this.dataService.loading.next(true);
    const temp = this.feedbackForm.value;
    temp.createdAt = new Date().toISOString();
    temp.createdBy = this.userData._id;
    temp.status = 'Initiated';
    temp.comments = [];
    temp.userList = [];
    if (temp.users.length > 0) {
      // tslint:disable-next-line: prefer-for-of
      for (let index = 0; index < temp.users.length; index++) {
        temp.userList.push({ _id: temp.users[index].item_id, username: temp.users[index].item_text, read: 0 });
      }
    }
    delete temp.users;
    this.sub2 = this.feedbackService.addFeedback(this.feedbackForm.value).subscribe(
      result => {
        this.dataService.loading.next(false);
        if (result) {
          this.dataService.getAllFeedback().next(result);
          this.snackBar.open('Feedback Added Successfully', 'OK', {
            duration: 5000
          });
          this.dialogRef.close();
        }
      },
      error => {
        this.dataService.loading.next(false);
        this.snackBar.open('Error Adding Feedback', 'Try Again', {
          duration: 5000
        });
        this.dialogRef.close();
      }
    );
  }

  ngOnDestroy(): any {
  }
}
