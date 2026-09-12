const tehranHour = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tehran",
  hour: "2-digit",
  hourCycle: "h23",
});

/** Fixed local schedule, independent of the visitor's timezone. */
export function isTehranNight(date: Date = new Date()): boolean {
  const hour = Number(tehranHour.format(date));
  return hour >= 20 || hour < 6;
}

export const COURTYARD_WIDTH = 1672;
export const COURTYARD_HEIGHT = 941;

/** Match the photograph's object-fit: cover, including its mobile crop. */
export function courtyardCover(width: number, height: number, positionX = 0.5) {
  const scale = Math.max(width / COURTYARD_WIDTH, height / COURTYARD_HEIGHT);
  return {
    width: COURTYARD_WIDTH * scale,
    height: COURTYARD_HEIGHT * scale,
    left: (width - COURTYARD_WIDTH * scale) * positionX,
    top: (height - COURTYARD_HEIGHT * scale) / 2,
    scale,
  };
}
