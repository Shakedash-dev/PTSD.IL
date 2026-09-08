import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge only knows Tailwind's stock scales. This project adds its own
// border radii and shadows in tailwind.config.js, and without registering them
// here twMerge does not recognise `rounded-super` as conflicting with the
// `rounded-md` in Button's base classes - so both survived into the class list
// and which one applied came down to CSS source order rather than intent.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["super", "super-sm"] }],
      "shadow": [{ shadow: ["atmospheric", "atmospheric-md", "atmospheric-lg", "card", "card-hover"] }],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;
