import Jsoning from "jsoning";
import getLocalizationJson from "../lib/localization/main";
import printWatermarkAndClear from "../lib/watermark";
import fs from "fs";
import inquirer from "inquirer";

// TODO:
// - [ ] Set filters for local and chimu.moe
// - [ ] Don't forget to inform that local filters has a lee-way.

export async function setSettings(config: Jsoning, name: "local" | "chimu") {
  const localization = await getLocalizationJson(config);
  const localizationSetSettings = await localization.get("setSettings");
  const localizationMenu = await localization.get("menuOptions");

  const InquirerChoices = [
    localizationSetSettings.changeFilters,
    localizationSetSettings.changeFilterState,
    localizationSetSettings.backToSettings,
  ];

  if (name === "local")
    InquirerChoices.unshift(localizationSetSettings.changeSongsPath);

  printWatermarkAndClear();

  await inquirer
    .prompt([
      {
        name: "settingsOptions",
        type: "list",
        message: localizationMenu.chooseOption,
        choices: InquirerChoices,
      },
    ])
    .then(async (options) => {
      switch (options.settingsOptions) {
        case localizationSetSettings.changeSongsPath:
          await setUserSongsFolder(config);
          await setSettings(config, name);
          break;
        case localizationSetSettings.changeFilters:
          console.log("Unsupported");
          break;
        case localizationSetSettings.changeFilterState:
          await changeFilterState(config, name);
          await setSettings(config, name);
          break;
        case localizationSetSettings.backToSettings:
          require("./settings").default(config);
          break;
      }
    });
}

async function changeFilterState(config: Jsoning, name: "local" | "chimu") {
  const localization = await getLocalizationJson(config);
  const localizationSetSettings = await localization.get("setSettings");
  const filters = config.get("filters") ? config.get("filters") : {};
  const filter = filters[name] ? filters[name] : {};

  printWatermarkAndClear();

  await inquirer
    .prompt([
      {
        name: "confirm",
        type: "confirm",
        message: localizationSetSettings.turnFiltersOn,
      },
    ])
    .then(async (options) => {
      if (options.confirm) {
        filter.useFilter = true;
      } else {
        filter.useFilter = false;
      }
      config.set("filters", {
        ...filters,
        [name]: filter,
      });
    });
}

export async function setUserSongsFolder(
  config: Jsoning,
  firstTime: boolean = true
) {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");
  const localizationSetSettings = await localization.get("setSettings");

  if (firstTime) printWatermarkAndClear();

  await inquirer
    .prompt([
      {
        name: "Path",
        type: "input",
        message: localizationSetSettings.setOsuPath,
      },
    ])
    .then(async (path) => {
      if (!fs.existsSync(path.Path)) {
        console.log(localizationSettings.wrongPath);
        await setUserSongsFolder(config, false);
      } else {
        await config.set("path", path.Path);
        console.log(localizationSettings.correctPath);
      }
    });
}
