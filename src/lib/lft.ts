/** Looking for Team role names. Shared by the server-rendered board and the client listing form. */
const ROLE_LABEL: Record<string, string> = {
  duelist: 'Duelist',
  initiator: 'Initiator',
  controller: 'Controller',
  sentinel: 'Sentinel',
  flex: 'Flex',
  igl: 'IGL',
  'clash-lane': 'Clash lane',
  jungle: 'Jungle',
  'mid-lane': 'Mid lane',
  'farm-lane': 'Farm lane',
  roam: 'Roam',
}
export const roleLabel = (r: string) => ROLE_LABEL[r] ?? r
