import { Component, OnInit, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { TestCaseInventoryService } from '../../../../@core/services/testcase-inventory.service';
import { DataService } from '../../../../@core/services/data.service';
import * as _ from 'lodash';
import { CdkDragDrop, moveItemInArray, transferArrayItem, copyArrayItem } from '@angular/cdk/drag-drop';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-map-testcase',
    templateUrl: './map-testcase.component.html',
    styleUrls: ['./map-testcase.component.scss']
})
export class MapTestCaseComponent implements OnInit, OnDestroy {
    searchCreteria = 'tc';
    allTestGroup = [];
    allTestCase = [];
    allTestcaseDuplicate = [];
    duplicateAllTestGroup = [];
    searchAllTestCase = [];
    searchTerm;
    searchTermTestSuite;
    searchTermTestGroup;
    duplicateMappedTestCase = [];
    mappedTestCase = [];
    testGroupSearch = '';
    selectedTeam;
    sub1;
    sub2;
    sub3;
    sub4;
    sub5;
    className = ['green-color', 'pink-color', 'orange-color', 'red-color'];
    public selectedTestSuite: any;
    breadcrumbs = [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '#/pages/testcase-inventory/testsuite',
            label: 'TestCase Inventory'
        },
        {
            link: '#/pages/testcase-inventory/testsuite/maptestcases',
            label: 'MAP Testcases'
        }
    ];
    constructor(

        private toasterService: ToastrService,
        private tcInventoryService: TestCaseInventoryService,
        private dataService: DataService,
        public snackBar: MatSnackBar,
        private router: Router,
        private r: ActivatedRoute,

    ) {
        this.sub1 = this.dataService.selectedTeam.subscribe(team => {
            if (team) {
                this.selectedTeam = team;
            }
        });
        {
            this.sub5 = this.tcInventoryService.configureTestsuite.subscribe(data => {
                if (data) {
                    this.selectedTestSuite = data;
                    this.mappedTestCase = this.selectedTestSuite["testCases"].map((testCase) => {
                        return typeof testCase === "object" ? testCase._id : testCase;
                      });
              
                } else {
                    this.router.navigate(['../'], { relativeTo: this.r });
                }
            });
        }

        this.sub2 = this.dataService.getTestGroup().subscribe(tg => {
            if (tg) {
                this.allTestGroup = tg;
            }
        });

        this.sub3 = this.dataService.getTestCases().subscribe(tc => {
            if (tc) {
                this.allTestCase = tc;
                this.allTestcaseDuplicate = _.cloneDeep(tc);
                this.allTestcaseDuplicate = (_.differenceWith(this.allTestcaseDuplicate, this.mappedTestCase, (a, b) => {
                    return a._id == b;
                }));
            }
        });
    }

    ngOnInit() {
        this.duplicateAllTestGroup = this.allTestGroup;
        this.searchAllTestCase = this.allTestcaseDuplicate;
        this.duplicateMappedTestCase = JSON.parse(JSON.stringify(this.mappedTestCase));

    }

    /**
     * Remove function to remove testcase
     * @param event .
     * @param type .
     */
    remove(event, type) {
        const selectedTestcase = _.find(this.allTestCase, { _id: event.previousContainer.data[event.previousIndex] });
        if (selectedTestcase && type == 'tc') {
            transferArrayItem(
                [selectedTestcase],
                event.container.data,
                0,
                event.currentIndex
            );
            event.previousContainer.data.splice(event.previousIndex, 1);
        } else if (selectedTestcase && type == 'tg') {
            transferArrayItem(
                [selectedTestcase],
                this.allTestcaseDuplicate,
                0,
                this.allTestcaseDuplicate.length
            );
            event.previousContainer.data.splice(event.previousIndex, 1);
        }
    }

    /**
     * Map testcase function
     */

    mapTestCase() {
        this.selectedTestSuite['testCases'] = this.mappedTestCase;
        this.sub4 = this.tcInventoryService.mapTestCases( this.selectedTestSuite).subscribe(
            result => {
                if (result) {
                    this.dataService.getTcInventoryData().next(result);
                    this.snackBar.open('Testcase Mapped Successfully', 'OK', {
                        duration: 5000
                    });
                    this.router.navigate(['../'], { relativeTo: this.r });
                }
            },
            error => {
                this.snackBar.open('Error Mapping Testcase', 'Try Again', {
                    duration: 5000
                });
            }
        );
    }

    add(event: CdkDragDrop<any[]>, type) {
        if (event.previousContainer === event.container) {
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        } else if (type === 'tc') {
            const previousSelectedData = event.previousContainer.data[event.previousIndex];
            transferArrayItem(
                [previousSelectedData['_id']],
                event.container.data,
                0,
                event.currentIndex
            );

            event.previousContainer.data.splice(event.previousIndex, 1);
        } else if (type === 'tg') {
            const selectedTestCase = _.filter(this.allTestCase, { tcGroupId: event.previousContainer.data[event.previousIndex]['_id'] });
            const selectedTestcaseId = _.map(selectedTestCase, '_id');
            this.mappedTestCase = [...this.mappedTestCase, ...selectedTestcaseId];
            this.mappedTestCase = _.uniq(this.mappedTestCase);
            this.allTestcaseDuplicate = (_.differenceWith(this.allTestcaseDuplicate, this.mappedTestCase, (a, b) => {
                return a._id == b;
            }));
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
        if (this.sub4) {
            this.sub4.unsubscribe();
        }
        if (this.sub5) {
            this.sub5.unsubscribe();
        }
    }
    applyFilterTestGroup() {
        let term = this.searchTermTestGroup;
        let data: any = [];
        if (term === '') {
            this.allTestGroup = this.duplicateAllTestGroup;
            return this.allTestGroup;
        }
        else {
            term = term.toLowerCase();
            this.allTestGroup = this.duplicateAllTestGroup;
            data = this.allTestGroup.filter(function (el: any) {
                return el.testGroupName.toLowerCase().includes(term);

            });
            this.allTestGroup = data;
        }
    }
    applyFilter() {
        let term = this.searchTerm;
        let data: any = [];
        if (term === '') {
            this.allTestcaseDuplicate = this.searchAllTestCase;
            return this.allTestcaseDuplicate;
        }
        else {
            term = term.toLowerCase();
            this.allTestcaseDuplicate = this.searchAllTestCase;
            data = this.allTestcaseDuplicate.filter(function (el: any) {
                return el.tcName.toLowerCase().includes(term);

            });
            this.allTestcaseDuplicate = data;
        }
    }

    selectATestcase(index, type) {
        if (type === 'tc') {
            const selectedTestcase = _.find(this.allTestCase, { _id: index });
            transferArrayItem([selectedTestcase._id], this.mappedTestCase, 0, this.mappedTestCase.length);
            this.mappedTestCase = _.uniq(this.mappedTestCase);
            this.allTestcaseDuplicate.splice(_.findIndex(this.allTestcaseDuplicate, { _id: index }), 1);
        } else if (type === 'tg') {
            const selectedTestCase = _.filter(this.allTestCase, { tcGroupId: index });
            const selectedTestcaseId = _.map(selectedTestCase, '_id');
            this.mappedTestCase = [...this.mappedTestCase, ...selectedTestcaseId];
            this.mappedTestCase = _.uniq(this.mappedTestCase);
            this.allTestcaseDuplicate = (_.differenceWith(this.allTestcaseDuplicate, this.mappedTestCase, (a, b) => {
                return a._id == b;
            }));
        }
    }

    removeATestcase(index, type) {
        const selectedTestcase = _.find(this.allTestCase, { _id: this.mappedTestCase[index] });
        transferArrayItem([selectedTestcase], this.allTestcaseDuplicate, 0, this.allTestcaseDuplicate.length);
        this.mappedTestCase.splice(index, 1);
    }
}
