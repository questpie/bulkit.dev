import fsPromise from "node:fs/promises";

export type BoilerPlateTemplate = {
  [path: string]: string | BoilerPlateTemplate;
};

export async function createTemplateFiles(
  basePath: string,
  boilerplate: BoilerPlateTemplate,
  replacerFn: (variable: string) => string | null
) {
  basePath = basePath.endsWith("/")
    ? basePath.substring(0, basePath.length - 1)
    : basePath;

  const paths = Object.keys(boilerplate);

  await fsPromise.mkdir(basePath, { recursive: true });

  for (const path of paths) {
    const templateItem = boilerplate[path];
    const fileName = `${basePath}/${path}`;
    if (typeof templateItem === "object") {
      await createTemplateFiles(fileName, templateItem, replacerFn);
      continue;
    }
    // TODO: add prettier
    await fsPromise.writeFile(
      fileName,
      replaceTemplate(templateItem, replacerFn)
    );
  }
}

export function replaceTemplate(
  template: string,
  replaceFn: (variable: string) => string | null
) {
  const matches = template.match(/{{(.*?)}}/g);
  let result = template;

  if (!matches) return result;

  matches.forEach((match) => {
    const key = match.replace(/{{(.*?)}}/, "$1");

    let value = replaceFn(key);

    if (!value) return;

    const regex = new RegExp("[{][{]" + key + "[}][}]", "g");
    const replaces = result.match(regex);

    if (!replaces) return;

    replaces.forEach((replace) => {
      result = result.replace(replace, value);
    });
  });

  return result;
}
