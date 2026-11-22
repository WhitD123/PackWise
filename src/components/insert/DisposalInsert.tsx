import { BIN_TEXT, CHECK_LOCALLY_TEXT, type DisposalCard } from "@/lib/insert/disposalCard";

/**
 * The card a seller drops in the box. Sized like a 4 x 6 in postcard so it prints on one sheet and fits any carton.
 * Status is a word in a tag (filled for curbside, outlined for not), never colour alone and never a recycling symbol:
 * a chasing-arrows mark reads as a claim we cannot back for every town.
 */
export function DisposalInsert({ card, shopName }: { card: DisposalCard; shopName?: string }) {
  const shop = shopName?.trim();
  return (
    <article
      aria-label="Disposal insert"
      className="disposal-insert mx-auto w-full max-w-[6in] border-2 border-forest bg-paper p-5 text-ink sm:p-6"
    >
      <header className="border-b border-forest pb-3">
        <p className="font-serif text-2xl font-semibold leading-tight text-forest">What to do with this packaging</p>
        <p className="mt-1 text-sm">
          {shop ? `Thanks for ordering from ${shop}. ` : "Thanks for your order. "}
          {card.curbsideCount === card.lines.length
            ? "Every part of this package can go in a curbside recycling bin."
            : `${card.curbsideCount} of ${card.lines.length} parts can go in a curbside recycling bin.`}
        </p>
      </header>

      <ul className="divide-y divide-line">
        {card.lines.map((l) => (
          <li key={`${l.part}-${l.materialId}`} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <div>
              <p className="font-semibold leading-snug">{l.part}</p>
              <p className="text-xs text-muted">{l.materialName}</p>
            </div>
            <div>
              <span
                className={`inline-block rounded-sm border px-1.5 py-0.5 text-xs font-semibold ${
                  l.bin === "curbside" ? "border-forest bg-forest text-paper" : "border-ink text-ink"
                }`}
              >
                {BIN_TEXT[l.bin]}
              </span>
              <p className="mt-1 text-sm">{l.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="border-t border-forest pt-3 text-xs">{CHECK_LOCALLY_TEXT}</p>
    </article>
  );
}
