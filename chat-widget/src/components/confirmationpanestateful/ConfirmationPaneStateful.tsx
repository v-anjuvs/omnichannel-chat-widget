import { LogLevel, TelemetryEvent } from "../../common/telemetry/TelemetryConstants";
import React, { Dispatch, useEffect } from "react";
import { findAllFocusableElement, findParentFocusableElementsWithoutChildContainer, preventFocusToMoveOutOfElement, setFocusOnElement, setFocusOnSendBox, setTabIndices } from "../../common/utils";

import { BroadcastService, ConfirmationPane } from "@microsoft/omnichannel-chat-components";
import { DimLayer } from "../dimlayer/DimLayer";
import { IConfirmationPaneControlProps } from "@microsoft/omnichannel-chat-components/lib/types/components/confirmationpane/interfaces/IConfirmationPaneControlProps";
import { IConfirmationPaneStatefulParams } from "./interfaces/IConfirmationPaneStatefulParams";
import { ILiveChatWidgetAction } from "../../contexts/common/ILiveChatWidgetAction";
import { ILiveChatWidgetContext } from "../../contexts/common/ILiveChatWidgetContext";
import { LiveChatWidgetActionType } from "../../contexts/common/LiveChatWidgetActionType";
import { NotificationHandler } from "../webchatcontainerstateful/webchatcontroller/notification/NotificationHandler";
import { NotificationScenarios } from "../webchatcontainerstateful/webchatcontroller/enums/NotificationScenarios";
import { PostChatSurveyMode } from "../postchatsurveypanestateful/enums/PostChatSurveyMode";
import { TelemetryHelper } from "../../common/telemetry/TelemetryHelper";
import useChatAdapterStore from "../../hooks/useChatAdapterStore";
import useChatContextStore from "../../hooks/useChatContextStore";
import { ICustomEvent } from "@microsoft/omnichannel-chat-components/lib/types/interfaces/ICustomEvent";
import useChatSDKStore from "../../hooks/useChatSDKStore";
import { Constants } from "../../common/Constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ConfirmationPaneStateful = (props: IConfirmationPaneStatefulParams) => {

    const initialTabIndexMap: Map<string, number> = new Map();
    let elements: HTMLElement[] | null = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatSDK: any = useChatSDKStore();

    const [state, dispatch]: [ILiveChatWidgetContext, Dispatch<ILiveChatWidgetAction>] = useChatContextStore();
    const { endChat } = props;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [adapter,]: [any, (adapter: any) => void] = useChatAdapterStore();

    const isPostChatEnabled = state.domainStates.liveChatConfig?.LiveWSAndLiveChatEngJoin?.msdyn_postconversationsurveyenable;
    const postChatSurveyMode = state.domainStates.liveChatConfig?.LiveWSAndLiveChatEngJoin?.msdyn_postconversationsurveymode;

    const controlProps: IConfirmationPaneControlProps = {
        id: "oc-lcw-confirmation-pane",
        dir: state.domainStates.globalDir,
        onConfirm: async () => {
            TelemetryHelper.logConfigDataEvent(LogLevel.INFO, {
                Event: TelemetryEvent.ConfirmationConfirmButtonClicked,
                Description: "Confirmation pane Confirm button clicked"
            });
            dispatch({ type: LiveChatWidgetActionType.SET_SHOW_CONFIRMATION, payload: false });
            try {
                // check agent has joined conversation
                const conversationDetails = await chatSDK.getConversationDetails();
                
                if (isPostChatEnabled === "true" && postChatSurveyMode === PostChatSurveyMode.Embed
                    && conversationDetails.canRenderPostChat === Constants.truePascal) {
                    const loadPostChatEvent: ICustomEvent = {
                        eventName: "LoadPostChatSurvey",
                    };
                    BroadcastService.postMessage(loadPostChatEvent);
                } else {
                    setTabIndices(elements, initialTabIndexMap, true);
                    try {
                        await endChat(adapter);
                    } catch (error) {
                        TelemetryHelper.logSDKEvent(LogLevel.ERROR, {
                            Event: TelemetryEvent.CloseChatMethodException,
                            ExceptionDetails: {
                                exception: `Failed to endChat: ${error}`
                            }
                        });
                    }
                }
            } catch (ex) {
                TelemetryHelper.logSDKEvent(LogLevel.ERROR, {
                    Event: TelemetryEvent.GetConversationDetailsCallFailed,
                    ExceptionDetails: {
                        exception: `Get Conversation Details Call Failed : ${ex}`
                    }
                });
                NotificationHandler.notifyError(NotificationScenarios.Connection, "Get Conversation Details Call Failed: " + ex);
            }
        },
        onCancel: () => {
            TelemetryHelper.logConfigDataEvent(LogLevel.INFO, {
                Event: TelemetryEvent.ConfirmationCancelButtonClicked,
                Description: "Confirmation pane Cancel button clicked."
            });
            dispatch({ type: LiveChatWidgetActionType.SET_SHOW_CONFIRMATION, payload: false });
            const previousFocused = state.appStates.previousElementOnFocusBeforeModalOpen;

            if (previousFocused) {
                setFocusOnElement(previousFocused);
                dispatch({ type: LiveChatWidgetActionType.SET_PREVIOUS_FOCUSED_ELEMENT, payload: null });
            } else {
                setFocusOnSendBox();
            }

            setTabIndices(elements, initialTabIndexMap, true);
        },
        ...props?.controlProps
    };

    // Move focus to the first button
    useEffect(() => {
        preventFocusToMoveOutOfElement(controlProps.id as string);
        const focusableElements: HTMLElement[] | null = findAllFocusableElement(`#${controlProps.id}`);
        if (focusableElements) {
            focusableElements[0].focus();
        }

        elements = findParentFocusableElementsWithoutChildContainer(controlProps.id as string);
        setTabIndices(elements, initialTabIndexMap, false);
        TelemetryHelper.logLoadingEvent(LogLevel.INFO, { Event: TelemetryEvent.ConfirmationPaneLoaded });
    }, []);

    return (
        <>
            {!controlProps?.disableDimLayer && <DimLayer brightness={controlProps?.brightnessValueOnDim ?? "0.2"} />}
            <ConfirmationPane
                componentOverrides={props?.componentOverrides}
                controlProps={controlProps}
                styleProps={props?.styleProps} />
        </>
    );
};

export default ConfirmationPaneStateful;