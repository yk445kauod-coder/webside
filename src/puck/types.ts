import { Config, Data } from "@puckeditor/core";
import { ButtonProps } from "./blocks/Button";
import { CardProps } from "./blocks/Card";
import { GridProps } from "./blocks/Grid";
import { HeroProps } from "./blocks/Hero";
import { HeadingProps } from "./blocks/Heading";
import { FlexProps } from "./blocks/Flex";
import { LogosProps } from "./blocks/Logos";
import { StatsProps } from "./blocks/Stats";
import { FeatureGridProps } from "./blocks/FeatureGrid";
import { CTAProps } from "./blocks/CTA";
import { FAQProps } from "./blocks/FAQ";
import { StepsProps } from "./blocks/Steps";
import { FeatureSplitProps } from "./blocks/FeatureSplit";
import { BentoProps } from "./blocks/Bento";
import { TextProps } from "./blocks/Text";
import { SpaceProps } from "./blocks/Space";

import { RootProps } from "./root";
import type { MenuProps, ContactProps } from "./extra";

export type { RootProps } from "./root";

export type Components = {
  Button: ButtonProps;
  Card: CardProps;
  Grid: GridProps;
  Hero: HeroProps;
  Heading: HeadingProps;
  Flex: FlexProps;
  Logos: LogosProps;
  Stats: StatsProps;
  FeatureGrid: FeatureGridProps;
  CTA: CTAProps;
  FAQ: FAQProps;
  Steps: StepsProps;
  FeatureSplit: FeatureSplitProps;
  Bento: BentoProps;
  Text: TextProps;
  Space: SpaceProps;
  Menu: MenuProps & { id: string };
  Contact: ContactProps & { id: string };
  Image: { id: string; src: string; alt: string; caption: string };
  Theme: { id: string; preset: string };
};

export type UserConfig = Config<{
  components: Components;
  root: RootProps;
  categories: [
    "layout",
    "typography",
    "interactive",
    "introduction",
    "content",
    "socialProof",
    "other"
  ];
  fields: {
    userField: {
      type: "userField";
      option: boolean;
    };
  };
}>;

export type UserData = Data<Components, RootProps>;
