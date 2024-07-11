type Permission = "CanView" | "CanEdit" | "CanAdmin" | "IsAuthor";

interface PermissionsResponse {
  permissions: Permission[];
}
