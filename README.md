# NativeScript DropDown widget 
[![Build Status](https://travis-ci.org/PeterStaev/NativeScript-Drop-Down.svg?branch=master)](https://travis-ci.org/PeterStaev/NativeScript-Drop-Down)
[![npm downloads](https://img.shields.io/npm/dm/nativescript-drop-down.svg?maxAge=2592000)](https://www.npmjs.com/package/nativescript-drop-down)
[![npm](https://img.shields.io/npm/v/nativescript-drop-down.svg?maxAge=2592000)](https://www.npmjs.com/package/nativescript-drop-down)

A NativeScript DropDown widget. The DropDown displays items from which the user can select one. For iOS it wraps up a [UITextField](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UITextField_Class/index.html) with an `inputView` set to an [UIPickerView](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UIPickerView_Class/index.html) which displays the items. For Android it wraps up the [Spinner](http://developer.android.com/reference/android/widget/Spinner.html) widget.

## Screenshot
![Screenshot of iOS and Android](https://raw.githubusercontent.com/PeterStaev/NativeScript-Drop-Down/master/docs/screenshot.png)

## Installation
Run the following command from the root of your project:

`tns plugin add nativescript-drop-down`

This command automatically installs the necessary files, as well as stores nativescript-drop-down as a dependency in your project's package.json file.

## Usage
You need to add `xmlns:dd="nativescript-drop-down"` to your page tag, and then simply use `<dd:DropDown/>` in order to add the widget to your page.

## API

### Static Properties
* **itemsProperty** - *[Property](http://docs.nativescript.org/api-reference/classes/_ui_core_dependency_observable_.property.html)*  
Represents the observable property backing the items property of each DropDown instance.

* **selectedIndexProperty** - *[Property](http://docs.nativescript.org/api-reference/classes/_ui_core_dependency_observable_.property.html)*  
Represents the observable property backing the selectedIndex property of each DropDown instance.

* **hintProperty** - *[Property](http://docs.nativescript.org/api-reference/classes/_ui_core_dependency_observable_.property.html)*  
Represents the observable property backing the hint property of each DropDown instance.

### Instance Properties
* **ios** - *[UITextField](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UITextField_Class/index.html)*  
Gets the native iOS view that represents the user interface for this component. Valid only when running on iOS.

* **android** - *[android.widget.Spinner](http://developer.android.com/reference/android/widget/Spinner.html)*  
Gets the native android widget that represents the user interface for this component. Valid only when running on Android OS.

* **items** - *Object*  
Gets or sets the items collection of the DropDown. The items property can be set to an array or an object defining length and getItem(index) method.

* **selectedIndex** - *Number*  
Gets or sets the selected index of the DropDown.

* **hint** - *String*  
Gets or sets the hint for the DropDown.

* **accessoryViewVisible** - *boolean* (Default: true)  
Gets/sets whether there will be an accessory view (toolbar with Done button) under iOS. Valid only when running on iOS.

### Methods 
* **open(): void**  
Opens the drop down. 

## Example
```XML
<!-- test-page.xml -->
<Page xmlns="http://schemas.nativescript.org/tns.xsd" loaded="pageLoaded" xmlns:dd="nativescript-drop-down">
  <GridLayout rows="auto, auto, *" columns="auto, *">
    <dd:DropDown items="{{ items }}" selectedIndex="{{ selectedIndex }}" row="0" colSpan="2" />
    <Label text="Selected Index:" row="1" col="0" fontSize="18" verticalAlignment="bottom"/>
    <TextField text="{{ selectedIndex }}" row="1" col="1" />
  </GridLayout>
</Page>
```

```TypeScript
// test-page.ts
import observable = require("data/observable");
import observableArray = require("data/observable-array");
import pages = require("ui/page");

var viewModel: observable.Observable;

export function pageLoaded(args: observable.EventData) {
    var page = <pages.Page>args.object;
    var items = new observableArray.ObservableArray();

    viewModel = new observable.Observable();

    for (var loop = 0; loop < 20; loop++) {
        items.push("Item " + loop.toString());
    }

    viewModel.set("items", items);
    viewModel.set("selectedIndex", 15);

    page.bindingContext = viewModel;
}
```

## Angular 2 Example

```TypeScript
// main.ts
import {nativeScriptBootstrap} from "nativescript-angular/application";
import {AppComponent} from "./app.component";
import {registerElement} from "nativescript-angular/element-registry";
registerElement("DropDown", () => require("nativescript-drop-down/drop-down").DropDown);
nativeScriptBootstrap(AppComponent);
```

```HTML
<!-- app.component.html -->
<StackLayout>
    <GridLayout rows="auto, auto, *" columns="auto, *">
        <DropDown #dd backroundColor="red" [items]="items" [selectedIndex]="selectedIndex" (selectedIndexChange)="onchange(dd.selectedIndex)" row="0" colSpan="2"></DropDown>
        <Label text="Selected Index:" row="1" col="0" fontSize="18" verticalAlignment="bottom"></Label>
        <TextField [text]="selected" row="1" col="1" ></TextField>
    </GridLayout>
</StackLayout>
```

```TypeScript
// app.component.ts
import {Component, OnInit, OnChanges} from "@angular/core";
import {ObservableArray} from "data/observable-array";

@Component({
    selector: "my-app",
    templateUrl:"app.component.html",
})
export class AppComponent {
    public selectedIndex = 1;
    public items: Array<string>;
 
    constructor() {
        this.items = [];
        for (var i = 0; i < 5; i++) {
            this.items.push("data item " + i);
        }
    }

    public onchange(selectedi){
        console.log("selected index " + selectedi);
    }
}
```

## Working with value and display members
It is a common case that you want to have one thing displayed in the drop down and then get some backend value
tied to the tex. For example drop down with states you might want tos how the full state name (i.e. Florida)
and then when working with your backend you want to use the state code (i.e. FL). The Drop Down items property can be
set to either Array of objects or a custom object that implements `getItem(index: number): any` function and `length` proerty. 
So you can achieve this by implementing the following helper class:

```TypeScript
export interface IValueItem {
    ValueMember: any
    DisplayMember: any
}

export class ValueList {
    private _array: Array<IValueItem>;

    get length(): number { return this._array.length; }

    constructor(array: Array<IValueItem>) {
        this._array = array;
    }

    public getItem(index: number) { // Used for items source in list picker
        return this.getText(index);
    }

    public getText(index: number): string {
        if (index < 0 || index >= this._array.length) {
            return "";
        }

        return this._array[index].DisplayMember;
    }

    public getValue(index: number) {
        if (index < 0 || index >= this._array.length) {
            return null;
        }

        return this._array[index].ValueMember;
    }

    public getIndex(value: any): number {
        let loop: number;

        for (loop = 0; loop < this._array.length; loop++) {
            if (this.getValue(loop) == value) {
                return loop;
            }
        }

        return -1;
    }
}
```

Then you can set the `items` property of the DropDownto an instance of ValueList:
```TypeScript
let dd = page.getViewById<DropDown>("dd");
let itemSource = new ValueList([{ ValueMember: "FL", DisplayMember:"Florida" }, { ValueMember: "MI", DisplayMember:"Michigan" }]);
dd.items = itemSource;
```

This enables you to do things like:
1.If you want to select an item in the DropDown by its backend value (for example FL), you can do this with:
```TypeScript
dd.selectedIndex = itemSource.getIndex("FL");
```
2.You can get the backend value of what the user selected using:
```TypeScript
let selectedValue = itemSource.getValue(dd.selectedIndex);
```
