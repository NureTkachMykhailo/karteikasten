export const LEITNER_DAYS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
export const BOX_LABEL = {
  1: "täglich",
  2: "alle 2 Tage",
  3: "alle 4 Tage",
  4: "alle 8 Tage",
  5: "alle 16 Tage",
};
export const BOX_COLOR = {
  1: "bg-box1",
  2: "bg-box2",
  3: "bg-box3",
  4: "bg-box4",
  5: "bg-box5",
};
export const BOX_BORDER = {
  1: "border-box1",
  2: "border-box2",
  3: "border-box3",
  4: "border-box4",
  5: "border-box5",
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
