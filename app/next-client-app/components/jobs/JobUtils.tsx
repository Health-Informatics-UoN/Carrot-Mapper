export const FindGeneralStatus = (jobsData: Job[]) => {
  let generalStatus = "NOT_STARTED";
  if (jobsData.length > 0) {
    if (
      jobsData?.some((job) => job.status && job.status.value === "IN_PROGRESS")
    ) {
      generalStatus = "IN_PROGRESS";
    } else if (
      jobsData?.some((job) => job.status && job.status.value === "FAILED")
    ) {
      generalStatus = "FAILED";
    } else if (
      jobsData?.every((job) => job.status && job.status.value === "COMPLETE")
    ) {
      generalStatus = "COMPLETE";
    }
  }
  return generalStatus;
};
