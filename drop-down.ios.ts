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
import proxy = require("ui/core/proxy");
import dependencyObservable = require("ui/core/dependency-observable");
import observable = require("data/observable");
import common = require("./drop-down-common");

global.moduleMerge(common, exports);

export class DropDown extends common.DropDown
{
    private _textField: textField.TextField;
    private _listPicker: listPicker.ListPicker;

    constructor()
    {
        super();

        this._textField = new textField.TextField();
        this._listPicker = new listPicker.ListPicker();
    }

    get ios(): UITextField
    {
        return this._textField.ios;
    }

    public onLoaded()
    {
        super.onLoaded();

        this._textField.onLoaded();
        this._listPicker.onLoaded();
        this._listPicker.on(observable.Observable.propertyChangeEvent,
            (data: observable.PropertyChangeData) =>
            {
                if (data.propertyName == "selectedIndex")
                {
                    this.selectedIndex = data.value;
                    this._textField.text = (this.items && this.items.getItem ? this.items.getItem(data.value) : this.items[data.value]);
                }
            });
        this.ios.inputView = this._listPicker.ios;
    }

    public onUnloaded()
    {
        this._listPicker.off(observable.Observable.propertyChangeEvent)
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
    }
}