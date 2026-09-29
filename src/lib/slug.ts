/** "4º Año A" → "4-ano-a". Sirve para links de cursos y nombres de archivo. */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
