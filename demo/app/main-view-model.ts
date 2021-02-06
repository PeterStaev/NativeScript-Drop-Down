import { EventData, Observable, ObservableArray } from '@nativescript/core';
import { SelectedIndexChangedEventData } from "nativescript-drop-down";

export class HelloWorldModel extends Observable {
    public items = new ObservableArray();
    public selectedIndex;

    constructor() {
        super();

        for (var loop = 0; loop < 20; loop++) {
          this.items.push("Item " + loop.toString());
        }
    }

    dropDownOpened(args: EventData) {
      console.log("Drop Down opened");
    }

    dropDownClosed(args: EventData) {
      console.log("Drop Down closed");
    }

    dropDownSelectedIndexChanged(args: SelectedIndexChangedEventData) {
      console.log(`Drop Down selected index changed from ${args.oldIndex} to ${args.newIndex}`);
    }
}
