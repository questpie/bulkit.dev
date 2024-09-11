import { existsSync } from "node:fs";
import path from "node:path";
import { PACKAGE_TEMPLATE } from "@questpie/script/boilerplates/package-boilerplate";
import { createTemplateFiles } from "@questpie/script/utils/boilerplate-parser";

type CreatePackageOptions = {
	name: string;
	type: "plugin" | "package";
};

export async function createPackage(opts: CreatePackageOptions) {
	const basePath = path.resolve(__dirname, "../../packages", opts.name);
	if (existsSync(basePath)) {
		throw new Error(
			`Path: ${basePath} is already occupied, please use different package name`,
		);
	}

	switch (opts.type) {
		case "package": {
			return createTemplateFiles(basePath, PACKAGE_TEMPLATE, (variable) =>
				variable === "name" ? opts.name : null,
			);
		}
		default: {
			throw new Error(`Unknown package type: ${opts.type}`);
		}
	}
}
