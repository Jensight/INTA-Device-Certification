import { switchMap, debounceTime, take } from 'rxjs/operators';
import { Component, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { DataService } from '../../../@core/services/data.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { TestLabService } from "../../../@core/services/test-lab.service";
import { Observable } from "rxjs";
import { UserService } from 'src/app/@core/services/user.service';

@Component({
    selector: 'app-regression-detail',
    templateUrl: './regression-detail.component.html',
    styleUrls: ['./regression-detail.component.scss']
})
export class RegressionDetailComponent implements OnInit, OnDestroy {
    public allRegressionData = [];
    public selectedRegressionId;
    public selectedRegression;
    public selectedRegressionJob = [];
    public changeDetector = new EventEmitter<any>();
    fromScreen: string = 'list';
    sub1;
    sub2;
    sub3;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/regression/list',
            label: 'Regression List'
        },
        {
            link: '#/pages/regression/detail',
            label: 'Regression Details'
        }
    ]
    firstCalled = false;
    enable_edit_reg_status:boolean = false;
    constructor(private dataService: DataService, private route: ActivatedRoute, private tlService: TestLabService, private userService: UserService) {
        this.sub1 = this.route.params.subscribe(params => {
            this.selectedRegressionId = params['id'];
            this.destroySub()
            this.subscribeData();
        });
    }

    subscribeData() {
        this.sub3 = this.dataService.selectedRegressionData.pipe(
            debounceTime(100),
            take(1)
            ).subscribe(dataa => {
            if (dataa !== null && dataa !== undefined && dataa['_id'] === this.selectedRegressionId) {
                this.selectedRegression = _.cloneDeep(dataa);
                this.selectedRegressionJob = _.cloneDeep(dataa['job']);
            } else if(dataa === 'ReRunClicked'){

            } else {
                this.sub2 = this.dataService.selectedTeam
                    .pipe(
                        switchMap(team => {
                            if(team){
                                this.userService.getAllusers().subscribe((data:any)=>{
                                    if(data[0].dashboardConfig && data[0].dashboardConfig[0] && data[0].dashboardConfig[0].teams){
                                        data[0].dashboardConfig[0].teams.forEach(el => {
                                            if(el.name == team) {
                                                //console.log(el);
                                                if(el.enable_edit_reg_status){
                                                    if(el.enable_edit_reg_status == true) {
                                                        this.enable_edit_reg_status = true;
                                                        //console.log('this.enable_edit_reg_status => 71', this.enable_edit_reg_status);
                                                    }
                                                }
                                            }
                                        });
                                    }
                                })
                                return this.tlService.getRegression( this.selectedRegressionId);
                            }else {
                                return Observable.create(null)
                            }
                        })
                    )
                    .subscribe(regression => {
                        if (regression) {
                            this.selectedRegression = _.cloneDeep(regression);
                            this.selectedRegressionJob = _.cloneDeep(regression['job']);
                        }
                    });
            }
        });
    }

    ngOnInit(): void {
        if (history.state && history.state.fromScreen) {
      this.fromScreen = history.state.fromScreen;
    }
    }



    destroySub(){
    if (this.sub2) {
        this.sub2.unsubscribe();
    }
    if (this.sub3) {
        this.sub3.unsubscribe();
    }
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
}

