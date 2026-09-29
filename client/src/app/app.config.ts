import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  ViewTransitionInfo,
  withInMemoryScrolling,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';

import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay,
  withNoIncrementalHydration,
} from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { registerBffToClientMessages } from '@shared/messages/bff-to-client/register-messages';
import { combineLatestWith } from 'rxjs';
import { routes } from './app.routes';
import { BoardDependencies } from './components/server/board/board-config';
import { BoardComponent } from './components/server/board/board.component';
import { CameraDependencies } from './components/server/camera/camera-config';
import { CameraComponent } from './components/server/camera/camera.component';
import { ChartDependencies } from './components/server/chart/chart-config';
import { ChartComponent } from './components/server/chart/chart.component';
import { ContainerDependencies } from './components/server/container/container-config';
import { ContainerComponent } from './components/server/container/container.component';
import { DialogDependencies } from './components/server/dialog/dialog-config';
import { DialogComponent } from './components/server/dialog/dialog.component';
import { FileUploadAreaDependencies } from './components/server/file-upload-area/file-upload-area-config';
import { FileUploadAreaComponent } from './components/server/file-upload-area/file-upload-area.component';
import { ForEachDependencies } from './components/server/for-each/for-each-config';
import { ForEachComponent } from './components/server/for-each/for-each.component';
import { FormDependencies } from './components/server/form/form-config';
import { FormComponent } from './components/server/form/form.component';
import { GridDependencies } from './components/server/grid/grid-config';
import { GridComponent } from './components/server/grid/grid.component';
import { NumberInputDependencies } from './components/server/inputs/number-input/number-input-config';
import { NumberInputComponent } from './components/server/inputs/number-input/number-input.component';
import { PasswordInputDependencies } from './components/server/inputs/password-input/password-input-config';
import { PasswordInputComponent } from './components/server/inputs/password-input/password-input.component';
import { TextEditorDependencies } from './components/server/inputs/text-editor/text-editor-config';
import { TextEditorComponent } from './components/server/inputs/text-editor/text-editor.component';
import { TextInputDependencies } from './components/server/inputs/text-input/text-input-config';
import { TextInputComponent } from './components/server/inputs/text-input/text-input.component';
import { TextareaDependencies } from './components/server/inputs/textarea/textarea-config';
import { TextareaComponent } from './components/server/inputs/textarea/textarea.component';
import { LineComponent } from './components/server/line/line.component';
import { MapDependencies } from './components/server/map/map-config';
import { MapComponent } from './components/server/map/map.component';
import { CurrencyOutputDependencies } from './components/server/outputs/currency-output/currency-output-config';
import { CurrencyOutputComponent } from './components/server/outputs/currency-output/currency-output.component';
import { DatetimeOutputDependencies } from './components/server/outputs/datetime-output/datetime-output-config';
import { DatetimeOutputComponent } from './components/server/outputs/datetime-output/datetime-output.component';
import { IconDependencies } from './components/server/outputs/icon/icon-config';
import { IconComponent } from './components/server/outputs/icon/icon.component';
import { IframeDependencies } from './components/server/outputs/iframe/iframe-config';
import { IframeComponent } from './components/server/outputs/iframe/iframe.component';
import { ImageOutputDependencies } from './components/server/outputs/image-output/image-output-config';
import { ImageOutputComponent } from './components/server/outputs/image-output/image-output.component';
import { NumberOutputDependencies } from './components/server/outputs/number-output/number-output-config';
import { NumberOutputComponent } from './components/server/outputs/number-output/number-output.component';
import { ProgressBarDependencies } from './components/server/outputs/progress-bar/progress-bar-config';
import { ProgressBarComponent } from './components/server/outputs/progress-bar/progress-bar.component';
import { ProgressSpinnerDependencies } from './components/server/outputs/progress-spinner/progress-spinner-config';
import { ProgressSpinnerComponent } from './components/server/outputs/progress-spinner/progress-spinner.component';
import { QrCodeDependencies } from './components/server/outputs/qr-code/qr-code-config';
import { QrCodeComponent } from './components/server/outputs/qr-code/qr-code.component';
import { TextOutputDependencies } from './components/server/outputs/text-output/text-output-config';
import { TextOutputComponent } from './components/server/outputs/text-output/text-output.component';
import { VectorDependencies } from './components/server/outputs/vector/vector-config';
import { VectorComponent } from './components/server/outputs/vector/vector.component';
import { PageDependencies } from './components/server/page/page-config';
import { PageComponent } from './components/server/page/page.component';
import { PopoverDependencies } from './components/server/popover/popover-config';
import { PopoverComponent } from './components/server/popover/popover.component';
import { ServerComponentDependencies } from './components/server/server-component-config';
import { SERVER_COMPONENTS } from './components/server/server-components-injection-token';
import { ServerComponentsListComponent } from './components/server/server-components-list/server-components-list.component';
import { StackDependencies } from './components/server/stack/stack-config';
import { StackComponent } from './components/server/stack/stack.component';
import { platformProvider } from './platform-provider';
import { AndroidPlatform } from './platforms/android-platform';
import { IosPlatform } from './platforms/ios-platform';
import { PLATFORM } from './platforms/platform';
import { EnvironmentService } from './services/environment.service';
import { SERVER_COMPONENTS_LIST_COMPONENT } from './tokens/server-components-list-component';

// Небольшой костыль чтобы отслеживать события back и forward в браузере и для них блокировать анимацию перехода
let popState = false;
if (typeof window !== 'undefined') {
  // Только в браузере
  window.addEventListener('popstate', (event) => {
    popState = true;
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    {
      provide: SERVER_COMPONENTS_LIST_COMPONENT, // Чтобы избежать циклических зависимостей
      useValue: ServerComponentsListComponent,
    },
    {
      provide: SERVER_COMPONENTS,
      useValue: {
        [ServerComponentClass.Page]: {
          component: PageComponent,
          dependencies: PageDependencies,
        },
        [ServerComponentClass.Popover]: {
          component: PopoverComponent,
          dependencies: PopoverDependencies,
        },
        [ServerComponentClass.Line]: {
          component: LineComponent,
          dependencies: ServerComponentDependencies,
        },
        [ServerComponentClass.Dialog]: {
          component: DialogComponent,
          dependencies: DialogDependencies,
        },
        [ServerComponentClass.FileUploadArea]: {
          component: FileUploadAreaComponent,
          dependencies: FileUploadAreaDependencies,
        },
        [ServerComponentClass.Stack]: {
          component: StackComponent,
          dependencies: StackDependencies,
        },
        [ServerComponentClass.Grid]: {
          component: GridComponent,
          dependencies: GridDependencies,
        },
        [ServerComponentClass.Container]: {
          component: ContainerComponent,
          dependencies: ContainerDependencies,
        },
        [ServerComponentClass.Form]: {
          component: FormComponent,
          dependencies: FormDependencies,
        },
        [ServerComponentClass.Chart]: {
          component: ChartComponent,
          dependencies: ChartDependencies,
        },
        [ServerComponentClass.ForEach]: {
          component: ForEachComponent,
          dependencies: ForEachDependencies,
        },
        [ServerComponentClass.Map]: {
          component: MapComponent,
          dependencies: MapDependencies,
        },
        [ServerComponentClass.Board]: {
          component: BoardComponent,
          dependencies: BoardDependencies,
        },
        [ServerComponentClass.Camera]: {
          component: CameraComponent,
          dependencies: CameraDependencies,
        },
        [ServerComponentClass.ProgressBar]: {
          component: ProgressBarComponent,
          dependencies: ProgressBarDependencies,
        },
        [ServerComponentClass.ProgressSpinner]: {
          component: ProgressSpinnerComponent,
          dependencies: ProgressSpinnerDependencies,
        },
        [ServerComponentClass.Text]: {
          component: TextOutputComponent,
          dependencies: TextOutputDependencies,
        },
        [ServerComponentClass.Datetime]: {
          component: DatetimeOutputComponent,
          dependencies: DatetimeOutputDependencies,
        },
        [ServerComponentClass.Number]: {
          component: NumberOutputComponent,
          dependencies: NumberOutputDependencies,
        },
        [ServerComponentClass.Currency]: {
          component: CurrencyOutputComponent,
          dependencies: CurrencyOutputDependencies,
        },
        [ServerComponentClass.Image]: {
          component: ImageOutputComponent,
          dependencies: ImageOutputDependencies,
        },
        [ServerComponentClass.QrCode]: {
          component: QrCodeComponent,
          dependencies: QrCodeDependencies,
        },
        [ServerComponentClass.Icon]: {
          component: IconComponent,
          dependencies: IconDependencies,
        },
        [ServerComponentClass.Vector]: {
          component: VectorComponent,
          dependencies: VectorDependencies,
        },
        [ServerComponentClass.Iframe]: {
          component: IframeComponent,
          dependencies: IframeDependencies,
        },
        [ServerComponentClass.TextInput]: {
          component: TextInputComponent,
          dependencies: TextInputDependencies,
        },
        [ServerComponentClass.NumberInput]: {
          component: NumberInputComponent,
          dependencies: NumberInputDependencies,
        },
        [ServerComponentClass.Password]: {
          component: PasswordInputComponent,
          dependencies: PasswordInputDependencies,
        },
        [ServerComponentClass.Textarea]: {
          component: TextareaComponent,
          dependencies: TextareaDependencies,
        },
        [ServerComponentClass.TextEditor]: {
          component: TextEditorComponent,
          dependencies: TextEditorDependencies,
        },
      },
    },
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: 'reload', // Чтобы resolver срабатывал повторно при переходе по тому же пути
      }),
      withViewTransitions({
        onViewTransitionCreated: ({
          from,
          to,
          transition,
        }: ViewTransitionInfo) => {
          if (popState) {
            popState = false; // Сброс флага
            return; // Оставляем дефолтную анимацию перехода
          }
          if (from.firstChild && to.firstChild) {
            // Не первый переход
            const fromSegments = from.firstChild.url.toString();
            const toSegments = to.firstChild.url.toString();
            if (
              fromSegments !== toSegments &&
              toSegments.startsWith(fromSegments)
            ) {
              // Проваливаемся вглубь
              (transition.types as Set<string>).add('forwards');
            } else if (
              fromSegments !== toSegments &&
              fromSegments.startsWith(toSegments)
            ) {
              // Всплываем наверх
              (transition.types as Set<string>).add('backwards');
            } else {
              transition.types.add('default');
            }
          }
        },
      }),
      withInMemoryScrolling({
        // scrollPositionRestoration: 'enabled', // Не работает с withViewTransitions судя по ответам ChatGPT поэтому кастомное поведение реализуется в app.component.ts
        anchorScrolling: 'enabled',
      }),
    ),
    // withFetch() // Если включить, то отвалится HttpEventType.UploadProgress
    platformProvider,
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        registerBffToClientMessages(); // Чтобы парсить сообщения от сервера
        const env = inject(EnvironmentService);
        const platform = inject(PLATFORM);
        return () => env.initConfig().pipe(combineLatestWith(platform.boot()));
      },
      multi: true,
    },
    provideHttpClient(withXhr()),
    provideServiceWorker('ngsw-worker.js', {
      // В нативных приложениях SW не нужен: билд матрёшки обновляется вместе с приложением.
      enabled: !isNativeMobileApp() && !isDevMode(),
      registrationStrategy: 'registerImmediately',
    }),
    provideClientHydration(withEventReplay(), withNoIncrementalHydration()),
  ],
};

/** Android/iOS-сборка: platform-provider подменяется через fileReplacements. */
function isNativeMobileApp() {
  // useClass типизирован как BrowserPlatform — сравнение с Android/iOS без unknown не проходит.
  const useClass: unknown = platformProvider.useClass;
  return useClass === AndroidPlatform || useClass === IosPlatform;
}
