import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { MapMarkerHorizontalAnchor } from '@shared/enums/map-marker-horizontal-anchor';
import { MapMarkerVerticalAnchor } from '@shared/enums/map-marker-vertical-anchor';
import { MapSetCenterMessage } from '@shared/messages/bff-to-client/components/map/map-set-center-message';
import { MapSetZoomMessage } from '@shared/messages/bff-to-client/components/map/map-set-zoom-message';
import { MapZoomInMessage } from '@shared/messages/bff-to-client/components/map/map-zoom-in-message';
import { MapZoomOutMessage } from '@shared/messages/bff-to-client/components/map/map-zoom-out-message';
import { MapCenterChangeMessage } from '@shared/messages/client-to-bff/components/map/map-center-change-message';
import { MapZoomChangeMessage } from '@shared/messages/client-to-bff/components/map/map-zoom-change-message';
import type { MapConfig, SerializedMapMarker } from '@shared/types/map-config';
import type { NestedItemsDiff } from '@shared/utils/diff-nested-items';
import { BehaviorSubject, filter } from 'rxjs';
import { type LngLat, type YMapLocationRequest } from 'ymaps3';
import { loadScript } from '../../../utils/load-script';
import { randomString } from '../../../utils/random-string';
import { rem } from '../../../utils/rem';
import { NestedItemsHostComponent } from '../nested-items-host/nested-items-host.component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

@Component({
  selector: 'app-map',
  imports: [ServerComponentsListComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'map stack',
  },
})
export class MapComponent extends NestedItemsHostComponent<
  MapConfig,
  SerializedMapMarker
> {
  private readonly mapRenderInjector = inject(Injector);
  selecttorId = 'map-' + randomString(16);
  markerHosts = viewChildren<ElementRef<HTMLElement>>('markerHost');
  /** Общий статус загрузки Yandex Maps API для всех экземпляров map. */
  static yandexMapsStatus$ = new BehaviorSubject<
    'pending' | 'loading' | 'loaded'
  >('pending');
  private yMap?: any;
  private currentCenter?: LngLat;
  private currentZoom?: number;
  private featuresLayerAdded = false;
  /** Живые `YMapMarker` по `marker.id` для incremental sync. */
  private readonly yMapMarkers = new Map<string, any>();

  /** Имя nested-slot'а в конфиге и `NestedItemsSyncMessage`. */
  protected nestedItemsSlot(): string {
    return 'markers';
  }

  /** Incremental sync маркеров: remove → update (recreate) → add. */
  protected applyNestedItemsDiff(
    diff: NestedItemsDiff<SerializedMapMarker>,
  ): void {
    if (!this.yMap) {
      return;
    }
    for (const marker of diff.removed) {
      this.removeYMapMarker(marker.id);
    }
    for (const marker of diff.updated) {
      this.removeYMapMarker(marker.id);
      this.scheduleCreateYMapMarker(marker);
    }
    for (const marker of diff.added) {
      this.scheduleCreateYMapMarker(marker);
    }
  }

  /** Собирает `LngLat` для ymaps3 из lon/lat/alt конфига BFF. */
  private yMapCenterFromLonLat(
    longitude: number,
    latitude: number,
    altitude?: number,
  ): LngLat {
    return altitude !== undefined
      ? [longitude, latitude, altitude]
      : [longitude, latitude];
  }

  /** Подбирает `lang` для Yandex Maps API по `navigator.language(s)`. */
  private getYandexMapsLang(): string {
    const supportedLocales = new Set<string>([
      'tr_TR',
      'en_US',
      'en_RU',
      'ru_RU',
      'ru_UA',
      'uk_UA',
    ]);
    const defaultLocale = 'en_US';

    const rawLanguage =
      (navigator.languages && navigator.languages.length > 0
        ? navigator.languages[0]
        : navigator.language) || defaultLocale;

    const normalized = rawLanguage.replace('-', '_');
    const [languageCodeRaw, regionCodeRaw] = normalized.split('_');
    const languageCode = languageCodeRaw?.toLowerCase();
    const regionCode = regionCodeRaw?.toUpperCase();

    if (languageCode && regionCode) {
      const exactLocale = `${languageCode}_${regionCode}`;
      if (supportedLocales.has(exactLocale)) {
        return exactLocale;
      }
    }

    if (languageCode) {
      const languageToDefaultRegion: Record<string, string> = {
        ru: 'ru_RU',
        en: 'en_US',
        tr: 'tr_TR',
        uk: 'uk_UA',
      };

      const mappedLocale = languageToDefaultRegion[languageCode];
      if (mappedLocale && supportedLocales.has(mappedLocale)) {
        return mappedLocale;
      }

      const anySupportedForLanguage = Array.from(supportedLocales).find((loc) =>
        loc.toLowerCase().startsWith(`${languageCode}_`),
      );
      if (anySupportedForLanguage) {
        return anySupportedForLanguage;
      }
    }

    return defaultLocale;
  }

  /** Подписка на команды BFF и старт загрузки Yandex Maps (один раз на приложение). */
  override ngOnInit(): void {
    super.ngOnInit();
    this.componentCommandMessages$.subscribe((message) => {
      if (message instanceof MapSetCenterMessage) {
        this.currentCenter = this.yMapCenterFromLonLat(
          message.payload.longitude,
          message.payload.latitude,
          message.payload.altitude,
        );
        this.applyLocation();
      } else if (message instanceof MapSetZoomMessage) {
        this.currentZoom = message.payload;
        this.applyLocation();
      } else if (message instanceof MapZoomInMessage) {
        this.currentZoom =
          (this.currentZoom ?? this.config.properties.zoom) + 1;
        this.applyLocation();
      } else if (message instanceof MapZoomOutMessage) {
        this.currentZoom =
          (this.currentZoom ?? this.config.properties.zoom) - 1;
        this.applyLocation();
      }
    });
    if (MapComponent.yandexMapsStatus$.getValue() === 'pending') {
      this.initYandexMaps();
    }
  }

  /**
   * После `ymaps3.ready` создаёт карту, listener center/zoom → BFF
   * и монтирует маркеры из nested-items.
   */
  override ngAfterViewInit() {
    MapComponent.yandexMapsStatus$
      .pipe(filter((x) => x === 'loaded'))
      .subscribe(() => {
        const {
          YMap,
          YMapDefaultSchemeLayer,
          YMapDefaultFeaturesLayer,
          YMapMarker,
          YMapListener,
        } = ymaps3;
        const cfgCenter = this.config.properties.center;
        const LOCATION: YMapLocationRequest = {
          center: this.yMapCenterFromLonLat(
            cfgCenter.longitude,
            cfgCenter.latitude,
            cfgCenter.altitude,
          ),
          zoom: this.config.properties.zoom,
        };
        this.currentCenter = LOCATION.center;
        this.currentZoom = LOCATION.zoom;

        const map = new YMap(this.document.getElementById(this.selecttorId)!, {
          location: LOCATION,
        });
        this.yMap = map;

        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(
          new YMapListener({
            onUpdate: (event: any) => {
              if (event.mapInAction) return;
              const centerArr = event.location.center as [
                number,
                number,
                number?,
              ];
              this.currentCenter = centerArr;
              this.currentZoom = event.location.zoom;
              this.interact(
                'zoom-change',
                this.componentInteractionMessage(
                  (target) =>
                    new MapZoomChangeMessage(target, event.location.zoom),
                ),
              );
              this.interact(
                'center-change',
                this.componentInteractionMessage((target) => {
                  const alt = centerArr[2];
                  return new MapCenterChangeMessage(target, {
                    longitude: centerArr[0],
                    latitude: centerArr[1],
                    ...(alt !== undefined && !Number.isNaN(alt)
                      ? { altitude: alt }
                      : {}),
                  });
                }),
              );
            },
          }),
        );
        this.ensureFeaturesLayer(YMapDefaultFeaturesLayer);
        this.syncAllYMapMarkers(YMapMarker);
        super.ngAfterViewInit();
      });
  }

  /** Загружает скрипт Yandex Maps v3 и публикует `yandexMapsStatus$ = loaded`. */
  initYandexMaps() {
    MapComponent.yandexMapsStatus$.next('loading');
    loadScript(
      this.document,
      `https://api-maps.yandex.ru/v3/?apikey=${
        this.config.properties.apiKey
      }&lang=${this.getYandexMapsLang()}`,
    ).then(() => {
      ymaps3.strictMode = true;
      ymaps3.ready.then(() => {
        MapComponent.yandexMapsStatus$.next('loaded');
      });
    });
  }

  /** Программно обновляет center/zoom карты (команды с BFF). */
  private applyLocation() {
    if (
      !this.yMap ||
      !this.currentCenter ||
      typeof this.currentZoom !== 'number'
    ) {
      return;
    }
    this.yMap.update({
      location: {
        center: this.currentCenter,
        zoom: this.currentZoom,
      },
    });
  }

  /** Добавляет features layer один раз, когда появляются маркеры. */
  private ensureFeaturesLayer(
    YMapDefaultFeaturesLayer: new (opts: object) => unknown,
  ) {
    if (this.featuresLayerAdded || this.nestedItems().length === 0) {
      return;
    }
    this.yMap.addChild(new YMapDefaultFeaturesLayer({}));
    this.featuresLayerAdded = true;
  }

  /** Создаёт `YMapMarker` для всех nested-маркеров при первой инициализации карты. */
  private syncAllYMapMarkers(YMapMarker: new (...args: any[]) => any) {
    for (const marker of this.nestedItems()) {
      this.scheduleCreateYMapMarker(marker, YMapMarker);
    }
  }

  /**
   * Откладывает создание маркера до следующего render —
   * DOM host из `@for` должен уже существовать.
   */
  private scheduleCreateYMapMarker(
    markerConfig: SerializedMapMarker,
    YMapMarkerCtor?: new (...args: any[]) => any,
  ) {
    afterNextRender(
      () => {
        const YMapMarker = YMapMarkerCtor ?? ymaps3.YMapMarker;
        this.createYMapMarker(markerConfig, YMapMarker);
      },
      { injector: this.mapRenderInjector },
    );
  }

  /** Монтирует Angular-host маркера в `YMapMarker` и регистрирует в кэше. */
  private createYMapMarker(
    markerConfig: SerializedMapMarker,
    YMapMarker: new (...args: any[]) => any,
  ) {
    if (!this.yMap || this.yMapMarkers.has(markerConfig.id)) {
      return;
    }
    const markerElement = this.findMarkerHostElement(markerConfig.id);
    if (!markerElement) {
      return;
    }
    this.ensureFeaturesLayer(ymaps3.YMapDefaultFeaturesLayer);

    const { translateX, translateY } = this.markerAnchorTranslate(markerConfig);
    markerElement.classList.add('stack');
    markerElement.style.width = rem(markerConfig.width) || '';
    markerElement.style.transform = `translate(-${translateX}%, -${translateY}%)`;

    const marker = new YMapMarker(
      {
        coordinates: [
          markerConfig.coordinates.longitude,
          markerConfig.coordinates.latitude,
        ],
      },
      markerElement,
    );
    this.yMap.addChild(marker);
    this.yMapMarkers.set(markerConfig.id, marker);
  }

  /** Удаляет маркер с карты и из локального кэша по `id`. */
  private removeYMapMarker(markerId: string) {
    const marker = this.yMapMarkers.get(markerId);
    if (!marker || !this.yMap) {
      return;
    }
    this.yMap.removeChild(marker);
    this.yMapMarkers.delete(markerId);
  }

  /** Ищет DOM-контейнер маркера по `data-marker-id` в шаблоне. */
  private findMarkerHostElement(markerId: string): HTMLElement | undefined {
    return this.markerHosts().find(
      (host) => host.nativeElement.dataset['markerId'] === markerId,
    )?.nativeElement;
  }

  /** Проценты смещения `translate` для anchor start/center/end и top/middle/bottom. */
  private markerAnchorTranslate(markerConfig: SerializedMapMarker): {
    translateX: number;
    translateY: number;
  } {
    let translateX = 50;
    let translateY = 50;
    if (markerConfig.anchor?.horizontal === MapMarkerHorizontalAnchor.Start) {
      translateX = 0;
    } else if (
      markerConfig.anchor?.horizontal === MapMarkerHorizontalAnchor.End
    ) {
      translateX = 100;
    }
    if (markerConfig.anchor?.vertical === MapMarkerVerticalAnchor.Top) {
      translateY = 0;
    } else if (
      markerConfig.anchor?.vertical === MapMarkerVerticalAnchor.Bottom
    ) {
      translateY = 100;
    }
    return { translateX, translateY };
  }
}
