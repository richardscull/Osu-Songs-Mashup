import getLocalizationJson from "../lib/localization/main";
import { showMainMenu } from "../menu/main";
import printWatermarkAndClear from "../lib/watermark";
import { getTwoComfortMaps } from "./getTwoComfortMaps";
import Jsoning from "jsoning";
import inquirer from "inquirer";
import {
  setUserSongsFolder,
  userChooseMap,
  userConfirmTwoRandomMaps,
} from "./prompts";
import fs from "fs";

// TODO list:
// - [x] Refactor code
// - [ ] Add support of filters
// - [x] Add support of user input
// - [x] Make search faster

export default async function main(config: Jsoning) {
  while (!config.get("path")) await setUserSongsFolder(config);

  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");
  const localizationMashup = await localization.get("mashupMethods")
    .localMashup;

  printWatermarkAndClear();

  console.log(localizationMashup.name);

  inquirer
    .prompt([
      {
        name: "option",
        type: "list",
        message: localizationMenu.chooseOption,
        choices: [
          localizationMenu.randomMashupFilters,
          localizationMenu.chooseMashupMaps,
          localizationMenu.backToMenu,
        ],
      },
    ])
    .then(async (options) => {
      switch (options.option) {
        case localizationMenu.randomMashupFilters:
          // Has soft filters for now, will add custom ones later
          getRandomMapsAndMerge(config);

          break;
        case localizationMenu.chooseMashupMaps:
          const firstMap = await userChooseMap(config, 1);
          if (!firstMap) break;
          const secondMap = await userChooseMap(config, 2);
          if (!secondMap) break;

          require("../merge/main").default(config, firstMap, secondMap);
          break;
        case localizationMenu.backToMenu:
          showMainMenu(config);
          break;
      }
    });
}

async function getRandomMapsAndMerge(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");

  const userMapFolder = config.get("path");
  const mapsPath = fs
    .readdirSync(userMapFolder)
    .filter((map) => {
      if (fs.lstatSync(`${userMapFolder}/${map}`).isDirectory()) {
        return true;
      } else {
        return false;
      }
    })
    .map((map) => {
      return `${userMapFolder}/${map}`;
    });

  const difficulties = await getTwoComfortMaps(mapsPath);

  if (difficulties.length === 0) {
    console.log(localizationMenu.couldNotFindMaps);
    return require("../lib/backToMenu").default(config, main);
  }

  // NOTE: Maybe should use this function for userChooseMap too?
  const maps = await userConfirmTwoRandomMaps(config, difficulties);
  if (maps.length == 0) return main(config);

  return require("../merge/main").default(config, maps[0], maps[1]);
}
