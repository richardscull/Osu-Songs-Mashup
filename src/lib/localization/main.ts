import inquirer from "inquirer";
import Jsoning from "jsoning";
import printWatermarkAndClear from "../watermark";

export default async function getLocalizationJson(config: Jsoning) {
  const localization = await config.get("localization");

  return new Jsoning(`./localization/${localization}.json`);
}

export async function setLocalization(config: Jsoning) {
  printWatermarkAndClear();

  await inquirer
    .prompt([
      {
        name: "localization",
        type: "list",
        message: "Choose a localization",
        choices: ["English", "Russian"],
      },
    ])
    .then(async (options) => {
      switch (options.localization) {
        case "English":
          await config.set("localization", "en");
          break;
        case "Russian":
          await config.set("localization", "ru");
          break;
      }
    });
}
