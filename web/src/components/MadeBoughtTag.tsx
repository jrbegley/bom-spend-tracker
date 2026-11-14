export function MadeBoughtTag({ made }: { made: boolean }) {
  return <span className="ml-2 inline-block rounded-sm bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{made ? 'Made' : 'Bought'}</span>;
}
