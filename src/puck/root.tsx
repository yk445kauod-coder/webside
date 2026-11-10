import type { DefaultRootProps, RootConfig } from "@puckeditor/core";
import getClassNameFactory from "@/puck/lib/get-class-name-factory";
import "./root.css";
import { styles } from "@/puck/lib/styles";

const getClassName = getClassNameFactory("Root", styles);

export type RootProps = DefaultRootProps;

export const Root: RootConfig<{ props: RootProps }> = {
  fields: { title: { type: "text", label: "Page title" } },
  defaultProps: { title: "My page" },
  render: ({ children }) => (
    <div className={getClassName()}>
      <div className={getClassName("body")}>{children}</div>
    </div>
  ),
};

export default Root;
