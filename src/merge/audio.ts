import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import { Difficulty } from "../locally/types";
const MP3Cutter = require("mp3-cutter");

export async function MergeAudioAndExport(
  firstSong: Difficulty,
  secondSong: Difficulty,
  timecodes: { endOfFirstHalf: number; startOfSecondHalf: number },
  pathToExport: string
) {
  await MP3Cutter.cut({
    src: `${firstSong.path}/${firstSong.difficulty.general.audioFilename}`,
    target: "Temp/FirstPart.mp3",
    end: timecodes.endOfFirstHalf / 1000 + 1, // +1s to avoid unsync audio after fading
  });
  await MP3Cutter.cut({
    src: `${secondSong.path}/${secondSong.difficulty.general.audioFilename}`,
    target: "Temp/SecondPart.mp3",
    start: timecodes.startOfSecondHalf / 1000,
  });

  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  ffmpeg.setFfprobePath(ffprobe.path);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input("Temp/FirstPart.mp3")
      .input("Temp/SecondPart.mp3")
      .complexFilter([
        {
          filter: "acrossfade",
          options: {
            d: 1,
          },
        },
      ])
      .output(`Temp/${pathToExport}/merged.mp3`)
      .on("error", function (err) {
        console.log("An error occurred: " + err.message);
        reject(err);
      })
      .on("end", function () {
        resolve(undefined);
      })
      .run();
  });
}
