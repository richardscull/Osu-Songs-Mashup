import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import inquirer from "inquirer";
import open from "open";
import fs from "fs";

export async function openOsz(config: Jsoning, oszPath: string) {
  const localization = await getLocalizationJson(config);
  const localizationMerging = await localization.get("merging");

  await inquirer
    .prompt([
      {
        name: "backToMenu",
        type: "confirm",
        message: localizationMerging.openOsz,
      },
    ])
    .then((options) => {
      if (options.backToMenu) {
        fs.copyFileSync(oszPath, `${oszPath}-exp.osz`);
        open(`${oszPath}-exp.osz`);
      }
    });
}
