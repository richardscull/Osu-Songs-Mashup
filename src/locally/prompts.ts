import inquirer from "inquirer";
import Jsoning from "jsoning";
import fs from "fs";
import getLocalizationJson from "../lib/localization/main";
import { showMainMenu } from "../menu/main";

export async function showLocallyExplanation(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");
  const localizationMashup = await localization.get("mashupMethods")
    .localMashup;

  console.log(); // Blank line

  console.log(localizationMashup.name + "\n" + localizationMashup.description);

  inquirer
    .prompt([
      {
        name: "useThisMethod",
        type: "confirm",
        message: localizationMenu.areYouSureMethod,
      },
    ])
    .then((options) => {
      if (options.useThisMethod) {
        require("./main").default(config);
      } else {
        showMainMenu(config);
      }
    });
}

export async function setUserSongsFolder(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");

  console.log(); // Blank line

  await inquirer
    .prompt([
      {
        name: "Path",
        type: "input",
        message: localizationSettings.setOsuPath,
      },
    ])
    .then(async (path) => {
      if (!fs.existsSync(path.Path)) {
        console.log(localizationSettings.wrongPath);
      } else {
        await config.set("path", path.Path);
        console.log(localizationSettings.correctPath);
      }
    });
}
