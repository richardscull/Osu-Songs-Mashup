export default function msToMinAndSec(ms: number) {
  var minutes = Math.floor(ms / 60000);
  var seconds = Math.floor((ms % 60000) / 1000);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
