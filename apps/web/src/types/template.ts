/** A template resource as returned by the API. */
export interface Template {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isPublic: boolean;
  createdBy: string | null;
  useIndex: boolean;
  useGcCode: boolean;
  useDifficulty: boolean;
  useTerrain: boolean;
  useCoords: boolean;
  useHint: boolean;
  useSpoiler: boolean;
  customField1Label: string | null;
  customField2Label: string | null;
  createdAt: string;
}
