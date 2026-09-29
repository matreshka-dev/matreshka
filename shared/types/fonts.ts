export enum FontAssetFormat {
  Woff2 = "woff2",
  Woff = "woff",
  Truetype = "truetype",
}

export enum FontFaceStyle {
  Normal = "normal",
  Italic = "italic",
}

export type FontAsset =
  | {
      kind: "stylesheet";
      url: string;
    }
  | {
      kind: "file";
      url: string;
      format?: FontAssetFormat;
    };

export type FontFaceToken = {
  family: string;
  weight?: number | string;
  style?: FontFaceStyle;
  asset?: FontAsset;
};

export type FontStackToken = {
  entries: string[];
  fontWeight?: number | string;
  fontSize?: number;
  lineHeight?: number;
};

export type AppFontsConfig<
  Faces extends Record<string, FontFaceToken> = Record<string, FontFaceToken>,
  Stacks extends Record<string, FontStackToken> = Record<
    string,
    FontStackToken
  >,
> = {
  faces: Faces;
  stacks: {
    list: Stacks;
    default: string;
  };
};
