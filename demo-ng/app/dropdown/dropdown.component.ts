import { Component, OnInit } from "@angular/core";
import { SelectedIndexChangedEventData, ValueList } from "nativescript-drop-down";

@Component({
    selector: "dropdown-demo",
    moduleId: module.id,
    templateUrl: "./dropdown.component.html",
})
export class DropDownComponent implements OnInit {
    public selectedIndex: number = null;
    public hint                  = "My Hint";
    public items: ValueList<string>;
    public cssClass: string      = "default";

    public ngOnInit() {
        this.items = new ValueList<string>();
        for ( let loop = 0; loop < 200; loop++ ) {
            this.items.push({
                value:   `I${loop}`,
                display: `Item ${loop}`,
            });
        }
    }

    public onchange(args: SelectedIndexChangedEventData) {
        console.log(`Drop Down selected index changed from ${args.oldIndex} to ${args.newIndex}. New value is "${this.items.getValue(
            args.newIndex)}"`);
    }

    public onopen() {
        console.log("Drop Down opened.");
    }

    public changeStyles() {
        this.cssClass = "changed-styles";
    }
}
