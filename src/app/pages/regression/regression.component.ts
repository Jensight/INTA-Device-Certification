import { Component, OnInit, OnDestroy } from '@angular/core';
import { TestLabService } from '../../@core/services/test-lab.service';
import { DataService } from '../../@core/services/data.service';

@Component({
    selector: 'app-regression',
    template: `
    
    <router-outlet></router-outlet>`
})
export class RegressionComponent implements OnInit ,OnDestroy {
    private selectedTeam;
    sub1;
    sub2;
    
    constructor(
        private tlService: TestLabService,
        private dataService: DataService,
    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            // console.log(team);
            if (team) {
                this.selectedTeam = team;
                //to get latest 100 data 
                this.getRegressionData();
            }
        });
    }

    ngOnInit() {
  
    }

    getRegressionData() {
        this.dataService.loading.next(true)

        this.sub2 = this.tlService.getRegressionInitialData().subscribe(regressionData => {
        
            if (regressionData) {
                this.dataService.getRegressionData().next(regressionData);
            }
            this.dataService.loading.next(false)
        });
    }
    ngOnDestroy() {
        if (this.sub1) {
            this.sub1.unsubscribe();
        }
        if (this.sub2) {
            this.sub2.unsubscribe();
        }
    }
}
