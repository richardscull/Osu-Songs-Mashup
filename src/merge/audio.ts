import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobe from "@ffprobe-installer/ffprobe";
import { Difficulty } from "../locally/types";
import fs from "fs";
const MP3Cutter = require("mp3-cutter");

export async function MergeAudioAndExport(
  firstSong: Difficulty,
  secondSong: Difficulty,
  timecodes: { endOfFirstHalf: number; startOfSecondHalf: number },
  pathToExport: string
) {
  await MP3Cutter.cut({
    src: `${firstSong.path}/${firstSong.difficulty.general.audioFilename}`,
    target: "Temp/firstPart.mp3",
    end: timecodes.endOfFirstHalf / 1000,
  });
  await MP3Cutter.cut({
    src: `${secondSong.path}/${secondSong.difficulty.general.audioFilename}`,
    target: "Temp/secondpart.mp3",
    start: timecodes.startOfSecondHalf / 1000,
  });

  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  ffmpeg.setFfprobePath(ffprobe.path);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input("Temp/firstPart.mp3")
      .input("Temp/secondpart.mp3")
      .mergeToFile(`./Temp/${pathToExport}/merged.mp3`, "./tmp")
      .on("error", function (err) {
        console.log("An error occurred: " + err.message);
        reject(err);
      })
      .on("end", function () {
        resolve(undefined);
      });
  });
}
