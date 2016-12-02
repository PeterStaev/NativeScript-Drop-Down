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

import * as common from "./drop-down-common";
import { PropertyChangeData } from "ui/core/dependency-observable";
import { View } from "ui/core/view";
import { Label } from "ui/label";
import { StackLayout } from "ui/layouts/stack-layout";
import { Color } from "color";
import * as types from "utils/types";
import { SelectedIndexChangedEventData } from "nativescript-drop-down";

global.moduleMerge(common, exports);

const LABELVIEWID = "spinner-label";

enum RealizedViewType {
    ItemView,
    DropDownView
}

export class DropDown extends common.DropDown {

    private _android: android.widget.Spinner;
    private _androidViewId: number;
    public _realizedItems = [{}, {}];

    public _createUI() {
        this._android = new android.widget.Spinner(this._context);

        if (!this._androidViewId) {
            this._androidViewId = android.view.View.generateViewId();
        }
        this._android.setId(this._androidViewId);

        this.android.setAdapter(new DropDownAdapter(this));

        let that = new WeakRef(this);
        this.android.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener({
            onItemSelected(parent: any, convertView: android.view.View, index: number, id: number) {
                let owner = that.get(),
                    oldIndex = owner.selectedIndex,
                    newIndex = (index === 0 ? undefined : index - 1);
                
                owner._selectedIndexInternal = index;

                if (newIndex !== oldIndex) {
                    owner.notify(<SelectedIndexChangedEventData>{
                        eventName: common.DropDown.selectedIndexChangedEvent,
                        object: owner,
                        oldIndex: oldIndex,
                        newIndex: newIndex
                    });
                }                
            },
            onNothingSelected() { /* Currently Not Needed */ }
        }));
        
        this.android.setOnTouchListener(new android.view.View.OnTouchListener({
            onTouch(v: android.view.View, event: android.view.MotionEvent) {
                if (event.getAction() === android.view.MotionEvent.ACTION_DOWN) {
                    let owner = that.get();

                    owner.notify({
                        eventName: common.DropDown.openedEvent,
                        object: owner
                    });
                }
                return false;                
            }
        }));

        // When used in templates the selectedIndex changed event is fired before the native widget is init.
        // So here we must set the inital value (if any)
        if (!types.isNullOrUndefined(this.selectedIndex)) {
            this.android.setSelection(this.selectedIndex + 1); // +1 for the hint first element
        }
    }

    get android(): android.widget.Spinner {
        return this._android;
    }


    set _selectedIndexInternal(value: number) {
        this.selectedIndex = (value === 0 ? undefined : value - 1);
        if (this.android) {
            this.android.setSelection(value);
        }
    }
    
    public open() {
        this._android.performClick();
    }

    public _onItemsPropertyChanged(data: PropertyChangeData) {
        if (!this._android || !this._android.getAdapter()) {
            return;
        }
        this._updateSelectedIndexOnItemsPropertyChanged(data.newValue);
        (<DropDownAdapter>this.android.getAdapter()).notifyDataSetChanged();
    }

    public _onDetached(force?: boolean) {
        super._onDetached(force);

        this._clearCache(RealizedViewType.DropDownView);
        this._clearCache(RealizedViewType.ItemView);
    }
    
    public _getRealizedView(convertView: android.view.View, realizedViewType: RealizedViewType): View {
        if (!convertView) {
            let view = new Label();
            let layout = new StackLayout();

            view.id = LABELVIEWID;

            layout.addChild(view);

            return layout;
        }
        
        return this._realizedItems[realizedViewType][convertView.hashCode()];
    }

    public _onSelectedIndexPropertyChanged(data: PropertyChangeData) {
        super._onSelectedIndexPropertyChanged(data);
        this._clearCache(RealizedViewType.DropDownView);
        this._selectedIndexInternal = (types.isNullOrUndefined(data.newValue) ? 0 : data.newValue + 1);
    }

    public _onHintPropertyChanged(data: PropertyChangeData) {
        if (!this._android || !this._android.getAdapter()) {
            return;
        }
        (<DropDownAdapter>this.android.getAdapter()).notifyDataSetChanged();
    }

    private _updateSelectedIndexOnItemsPropertyChanged(newItems) {
        let newItemsCount = 0;
        if (newItems && newItems.length) {
            newItemsCount = newItems.length;
        }

        if (newItemsCount === 0 || this.selectedIndex >= newItemsCount) {
            this.selectedIndex = undefined;
        }
    }

    private _clearCache(realizedViewType: RealizedViewType) {
        let items = this._realizedItems[realizedViewType];
        let keys = Object.keys(items);
        let i;
        let length = keys.length;
        let view: View;
        let key;

        for (i = 0; i < length; i++) {
            key = keys[i];
            view = items[key];
            view.parent._removeView(view);
            delete items[key];
        }
    }
}

class DropDownAdapter extends android.widget.BaseAdapter {
    private _dropDown: DropDown;

    constructor(dropDown: DropDown) {
        super();

        this._dropDown = dropDown;

        return global.__native(this);
    }

    public isEnabled(i: number) {
        return i !== 0;
    }    

    public getCount() {
        return (this._dropDown && this._dropDown.items ? this._dropDown.items.length : 0) + 1; // +1 for the hint
    }

    public getItem(i: number) {
       
        if (i === 0) {
            return this._dropDown.hint;
        }
        
        let realIndex = i - 1;
        if (this._dropDown && this._dropDown.items && realIndex < this._dropDown.items.length) {
            return this._dropDown.items.getItem ? this._dropDown.items.getItem(realIndex) : this._dropDown.items[realIndex];
        }

        return null;
    }

    public getItemId(i: number) {
        return long(i);
    }

    public hasStableIds(): boolean {
        return true;
    }

    public getView(index: number, convertView: android.view.View, parent: android.view.ViewGroup): android.view.View {
        return this._generateView(index, convertView, parent, RealizedViewType.ItemView);
    }

    public getDropDownView(index: number, convertView: android.view.View, parent: android.view.ViewGroup): android.view.View {
        return this._generateView(index, convertView, parent, RealizedViewType.DropDownView);
    }

    private _generateView(index: number, convertView: android.view.View, parent: android.view.ViewGroup, realizedViewType: RealizedViewType): android.view.View {
        if (!this._dropDown) {
            return null;
        }

        let view = this._dropDown._getRealizedView(convertView, realizedViewType);

        if (view) {
            if (!view.parent) {
                this._dropDown._addView(view);
                convertView = view.android;
            }

            let label = view.getViewById<Label>(LABELVIEWID);
            label.text = this.getItem(index);
        
            // Copy root styles to view        
            view.color = this._dropDown.color;
            view.backgroundColor = this._dropDown.backgroundColor;
            label.style.textDecoration = this._dropDown.style.textDecoration;
            view.style.padding = this._dropDown.style.padding;
            view.style.fontSize = this._dropDown.style.fontSize;
            view.height = this._dropDown.height;

            if (realizedViewType === RealizedViewType.DropDownView) {
                view.opacity = this._dropDown.opacity;
            }
            
            // Hint View styles
            if (index === 0) { 
                view.color = new Color(255, 148, 150, 148);

                // HACK: if there is no hint defined, make the view in the drop down virtually invisible.
                if (realizedViewType === RealizedViewType.DropDownView && types.isNullOrUndefined(this._dropDown.hint)) {
                    view.height = 1;
                    view.style.fontSize = 0;
                    view.style.padding = "0";
                }
                // END HACK
            }
            
            this._dropDown._realizedItems[realizedViewType][convertView.hashCode()] = view;
        }

        return convertView;
    }
}