/*! *****************************************************************************
Copyright (c) 2015 Tangra Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
***************************************************************************** */

import textField = require("ui/text-field");
import listPicker = require("ui/list-picker");
import dependencyObservable = require("ui/core/dependency-observable");
import observable = require("data/observable");
import common = require("./drop-down-common");
import style = require("ui/styling/style");
import utils = require("utils/utils");

global.moduleMerge(common, exports);

const TOOLBAR_HEIGHT = 44;

export class DropDown extends common.DropDown
{
    private _textField: textField.TextField;
    private _listPicker: listPicker.ListPicker;
    private _toolbar: UIToolbar;
    private _flexToolbarSpace: UIBarButtonItem;
    private _doneButton: UIBarButtonItem;
    private _doneTapDelegate: TapHandler;
    private _accessoryViewVisible: boolean;

    constructor()
    {
        super();

        let applicationFrame = UIScreen.mainScreen().applicationFrame;

        this._textField = new textField.TextField();
        this._listPicker = new listPicker.ListPicker();

        this._flexToolbarSpace = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(UIBarButtonSystemItem.UIBarButtonSystemItemFlexibleSpace, null, null);
        this._doneTapDelegate = TapHandler.initWithOwner(new WeakRef(this));
        this._doneButton = UIBarButtonItem.alloc().initWithBarButtonSystemItemTargetAction(UIBarButtonSystemItem.UIBarButtonSystemItemDone, this._doneTapDelegate, "tap");

        this._accessoryViewVisible = true;
        this._toolbar = UIToolbar.alloc().initWithFrame(CGRectMake(0, 0, applicationFrame.size.width, TOOLBAR_HEIGHT));
        this._toolbar.autoresizingMask = UIViewAutoresizing.UIViewAutoresizingFlexibleWidth;

        let nsArray = NSMutableArray.alloc().init();
        nsArray.addObject(this._flexToolbarSpace);
        nsArray.addObject(this._doneButton);
        this._toolbar.setItemsAnimated(nsArray, false);
    }

    get ios(): UITextField
    {
        return this._textField.ios;
    }

    get accessoryViewVisible(): boolean
    {
        return this._accessoryViewVisible;
    }
    set accessoryViewVisible(value: boolean)
    {
        this._accessoryViewVisible = value;
        this._showHideAccessoryView();
    }

    private _showHideAccessoryView()
    {
        this.ios.inputAccessoryView = (this._accessoryViewVisible ? this._toolbar : null);
    }

    public onLoaded()
    {
        super.onLoaded();

        this._textField.onLoaded();
        this._listPicker.onLoaded();
        this._listPicker.on(observable.Observable.propertyChangeEvent,
            (data: observable.PropertyChangeData) =>
            {
                if (data.propertyName === "selectedIndex")
                {
                    this.selectedIndex = data.value;
                }
            });
        this.ios.inputView = this._listPicker.ios;
        this._showHideAccessoryView();
    }

    public onUnloaded()
    {
        this.ios.inputView = null;
        this.ios.inputAccessoryView = null;

        this._listPicker.off(observable.Observable.propertyChangeEvent);

        this._textField.onUnloaded();
        this._listPicker.onUnloaded();

        super.onUnloaded();
    }

    public _onItemsPropertyChanged(data: dependencyObservable.PropertyChangeData)
    {
        this._listPicker.items = data.newValue;
    }

    public _onSelectedIndexPropertyChanged(data: dependencyObservable.PropertyChangeData)
    {
        super._onSelectedIndexPropertyChanged(data);
        this._listPicker.selectedIndex = data.newValue;
        if (typeof (this.items && this.items.getItem ? this.items.getItem(data.newValue) : this.items[data.newValue]) === "object") {
            this._textField.text = (this.items && this.items.getItem ? this.items.getItem(data.newValue).DisplayValue : this.items[data.newValue].DisplayValue);
        }
        else {
            this._textField.text = (this.items && this.items.getItem ? this.items.getItem(data.newValue) : this.items[data.newValue]);
        }
    }
}

class TapHandler extends NSObject
{
    public static ObjCExposedMethods =
    {
        "tap": { returns: interop.types.void, params: [] }
    };

    private _owner: WeakRef<DropDown>;

    public static initWithOwner(owner: WeakRef<DropDown>)
    {
        let tapHandler = <TapHandler>TapHandler.new();
        tapHandler._owner = owner;

        return tapHandler;
    }

    public tap()
    {
        this._owner.get().ios.resignFirstResponder();
    }
}

//#region Styling
export class DropDownStyler implements style.Styler
{
    //#region Text Align Prperty
    private static setTextAlignmentProperty(dropDown: DropDown, newValue: any) 
    {
        utils.ios.setTextAlignment(dropDown._nativeView, newValue);
    }

    private static resetTextAlignmentProperty(dropDown: DropDown, nativeValue: any) 
    {
        let ios = <utils.ios.TextUIView>dropDown._nativeView;
        ios.textAlignment = nativeValue;
    }

    private static getNativeTextAlignmentValue(dropDown: DropDown): any 
    {
        let ios = <utils.ios.TextUIView>dropDown._nativeView;
        return ios.textAlignment;
    }
    //#endregion

    public static registerHandlers()
    {
        style.registerHandler(style.textAlignmentProperty
            , new style.StylePropertyChangedHandler(DropDownStyler.setTextAlignmentProperty
                , DropDownStyler.resetTextAlignmentProperty
                , DropDownStyler.getNativeTextAlignmentValue)
            , "DropDown");
    }

}
DropDownStyler.registerHandlers();
//#endregion