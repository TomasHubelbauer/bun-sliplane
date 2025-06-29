// Remember to keep these in alphabetical order for easy skimming
import attachFile from "./attachFile.ts";
import calculateDatabaseSize from "./calculateDatabaseSize.ts";
import createDaily from "./createDaily.ts";
import createEventErrand from "./createEventErrand.ts";
import createItem from "./createItem.ts";
import createReminderErrand from "./createReminderErrand.ts";
import createTaskErrand from "./createTaskErrand.ts";
import deleteAttachment from "./deleteAttachment.ts";
import deleteDatabaseRow from "./deleteDatabaseRow.ts";
import deleteDatabaseRows from "./deleteDatabaseRows.ts";
import deleteDatabaseTable from "./deleteDatabaseTable.ts";
import deleteErrand from "./deleteErrand.ts";
import deleteItem from "./deleteItem.ts";
import deleteLink from "./deleteLink.ts";
import deleteMachineFile from "./deleteMachineFile.ts";
import deleteMachineFiles from "./deleteMachineFiles.ts";
import deleteVolumeFile from "./deleteVolumeFile.ts";
import deleteVolumeFiles from "./deleteVolumeFiles.ts";
import fetchLinkDetail from "./fetchLinkDetail.ts";
import fetchUrlMetadata from "./fetchUrlMetadata.ts";
import forceCheckLink from "./forceCheckLink.ts";
import getAudits from "./getAudits.ts";
import getDailies from "./getDailies.ts";
import getErrands from "./getErrands.ts";
import getDatabaseColumns from "./getDatabaseColumns.ts";
import getDatabaseRowCount from "./getDatabaseRowCount.ts";
import getDatabaseRows from "./getDatabaseRows.ts";
import getDatabaseTables from "./getDatabaseTables.ts";
import getItems from "./getItems.ts";
import getMachineFiles from "./getMachineFiles.ts";
import getMemoryStats from "./getMemoryStats.ts";
import getProcessUptime from "./getProcessUptime.ts";
import getStats from "./getStats.ts";
import getUserName from "./getUserName.ts";
import getVolumeFiles from "./getVolumeFiles.ts";
import listLinks from "./listLinks.ts";
import setDailyStamp from "./setDailyStamp.ts";
import setLinkMask from "./setLinkMask.ts";
import setLinkRunMaskNegative from "./setLinkRunMaskNegative.ts";
import setLinkRunMaskPositive from "./setLinkRunMaskPositive.ts";
import trackLink from "./trackLink.ts";
import updateDatabaseCell from "./updateDatabaseCell.ts";
import updateItem from "./updateItem.ts";

export default [
  attachFile,
  calculateDatabaseSize,
  createDaily,
  createEventErrand,
  createItem,
  createReminderErrand,
  createTaskErrand,
  deleteAttachment,
  deleteDatabaseRow,
  deleteDatabaseRows,
  deleteDatabaseTable,
  deleteErrand,
  deleteItem,
  deleteLink,
  deleteMachineFile,
  deleteMachineFiles,
  deleteVolumeFile,
  deleteVolumeFiles,
  fetchLinkDetail,
  fetchUrlMetadata,
  forceCheckLink,
  getAudits,
  getDailies,
  getErrands,
  getDatabaseColumns,
  getDatabaseRowCount,
  getDatabaseRows,
  getDatabaseTables,
  getItems,
  getMachineFiles,
  getMemoryStats,
  getProcessUptime,
  getStats,
  getUserName,
  getVolumeFiles,
  listLinks,
  setDailyStamp,
  setLinkMask,
  setLinkRunMaskNegative,
  setLinkRunMaskPositive,
  trackLink,
  updateDatabaseCell,
  updateItem,
] as const;
