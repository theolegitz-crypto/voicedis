export const PermissionBits = {
  MANAGE_SERVER: 1 << 0,
  MANAGE_CHANNELS: 1 << 1,
  MANAGE_MESSAGES: 1 << 2,
  INVITE_MEMBERS: 1 << 3,
  CONNECT_VOICE: 1 << 4,
  SEND_MESSAGES: 1 << 5,
} as const;

export const DefaultRolePermissions = {
  OWNER:
    PermissionBits.MANAGE_SERVER |
    PermissionBits.MANAGE_CHANNELS |
    PermissionBits.MANAGE_MESSAGES |
    PermissionBits.INVITE_MEMBERS |
    PermissionBits.CONNECT_VOICE |
    PermissionBits.SEND_MESSAGES,
  ADMIN:
    PermissionBits.MANAGE_CHANNELS |
    PermissionBits.MANAGE_MESSAGES |
    PermissionBits.INVITE_MEMBERS |
    PermissionBits.CONNECT_VOICE |
    PermissionBits.SEND_MESSAGES,
  MEMBER: PermissionBits.CONNECT_VOICE | PermissionBits.SEND_MESSAGES,
} as const;

