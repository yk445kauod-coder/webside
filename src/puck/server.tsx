import { Button } from "./blocks/Button";
import { Card } from "./blocks/Card";
import { Grid } from "./blocks/Grid";
import { Hero } from "./blocks/Hero/server";
import { Heading } from "./blocks/Heading";
import { Flex } from "./blocks/Flex";
import { Logos } from "./blocks/Logos";
import { Stats } from "./blocks/Stats";
import { FeatureGrid } from "./blocks/FeatureGrid";
import { CTA } from "./blocks/CTA";
import { FAQ } from "./blocks/FAQ";
import { Steps } from "./blocks/Steps";
import { FeatureSplit } from "./blocks/FeatureSplit";
import { Bento } from "./blocks/Bento";
import { Text } from "./blocks/Text";
import { Space } from "./blocks/Space";
import { Menu, Contact, ImageBlock } from "./extra";
import { Theme } from "./theme";
import Root from "./root";
import { UserConfig } from "./types";

// We avoid the name config as next gets confused
const conf: UserConfig = {
  root: Root,
  categories: {
    introduction: {
      title: "Introduction",
      components: ["Hero"],
    },
    content: {
      title: "Content",
      components: [
        "FeatureGrid",
        "Card",
        "CTA",
        "FAQ",
        "Steps",
        "FeatureSplit",
        "Bento",
      ],
    },
    socialProof: {
      title: "Social Proof",
      components: ["Logos", "Stats"],
    },
    layout: {
      components: ["Grid", "Flex", "Space"],
    },
    typography: {
      components: ["Heading", "Text"],
    },
    interactive: {
      title: "Actions",
      components: ["Button"],
    },
    other: {
      title: "Other",
      components: ["Menu", "Contact", "Image", "Theme"],
    },
  },
  components: {
    Button,
    Card,
    Grid,
    Hero,
    Heading,
    Flex,
    Logos,
    Stats,
    FeatureGrid,
    CTA,
    FAQ,
    Steps,
    FeatureSplit,
    Bento,
    Text,
    Space,
    Menu,
    Contact,
    Image: ImageBlock,
    Theme,
  },
};

export default conf;
