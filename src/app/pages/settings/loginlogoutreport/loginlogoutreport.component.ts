import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';
import { LoginService } from 'src/app/@core/services/login.service';
import { UserService } from 'src/app/@core/services/user.service';
import * as _ from 'lodash';
import { formatDate } from '@angular/common';
import { ToolTipDisplayComponent } from 'src/app/@shared/components/tooltip-component/tooltip.component';
import { Cell, LocalDataSource } from 'angular2-smart-table';

@Component({
  selector: 'app-loginlogoutreport',
  templateUrl: './loginlogoutreport.component.html',
  styleUrls: ['./loginlogoutreport.component.scss']
})
export class LoginlogoutreportComponent implements OnInit {
  sub1:any;
  selectTeam: any;
  echartsExtentions: any[];
  echartsOptions: object = {};
  allData: any;
  allUsers: any = [];
  datainhr: any = [];
  monthlyhr: any =[];
  echartsOptionsMonth: object = {};
  allUsersformonth: any = [];
  minDate = new Date(2000, 0, 1);
  maxDate = new Date();
  startDate: any;
  endDate: any;
  teamlist: any = [];
  currentTeam: any;
  currentUserName: any;
  loading: boolean = false;
  loading1: boolean = false;
  dateRangeArray = [{label: '1W', value: 'This Week', attr: '0'},
   {label: 'L1W', value: 'Last Week', attr: '1'},
  {label: 'L2W', value: 'Last 2 Weeks', attr: '2'}, {label: 'L3W', value: 'Last 3 Weeks', attr: '3'},
  {label: 'L4W', value: 'Last 4 Weeks', attr: '4'}, {label: '1M', value: 'This Month', attr: '0'},
  {label: 'L1M', value: 'Last Month', attr: '1'}, {label: 'L2M', value: 'Last 2 Months', attr: '2'},
  {label: 'L3M', value: 'Last 3 Months', attr: '3'}, {label: 'L4M', value: 'Last 4 Months', attr: '4'},
  {label: 'L6M', value: 'Last 6 Months', attr: '6'}, {label: 'L12M', value: 'Last 12 Months', attr: '12'},
  {label: 'Q1', value: 'Q1', attr: '1'}, {label: 'Q2', value: 'Q2', attr: '2'},
  {label: 'Q3', value: 'Q3', attr: '3'}, {label: 'Q4', value: 'Q4', attr: '4'}];
  selectedDateRange: any;
  days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  startDate1: any;
  endDate1: any;
  currentWeekStartDt: any;
  currentWeekEndDt: any;
  first: any;
  last: any;
  filteredRegressions: any;
  today = new Date();
  noData = false;
  weeklyData = {};
  xLabelName = 'X Label Name';
  selectedModel: any;
  allModels: any = [];
  formattedData: any = [];
  filteredData: any = [];
  selectedDateRangeTxt: any;
  showNoDataTxt = false;
  eChartOption: any;
  public settings = {
    attr: {
        class: 'text-left'
    },
    noDataMessage: 'No Users Found',
    pager: {
        perPage: 10
    },
    mode: 'external',
    actions: {
      add: false,
      delete:false,
      edit: false
  },
    columns: {
      username: {
        title: 'User Name',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 60);
        },
        valuePrepareFunction: data => {
            return data;
        },
        compareFunction: (direction: any, temp1: any, temp2: any) => {
          var a = temp1;
          var b = temp2;
          if (a.toLowerCase().localeCompare(b.toLowerCase()) < 0) {
            return -1 * direction;
          }
          if (a.toLowerCase().localeCompare(b.toLowerCase()) > 0) {
            return direction;
          }
          return 0;
        }
      },
      email: {
        title: 'E-mail',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell,100);
        },
      },
      role: {
        title: 'Role',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 50);
        },
        valuePrepareFunction: data => {
          return data.charAt(0).toUpperCase() + data.slice(1);
        }
      },
      lastloginteam: {
        title: 'Last Login Team',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 50);
        },
      },
      lastlogintime:{
        title: 'Last Login',
        type: 'custom',
        width: '250px',
        class: 'text-center',
        renderComponent: ToolTipDisplayComponent,
        componentInitFunction: (instance: ToolTipDisplayComponent, cell: Cell) => {
          ToolTipDisplayComponent.componentInit(instance, cell, 50);
        },
        valuePrepareFunction: data => {
          return data;
        },
      },
    }
  };
  source: LocalDataSource = new LocalDataSource();
  constructor(private loginService: LoginService, private dataService: DataService, private userService: UserService) {
    this.loading = true;
    //this.selectedDateRange = this.dateRangeArray[0].label;
    //this.selectedDateRangeTxt = this.dateRangeArray[0].value;
    this.first = this.today.getDate() - this.today.getDay(); // First day of the week
    this.last = this.first + 6; // last day of the week
    
    this.currentWeekStartDt = this.getStartOfWeek(new Date());//new Date(this.today.setDate(this.first + 1));
    this.currentWeekEndDt = this.getEndOfWeek(new Date());//new Date(this.today.setDate(this.last + 1));
    //this.startDate1 = this.currentWeekStartDt;
    //this.endDate1 = this.currentWeekEndDt;
    this.sub1 = this.dataService.selectedTeam.subscribe(team => {
      if (team) {
        this.currentTeam = team;
      }
    });

    this.currentUserName = this.dataService.getCurrentUser();

    this.sub1 = this.userService.getAllusers().subscribe(settings => {
      if (settings) {
        this.teamlist = settings[0].teams;
        this.dataService.getSettingsData().next(settings[0]);
      }
    },
    error => {
      // console.log(error);
    });

    this.getcurrentLoginUserData();

    this.getalluserslastlogin();
    this.settings = Object.assign({}, this.settings);
    this.echartsExtentions = [];
    /*this.eChartOption = {
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: [820, 932, 901, 934, 1290, 1430, 1550, 1200, 1650.1450, 1680.1890],
        type: 'line',
        areaStyle: {}
      }]
    }*/
   }

  lastloginData: any = {};
  ngOnInit(): void {
    this.loginService.userloginlast({username:this.currentUserName.username}).subscribe((data:any)=>{
      this.lastloginData = data;
    }, err=>{
      //console.log(err);
    })
    this.onDateRangeSelected({value: "1W"})

  }

  getcurrentLoginUserData(){
    this.loading = true;
    this.allData = [];
    this.loginService.getloginloutdata(this.selectTeam).subscribe((data:any)=>{
      this.allData = data;
      this.loading = false;
      /*if(data.showusergraph && data.showusergraph.length > 0){
        for (let i = 0; i < data.showusergraph.length; i++) {
          if(data.showusergraph[i].dailytolalhr > 0){
            this.allUsers.push(data.showusergraph[i].username);
            this.datainhr.push(data.showusergraph[i].dailytolalhr);
          }
          this.allUsersformonth.push(data.showusergraph[i].username);
          this.monthlyhr.push(data.showusergraph[i].monthlytotalhr);
        }
      }*/

      //this.drowGaph();
    }, err=>{
      this.loading = false;
    })
  }

  drowGaph(){
      const colorsList = ["#24a148", '#fa4d56', "#f1c21b"]
      this.echartsOptions = {
        color: colorsList[0],
        tooltip: {
            trigger: "axis",
            axisPointer: {
            type: "shadow"
            }
        },
        grid: {
            left: "3%",
            right: "4%",
            bottom: "8%",
            top: "13%",
            containLabel: true
        },
        xAxis: {
             type: "value"
        },
        yAxis: {
            type: "category",
            data: this.allUsers,
            axisLabel: {
            interval: 0,
            rotate: 15
            }
        },
        
        legend: {
            data: ["Hr"], //, "behrooz"
            bottom: 0,
            itemGap: 5,
        },
        series: [
        {
            name: "Hr",
            type: "bar",
            data: this.datainhr,
        },
        /*{
            name: "behrooz",
            type: "bar",
            data: [1, 17, 12, 11, 40, 3, 21]
        }*/
        ]
      };
  
      this.echartsOptionsMonth = {
        color: colorsList[2],
        tooltip: {
            trigger: "axis",
            axisPointer: {
            type: "shadow"
            }
        },
        grid: {
            left: "3%",
            right: "4%",
            bottom: "8%",
            top: "13%",
            containLabel: true
        },
        xAxis: {
             type: "value"
        },
        yAxis: {
          type: "category",
          data: this.allUsersformonth,
          axisLabel: {
            interval: 0,
            rotate: 15
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
        legend: {
            data: ["Hr"], //, "behrooz"
            bottom: 0,
            itemGap: 5,
        },
        series: [
        {
            name: "Hr",
            type: "bar",
            data: this.monthlyhr
        },
        /*{
            name: "behrooz",
            type: "bar",
            data: [1, 17, 12, 11, 40, 3, 21]
        }*/
        ]
      };
   
  }
  
  onChartInit(event){
    //console.log(event);
  }

  err:boolean = false;
  showErr:any;
  userfordaterange: any = [];
  hrfordaterange: any = [];
  lineChartOptions: any;
  getDataByDateRange(startDate, endDate){
    this.startDate1 = '';
    this.endDate1 = '';
    this.err = false;
    this.showErr = '';
    if (formatDate(this.startDate,'yyyy-MM-dd','en_US') > formatDate(this.endDate,'yyyy-MM-dd','en_US')) {
      this.err = true;
      this.showErr = "From Date should be greater than End Date";
    } else {
      this.loading1 = true;
      endDate.setHours(endDate.getHours() + 23);
      endDate.setMinutes(endDate.getMinutes() + 59);
      endDate.setSeconds(endDate.getSeconds() + 59);
      this.userfordaterange = [];
      this.hrfordaterange = [];
      this.err = false;
      this.showErr = '';
      this.loginService.getDataByDateRange({team:this.selectTeam, fromDate: startDate.toISOString(), toDate: endDate.toISOString()}).subscribe((data1:any)=>{
        if(data1.showuseronslectionofDate && data1.showuseronslectionofDate.length > 0){
          for (let i = 0; i < data1.showuseronslectionofDate.length; i++) {
            if(data1.showuseronslectionofDate[i].dailytolalhr > 0){
              this.userfordaterange.push(data1.showuseronslectionofDate[i].username + ' - ' + data1.showuseronslectionofDate[i].logincountdaterange);
              this.hrfordaterange.push({value:data1.showuseronslectionofDate[i].dailytolalhr, itemStyle:{color: this.getRandomColor()} });
            }
          }
        }
        if ( data1.userData){
          this.setLineChartData(data1);
        }
        this.drowDateTimeRange()
      }, err=>{
        this.loading1 = false;
      })
    }
  }

  echartsOptionsForDateRange: any;
  drowDateTimeRange(){
    this.echartsOptionsForDateRange = {
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "8%",
        top: "13%",
        containLabel: true
      },
      xAxis: {
           type: "value"
      },
      yAxis: {
        type: "category",
        data: this.userfordaterange,
        axisLabel: {
          interval: 0,
          rotate: 15
        }
      },
      legend: {
        data: ["Hr"], //, "behrooz"
        bottom: 0,
        itemGap: 5,
      },
      series: [
      {
        name: "Hr",
        type: "bar",
        data: this.hrfordaterange
      },
      /*{
          name: "behrooz",
          type: "bar",
          data: [1, 17, 12, 11, 40, 3, 21]
      }*/
      ]
    };
    this.loading1 = false;
  }

  setLineChartData(res): any{
    const seriesarr = [res.userData].map((userdt) => {
      return Object.keys(userdt).map((key) => {
        return {
          name: key,
          type: 'line',
          data: Object.values(userdt[key]),
        };
      });
    })[0];
    const user = [res.userData].map((usr) => {
      return Object.keys(usr);
    })[0];
    this.lineChartOptions = {
      tooltip: {},
      legend: {
        data: user,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },

      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: {
        type: 'category',
        axisLabel: {
          interval: res.datearr.length <= 30 ? 0 : 2,
          rotate: 20,
        },
        boundaryGap: false,
        data: res.datearr,
      },
      yAxis: {
        type: 'value',
      },
      series: seriesarr,
    };
  }

  getRandomColor() {
    var color = Math.floor(0x1000000 * Math.random()).toString(16);
    return '#' + ('000000' + color).slice(-6);
  }

  close(){
    this.selectTeam = '';
  }

  setDateRangeForWeeks(sDtRange: any): void {
    if (sDtRange.attr === '0') {
      this.startDate1 = this.currentWeekStartDt;
      this.endDate1 = this.currentWeekEndDt;
    } else {
      const NoOfDays = 7 * sDtRange.attr;
      this.startDate1 = new Date(this.currentWeekStartDt - NoOfDays * 24 * 60 * 60 * 1000);
      this.endDate1 = new Date(this.currentWeekEndDt - 7 * 24 * 60 * 60 * 1000);
    }
  }

  setDateRangeForMonths(sDtRange: any): void {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const dt = new Date();
    if (sDtRange.attr === '0'){
      this.startDate1 = firstDayOfMonth;
      this.endDate1 = dt;
    } else {
      firstDayOfMonth.setMonth(firstDayOfMonth.getMonth() - parseInt(sDtRange.attr, 0));
      this.startDate1 = firstDayOfMonth;
      this.endDate1 = new Date(new Date().getFullYear(), new Date().getMonth(), 0);
    }
  }

  onDateRangeSelected(event: any): void {
    this.err = false;
    this.startDate = '';
    this.endDate = '';
    const sDtRange = this.dateRangeArray.filter(ele => {
        return ele.label === event.value;
    });
    this.selectedDateRange = sDtRange[0].label;
    this.selectedDateRangeTxt = sDtRange[0].value;
    const selectedDays: string = sDtRange[0].value;
    if (selectedDays.includes('Week')){
      this.setDateRangeForWeeks(sDtRange[0]);
    } else if (selectedDays.includes('Month')) {
      this.setDateRangeForMonths(sDtRange[0]);
    } else if (selectedDays.includes('Q1')) {
      this.startDate1 = new Date(new Date().getFullYear(), 0, 1);
      this.endDate1 = new Date(new Date().getFullYear(), 3, 0);
    } else if (selectedDays.includes('Q2')) {
      this.startDate1 = new Date(new Date().getFullYear(), 3, 1);
      this.endDate1 = new Date(new Date().getFullYear(), 6, 0);
    } else if (selectedDays.includes('Q3')) {
      this.startDate1 = new Date(new Date().getFullYear(), 6, 1);
      this.endDate1 = new Date(new Date().getFullYear(), 9, 0);
    } else if (selectedDays.includes('Q4')) {
      this.startDate1 = new Date(new Date().getFullYear(), 9, 1);
      this.endDate1 = new Date(new Date().getFullYear(), 12, 0);
    }

    if (formatDate(this.endDate1, 'yyyy-MM-dd','en_US') > formatDate(new Date(), 'yyyy-MM-dd','en_US')) {
      this.endDate1 = new Date();
    }
    //this.filterBasedOnModel();
    this.startDate1.setHours(0);
    this.startDate1.setMinutes(0);
    this.startDate1.setSeconds(0);
    this.endDate1.setHours(0);
    this.endDate1.setMinutes(0);
    this.endDate1.setSeconds(0);
    this.getDataByDateRange(this.startDate = this.startDate1,this.endDate = this.endDate1)
  }

  getalluserslastlogin(){
    this.loginService.getalluserslastlogin().subscribe((data:any)=>{
      data.forEach(el=>{
        if(el.loginlogout && el.loginlogout.logintime){
          el['lastloginteam']= el.loginlogout.team;
          el['lastlogintime']= formatDate(el.loginlogout.logintime, 'yyyy-MM-dd hh:mm a','en_US') //new Date();
        }
      })
      this.source.load(data);
    }, err=>{
      //console.log(err);
    })
  }

  getStartOfWeek(date): void {
    date.setHours(0, 0, 0, 0);
    date.setDate((date.getDate() - date.getDay()) + 1);
    return date;
  }
  
  getEndOfWeek(date): void {
    date = this.getStartOfWeek(date);
    date.setDate(date.getDate() + 6);
    return date;
  }

}
