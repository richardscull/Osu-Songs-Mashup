import Jsoning from "jsoning";
import getLocalizationJson, { setLocalization } from "../lib/localization/main";
import inquirer from "inquirer";
import { showMainMenu } from "./main";

export default async function settings(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");
  const localizationSettings = await localization.get("settings");

  console.log(); // Blank line

  inquirer
    .prompt([
      {
        name: "settingsOptions",
        type: "list",
        message: localizationMenu.chooseOption,
        choices: [
          localizationSettings.seeCurrentSettings,
          localizationSettings.changeLocalization,
          localizationSettings.changeLocalSettings,
          localizationSettings.changeChimuMoeSettings,
          localizationSettings.changeOsuApiSettings,
          localizationMenu.backToMenu,
        ],
      },
    ])
    .then(async (options) => {
      switch (options.settingsOptions) {
        case localizationSettings.seeCurrentSettings:
          console.log("\nUnsupported\n\n");
          settings(config);
          break;
        case localizationSettings.changeLocalization:
          await setLocalization(config);
          await settings(config);
          break;
        case localizationSettings.changeLocalSettings:
          console.log("\nUnsupported\n\n");
          settings(config);
          break;
        case localizationSettings.changeChimuMoeSettings:
          console.log("\nUnsupported\n\n");
          settings(config);
          break;
        case localizationSettings.getchangeOsuApiSettings:
          console.log("\nUnsupported\n\n");
          settings(config);
          break;
        case localizationMenu.backToMenu:
          showMainMenu(config);
          break;
      }
    });
}
