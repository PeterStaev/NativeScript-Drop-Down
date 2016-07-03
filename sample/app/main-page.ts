import observable = require("data/observable");
import observableArray = require("data/observable-array");
import pages = require("ui/page");
import { DropDown } from "nativescript-drop-down";

var viewModel: observable.Observable;

export function pageLoaded(args: observable.EventData) {
    var page = <pages.Page>args.object;
    var items = new observableArray.ObservableArray();
    var dd = page.getViewById<DropDown>("dd");

    viewModel = new observable.Observable();

    for (var loop = 0; loop < 20; loop++) {
        items.push("Item " + loop.toString());
    }

    viewModel.set("items", items);
    viewModel.set("selectedIndex", 15);

    page.bindingContext = viewModel;

    // Open the DropDown after 6 secs
    setTimeout(() => dd.open(), 6000);
}