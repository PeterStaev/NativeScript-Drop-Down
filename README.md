# NativeScript DropDown widget

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
* **itemsProperty** - *[Property](http://docs.nativescript.org/ApiReference/ui/core/dependency-observable/Property.html)*  
Represents the observable property backing the items property of each DropDown instance.

* **selectedIndexProperty** - *[Property](http://docs.nativescript.org/ApiReference/ui/core/dependency-observable/Property.html)*  
Represents the selected index property of each DropDown instance.

### Instance Properties
* **ios** - *[UITextField](https://developer.apple.com/library/prerelease/ios/documentation/UIKit/Reference/UITextField_Class/index.html)*  
Gets the native iOS view that represents the user interface for this component. Valid only when running on iOS.

* **android** - *[android.widget.Spinner](http://developer.android.com/reference/android/widget/Spinner.html)*  
Gets the native android widget that represents the user interface for this component. Valid only when running on Android OS.

* **items** - *Object*  
Gets or sets the items collection of the DropDown. The items property can be set to an array or an object defining length and getItem(index) method.

* **selectedIndex** - *Number*  
Gets or sets the selected index of the DropDown.

## Example
```XML
<!-- test-page.xml -->
<Page xmlns="http://www.nativescript.org/tns.xsd" loaded="pageLoaded" xmlns:dd="nativescript-drop-down">
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

export function pageLoaded(args: observable.EventData) 
{
    var page = <pages.Page>args.object;
    var items = new observableArray.ObservableArray();

    viewModel = new observable.Observable();

    for (var loop = 0; loop < 20; loop++)
    {
        items.push("Item " + loop.toString());
    }

    viewModel.set("items", items);
    viewModel.set("selectedIndex", 15);

    page.bindingContext = viewModel;
}
```
