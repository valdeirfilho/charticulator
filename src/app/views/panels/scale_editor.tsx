// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/* eslint-disable @typescript-eslint/ban-types  */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-empty-interface */

import * as React from "react";
import * as R from "../../resources";

import { EventSubscription, Specification, uniqueID } from "../../../core";
import { Actions } from "../../actions";
import { ButtonRaised, EditableTextView } from "../../components";

import { AppStore } from "../../stores";
import { FluentUIWidgetManager } from "./widgets/fluentui_manager";
import { ReservedMappingKeyNamePrefix } from "../../../core/prototypes/legends/categorical_legend";
import { strings } from "../../../strings";
import { AttributeMap } from "../../../core/specification";
import { ObjectClass } from "../../../core/prototypes";
import { DefaultButton } from "@fluentui/react";

export interface ScaleEditorProps {
  scale: Specification.Scale;
  scaleMapping: Specification.ScaleMapping;
  store: AppStore;
  plotSegment: ObjectClass;
}

export interface ScaleEditorState {}

export class ScaleEditor extends React.Component<
  ScaleEditorProps,
  ScaleEditorState
> {
  public token: EventSubscription;

  public componentDidMount() {
    this.token = this.props.store.addListener(AppStore.EVENT_GRAPHICS, () => {
      this.forceUpdate();
    });
  }

  public componentWillUnmount() {
    this.token.remove();
  }

  // eslint-disable-next-line
  public render() {
    const { scale, store, scaleMapping } = this.props;
    const scaleClass = store.chartManager.getClassById(scale._id);
    const manager = new FluentUIWidgetManager(this.props.store, scaleClass);
    manager.onEditMappingHandler = (
      attribute: string,
      mapping: Specification.Mapping
    ) => {
      new Actions.SetScaleAttribute(scale, attribute, mapping).dispatch(
        store.dispatcher
      );
    };
    let canAddLegend = true;
    if (
      scale.classID.startsWith("scale.format") ||
      scale.classID === "scale.categorical<string,image>"
    ) {
      canAddLegend = false;
    }
    let canExtendLegend = false;
    if (
      scale.classID === "scale.categorical<string,color>" ||
      scale.classID === "scale.categorical<date,color>"
    ) {
      canExtendLegend = true;
    }
    const currentSelection = this.props.store.currentMappingAttributeFocus;
    return (
      <div
        className="scale-editor-view"
        style={{ width: "550px", padding: "10px" }}
      >
        <div className="attribute-editor">
          <section className="attribute-editor-element">
            <div className="header">
              <EditableTextView
                text={scale.properties.name}
                onEdit={(newText) => {
                  new Actions.SetObjectProperty(
                    scale,
                    "name",
                    null,
                    newText,
                    true
                  ).dispatch(store.dispatcher);
                }}
              />
            </div>
            {manager.vertical(...scaleClass.getAttributePanelWidgets(manager))}
            <div className="action-buttons">
              {canExtendLegend ? (
                <>
                  <DefaultButton
                    iconProps={{
                      iconName: "Add",
                    }}
                    disabled={(currentSelection?.length ?? 0) === 0}
                    text={strings.scaleEditor.add}
                    onClick={() => {
                      const mappingsKey = Object.keys(scale.properties.mapping);
                      const theLastMapping: string =
                        mappingsKey[mappingsKey.length - 1];
                      const value = (scale.properties.mapping as AttributeMap)[
                        theLastMapping
                      ];
                      new Actions.SetObjectProperty(
                        scale,
                        "mapping",
                        ReservedMappingKeyNamePrefix + uniqueID(),
                        value,
                        true,
                        true
                      ).dispatch(this.props.store.dispatcher);
                    }}
                  />
                  <DefaultButton
                    iconProps={{
                      iconName: "Remove",
                    }}
                    disabled={(currentSelection?.length ?? 0) === 0}
                    text={strings.scaleEditor.removeSelected}
                    onClick={() => {
                      if (currentSelection?.length > 0) {
                        new Actions.DeleteObjectProperty(
                          scale,
                          "mapping",
                          currentSelection,
                          false,
                          true
                        ).dispatch(this.props.store.dispatcher);
                        new Actions.SetCurrentMappingAttribute(null).dispatch(
                          this.props.store.dispatcher
                        );
                      }
                    }}
                  />
                </>
              ) : null}
              {canAddLegend ? (
                <DefaultButton
                  iconProps={{
                    iconName: "CharticulatorLegend",
                  }}
                  text={
                    store.isLegendExistForScale(scale._id)
                      ? strings.scaleEditor.removeLegend
                      : strings.scaleEditor.addLegend
                  }
                  onClick={() => {
                    new Actions.ToggleLegendForScale(
                      scale._id,
                      scaleMapping,
                      this.props.plotSegment
                    ).dispatch(store.dispatcher);
                  }}
                />
              ) : null}
            </div>
          </section>
        </div>
      </div>
    );
  }
}
