import { EventData, Observable} from "data/observable";
import { ObservableArray } from "data/observable-array";
import pages = require("ui/page");
import { SelectedIndexChangedEventData } from "nativescript-drop-down";

let viewModel: Observable;

export function pageLoaded(args: EventData) {
    const page = args.object as pages.Page;
    const items = new ObservableArray();

    viewModel = new Observable();

    for (let loop = 0; loop < 200; loop++) {
        items.push("Item " + loop.toString());
    }

    viewModel.set("items", items);
    viewModel.set("hint", "My Hint");
    viewModel.set("selectedIndex", 15);    
    viewModel.set("cssClass", "default");

    setTimeout(() => viewModel.set("selectedIndex", null), 2000);

    page.bindingContext = viewModel;
}

export function dropDownOpened(args: EventData) {
    console.log("Drop Down opened");
}

export function dropDownSelectedIndexChanged(args: SelectedIndexChangedEventData) {
    console.log(`Drop Down selected index changed from ${args.oldIndex} to ${args.newIndex}`);
}

export function changeStyles() {
    viewModel.set("cssClass", "changed-styles");
}