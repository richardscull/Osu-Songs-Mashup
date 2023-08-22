import { Difficulty } from "../locally/types";
import fs from "fs";
import sharp from "sharp";

export async function MergeBackgroundsAndExport(
  firstSong: Difficulty,
  secondSong: Difficulty,
  pathToExport: string
) {
  if (
    firstSong.difficulty.events.backgroundPath &&
    secondSong.difficulty.events.backgroundPath
  ) {
    const imageWidth = 1280;
    const imageHeight = 720;

    const resizedImage1 = await sharp(
      `${firstSong.path}/${firstSong.difficulty.events.backgroundPath}`
    )
      .resize(imageWidth / 2, imageHeight)
      .toBuffer();
    const resizedImage2 = await sharp(
      `${secondSong.path}/${secondSong.difficulty.events.backgroundPath}`
    )
      .resize(imageWidth / 2, imageHeight)
      .toBuffer();

    await sharp({
      create: {
        width: imageWidth,
        height: imageHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: resizedImage1, left: 0, top: 0 },
        { input: resizedImage2, left: imageWidth / 2, top: 0 },
      ])
      .toFile(`./Temp/${pathToExport}/merged.jpg`);
  } else if (
    firstSong.difficulty.events.backgroundPath &&
    !secondSong.difficulty.events.backgroundPath
  ) {
    fs.copyFileSync(
      `${firstSong.path}/${firstSong.difficulty.events.backgroundPath}`,
      `./Temp/${pathToExport}/merged.jpg`
    );
  } else if (
    !firstSong.difficulty.events.backgroundPath &&
    secondSong.difficulty.events.backgroundPath
  ) {
    fs.copyFileSync(
      `${secondSong.path}/${secondSong.difficulty.events.backgroundPath}`,
      `./Temp/${pathToExport}/merged.jpg`
    );
  }
}
