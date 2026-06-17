// verify-board.ts — the CURRENT move's VERIFY board. ✎ EDIT THIS EACH MOVE (METHOD.md → "visual cues + a verify-prompt"):
// what must Antonio see on localhost to confirm THIS move worked? Keep every step glance-able. <VerifyHUD> renders it
// as a corner overlay on the test page (hide with ?hud=0). Updating this is part of closing the loop (the pinned rule).
export type VerifyStep = { label: string; color?: string; note?: string };

export const VERIFY: { move: string; url: string; steps: VerifyStep[]; ask?: string } = {
  move: "Dressing the house on /housetest — awaiting OK to import the whole package to /inspect",
  url: "/housetest  (garage: ?cx=30&cy=8&cz=-70&tx=18&ty=6&tz=-40 · door: ?cx=-3.5&cy=5&cz=-34&tx=-3.5&ty=4.5&tz=-21.5)",
  steps: [
    { label: "Stone veneer (CC0 Bricks078) on south walls to the eave; SIDING gables above; light-grey fascia/soffit" },
    { label: "2-car charcoal garage door (SE wall) + gable window above; single window (SW gable); mahogany front door + greige casing" },
    { label: "Lit with NoToneMapping = true light-tan color. ?flat=1 = raw albedo. ?tile=N = stone scale." },
  ],
  ask: "Approve the dressing? → import veneer + siding gables + grey trim + garage + windows + wood door into /inspect.",
};
