import { TextOutputAutolinkScheme } from "../enums/text-output-autolink-scheme";
import { TextOutputAutolinkTarget } from "../enums/text-output-autolink-target";
import { TextOutputProcessor } from "../enums/text-output-processor";

export type TextOutputProcessorLineBreaksConfig = {
  processor: TextOutputProcessor.LineBreaks;
};

export type TextOutputProcessorAutolinkConfig = {
  processor: TextOutputProcessor.Autolink;
  target?: TextOutputAutolinkTarget;
  schemes?: TextOutputAutolinkScheme[];
};

export type TextOutputProcessorConfig =
  | TextOutputProcessorLineBreaksConfig
  | TextOutputProcessorAutolinkConfig;
