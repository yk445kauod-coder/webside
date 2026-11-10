import type { CSSProperties, HTMLAttributes } from "react";
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "webside-logo": HTMLAttributes<HTMLElement> & { mode?: string; slogan?: string; speed?: string; theme?: string; once?: boolean | string; loop?: boolean | string; fullscreen?: boolean | string; class?: string; style?: CSSProperties };
    }
  }
}
