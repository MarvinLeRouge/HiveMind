/** Valid values for a template field mode. */
export type FieldMode = 'disabled' | 'optional' | 'required';

/** A template resource as returned by the API. */
export interface Template {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isPublic: boolean;
  createdBy: string | null;
  indexMode: FieldMode;
  gcCodeMode: FieldMode;
  difficultyMode: FieldMode;
  terrainMode: FieldMode;
  coordsMode: FieldMode;
  hintMode: FieldMode;
  spoilerMode: FieldMode;
  customField1Label: string | null;
  customField1Mode: FieldMode;
  customField2Label: string | null;
  customField2Mode: FieldMode;
  createdAt: string;
}
