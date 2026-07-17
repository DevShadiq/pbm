export const buildMenuTree = (menus = []) => {
  const menuMap = {};
  const tree = [];

  menus.forEach((menu) => {
    menu.children = [];
    menuMap[menu.menu_id] = menu;
  });

  menus.forEach((menu) => {
    if (menu.parent_menu_id && menuMap[menu.parent_menu_id]) {
      menuMap[menu.parent_menu_id].children.push(menu);
    } else {
      tree.push(menu);
    }
  });

  return tree;
};