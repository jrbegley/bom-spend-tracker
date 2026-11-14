export function MadeBoughtTag({ made }: { made: boolean }) {
  return <span className="ml-2 inline-block rounded-chip bg-group-row px-1.5 py-0.5 text-[11px] text-text-secondary">{made ? 'Made' : 'Bought'}</span>;
}
