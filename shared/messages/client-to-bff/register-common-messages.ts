import { AppClientStateMessage } from "./app/app-client-state-message";
import { AppDestroyEntryInstanceMessage } from "./app/app-destroy-entry-instance-message";
import { HandshakeMessage } from "./app/handshake-message";
import { clientToBffMessageRegistry } from "./client-to-bff-message-registry";
import { BoardCenterChangeMessage } from "./components/board/board-center-change-message";
import { BoardZoomChangeMessage } from "./components/board/board-zoom-change-message";
import { CameraDeviceChangeMessage } from "./components/camera/camera-device-change-message";
import { CameraQrCodeMessage } from "./components/camera/camera-qr-code-message";
import { ComponentClickMessage } from "./components/component-click-message";
import { ComponentEnterMessage } from "./components/component-enter-message";
import { ComponentHideMessage } from "./components/component-hide-message";
import { ComponentKeyDownMessage } from "./components/component-keydown-message";
import { ComponentLeaveMessage } from "./components/component-leave-message";
import { ComponentMouseEnterMessage } from "./components/component-mouseenter-message";
import { ComponentMouseLeaveMessage } from "./components/component-mouseleave-message";
import { ComponentScrollMessage } from "./components/component-scroll-message";
import { ComponentShowMessage } from "./components/component-show-message";
import { FileUploadAreaCompleteMessage } from "./components/file-upload-area/file-upload-area-complete-message";
import { FileUploadAreaErrorMessage } from "./components/file-upload-area/file-upload-area-error-message";
import { FileUploadAreaProgressMessage } from "./components/file-upload-area/file-upload-area-progress-message";
import { FileUploadAreaStartMessage } from "./components/file-upload-area/file-upload-area-start-message";
import { FormSubmitMessage } from "./components/form/form-submit-message";
import { MapCenterChangeMessage } from "./components/map/map-center-change-message";
import { MapZoomChangeMessage } from "./components/map/map-zoom-change-message";
import { TextEditorSelectionChangeMessage } from "./components/text-editor/text-editor-selection-change-message";
import { ContextInitMessage } from "./context/context-init-message";
import { ContextValuesMessage } from "./context/context-values-message";
import { ErrorMessage } from "./error-message";
import { ClientToBffMessageReceivedMessage } from "./message-received-message";
import { PlatformEnumerateDevicesSuccessMessage } from "./platforms/platform-enumerate-devices-success-message";
import { PlatformWebAuthnCreateCredentialSuccessMessage } from "./platforms/platform-webauthn-create-credential-success-message";
import { PlatformWebAuthnGetCredentialSuccessMessage } from "./platforms/platform-webauthn-get-credential-success-message";

export function registerCommonClientToBffMessages() {
  clientToBffMessageRegistry.register(ClientToBffMessageReceivedMessage);
  clientToBffMessageRegistry.register(HandshakeMessage);
  clientToBffMessageRegistry.register(AppClientStateMessage);
  clientToBffMessageRegistry.register(AppDestroyEntryInstanceMessage);
  clientToBffMessageRegistry.register(ContextInitMessage);
  clientToBffMessageRegistry.register(ContextValuesMessage);
  clientToBffMessageRegistry.register(ComponentShowMessage);
  clientToBffMessageRegistry.register(ComponentHideMessage);
  clientToBffMessageRegistry.register(ComponentEnterMessage);
  clientToBffMessageRegistry.register(ComponentLeaveMessage);
  clientToBffMessageRegistry.register(ComponentClickMessage);
  clientToBffMessageRegistry.register(ComponentMouseEnterMessage);
  clientToBffMessageRegistry.register(ComponentMouseLeaveMessage);
  clientToBffMessageRegistry.register(ComponentKeyDownMessage);
  clientToBffMessageRegistry.register(ComponentScrollMessage);
  clientToBffMessageRegistry.register(CameraQrCodeMessage);
  clientToBffMessageRegistry.register(CameraDeviceChangeMessage);
  clientToBffMessageRegistry.register(MapCenterChangeMessage);
  clientToBffMessageRegistry.register(MapZoomChangeMessage);
  clientToBffMessageRegistry.register(BoardCenterChangeMessage);
  clientToBffMessageRegistry.register(BoardZoomChangeMessage);
  clientToBffMessageRegistry.register(TextEditorSelectionChangeMessage);
  clientToBffMessageRegistry.register(FileUploadAreaStartMessage);
  clientToBffMessageRegistry.register(FileUploadAreaProgressMessage);
  clientToBffMessageRegistry.register(FileUploadAreaCompleteMessage);
  clientToBffMessageRegistry.register(FileUploadAreaErrorMessage);
  clientToBffMessageRegistry.register(FormSubmitMessage);
  clientToBffMessageRegistry.register(PlatformEnumerateDevicesSuccessMessage);
  clientToBffMessageRegistry.register(
    PlatformWebAuthnCreateCredentialSuccessMessage,
  );
  clientToBffMessageRegistry.register(
    PlatformWebAuthnGetCredentialSuccessMessage,
  );
  clientToBffMessageRegistry.register(ErrorMessage);
}
