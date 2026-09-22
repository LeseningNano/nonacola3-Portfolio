"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

const Menu = MenuPrimitive.Root;

function MenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="menu-trigger"
      className={cn("focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50", className)}
      {...props}
    />
  );
}

function MenuContent({ className, ...props }: MenuPrimitive.Popup.Props) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner sideOffset={6} align="end" className="z-50">
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn("min-w-40 rounded-lg bg-neutral-900 p-1 text-white shadow-xl ring-1 ring-white/10 outline-none", className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

const menuItemClassName = "flex w-full cursor-default items-center rounded-md px-2.5 py-2 text-left text-sm text-neutral-200 outline-none data-[highlighted]:bg-white/10 data-[highlighted]:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

function MenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return <MenuPrimitive.Item data-slot="menu-item" className={cn(menuItemClassName, className)} {...props} />;
}

function MenuLinkItem({ className, ...props }: MenuPrimitive.LinkItem.Props) {
  return <MenuPrimitive.LinkItem data-slot="menu-link-item" className={cn(menuItemClassName, className)} {...props} />;
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return <MenuPrimitive.Separator data-slot="menu-separator" className={cn("-mx-1 my-1 h-px bg-white/10", className)} {...props} />;
}

export { Menu, MenuContent, MenuItem, MenuLinkItem, MenuSeparator, MenuTrigger };
