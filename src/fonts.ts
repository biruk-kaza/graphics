import { staticFile } from "remotion";

const WEIGHTS = [400, 700, 800, 900];
/** Loads the LOCAL Noto Sans Ethiopic files. Rejects (=> render fails loudly) if they are missing, instead of silently rendering tofu. */
export const loadEthiopicFonts = async () => {
  const faces = WEIGHTS.map(
    (w) => new FontFace("Noto Sans Ethiopic", `url(${staticFile(`fonts/NotoSansEthiopic-${w}.woff2`)}) format("woff2")`, { weight: String(w) })
  );
  const loaded = await Promise.all(faces.map((f) => f.load()));
  loaded.forEach((f) => document.fonts.add(f));
  await document.fonts.ready;
  // Glyph check: every Fidel used in the script must be present in the font.
  const probe = "ብዙዎችነገሮችንማወሳሰብያበዛሉእኛግንአቅጣጫውንእንቀይራለንጥርትያለቅርጽትክክለኛጊዜምንምትርፍየለምቃሉንስትናገሩስክሪኑይንቀሳቀሳልቀላልሀሳብትልቅውጤትአሁንተዘጋጅተናል።፣";
  if (!document.fonts.check('800 40px "Noto Sans Ethiopic"', probe)) throw new Error("Noto Sans Ethiopic does not cover the script glyphs");
};
