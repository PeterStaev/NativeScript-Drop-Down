import observable = require("data/observable");
import observableArray = require("data/observable-array");
import pages = require("ui/page");

var viewModel: observable.Observable;

export function pageLoaded(args: observable.EventData) {
    var page = <pages.Page>args.object;
    var items = new observableArray.ObservableArray();

    viewModel = new observable.Observable();

    for (var loop = 0; loop < 200; loop++) {
        items.push("Item " + loop.toString());
    }

    viewModel.set("items", items);
    viewModel.set("hint", "My Hint");
    viewModel.set("selectedIndex", 15);

    page.bindingContext = viewModel;
}