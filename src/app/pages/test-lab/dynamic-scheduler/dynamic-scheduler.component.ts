import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from 'src/app/@core/services/data.service';
import { DynamicSchedulerFormComponent } from './dynamic-scheduler-form/dynamic-scheduler-form.component';
import { DynamicSchedulerHistoryComponent } from './dynamic-scheduler-history/dynamic-scheduler-history.component';

@Component({
  selector: 'app-dynamic-scheduler',
  templateUrl: './dynamic-scheduler.component.html',
  styleUrls: ['./dynamic-scheduler.component.scss']
})
export class DynamicSchedulerComponent implements OnInit, OnDestroy {
  @ViewChild('schedulerForm') schedulerForm: DynamicSchedulerFormComponent;
  @ViewChild('historyComp') historyComp: DynamicSchedulerHistoryComponent;
  selectedTabIndex = 0;
  isSysAdmin = false;

  constructor(private dataService: DataService, private route: ActivatedRoute) {
    const currentUser: any = this.dataService.getCurrentUser();
    this.isSysAdmin = !!(currentUser && currentUser.username === 'sysadmin');
  }

  ngOnInit() {
    const tab = (this.route.snapshot.queryParamMap.get('tab') || '').toLowerCase();
    if (tab === 'history') {
      this.selectedTabIndex = 1;
    } else if (tab === 'modeltcmatrix' || tab === 'model-tc-matrix') {
      this.selectedTabIndex = 2;
    }
  }

  ngOnDestroy() {}

  onRefreshHistory() {
    if (this.historyComp) {
      this.historyComp.onRefresh();
    }
  }

  onTabChanged(event) {
    this.selectedTabIndex = event.index;
    // History component is re-created via *ngIf when tab becomes active and
    // its ngOnInit() will fetch fresh data (with cleared filters). No explicit
    // loadHistory() call is needed here.
  }

  onScheduled() {
    // Switching to History will recreate the component which auto-loads data.
    this.selectedTabIndex = 1;
  }
}
