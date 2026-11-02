import { SERVER } from './../../models/config';
// import { Http, Response } from '@angular/http';
import { Injectable, EventEmitter } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';
import { Router, NavigationEnd } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';
import { UserService } from './user.service';
@Injectable()
export class DataService {
    // user Data
    private settingsData = new BehaviorSubject(null);
    private allTeams = [];
    private allUsers = [];
    private currentUser;
    private allLabSetUp = [];
    public allErrorCodes = [];
    private apigrpId = {}
    private vendorId = {}
    private deviceProfId = {}
    private dashBoardConfig = {}
    private regressionConfig = []
    /* Dashboard Rules Config */
    public allDeviceTypeModels = []
    public deviceTypeList = []
    public dashBoardRulesConfig = []
    public allDashboardRulesConfigs = []
    public modelTypeList = []
    public selectedQuarter;
    public selectedDay;
    //To Store filter values
    private filterdata = new BehaviorSubject(null);
    private filter = new BehaviorSubject(null);

    //To Store Selected Values in DB Management
    private selectedData = new BehaviorSubject(null);
    private selected = new BehaviorSubject(null);

    // Device Inventory Data
    private deviceInventoryData = new BehaviorSubject(null);
    private allVendors = new BehaviorSubject(null);
    private allModels = new BehaviorSubject(null);
    private allProfiles = new BehaviorSubject(null);
    private allDevices = new BehaviorSubject(null);
    private allFeedBack = new BehaviorSubject(null);
    private variableGroups = new BehaviorSubject(null);

    // Testbed Data
    private testbedData = new BehaviorSubject(null);
    private testbed = new BehaviorSubject(null);
    private nodes = new BehaviorSubject(null);
    private variables = new BehaviorSubject(null);
    private tbProfiles = new BehaviorSubject(null);

    // API Data
    private APIInventoryData = new BehaviorSubject(null);
    private apiGroup = new BehaviorSubject<any[]>([]);
    private api = new BehaviorSubject(null);

    // Testcase Data
    private testCaseInventoryData = new BehaviorSubject(null);
    private allModules = new BehaviorSubject(null);
    private allTestSuite = new BehaviorSubject(null);
    private allTestGroup = new BehaviorSubject(null);
    private allTestCase = new BehaviorSubject(null);

    // Regression Data
    private regressionData = new BehaviorSubject(null);

    // Selected Team
    public selectedTeam: BehaviorSubject<String> = new BehaviorSubject(null);
    public loading: BehaviorSubject<Boolean> = new BehaviorSubject(false);

    // sidebar
    public sideBarOnToggle = new EventEmitter();
    public selectedRegressionData = new BehaviorSubject(null);

    // ReservationData
    public selectedReservation = new BehaviorSubject(null);
    public allReservation = new BehaviorSubject(null);
    // Regression Analysis Data
    public regressionAnalysisData = new BehaviorSubject(null);
    public selectedRegStatus = new BehaviorSubject(null);
    public showNoRunStatus = new BehaviorSubject(true);
    public regressionNoData = new BehaviorSubject(false);
    public yearChange = new BehaviorSubject(null);
    public regressionAnalysisDetails = new BehaviorSubject(null);
    public allRegressionDetails = new BehaviorSubject(null);
    public noRegressionDetails = new BehaviorSubject(null);

    // CPE Analsysis Data
    public CPERegressionAnalysisData = new BehaviorSubject(null);
    public CPERegressionNoData = new BehaviorSubject(false);

    // TC Analysis Data
    public tcAnalysisData = new BehaviorSubject(null);
    public selectedTestbed = new BehaviorSubject(null);

    // get build version
    public buildVersion = new BehaviorSubject(null);
    public aboutContent = new BehaviorSubject(null);

    //Store Sort Data
    public nodeSortData: any = null;
    public variableSortData: any = null;
    public testbedSortData: any = null;
    public regressionSortData: any = null;
    public teamSortData: any = null;
    public userSortData: any = null;
    public vendorSortData: any = null;
    public profileSortData: any = null;
    public modelSortData: any = null;
    public deviceSortData: any = null;
    public apiSortData: any = null;
    public apiGroupSortData: any = null;
    public moduleSortData: any = null;
    public testsuitSortData: any = null;
    public testGroupSortData: any = null;
    public testcaseSortData: any = null;
    //copy collection
    public copyCollectionButton = new BehaviorSubject(false)
    public batchCount: BehaviorSubject<any> = new BehaviorSubject(null);
    deleteValue: boolean;

    // side bar menu
    public menuList: BehaviorSubject<any> = new BehaviorSubject([]);
    // session logout
    public isSessionExpired: BehaviorSubject<boolean> = new BehaviorSubject(false);
    // tc execution analysis -- daily screen
    public filteredstartDate = new BehaviorSubject(null);
    public filteredendDate = new BehaviorSubject(null);
    public selectedMonth = new BehaviorSubject(null);
    public selectedYear = new BehaviorSubject(null);
    // tc execution analysis -- monthly screen
    public filteredMonth = new BehaviorSubject(null);
    public filteredYear = new BehaviorSubject(null);
    public filteredEndMonth = new BehaviorSubject(null);
    public filteredEndYear = new BehaviorSubject(null);
    public selectedquarterYear = new BehaviorSubject(null);
    public backFromDayScreen = new BehaviorSubject(false);
    public backFromDailyScreen = new BehaviorSubject(false);
    public allNodesDetails = new BehaviorSubject(null);
    public vendorModelDetails = new BehaviorSubject(null);
    public modelVariables = new BehaviorSubject(null);
    public yearWiseData = new BehaviorSubject(null);
    public allYears = new BehaviorSubject(null);
    // tc execution analysis -- yearly screen
    public defaultYear = new BehaviorSubject(null);
    public systemConfig = new BehaviorSubject<any>(null);
    defaultYearObservable: Observable<string> = this.defaultYear.asObservable();

    public hasStuckRegression: BehaviorSubject<boolean> = new BehaviorSubject(false);

    // Jira Config for team
    public isJiraEnabled: BehaviorSubject<boolean> = new BehaviorSubject(false);

    constructor(private httpClient: HttpClient, private router: Router, private userService: UserService) {
        // Subscribe to team changes and update dashboard rules config accordingly
        this.selectedTeam.subscribe(team => {
            if (team) {
                this.updateDashboardRulesForTeam(team as string);
            }
        });

        this.selectedData.subscribe(data => {
            if (data) {
                this.selected.next(data)
            }
        })

        this.filterdata.subscribe(data => {
            if (data) {
                this.filter.next(data)
            }
        })

        this.deviceInventoryData.subscribe(data => {
            if (data && data.length > 0) {
                const vendors = _.filter(data, function (obj) {
                    return obj['vendors'] !== undefined;
                });
                this.vendorId = { _id: vendors[0]._id };
                const index = vendors[0].vendors.indexOf('vAUTO');
                if (index > -1) {
                    vendors[0].vendors.splice(index, 1);
                }
                this.allVendors.next(vendors[0].vendors);
                const models = _.filter(data, function (obj) {
                    return (
                        obj['modelName'] !== undefined &&
                        obj['deviceVendor'] !== undefined &&
                        obj['profileName'] !== undefined
                    );
                });
                this.allModels.next(models);
                const profile = _.filter(data, function (obj) {
                    return obj['deviceProfile'] !== undefined;
                });
                this.deviceProfId = { _id: profile[0]._id }
                this.allProfiles.next(profile[0].deviceProfile);

                const allDevices = _.filter(data, function (obj) {
                    return obj['deviceName'] !== undefined;
                });
                this.allDevices.next(allDevices);

                const allVariableGroup = _.filter(data, function (obj) {
                    return obj['groupName'] !== undefined;
                });

                this.variableGroups.next(allVariableGroup);
            }
        });

        // Getting API Inventory Data and Using Observables for Updates
        this.APIInventoryData.subscribe(data => {
             
            if (data) {
                const allApiGroup = _.filter(data, function (group) {
                    return group['apiGroups'] instanceof Array;
                });
                this.apigrpId = { _id: allApiGroup[0]._id }
                console.log('allApiGroup>>>>',  allApiGroup);
                if(allApiGroup && allApiGroup[0].apiGroups){
                    console.log('API apiGroup Data inside if>>>>',     allApiGroup[0].apiGroups);
                    this.apiGroup.next(allApiGroup[0].apiGroups);
                    console.log(' this.apiGroup>>>',      this.apiGroup);
                }else{
                    console.log('API apiGroup Data after undefined>>>',   this.apiGroup, allApiGroup);
                }
                
               
                const allAPI = _.filter(data, function (group) {
                    return (
                        group['apiGroupId'] !== undefined &&
                        group['apiName'] !== undefined &&
                        group['arguments'] !== undefined
                    );
                });
               
                this.api.next(allAPI);
            }
        });

        this.testCaseInventoryData.subscribe(allData => {
            if (allData) {
                const tcModule = _.filter(allData, function (module) {
                    return module['moduleName'] !== undefined;
                });

                const tcTestSuite = _.filter(allData, function (testsuite) {
                    return (
                        testsuite['testSuiteName'] !== undefined &&
                        testsuite['moduleId'] !== undefined &&
                        testsuite['testCases'] !== undefined
                    );
                });

                const testGroup = _.filter(allData, function (testgroup) {
                    return testgroup['testGroupName'] !== undefined;
                });

                const testCases = _.filter(allData, function (testcase) {
                    return (
                        testcase['tcId'] !== undefined &&
                        testcase['tcName'] !== undefined &&
                        testcase['tcGroupId'] !== undefined
                    );
                });
                this.allModules.next(tcModule);
                this.allTestSuite.next(tcTestSuite);
                this.allTestGroup.next(testGroup);
                this.allTestCase.next(testCases);
            }
        });

        this.testbedData.subscribe(allData => {

            if (allData) {
                const node = _.filter(allData, function (tbData) {
                    return (
                        tbData['_id'] !== undefined &&
                        tbData['nodeName'] !== undefined &&
                        tbData['profileId'] !== undefined
                    );
                });

                const testBed = _.filter(allData, function (tbData) {
                    return (
                        tbData['_id'] !== undefined &&
                        tbData['testBedName'] !== undefined &&
                        tbData['nodes'] !== undefined &&
                        tbData['variables'] !== undefined
                    );
                });

                const testBedVariables = _.filter(allData, function (tbData) {
                    return tbData['_id'] !== undefined && tbData['variableName'] !== undefined;
                });

                const testBedProfile = _.filter(allData, function (tbData) {
                    return (
                        tbData['_id'] !== undefined &&
                        tbData['testBedProfileName'] !== undefined &&
                        tbData['nodes'] !== undefined &&
                        tbData['variables'] !== undefined
                    );
                });
                this.nodes.next(node);
                this.testbed.next(testBed);
                this.tbProfiles.next(testBedProfile);
                this.variables.next(testBedVariables);
            }
        });
    }

    fetchSystemConfig() {
        this.userService.getAllusers().subscribe((data: any) => {
            if (data[0].extraSystemConfig && data[0].extraSystemConfig[0]) {
                this.systemConfig.next(data[0].extraSystemConfig[0]);
            }
        });
    }

    getSelectedData() {
        return this.selectedData
    }

    getSelected() {
        return this.selected
    }

    getFIlterData() {
        return this.filterdata
    }

    getfilter() {
        return this.filter
    }

    getApiGrpId() {
        return this.apigrpId
    }
    getVendorId() {
        return this.vendorId
    }
    getDeviceProfId() {
        return this.deviceProfId
    }

    saveSettingData(UserSettingsData) {
        // Getting User Data For Login
        this.settingsData.next(UserSettingsData);
        this.settingsData.subscribe(data => {
            if (data) {
                this.allTeams = data.teams || [];
                this.allUsers = data.users || [];
                this.allLabSetUp = data.LabSetUp || [];
                this.allErrorCodes = data.errorCodes || [];
                this.dashBoardConfig = data.dashboardConfig ? data.dashboardConfig : [];
                this.regressionConfig = data.regressionConfig ? data.regressionConfig : [];

                this.allDashboardRulesConfigs = data.dashboardRulesConfig || [];

                const currentTeam = this.selectedTeam.getValue();
                if (currentTeam) {
                    this.updateDashboardRulesForTeam(currentTeam as string);
                } else {
                    this.dashBoardRulesConfig = this.allDashboardRulesConfigs.length > 0 ?
                        this.allDashboardRulesConfigs[0] : [];
                    this.updateDerivedConfigs();
                }

                console.log('dashBoardRulesConfig', this.dashBoardRulesConfig);
            }
        });
        this.httpClient.get(SERVER + 'feedback/allFeedback').subscribe(response => {
            this.allFeedBack.next(response);
        });
    }

    setBuildVersion(data) {
        this.buildVersion = data;
    }
    getBuildVersion() {
        return this.buildVersion;
    }

    setAboutContent(data) {
        this.aboutContent = data;
    }
    getAboutContent() {
        this.httpClient.get(SERVER + 'about/getAboutContent').subscribe(response => {
            this.aboutContent.next(response);
        }, (err) => {
            console.log(err)
        });
        return this.aboutContent;
    }

    getTestBedData() {
        return this.testbedData;
    }

    setSettingsData(data) {
        this.settingsData.next(data);
    }
    getSettingsData() {
        return this.settingsData;
    }
    getTeams() {
        return this.allTeams;
    }

    setTeams(teams) {
        this.allTeams = teams;
    }

    getAllFeedback() {
        return this.allFeedBack;
    }

    getUsers() {
        return this.allUsers;
    }

    setUsers(users) {
        this.allUsers = users;
    }

    getErrorCodes() {
        return this.allErrorCodes;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    setBatchValue(data) {
        this.batchCount.next(data);
    }

    getBatchValue() {
        return this.batchCount;
    }

    setMenuList(data) {
        this.menuList.next(data);
    }

    getMenuList() {
        return this.menuList;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Reactive channel: emits whenever the User-TestBed Access Matrix is updated
     * (e.g. after a successful save in the Test Bed → User-TestBed Access Matrix screen).
     * Subscribers should re-run any testbed filtering that depends on it.
     * The emitted value is the new matrix map: { [username]: { username, teams: [...] } }
     */
    private userTestbedMatrixChanged = new Subject<any>();

    notifyUserTestbedAccessMatrixChanged(matrix: any): void {
        // Keep the cached settings blob in sync so subscribers that read
        // getSettingsData() see the fresh matrix immediately.
        const current: any = this.settingsData.getValue();
        if (current && typeof current === 'object') {
            current.userTestbedAccessMatrix = matrix;
            this.settingsData.next(current);
        }
        this.userTestbedMatrixChanged.next(matrix);
    }

    onUserTestbedAccessMatrixChanged(): Observable<any> {
        return this.userTestbedMatrixChanged.asObservable();
    }

    /**
     * Filter a testbed list by the User-TestBed Access Matrix for the given team.
     * The filter applies to every user (including 'sysadmin') so that changes made
     * in the User-TestBed Access Matrix screen take effect for the current user
     * immediately. Only testbeds whose `_id` appears in the current user's team
     * entry are retained:
     *   settings.userTestbedAccessMatrix[currentUser].teams[] (array of {teamName, testbedIds})
     * Legacy map shape ({ [teamName]: {...} }) is also accepted.
     * If no entry exists for the user/team, an empty list is returned.
     */
    filterTestbedsByAccessMatrix(testbeds: any[], settings: any, team: string): any[] {
        if (!Array.isArray(testbeds)) { return testbeds; }
        const user: any = this.currentUser;
        const username: string = user && user.username ? user.username : '';
        if (!username) { return testbeds; }
        const matrix = (settings && settings.userTestbedAccessMatrix) ? settings.userTestbedAccessMatrix : {};
        const entry = matrix ? matrix[username] : null;
        let teamEntry: any = null;
        if (entry && team) {
            if (Array.isArray(entry.teams)) {
                teamEntry = entry.teams.find((t: any) => t && t.teamName === team);
            } else if (entry.teams && typeof entry.teams === 'object') {
                teamEntry = entry.teams[team];
            }
        }
        const allowedIds: string[] = (teamEntry && Array.isArray(teamEntry.testbedIds)) ? teamEntry.testbedIds.map((id: any) => String(id)) : [];
        const allowedSet = new Set(allowedIds);
        return testbeds.filter((tb: any) => allowedSet.has(String(tb && tb._id)));
    }

    getAllData() {
        return this.httpClient.get(SERVER + 'user/settings');
    }

    getDeviceInventoryData() {
        return this.deviceInventoryData;
    }
    getAllVendors() {
        return this.allVendors;
    }

    getAllModels() {
        return this.allModels;
    }

    getAllDevices() {
        return this.allDevices;
    }

    getAllProfiles() {
        return this.allProfiles;
    }
    getSelectedTestbed() {
        return this.selectedTestbed;
    }
    getAPIData() {
        return this.APIInventoryData;
    }

    getAllAPI() {
        return this.api;
    }

    getAllAPIGroup() {
        console.log('API Group Data in getAllAPIGroup', this.apiGroup);
        return this.apiGroup;
    }

    getTcInventoryData() {
        return this.testCaseInventoryData;
    }

    getTCModules() {
        return this.allModules;
    }

    getTestSuites() {
        return this.allTestSuite;
    }

    getTestGroup() {
        return this.allTestGroup;
    }

    getTestCases() {
        return this.allTestCase;
    }

    getNodes() {
        return this.nodes;
    }
    getAllNodesDetails() {
        return this.allNodesDetails;
    }

    getvendorModelDetails() {
        return this.vendorModelDetails;
    }

    getModelVariables() {
        return this.modelVariables;
    }

    getyearWiseData() {
        return this.yearWiseData;
    }

    getAllYears() {
        return this.allYears;
    }
    getTestBed() {
        return this.testbed;
    }

    getTestbedVariables() {
        return this.variables;
    }
    getTestbedProfile() {
        return this.tbProfiles;
    }
    getRegressionData() {
        return this.regressionData;
    }

    downloadFile(link) {
        return this.httpClient.get(link);
    }

    getDeviceVariableGroup() {
        return this.variableGroups;
    }

    /** Store Sort Data */
    storeNodeSort(data) {
        this.nodeSortData = data;
    }

    getNodeSort() {
        return this.nodeSortData;
    }

    storeVariableSort(data) {
        this.variableSortData = data;
    }

    getVariableSort() {
        return this.variableSortData;
    }

    storeTestbedSort(data) {
        this.testbedSortData = data;
    }

    getTestbedSort() {
        return this.testbedSortData;
    }

    storeRegressionSort(data) {
        this.regressionSortData = data;
    }

    getRegressionSort() {
        return this.regressionSortData;
    }
    setSelectedTestbed(data) {
        this.selectedTestbed.next(data);
    }
    storeTeamSort(data) {
        this.teamSortData = data;
    }

    getTeamSort() {
        return this.teamSortData;
    }

    storeUserSort(data) {
        this.userSortData = data;
    }

    getUserSort() {
        return this.userSortData;
    }

    storeVendorSort(data) {
        this.vendorSortData = data;
    }

    getVendorSort() {
        return this.vendorSortData;
    }

    storeProfileSort(data) {
        this.profileSortData = data;
    }

    getProfileSort() {
        return this.profileSortData;
    }

    storeModelSort(data) {
        this.modelSortData = data;
    }

    getModelSort() {
        return this.modelSortData;
    }

    storeDeviceSort(data) {
        this.deviceSortData = data;
    }

    getDeviceSort() {
        return this.deviceSortData;
    }

    storeModuleSort(data) {
        this.moduleSortData = data;
    }

    getModuleSort() {
        return this.moduleSortData;
    }

    storeTestsuitSort(data) {
        this.testsuitSortData = data;
    }

    getTestsuitSort() {
        return this.testsuitSortData;
    }

    storeTestGroupSort(data) {
        this.testGroupSortData = data;
    }

    getTestGroupSort() {
        return this.testGroupSortData;
    }

    storeTestcaseSort(data) {
        this.testcaseSortData = data;
    }

    getTestcaseSort() {
        return this.testcaseSortData;
    }

    storeApiSort(data) {
        this.apiSortData = data;
    }

    getApiSort() {
        return this.apiSortData;
    }

    storeApiGroupSort(data) {
        this.apiGroupSortData = data;
    }

    getApiGroupSort() {
        return this.apiGroupSortData;
    }

    clearSortData() {
        this.nodeSortData = null;
        this.variableSortData = null;
        this.testbedSortData = null;
        this.regressionSortData = null;
        this.teamSortData = null;
        this.userSortData = null;
        this.vendorSortData = null;
        this.profileSortData = null;
        this.modelSortData = null;
        this.deviceSortData = null;
        this.apiSortData = null;
        this.apiGroupSortData = null;
        this.moduleSortData = null;
        this.testsuitSortData = null;
        this.testGroupSortData = null;
        this.testcaseSortData = null;
    }
    deleteActions() {
        let userListData = this.allUsers
        let userCurrent = this.currentUser.username;
        for (var i = 0; i < userListData.length; i++) {
            if (userListData[i].username === userCurrent) {
                if (userListData[i].role === 'admin' || userListData[i].role === 'lead') {
                    this.deleteValue = true;
                }
                else {
                    this.deleteValue = false;
                }
            }
        }
        return this.deleteValue;
    }

    getLabSetUp() {
        return this.allLabSetUp;
    }
    getDashBoardConfig() {
        return this.dashBoardConfig;
    }
    getTeamDashBoardConfig(team) {
        // First check if we have dashboard rules configs
        if (this.allDashboardRulesConfigs && this.allDashboardRulesConfigs.length > 0) {
            const teamConfig = this.allDashboardRulesConfigs.find(config =>
                config.teamName === team
            );
            return teamConfig || null;
        }

        // Fallback to old structure if new structure not available
        return _.find(this.dashBoardConfig[0]?.teams, { name: team });
    }
    getMultiDeleteRegData(team) {
        if (this.regressionConfig && this.regressionConfig.length > 0 && this.regressionConfig[0].teams) {
            return _.find(this.regressionConfig[0].teams, { name: team });
        }
        return null;
    }

    /**
     * Update dashboard rules configuration for a specific team
     */
    updateDashboardRulesForTeam(team: string) {
        if (this.allDashboardRulesConfigs && this.allDashboardRulesConfigs.length > 0) {
            const teamConfig = this.allDashboardRulesConfigs.find(config =>
                config.teamName === team
            );

            if (teamConfig) {
                this.dashBoardRulesConfig = teamConfig;
            } else {
                this.dashBoardRulesConfig = [];
            }
        } else {
            this.dashBoardRulesConfig = [];
        }

        this.updateDerivedConfigs();
    }

    /**
     * Update derived configurations based on current dashboard rules
     */
    updateDerivedConfigs() {
        if (this.dashBoardRulesConfig && this.dashBoardRulesConfig['DeviceTypeList']) {
            let tempDeviceTypeList = this.dashBoardRulesConfig['DeviceTypeList'].filter(data => {
                return data.Status === 'active';
            });
            this.deviceTypeList = tempDeviceTypeList.map(data => data.DeviceType);
            this.modelTypeList = tempDeviceTypeList.map(data => ({ deviceType: data.DeviceType, modelType: data.ModelType }));
            let tempArray = this.dashBoardRulesConfig['DeviceTypeList'].map(data => data.vendorArray);
            tempArray = _.flatten(tempArray);
            this.allDeviceTypeModels = tempArray.map(data => data.Vendor);
            this.allDeviceTypeModels = _.uniq(this.allDeviceTypeModels);
            this.allDeviceTypeModels = _.sortBy(this.allDeviceTypeModels);
        } else {
            this.deviceTypeList = [];
            this.modelTypeList = [];
            this.allDeviceTypeModels = [];
        }

        console.log('deviceTypeList service', this.deviceTypeList);
        console.log('allDeviceTypeModels service', this.allDeviceTypeModels);
        console.log('modelTypeList service', this.modelTypeList);
    }
}