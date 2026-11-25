/**
 * JSON-совместимая форма Web IDL `ConstrainDOMString`.
 * @see https://www.w3.org/TR/mediacapture-streams/#dom-constraindomstring
 */
export type ConstrainDOMString =
  | string
  | string[]
  | {
      exact?: string | string[];
      ideal?: string | string[];
    };

/**
 * JSON-совместимая форма Web IDL `ConstrainBoolean`.
 */
export type ConstrainBoolean =
  | boolean
  | {
      exact?: boolean;
      ideal?: boolean;
    };

/**
 * JSON-совместимая форма Web IDL `ConstrainDouble` / `ConstrainULong`.
 */
export type ConstrainDouble =
  | number
  | {
      exact?: number;
      ideal?: number;
      min?: number;
      max?: number;
    };

export type ConstrainULong = ConstrainDouble;

/**
 * Structural `MediaTrackConstraints` для wire (без DOM-типов).
 * Неизвестные ключи допускаются — клиент пробрасывает в `getUserMedia` / `getDisplayMedia`.
 */
export type MediaTrackConstraints = {
  deviceId?: ConstrainDOMString;
  groupId?: ConstrainDOMString;
  aspectRatio?: ConstrainDouble;
  facingMode?: ConstrainDOMString;
  frameRate?: ConstrainDouble;
  height?: ConstrainULong;
  width?: ConstrainULong;
  resizeMode?: ConstrainDOMString;
  sampleRate?: ConstrainULong;
  sampleSize?: ConstrainULong;
  echoCancellation?: ConstrainBoolean;
  autoGainControl?: ConstrainBoolean;
  noiseSuppression?: ConstrainBoolean;
  latency?: ConstrainDouble;
  channelCount?: ConstrainULong;
  [constraint: string]:
    | ConstrainDOMString
    | ConstrainBoolean
    | ConstrainDouble
    | undefined;
};

/**
 * Structural `MediaStreamConstraints` для `navigator.mediaDevices.getUserMedia`.
 * @see https://www.w3.org/TR/mediacapture-streams/#dom-mediastreamconstraints
 */
export type MediaStreamConstraints = {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
  preferCurrentTab?: boolean;
};

/**
 * Structural options для `navigator.mediaDevices.getDisplayMedia`.
 * @see https://www.w3.org/TR/screen-capture/#dom-displaymediastreamoptions
 */
export type DisplayMediaStreamOptions = {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
};
