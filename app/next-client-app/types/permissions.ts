type Permission = "CanView" | "CanEdit" | "CanAdmin";

interface PermissionsResponse {
  permissions: Permission[];
}
