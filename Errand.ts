type ErrandBase = { rowid: number; name: string };

export type RawErrand = ErrandBase & { type: string; data: string };
export type TaskErrand = ErrandBase & { type: "task" };
export type EventErrand = ErrandBase & { type: "event"; stamp: string };
export type Errand = TaskErrand | EventErrand;
