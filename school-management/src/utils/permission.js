export const getPermissions = () => {
  const permissions = localStorage.getItem("sms_permissions");

  if (!permissions) {
    return {};
  }

  try {
    return JSON.parse(permissions);
  } catch {
    return {};
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("sms_user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const isSuperAdmin = () => {
  const user = getCurrentUser();

  return Boolean(user?.is_super_admin);
};

export const can = (permissionCode, action = "view") => {
  if (isSuperAdmin()) {
    return true;
  }

  const permissions = getPermissions();

  return Boolean(permissions?.[permissionCode]?.[action]);
};

export const canAny = (items = []) => {
  return items.some((item) => can(item.permissionCode, item.action || "view"));
};


