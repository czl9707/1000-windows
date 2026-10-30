import { Tooltip } from 'radix-ui';

export default function DemoHint() {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className="hint-button">
            demo pending
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="hint-tooltip" side="top" sideOffset={6}>
            Placeholder. The demo engine mounts into this canvas as the first milestone lands.
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
