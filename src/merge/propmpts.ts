import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import inquirer from "inquirer";
import open from "open";

export async function openOsz(config: Jsoning, oszPath: string) {
  const localization = await getLocalizationJson(config);
  const localizationMerging = await localization.get("merging");

  await inquirer
    .prompt([
      {
        name: "backToMenu",
        type: "confirm",
        message: localizationMerging.openOsz + "?",
      },
    ])
    .then((options) => {
      if (options.backToMenu) {
        open(oszPath);
      }
    });
}
