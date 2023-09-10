import printWatermarkAndClear from "../lib/watermark";
import Jsoning from "jsoning";
import inquirer from "inquirer";
import getLocalizationJson, { setLocalization } from "../lib/localization/main";
import { showLocallyExplanation } from "../locally/prompts";

export default (async () => {
  await printWatermarkAndClear(true);

  const config = new Jsoning("config.json");
  if (!config.get("localization")) await setLocalization(config); // Ask user to choose localization

  if (!config.get("filters"))
    config.set("filters", {
      local: {
        useFilter: false,
      },
      chimu: {
        useFilter: false,
      },
    });

  await showMainMenu(config);
})();

export async function showMainMenu(config: Jsoning) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = localization.get("menuOptions");
  const localizationMessages = localization.get("messages");

  printWatermarkAndClear();

  inquirer
    .prompt([
      {
        name: "menuOptions",
        type: "list",
        message: localizationMenu.chooseOption,
        choices: [
          localizationMenu.mashupLocally + " 📂",
          localizationMenu.mashupWithChimuMoe + " ❤️",
          localizationMenu.changeSettings + " ⚙️",
          localizationMenu.exit + " 🚪",
        ],
      },
    ])
    .then((options) => {
      switch (options.menuOptions.slice(0, -3)) {
        case localizationMenu.mashupLocally:
          showLocallyExplanation(config);
          break;
        case localizationMenu.mashupWithChimuMoe:
          require("../chimu!api/main").default(config);
          break;
        case localizationMenu.changeSettings:
          require("./settings").default(config);
          break;
        case localizationMenu.exit:
          console.log(localizationMessages.exitMessage);
          process.exit(0);
      }
    });
}
