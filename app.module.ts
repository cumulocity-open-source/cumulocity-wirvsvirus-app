import {NgModule} from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule as ngRouterModule} from '@angular/router';
import {CoreModule, BootstrapComponent, RouterModule} from '@c8y/ngx-components';
import {HospitalCapacityComponent} from './src/component/hospital-capacity.component';
import APIService from "./src/service/api.service";

@NgModule({
    imports: [
        BrowserAnimationsModule,
        RouterModule.forRoot(),
        ngRouterModule.forRoot(
            [{path: '', component: HospitalCapacityComponent}],
            {enableTracing: false, useHash: true}),
        CoreModule.forRoot()
    ],
    providers: [APIService],
    declarations: [HospitalCapacityComponent],
    bootstrap: [BootstrapComponent]
})
export class AppModule {
}
