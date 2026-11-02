import { Component } from '@angular/core';
import { DataService } from 'src/app/@core/services/data.service';


@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.component.html',
    styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent  {
    public aboutContent;
    public aboutContact;
    breadcrumbs= [
        {
            link: '#/pages/dashboard',
            label: 'Dashboard'
        },
        {
            link: '/pages/about-us',
            label: 'About Us'
        }
    ]
    constructor(private dataService: DataService){

    }

    ngOnInit(): void{
        this.dataService.getAboutContent().subscribe(about => {
            if (about) {
                var a = JSON.parse(about.content)
                this.aboutContact = a.contact;
                this.aboutContent = a.content
            } else {
                console.log('inside else');
            }
          });
    }
}