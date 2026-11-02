import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router, NavigationEnd, PRIMARY_OUTLET,  ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Component({
    selector: 'app-title-display',
    templateUrl: './title.component.html',
    styleUrls: ['./title.component.scss']
})
export class TitleDisplayComponent {
   
  @Input() public breadcrumbs = [];
  @Input() public titleName = null;
  show: boolean = false;

}


//   ngOnInit() {
//     this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
//       let root: ActivatedRoute = this.route.root;
//       console.log(root)
//       this.breadcrumbs = this.getBreadcrumbs(root);
//     // this.breadcrumbs = [...this.breadcrumbs];
//     // console.log(this.breadcrumbs)

//     });

//   }


//   private getBreadcrumbs(route: ActivatedRoute, url: string = "", breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
//     const ROUTE_DATA_BREADCRUMB: string = "breadcrumb";
//     let children: ActivatedRoute[] = route.children;
//     console.log(children)
//     return []
    // if (children.length === 0) {
    //   return breadcrumbs;
    // }
    // for (let child of children) {
    //   //verify primary route
    //   if (child.outlet !== PRIMARY_OUTLET || child.snapshot.url.length==0) {
    //     continue;
    //   }

    //   //verify the custom data property "breadcrumb" is specified on the route
    //   if (!child.snapshot.data.hasOwnProperty(ROUTE_DATA_BREADCRUMB)) {
    //     return this.getBreadcrumbs(child, url, breadcrumbs);
    //   }

    //   //get the route's URL segment
    //   let routeURL: string = child.snapshot.url.map(segment => segment.path).join("/");

    //   //append route URL to URL
    //   url += `/${routeURL}`;

    //   //add breadcrumb
    //   let breadcrumb: Breadcrumb = {
    //     label: child.snapshot.data[ROUTE_DATA_BREADCRUMB],
    //     url: url
    //   };
    //   breadcrumbs.push(breadcrumb);

    //   //recursive
    //   return this.getBreadcrumbs(child, url, breadcrumbs);
    // }
    // return breadcrumbs;
//   }



// }


// export interface Breadcrumb{
//     label: string;
//       url: string;
//   }