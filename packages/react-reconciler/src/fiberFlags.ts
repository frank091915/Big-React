export type FlagType = number;

export const noFlags = 0b0000000;
export const placement = 0b0000010;
export const update = 0b0000100;
export const childDeletion = 0b0001000;

export const MutationMask = placement | update | childDeletion;
