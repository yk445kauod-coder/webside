import React from "react";
import { ComponentConfig } from "@puckeditor/core";
import { AutoField, FieldLabel, RichTextMenu } from "@puckeditor/core";
import { Link2, Quote } from "lucide-react";
import HeroComponent, { HeroProps } from "./Hero";
import { heroRenderFields } from "./render-fields";
import {
  sectionBackdropField,
  sectionBackgroundField,
} from "../../components/Section";
import { sectionHeaderFields } from "../../components/SectionHeader";
import { FieldTabs } from "../../components/FieldTabs";
import { verticalPaddingField } from "../../components/Layout";

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    layout: {
      type: "select",
      label: "Style",
      options: [
        { label: "Split", value: "split" },
        { label: "Centered", value: "centered" },
        { label: "Cinematic", value: "cinematic" },
        { label: "Browser", value: "browser" },
      ],
    },
    eyebrow: sectionHeaderFields.eyebrow,
    title: {
      type: "text",
      label: "Title",
      contentEditable: true,
      placeholder: "Enter a title",
    },
    description: {
      ...heroRenderFields.description,
      label: "Description",
      contentEditable: true,
      options: {
        heading: false,
        textAlign: false,
      },
      renderMenu: ({ editor, editorState }) => {
        return (
          <RichTextMenu>
            <RichTextMenu.Group>
              <RichTextMenu.Bold />
              <RichTextMenu.Italic />
              <RichTextMenu.Underline />
            </RichTextMenu.Group>
            <RichTextMenu.Group>
              <RichTextMenu.ListSelect />
              <RichTextMenu.Control
                icon={<Quote />}
                title="Quote"
                active={editorState?.isBlockquote}
                onClick={() => {
                  editor?.chain().focus().toggleBlockquote().run();
                }}
              />
            </RichTextMenu.Group>
          </RichTextMenu>
        );
      },
    },
    buttons: sectionHeaderFields.buttons,
    image: {
      ...heroRenderFields.image,
      label: "Image",
      objectFields: {
        ...heroRenderFields.image.objectFields,
        source: {
          type: "custom",
          label: "Source",
          render: ({ value, field, name, onChange, readOnly }) => (
            <FieldLabel
              label={field.label || name}
              readOnly={readOnly}
              icon={<Link2 size="16" />}
            >
              <AutoField
                field={{ type: "text" }}
                value={value?.src}
                onChange={(src) => onChange({ ...value, src })}
                readOnly={readOnly}
              />
            </FieldLabel>
          ),
        },
        mode: {
          type: "radio",
          label: "Mode",
          options: [
            { label: "Image", value: "image" },
            { label: "Custom", value: "custom" },
          ],
        },
      },
    },
    background: {
      ...sectionBackgroundField,
    },
    backdrop: sectionBackdropField,
    padding: verticalPaddingField,
  },
  renderFields: ({ fields }) => (
    <FieldTabs
      content={[
        fields.eyebrow,
        fields.title,
        fields.description,
        fields.buttons,
        fields.image,
      ]}
      appearance={[fields.layout]}
      backgroundGroup={[fields.background, fields.backdrop]}
      layoutGroup={[fields.padding]}
    />
  ),
  defaultProps: {
    layout: "split",
    background: "default",
    backdrop: "none",
    padding: "160px",
    title: "",
    description: "<p>Description</p>",
    buttons: [{ label: "Learn more", href: "#" }],
    image: {
      source: {
        src: "https://images.unsplash.com/photo-1687204209659-3bded6aecd79?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80",
        alt: "Hero image",
      },
      mode: "image",
    },
  },
  resolveFields: async (data, { fields }) => ({
    ...fields,
    background:
      data.props.layout === "cinematic" ? undefined : fields.background,
    backdrop: data.props.layout === "cinematic" ? undefined : fields.backdrop,
  }),
  render: HeroComponent,
};
