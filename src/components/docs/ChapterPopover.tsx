import type React from "react";
import { Popover } from "radix-ui";

// Click-open chapter picker; the Astro page renders the trigger button and
// the panel rows through the label and content slots. Styling hooks are
// the Picker* classes in ChapterPicker.astro.
export default function ChapterPopover({
    label,
    content,
}: {
    label?: React.ReactNode;
    content?: React.ReactNode;
}) {
    return (
        <Popover.Root>
            <Popover.Trigger asChild className="PickerTrigger">
                <div>{label}</div>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="PickerPanel"
                    align="start"
                    sideOffset={6}
                >
                    <div>{content}</div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
