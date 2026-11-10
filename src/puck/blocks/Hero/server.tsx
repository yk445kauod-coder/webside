import { ComponentConfig } from "@puckeditor/core";
import HeroComponent, { HeroProps } from "./Hero";
import { heroRenderFields } from "./render-fields";

export const Hero: ComponentConfig<HeroProps> = {
  fields: heroRenderFields as ComponentConfig<HeroProps>["fields"],
  render: HeroComponent,
};
