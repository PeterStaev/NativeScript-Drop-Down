/*! *****************************************************************************
Copyright (c) 2017 Tangra Inc.

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
import { Color } from "color";
import { View } from "ui/core/view";
import { Label } from "ui/label";
import { StackLayout } from "ui/layouts/stack-layout";
import { ItemsSource } from "ui/list-picker";
import { Font } from "ui/styling/font";
import {
    TextAlignment,
    TextDecoration,
    fontInternalProperty,
    fontSizeProperty,
    textAlignmentProperty,
    textDecorationProperty
} from "ui/text-base";
import * as types from "utils/types";
import { SelectedIndexChangedEventData } from ".";
import {
    DropDownBase,
    backgroundColorProperty,
    colorProperty,
    hintProperty,
    itemsProperty,
    selectedIndexProperty
} from "./drop-down-common";

export * from "./drop-down-common";

const LABELVIEWID = "spinner-label";

const enum RealizedViewType {
    ItemView,
    DropDownView
}

export class DropDown extends DropDownBase {
    public nativeView: android.widget.Spinner;
    public _realizedItems = [{}, {}];
    
    private _androidViewId: number;

    public createNativeView() {
        const spinner = new android.widget.Spinner(this._context);

        if (!this._androidViewId) {
            this._androidViewId = android.view.View.generateViewId();
        }
        spinner.setId(this._androidViewId);

        const adapter = new DropDownAdapter(new WeakRef(this));
        spinner.setAdapter(adapter);
        (spinner as any).adapter = adapter;

        const itemSelectedListener = new DropDownItemSelectedListener(new WeakRef(this));
        spinner.setOnItemSelectedListener(itemSelectedListener);
        (spinner as any).itemSelectedListener = itemSelectedListener;
        
        const touchListener = new DropDownTouchListener(new WeakRef(this));
        spinner.setOnTouchListener(touchListener);
        (spinner as any).touchListener = touchListener;

        return spinner;
    }

    public initNativeView() {
        super.initNativeView();

        const nativeView = this.nativeView as any;
        nativeView.adapter.owner = new WeakRef(this);
        nativeView.itemSelectedListener.owner = new WeakRef(this);
        nativeView.touchListener.owner = new WeakRef(this);

        // When used in templates the selectedIndex changed event is fired before the native widget is init.
        // So here we must set the inital value (if any)
        if (!types.isNullOrUndefined(this.selectedIndex)) {
            this.android.setSelection(this.selectedIndex + 1); // +1 for the hint first element
        }
    }

    public disposeNativeView() {
        const nativeView = this.nativeView as any;
        nativeView.adapter.owner = null;
        nativeView.itemSelectedListener.owner = null;
        nativeView.touchListener.owner = null;

        this._clearCache(RealizedViewType.DropDownView);
        this._clearCache(RealizedViewType.ItemView);
        
        super.disposeNativeView();
    }
    
    get android(): android.widget.Spinner {
        return this.nativeView;
    }
    
    public open() {
        this.nativeView.performClick();
    }

    public [selectedIndexProperty.getDefault](): number {
        return null;
    }
    public [selectedIndexProperty.setNative](value: number) {
        this._clearCache(RealizedViewType.DropDownView);
        
        const actualIndex = (types.isNullOrUndefined(value) ? 0 : value + 1);
        this.nativeView.setSelection(actualIndex);
    }

    public [itemsProperty.getDefault](): any[] {
        return null;
    }
    public [itemsProperty.setNative](value: any[] | ItemsSource) {
        this._updateSelectedIndexOnItemsPropertyChanged(value);
        (this.android.getAdapter() as DropDownAdapter).notifyDataSetChanged();

        // Coerce selected index after we have set items to native view.
        selectedIndexProperty.coerce(this);
    }

    public [hintProperty.getDefault](): string {
        return "";
    }
    public [hintProperty.setNative](value: string) {
        (this.android.getAdapter() as DropDownAdapter).notifyDataSetChanged();
    }
    
    public [textDecorationProperty.getDefault](): TextDecoration {
        return "none";
    }
    public [textDecorationProperty.setNative](value: TextDecoration) {
        this._propagateStylePropertyToRealizedViews("textDecoration", value, true);
    }
    
    public [textAlignmentProperty.getDefault](): TextAlignment {
        return "left";
    }
    public [textAlignmentProperty.setNative](value: TextAlignment) {
        this._propagateStylePropertyToRealizedViews("textAlignment", value, true);
    }

    public [fontInternalProperty.setNative](value: Font | android.graphics.Typeface) {
        this._propagateStylePropertyToRealizedViews("fontInternal", value, true);
    }

    public [fontSizeProperty.setNative](value: number | { nativeSize: number }) {
        if (!types.isNullOrUndefined(value)) {
            this._propagateStylePropertyToRealizedViews("fontSize", value, true);
        }    
    }
    
    public [backgroundColorProperty.setNative](value: Color | number) {
        this._propagateStylePropertyToRealizedViews("backgroundColor", value, true);
    }

    public [colorProperty.setNative](value: Color | number) {
        if (!types.isNullOrUndefined(value)) {
            this._propagateStylePropertyToRealizedViews("color", value, false);
        }
    }

    public _getRealizedView(convertView: android.view.View, realizedViewType: RealizedViewType): View {
        if (!convertView) {
            const view = new Label();
            const layout = new StackLayout();

            layout.style.horizontalAlignment = "stretch";           
            view.id = LABELVIEWID;

            layout.addChild(view);

            return layout;
        }
        
        return this._realizedItems[realizedViewType][convertView.hashCode()];
    }

    private _propagateStylePropertyToRealizedViews(property: string, value: any, isIncludeHintIn = true) {
        const realizedItems = this._realizedItems;
        for (const item of realizedItems) {
            // tslint:disable-next-line:forin
            for (const key in item) {
                const view = item[key];
                if (isIncludeHintIn || !view.isHintViewIn) {
                    if (property === "textAlignment" || property === "textDecoration"
                        || property === "fontInternal" || property === "fontSize"
                        || property === "color") {
                        const label: Label = view.getViewById(LABELVIEWID);
                        label.style[property] = value;
                    }
                    else {
                        view.style[property] = value;
                    }    
                }    
            }
        }        
    }

    private _updateSelectedIndexOnItemsPropertyChanged(newItems: any[] | ItemsSource) {
        let newItemsCount = 0;
        if (newItems && newItems.length) {
            newItemsCount = newItems.length;
        }

        if (newItemsCount === 0 || this.selectedIndex >= newItemsCount) {
            this.selectedIndex = null;
        }
    }

    private _clearCache(realizedViewType: RealizedViewType) {
        const items = this._realizedItems[realizedViewType];
        const keys = Object.keys(items);

        for (const key of keys) {
            const view = items[key];
            if (view.parent) {
                view.parent._removeView(view);
            }    
        }
    }
}

class DropDownAdapter extends android.widget.BaseAdapter implements android.widget.ISpinnerAdapter {
    constructor(private owner: WeakRef<DropDown>) {
        super();

        return global.__native(this);
    }

    public isEnabled(i: number) {
        return i !== 0;
    }

    public getCount() {
        const owner = this.owner.get();
        return (owner && owner.items ? owner.items.length : 0) + 1; // +1 for the hint
    }

    public getItem(i: number) {
        const owner = this.owner.get();

        if (i === 0) {
            return owner.hint;
        }
    
        const realIndex = i - 1;
        return owner._getItemAsString(realIndex);
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
        const owner = this.owner.get();

        if (!owner) {
            return null;
        }

        const view = owner._getRealizedView(convertView, realizedViewType);

        if (view) {
            if (!view.parent) {
                owner._addView(view);
                convertView = view.android;
            }

            const label = view.getViewById<Label>(LABELVIEWID);
            label.text = this.getItem(index);
    
            // Copy root styles to view        
            label.style.color = owner.style.color;
            label.style.textDecoration = owner.style.textDecoration;
            label.style.textAlignment = owner.style.textAlignment;
            label.style.fontInternal = owner.style.fontInternal;
            label.style.fontSize = owner.style.fontSize;
            view.style.backgroundColor = owner.style.backgroundColor;
            view.style.padding = owner.style.padding;
            view.style.height = owner.style.height;

            if (realizedViewType === RealizedViewType.DropDownView) {
                view.style.opacity = owner.style.opacity;
            }

            (view as any).isHintViewIn = false;
        
            // Hint View styles
            if (index === 0) {
                view.color = new Color(255, 148, 150, 148);
                (view as any).isHintViewIn = true;
            
                // HACK: if there is no hint defined, make the view in the drop down virtually invisible.
                if (realizedViewType === RealizedViewType.DropDownView
                    && (types.isNullOrUndefined(owner.hint) || owner.hint === "")) {
                    view.height = 1;
                    view.style.fontSize = 0;
                    view.style.padding = "0";
                }
                // END HACK
            }
        
            owner._realizedItems[realizedViewType][convertView.hashCode()] = view;
        }

        return convertView;
    }
}

@Interfaces([android.widget.AdapterView.OnItemSelectedListener])
class DropDownItemSelectedListener extends java.lang.Object implements android.widget.AdapterView.OnItemSelectedListener {
    constructor(private owner: WeakRef<DropDown>) {
        super();

        return global.__native(this);
    }

    public onItemSelected(parent: any, convertView: android.view.View, index: number, id: number) {
        const owner = this.owner.get();
        const oldIndex = owner.selectedIndex;
        const newIndex = (index === 0 ? null : index - 1);
            
        owner.selectedIndex = newIndex;

        if (newIndex !== oldIndex) {
            owner.notify({
                eventName: DropDownBase.selectedIndexChangedEvent,
                object: owner,
                oldIndex,
                newIndex
            } as SelectedIndexChangedEventData);
        }
    }

    public onNothingSelected() {
        /* Currently Not Needed */
    }
}

@Interfaces([android.view.View.OnTouchListener])
class DropDownTouchListener extends java.lang.Object implements android.view.View.OnTouchListener {
    constructor(private owner: WeakRef<DropDown>) {
        super();

        return global.__native(this);
    }

    public onTouch(v: android.view.View, event: android.view.MotionEvent) {
        if (event.getAction() === android.view.MotionEvent.ACTION_DOWN) {
            const owner = this.owner.get();

            owner.notify({
                eventName: DropDownBase.openedEvent,
                object: owner
            });
        }
        return false;
    }
}