import Jsoning from "jsoning";
import getLocalizationJson from "./localization/main";
import printWatermarkAndClear from "./watermark";
import inquirer from "inquirer";
import { showMainMenu } from "../menu/main";

export default async function MethodNotAvailable(
  config: Jsoning,
  backToLocalMenu: Function
) {
  const localization = await getLocalizationJson(config);
  const localizationMenu = await localization.get("menuOptions");

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
        showMainMenu(config);
      } else {
        backToLocalMenu(config);
      }
    });
}
