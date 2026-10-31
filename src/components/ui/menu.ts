/**
 * The look of a row's ••• menu (Base UI `Menu.Popup` and `Menu.Item`); the trigger is
 * `Button variant="ghost" size="icon-xs"`. Icons take the item's colour, so a destructive
 * item adds `text-destructive` and its icon follows.
 */
export const menuPopupClassName =
	'min-w-50 origin-(--transform-origin) rounded-xl bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0';

// Phones keep the 44px target, as Button does; from md the item is 36px
export const menuItemClassName =
	'flex h-11 w-full cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 text-body-4 outline-none data-highlighted:bg-foreground/5 md:h-9 [&_svg]:size-4 [&_svg]:shrink-0';
