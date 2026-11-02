import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { ActivatedRoute } from '@angular/router';

@Injectable()
export class SideBarService {
    //  public menuList;
    constructor(private dataService: DataService) {
        //  this.menuList = this.dataService.getMenuList().value;
    }
    public addActiveClass(menu, subChained?): void {
        this.removeActiveClass();
        this.dataService.menuList.subscribe((menuList) => {
            menuList.forEach((e, i) => {
                if (e.title === menu.title) {
                    menuList[i].active = true;
                    if (e.children && !subChained) {
                        e.children.forEach((d, ind) => {
                            if (d.children) {
                                menuList[i].children[ind].active = false;
                                return;
                            }
                        });
                        return;
                    } else if (e.children) {
                        e.children.forEach((d, ind) => {
                            if (d.children) {
                                menuList[i].active = true;
                                menuList[i].children[ind].active = true;
                                return;
                            }
                        });
                    }
                }
            });
        });
    }

    public removeActiveClass(): void {
        this.dataService.menuList.subscribe((menuList) => {
            menuList.forEach((e, i) => {
                menuList[i].active = false;
                if (e.children) {
                    e.children.forEach((d, ind) => {
                        menuList[i].active = false;
                        menuList[i].children[ind].active = false;
                        if (d.children) {
                            d.children.forEach((k, ind1) => {
                                k.active = false;
                            });
                        }
                    });
                }
            });
        });
    }

    public removeActiveClassOnLoad(): void {
        this.dataService.menuList.subscribe((menuList) => {
            menuList.forEach((e, i) => {
                if (!e.home) {
                    menuList[i].active = false;
                    if (e.children) {
                        e.children.forEach((d, ind) => {
                            menuList[i].active = false;
                            menuList[i].children[ind].active = false;
                            if (d.children) {
                                d.children.forEach((k, ind1) => {
                                    k.active = false;
                                });
                            }
                        });
                    }
                }
            });
        });
    }

    public onTabChange(title, routeUrl): void {
        this.removeActiveClass();
        this.dataService.menuList.subscribe((menuList) => {
            menuList.forEach((e, i) => {
                if (e.title === title) {
                    if (e.hasTabs && e.tabs.includes(routeUrl)) {
                        menuList[i].active = true;
                        return;
                    }
                } else if (e.children) {
                    e.children.forEach((d, ind) => {
                        if (d.title === title && d.hasTabs && d.tabs.includes(routeUrl)) {
                            menuList[i].active = true;
                            menuList[i].children[ind].active = true;
                            return;
                        } else if (d.children) {
                            d.children.forEach((k, ind1) => {
                                if (k && k.title === title && k.hasTabs && k.tabs.includes(routeUrl)) {
                                    menuList[i].active = true;
                                    menuList[i].children[ind].active = true;
                                    menuList[i].children[ind].children[ind1].active = true;
                                    k.active = true;
                                    return;
                                }
                            });
                        }
                    });
                }
            });
        });
    }
}
