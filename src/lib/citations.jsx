export function sectionRoute(type, categorySlug) {
  if (type === "faq") {
    if (categorySlug === "ptsd-info") return "/ptsd-info";
    if (categorySlug === "second-circle") return "/second-circle-tools";
    return "/rights"; // rights or missing (safe fallback)
  }
  switch (type) {
    case "source": return "/sources";
    case "tool": return "/self-help";
    case "treatment_step": return "/treatment";
    default: return "/children"; // article, book, activity, story, video
  }
}
