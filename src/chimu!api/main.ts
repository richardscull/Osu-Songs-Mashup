import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import inquirer from "inquirer";
import { showMainMenu } from "../menu/main";

export default async function main(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");
  const localizationMenu = await localization.get("menuOptions");

  console.log(localizationSettings.unsupported);

  return inquirer
    .prompt([
      {
        name: "backToMenu",
        type: "confirm",
        message: localizationMenu.backToMenu + "?",
      },
    ])
    .then((options) => {
      if (options.backToMenu) {
        return showMainMenu(config);
      } else {
        process.exit(0);
      }
    });
}
