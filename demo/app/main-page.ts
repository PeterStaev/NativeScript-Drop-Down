import { EventData, Observable } from "data/observable";
import * as pages from "ui/page";

import { DropDown, SelectedIndexChangedEventData, ValueList } from "nativescript-drop-down";

let viewModel: Observable;
let dd: DropDown;

export function pageLoaded(args: EventData) {
    const page = args.object as pages.Page;
    const items = new ValueList<string>();

    dd = page.getViewById<DropDown>("dd");

    viewModel = new Observable();

    viewModel.set("items", items);
    viewModel.set("hint", "My Hint");
    viewModel.set("selectedIndex", null);    
    viewModel.set("isEnabled", true);    
    viewModel.set("cssClass", "default");

    page.bindingContext = viewModel;

    for (let loop = 0; loop < 200; loop++) {
        items.push({ value: `I${loop}`, display: `Item ${loop}`});
    }
}

export function dropDownOpened(args: EventData) {
    console.log("Drop Down opened");
}

export function dropDownClosed(args: EventData) {
    console.log("Drop Down closed");
}

export function dropDownSelectedIndexChanged(args: SelectedIndexChangedEventData) {
    console.log(`Drop Down selected index changed from ${args.oldIndex} to ${args.newIndex}. New value is '${viewModel.get("items").getValue(args.newIndex)}'`);
}

export function changeStyles() {
    viewModel.set("cssClass", "changed-styles");
}

export function open() {
    dd.open();
}

export function close() {
    dd.close();
}