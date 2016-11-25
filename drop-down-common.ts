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

import { PropertyMetadata } from "ui/core/proxy";
import { Property, PropertyChangeData, PropertyMetadataSettings } from "ui/core/dependency-observable";
import { View } from "ui/core/view";
import * as types from "utils/types";
import * as definition from "nativescript-drop-down";

export const DROPDOWN = "DropDown";

function onSelectedIndexPropertyChanged(data: PropertyChangeData) {
    let picker = <DropDown>data.object;
    picker._onSelectedIndexPropertyChanged(data);
}

function onItemsPropertyChanged(data: PropertyChangeData) {
    let picker = <DropDown>data.object;
    picker._onItemsPropertyChanged(data);
}

function onHintPropertyChanged(data: PropertyChangeData) {
    let picker = <DropDown>data.object;
    picker._onHintPropertyChanged(data);
}

export abstract class DropDown extends View implements definition.DropDown {
    public static openedEvent = "opened";
    public static selectedIndexChangedEvent = "selectedIndexChanged";
    
    public static itemsProperty = new Property(
        "items",
        DROPDOWN,
        new PropertyMetadata(
            undefined,
            PropertyMetadataSettings.AffectsLayout,
            onItemsPropertyChanged
        )
    );

    public static selectedIndexProperty = new Property(
        "selectedIndex",
        DROPDOWN,
        new PropertyMetadata(
            undefined,
            PropertyMetadataSettings.AffectsLayout,
            onSelectedIndexPropertyChanged
        )
    );

    public static hintProperty = new Property(
        "hint",
        DROPDOWN,
        new PropertyMetadata(
            "",
            PropertyMetadataSettings.AffectsLayout,
            onHintPropertyChanged
        )
    );

    public accessoryViewVisible;
    
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

    get hint(): string {
        return this._getValue(DropDown.hintProperty);
    }
    set hint(value: string) {
        this._setValue(DropDown.hintProperty, value);
    }

    public abstract open();
    public abstract _onItemsPropertyChanged(data: PropertyChangeData);
    public abstract _onHintPropertyChanged(data: PropertyChangeData);

    public _onSelectedIndexPropertyChanged(data: PropertyChangeData) {
        let index = this.selectedIndex;

        if (types.isUndefined(index)) {
            return;
        }

        if (index < 0 || index >= this.items.length) {
            this.selectedIndex = undefined;
            throw new Error("selectedIndex should be between [0, items.length - 1]");
        }
    }
}
