export type BaseNote = {
  id: string;
  noteText: string;
  tags: string[];
};

export type TimestampedNote = BaseNote & {
  timestampSeconds: number;
};

export type GeneralNote = BaseNote;
