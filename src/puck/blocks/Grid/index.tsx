import React from "react";
import { ComponentConfig, Slot } from "@puckeditor/core";
import "./styles.css";
import { styles } from "@/puck/lib/styles";
import getClassNameFactory from "@/puck/lib/get-class-name-factory";
import { Section } from "../../components/Section";
import { WithLayout, withLayout } from "../../components/Layout";
import { FieldTabs } from "../../components/FieldTabs";

const getClassName = getClassNameFactory("Grid", styles);

export type GridProps = WithLayout<{
  numColumns: number;
  gap: number;
  items: Slot;
}>;

const CustomSlot = (props: any) => {
  return <span {...props} />;
};

export const GridInternal: ComponentConfig<GridProps> = {
  fields: {
    numColumns: {
      type: "number",
      label: "Number of columns",
      min: 1,
      max: 12,
    },
    gap: {
      label: "Gap",
      type: "number",
      min: 0,
    },
    items: {
      type: "slot",
      disallow: [
        "Hero",
        "Stats",
        "Logos",
        "FeatureGrid",
        "CTA",
        "FAQ",
        "Steps",
        "FeatureSplit",
        "Bento",
      ],
    },
  },
  renderFields: ({ fields }) => (
    <FieldTabs appearance={[fields.numColumns, fields.gap, fields.layout]} />
  ),
  defaultProps: {
    numColumns: 4,
    gap: 24,
    items: [],
  },
  render: ({ gap, numColumns, items: Items }) => {
    return (
      <Section>
        <Items
          as={CustomSlot}
          className={getClassName()}
          style={{
            gap,
            gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
          }}
        />
      </Section>
    );
  },
};

export const Grid = withLayout(GridInternal);
