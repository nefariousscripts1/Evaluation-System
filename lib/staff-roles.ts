export const STAFF_ROLE_VALUES = [
  "faculty",
  "chairperson",
  "dean",
  "director",
  "campus_director",
  "secretary",
] as const;

export type StaffRoleValue = (typeof STAFF_ROLE_VALUES)[number];

export const staffRoleOptions: Array<{ label: string; value: StaffRoleValue }> = [
  { label: "Faculty", value: "faculty" },
  { label: "Chairperson", value: "chairperson" },
  { label: "Dean", value: "dean" },
  { label: "Director", value: "director" },
  { label: "Campus Director", value: "campus_director" },
  { label: "Secretary", value: "secretary" },
];

const staffRoleLabelMap = new Map(
  staffRoleOptions.flatMap((option) => [
    [option.value, option.value],
    [option.label.toLowerCase(), option.value],
  ])
);

export function resolveStaffRoleSelection(value: string) {
  return staffRoleLabelMap.get(value.trim().toLowerCase()) ?? "";
}
