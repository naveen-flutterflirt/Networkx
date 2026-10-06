import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// Next.js's CSS ordering can load page styles before FontAwesome's
// auto-injected <style> tag, causing icons to render huge for a frame
// before shrinking ("icon flash"). Importing the CSS explicitly here
// (once, at the root layout) and disabling autoAddCss avoids that.
config.autoAddCss = false;
