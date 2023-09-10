import Jsoning from "jsoning";
import getLocalizationJson, { setLocalization } from "../lib/localization/main";
import inquirer from "inquirer";
import { showMainMenu } from "./main";
import printWatermarkAndClear from "../lib/watermark";
import { setSettings } from "./setSettings";
import msToMinAndSec, { toTimeIfNumber } from "../lib/msToMin&Sec";

export default async function toSettings(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");
  const localizationSettings = await localization.get("settings");
  const changeWord = localizationSettings.change + " ";

  printWatermarkAndClear();

  await inquirer
    .prompt([
      {
        name: "settingsOptions",
        type: "list",
        message: localizationMenu.chooseOption,
        choices: [
          localizationSettings.seeCurrentSettings + " 🔍",
          changeWord + localizationSettings.localization.toLowerCase() + " ⚙️",
          changeWord + localizationSettings.localSettings.toLowerCase() + " 📂",
          changeWord +
            localizationSettings.chimuMoeSettings.toLowerCase() +
            " ❤️",
          localizationMenu.backToMenu + " ↩️",
        ],
      },
    ])
    .then(async (options) => {
      switch (options.settingsOptions.slice(0, -3)) {
        case localizationSettings.seeCurrentSettings:
          await showCurrentSettings(config);
          break;
        case changeWord + localizationSettings.localization.toLowerCase():
          await setLocalization(config);
          await toSettings(config);
          break;
        case changeWord + localizationSettings.localSettings.toLowerCase():
          await setSettings(config, "local");
          break;
        case changeWord + localizationSettings.chimuMoeSettings.toLowerCase():
          await setSettings(config, "chimu");
          break;
        case localizationMenu.backToMenu:
          showMainMenu(config);
          break;
      }
    });
}

async function showCurrentSettings(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationSettings = await localization.get("settings");
  const localizationMenu = await localization.get("menuOptions");

  printWatermarkAndClear();

  console.log(`⚙️   ${localizationSettings.currentSettings}:`);
  console.log(
    `- ${localizationSettings.localization}: ${
      config.get("localization") === "en" ? "English" : "Russian"
    }\n`
  );

  console.log(`📂  ${localizationSettings.localSettings}:`);
  console.log(
    `- ${localizationSettings.osuPath}: ${config.get("path") || "None"}`
  );
  console.log(`- ${localizationSettings.filters}:`);
  await showFilters(config, "local");

  console.log(`❤️   ${localizationSettings.chimuMoeSettings}:`);
  console.log(`- ${localizationSettings.filters}:`);
  await showFilters(config, "chimu");

  await inquirer
    .prompt([
      {
        name: "backToMenu",
        type: "confirm",
        message: localizationMenu.backToMenu + "?",
      },
    ])
    .then((options) => {
      if (options.backToMenu) {
        toSettings(config);
      } else {
        showCurrentSettings(config);
      }
    });
}

async function showFilters(config: Jsoning, name: "local" | "chimu") {
  const localization = await getLocalizationJson(config);
  const localizationFilter = await localization.get("filter");
  const localizationSettings = await localization.get("settings");

  const filters = config.get("filters");
  if (!filters) return console.log(localizationSettings.noFilters, "\n");
  const filter = filters[name];
  if (!filter) return console.log(localizationSettings.noFilters, "\n");

  if (filter.useFilter !== undefined)
    console.log(
      `${localizationFilter.filterState}: ${filter.useFilter ? "✅" : "❌"}`
    );
  if (filter.starRatingMin || filter.starRatingMax)
    console.log(
      `${localizationFilter.starRating}: ${filter.starRatingMin || "0"} — ${
        filter.starRatingMax || "∞"
      } ⭐`
    );
  if (filter.bpmMin || filter.bpmMax)
    console.log(
      `${localizationFilter.bpm}: ${filter.bpmMin || "0"} — ${
        filter.bpmMax || "∞"
      } BPM`
    );
  if (filter.lengthMin || filter.lengthMax)
    console.log(
      `${localizationFilter.length}: ${
        toTimeIfNumber(filter.lengthMin) || "0"
      } — ${toTimeIfNumber(filter.lengthMax) || "∞"} ⌛`
    );
  if (filter.genre) console.log(`${localizationFilter.genre}: ${filter.genre}`);

  console.log(); // New line
}
