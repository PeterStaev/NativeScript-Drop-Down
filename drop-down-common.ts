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

import proxy = require("ui/core/proxy");
import dependencyObservable = require("ui/core/dependency-observable");
import view = require("ui/core/view");
import types = require("utils/types");

const DROPDOWN = "DropDown";

function onSelectedIndexPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    let picker = <DropDown>data.object;
    picker._onSelectedIndexPropertyChanged(data);
}

function onItemsPropertyChanged(data: dependencyObservable.PropertyChangeData) {
    let picker = <DropDown>data.object;
    picker._onItemsPropertyChanged(data);
}

export abstract class DropDown extends view.View {
    public static itemsProperty = new dependencyObservable.Property(
        "items",
        DROPDOWN,
        new proxy.PropertyMetadata(
            undefined,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onItemsPropertyChanged
        )
    );

    public static selectedIndexProperty = new dependencyObservable.Property(
        "selectedIndex",
        DROPDOWN,
        new proxy.PropertyMetadata(
            undefined,
            dependencyObservable.PropertyMetadataSettings.AffectsLayout,
            onSelectedIndexPropertyChanged
        )
    );

    constructor() {
        super();
    }

    get items(): any {
        return this._getValue(DropDown.itemsProperty);
    }
    set items(value: any) {
        this._setValue(DropDown.itemsProperty, value);
    }

    get selectedIndex(): number {
        return this._getValue(DropDown.selectedIndexProperty);
    }
    set selectedIndex(value: number) {
        this._setValue(DropDown.selectedIndexProperty, value);
    }

    public abstract _onItemsPropertyChanged(data: dependencyObservable.PropertyChangeData)

    public _onSelectedIndexPropertyChanged(data: dependencyObservable.PropertyChangeData) {
        let index = this.selectedIndex;
        if (types.isUndefined(index)) {
            return;
        }

        if (types.isDefined(this.items)) {
            if (index < 0 || index >= this.items.length) {
                this.selectedIndex = undefined;
                throw new Error("selectedIndex should be between [0, items.length - 1]");
            }
        }
    }
}
