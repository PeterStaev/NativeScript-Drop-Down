import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { AppRoutingModule } from "./app.routing";
import { AppComponent } from "./app.component";

import { DropDownComponent } from "./dropdown/dropdown.component";
import { DropDownModule } from 'nativescript-drop-down/angular';

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        DropDownModule,
        AppRoutingModule
    ],
    declarations: [
        AppComponent,
        DropDownComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AppModule { }
