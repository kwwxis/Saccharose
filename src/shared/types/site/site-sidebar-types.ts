

export type SiteSidebar = {
  id: string,
  header: {
    icon?: string,
    iconExtraStyle?: string,
    name: string,
  },
  sections: SideSidebarSection[],
}

export type SideSidebarSection = {
  id: string,
  name: string,
  content?: SideSidebarContent[],
}

export type SideSidebarContent = {
  id: string,
  name?: string,
  items: SideSidebarItem[],
}

export type SideSidebarItem = {
  id: string,
  name: string,
  link: string,
  bodyClass?: string,
  beta?: boolean,
  rightSideButton?: {
    name: string,
    link: string,
  }
}
