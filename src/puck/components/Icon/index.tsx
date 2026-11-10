import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  AlignLeft as I_AlignLeft,
  Feather as I_Feather,
  GitMerge as I_GitMerge,
  Globe as I_Globe,
  PenTool as I_PenTool,
  Plug as I_Plug,
  Activity as I_Activity,
  BadgeCheck as I_BadgeCheck,
  BookOpen as I_BookOpen,
  Briefcase as I_Briefcase,
  Building2 as I_Building2,
  ChartNoAxesColumnIncreasing as I_ChartNoAxesColumnIncreasing,
  CircleCheck as I_CircleCheck,
  Cloud as I_Cloud,
  Code as I_Code,
  Database as I_Database,
  Heart as I_Heart,
  Lightbulb as I_Lightbulb,
  Lock as I_Lock,
  Rocket as I_Rocket,
  ShieldCheck as I_ShieldCheck,
  Sparkles as I_Sparkles,
  Users as I_Users,
  Utensils as I_Utensils,
  Coffee as I_Coffee,
  Cake as I_Cake,
  Scissors as I_Scissors,
  Stethoscope as I_Stethoscope,
  Dumbbell as I_Dumbbell,
  ShoppingBag as I_ShoppingBag,
  Camera as I_Camera,
  Phone as I_Phone,
  MapPin as I_MapPin,
  Clock as I_Clock,
  Star as I_Star,
  Truck as I_Truck,
  Leaf as I_Leaf,
  Smile as I_Smile,
  Flame as I_Flame,
  Palette as I_Palette,
  Gift as I_Gift,
  Baby as I_Baby,
  Wifi as I_Wifi
} from "lucide-react";
import type { SelectField } from "@puckeditor/core";

// Static imports on purpose: published pages are rendered to plain HTML on the server,
// where lazily loaded (dynamic) icons would render nothing.
const iconComponents: Record<string, ComponentType<LucideProps>> = {
  "align-left": I_AlignLeft,
  "feather": I_Feather,
  "git-merge": I_GitMerge,
  "globe": I_Globe,
  "pen-tool": I_PenTool,
  "plug": I_Plug,
  "activity": I_Activity,
  "badge-check": I_BadgeCheck,
  "book-open": I_BookOpen,
  "briefcase": I_Briefcase,
  "building-2": I_Building2,
  "chart-no-axes-column-increasing": I_ChartNoAxesColumnIncreasing,
  "circle-check": I_CircleCheck,
  "cloud": I_Cloud,
  "code": I_Code,
  "database": I_Database,
  "heart": I_Heart,
  "lightbulb": I_Lightbulb,
  "lock": I_Lock,
  "rocket": I_Rocket,
  "shield-check": I_ShieldCheck,
  "sparkles": I_Sparkles,
  "users": I_Users,
  "utensils": I_Utensils,
  "coffee": I_Coffee,
  "cake": I_Cake,
  "scissors": I_Scissors,
  "stethoscope": I_Stethoscope,
  "dumbbell": I_Dumbbell,
  "shopping-bag": I_ShoppingBag,
  "camera": I_Camera,
  "phone": I_Phone,
  "map-pin": I_MapPin,
  "clock": I_Clock,
  "star": I_Star,
  "truck": I_Truck,
  "leaf": I_Leaf,
  "smile": I_Smile,
  "flame": I_Flame,
  "palette": I_Palette,
  "gift": I_Gift,
  "baby": I_Baby,
  "wifi": I_Wifi
};

export const iconNames = Object.keys(iconComponents);

/** Field for picking an icon */
export const iconField: SelectField = {
  type: "select",
  label: "Icon",
  options: iconNames.map((name) => ({ label: name, value: name })),
};

/** Renders an icon by name. Unknown names render nothing. */
export const Icon = ({ name, ...props }: LucideProps & { name?: string }) => {
  const IconComponent = name ? iconComponents[name] : undefined;
  return IconComponent ? <IconComponent aria-hidden {...props} /> : null;
};
