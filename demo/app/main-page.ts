import { EventData, Observable} from "data/observable";
import { ObservableArray } from "data/observable-array";
import pages = require("ui/page");
import { SelectedIndexChangedEventData } from "nativescript-drop-down";

var viewModel: Observable;

export function pageLoaded(args: EventData) {
    var page = <pages.Page>args.object;
    var items = new ObservableArray();

    viewModel = new Observable();

    for (var loop = 0; loop < 200; loop++) {
        items.push("Item " + loop.toString());
    }

    viewModel.set("items", items);
    viewModel.set("hint", "My Hint");
    viewModel.set("selectedIndex", null);    
    viewModel.set("cssClass", "empty");

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